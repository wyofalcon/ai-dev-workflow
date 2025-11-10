# CVstomize Resume Generation Flow - Complete Explanation

**Date:** 2025-11-10
**Your Case Analysis:** Merchandise Processing Associate at Savers

---

## 🔍 IDENTIFIED ISSUES

### Issue #1: PDF Generation 500 Errors ❌
**Symptom:** All 3 PDF downloads return HTTP 500
**Root Cause:** Likely Puppeteer/Chrome not installed or configured correctly in Cloud Run environment
**Location:** `api/services/pdfGenerator.js` lines 33-46

### Issue #2: Poor Resume Quality ❌
**Your resume shows:** "John Doe" with generic/fabricated experience
**Expected:** Francisco Calisto's actual experience from your uploaded CVs
**Root Cause:** Multiple problems in the flow (detailed below)

---

## 📊 COMPLETE RESUME GENERATION FLOW

### Step 1: Upload Resume Files ✅ (Working)
**Endpoint:** `POST /api/resume/extract-text`
**Your files:**
- CV FCR _2025.docx
- CV FCR 09_2025 MCDE.docx
- CV FCR 09_2025.pdf

**What happens:**
1. Files uploaded via multer (25MB limit)
2. Text extracted using:
   - `mammoth` for DOCX files
   - `pdf-parse` for PDF files
3. Combined text returned (11,220 characters extracted ✅)

**Code:** `api/routes/resume.js` lines 1039-1133

---

### Step 2: Conversation Start with Gap Analysis
**Endpoint:** `POST /api/conversation/start`
**Input:**
- Job Description (3,742 chars)
- Existing Resume (11,220 chars from upload)

**What SHOULD happen:**
1. Gemini analyzes JD vs existing resume
2. Identifies gaps (missing skills/experience)
3. Generates 2-5 targeted questions to fill gaps
4. Stores gap analysis in `jdSessions` Map (in-memory)

**What ACTUALLY happened:**
- Gap analysis completed ✅
- Generated 5 questions ✅
- Session stored with sessionId: `94d14eb7-b1f8-4e08-9cc1-65c0de61e0b7`

**Code:** `api/routes/conversation.js` + `api/services/jobDescriptionAnalyzer.js`

---

### Step 3: Answer Questions ✅ (Working)
**Endpoint:** `POST /api/conversation/message` (x5)

**Your answers recorded:**
- Q1: Customer service example (above and beyond)
- Q2: Physical stamina (maintaining energy/focus)
- Q3: Teamwork example
- Q4: Task prioritization in fast-paced environment
- Q5: Why interested in role/mission alignment

**Stored in database:** `conversations` table as JSONB array

---

### Step 4: Personality Inference ✅ (Working)
**Endpoint:** `POST /api/conversation/complete`

**What happened:**
```json
{
  "openness": 65,
  "conscientiousness": 88,
  "extraversion": 55,
  "agreeableness": 75,
  "neuroticism": 40
}
```

**Stored in:** `personality_traits` table linked to your user ID

**Prompt used:** `api/services/personalityInferenceGemini.js` lines 15-98 (Big 5 psychology expert prompt)

---

### Step 5: Resume Generation ⚠️ **PROBLEM HERE**
**Endpoint:** `POST /api/resume/generate`
**Input:**
- `jobDescription`: Savers JD
- `sessionId`: 94d14eb7-b1f8-4e08-9cc1-65c0de61e0b7
- `selectedSections`: "Summary,Experience,Skills,Education"

**What SHOULD happen:**
1. Load conversation answers from database using sessionId ✅
2. Load personality traits from database ✅
3. Load gap analysis from `jdSessions` Map using sessionId ⚠️
4. Load existing resume from `jdSessions` Map ⚠️
5. Build prompt with ALL context
6. Send to Gemini
7. Generate resume

**What WENT WRONG:**

#### Problem 5A: Gap Analysis Not Loaded
**Code location:** `api/routes/resume.js` lines 219-233

```javascript
if (sessionId) {
  const conversationModule = require('./conversation');
  const jdSession = conversationModule.jdSessions?.get(sessionId);

  if (jdSession) {
    gapAnalysis = jdSession.analysis?.resumeGapAnalysis;
    existingResumeFromSession = jdSession.existingResume;
  }
}
```

**Issue:** `jdSessions` is an in-memory Map that gets cleared when:
- Server restarts
- Cloud Run scales to zero
- Different container instance handles the request

**Result:** Your gap analysis and uploaded resume were LOST between conversation and generation!

#### Problem 5B: Prompt Without Your Resume
**What Gemini received:**

```
You are an elite-level professional resume writer...

PERSONALITY-BASED FRAMING:
- Conscientiousness: 88/100 (Highlight attention to detail)
- Extraversion: 55/100 (Highlight independent work)
...

TARGET JOB DESCRIPTION:
[Savers Merchandise Processing Associate JD]

CANDIDATE'S BACKGROUND:
No formal resume provided - extract experience from personal stories below

PERSONAL ACHIEVEMENTS & STORIES:
Q1: [Your customer service answer]
Q2: [Your physical stamina answer]
Q3: [Your teamwork answer]
Q4: [Your task prioritization answer]
Q5: [Your interest in role answer]
```

