# Testing Guide - CVstomize Production Testing

**Updated:** Session 29 (2025-11-11) - All critical bugs fixed + Resume history added
**Purpose:** Test complete resume generation flow and resume history management
**Tools:** Claude Chrome Extension for automated testing
**Status:** ✅ Production-ready - All Session 28 & 29 bugs fixed

**What's New in Session 29:**
- ✅ Resume history page with search/filter
- ✅ "Alex Johnson" fake contact info bug FIXED
- ✅ Resume cards equal height layout
- ✅ DELETE endpoint for resume management

---

## 🎯 Test Scenario: Resume-First Mode (No Existing Resume)

This tests the **original resume-first flow** where the user does NOT upload an existing resume, and we generate a resume from scratch based on their answers to questions.

---

## 📋 Manual Testing Steps (Without Claude Extension)

### Test Case 1: Fresh Resume Generation

**URL:** https://cvstomize-frontend-351889420459.us-central1.run.app

**Steps:**

1. **Login**
   - Use test account: fco.calisto@gmail.com
   - Or create a new test account

2. **Start Resume Creation**
   - Click "Create Your AI Resume" button
   - Note: Do NOT upload any existing resume
   - Do NOT paste any existing resume text

3. **Paste Job Description**
   ```
   Software Engineer - Full Stack

   We're looking for a talented Full Stack Software Engineer to join our growing team.

   Responsibilities:
   - Build and maintain web applications using React and Node.js
   - Design and implement RESTful APIs
   - Work with PostgreSQL databases
   - Collaborate with product and design teams
   - Write clean, maintainable code

   Requirements:
   - 3+ years of experience in web development
   - Strong knowledge of JavaScript, React, and Node.js
   - Experience with SQL databases
   - Understanding of RESTful API design
   - Bachelor's degree in Computer Science or equivalent
   ```

4. **Answer the Questions**
   - System should generate 2-5 targeted questions (based on gap analysis)
   - UI should say "Answer our questions" (NOT "Answer 11 questions")

   **Sample Answers:**

   Q1: "Tell me about your web development experience..."
   ```
   I've been building web applications for about 4 years. I started with basic HTML/CSS and JavaScript, then learned React and Node.js. I've built several full-stack projects including an e-commerce site and a task management app. I really enjoy creating intuitive user interfaces and solving complex problems with clean code.
   ```

   Q2: "What database experience do you have?"
   ```
   I've worked extensively with PostgreSQL in my personal projects. I designed database schemas for a multi-tenant SaaS application, wrote complex queries with joins and aggregations, and implemented database migrations. I also have some experience with MongoDB for projects that needed flexible schemas.
   ```

   Q3: "Describe a challenging technical problem you solved..."
   ```
   I once had to optimize a slow API endpoint that was timing out. I used database query analysis to find N+1 query issues, implemented caching with Redis, and added database indexes. The endpoint went from 8 seconds to under 200ms. It taught me a lot about performance optimization.
   ```

   Q4: "Tell me about a team project you worked on..."
   ```
   In my last bootcamp project, I led a team of 3 developers building a social media app. I set up the project structure, handled code reviews, and made sure we followed best practices. We used Git for version control and had daily standups. The project was a success and got featured by the bootcamp.
   ```

   Q5: "What motivates you as a developer?"
   ```
   I love the feeling of solving problems and seeing users actually use what I built. I'm motivated by learning new technologies and improving my craft. I enjoy collaborating with others and learning from more experienced developers. The challenge of turning ideas into working software is what drives me.
   ```

5. **Generate Resume**
   - Click "Generate Resume" button
   - Wait for generation (should take 10-30 seconds)

6. **Verify Results - CRITICAL CHECKS**

   **✅ Resume Header/Contact Info Should Show:**
   - **YOUR REAL GOOGLE NAME** (e.g., "Francisco Calisto-Richter")
   - Your real email (from Google account)
   - Phone/location if you entered in profile (or empty if not)
   - **NOT fake names like "Alex Johnson", "John Doe", etc.**

   **✅ Resume Content Should Include:**
   - Professional summary based on your answers
   - Experience section with examples from YOUR answers
   - Skills section with technologies mentioned (React, Node.js, PostgreSQL)
   - Any education or details you mentioned
   - Professional formatting

   **❌ Resume Should NOT Include:**
   - Fake contact names ("Alex Johnson", "John Doe", etc.) ← FIXED Session 29
   - Invented companies you never mentioned
   - Experience you didn't talk about
   - Random placeholder content like [Your Company], [City, State]

   **✅ Download Tests:**
   - Download Markdown (.md file) - Should work
   - Download PDF - Modern template - Should work (HTTP 200, not 500)
   - Download PDF - Classic template - Should work (HTTP 200, not 500)
   - Download PDF - Minimal template - Should work (HTTP 200, not 500)

