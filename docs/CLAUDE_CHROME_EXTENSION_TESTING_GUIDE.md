# Claude Chrome Extension Testing Guide
## Sessions 29-30: Gold Standard + RAG Features

**⚠️ NOTE:** This guide is **SUPERSEDED** by [COMPREHENSIVE_APP_TESTING_GUIDE.md](COMPREHENSIVE_APP_TESTING_GUIDE.md)

**For complete app testing (all 120 tests), use:** [COMPREHENSIVE_APP_TESTING_GUIDE.md](COMPREHENSIVE_APP_TESTING_GUIDE.md)

This guide covers **ONLY** Gold Standard personality assessment and RAG features (subset of comprehensive guide).

---

**Date:** December 3, 2025 (Updated: December 4, 2025)
**Production URL:** https://cvstomize-frontend-351889420459.us-central1.run.app
**API URL:** https://cvstomize-api-351889420459.us-central1.run.app
**Features:** Gold Standard Personality Assessment + RAG Story Retrieval

---

## 📋 Pre-Testing Setup

### 1. Install Claude Chrome Extension
- Open Chrome and go to the Claude Code extension page
- Install the extension
- Pin it to your Chrome toolbar for easy access

### 2. Configure Extension
- Click the Claude icon in Chrome toolbar
- Ensure you're signed into your Claude account
- The extension will interact with the CVstomize web app

### 3. Open Production App
```
URL: https://cvstomize-frontend-351889420459.us-central1.run.app
```

---

## 🧪 Test Suite Overview

**Total Test Scenarios:** 8
**Estimated Time:** 45-60 minutes
**Coverage:** Authentication, Gold Standard Assessment, RAG Integration, Edge Cases

---

## Test 1: Authentication & Dashboard Access

### **Objective:** Verify Firebase authentication and initial user flow

### **Steps:**
1. Open production URL in Chrome
2. Click "Sign Up" or "Get Started"
3. Create new account with test credentials:
   - Email: `test-gold-standard-{timestamp}@example.com`
   - Password: Strong password with 8+ chars

### **Claude Extension Instructions:**
```
"Test the signup flow on this page. Create a new account with email
test-gold-standard-dec3@example.com and password TestPass123!.
Verify that:
1. Form validation works (email format, password strength)
2. Signup succeeds and redirects to dashboard
3. User is authenticated (check for logout button or user menu)
4. No console errors appear
Take screenshots of each step."
```

### **Expected Results:**
- ✅ Signup form validates inputs
- ✅ Account created successfully
- ✅ Redirects to dashboard/onboarding
- ✅ User session persists on page refresh
- ✅ No Firebase auth errors in console

### **Pass/Fail Criteria:**
- **Pass:** User can signup, login, and access dashboard
- **Fail:** Auth errors, redirect failures, or session issues

---

## Test 2: Gold Standard Assessment - Discovery

### **Objective:** Verify premium feature access and navigation to Gold Standard

### **Steps:**
1. From dashboard, look for "Gold Standard" or "Personality Assessment" option
2. Click to access the assessment

### **Claude Extension Instructions:**
```
"Navigate this dashboard and find the Gold Standard Personality Assessment
feature. It might be:
- In the main navigation menu
- As a card/button on the dashboard
- Under Profile or Settings
- As a premium feature prompt

Click on it and verify:
1. Does it check for premium access? (should show upgrade prompt for free users)
2. For premium users, does it open the assessment wizard?
3. Take screenshots of the navigation path."
```

### **Expected Results:**
- ✅ Gold Standard option visible in UI
- ✅ Premium access check works (free users see upgrade CTA)
- ✅ Premium users can access GoldStandardWizard component
- ✅ Route `/gold-standard` loads correctly

### **Pass/Fail Criteria:**
- **Pass:** Assessment is discoverable and access control works
- **Fail:** Cannot find assessment or access control broken

---

## Test 3: Gold Standard - Section A (Behavioral Stories)

### **Objective:** Test story input validation and UX (8 questions)

### **Steps:**
1. Start Gold Standard assessment
2. Complete Section A: 8 behavioral story prompts