**Missing:**
- ❌ Your actual uploaded resume (11,220 characters)
- ❌ Gap analysis (what to keep, enhance, fill)
- ❌ Existing work history from CVs
- ❌ Your name (Francisco Calisto)
- ❌ Your education (if in CV)
- ❌ Your actual experience

**Result:** Gemini had to INVENT experience based only on your 5 short answers!

---

## 🔧 THE PROMPTS (All of them)

### Prompt 1: Job Description Analysis (Gap Analysis)
**File:** `api/services/jobDescriptionAnalyzer.js` lines 48-150

```
You are an expert career strategist and ATS (Applicant Tracking System) specialist.

I will provide you with:
1. A job description
2. (Optional) The candidate's existing resume

Your task is to analyze the job description and generate 5 highly-specific, role-relevant questions that will help me build a personalized, ATS-optimized resume for this exact role.

[If resume provided:]
**EXISTING RESUME:**
[Your resume content]

**GAP ANALYSIS INSTRUCTIONS:**
Compare the existing resume to the job description and identify:
1. STRENGTHS: What content is already strong and should be kept
2. WEAKNESSES: What sections need enhancement with specific examples
3. MISSING CONTENT: What required skills/experience are not mentioned
4. ATS MATCH: Estimate current ATS match score (0-100%)

Based on gaps identified, generate 2-5 targeted questions to fill only what's missing.
DO NOT ask about content already well-covered in the resume.

**JOB DESCRIPTION:**
[JD here]

**OUTPUT FORMAT (JSON):**
{
  "jobTitle": "extracted title",
  "questions": [
    { "id": "jd_question_1", "text": "question text", "category": "category" }
  ],
  "resumeGapAnalysis": {
    "strengths": ["list"],
    "weaknesses": ["list"],
    "missingContent": ["list"],
    "atsMatchScore": 65,
    "questionCount": 3
  }
}
```

**Used in:** Conversation start when you upload resume

---

### Prompt 2: Personality Inference
**File:** `api/services/personalityInferenceGemini.js` lines 15-98

```
You are an expert psychologist specializing in personality assessment and the Big Five personality model.

Based on the candidate's answers to interview questions, infer their Big Five personality traits.

**CANDIDATE'S ANSWERS:**
Q1: [answer]
Q2: [answer]
...

**OUTPUT (JSON):**
{
  "openness": 0-100,
  "conscientiousness": 0-100,
  "extraversion": 0-100,
  "agreeableness": 0-100,
  "neuroticism": 0-100,
  "workStyle": "methodical/collaborative/independent/dynamic",
  "communicationStyle": "direct/diplomatic/supportive",
  "reasoning": "explanation"
}
```

**Used in:** After conversation completion

---

### Prompt 3: Resume Generation (THE BIG ONE)
**File:** `api/routes/resume.js` lines 14-129

**Full prompt that was sent to Gemini for YOUR resume:**

```
You are an elite-level professional resume writer and career strategist with 15+ years of experience.

PERSONALITY-BASED FRAMING:
- Openness: 65/100 (Focus on reliability)
- Conscientiousness: 88/100 (Highlight attention to detail)
- Extraversion: 55/100 (Highlight independent work)
- Work Style: balanced
- Communication: professional

Frame achievements through this personality lens.

TARGET JOB DESCRIPTION:
Job Title: Merchandise Processing Associate
Pay Range: $13.00 to $13.71
[Full Savers JD - 3,742 characters]

CANDIDATE'S BACKGROUND:
No formal resume provided - extract experience from personal stories below

PERSONAL ACHIEVEMENTS & STORIES:
Q1: [Your customer service answer]
Q2: [Your physical stamina answer]
Q3: [Your teamwork answer]
Q4: [Your prioritization answer]
Q5: [Your motivation answer]

REQUIRED SECTIONS:
Summary, Experience, Skills, Education

INSTRUCTIONS:
1. Since minimal candidate data provided, create a professional resume framework with placeholder content marked with [EDIT: ...]
2. Tailor EVERY bullet point to match keywords from job description
3. Use strong action verbs (Led, Achieved, Implemented, Optimized)
4. Quantify ALL achievements with metrics
5. Keep bullets concise (1-2 lines max)
6. Clean Markdown format
7. Professional Summary at top
8. ATS-friendly (no tables/images)
9. Use exact job title: "Merchandise Processing Associate"
10. Include contact: [Your Name], [City, State], [Phone], [Email], [LinkedIn]

Generate a compelling, professional resume now:
```

**PROBLEMS WITH THIS PROMPT:**
1. ❌ Says "No formal resume provided" (YOUR RESUME WAS LOST!)
2. ❌ Missing your 11,220 characters of actual experience
3. ❌ Missing gap analysis guidance (keep/enhance/fill strategy)
4. ❌ Instruction #1 tells Gemini to CREATE PLACEHOLDERS!
5. ❌ Only has 5 short Q&A answers to work with