7. **Test Resume History (NEW - Session 29)**
   - Click "My Resumes" in top-right menu
   - Verify: Resume card appears in grid
   - Verify: Search box filters by title/company
   - Verify: Status filter dropdown works
   - Verify: All cards have equal height
   - Verify: View (eye icon) navigates to resume detail
   - Verify: Download (arrow icon) navigates to download page
   - Verify: Delete (trash icon) shows confirmation, then removes resume

---

## 🤖 Automated Testing with Claude Chrome Extension

### Prerequisites
1. Install Claude Chrome Extension
2. Login to CVstomize app in browser
3. Have the extension open on the CVstomize page

### Test Script for Claude Extension

**Prompt to Claude Extension:**

```
I need you to test the CVstomize resume generation flow. Here's what to do:

1. Navigate to https://cvstomize-frontend-351889420459.us-central1.run.app

2. If not logged in, log in as fco.calisto@gmail.com

3. Click "Create Your AI Resume" button

4. Do NOT upload any existing resume

5. Paste this job description into the Job Description field:
"Software Engineer - Full Stack

We're looking for a talented Full Stack Software Engineer to join our team.

Responsibilities:
- Build web applications using React and Node.js
- Design RESTful APIs
- Work with PostgreSQL databases

Requirements:
- 3+ years of web development experience
- Strong JavaScript, React, Node.js skills
- SQL database experience"

6. Answer each question that appears with realistic responses about web development experience. Use these sample answers:

Q1: "I've built web applications for 4 years using React and Node.js. I created an e-commerce site and task management app."

Q2: "I've worked with PostgreSQL extensively - designed schemas, wrote complex queries, and handled migrations."

Q3: "I optimized a slow API endpoint from 8 seconds to 200ms using caching and database indexes."

Q4: "I led a team of 3 developers building a social media app using Git and agile practices."

Q5: "I'm motivated by solving problems and seeing users benefit from my code. I love learning new technologies."

7. Click "Generate Resume"

8. Wait for generation to complete

9. Check if the resume header shows:
   - YOUR REAL GOOGLE NAME (e.g., "Francisco Calisto-Richter")
   - NOT "Alex Johnson" or any fake name

10. Check if the resume body contains:
   - Your actual answers (web development, React, Node.js, PostgreSQL)
   - Professional formatting
   - NO invented companies or fake content

11. Try downloading:
    - Markdown file
    - PDF - Modern template
    - PDF - Classic template

12. Navigate to "My Resumes" and verify:
    - Resume appears in history
    - Search box works
    - Filter dropdown works
    - View/Download/Delete buttons present

13. Report back:
    - Does header show YOUR REAL GOOGLE NAME (not "Alex Johnson")?
    - Did the resume contain your actual experience?
    - Did all downloads work?
    - Does resume history page work?
    - Were there any errors?
```

### What Claude Extension Should Report

**Expected Success:**
```
✅ Resume generated successfully
✅ Header shows REAL GOOGLE NAME (not "Alex Johnson" or fake name)
✅ Content matches my answers (web dev, React, Node.js, PostgreSQL)
✅ No invented companies or placeholder brackets
✅ Markdown download works
✅ PDF Modern download works
✅ PDF Classic download works
✅ UI shows "Answer our questions" (not "11 questions")
✅ Resume appears in history page
✅ Search/filter works on history page
✅ Equal height cards in grid layout
```

**If There's a Failure:**
```
❌ Resume header shows "Alex Johnson" or fake name → Bug #1 NOT fixed (Should be FIXED Session 29)
❌ PDF downloads return 500 error → Bug #2 NOT fixed (Should be FIXED Session 28)
❌ Resume has invented content → Prompt issue
❌ UI still says "11 questions" → Frontend not deployed correctly (Should be FIXED Session 28)
❌ Resume history stuck on "Loading..." → Session 29 fix not deployed
❌ Cards have different heights → CSS fix not deployed
```

---

## 🔍 What We're Testing

### 1. Resume Generation Without Uploaded CV
**Why:** This tests the original "resume-first" flow where users start from scratch
**Expected:** Resume should be based on conversation answers only (no existing resume)

### 2. Gap Analysis Question Generation
**Why:** System should generate 2-5 targeted questions based on JD analysis
**Expected:** Questions are relevant to the Software Engineer role