### **Claude Extension Instructions:**
```
"Complete Section A of the Gold Standard assessment. There are 8 story questions.
For each question:
1. Read the prompt (e.g., 'Tell me about your proudest professional achievement')
2. Write a realistic 50-100 word story about a relevant experience
3. Verify word count validation (minimum 50 words required)
4. Test navigation (Next/Back buttons)
5. Check if answers persist when navigating back

Test validation by entering only 10 words and trying to proceed -
it should block you. Then add more words to meet the requirement.

Take screenshots of:
- Question 1 prompt
- Word count validation error
- Successful submission of Question 8"
```

### **Sample Stories (if Claude needs examples):**
```
Achievement: "I led a cross-functional team of 5 engineers to migrate our
legacy monolith to microservices architecture. We reduced deployment time
from 2 hours to 15 minutes and improved system reliability by 40%. I
coordinated sprints, resolved conflicts, and delivered the project 2 weeks
ahead of schedule, earning recognition from the VP of Engineering."

Challenge: "When our database crashed during Black Friday, I stayed calm
under pressure. I diagnosed the issue as a connection pool leak, implemented
a hotfix, and restored service within 30 minutes. I then wrote a postmortem
and implemented monitoring to prevent future incidents. This taught me the
importance of resilience and systematic debugging."
```

### **Expected Results:**
- ✅ All 8 questions display with emojis and help text
- ✅ Word count validation enforces 50-word minimum
- ✅ Progress indicator shows completion (e.g., "1/8", "2/8"...)
- ✅ Answers persist when navigating back
- ✅ "Next" button advances to Section B after Question 8

### **Pass/Fail Criteria:**
- **Pass:** All validations work, UX is smooth, data persists
- **Fail:** Validation broken, answers lost, or UI bugs

---

## Test 4: Gold Standard - Section B (BFI-20 Likert Items)

### **Objective:** Test scientifically validated personality questionnaire (20 items)

### **Steps:**
1. Complete Section B: 20 Likert-scale questions
2. Each question is "I see myself as someone who..."

### **Claude Extension Instructions:**
```
"Complete Section B - the BFI-20 Likert questionnaire. There are 20 statements
like 'I see myself as someone who is original, comes up with new ideas'.

For each statement:
1. Verify the 5-point scale displays:
   [Disagree Strongly] [Disagree] [Neutral] [Agree] [Agree Strongly]
2. Select responses that create a HIGH OPENNESS profile:
   - For positive openness items (1, 5, 9, 13, 17): Select 'Agree Strongly'
   - For reverse-scored items (2, 4, 6, etc.): Select 'Disagree Strongly'
3. Verify you cannot proceed until all 20 items are answered
4. Check the progress bar updates

Test validation by trying to click Next with only 10 items answered -
it should block you and show an error message.

Take screenshots of:
- Question format (showing the 5-point scale)
- Progress indicator (e.g., '15/20 completed')
- Validation error when trying to skip questions"
```

### **Expected Results:**
- ✅ All 20 BFI-20 items display correctly
- ✅ 5-point radio buttons work for each item
- ✅ Cannot proceed until all 20 answered
- ✅ Progress bar shows completion percentage
- ✅ Validation message shows missing items

### **Pass/Fail Criteria:**
- **Pass:** All 20 items functional, validation works, UX clear
- **Fail:** Missing items, validation broken, or poor UX

---

## Test 5: Gold Standard - Section C (Hybrid Questions)

### **Objective:** Test trait-specific scenario questions (7 questions)

### **Steps:**
1. Complete Section C: 7 hybrid questions (shorter than stories)
2. These are 30+ word responses

### **Claude Extension Instructions:**
```
"Complete Section C - 7 hybrid questions. These are shorter than Section A
(minimum 30 words instead of 50).

For each question:
1. Write a concise 30-50 word response
2. Verify word count validation (minimum 30 words)
3. Check if the questions are trait-specific scenarios
4. Note if there's a 'Analyzing...' or loading state after the last question

On the 7th question, after clicking 'Complete Assessment':
1. Watch for a loading indicator (analysis in progress)
2. Wait for results to appear (may take 10-30 seconds)
3. Note any error messages or timeout issues

Take screenshots of:
- A hybrid question prompt
- The 'Complete Assessment' button
- Loading/analyzing state
- Results dialog when it appears"
```

### **Expected Results:**
- ✅ 7 hybrid questions display
- ✅ Word count validation enforces 30-word minimum
- ✅ "Complete Assessment" button on Question 7
- ✅ Loading state shows "Analyzing your responses..."
- ✅ Analysis completes within 30 seconds

