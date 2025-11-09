# Manual Staging Testing Guide - Resume-First Feature

**Date:** 2025-11-08
**Environment:** Staging
**Feature:** Session 22 Resume-First Gap Analysis

---

## 🌐 Environment URLs

**Backend API:**
```
https://cvstomize-api-staging-1036528578375.us-central1.run.app
```

**Frontend:**
```
https://cvstomize-frontend-staging-1036528578375.us-central1.run.app
```

**Health Check:**
```bash
curl https://cvstomize-api-staging-1036528578375.us-central1.run.app/health
```

---

## 🎯 Testing Objectives

1. ✅ Verify resume-first flow accepts existing resume
2. ✅ Validate 2-5 questions generated (not always 5)
3. ✅ Confirm gap analysis identifies strengths/weaknesses
4. ✅ Test HYBRID resume generation (keep + enhance + fill)
5. ✅ Verify backwards compatibility (no resume = 5 questions)
6. ✅ Check ATS score improvement (target: 85-95%)

---

## 📋 Test Scenarios

### Scenario 1: Resume-First Flow (Primary Feature)

**Goal:** Test the new gap analysis with existing resume

**Steps:**

1. **Navigate to Frontend**
   ```
   https://cvstomize-frontend-staging-1036528578375.us-central1.run.app
   ```

2. **Sign In/Create Account**
   - Use Firebase authentication
   - Test email: testuser@example.com

3. **Start Conversation with Resume**

   **Paste this Job Description:**
   ```
   Senior Full-Stack Engineer

   Google is seeking an experienced Senior Full-Stack Engineer to join our Cloud Platform team.

   Requirements:
   - 5+ years experience with React and Node.js
   - Strong AWS/GCP cloud deployment experience
   - Experience leading development teams
   - Expertise in scalable system architecture
   - Strong communication and mentoring skills

   Responsibilities:
   - Design and implement microservices architecture
   - Lead a team of 5-7 engineers
   - Deploy and maintain cloud infrastructure
   - Mentor junior developers
   - Collaborate with product and design teams

   Location: Mountain View, CA (Hybrid)
   Salary: $180,000 - $220,000
   ```

   **Paste this Existing Resume:**
   ```
   John Smith
   Software Engineer
   Email: john.smith@email.com | Phone: (555) 123-4567

   PROFESSIONAL SUMMARY
   Software engineer with 3 years of experience building web applications.

   EXPERIENCE

   Software Engineer, TechCorp Inc. | January 2022 - Present
   - Built web features using JavaScript and React
   - Worked with team on various projects
   - Improved code quality and performance
   - Fixed bugs and added new features

   Junior Developer, StartupCo | June 2020 - December 2021
   - Developed frontend components
   - Assisted senior developers
   - Participated in code reviews

   SKILLS
   - JavaScript, HTML, CSS
   - React (2 years)
   - Node.js (1 year)
   - Git version control
   - Agile methodologies

   EDUCATION
   Bachelor of Science in Computer Science
   State University, 2020
   ```

4. **Expected Behavior:**

   ✅ **System should detect resume** (>100 characters)

   ✅ **Welcome message should acknowledge resume:**
   - "I see you've provided an existing resume!"
   - "I'll analyze the gaps between your resume and this job description"
   - "I'll ask you 2-5 targeted questions to fill those gaps"

   ✅ **Question count should be 2-5 (NOT 5)**
   - Should generate fewer questions because resume already has content
   - Questions should be targeted at specific gaps

   ✅ **Questions should have gapType:**
   - "missing" - Skills/experience completely absent
   - "weak" - Present but needs strengthening
   - "unquantified" - Needs metrics/numbers

5. **Expected Gap Analysis Questions:**

   Example questions the system might ask:

   **Question 1 (Missing: AWS/GCP experience)**
   ```
   "I notice you have JavaScript experience, but the role requires AWS/GCP cloud deployment.
   Have you worked with cloud platforms? Please describe any cloud infrastructure projects,
   even if they were personal or academic."

   Gap Type: missing
   Keywords: AWS, GCP, cloud, deployment
   ```

   **Question 2 (Missing: Leadership experience)**
   ```
   "This role involves leading a team of 5-7 engineers. Have you mentored other developers
   or led any projects? Please share specific examples with team sizes and outcomes."

   Gap Type: missing
   Keywords: leadership, mentoring, team management
   ```

   **Question 3 (Weak: Needs quantification)**
   ```
   "You mentioned improving code quality and performance at TechCorp. Can you quantify
   these improvements? (e.g., reduced load time by 40%, improved test coverage to 90%)"

   Gap Type: unquantified
   Keywords: metrics, impact, performance
   ```

