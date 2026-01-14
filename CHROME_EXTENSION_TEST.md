# CVstomize GUI Test Plan - Chrome Extension

## Test Environment
- **Production URL:** https://cvstomize-frontend-351889420459.us-central1.run.app
- **API URL:** https://cvstomize-api-351889420459.us-central1.run.app
- **Test Account:** Use your existing account or create new one
- **Date:** January 14, 2026
- **Issues Tested:** #11 (Quick Tailor Path), #17 (Session Persistence)

## Deployment Status
- **Backend (Issue #17):** ✅ Deployed to production
- **Frontend (Issue #11):** ✅ Deployed to production

---

## Test 1: HomePage Path Cards (Issue #11)

### URL
```
https://cvstomize-frontend-351889420459.us-central1.run.app/dashboard
```

### Expected Results
| Element | Expected Value |
|---------|---------------|
| Third card title | "Tailor to Specific Job" |
| Third card icon | Target/crosshairs icon (TrackChanges) |
| Third card color | Gold/yellow (#fdbb2d) on hover |

### Test Steps
1. Navigate to dashboard
2. Verify all 3 cards are visible
3. Hover over third card - check tooltip shows: "🎯 Quick Tailor (~5 min). Paste a job description and we'll ask targeted questions to build a perfectly tailored resume. Upload your existing resume to make it even faster!"
4. Click third card
5. Verify navigation to `/create-resume`

---

## Test 2: Quick Tailor Flow (Issue #11 + #17)

### URL
```
https://cvstomize-frontend-351889420459.us-central1.run.app/create-resume
```

### Sample Job Description (Copy this)
```
Senior Software Engineer - Backend

About the Role:
We're looking for an experienced backend engineer to join our platform team. You'll be responsible for designing and implementing scalable microservices, optimizing database performance, and mentoring junior developers.

Requirements:
- 5+ years of experience with Node.js, Python, or Go
- Strong experience with PostgreSQL and Redis
- Experience with Kubernetes and Docker
- Familiarity with event-driven architectures (Kafka, RabbitMQ)
- Experience leading technical projects and code reviews
- Strong communication skills for cross-functional collaboration

Nice to Have:
- Experience with GraphQL
- Background in fintech or healthcare
- Open source contributions

Benefits:
- Competitive salary ($150k-$200k)
- Remote-first culture
- Equity package
- Health, dental, vision insurance
```

### Sample Resume Text (Optional - for Gap Analysis mode)
```
John Smith
Senior Software Developer

Experience:
- Software Engineer at TechCorp (2019-2024)
  - Built REST APIs using Node.js and Express
  - Managed PostgreSQL databases with 10M+ records
  - Led team of 3 developers on payment integration project

- Junior Developer at StartupXYZ (2017-2019)
  - Developed frontend features using React
  - Participated in agile sprints and code reviews

Skills: JavaScript, Node.js, React, PostgreSQL, Git, AWS

Education: BS Computer Science, State University (2017)
```

### Test Steps
1. Navigate to `/create-resume`
2. Paste the job description above
3. (Optional) Upload or paste resume text
4. Click "Analyze" or "Start"
5. Answer the generated questions (should be 2-5 with resume, 5 without)
6. Complete the flow
7. Verify resume generation option appears

---

## Test 3: Session Persistence (Issue #17)

### Test Steps
1. Start a new Quick Tailor session with the job description above
2. Answer 1-2 questions
3. **Refresh the browser** (F5 or Cmd+R)
4. Verify session resumes from where you left off
5. Check progress bar shows correct position
6. Continue and complete the session

### Expected Results
- Session state preserved after refresh
- Question progress maintained
- No "Session Not Found" errors
- Messages history intact

---

## Test 4: Multiple Tab/Instance Test (Issue #17)

### Test Steps
1. Open `/create-resume` in Tab 1
2. Start a session with job description
3. Open `/create-resume` in Tab 2 (same browser)
4. Verify Tab 2 can access the same session or start new one
5. Answer question in Tab 1
6. Refresh Tab 2 - verify it shows updated state

---

## Verification Checklist

### Issue #11 - Quick Tailor Path
- [ ] Third card renamed from "Share My Journey" to "Tailor to Specific Job"
- [ ] Icon changed to target/crosshairs
- [ ] Tooltip updated with "Quick Tailor (~5 min)" text
- [ ] Click navigates to `/create-resume` (not `/build-resume`)
- [ ] ConversationalWizard loads correctly
- [ ] JD analysis generates targeted questions
- [ ] Gap analysis mode works with resume upload

### Issue #17 - Session Persistence
- [ ] Session survives browser refresh
- [ ] Session survives closing and reopening browser
- [ ] Progress bar accurate after reload
- [ ] Messages preserved in correct order
- [ ] No data loss during conversation flow
- [ ] Session status tracked (active → completed)

---

## Report Template

Please report back with:

```markdown
## CVstomize GUI Test Report

**Date:** [Date]
**Tester:** Claude Chrome Extension
**Environment:** Production (cvstomize-frontend-351889420459.us-central1.run.app)

### Test 1: HomePage Path Cards
- [ ] PASS / [ ] FAIL
- Notes:

### Test 2: Quick Tailor Flow
- [ ] PASS / [ ] FAIL
- Number of questions generated:
- Notes:

### Test 3: Session Persistence (Refresh)
- [ ] PASS / [ ] FAIL
- Notes:

### Test 4: Multi-Tab Test
- [ ] PASS / [ ] FAIL
- Notes:

### Issues Found
1. [Description of any issues]

### Screenshots
[Attach any relevant screenshots]

### Overall Assessment
[ ] All tests passed - Ready for production
[ ] Some tests failed - See issues above
[ ] Critical failures - Do not deploy
```

---

## Troubleshooting

### If login required
Use Firebase Auth with your test account credentials.

### If API errors occur
Check browser DevTools Console (F12) for error messages.
Look for 4xx/5xx responses in Network tab.

### If session not persisting
1. Check if cookies are enabled
2. Verify Firebase auth token is valid
3. Check Network tab for `/api/conversation/` calls