### 3. Contact Info Accuracy (Bug #1 - FIXED Session 29)
**Why:** Verify Google displayName shows in header (not "Alex Johnson" fake test data)
**Expected:** Resume header shows user's real Google account name
**Fix Details:** Prioritized Google SSO displayName over user_profiles.fullName

### 4. Content Accuracy
**Why:** Verify resume body contains actual user answers (not invented content)
**Expected:** Resume contains actual details from user's answers

### 5. PDF Generation (Bug #2 - FIXED Session 28)
**Why:** Verify Chromium is installed and working in Docker container
**Expected:** All 3 PDF templates generate successfully (HTTP 200, not 500)
**Fix Details:** Installed Chromium in Dockerfile, configured Puppeteer executable path

### 6. UI Copy Updates (FIXED Session 28)
**Why:** Verify hardcoded question counts are removed
**Expected:** UI says "Answer our questions" not "11 questions in 10 minutes"

### 7. Resume History (NEW - Session 29)
**Why:** Test new resume management features
**Expected:**
- Resume list loads from API (not localStorage)
- Search/filter works instantly
- Cards have equal height
- View/Download/Delete actions work
**Features:** Professional grid layout, tooltips, status chips, confirmation dialogs

---

## 🎯 Success Criteria

**Test PASSES if:**
- ✅ Resume is generated without errors
- ✅ Resume header shows YOUR REAL GOOGLE NAME (not "Alex Johnson")
- ✅ Resume content is based on YOUR answers (not invented)
- ✅ Resume is professional and well-formatted
- ✅ All 4 download formats work (MD + 3 PDFs)
- ✅ No placeholder content like [Your Company], [City, State]
- ✅ UI copy says "Answer our questions" (not "11 questions")
- ✅ Resume history page loads and displays cards
- ✅ Search/filter functionality works
- ✅ All cards have equal height in grid
- ✅ Delete confirmation dialog appears