6. **Answer the Questions**

   Provide detailed answers:

   **Answer 1:**
   ```
   "Yes! At TechCorp, I deployed our main application to AWS EC2 and set up RDS for the database.
   I configured Auto Scaling Groups to handle traffic spikes during product launches,
   which reduced our infrastructure costs by 30%. I also implemented CI/CD pipelines using
   GitHub Actions and AWS CodeDeploy. While I haven't used GCP professionally, I completed
   the GCP Associate Cloud Engineer certification and deployed several personal projects to
   Google Cloud Run."
   ```

   **Answer 2:**
   ```
   "I mentored 2 junior developers at TechCorp over the past year. I conducted weekly 1-on-1s,
   reviewed their code, and helped them grow from needing constant guidance to shipping features
   independently. One of my mentees was promoted to mid-level engineer after 8 months.
   I also led our team's migration from JavaScript to TypeScript, coordinating a team of
   4 developers over 3 months."
   ```

   **Answer 3:**
   ```
   "At TechCorp, I refactored our main data fetching layer, which reduced API response time
   from 800ms to 200ms (75% improvement). I also implemented lazy loading for our component
   library, cutting initial bundle size from 2.1MB to 450KB (78% reduction). This improved
   our Lighthouse performance score from 62 to 94. For code quality, I introduced ESLint
   and Prettier, which reduced code review time by about 40% and decreased bugs in production
   by 60% over 6 months."
   ```

7. **Complete Conversation**

   ✅ After answering all questions, click "Complete Profile"

8. **Generate HYBRID Resume**

   ✅ Click "Generate Resume" or navigate to resume generation

   **Expected Behavior:**
   - System loads gap analysis from session
   - System loads existing resume from session
   - Gemini receives HYBRID instructions:
     - **KEEP:** Strong existing content (JavaScript experience, education)
     - **ENHANCE:** Weak sections (quantify TechCorp achievements)
     - **FILL:** Missing content (AWS/GCP from answers, leadership from answers)

9. **Validate HYBRID Output**

   **Original Resume Strengths (Should KEEP):**
   - ✅ Professional summary structure
   - ✅ Education section
   - ✅ Core JavaScript/React skills
   - ✅ Work history timeline

   **Enhanced Sections (Should ENHANCE):**
   - ✅ TechCorp role now has metrics (75% response time improvement)
   - ✅ Skills section now quantified (React: 2 years → 3 years + TypeScript migration)
   - ✅ Code quality achievements now have numbers (60% bug reduction)

   **New Content (Should FILL):**
   - ✅ **New:** AWS/GCP cloud experience section
     - Auto Scaling Groups, 30% cost reduction
     - CI/CD pipelines with GitHub Actions
     - GCP Associate certification
   - ✅ **New:** Leadership & Mentoring section
     - Mentored 2 junior developers
     - Led TypeScript migration (4 developers, 3 months)
     - Promoted mentee to mid-level
   - ✅ **New:** Technical leadership details
     - System architecture decisions
     - Performance optimization initiatives

10. **Check ATS Score**

    ✅ **Target: 85-95%** (vs 60-70% without resume)

    **Keywords Resume Should Now Include:**
    - ✅ AWS, GCP, cloud deployment
    - ✅ Led team, mentored, leadership
    - ✅ Scalable architecture
    - ✅ Microservices
    - ✅ Performance optimization (with metrics)
    - ✅ React, Node.js (with years of experience)

    **ATS Match Validation:**
    - Open job description
    - Ctrl+F to search for key requirements
    - Verify each requirement is now addressed in resume

---

### Scenario 2: From-Scratch Flow (Backwards Compatibility)

**Goal:** Verify the system still works without a resume

**Steps:**

1. **Start New Conversation**

2. **Paste ONLY Job Description** (same as above)
   - Do NOT paste existing resume

3. **Expected Behavior:**

   ✅ Welcome message is generic (no resume mentioned)

   ✅ **Exactly 5 comprehensive questions** (not 2-5)

   ✅ Questions cover all aspects:
   - Technical skills
   - Responsibilities/projects
   - Soft skills
   - Experience level
   - Culture fit

4. **Answer All 5 Questions**

5. **Generate Resume**

   ✅ Resume generated from scratch using answers only

   ✅ No gap analysis (because no existing resume)

   ✅ ATS score: 60-70% (lower than HYBRID mode)

---

### Scenario 3: Resume < 100 Characters (Edge Case)

**Goal:** Test fallback when resume is too short

**Steps:**

1. **Start New Conversation**

2. **Paste Job Description** (same as above)

