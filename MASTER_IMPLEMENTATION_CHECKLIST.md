# Master Implementation Checklist - Context Preservation
**Purpose:** Ensure zero context loss between sessions
**Last Updated:** 2025-11-10 (Session 27)
**Status:** Ready for systematic implementation

---

## 🎯 THE BIG PICTURE (30 Second Recap)

**What We're Building:**
A resume platform that TRULY knows each user through:
1. Deep personality profiles (12 conversational questions, ONE TIME)
2. 8-12 personal stories (indexed, searchable via RAG)
3. Story retrieval for each resume/cover letter (semantic search)
4. Authentic personalization (sounds like them, not AI)

**Why This Matters:**
- Competitive moat (high switching cost, premium justification)
- Better resumes (real stories vs generic bullets)
- Cover letter capability (mission alignment)
- User lock-in (20min profile creation)

**Current Status:**
- ❌ Bugs blocking production quality (resume content lost, PDFs fail)
- ✅ Complete design documents created
- ✅ Systematic fix plan ready
- ⏳ Ready to implement (Sessions 28-33)

---

## 📋 SESSION-BY-SESSION IMPLEMENTATION PLAN

### **SESSION 28: CRITICAL BUG FIXES** (Must Complete First)

**Goal:** Fix production-blocking bugs discovered in Session 27
**Time Estimate:** 3-4 hours
**Blocker Status:** 🔴 CRITICAL - Nothing else matters until this is done

#### **Task 1: Fix Resume Content Persistence**

**Files to Modify:**
1. `api/prisma/schema.prisma`
2. `api/routes/conversation.js`
3. `api/routes/resume.js`

**Step-by-Step Checklist:**

- [ ] **Step 1.1:** Database Schema Migration
  ```sql
  -- Run via Cloud SQL or local
  ALTER TABLE conversations
  ADD COLUMN existing_resume TEXT,
  ADD COLUMN gap_analysis JSONB,
  ADD COLUMN job_description TEXT;

  CREATE INDEX idx_conversations_session_id ON conversations(session_id);
  ```
  **How to verify:** `\d conversations` shows new columns

- [ ] **Step 1.2:** Update Prisma Schema
  ```prisma
  // File: api/prisma/schema.prisma
  model Conversation {
    // ... existing fields ...
    existingResume   String?   @db.Text
    gapAnalysis      Json?
    jobDescription   String?   @db.Text
  }
  ```
  **Command:** `npx prisma generate`
  **How to verify:** No TypeScript errors

- [ ] **Step 1.3:** Update Conversation Start Endpoint
  **File:** `api/routes/conversation.js` (around line 120)

  **Find this code:**
  ```javascript
  jdSessions.set(sessionId, {
    jobDescription: jd,
    analysis: analysisData,
    existingResume: resume
  });
  ```

  **Replace with:**
  ```javascript
  // Save to database instead of volatile Map
  await prisma.conversation.update({
    where: { sessionId },
    data: {
      existingResume: resume,
      gapAnalysis: analysisData.resumeGapAnalysis,
      jobDescription: jd
    }
  });
  ```
  **How to verify:** Check database after conversation start