### **Pass/Fail Criteria:**
- **Pass:** All questions work, analysis completes successfully
- **Fail:** Analysis fails, timeout, or errors

---

## Test 6: Gold Standard - Results Display

### **Objective:** Verify OCEAN scores display correctly after analysis

### **Steps:**
1. View results dialog after assessment completes
2. Verify OCEAN scores and derived traits

### **Claude Extension Instructions:**
```
"Examine the Gold Standard assessment results dialog. It should display:

1. **OCEAN Scores (5 traits, 0-100 scale):**
   - Openness: Should be HIGH (75-95) based on our test answers
   - Conscientiousness: Moderate-High (60-80)
   - Extraversion: Moderate (40-60)
   - Agreeableness: Moderate (40-60)
   - Neuroticism: Low-Moderate (30-50)

2. **Confidence Score:** Should be displayed as a percentage (e.g., '87% confidence')

3. **Derived Traits (4 categories):**
   - Work Style: (e.g., 'Independent' or 'Collaborative')
   - Communication Style: (e.g., 'Analytical' or 'Direct')
   - Leadership Style: (e.g., 'Transformational' or 'Democratic')
   - Motivation Type: (e.g., 'Mastery' or 'Autonomy')

4. **Profile Summary:** A paragraph describing personality

5. **Key Insights:** 3-5 bullet points with actionable insights

Verify each component displays correctly and take a full screenshot of the
results dialog. Check that:
- Scores are reasonable (0-100 range)
- Confidence is reasonable (75-95%)
- Derived traits make sense together
- Summary text is coherent and personalized"
```

### **Expected Results:**
- ✅ All 5 OCEAN scores display (0-100 scale)
- ✅ Openness score is HIGH (75-95) based on test answers
- ✅ Confidence score displays (typically 80-95%)
- ✅ 4 derived traits show with labels
- ✅ Profile summary paragraph appears
- ✅ 3-5 key insights bullets display
- ✅ Results dialog has clear close/continue button

### **Pass/Fail Criteria:**
- **Pass:** All results display correctly, scores in valid ranges
- **Fail:** Missing scores, invalid values, or display errors

---

## Test 7: RAG Story Retrieval - Resume Generation

### **Objective:** Verify stories are stored and retrieved for resume generation

### **Steps:**
1. Navigate to Resume Builder or Resume Generation
2. Create a new resume or edit existing one
3. Verify stories from Gold Standard appear

### **Claude Extension Instructions:**
```
"Navigate to the Resume Builder/Generator. We need to test if the stories
from the Gold Standard assessment are now being used via RAG (semantic search).

Steps:
1. Find the Resume/CV generation feature in the navigation
2. Click 'Create New Resume' or 'Edit Resume'
3. Enter a job description that matches one of the stories you wrote earlier
   Example: 'DevOps Engineer with microservices and CI/CD experience'
4. Generate or update the resume
5. Examine the generated content - look for:
   - Phrases or themes from your Section A stories
   - Relevant accomplishments automatically selected
   - Story content appearing in 'Experience' or 'Achievements' sections

Compare the generated resume with your original stories. Are relevant stories
being matched and included? Take screenshots of:
- The job description input
- The generated resume content
- Any story-matching indicators or UI elements"
```

### **Expected Results:**
- ✅ Resume builder accessible after completing Gold Standard
- ✅ Job description input available
- ✅ Generated resume includes relevant story content
- ✅ Story themes/phrases appear in resume bullets
- ✅ Irrelevant stories are NOT included (semantic matching works)

### **Pass/Fail Criteria:**
- **Pass:** RAG retrieval works, relevant stories appear in resume
- **Fail:** Stories not retrieved, or irrelevant stories included

---

## Test 8: Edge Cases & Error Handling

### **Objective:** Test error scenarios and edge cases