3. **Paste Invalid Resume:**
   ```
   John Smith
   Developer
   ```
   (Only 22 characters - too short)

4. **Expected Behavior:**

   ✅ System treats it as "no resume"

   ✅ Generates exactly 5 questions (fallback mode)

   ✅ No gap analysis mentioned

---

### Scenario 4: JD < 50 Characters (Edge Case)

**Goal:** Test fallback when job description is too short

**Steps:**

1. **Start New Conversation**

2. **Paste Invalid JD:**
   ```
   Hiring engineer
   ```
   (Only 15 characters - too short)

3. **Paste Valid Resume** (from Scenario 1)

4. **Expected Behavior:**

   ✅ System falls back to generic questions

   ✅ Uses standard personality-based framework

   ✅ No JD-specific analysis

---

## 🧪 Validation Checklist

After completing all scenarios, verify:

### Resume-First Feature:
- [ ] System accepts jobDescription + existingResume parameters
- [ ] Gap analysis identifies strengths/weaknesses/missing content
- [ ] Question count is 2-5 (variable based on gaps)
- [ ] Questions have gapType field (missing/weak/unquantified)
- [ ] HYBRID resume keeps strong original content
- [ ] HYBRID resume enhances weak sections with metrics
- [ ] HYBRID resume fills gaps with conversation answers
- [ ] ATS score is 85-95% (vs 60-70% baseline)

### Backwards Compatibility:
- [ ] No resume = exactly 5 questions
- [ ] From-scratch resume generation still works
- [ ] Generic conversation flow unchanged

### Edge Cases:
- [ ] Resume < 100 chars treated as no resume
- [ ] JD < 50 chars falls back to generic questions
- [ ] System gracefully handles errors

### User Experience:
- [ ] Welcome messages are contextual
- [ ] Questions are clear and specific
- [ ] Resume output is professional quality
- [ ] ATS score is accurately calculated
- [ ] Process completes end-to-end without errors

---

## 📊 Expected Results

| Scenario | Question Count | ATS Score | Gap Analysis | Resume Quality |
|----------|---------------|-----------|--------------|----------------|
| Resume-First (valid) | 2-5 | 85-95% | ✅ Yes | ✅ Excellent (HYBRID) |
| From-Scratch | 5 | 60-70% | ❌ No | ✅ Good (generated) |
| Resume < 100 chars | 5 | 60-70% | ❌ No | ✅ Good (generated) |
| JD < 50 chars | Generic | N/A | ❌ No | ⚠️ Generic |

---

## 🚨 Known Issues & Workarounds

### Issue 1: Session Timeout
**Problem:** If you take too long between questions, session may expire
**Workaround:** Complete conversation in one sitting (< 30 minutes)

### Issue 2: Firebase Auth
**Problem:** May need to sign in multiple times
**Workaround:** Use incognito window for clean session

### Issue 3: CORS Errors
**Problem:** Frontend may show CORS errors in console
**Workaround:** These are warnings only - functionality should still work

---

## 📝 Test Results Template

Copy this template to document your testing:

```markdown
# Staging Test Results - [Your Name] - [Date]

## Scenario 1: Resume-First Flow
- [ ] Resume accepted (>100 chars): YES / NO
- [ ] Question count: ____ (should be 2-5)
- [ ] Gap analysis shown: YES / NO
- [ ] HYBRID resume quality: EXCELLENT / GOOD / POOR
- [ ] ATS score: ____% (target: 85-95%)
- Notes:

## Scenario 2: From-Scratch Flow
- [ ] 5 questions generated: YES / NO
- [ ] Resume quality: EXCELLENT / GOOD / POOR
- [ ] ATS score: ____% (target: 60-70%)
- Notes:

## Scenario 3: Resume < 100 Chars
- [ ] Fallback to 5 questions: YES / NO
- Notes:

## Scenario 4: JD < 50 Chars
- [ ] Fallback to generic: YES / NO
- Notes:

## Overall Assessment
- Passed: ____ / 4 scenarios
- Blocker issues:
- Recommended fixes:
- Ready for production: YES / NO
```

---

## 🎬 Next Steps After Testing

1. **Document Results** - Fill out test results template
2. **Report Issues** - Create GitHub issues for bugs found
3. **Update ROADMAP** - Mark Session 22 testing complete
4. **Production Deployment** - If all tests pass:
   - Deploy backend to production
   - Deploy frontend to production
   - Monitor error logs
   - Test in production environment

---

**Remember:** The resume-first feature is a strategic differentiator for CVstomize. Take time to test thoroughly - this is what sets us apart from competitors!

🚀 Generated with [Claude Code](https://claude.com/claude-code)