- [ ] **Step 1.4:** Update Resume Generation Endpoint
  **File:** `api/routes/resume.js` (lines 219-233)

  **Find this code:**
  ```javascript
  const conversationModule = require('./conversation');
  const jdSession = conversationModule.jdSessions?.get(sessionId);
  ```

  **Replace with:**
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
      jobDescription: true
    }
  });

  existingResumeFromSession = conversation?.existingResume;
  gapAnalysis = conversation?.gapAnalysis;
  ```
  **How to verify:** console.log shows resume content loaded

- [ ] **Step 1.5:** Test End-to-End
  - [ ] Upload CV files (check extraction works)
  - [ ] Start conversation (check DB has existing_resume column populated)
  - [ ] Query DB: `SELECT existing_resume FROM conversations WHERE session_id = '...'`
  - [ ] Answer 5 questions
  - [ ] Generate resume
  - [ ] **Verify:** Resume contains real name, real experience (not "John Doe")
  - [ ] **Expected ATS Score:** 85-95% (vs current ~60%)

**Success Criteria:**
- ✅ Francisco's name appears in resume
- ✅ Real work history from uploaded CVs
- ✅ ATS score 85%+
- ✅ User reaction: "This is MY resume!"

**Reference Docs:**
- [CRITICAL_BUGS_AND_FIXES.md](CRITICAL_BUGS_AND_FIXES.md) lines 22-150
- [RESUME_GENERATION_FLOW_EXPLAINED.md](RESUME_GENERATION_FLOW_EXPLAINED.md)

---

#### **Task 2: Fix PDF Generation**

**Files to Modify:**
1. `api/Dockerfile`
2. `api/services/pdfGenerator.js`
3. Cloud Run deployment config

**Step-by-Step Checklist:**

- [ ] **Step 2.1:** Update Dockerfile
  **File:** `api/Dockerfile`

  **Add BEFORE `WORKDIR /app`:**
  ```dockerfile
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
  ```

- [ ] **Step 2.2:** Update pdfGenerator.js
  **File:** `api/services/pdfGenerator.js`

  **Find `initBrowser()` method (around line 33):**
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

- [ ] **Step 2.3:** Deploy to Cloud Run
  ```bash
  cd api
  gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api:session28-pdf-fix

  gcloud run deploy cvstomize-api \
    --image gcr.io/cvstomize/cvstomize-api:session28-pdf-fix \
    --region us-central1 \
    --platform managed \
    --memory 1Gi \
    --timeout 60s \
    --project cvstomize

  # IMPORTANT: Route traffic!
  gcloud run services update-traffic cvstomize-api \
    --to-revisions=LATEST=100 \
    --region us-central1 \
    --project cvstomize
  ```

- [ ] **Step 2.4:** Test PDF Generation
  ```bash
  # Get auth token
  TOKEN=$(firebase auth:export users.json && jq -r '.[0].uid' users.json)

  # Test all 3 templates
  curl -H "Authorization: Bearer $TOKEN" \
    "https://cvstomize-api-.../api/resume/{id}/pdf?template=classic" \
    -o test_classic.pdf

  curl -H "Authorization: Bearer $TOKEN" \
    "https://cvstomize-api-.../api/resume/{id}/pdf?template=modern" \
    -o test_modern.pdf

  curl -H "Authorization: Bearer $TOKEN" \
    "https://cvstomize-api-.../api/resume/{id}/pdf?template=minimal" \
    -o test_minimal.pdf

  # Verify PDFs open correctly
  open test_*.pdf
  ```

**Success Criteria:**
- ✅ HTTP 200 (not 500)
- ✅ All 3 PDFs generate successfully
- ✅ PDFs open without corruption
- ✅ Generation time <5 seconds

**Reference Docs:**
- [CRITICAL_BUGS_AND_FIXES.md](CRITICAL_BUGS_AND_FIXES.md) lines 152-230

---

#### **Task 3: Re-Test Francisco's Resume**

- [ ] Navigate to production frontend
- [ ] Upload same 3 CV files
- [ ] Paste same Savers JD
- [ ] Answer 5 questions
- [ ] Generate resume
- [ ] **Verify Results:**
  - [ ] Name: "Francisco Calisto" (not "John Doe")
  - [ ] Real work history from CVs
  - [ ] Education matches CVs
  - [ ] ATS score 85%+ (not 60%)
  - [ ] Download markdown works
  - [ ] Download all 3 PDFs work
- [ ] **Get user feedback:** "Does this look like YOUR resume?"

**Session 28 Complete When:**
- ✅ All checkboxes above checked
- ✅ Francisco confirms resume is accurate
- ✅ PDFs download successfully
- ✅ Ready to move to Profile Builder (Session 29)

---

### **SESSION 29: PROFILE BUILDER FOUNDATION**

**Goal:** Implement deep personality profiling system
**Time Estimate:** 4-5 hours
**Prerequisites:** Session 28 complete

#### **Task 1: Database Schema (Profile Tables)**

**Files to Create/Modify:**
1. New migration file
2. `api/prisma/schema.prisma`

**Step-by-Step Checklist:**

- [ ] **Step 1.1:** Create Migration SQL
  **File:** `api/migrations/add_profile_system.sql`

  ```sql
  -- Create personality_profiles table
  CREATE TABLE personality_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Metadata
    is_complete BOOLEAN DEFAULT false,
    profile_version INTEGER DEFAULT 1,
    confidence_level INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated_at TIMESTAMP DEFAULT NOW(),
    last_reviewed_by_user_at TIMESTAMP,

    -- Big 5
    openness INTEGER CHECK (openness BETWEEN 0 AND 100),
    conscientiousness INTEGER CHECK (conscientiousness BETWEEN 0 AND 100),
    extraversion INTEGER CHECK (extraversion BETWEEN 0 AND 100),
    agreeableness INTEGER CHECK (agreeableness BETWEEN 0 AND 100),
    neuroticism INTEGER CHECK (neuroticism BETWEEN 0 AND 100),

    -- Derived Traits
    work_style VARCHAR(100),
    communication_style VARCHAR(100),
    leadership_style VARCHAR(100),
    motivation_type VARCHAR(100),
    decision_making VARCHAR(100),

    -- Values & Passions
    core_values TEXT[],
    passions TEXT[],
    unique_skills TEXT[],
    hidden_talents TEXT[],

    -- Work Preferences
    ideal_work_environment TEXT,
    work_life_balance_priority INTEGER,

    -- Profile Summary
    profile_summary TEXT,
    unique_value_proposition TEXT,
    career_narrative TEXT,
    career_goals TEXT,

    -- AI Metadata
    analysis_version VARCHAR(50),
    inference_confidence DECIMAL(3,2),
    completeness_score INTEGER,
    story_count INTEGER DEFAULT 0
  );

  CREATE INDEX idx_personality_profiles_user_id ON personality_profiles(user_id);
  CREATE INDEX idx_personality_profiles_complete ON personality_profiles(is_complete);

  -- Create profile_stories table (for RAG)
  CREATE TABLE profile_stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    profile_id INTEGER REFERENCES personality_profiles(id) ON DELETE CASCADE,

    -- Story Content
    question_asked TEXT NOT NULL,
    story_text TEXT NOT NULL,
    story_summary TEXT,

    -- Categorization
    category VARCHAR(50),
    themes TEXT[],
    skills_demonstrated TEXT[],
    soft_skills TEXT[],
    relevance_tags TEXT[],

    -- Metadata
    sentiment VARCHAR(20),
    impact_level VARCHAR(20),

    -- Usage Tracking
    times_used_in_resumes INTEGER DEFAULT 0,
    times_used_in_cover_letters INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_profile_stories_user_id ON profile_stories(user_id);
  CREATE INDEX idx_profile_stories_category ON profile_stories(category);
  CREATE INDEX idx_profile_stories_themes ON profile_stories USING GIN(themes);
  CREATE INDEX idx_profile_stories_tags ON profile_stories USING GIN(relevance_tags);
  ```

- [ ] **Step 1.2:** Apply Migration
  ```bash
  # Production
  gcloud sql connect cvstomize-db --user=postgres --database=cvstomize_production < api/migrations/add_profile_system.sql

  # Verify
  psql -c "\d personality_profiles"
  psql -c "\d profile_stories"
  ```

- [ ] **Step 1.3:** Update Prisma Schema
  **File:** `api/prisma/schema.prisma`

  Add models (see [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 50-150)

- [ ] **Step 1.4:** Generate Prisma Client
  ```bash
  cd api
  npx prisma generate
  ```

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 27-150

---

#### **Task 2: Profile Builder Questions (Backend)**

**Files to Create:**
1. `api/services/profileQuestions.js` (defines questions)
2. `api/services/profileAnalyzer.js` (Gemini analysis)
3. `api/routes/profile.js` (endpoints)

**Step-by-Step Checklist:**

- [ ] **Step 2.1:** Create Question Bank
  **File:** `api/services/profileQuestions.js`

  ```javascript
  // Copy from PROFILE_RAG_SYSTEM_DESIGN.md lines 152-350
  const PROFILE_QUESTIONS = [
    {
      id: 'challenge_story',
      text: '🎯 Tell me about a time you faced a real challenge...',
      category: 'challenge_overcome',
      optional: false
    },
    // ... 11 more questions
  ];

  module.exports = { PROFILE_QUESTIONS };
  ```

- [ ] **Step 2.2:** Create Profile Analysis Service
  **File:** `api/services/profileAnalyzer.js`

  ```javascript
  // Gemini prompt from PROFILE_RAG_SYSTEM_DESIGN.md lines 355-500
  async function analyzeProfile(answers) {
    const prompt = `You are an expert career psychologist...
    [Full prompt from design doc]`;

    const response = await gemini.generateContent(prompt);
    return JSON.parse(response.text);
  }
  ```

- [ ] **Step 2.3:** Create Profile Endpoints
  **File:** `api/routes/profile.js`

  ```javascript
  // POST /api/profile/start - Start profile building
  // POST /api/profile/answer - Submit answer
  // POST /api/profile/complete - Analyze & save profile
  // GET /api/profile/status - Check if user has profile
  ```

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 152-500

---

#### **Task 3: Profile Builder UI (Frontend)**

**Files to Create:**
1. `src/components/ProfileBuilderWizard.js`
2. `src/components/ProfileQuestion.js`
3. `src/pages/ProfileBuilderPage.js`

**Step-by-Step Checklist:**

- [ ] **Step 3.1:** Create ProfileBuilderWizard Component
  **File:** `src/components/ProfileBuilderWizard.js`

  **Features:**
  - Progress bar (1/12 questions)
  - Warm welcome message
  - Question display (one at a time)
  - Large textarea for answers
  - "Skip" button for optional questions
  - "Next" / "Finish" buttons
  - Completion celebration

- [ ] **Step 3.2:** Create Profile Completeness Check
  **File:** `src/contexts/AuthContext.js`

  ```javascript
  // After login, check:
  const profileStatus = await fetch('/api/profile/status');
  if (!profileStatus.isComplete) {
    navigate('/profile/build');
  }
  ```

- [ ] **Step 3.3:** Add Route
  **File:** `src/App.js`

  ```javascript
  <Route path="/profile/build" element={
    <ProtectedRoute>
      <ProfileBuilderPage />
    </ProtectedRoute>
  } />
  ```

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 152-350

---

#### **Task 4: Test Profile System**

- [ ] Create new test user
- [ ] Login → Should redirect to /profile/build
- [ ] Answer all 12 questions
- [ ] Submit profile
- [ ] **Verify Database:**
  ```sql
  SELECT is_complete, story_count, profile_summary
  FROM personality_profiles
  WHERE user_id = ...;

  SELECT question_asked, story_summary, category
  FROM profile_stories
  WHERE user_id = ...;
  ```
- [ ] **Verify:**
  - [ ] is_complete = true
  - [ ] story_count = 8-12
  - [ ] All stories categorized correctly

**Session 29 Complete When:**
- ✅ Database schema created
- ✅ 12 questions defined
- ✅ Gemini analysis working
- ✅ Profile Builder UI functional
- ✅ New users complete profile
- ✅ Profile data saved correctly

---

### **SESSION 30: RAG INTEGRATION**

**Goal:** Implement story retrieval for personalized resumes
**Time Estimate:** 4-5 hours
**Prerequisites:** Session 29 complete

#### **Task 1: Install pgvector Extension**

- [ ] **Step 1.1:** Enable pgvector in Cloud SQL
  ```bash
  gcloud sql instances patch cvstomize-db \
    --database-flags=cloudsql.enable_pgvector=on \
    --project=cvstomize
  ```

- [ ] **Step 1.2:** Create Extension
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;

  -- Add embedding column to profile_stories
  ALTER TABLE profile_stories
  ADD COLUMN embedding VECTOR(1536);

  -- Create index for similarity search
  CREATE INDEX idx_profile_stories_embedding
  ON profile_stories
  USING ivfflat (embedding vector_cosine_ops);
  ```

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 80-100