**Test FAILS if:**
- ❌ Resume header shows "Alex Johnson" or any fake name (Bug #1)
- ❌ Resume contains invented companies you never mentioned
- ❌ PDFs return 500 errors (Bug #2)
- ❌ Resume doesn't reflect your conversation answers
- ❌ UI still shows "11 questions in 10 minutes"
- ❌ Resume history stuck on "Loading resume data..."
- ❌ Cards have inconsistent heights
- ❌ Delete doesn't work or missing confirmation

---

## 📊 Test Results Template

Copy this template and fill it out after testing:

```
## Test Results - CVstomize Production Testing (Session 29 Updated)

**Date:** 2025-11-11
**Tester:** [Your name or "Claude Extension"]
**URL:** https://cvstomize-frontend-351889420459.us-central1.run.app
**Frontend Revision:** cvstomize-frontend-00019-fwm
**API Revision:** cvstomize-api-00126-vpb

### Test Case 1: Generate Resume Without Existing CV

**Job Description Used:** Software Engineer - Full Stack

**Questions Asked:** [How many? e.g., 5 questions]

**Resume Generated:**
- [ ] YES / [ ] NO

**Contact Info Check (Bug #1 - Session 29):**
- [ ] Header shows REAL GOOGLE NAME (e.g., "Francisco Calisto-Richter")
- [ ] NO fake names like "Alex Johnson" or "John Doe"

**Resume Content Check:**
- [ ] Contains my actual answers
- [ ] Professional formatting
- [ ] NO invented companies or fake content
- [ ] NO placeholder brackets [Your Company], [City, State]
- [ ] Relevant to job description

**Download Tests (Bug #2 - Session 28):**
- Markdown: [ ] PASS / [ ] FAIL
- PDF Modern: [ ] PASS / [ ] FAIL
- PDF Classic: [ ] PASS / [ ] FAIL
- PDF Minimal: [ ] PASS / [ ] FAIL

**UI Copy Check (Session 28):**
- [ ] Says "Answer our questions" (not "11 questions")

### Test Case 2: Resume History Management (NEW - Session 29)

**Navigation:**
- [ ] "My Resumes" menu item visible in top-right
- [ ] Clicking navigates to /resume

**Resume History Page:**
- [ ] Page loads (no infinite "Loading...")
- [ ] Resume card appears in grid
- [ ] All cards have equal height
- [ ] Search box present and functional
- [ ] Filter dropdown present and functional

**Card Content:**
- [ ] Title displays correctly
- [ ] Company displays (or empty space if none)
- [ ] Status chip shows (draft/completed/pending)
- [ ] Created date displays
- [ ] Downloaded date shows ("Not yet" if not downloaded)
- [ ] AI tokens count displays (or empty if not available)

**Action Buttons:**
- [ ] View (eye icon) - Navigates to /resume/:id
- [ ] Download (arrow icon) - Navigates to download page
- [ ] Delete (trash icon) - Shows confirmation dialog
- [ ] Delete confirmation - Removes resume from list

**Search & Filter:**
- [ ] Search by title works
- [ ] Search by company works
- [ ] Filter by status works
- [ ] Results count updates correctly
- [ ] "Clear Filters" button appears when needed

**Overall Result:**
- [ ] ✅ ALL TESTS PASSED (100%)
- [ ] ⚠️  SOME TESTS FAILED (details below)

**Issues Found:**
[List any issues with specific test case numbers]

**Notes:**
[Any additional observations]

**Session-Specific Bugs Verified:**
- Bug #1 (Alex Johnson): [ ] FIXED / [ ] NOT FIXED
- Bug #2 (PDF Generation): [ ] FIXED / [ ] NOT FIXED
- Resume History Loading: [ ] WORKING / [ ] BROKEN
- Card Equal Heights: [ ] WORKING / [ ] BROKEN
```

---

## 🚀 Quick Smoke Test (5 Minutes)

If you just want a quick smoke test of all Session 28 & 29 fixes:

1. Go to https://cvstomize-frontend-351889420459.us-central1.run.app
2. Login with test account (fco.calisto@gmail.com)
3. Create resume: Paste any job description
4. Answer 3-5 questions with reasonable responses
5. Generate resume
6. **Check #1:** Does header show YOUR REAL NAME? (not "Alex Johnson") ← Bug #1
7. **Check #2:** Does 1 PDF download work? (not 500 error) ← Bug #2
8. Navigate to "My Resumes" in top menu
9. **Check #3:** Does history page load? (not stuck on "Loading...")
10. **Check #4:** Are cards equal height in grid?

**If all 4 checks pass → Everything is working! 🎉**

**Quick Test Result:**
- Bug #1 (Alex Johnson): [ ] FIXED / [ ] NOT FIXED
- Bug #2 (PDF 500 errors): [ ] FIXED / [ ] NOT FIXED
- Resume History: [ ] WORKING / [ ] BROKEN
- Card Layout: [ ] EQUAL HEIGHT / [ ] UNEQUAL

---

## 📝 Notes for Claude Extension Testing

**Advantages:**
- Can test entire flow automatically
- Can report detailed results
- Can test multiple times with different inputs
- Can verify specific UI elements

**Limitations:**
- Cannot actually open downloaded PDF files
- Cannot verify PDF visual appearance
- May need help with authentication/login

**Best Practice:**
- Use Claude Extension for functional testing (does it work?)
- Use manual testing for UX/visual testing (does it look good?)

---

## 📚 Bug Fix History Reference

### Session 28 Fixes (2025-11-10)
- ✅ **Bug #2:** PDF generation (Chromium + Puppeteer configured)
- ✅ **UI Copy:** Removed hardcoded "11 questions" references
- ✅ **Gemini Preamble:** Regex cleaning removes "Of course..." text
- ✅ **Placeholder Content:** No more [Your Company], [City, State] brackets
- ✅ **Profile Modal:** Option B implementation (pre-generation prompt)
- ✅ **Google Avatar:** CORS/CORP headers fixed for profile photos

### Session 29 Fixes (2025-11-11)
- ✅ **Bug #1:** Contact info shows Google displayName (not "Alex Johnson")
- ✅ **Resume History:** Professional page with API integration (replaced localStorage)
- ✅ **Card Layout:** Equal height cards with minHeight on sections
- ✅ **DELETE Endpoint:** Backend support for resume deletion with ownership verification

### Production Revisions
- **Frontend:** cvstomize-frontend-00019-fwm (Session 29 - Card heights)
- **API:** cvstomize-api-00126-vpb (Session 29 - displayName priority)

---

## 🎯 Known Limitations

**What Claude Extension CAN Test:**
- Resume generation flow
- UI element presence/text
- Navigation between pages
- Button clicks and form submissions
- HTTP response codes (200, 500, etc.)

**What Claude Extension CANNOT Test:**
- Visual appearance of generated PDFs
- PDF content (can only verify download works)
- Complex authentication flows
- File upload (can test paste, not drag-and-drop)

**Recommendation:** Use Claude Extension for functional testing, manual testing for UX/visual verification.

---

**Questions or Issues?** Report back with the test results template above!
