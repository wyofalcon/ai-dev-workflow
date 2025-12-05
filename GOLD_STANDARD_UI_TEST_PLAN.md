# 🏆 Gold Standard UI Test Plan

**Test Date:** December 5, 2025
**Tester:** User (Claude Chrome Extension recommended)
**Account:** claude.test.20250403@example.com (Gold tier)
**Frontend:** https://cvstomize-frontend-351889420459.us-central1.run.app

---

## 🎯 Test Objective

Verify the **Gold Standard Wizard** works end-to-end with the 35-question hybrid assessment:
- 8 Story Questions
- 20 BFI-20 Likert Items
- 7 Hybrid Questions

Then compare resume output quality against Free tier to confirm personality data enhances results.

---

## 📋 PART 1: Gold Standard Full Assessment

### Prerequisites

✅ User account has Gold tier access
✅ User has at least 1 uploaded/created resume (for Gold Standard access)
✅ Frontend deployed with routing fix (cvstomize-frontend-00036-d5c)

### Step 1: Access Gold Standard Wizard

1. **Navigate to:** https://cvstomize-frontend-351889420459.us-central1.run.app
2. **Login** with:
   - Email: claude.test.20250403@example.com
   - Password: TestGold2025!
3. **Click** on "TAILOR TO SPECIFIC JOB (GOLD STANDARD)" card
4. **Verify:**
   - ✅ Route goes to `/gold-standard` (check URL bar)
   - ✅ NOT `/create-resume` (wrong wizard)
   - ✅ Gold Standard Wizard opens

### Step 2: Section 1 - Story Questions (8 Questions)

**Expected:** 8 open-ended story questions collecting detailed narratives

**Sample Questions You Might See:**
1. "Tell me about your most significant professional achievement"
2. "Describe a challenging project where you had to overcome obstacles"
3. "Share a time when you led a team or mentored others"
4. "Describe your most innovative or creative solution to a problem"
5. "Tell me about a failure or setback and what you learned"
6. "Describe how you handle conflict or disagreement at work"
7. "Share a time when you had to adapt to major change"
8. "Tell me about a project that required deep collaboration"

**Test Steps:**

For each question:
- ✅ Question displays clearly
- ✅ Text area for long-form answer (minimum 100-150 words recommended)
- ✅ Answer saves when clicking "Next"
- ✅ Progress indicator updates (e.g., "1/35", "2/35", etc.)

**Provide detailed answers (150+ words each)** - Example:

```
Question: "Tell me about your most significant professional achievement"

Answer:
My most significant achievement was leading the migration of our monolithic
application to a microservices architecture on Kubernetes. This was a 9-month
project that I spearheaded from initial planning to production deployment.

I started by researching best practices, creating a detailed technical
specification, and presenting the business case to leadership. Once approved,
I assembled a cross-functional team of 8 engineers and organized weekly sprints.

The biggest challenge was maintaining zero downtime during the migration. I
implemented a gradual rollout strategy, starting with non-critical services
and carefully monitoring metrics at each stage. When we encountered performance
bottlenecks, I worked with the team to optimize database queries and implement
caching layers.

The results exceeded expectations: deployment time reduced from 2 hours to
15 minutes, system uptime improved to 99.9%, and our ability to scale
horizontally eliminated previous capacity constraints. More importantly, I
mentored 3 junior engineers throughout the process who are now confident
working with cloud-native architectures.
```

**✅ Expected After Section 1:**
- Progress: 8/35 complete
- "Continue to Personality Assessment" button appears

### Step 3: Section 2 - BFI-20 Likert Items (20 Questions)

**Expected:** 20 statements with 1-5 scale responses

**Format:** "I see myself as someone who..."

| # | Statement | Type |
|---|-----------|------|
| 1 | ...is inventive | Openness |
| 2 | ...is curious about many different things | Openness |
| 3 | ...tends to stick to routine and familiar approaches (R) | Openness |
| 4 | ...is original, comes up with new ideas | Openness |
| 5 | ...does things thoroughly | Conscientiousness |
| 6 | ...tends to be disorganized (R) | Conscientiousness |
| 7 | ...is reliable, can always be counted on | Conscientiousness |
| 8 | ...perseveres until the task is finished | Conscientiousness |
| 9 | ...is talkative | Extraversion |
| 10 | ...is reserved, tends to be quiet (R) | Extraversion |
| 11 | ...is outgoing, sociable | Extraversion |
| 12 | ...is full of energy and enthusiasm | Extraversion |
| 13 | ...is helpful and unselfish with others | Agreeableness |
| 14 | ...can be cold and aloof (R) | Agreeableness |
| 15 | ...is considerate and kind to almost everyone | Agreeableness |
| 16 | ...likes to cooperate with others | Agreeableness |
| 17 | ...worries a lot | Neuroticism |
| 18 | ...is relaxed, handles stress well (R) | Neuroticism |
| 19 | ...gets nervous easily | Neuroticism |
| 20 | ...stays calm in tense situations (R) | Neuroticism |