### **Claude Extension Instructions:**
```
"Test edge cases and error handling:

1. **Session Persistence:**
   - Refresh the page during Section A (after answering 3 questions)
   - Verify: Do answers persist or are they lost?
   - Expected: Answers should be saved (check API calls in Network tab)

2. **Network Errors:**
   - Open DevTools (F12) > Network tab
   - Set throttling to 'Slow 3G'
   - Complete Section B and submit
   - Verify: Loading states appear, timeouts handled gracefully
   - Expected: Error messages if request times out

3. **Duplicate Assessment:**
   - Try to access /gold-standard again after completing once
   - Verify: Does it show 'Already complete' message?
   - Expected: Should prevent re-taking or show existing results

4. **Console Errors:**
   - Open DevTools > Console tab
   - Complete the entire assessment flow
   - Check for red errors or warnings
   - Expected: No critical errors (warnings OK)

5. **Mobile Responsiveness:**
   - Open DevTools > Toggle device toolbar
   - Select 'iPhone 12 Pro'
   - Navigate through Gold Standard wizard
   - Verify: UI adapts to mobile, buttons accessible
   - Expected: Responsive design, no layout breaks

Take screenshots of any errors or issues found."
```

### **Expected Results:**
- ✅ Session persistence works (answers auto-saved)
- ✅ Network errors handled gracefully with retry/error UI
- ✅ Cannot re-take assessment without reset
- ✅ No critical console errors
- ✅ Mobile-responsive UI (cards stack, buttons accessible)

### **Pass/Fail Criteria:**
- **Pass:** All edge cases handled gracefully
- **Fail:** Data loss, crashes, or poor error handling

---

## 📊 Test Results Template

Use this template to document your findings:

```markdown
## Test Execution Report
**Date:** [Date]
**Tester:** [Your Name]
**Environment:** Production (cvstomize-frontend-351889420459.us-central1.run.app)
**Browser:** Chrome [Version]

### Test 1: Authentication ✅ PASS / ❌ FAIL
- Signup: [PASS/FAIL]
- Login: [PASS/FAIL]
- Session Persistence: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 2: Gold Standard Discovery ✅ PASS / ❌ FAIL
- Feature Discoverable: [PASS/FAIL]
- Premium Access Control: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 3: Section A (Stories) ✅ PASS / ❌ FAIL
- All 8 questions work: [PASS/FAIL]
- Word count validation: [PASS/FAIL]
- Answer persistence: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 4: Section B (BFI-20) ✅ PASS / ❌ FAIL
- All 20 items work: [PASS/FAIL]
- Validation enforced: [PASS/FAIL]
- Progress tracking: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 5: Section C (Hybrid) ✅ PASS / ❌ FAIL
- All 7 questions work: [PASS/FAIL]
- Analysis completes: [PASS/FAIL]
- Loading states: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 6: Results Display ✅ PASS / ❌ FAIL
- OCEAN scores display: [PASS/FAIL]
- Scores in valid range: [PASS/FAIL]
- Derived traits show: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 7: RAG Integration ✅ PASS / ❌ FAIL
- Resume builder works: [PASS/FAIL]
- Stories retrieved: [PASS/FAIL]
- Semantic matching: [PASS/FAIL]
- Issues: [None / Describe issue]

### Test 8: Edge Cases ✅ PASS / ❌ FAIL
- Session persistence: [PASS/FAIL]
- Error handling: [PASS/FAIL]
- Mobile responsive: [PASS/FAIL]
- Issues: [None / Describe issue]

### Overall Assessment: ✅ READY FOR PRODUCTION / ❌ NEEDS FIXES

### Critical Issues (Blockers):
1. [None / List critical issues]

### Minor Issues (Non-blockers):
1. [None / List minor issues]

### Recommendations:
1. [Any suggestions for improvements]
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: "Cannot find Gold Standard option"
**Solution:**
- Check if user has premium subscription tier
- Look in Profile > Settings > Premium Features
- Try route: `/gold-standard` directly in URL bar

### Issue: "Analysis taking too long (>60 seconds)"
**Possible Causes:**
- Gemini API rate limiting
- Network timeout
- Backend service cold start (first request after idle)

**Solution:**
- Check Network tab in DevTools for failed requests
- Verify API endpoint returns 200 status
- Check backend logs: `gcloud run logs read cvstomize-api --limit 50`

### Issue: "Stories not appearing in resume"
**Possible Causes:**
- Embeddings not generated (pgvector issue)
- RAG retrieval function error
- Job description too generic (no semantic match)

**Solution:**
- Check if `profile_stories` table has `embedding` column populated
- Test with very specific job description matching a story
- Check API response for `/api/resume/generate` endpoint

### Issue: "Console errors about Firebase"
**Expected:** Some Firebase warnings are normal (analytics, remote config)

**Red Flag Errors:**
- "Firebase: No Firebase App '[DEFAULT]' has been created"
- "Auth token expired"
- CORS errors from API

**Solution:** Check `.env` variables for Firebase config

---

## 📸 Required Screenshots

Please capture these screenshots during testing:

1. **Dashboard with Gold Standard option visible**
2. **Section A - Question 1 prompt**
3. **Section A - Word count validation error**
4. **Section B - Likert scale UI**
5. **Section B - Progress indicator showing 15/20**
6. **Section C - Complete Assessment button**
7. **Loading/Analyzing state**
8. **Results dialog with all OCEAN scores**
9. **Resume with RAG-retrieved story content**
10. **Mobile view of wizard (iPhone 12 Pro)**

---

## ✅ Testing Checklist

Use this checklist during testing:

```
[ ] Chrome DevTools open (F12) during entire test session
[ ] Network tab monitored for API calls
[ ] Console tab monitored for errors
[ ] Test account created with known credentials
[ ] Screenshot folder prepared
[ ] Test results template opened for notes
[ ] Tested on desktop (Chrome latest)
[ ] Tested on mobile view (DevTools device emulation)
[ ] All 8 test scenarios completed
[ ] Results documented in template
[ ] Critical issues flagged
[ ] Screenshots attached to report
```

---

## 🚀 Post-Testing Actions

After completing all tests:

1. **Document Results**
   - Fill out the Test Results Template above
   - Save screenshots to `docs/testing/screenshots/`
   - Create GitHub issue for each bug found

2. **Report Findings**
   - Share test results with development team
   - Prioritize issues (Critical, High, Medium, Low)
   - Create bug tickets with reproduction steps

3. **Validate Fixes**
   - Re-test critical issues after fixes deployed
   - Confirm resolution before closing tickets

4. **Production Go/No-Go Decision**
   - ✅ **GO:** All critical tests pass, minor issues acceptable
   - ❌ **NO-GO:** Any critical failures or data loss bugs

---

## 📞 Support & Questions

If you encounter issues during testing:

1. **Check API Health:** https://cvstomize-api-351889420459.us-central1.run.app/health
2. **View Backend Logs:** `gcloud run logs read cvstomize-api --limit 50`
3. **Check Database:** Verify `personality_profiles` and `profile_stories` tables exist
4. **Review Test Coverage:** See `docs/TEST_COVERAGE_ANALYSIS.md` for known limitations

---

## 🎯 Success Criteria

**Gold Standard Deployment is PRODUCTION READY if:**
- ✅ 7/8 test scenarios pass completely
- ✅ Zero critical/blocking bugs
- ✅ OCEAN scores within valid ranges (0-100)
- ✅ RAG story retrieval working (even if not perfect matching)
- ✅ No data loss or session issues
- ✅ Mobile-responsive UI functional

**Deployment should be ROLLED BACK if:**
- ❌ Cannot complete assessment (crashes/errors)
- ❌ Data loss occurs (answers not saved)
- ❌ OCEAN scores invalid (negative, >100, or NaN)
- ❌ Database errors or connection failures
- ❌ Authentication broken (cannot login)

---

## 📝 Notes for Claude Extension Users

When using the Claude Chrome Extension to test:

1. **Be Specific:** Tell Claude exactly what to test (use the instruction blocks above)
2. **Request Screenshots:** Always ask Claude to capture screenshots of key moments
3. **Check Console:** Ask Claude to report any red errors in DevTools Console
4. **Test Incrementally:** Complete one test scenario at a time, document results
5. **Verify API Calls:** Ask Claude to check Network tab for failed requests (status 4xx/5xx)

**Example Claude Prompt:**
```
"I need you to test the Gold Standard personality assessment on this
website: https://cvstomize-frontend-351889420459.us-central1.run.app

Follow the testing guide in the open document. Start with Test 1:
Authentication. Create a test account and verify signup works correctly.
Report any errors you see in the console. Take screenshots of each step."
```

---

## 🏁 End of Testing Guide

**Good luck testing! 🚀**

If all tests pass, Sessions 29-30 are PRODUCTION READY. If issues are found, document them carefully and prioritize fixes before promoting to users.