---

#### **Task 2: Generate Story Embeddings**

**Files to Create:**
1. `api/services/embeddingService.js`
2. `api/scripts/generateEmbeddings.js` (backfill)

- [ ] **Step 2.1:** Create Embedding Service
  **File:** `api/services/embeddingService.js`

  ```javascript
  // Use OpenAI or Vertex AI embeddings
  async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });
    return response.data[0].embedding;
  }
  ```

- [ ] **Step 2.2:** Update Profile Complete Endpoint
  **File:** `api/routes/profile.js`

  ```javascript
  // After saving stories, generate embeddings
  for (const story of stories) {
    const embedding = await generateEmbedding(story.story_text);
    await prisma.profileStory.update({
      where: { id: story.id },
      data: { embedding }
    });
  }
  ```

---

#### **Task 3: Implement Story Retrieval**

**Files to Create:**
1. `api/services/storyRetrieval.js`

- [ ] **Step 3.1:** Create Retrieval Service
  **File:** `api/services/storyRetrieval.js`

  ```javascript
  async function retrieveRelevantStories(userId, jobDescription, limit = 5) {
    // 1. Generate embedding for JD
    const jdEmbedding = await generateEmbedding(jobDescription);

    // 2. Vector similarity search
    const stories = await prisma.$queryRaw`
      SELECT id, story_text, story_summary, category, themes,
             skills_demonstrated, relevance_tags,
             1 - (embedding <=> ${jdEmbedding}::vector) as similarity
      FROM profile_stories
      WHERE user_id = ${userId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return stories;
  }
  ```

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 502-600

---

#### **Task 4: Enhance Resume Generation Prompt**

**File:** `api/routes/resume.js` (buildResumePrompt function)

- [ ] **Step 4.1:** Load Profile + Stories
  ```javascript
  // In /resume/generate endpoint
  const profile = await prisma.personalityProfile.findUnique({
    where: { userId: userRecord.id }
  });

  const relevantStories = await retrieveRelevantStories(
    userRecord.id,
    jobDescription,
    5
  );
  ```

- [ ] **Step 4.2:** Update Prompt
  ```javascript
  const prompt = `
  **PERSONALITY PROFILE:**
  - Work Style: ${profile.workStyle}
  - Communication: ${profile.communicationStyle}
  - Unique Value: ${profile.uniqueValueProposition}

  **RELEVANT PERSONAL STORIES (Use These!):**
  ${relevantStories.map((s, i) => `
    Story ${i+1}: ${s.storySummary}
    Skills: ${s.skillsDemonstrated.join(', ')}
    Use For: ${s.relevanceTags.join(', ')}
  `).join('\n')}

  **INSTRUCTIONS:**
  Weave these stories naturally into resume bullets.
  Don't just list skills - prove them with specific examples from stories.

  [Rest of prompt...]
  `;
  ```

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 600-750

---

#### **Task 5: Test RAG System**

- [ ] Create profile with 10 stories
- [ ] Generate resume for technical job
- [ ] **Verify:** Resume includes relevant technical stories (not customer service stories)
- [ ] Generate resume for customer service job
- [ ] **Verify:** Resume includes customer service stories (not technical ones)
- [ ] **Compare Quality:**
  - [ ] With RAG: Specific examples, metrics, authenticity
  - [ ] Without RAG: Generic bullets, no proof

**Session 30 Complete When:**
- ✅ pgvector installed and working
- ✅ Story embeddings generated
- ✅ Similarity search retrieves relevant stories
- ✅ Resume prompt includes top 5 stories
- ✅ Resume quality significantly improved

---

### **SESSION 31: COVER LETTER GENERATION**

**Goal:** New feature - AI cover letters with profile integration
**Time Estimate:** 3-4 hours
**Prerequisites:** Session 30 complete

#### **Task 1: Company Research Integration**

**Files to Create:**
1. `api/services/companyResearch.js`

- [ ] Research company mission/values from JD
- [ ] Extract company name, mission statement
- [ ] Identify key values (sustainability, innovation, etc.)

---

#### **Task 2: Cover Letter Prompt**

**File:** `api/services/coverLetterGenerator.js`

- [ ] Create Gemini prompt using:
  - User's profile (communication style, passions)
  - 2-3 relevant stories (via RAG)
  - Company mission/values
  - Mission-value alignment
- [ ] Generate 250-350 word cover letter
- [ ] Match user's tone (formal vs casual)

**Reference:** [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) lines 651-700

---

#### **Task 3: Cover Letter UI**

**Files to Create:**
1. `src/components/CoverLetterGenerator.js`
2. `src/pages/CoverLetterPage.js`

- [ ] Form: Company name, JD, job title
- [ ] Generate button
- [ ] Preview cover letter
- [ ] Edit capability
- [ ] Download as .docx or .pdf

---

#### **Task 4: Test Cover Letters**

- [ ] Generate for Savers (sustainability mission)
- [ ] **Verify:** Mentions user's sustainability passion
- [ ] Generate for tech company (innovation mission)
- [ ] **Verify:** Mentions user's learning passion
- [ ] **Quality Check:** Sounds authentic, not templated

**Session 31 Complete When:**
- ✅ Cover letter generation working
- ✅ Mission alignment detected
- ✅ User's passions woven in naturally
- ✅ Quality > generic templates

---

### **SESSION 32: PROFILE MANAGEMENT**

**Goal:** Let users view/edit their profiles
**Time Estimate:** 3-4 hours

#### **Task 1: Profile Page UI**

**Files to Create:**
1. `src/pages/ProfilePage.js`

**Features:**
- [ ] Display Big 5 scores (visual charts)
- [ ] Show profile summary
- [ ] List all stories (with edit buttons)
- [ ] Add new story button
- [ ] "Update Profile" button
- [ ] Profile completeness indicator

---

#### **Task 2: Story Management**

- [ ] Edit story modal
- [ ] Delete story (with confirmation)
- [ ] Add new story
- [ ] Re-categorize stories
- [ ] View story usage stats (times used in resumes)

---

#### **Task 3: Profile Staleness Warning**

**File:** `src/components/ProfileBuilder.js`

- [ ] Check `last_updated_at` vs current date
- [ ] If >6 months → Show banner: "Your profile is outdated. Update now?"
- [ ] Quick update flow (2-3 new questions)
- [ ] Merge new answers with existing profile

**Session 32 Complete When:**
- ✅ Users can view complete profile
- ✅ Users can edit stories
- ✅ Profile staleness detection works
- ✅ Quick update flow functional

---

### **SESSION 33: PRODUCTION HARDENING**

**Goal:** Polish, testing, deployment automation
**Time Estimate:** 4-5 hours

#### **Deployment Automation:**

- [ ] **Fix:** Auto-route traffic in deploy scripts
  ```bash
  # Add to deploy-frontend.sh and deploy-api.sh
  REVISION=$(gcloud run revisions list --service=$SERVICE --limit=1 --format="value(REVISION)")
  gcloud run services update-traffic $SERVICE --to-revisions=$REVISION=100
  ```

#### **Testing:**

- [ ] End-to-end test (new user → profile → resume → download)
- [ ] A/B test: Profile vs no profile (quality comparison)
- [ ] Load test: 100 concurrent users
- [ ] Edge cases: Partial profiles, missing data

#### **Analytics:**

- [ ] Track profile completion rate
- [ ] Track which stories used most
- [ ] Track cover letter generation rate
- [ ] Track premium conversion (profile users vs non-profile)

**Session 33 Complete When:**
- ✅ Deployment fully automated
- ✅ All tests passing
- ✅ Analytics dashboard live
- ✅ Ready for user acquisition

---

## 🎯 CONTEXT PRESERVATION STRATEGY

### **Before Each Session (5 min):**
1. Read this checklist
2. Identify which session you're on
3. Review reference docs for that session
4. Check database schema (what's been added)

### **During Session:**
1. Check off items as completed
2. Note any deviations in comments
3. Update estimated time if needed

### **End of Session (10 min):**
1. Update this file with progress
2. Commit all code + updated checklist
3. Create session summary (what worked, what didn't)
4. Update ROADMAP.md

### **Key Reference Docs (Always Available):**
- [CRITICAL_BUGS_AND_FIXES.md](CRITICAL_BUGS_AND_FIXES.md) - Bug details + fixes
- [RESUME_GENERATION_FLOW_EXPLAINED.md](RESUME_GENERATION_FLOW_EXPLAINED.md) - How system works
- [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) - Profile system design
- [ROADMAP.md](ROADMAP.md) - High-level roadmap
- This file - Step-by-step execution plan

---

## ✅ SUCCESS CRITERIA (Final Validation)

### **After Session 33, System Should:**

**Profile System:**
- [ ] 90%+ new users complete profile
- [ ] Average 10+ stories per user
- [ ] Profile completeness score: 90%+

**Resume Quality:**
- [ ] Resumes include 2-3 personal stories (not generic)
- [ ] ATS scores: 85-95% (vs 60% without profile)
- [ ] User feedback: "This sounds like me!" (4.5+/5)

**Cover Letter Quality:**
- [ ] Mission alignment detected and mentioned
- [ ] User's passions woven in naturally
- [ ] Better than 90% of templated cover letters

**Business Metrics:**
- [ ] Profile users → 3x more likely to go premium
- [ ] Profile users generate 5x more resumes
- [ ] Cover letter → 40% premium conversion
- [ ] User retention: 80% after profile creation

**Technical:**
- [ ] Zero data loss (all content persisted)
- [ ] PDF generation: 100% success rate
- [ ] RAG retrieval: <500ms
- [ ] Deployment: Fully automated

---

## 🚨 CRITICAL CHECKPOINTS (Don't Skip!)

### **Checkpoint 1: After Session 28**
**Question:** "Is Francisco's resume now accurate?"
- If NO → Don't proceed. Debug Session 28 fixes.
- If YES → Continue to Session 29.

### **Checkpoint 2: After Session 29**
**Question:** "Do new users complete profiles successfully?"
- If NO → Fix profile builder UX.
- If YES → Continue to Session 30.

### **Checkpoint 3: After Session 30**
**Question:** "Does RAG retrieve relevant stories?"
- If NO → Debug embedding/similarity search.
- If YES → Continue to Session 31.

### **Checkpoint 4: After Session 33**
**Question:** "Ready for real users?"
- If NO → Identify gaps and fix.
- If YES → Launch! 🚀

---

## 📞 EMERGENCY CONTACTS (If Lost)

**If you're lost, read these in order:**
1. This file (you are here)
2. [ROADMAP.md](ROADMAP.md) - High-level vision
3. [PROFILE_RAG_SYSTEM_DESIGN.md](PROFILE_RAG_SYSTEM_DESIGN.md) - Profile details
4. [CRITICAL_BUGS_AND_FIXES.md](CRITICAL_BUGS_AND_FIXES.md) - Known issues

**Current Status:**
- ✅ Session 27 complete (download button fixed, bugs documented)
- ⏳ Session 28 next (fix critical bugs)
- ⏳ Sessions 29-33 after that (build profile system)

**Last Updated:** 2025-11-10
**Next Session:** 28 (Critical bug fixes)
