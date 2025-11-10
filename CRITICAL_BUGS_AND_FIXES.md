# Critical Bugs & Systematic Fixes - Session 27 Discovery

**Date:** 2025-11-10
**Discovered During:** Real user testing (Francisco's resume generation)
**Status:** 🔴 BLOCKS PRODUCTION QUALITY

---

## 🐛 CRITICAL BUG #1: Resume Content Lost Between Upload and Generation

### **Severity:** CRITICAL - Users' uploaded resumes are completely ignored
### **Impact:** Generated resumes are fabricated fiction instead of user's real experience

### **Symptoms:**
- User uploads CV with 11,220 characters of real experience
- System generates resume with "John Doe" and invented warehouse work
- 0% accuracy - completely wrong content

### **Root Cause:**
Uploaded resume stored in **volatile in-memory Map** that gets cleared:
- Cloud Run scales to zero → memory lost
- Different container handles generation request → Map doesn't exist
- Server restart → all data gone

**Code:** `api/routes/conversation.js` line 10
```javascript
const jdSessions = new Map(); // VOLATILE! Lost on restart/scale
```

### **Data Flow (Current - BROKEN):**
```
1. Upload → Extract 11,220 chars ✅
2. Frontend sends to /conversation/start ✅
3. Backend: jdSessions.set(sessionId, { existingResume: "..." }) ⚠️
4. User answers 5 questions ✅
5. /resume/generate runs (possibly on different container) ❌
6. jdSessions.get(sessionId) → undefined ❌
7. Prompt says "No resume provided" → Gemini invents content ❌
```

### **Fix Strategy:**

#### Step 1: Database Schema Migration
```sql
-- Add columns to conversations table
ALTER TABLE conversations
ADD COLUMN existing_resume TEXT,
ADD COLUMN gap_analysis JSONB,
ADD COLUMN uploaded_files JSONB; -- Track original filenames

-- Add index for faster lookups
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
```

#### Step 2: Update Conversation Start Endpoint
**File:** `api/routes/conversation.js`

**Current (BROKEN):**
```javascript
// Line ~120
jdSessions.set(sessionId, {
  jobDescription: jd,
  analysis: analysisData,
  existingResume: resume  // LOST!
});
```

**Fixed:**
```javascript
// Save to database instead
await prisma.conversation.update({
  where: { sessionId },
  data: {
    existingResume: resume,
    gapAnalysis: analysisData.resumeGapAnalysis,
    uploadedFiles: req.body.uploadedFiles || []
  }
});
```

#### Step 3: Update Resume Generation Endpoint
**File:** `api/routes/resume.js` lines 219-233

**Current (BROKEN):**
```javascript
const conversationModule = require('./conversation');
const jdSession = conversationModule.jdSessions?.get(sessionId); // undefined!
```

**Fixed:**
```javascript
// Load from database
const conversation = await prisma.conversation.findFirst({
  where: {
    userId: userRecord.id,
    sessionId
  },
  select: {
    existingResume: true,
    gapAnalysis: true,
    jobDescription: true // Also needed for prompt
  }
});

existingResumeFromSession = conversation?.existingResume;
gapAnalysis = conversation?.gapAnalysis;
```

#### Step 4: Update Prisma Schema
**File:** `api/prisma/schema.prisma`

```prisma
model Conversation {
  id               Int       @id @default(autoincrement())
  userId           Int
  sessionId        String    @unique
  messages         Json      // Existing - JSONB array
  status           String?   @default("active")
  completedAt      DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // NEW COLUMNS for resume-first mode
  existingResume   String?   @db.Text    // Uploaded CV content
  gapAnalysis      Json?                 // Gap analysis results
  uploadedFiles    Json?                 // Original filenames
  jobDescription   String?   @db.Text    // Store JD for resume generation

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([userId, createdAt])
}
```

### **Testing Plan:**
1. Upload CV with real content
2. Start conversation (verify DB save)
3. Check database: `SELECT existing_resume FROM conversations WHERE session_id = '...'`
4. Answer questions
5. Generate resume
6. Verify generated resume contains CV content (not fabricated)

---

## 🐛 CRITICAL BUG #2: PDF Generation Returns 500 Errors

### **Severity:** HIGH - All PDF downloads fail completely
### **Impact:** Users cannot download resumes in PDF format

### **Symptoms:**
```
GET /api/resume/:id/pdf?template=classic → 500 Internal Server Error
GET /api/resume/:id/pdf?template=modern  → 500 Internal Server Error
GET /api/resume/:id/pdf?template=minimal → 500 Internal Server Error
```

### **Root Cause:**
Puppeteer/Chromium not installed or misconfigured in Cloud Run Docker container

**Code:** `api/services/pdfGenerator.js` lines 33-46
```javascript
this.browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
// ^ This fails because Chrome isn't installed!
```

### **Fix Strategy:**

#### Step 1: Update Dockerfile
**File:** `api/Dockerfile`

**Add Chromium installation:**
```dockerfile
FROM node:20-slim

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
```

#### Step 2: Update pdfGenerator to Use System Chrome
**File:** `api/services/pdfGenerator.js`

```javascript
async initBrowser() {
  if (!this.browser) {
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-zygote'
      ]
    });
  }
  return this.browser;
}
```

#### Step 3: Increase Cloud Run Memory
PDF generation is memory-intensive. Update deployment:

```bash
gcloud run deploy cvstomize-api \
  --memory 1Gi \  # Increase from 512Mi to 1Gi
  --timeout 60s \
  ...
```

### **Testing Plan:**
1. Deploy updated Dockerfile
2. Test: `curl -H "Authorization: Bearer $TOKEN" https://cvstomize-api-.../api/resume/{id}/pdf?template=classic`
3. Should return PDF binary (not 500 error)
4. Test all 3 templates

---

## 🎯 STRATEGIC ISSUE #3: Incomplete Personality Profile System

### **Severity:** MEDIUM - System works but misses its potential
### **Impact:** Personality profiles shallow, not truly personalized

### **Current State:**
- ✅ Big 5 inference works (from 5 JD-specific Q&A)
- ✅ Personality stored in database
- ⚠️ Profile based ONLY on job-specific answers
- ⚠️ No deep personal stories, passions, unique skills
- ⚠️ Profile gets overwritten each resume (not reused)

### **The Vision (Correct Approach):**

#### Profile-First for New Users
**When user signs up:**
1. Check if `personality_traits` exists for user
2. If NO profile → Redirect to **Profile Builder** (not resume creation)
3. Ask 10-15 deep questions:
   - "Tell me a story about overcoming a major challenge"
   - "What are you passionate about outside of work?"
   - "Describe a time you taught yourself a new skill"
   - "What's your proudest accomplishment (work or personal)?"
   - "What do people come to you for help with?"
   - "What's a 'silly' skill you have that few people know about?"
   - "How do you recharge when stressed?"
   - "Describe your ideal work environment"
   - "What motivates you more: solving problems or helping people?"
   - "Tell me about a time you led a project or initiative"

4. Gemini analyzes → Creates **rich profile**:
   ```json
   {
     "big5": { "openness": 78, "conscientiousness": 85, ... },
     "workStyle": "methodical problem-solver",
     "motivations": ["helping others", "continuous learning"],
     "strengths": ["teaching", "troubleshooting", "patience"],
     "communication": "clear and direct",
     "personalStories": ["...3-4 key stories..."],
     "uniqueSkills": ["speaks 3 languages", "built a PC from scratch"],
     "passions": ["sustainability", "mentoring"],
     "careerGoals": "transition to tech support leadership",
     "confidenceLevel": 92, // How confident AI is in profile
     "createdAt": "2025-11-10",
     "lastUpdated": "2025-11-10"
   }
   ```

5. Profile saved, user proceeds to resume creation

#### Resume Generation Uses Profile
**Every resume generation:**
1. Load personality profile from database
2. Check if profile is stale (>6 months old)
3. If stale → Offer to update profile (2-3 new questions)
4. Use profile to:
   - Frame achievements in user's natural style
   - Choose action verbs matching personality
   - Highlight strengths relevant to JD
   - Weave in unique skills where relevant
   - Match tone to communication style

**Example:**
- User passionate about sustainability + applying to Savers (secondhand reuse) → Resume emphasizes environmental impact
- User has "taught myself Excel" + JD needs data entry → Mentions self-learning capability
- User speaks Spanish + Rochester has Hispanic community → Language skills highlighted

### **Implementation Plan:**

#### Phase 1: Database Schema (IMMEDIATE)
```sql
-- Update personality_traits table
ALTER TABLE personality_traits
ADD COLUMN personal_stories JSONB,        -- 3-5 key stories
ADD COLUMN unique_skills TEXT[],          -- Array of special skills
ADD COLUMN passions TEXT[],               -- What they care about
ADD COLUMN motivations TEXT[],            -- What drives them
ADD COLUMN career_goals TEXT,             -- Long-term aspirations
ADD COLUMN confidence_level INTEGER,      -- 0-100 AI confidence
ADD COLUMN profile_version INTEGER DEFAULT 1,  -- Track updates
ADD COLUMN last_reviewed_at TIMESTAMP,    -- When user last reviewed
ADD COLUMN is_complete BOOLEAN DEFAULT false; -- Full profile vs partial
```

#### Phase 2: Profile Builder Flow (Session 29)
1. Create `ProfileBuilderWizard.js` component
2. Create `/api/profile/build` endpoint
3. Design 10-15 deep questions
4. Create Gemini prompt for rich profile analysis
5. Add profile completeness check on login
6. Redirect new users to profile builder

#### Phase 3: Resume Generation Enhancement (Session 29)
1. Load full profile (not just Big 5)
2. Update resume prompt to use:
   - Personal stories
   - Unique skills
   - Passions (match to company mission)
   - Career goals (show trajectory)
3. Add "profile staleness" warning (>6 months)

#### Phase 4: Profile Management (Session 30)
1. Add `/profile` page where users can:
   - View their profile
   - Update specific sections
   - Add new stories/skills
   - See how profile influences resumes
2. Profile versioning (track changes over time)

### **User Flow (Proposed):**

```
NEW USER SIGNUP
    ↓
Check: personality_traits.is_complete?
    ↓
NO → PROFILE BUILDER (10-15 questions, 15-20 min)
    ↓
Create rich profile → Save to DB
    ↓
"✅ Profile Complete! Let's create your first resume"
    ↓
RESUME CREATION FLOW
    ↓
Upload existing resume (optional)
    ↓
Paste JD
    ↓
Gap analysis (2-5 questions about THIS job)
    ↓
Generate resume using:
  - Uploaded resume content
  - Profile (personality, stories, skills)
  - Gap questions (job-specific)
    ↓
Download resume ✅

---

RETURNING USER
    ↓
Check: personality_traits.is_complete?
    ↓
YES → Check last_reviewed_at
    ↓
IF > 6 months old → "Update your profile? (2-3 quick questions)"
    ↓
SKIP PROFILE BUILDER → Straight to resume creation
```

---

## 📊 SYSTEMATIC FIX PRIORITY

### Session 28 (CRITICAL - Must Fix)
1. ✅ Document bugs in ROADMAP
2. 🔴 Fix Bug #1: Database persistence (resume content loss)
   - Schema migration
   - Update conversation.js
   - Update resume.js
   - Test end-to-end
3. 🔴 Fix Bug #2: PDF generation
   - Update Dockerfile
   - Update pdfGenerator.js
   - Deploy and test

### Session 29 (HIGH - Strategic Value)
4. 🟠 Implement Profile Builder
   - Design questions
   - Create frontend component
   - Create backend endpoint
   - Gemini prompt for rich profiles
5. 🟠 Enhance Resume Generation with Full Profile
   - Update prompt
   - Test quality improvement

### Session 30 (MEDIUM - UX Polish)
6. 🟡 Profile Management Page
7. 🟡 Profile staleness warnings
8. 🟡 A/B test profile-first vs current flow

---

## 🎯 SUCCESS METRICS (After Fixes)

### Bug #1 Fixed:
- [ ] Generated resume contains user's real name
- [ ] Generated resume has user's actual work history
- [ ] ATS match score: 85-95% (vs current ~60%)
- [ ] User feedback: "This is actually MY resume!"

### Bug #2 Fixed:
- [ ] All 3 PDF templates download successfully
- [ ] PDF generation time: <5 seconds
- [ ] No 500 errors in logs

### Profile System Enhanced:
- [ ] New users complete profile builder (>80% completion rate)
- [ ] Profile data used in >90% of resume generations
- [ ] User satisfaction: "Resume feels personal" (4.5+/5)
- [ ] Unique skills/passions mentioned in resumes
- [ ] Resume quality scores improve by 25%

---

## 📝 NEXT STEPS

**Immediate (Now):**
1. Review this document
2. Approve fix strategy
3. Update ROADMAP.md with Session 28 priorities

**Session 28 (Next):**
1. Apply database migration
2. Fix resume content persistence
3. Fix PDF generation
4. Test Francisco's resume again (should be perfect!)

**Session 29:**
1. Design profile builder questions
2. Implement profile-first flow
3. Test profile influence on resume quality