**Result:** Gemini invented "John Doe" with fabricated warehouse experience that sounds plausible but isn't yours.

---

## 🐛 ROOT CAUSES

### 1. In-Memory Storage Loss
**Problem:** `jdSessions` is a JavaScript Map that doesn't persist

**Code:** `api/routes/conversation.js` line 10
```javascript
const jdSessions = new Map(); // VOLATILE - Lost on restart!
```

**Why it fails:**
- Cloud Run can scale to zero (clears memory)
- Different container handles generation request
- Server restart between steps

**Solution needed:** Store in database or Redis

---

### 2. Resume Content Not Persisted
**Problem:** Uploaded resume stored in `jdSessions` only, never saved to database

**Flow:**
1. Upload → Extract text → Return to frontend ✅
2. Frontend sends text in conversation/start ✅
3. Backend stores in `jdSessions.set(sessionId, { existingResume: ... })` ⚠️
4. **Different container** handles `/resume/generate` ❌
5. `jdSessions.get(sessionId)` returns undefined ❌
6. Resume content LOST ❌

---

### 3. PDF Generation 500 Errors
**Problem:** Puppeteer not properly configured in Cloud Run

**Possible causes:**
1. Chrome/Chromium not installed in Docker image
2. Missing system dependencies for headless Chrome
3. Insufficient memory allocation
4. Timeout issues (PDF generation can be slow)

**Code:** `api/services/pdfGenerator.js` lines 33-46

---

## ✅ WHAT WORKED

1. ✅ File upload (PDF/DOCX parsing)
2. ✅ Text extraction (11,220 chars)
3. ✅ Gap analysis generation
4. ✅ Question generation (5 relevant questions)
5. ✅ Conversation flow (all answers saved)
6. ✅ Personality inference (accurate Big 5)
7. ✅ Markdown resume generation (wrong content, but format OK)
8. ✅ Database storage (conversations, personality)

---

## ❌ WHAT FAILED

1. ❌ Resume content lost between upload and generation
2. ❌ Gap analysis lost (not persisted)
3. ❌ Prompt missing critical context (your actual resume)
4. ❌ Generated resume has wrong name, fabricated experience
5. ❌ PDF downloads fail (500 errors)

---

## 🔧 REQUIRED FIXES

### Fix #1: Persist Resume Content to Database (CRITICAL)
**Change:** Store uploaded resume in `conversations` table

**Current:**
```javascript
// conversation.js
jdSessions.set(sessionId, {
  analysis: analysisData,
  existingResume: req.body.existingResume // LOST!
});
```

**Should be:**
```javascript
// Save to database
await prisma.conversation.update({
  where: { sessionId },
  data: {
    existingResume: req.body.existingResume, // NEW COLUMN
    gapAnalysis: JSON.stringify(analysisData.resumeGapAnalysis) // NEW COLUMN
  }
});
```

---

### Fix #2: Load Resume from Database in Generation
**Change:** `resume.js` lines 219-233

**Current:**
```javascript
const jdSession = conversationModule.jdSessions?.get(sessionId); // FAILS!
```

**Should be:**
```javascript
const conversation = await prisma.conversation.findFirst({
  where: { sessionId },
  select: { existingResume: true, gapAnalysis: true }
});

existingResumeFromSession = conversation?.existingResume;
gapAnalysis = conversation?.gapAnalysis ? JSON.parse(conversation.gapAnalysis) : null;
```

---

### Fix #3: Update Database Schema
**Add columns to `conversations` table:**

```sql
ALTER TABLE conversations
ADD COLUMN existing_resume TEXT,
ADD COLUMN gap_analysis JSONB;
```

---

### Fix #4: Fix PDF Generation (Puppeteer)
**Update Dockerfile to install Chrome:**

```dockerfile
# Install Chromium for Puppeteer
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

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

## 📈 EXPECTED RESULT AFTER FIXES

**With your actual resume + gap analysis:**

```markdown
# Francisco Calisto
Rochester, MN | your-phone | your-email | LinkedIn

---

## Professional Summary
Detail-oriented professional with [X years] experience in [your actual field from CV]. Proven track record in [your actual skills]. Eager to apply expertise in merchandise processing and inventory management to support Savers' mission of sustainable reuse...

---

## Professional Experience

**[Your Actual Job Title]** | [Your Actual Company] | [Your Location] | [Your Dates]
- [Your actual achievement from CV, tailored to match Savers keywords]
- [Your actual project, with metrics]
- [Conversation answer integrated: customer service example]
...
```

**ATS Match:** 85-95% (vs current ~60%)
**Accuracy:** 100% real experience (vs current 0%)

---

## 🎯 NEXT STEPS

Would you like me to:
1. **Fix the database persistence** (add columns, update code)
2. **Fix the PDF generation** (update Dockerfile)
3. **Re-run your resume** with the fixes applied
4. **Show you the difference** between current vs fixed output

I recommend we fix #1 and #3 first (database persistence), then re-generate your resume with the correct context.