**Response Scale:**
1. Disagree Strongly
2. Disagree a little
3. Neutral (neither agree nor disagree)
4. Agree a little
5. Agree Strongly

**(R) = Reverse-scored item** (your answer is flipped in scoring)

**Test Steps:**

- ✅ All 20 items display
- ✅ 1-5 radio buttons or slider for each
- ✅ Items marked with (R) for reverse-scoring (optional UI feature)
- ✅ "Continue" button enabled after all 20 answered
- ✅ Progress shows 28/35 after completion

**Testing Tip:** Answer honestly based on your actual personality for realistic results!

**✅ Expected After Section 2:**
- Progress: 28/35 complete
- "Continue to Hybrid Questions" button appears

### Step 4: Section 3 - Hybrid Questions (7 Questions)

**Expected:** 7 additional contextual questions

**Sample Questions:**
1. "How do you prefer to work - independently, collaboratively, or a mix?"
2. "What motivates you most in your career?"
3. "How do you typically approach decision-making?"
4. "Describe your ideal work environment"
5. "How do you handle stress and pressure?"
6. "What's your learning and growth style?"
7. "How do you prefer to receive feedback?"

**Test Steps:**

- ✅ 7 questions display
- ✅ Mix of text answers and multiple choice
- ✅ Progress shows 35/35 at end
- ✅ "Complete Assessment" button appears

**✅ Expected After Section 3:**
- Progress: 35/35 complete
- "Complete Assessment & Analyze" button enabled

### Step 5: Complete Assessment & Analysis

**Test Steps:**

1. **Click** "Complete Assessment & Analyze"
2. **Expected:**
   - ✅ Loading indicator appears
   - ✅ Message: "Analyzing your personality... (this may take 30-60 seconds)"
   - ✅ Backend processes BFI-20 scores
   - ✅ Backend calls Gemini for narrative analysis
   - ✅ Weighted fusion calculates final OCEAN scores
   - ✅ **Completes within 60 seconds** (no timeout)

3. **After Analysis:**
   - ✅ Success message appears
   - ✅ OCEAN scores displayed (0-100 scale):
     - Openness
     - Conscientiousness
     - Extraversion
     - Agreeableness
     - Neuroticism
   - ✅ Confidence score shown (should be 75-90%)
   - ✅ Profile summary displayed
   - ✅ "Continue to Resume Generation" button appears

**⏱️ CRITICAL:** If timeout or error occurs:
- ❌ Report immediately with timestamp
- ❌ Check browser console for errors
- ❌ Note if Retry button appears

### Step 6: Resume Generation with Personality Data

**Test Steps:**

1. **Click** "Continue to Resume Generation"
2. **Enter Job Description** (use same one from previous test):

```
Senior Software Engineer - Full Stack

We are seeking an experienced Full Stack Engineer to join our team.

Requirements:
- 5+ years experience with React and Node.js
- Strong understanding of cloud platforms (AWS/GCP)
- Experience with PostgreSQL databases
- Excellent problem-solving and communication skills
- Experience with CI/CD pipelines

Responsibilities:
- Design and develop scalable web applications
- Collaborate with product team on requirements
- Mentor junior developers
- Participate in code reviews and architecture decisions
```

3. **Generate Resume**
4. **Expected:**
   - ✅ Resume generation completes
   - ✅ Resume uses personality insights (check for personality-aligned language)
   - ✅ Resume incorporates stories from Section 1
   - ✅ Professional summary reflects OCEAN scores
   - ✅ Work style preferences mentioned

**Record:**
- Time taken: _____ seconds
- Resume displays: YES / NO
- Quality assessment: 1-5 stars

---

## 📊 PART 2: Compare Gold Standard vs Free Tier

### Objective

Compare resume quality to verify Gold Standard is superior due to:
1. Personality-authentic language
2. RAG-powered story retrieval
3. Work preference alignment
4. Derived trait incorporation

### Setup: Create Free Tier Test Account

**Option A: Use Existing Free Tier Account**
- If you have a non-Gold account, use that

**Option B: Create New Test Account**
1. Logout of claude.test.20250403@example.com
2. Navigate to https://cvstomize-frontend-351889420459.us-central1.run.app/signup
3. Create account: claude.test.free@example.com (or similar)
4. Complete basic onboarding
5. Upload a simple resume or build one

### Free Tier Test

**Steps:**

1. **Login** with Free tier account
2. **Click** "TAILOR TO SPECIFIC JOB" (should show as disabled or different flow)
3. **Use** the "Build New Resume" or "Upload Resume" path instead
4. **Enter same job description** as Gold Standard test
5. **Generate resume**

**Record:**
- Resume generation method: Upload / Build / Conversational
- Time taken: _____ seconds
- Resume quality: 1-5 stars

### Comparison Checklist

Compare the two resumes side-by-side:

| Feature | Free Tier | Gold Standard | Better? |
|---------|-----------|---------------|---------|
| **Professional Summary** | Generic / Basic | Personality-aligned | □ Gold |
| **Language Style** | Standard | Matches communication style | □ Gold |
| **Work Preferences** | Not mentioned | Explicitly included | □ Gold |
| **Story Integration** | Minimal | Rich RAG-retrieved stories | □ Gold |
| **Achievement Framing** | Basic | Matches motivation type | □ Gold |
| **Overall Authenticity** | Generic | Personality-authentic | □ Gold |
| **ATS Optimization** | Good | Excellent | □ Gold |
| **Hiring Manager Appeal** | Good | Excellent | □ Gold |

**Key Differences to Look For:**

**Gold Standard Should Have:**
- ✅ Personality-aligned adjectives (e.g., "diplomatic", "systematic", "innovative")
- ✅ Work style mentions (e.g., "thrives in hybrid environments")
- ✅ Motivation alignment (e.g., "driven by mastery" vs "achievement")
- ✅ Derived traits evident in language
- ✅ Stories woven naturally into experience bullets
- ✅ Leadership style reflected (e.g., "servant leadership", "transformational")

**Free Tier Will Have:**
- Generic professional summary
- Standard resume language
- No personality insights
- Minimal story integration
- Basic ATS optimization only

---

## 📝 Results Template

```
=== GOLD STANDARD UI TEST RESULTS ===

Date: December 5, 2025
Tester: [Your name/Claude]
Account: claude.test.20250403@example.com

--- Part 1: Gold Standard Wizard ---

✅ / ❌  Wizard accessed at /gold-standard route
✅ / ❌  Section 1: 8 story questions completed
✅ / ❌  Section 2: 20 BFI-20 Likert items completed
✅ / ❌  Section 3: 7 hybrid questions completed
✅ / ❌  Total progress: 35/35 displayed correctly

✅ / ❌  Analysis completed (time: _____ seconds)
✅ / ❌  OCEAN scores displayed correctly
✅ / ❌  Confidence score: _____%
✅ / ❌  No timeout errors

✅ / ❌  Resume generated successfully
✅ / ❌  Personality insights evident in resume

--- OCEAN Scores Received ---

Openness: _____
Conscientiousness: _____
Extraversion: _____
Agreeableness: _____
Neuroticism: _____

Confidence: _____%
Profile Summary: "_______"

--- Part 2: Free Tier Comparison ---

Free Tier Method: [Upload / Build / Conv]
Free Tier Quality: ☆☆☆☆☆ (1-5 stars)
Gold Standard Quality: ☆☆☆☆☆ (1-5 stars)

Gold Standard is Better? YES / NO / SAME

Key Differences Observed:
1. _______
2. _______
3. _______

--- Database Verification (Optional) ---

Check if data saved to correct tables:
□ personality_profiles table has new record
□ profile_stories table has 8 story records
□ Stories have embeddings for RAG
□ Resume references personality data

--- Issues Found ---
1. [List any issues or write "None"]

--- Screenshots ---
[Attach relevant screenshots]

--- Overall Verdict ---

Gold Standard Working as Intended? YES / NO
Superior to Free Tier? YES / NO
Production Ready? YES / NO

=== END RESULTS ===
```

---

## ✅ Success Criteria

**Gold Standard Test PASSES if:**
- ✅ 35-question wizard completes without errors
- ✅ Analysis finishes within 60 seconds
- ✅ OCEAN scores are displayed (all 0-100)
- ✅ Confidence score is 75-90%
- ✅ Resume is generated successfully
- ✅ Resume quality is measurably better than Free tier
- ✅ Personality insights are evident in output
- ✅ No data saved to wrong tables (personality_traits)

**Gold Standard Test FAILS if:**
- ❌ Wrong wizard loads (/create-resume route)
- ❌ Fewer than 35 questions displayed
- ❌ Analysis times out or errors
- ❌ No OCEAN scores displayed
- ❌ Resume quality is same or worse than Free tier
- ❌ No personality insights in output
- ❌ Data saved to legacy personality_traits table

---

## 🔍 Post-Test Verification (Developer)

After user completes test, verify backend:

```sql
-- Check if assessment saved to personality_profiles (not personality_traits)
SELECT
  pp.user_id,
  pp.openness,
  pp.conscientiousness,
  pp.extraversion,
  pp.agreeableness,
  pp.neuroticism,
  pp.confidence_score,
  pp.assessment_version,
  pp.is_complete,
  u.email
FROM personality_profiles pp
JOIN users u ON pp.user_id = u.id
WHERE u.email = 'claude.test.20250403@example.com';

-- Check if stories saved
SELECT
  ps.question_type,
  LENGTH(ps.story_text) as story_length,
  ps.category,
  ARRAY_LENGTH(ps.themes, 1) as theme_count,
  ps.created_at
FROM profile_stories ps
JOIN users u ON ps.user_id = u.id
WHERE u.email = 'claude.test.20250403@example.com'
ORDER BY ps.created_at DESC
LIMIT 10;
```

---

**Ready to test! 🚀 This will verify the Gold Standard is working as designed.**
