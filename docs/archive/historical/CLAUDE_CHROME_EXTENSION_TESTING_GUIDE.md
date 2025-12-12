# 🤖 CVstomize - Agentic Testing Guide for Claude Chrome Extension

**Project**: CVstomize v2.0 - AI-Powered Resume Builder
**Testing Framework**: Claude Chrome Extension Autonomous Testing
**Version**: 1.0
**Date**: 2025-11-04
**Tester**: Claude AI Agent via Chrome Extension

---

## 📋 Testing Scope

This guide enables Claude AI (via Chrome Extension) to autonomously test the CVstomize application end-to-end, including:
- Authentication flows (signup, login, logout)
- Resume generation with personality inference
- Resume limit enforcement (free tier: 1 resume)
- Database persistence verification
- UI/UX validation
- Error handling and edge cases

**Test Environment**:
- **Frontend**: http://localhost:3010
- **Backend API**: https://cvstomize-api-351889420459.us-central1.run.app
- **Database**: PostgreSQL on Cloud SQL (cvstomize-db)
- **Backend Revision**: cvstomize-api-00036-ntj

---

## 🎯 Test Objectives

1. ✅ Verify authentication system works (Firebase)
2. ✅ Test resume generation with database tracking
3. ✅ Validate personality inference from personal stories
4. ✅ Confirm resume limit enforcement (free tier: 1 resume)
5. ✅ Check error handling for all edge cases
6. ✅ Verify data persistence in database
7. ✅ Test user experience and UI responsiveness
8. ✅ Generate comprehensive pass/fail report

---

## 🚀 Pre-Testing Setup

### **Step 1: Verify Test Environment**

**Backend Health Check**:
```bash
curl https://cvstomize-api-351889420459.us-central1.run.app/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T...",
  "uptime": <number>,
  "environment": "production"
}
```

**Frontend Accessibility**:
- Open Chrome browser
- Navigate to: http://localhost:3010
- Should see: CVstomize landing page with "Get Started" button

**Database Connection** (Optional - for verification):
```bash
psql -h 34.67.70.34 -U cvstomize_app -d cvstomize_production -c "SELECT COUNT(*) FROM users;"
```

### **Step 2: Prepare Test Data**

**Test User Credentials**:
- **Email**: `claude-tester-$(date +%s)@test.cvstomize.com`
- **Password**: `TestPass123!`
- **Full Name**: `Claude Agentic Tester`

**Sample Resume Content**:
```
WORK EXPERIENCE:
Senior Software Engineer at TechCorp (2020-2023)
- Led team of 5 engineers building cloud-native applications
- Architected microservices using Node.js and React
- Reduced API response time by 40% through optimization

Software Engineer at StartupXYZ (2018-2020)
- Built RESTful APIs with Python and Django
- Implemented CI/CD pipelines with Jenkins
- Collaborated with product team on user-facing features

EDUCATION:
Bachelor of Science in Computer Science
University of Technology (2014-2018)

SKILLS:
JavaScript, Python, React, Node.js, PostgreSQL, Docker, AWS
```

**Sample Personal Stories**:
```
I love tackling complex technical challenges and breaking them down into manageable pieces. At TechCorp, I led a project to refactor our monolithic application into microservices, which required deep analysis and innovative thinking. I'm naturally curious about new technologies and enjoy experimenting with them in side projects. I work best when collaborating with a team but also value focused deep work sessions. I communicate technical concepts clearly and mentor junior developers regularly.
```

**Sample Job Description**:
```
Senior Full Stack Engineer
We're seeking a Senior Full Stack Engineer to join our growing team. You'll work on our cloud-based SaaS platform, building features that delight our customers.

Requirements:
- 5+ years of software engineering experience
- Strong proficiency in JavaScript/TypeScript and Node.js
- Experience with React and modern frontend frameworks
- Knowledge of PostgreSQL and database design
- Experience with cloud platforms (AWS, GCP, or Azure)
- Excellent communication and collaboration skills
- Passion for writing clean, maintainable code

Responsibilities:
- Design and implement new features across the full stack
- Collaborate with product managers and designers
- Mentor junior engineers and conduct code reviews
- Optimize application performance and scalability
- Participate in technical architecture decisions
```

---

## 🧪 Comprehensive Test Suite: 15 Complete GUI Tests

### **Complete GUI Coverage**

This test suite covers **every** GUI component implemented as of Session 8:
- ✅ Authentication pages (Login, Signup, Reset Password)
- ✅ Navigation bar (responsive, user menu, resume counter)
- ✅ Home page (hero section, CTA buttons, footer)
- ✅ 4-step resume wizard (ProcessModal)
- ✅ Resume display page
- ✅ Protected routes & redirects
- ✅ Error states & validation messages
- ✅ Loading states & spinners
- ✅ Mobile responsiveness (optional)

---

## 🧪 Test Suite: 15 Critical Paths

### **TEST 1: User Registration (New User Signup)**

**Objective**: Verify new users can register successfully

**Steps**:
1. Navigate to http://localhost:3010
2. Click "Sign Up" button (top right corner)
3. Fill registration form:
   - Email: `claude-test-$(date +%s)@test.cvstomize.com` (unique email)
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
4. Click "Sign Up" button
5. Wait for registration to complete (~2-3 seconds)

**Expected Results**:
- ✅ Registration form submits successfully
- ✅ User redirected to home page (http://localhost:3010/)
- ✅ Navbar shows user email (not "Login" button)
- ✅ Resume counter shows "0 / 1 resumes" in navbar
- ✅ Backend creates user in database (`users` table)

**Validation Checks**:
- [ ] No JavaScript errors in browser console
- [ ] Backend API call to `/api/auth/register` returns 201 status
- [ ] Firebase authentication successful
- [ ] User profile created in database

**Pass/Fail Criteria**:
- **PASS**: User successfully registered and logged in, resume counter visible
- **FAIL**: Registration fails, errors displayed, or user not created in database

---

### **TEST 2: User Login (Existing User)**

**Objective**: Verify existing users can log in

**Prerequisites**: Complete TEST 1 first, then log out

**Steps**:
1. Click user menu (top right) → "Logout"
2. Wait for redirect to login page
3. Click "Login" button (top right)
4. Fill login form:
   - Email: (use email from TEST 1)
   - Password: `TestPass123!`
5. Click "Login" button
6. Wait for login to complete (~2 seconds)

**Expected Results**:
- ✅ Login form submits successfully
- ✅ User redirected to home page
- ✅ Navbar shows user email
- ✅ Resume counter shows previous count (0 / 1)
- ✅ Backend verifies credentials via Firebase

**Validation Checks**:
- [ ] No JavaScript errors in console
- [ ] Backend API call to `/api/auth/login` returns 200 status
- [ ] Firebase token stored in localStorage
- [ ] User session persists on page refresh

**Pass/Fail Criteria**:
- **PASS**: User successfully logged in and session restored
- **FAIL**: Login fails, incorrect credentials error, or session not persisted

---

### **TEST 3: Resume Generation - First Resume (Personality Inference)**

**Objective**: Generate first resume with automatic personality inference

**Prerequisites**: User must be logged in (from TEST 1 or TEST 2)

**Steps**:
1. Click "CVstomize" button on home page (or "Generate Resume")
2. Wait for ProcessModal (4-step wizard) to open

**STEP 1: Personal Stories**
3. Paste sample personal stories (from test data above)
4. Click "Next" button
5. Wait for transition to Step 2 (~1 second)

**STEP 2: Resume Upload/Paste**
6. Paste sample resume content (from test data above) into text area
7. Click "Next" button
8. Wait for transition to Step 3

**STEP 3: Job Description**
9. Paste sample job description (from test data above)
10. Click "Next" button
11. Wait for transition to Step 4

**STEP 4: Section Selection**
12. Ensure all sections are selected (default):
    - ✅ Experience
    - ✅ Skills
    - ✅ Education
13. Click "Generate My CV" button
14. Wait for generation to complete (~15-30 seconds)

**Expected Results**:
- ✅ ProcessModal wizard progresses through all 4 steps
- ✅ No validation errors at any step
- ✅ "Generate My CV" button triggers backend API call
- ✅ Success message: "Resume generated! (0 of 1 remaining)"
- ✅ Auto-redirect to resume page after 1.5 seconds
- ✅ Backend saves resume to database (`resumes` table)
- ✅ Backend infers personality from stories (`personality_traits` table)
- ✅ Backend increments user counter (`resumesGenerated` = 1)
- ✅ Resume markdown displayed on resume page
- ✅ Navbar counter updates to "1 / 1 resumes"

**Validation Checks**:
- [ ] No JavaScript errors in console
- [ ] Backend API call to `/api/resume/generate` returns 201 status
- [ ] Response includes `resume.id`, `resume.markdown`, `usage` metadata
- [ ] Personality traits calculated (openness, conscientiousness, etc.)
- [ ] Resume markdown contains job description keywords
- [ ] Resume framed with personality insights (e.g., "innovative", "collaborative")

**Database Verification** (via psql or backend logs):
```sql
-- Check resume created
SELECT id, user_id, title, created_at, tokens_used, cost_usd
FROM resumes
WHERE user_id = (SELECT id FROM users WHERE email = '<test-email>')
ORDER BY created_at DESC LIMIT 1;

-- Check personality traits saved
SELECT openness, conscientiousness, extraversion, work_style, communication_style
FROM personality_traits
WHERE user_id = (SELECT id FROM users WHERE email = '<test-email>');

-- Check user counter incremented
SELECT email, resumes_generated, resumes_limit
FROM users
WHERE email = '<test-email>';
```

**Expected Database State**:
- `resumes` table: 1 new row with resume markdown
- `personality_traits` table: 1 new row with Big Five traits
- `users.resumes_generated`: 1
- `users.resumes_limit`: 1

**Pass/Fail Criteria**:
- **PASS**: Resume generated, personality inferred, database updated, counter incremented
- **FAIL**: Generation fails, no database entry, personality not saved, counter not updated

---

### **TEST 4: Resume Limit Enforcement (Second Resume Attempt)**

**Objective**: Verify free tier limit (1 resume) is enforced

**Prerequisites**: Complete TEST 3 (user has generated 1 resume, limit reached)

**Steps**:
1. Navigate back to home page (http://localhost:3010)
2. Click "CVstomize" button again to open wizard
3. Fill out all 4 steps with different data:
   - **Step 1**: Different personal stories
   - **Step 2**: Different resume text
   - **Step 3**: Different job description
   - **Step 4**: Select sections
4. Click "Generate My CV" button
5. Wait for response (~2-3 seconds)

**Expected Results**:
- ✅ Backend rejects request with 403 Forbidden status
- ✅ Error message displayed in wizard:
  - "🎯 Resume limit reached! Share on social media to unlock more resumes, or upgrade to Pro for unlimited access."
- ✅ Modal stays open (doesn't close)
- ✅ No resume generated or saved to database
- ✅ User counter remains at 1 / 1

**Validation Checks**:
- [ ] Backend API call to `/api/resume/generate` returns 403 status
- [ ] Response includes `error: "Resume limit reached"` and `upgradeUrl: "/pricing"`
- [ ] Frontend displays user-friendly error message
- [ ] No new resume entry in database
- [ ] User counter unchanged (`resumesGenerated` still = 1)

**Database Verification**:
```sql
-- Verify no new resume created
SELECT COUNT(*) FROM resumes WHERE user_id = (SELECT id FROM users WHERE email = '<test-email>');
-- Should return: 1 (same as before)

-- Verify counter unchanged
SELECT resumes_generated FROM users WHERE email = '<test-email>';
-- Should return: 1
```

**Pass/Fail Criteria**:
- **PASS**: Second resume attempt rejected, error message shown, database unchanged
- **FAIL**: Second resume generated, limit not enforced, database updated incorrectly

---

### **TEST 5: Personality Inference Accuracy**

**Objective**: Verify personality traits are correctly inferred from personal stories

**Prerequisites**: Complete TEST 3 (personality traits saved to database)

**Steps**:
1. Query database for personality traits:
```sql
SELECT openness, conscientiousness, extraversion, agreeableness, neuroticism,
       work_style, leadership_style, communication_style, motivation_drivers
FROM personality_traits
WHERE user_id = (SELECT id FROM users WHERE email = '<test-email>');
```

**Expected Results** (based on sample stories):
- ✅ **Openness**: 70-85 (keywords: "innovative", "curious", "experiment")
- ✅ **Conscientiousness**: 65-80 (keywords: "analysis", "deep", "focused")
- ✅ **Extraversion**: 55-70 (keywords: "team", "collaborate", "mentor")
- ✅ **Agreeableness**: 60-75 (keywords: "mentor", "communicate clearly")
- ✅ **Neuroticism**: 30-45 (low - no stress/anxiety keywords)
- ✅ **Work Style**: "collaborative" (keyword: "team")
- ✅ **Leadership Style**: "mentoring" (keyword: "mentor")
- ✅ **Communication Style**: "analytical" (keyword: "technical concepts")
- ✅ **Motivation Drivers**: "achievement,learning" (keywords: "challenges", "curious")

**Validation Checks**:
- [ ] All personality scores between 0-100
- [ ] Traits align with story content (innovative → high openness)
- [ ] Work style matches collaboration keywords
- [ ] Leadership style reflects mentoring keywords
- [ ] Communication style matches technical/analytical tone

**Pass/Fail Criteria**:
- **PASS**: Personality traits reasonably match story content (±15 points acceptable)
- **FAIL**: Traits completely misaligned (e.g., low openness despite "innovative" keywords)

---

### **TEST 6: Resume Quality & Personalization**

**Objective**: Verify generated resume is high-quality and personalized

**Prerequisites**: Complete TEST 3 (resume generated and saved)

**Steps**:
1. Navigate to resume page (should auto-redirect after generation)
2. Inspect displayed resume markdown
3. Verify resume quality

**Expected Results**:

**Content Quality**:
- ✅ Resume includes all sections selected (Experience, Skills, Education)
- ✅ Experience section tailored to job description keywords
- ✅ Skills section matches job requirements
- ✅ Education section formatted correctly
- ✅ No placeholder text like "[Your Name]" or "[Company]"
- ✅ Professional tone and formatting

**Personality-Based Framing** (check for personality influences):
- ✅ **High Openness** → Resume highlights "innovative", "creative" projects
- ✅ **High Conscientiousness** → Emphasizes "attention to detail", "thoroughness"
- ✅ **Collaborative Work Style** → Highlights "team leadership", "cross-functional"
- ✅ **Analytical Communication** → Uses data-driven language, metrics (e.g., "40% improvement")

**Job Description Keyword Matching**:
- ✅ Resume includes keywords from job description:
  - "Full Stack", "Node.js", "React", "PostgreSQL", "Cloud"
  - "Collaboration", "Mentoring", "Code reviews"
  - "Performance optimization", "Scalability"

**ATS Optimization**:
- ✅ Simple markdown structure (no tables, complex formatting)
- ✅ Clear section headers (## Experience, ## Skills)
- ✅ Bullet points for readability
- ✅ Quantified achievements (e.g., "Reduced response time by 40%")

**Validation Checks**:
- [ ] Resume length: 1-2 pages (approximately 400-800 words)
- [ ] No grammatical errors or typos
- [ ] Professional formatting (markdown rendered correctly)
- [ ] Job description keywords present (at least 70% match)
- [ ] Personality-based framing visible in language/tone

**Pass/Fail Criteria**:
- **PASS**: Resume is professional, keyword-optimized, personality-framed, ATS-friendly
- **FAIL**: Resume has placeholders, poor formatting, missing keywords, or generic tone

---

### **TEST 7: Error Handling - Invalid Inputs**

**Objective**: Verify robust error handling for invalid inputs

**Test Cases**:

**7.1: Empty Personal Stories**
1. Open CVstomize wizard
2. Leave Step 1 (Personal Stories) blank
3. Click "Next"
4. **Expected**: Validation error: "Please provide your experience"

**7.2: Empty Job Description**
1. Fill Steps 1-2, leave Step 3 (Job Description) blank
2. Click "Next"
3. **Expected**: Validation error: "Job description is required"

**7.3: No Sections Selected**
1. Fill Steps 1-3, uncheck all sections in Step 4
2. Click "Generate My CV"
3. **Expected**: Validation error: "Please select at least one section"

**7.4: Network Failure Simulation**
- (Cannot test easily without network manipulation)
- **Expected**: User-friendly error message: "Network error. Please try again."

**7.5: Unauthenticated Request**
1. Clear localStorage (Firebase token)
2. Try to generate resume
3. **Expected**: Redirect to login page with message: "Please log in to generate resumes."

**Validation Checks**:
- [ ] All validation errors displayed clearly in UI
- [ ] No JavaScript console errors
- [ ] Wizard doesn't close on validation error
- [ ] User can correct input and retry

**Pass/Fail Criteria**:
- **PASS**: All validation errors caught and displayed properly
- **FAIL**: Invalid inputs accepted, app crashes, or errors not displayed

---

### **TEST 8: Logout & Session Persistence**

**Objective**: Verify logout works and session doesn't persist

**Steps**:
1. While logged in, click user menu (top right)
2. Click "Logout"
3. Wait for redirect (~1 second)
4. Verify logged out state
5. Close browser tab
6. Reopen http://localhost:3010 in new tab

**Expected Results**:
- ✅ User redirected to login page after logout
- ✅ Navbar shows "Login" / "Sign Up" buttons (not user email)
- ✅ Firebase token removed from localStorage
- ✅ Protected routes (e.g., /resume) redirect to login
- ✅ New tab opens to login page (session not persisted after logout)

**Validation Checks**:
- [ ] localStorage.getItem('firebaseToken') returns null
- [ ] Attempting to access protected route → redirects to /login
- [ ] User state cleared from AuthContext

**Pass/Fail Criteria**:
- **PASS**: User successfully logged out, session cleared, protected routes inaccessible
- **FAIL**: User still logged in, session persists, or protected routes accessible

---

### **TEST 9: Navigation Bar - All States & Interactions**

**Objective**: Verify navigation bar displays correctly in all states and all interactions work

**Test 9.1: Logged Out State**
1. Ensure logged out (clear localStorage if needed)
2. Navigate to http://localhost:3010
3. Observe navigation bar

**Expected Results**:
- ✅ CVstomize logo visible (top left)
- ✅ "Login" button visible (top right)
- ✅ "Sign Up" button visible (top right)
- ✅ No user menu or resume counter visible
- ✅ Logo click redirects to home page

**Test 9.2: Logged In State**
1. Log in with test account
2. Observe navigation bar changes

**Expected Results**:
- ✅ CVstomize logo still visible
- ✅ User email displayed (top right, truncated if long)
- ✅ User avatar icon visible (circular, initials or photo)
- ✅ Resume counter visible: "X / Y resumes" format
- ✅ "Login" / "Sign Up" buttons hidden

**Test 9.3: User Menu Dropdown**
1. While logged in, click user avatar/email
2. Observe dropdown menu opens

**Expected Results**:
- ✅ Dropdown opens below user avatar
- ✅ Menu items visible:
  - Email address (non-clickable, header)
  - "My Resumes" link
  - "Logout" button
- ✅ Clicking outside closes dropdown
- ✅ "My Resumes" click navigates to /resume page
- ✅ "Logout" click logs out and redirects

**Test 9.4: Resume Counter Updates**
1. After generating first resume, check counter
2. After hitting limit, check counter

**Expected Results**:
- ✅ Initial state: "0 / 1 resumes"
- ✅ After first resume: "1 / 1 resumes"
- ✅ Counter color changes (e.g., yellow/red at limit)
- ✅ Counter updates without page refresh

**Test 9.5: Responsive Behavior** (Desktop vs Mobile)
1. Resize browser window to mobile width (<600px)
2. Observe navigation bar changes

**Expected Results** (if responsive design implemented):
- ✅ Navigation bar adapts to mobile width
- ✅ Logo remains visible
- ✅ User menu remains functional
- ✅ Text truncates appropriately

**Validation Checks**:
- [ ] Logo image loads correctly
- [ ] All buttons clickable and functional
- [ ] User menu dropdown z-index correct (appears above content)
- [ ] Resume counter formatting correct
- [ ] No layout overflow or text clipping

**Pass/Fail Criteria**:
- **PASS**: All navigation bar states display correctly, all interactions functional
- **FAIL**: Missing elements, broken links, or incorrect state display

---

### **TEST 10: Home Page - Complete UI Validation**

**Objective**: Verify home page displays all content correctly

**Steps**:
1. Navigate to http://localhost:3010
2. Scroll through entire page
3. Test all interactive elements

**Expected Results**:

**Hero Section**:
- ✅ Hero headline visible: "CVstomize" or similar branding
- ✅ Tagline/description visible
- ✅ Primary CTA button: "Get Started" or "CVstomize"
- ✅ Hero image/graphic visible (if implemented)
- ✅ Background gradient/styling renders correctly

**Features Section** (if implemented):
- ✅ Feature cards/tiles visible
- ✅ Icons/images load correctly
- ✅ Feature descriptions readable
- ✅ Proper spacing and alignment

**CTA Buttons**:
- ✅ "Get Started" / "CVstomize" button clickable
- ✅ Button opens ProcessModal wizard (if logged in)
- ✅ Button redirects to login (if logged out)
- ✅ Hover effects work (color change, shadow)

**Footer** (if implemented):
- ✅ Copyright text visible
- ✅ Links functional (Privacy, Terms, Contact)
- ✅ Social media icons (if implemented)

**Content Quality**:
- ✅ No placeholder text ("Lorem ipsum", "[Company Name]")
- ✅ Images load without 404 errors
- ✅ Text readable (proper contrast, font size)
- ✅ Layout not broken (no overflow, proper spacing)

**Validation Checks**:
- [ ] No 404 errors in browser console (images, fonts)
- [ ] Page loads in <3 seconds
- [ ] All images have alt text (accessibility)
- [ ] All buttons have hover states
- [ ] Smooth scroll behavior (if implemented)

**Pass/Fail Criteria**:
- **PASS**: Home page renders completely, all elements functional, professional appearance
- **FAIL**: Missing content, broken images, layout issues, or unprofessional appearance

---

### **TEST 11: ProcessModal Wizard - Complete UI Flow**

**Objective**: Test every UI element and interaction in the 4-step wizard

**Test 11.1: Opening the Modal**
1. Click "CVstomize" / "Get Started" button
2. Observe modal opens

**Expected Results**:
- ✅ Modal opens with smooth animation
- ✅ Background darkens (overlay visible)
- ✅ Modal centered on screen
- ✅ Close button (X) visible in top right
- ✅ Step 1 displayed by default

**Test 11.2: Step 1 - Personal Stories**
1. Observe Step 1 UI elements
2. Test all interactions

**Expected Elements**:
- ✅ Step indicator: "Step 1 of 4" or progress bar
- ✅ Section title: "Your Secret Weapon" or similar
- ✅ Description/instructions visible
- ✅ Large text area for input
- ✅ Placeholder text helpful (e.g., "Share your stories...")
- ✅ Character count indicator (optional)
- ✅ "Next" button visible (bottom right)
- ✅ "Close" or "Cancel" option available

**Interactions**:
- ✅ Text area accepts input
- ✅ Text area expands if content exceeds height
- ✅ "Next" button disabled until minimum content entered (validation)
- ✅ "Next" button enabled after valid input
- ✅ Clicking "Next" transitions to Step 2

**Test 11.3: Step 2 - Resume Upload/Paste**
1. Observe Step 2 UI elements
2. Test file upload and text paste options

**Expected Elements**:
- ✅ Step indicator: "Step 2 of 4"
- ✅ Section title: "Add Your Experience"
- ✅ Two input options visible:
  - File upload area (drag-and-drop or click to upload)
  - Text paste area (alternative to upload)
- ✅ Uploaded file names displayed
- ✅ "Remove file" button for each uploaded file
- ✅ "Back" button visible (bottom left)
- ✅ "Next" button visible (bottom right)

**Interactions - File Upload**:
- ✅ Click upload area opens file picker
- ✅ Drag-and-drop works (highlight on drag-over)
- ✅ Accepts DOCX files (up to 5 files)
- ✅ Rejects invalid file types (PDF, TXT) with error message
- ✅ File size validation (e.g., max 10MB per file)
- ✅ Uploaded file names displayed
- ✅ "Remove file" button removes file from list

**Interactions - Text Paste**:
- ✅ Text area accepts pasted resume text
- ✅ Text area scrolls if content exceeds height
- ✅ If file uploaded, text area disabled (or vice versa)
- ✅ Validation: At least one option required (file OR text)

**Interactions - Navigation**:
- ✅ "Back" button returns to Step 1
- ✅ "Next" button validates input (file or text required)
- ✅ "Next" button transitions to Step 3

**Test 11.4: Step 3 - Job Description**
1. Observe Step 3 UI elements
2. Test job description input

**Expected Elements**:
- ✅ Step indicator: "Step 3 of 4"
- ✅ Section title: "Paste Job Description"
- ✅ Large text area for job description
- ✅ Placeholder text: "Paste the full job posting..."
- ✅ Character count indicator (optional, shows min 50 words)
- ✅ "Back" and "Next" buttons visible

**Interactions**:
- ✅ Text area accepts pasted job description
- ✅ Text area scrolls for long content
- ✅ Validation: Minimum 50 characters or 10 words required
- ✅ "Next" button disabled until valid input
- ✅ "Back" button returns to Step 2
- ✅ "Next" button transitions to Step 4

**Test 11.5: Step 4 - Section Selection**
1. Observe Step 4 UI elements
2. Test section selection checkboxes

**Expected Elements**:
- ✅ Step indicator: "Step 4 of 4"
- ✅ Section title: "Customize CV Sections"
- ✅ Checkbox list of sections:
  - ✅ Experience
  - ✅ Skills
  - ✅ Education
  - ✅ Projects (optional)
  - ✅ Certifications (optional)
  - ✅ Others (if implemented)
- ✅ All checkboxes checked by default (recommended)
- ✅ "Back" button visible
- ✅ "Generate My CV" button visible (primary action)

**Interactions**:
- ✅ Checkboxes toggleable (click to check/uncheck)
- ✅ At least one section must be selected (validation)
- ✅ "Generate My CV" button disabled if no sections selected
- ✅ "Back" button returns to Step 3
- ✅ "Generate My CV" button triggers resume generation

**Test 11.6: Resume Generation Progress**
1. Click "Generate My CV" in Step 4
2. Observe loading state

**Expected Elements**:
- ✅ Loading spinner/indicator appears
- ✅ Progress message: "Generating your resume..." or similar
- ✅ "Generate My CV" button disabled during generation
- ✅ All form inputs disabled during generation
- ✅ User cannot close modal during generation (optional)

**Test 11.7: Success State**
1. Wait for resume generation to complete (~15-30 seconds)
2. Observe success feedback

**Expected Elements**:
- ✅ Success message appears: "Resume generated!"
- ✅ Resume usage displayed: "1 / 1 resumes remaining"
- ✅ Loading spinner disappears
- ✅ Auto-redirect to resume page after 1-2 seconds
- ✅ Modal closes automatically after redirect

**Test 11.8: Error State**
1. Trigger error (e.g., hit resume limit, network failure)
2. Observe error feedback

**Expected Elements**:
- ✅ Error message displayed prominently
- ✅ Error message user-friendly (not technical jargon)
- ✅ Error icon/styling (red color, alert icon)
- ✅ Modal remains open (doesn't auto-close)
- ✅ "Generate My CV" button re-enabled after error
- ✅ User can correct input or close modal

**Test 11.9: Modal Close Behavior**
1. Click "X" close button at any step
2. Click outside modal (on overlay)

**Expected Results**:
- ✅ Modal closes immediately
- ✅ Form inputs reset (data not saved)
- ✅ User returned to home page
- ✅ No errors in console

**Validation Checks**:
- [ ] All 4 steps display correctly
- [ ] Navigation buttons (Back, Next, Generate) functional
- [ ] Validation errors display clearly
- [ ] Loading states prevent duplicate submissions
- [ ] Success/error feedback visible and clear
- [ ] Modal responsive (fits on smaller screens)
- [ ] No JavaScript errors during wizard flow

**Pass/Fail Criteria**:
- **PASS**: All 4 steps functional, validation works, generation succeeds, error handling robust
- **FAIL**: Steps broken, validation missing, generation fails, or errors not handled

---

### **TEST 12: Resume Display Page - Complete UI**

**Objective**: Verify resume page displays generated resume correctly

**Prerequisites**: Complete TEST 3 (resume generated)

**Steps**:
1. Navigate to http://localhost:3010/resume (should auto-redirect after generation)
2. Observe resume display
3. Test all interactions

**Expected Elements**:

**Page Layout**:
- ✅ Resume markdown rendered as HTML
- ✅ Proper section headings (## Experience, ## Skills, etc.)
- ✅ Bullet points formatted correctly
- ✅ Professional typography (readable font, proper spacing)
- ✅ No raw markdown visible (e.g., no "##" symbols)

**Content Display**:
- ✅ All selected sections present (Experience, Skills, Education)
- ✅ Content matches generated resume from TEST 3
- ✅ No placeholder text or errors
- ✅ Proper line breaks and paragraph spacing
- ✅ Hyperlinks clickable (if resume contains URLs)

**Action Buttons** (if implemented):
- ✅ "Download PDF" button visible
- ✅ "Download DOCX" button visible (optional)
- ✅ "Edit" button visible (optional)
- ✅ "Generate New Resume" button visible
- ✅ "Share" button visible (optional)

**Interactions**:
- ✅ "Download PDF" button triggers PDF download
- ✅ Downloaded PDF matches displayed resume
- ✅ "Generate New Resume" button opens ProcessModal wizard
- ✅ Browser back button returns to home page

**Styling & Format**:
- ✅ Resume width appropriate (not too wide or narrow)
- ✅ Margins and padding professional
- ✅ Colors consistent with brand (not too colorful)
- ✅ Print-friendly styling (if using @media print CSS)
- ✅ No layout overflow or text clipping

**Validation Checks**:
- [ ] Markdown parsing correct (no rendering errors)
- [ ] All sections rendered
- [ ] Download button functional
- [ ] Page responsive (mobile-friendly)
- [ ] No console errors

**Pass/Fail Criteria**:
- **PASS**: Resume displays professionally, all content present, download works
- **FAIL**: Rendering errors, missing content, broken download, or unprofessional appearance

---

### **TEST 13: Password Reset Flow - Complete UI**

**Objective**: Test password reset page and flow

**Steps**:
1. Navigate to login page
2. Click "Forgot Password?" link
3. Enter email and submit
4. Observe confirmation

**Expected Elements**:

**Reset Password Page**:
- ✅ Page title: "Reset Password" or similar
- ✅ Instructions: "Enter your email to receive a reset link"
- ✅ Email input field with validation
- ✅ "Send Reset Link" button
- ✅ "Back to Login" link

**Form Validation**:
- ✅ Email field required (error if empty)
- ✅ Email format validated (error if invalid)
- ✅ Error messages display clearly
- ✅ Success message after submission

**Interactions**:
- ✅ Email input accepts text
- ✅ "Send Reset Link" button submits form
- ✅ Loading spinner during submission
- ✅ Success message: "Reset link sent to your email"
- ✅ Auto-redirect to login after 2 seconds (optional)
- ✅ "Back to Login" link returns to login page

**Validation Checks**:
- [ ] Firebase password reset API called
- [ ] Success message displays even if email doesn't exist (security best practice)
- [ ] No console errors
- [ ] Form prevents multiple submissions (button disabled during loading)

**Pass/Fail Criteria**:
- **PASS**: Reset flow functional, email sent, UI clear and professional
- **FAIL**: Form doesn't submit, errors not handled, or confusing UX

---

### **TEST 14: Protected Routes & Redirects**

**Objective**: Verify authentication-based route protection works correctly

**Test 14.1: Unauthenticated Access to Protected Routes**
1. Ensure logged out (clear localStorage)
2. Attempt to navigate to protected routes directly:
   - http://localhost:3010/resume
   - http://localhost:3010/dashboard (if exists)
   - Any other protected route

**Expected Results**:
- ✅ Immediate redirect to /login page
- ✅ URL changes to /login
- ✅ Login page displays with message: "Please log in to access this page" (optional)
- ✅ After login, user redirected to originally requested page (optional)

**Test 14.2: Authenticated Access to Public Routes**
1. Log in with test account
2. Navigate to public routes:
   - http://localhost:3010/login
   - http://localhost:3010/signup

**Expected Results**:
- ✅ Automatic redirect to home page (/)
- ✅ Public routes not accessible when logged in (prevents confusion)

**Test 14.3: Session Expiration Handling**
1. Log in with test account
2. Manually expire Firebase token (edit localStorage to set old timestamp)
3. Try to access protected route or generate resume

**Expected Results**:
- ✅ Token validation fails
- ✅ User redirected to login page
- ✅ Error message: "Session expired. Please log in again."
- ✅ Previous page state not lost (optional - show after re-login)

**Validation Checks**:
- [ ] All protected routes redirect correctly when unauthenticated
- [ ] Public routes redirect when already authenticated
- [ ] Token expiration handled gracefully
- [ ] No infinite redirect loops
- [ ] No console errors during redirects

**Pass/Fail Criteria**:
- **PASS**: All route protections functional, redirects smooth, no auth bypass possible
- **FAIL**: Protected routes accessible without auth, redirect logic broken, or infinite loops

---

### **TEST 15: Comprehensive Error Handling & Edge Cases**

**Objective**: Test all error states and edge cases across the application

**Test 15.1: Network Failures**
1. Disable network (browser DevTools → Network tab → Offline mode)
2. Attempt to log in
3. Attempt to generate resume
4. Re-enable network

**Expected Results**:
- ✅ Login attempt shows error: "Network error. Please check your connection."
- ✅ Resume generation shows error: "Failed to connect. Please try again."
- ✅ Errors display with friendly message (not raw error stack)
- ✅ "Retry" button visible (optional)
- ✅ After network restored, retry succeeds

**Test 15.2: API Errors (Backend Down)**
1. Stop backend API (or simulate 500 error)
2. Attempt to register/login/generate resume

**Expected Results**:
- ✅ Error message: "Service temporarily unavailable. Please try again later."
- ✅ No raw error objects displayed to user
- ✅ User can close error and retry

**Test 15.3: Invalid JWT Token**
1. Manually corrupt Firebase token in localStorage
2. Attempt to access protected route or generate resume

**Expected Results**:
- ✅ Token validation fails
- ✅ User redirected to login
- ✅ Corrupted token cleared from localStorage
- ✅ Error message: "Invalid session. Please log in again."

**Test 15.4: Extremely Long Inputs**
1. Paste 10,000+ character text into personal stories
2. Paste 20+ files in resume upload
3. Paste 50,000+ character job description

**Expected Results**:
- ✅ Input fields have character limits (with warning message)
- ✅ File upload limited to 5 files (additional files rejected)
- ✅ Backend validates input size (rejects oversized requests)
- ✅ Error message: "Input too large. Please shorten your text."

**Test 15.5: Special Characters & Unicode**
1. Enter special characters in inputs: `<script>alert('XSS')</script>`
2. Enter emoji and non-Latin characters: 🎓 你好 مرحبا

**Expected Results**:
- ✅ XSS attempts sanitized (no script execution)
- ✅ Emoji and Unicode characters display correctly
- ✅ Resume generation handles special characters properly
- ✅ No encoding errors or garbled text

**Test 15.6: Browser Compatibility** (Optional - Multi-Browser)
1. Test application in Chrome, Firefox, Safari, Edge
2. Verify all features work across browsers

**Expected Results**:
- ✅ UI renders correctly in all browsers
- ✅ Authentication works cross-browser
- ✅ Resume generation functional
- ✅ No browser-specific JavaScript errors

**Test 15.7: Slow Internet Connection**
1. Simulate slow 3G network (DevTools → Network throttling)
2. Generate resume

**Expected Results**:
- ✅ Loading spinner visible throughout (doesn't disappear early)
- ✅ Request doesn't timeout prematurely (<60 seconds)
- ✅ Success message displays after completion
- ✅ No "hanging" state (loading forever)

**Validation Checks**:
- [ ] All error messages user-friendly (no stack traces)
- [ ] Network errors handled gracefully
- [ ] Backend errors don't crash frontend
- [ ] Input validation prevents malicious content
- [ ] Special characters handled correctly
- [ ] Slow connections don't cause UI issues

**Pass/Fail Criteria**:
- **PASS**: All error states handled gracefully, no crashes, user can recover from errors
- **FAIL**: Errors crash app, sensitive data exposed, or user cannot recover

---

## 📊 Test Execution Plan for Claude Chrome Extension

### **How to Run This Test Suite Autonomously**

**Option 1: Sequential Execution (Recommended)**
Execute all 15 tests in order with dependencies:

**Core Authentication Flow** (Tests 1-2):
1. TEST 1 (Registration) - Create new user
2. TEST 2 (Login) - Verify existing user login

**Resume Generation Flow** (Tests 3-6):
3. TEST 3 (First Resume) - Generate resume with personality inference
4. TEST 4 (Limit Enforcement) - Verify free tier limit (1 resume)
5. TEST 5 (Personality Inference) - Validate trait accuracy
6. TEST 6 (Resume Quality) - Verify personalization and content quality

**Core Application Flows** (Tests 7-8):
7. TEST 7 (Error Handling - Invalid Inputs) - Test form validation
8. TEST 8 (Logout) - Verify session management

**Complete GUI Coverage** (Tests 9-15):
9. TEST 9 (Navigation Bar) - All states and interactions
10. TEST 10 (Home Page) - Complete UI validation
11. TEST 11 (ProcessModal Wizard) - All 4 steps and interactions
12. TEST 12 (Resume Display Page) - Complete UI and download
13. TEST 13 (Password Reset) - Complete flow
14. TEST 14 (Protected Routes) - Authentication guards
15. TEST 15 (Error Handling & Edge Cases) - Comprehensive error states

**Option 2: Parallel Execution (Advanced)**
Tests can be grouped for parallel execution:
- **Group A** (Tests 1-4): Sequential (authentication + resume generation)
- **Group B** (Tests 5-6): Parallel after Group A (independent validations)
- **Group C** (Tests 7-8): Parallel with Group B (independent flows)
- **Group D** (Tests 9-15): Parallel after Groups A-C (GUI validation)

### **Autonomous Testing Instructions for Claude**

**Step 1: Open Chrome Browser**
- Navigate to: http://localhost:3010

**Step 2: Execute Test Suite**
For each test (TEST 1-8):
1. Read test steps carefully
2. Interact with web page (click buttons, fill forms, observe results)
3. Validate expected results vs. actual results
4. Record PASS or FAIL for each validation check
5. Capture screenshots for failed tests (optional)
6. Document any unexpected errors or warnings

**Step 3: Database Verification** (Optional)
For tests requiring database checks (TEST 3, 4, 5):
- Execute SQL queries via psql or backend API
- Compare actual database state vs. expected state

**Step 4: Generate Final Report**
- Compile all test results
- Calculate pass rate: (passed tests / total tests) × 100%
- List all failed tests with reasons
- Provide recommendations for fixes

---

## 📋 Final Report Template

```markdown
# CVstomize - Agentic Test Execution Report

**Date**: <execution-date>
**Tester**: Claude AI Agent (Chrome Extension)
**Environment**: Production (cvstomize-api-00036-ntj)
**Frontend**: http://localhost:3010
**Backend**: https://cvstomize-api-351889420459.us-central1.run.app

---

## Executive Summary

- **Total Tests**: 15
- **Passed**: X / 15
- **Failed**: Y / 15
- **Pass Rate**: Z%
- **Execution Time**: <total-time>
- **Critical Tests Passed**: X / 8 (Tests 1-8)
- **GUI Tests Passed**: X / 7 (Tests 9-15)

**Overall Status**: ✅ PASS / ❌ FAIL
**Production Ready**: ✅ YES / ❌ NO (requires 13/15 passing, 87% minimum)

---

## Test Results

### TEST 1: User Registration ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] No JavaScript errors: <PASS/FAIL>
  - [ ] API returns 201: <PASS/FAIL>
  - [ ] User created in database: <PASS/FAIL>
  - [ ] Resume counter shows 0/1: <PASS/FAIL>
- **Issues Found**: <list any issues>
- **Screenshots**: <attach if failure>

### TEST 2: User Login ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] Login successful: <PASS/FAIL>
  - [ ] Session persisted: <PASS/FAIL>
  - [ ] Token stored: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 3: Resume Generation (First Resume) ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] All 4 steps completed: <PASS/FAIL>
  - [ ] Resume generated: <PASS/FAIL>
  - [ ] Database entry created: <PASS/FAIL>
  - [ ] Personality inferred: <PASS/FAIL>
  - [ ] Counter incremented (1/1): <PASS/FAIL>
- **Issues Found**: <list any issues>
- **Resume ID**: <database-id>
- **Tokens Used**: <count>
- **Cost**: $<amount>

### TEST 4: Resume Limit Enforcement ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] 403 error returned: <PASS/FAIL>
  - [ ] Error message displayed: <PASS/FAIL>
  - [ ] No new database entry: <PASS/FAIL>
  - [ ] Counter unchanged (1/1): <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 5: Personality Inference Accuracy ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Actual Traits**:
  - Openness: <value> (expected 70-85)
  - Conscientiousness: <value> (expected 65-80)
  - Extraversion: <value> (expected 55-70)
  - Work Style: <value> (expected "collaborative")
  - Communication Style: <value> (expected "analytical")
- **Validation**: <PASS/FAIL> (traits within expected ranges)
- **Issues Found**: <list any issues>

### TEST 6: Resume Quality & Personalization ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] All sections present: <PASS/FAIL>
  - [ ] Keyword matching (70%+): <PASS/FAIL>
  - [ ] Personality framing visible: <PASS/FAIL>
  - [ ] ATS-friendly formatting: <PASS/FAIL>
  - [ ] Professional tone: <PASS/FAIL>
- **Keyword Match Rate**: <percentage>
- **Issues Found**: <list any issues>

### TEST 7: Error Handling (Invalid Inputs) ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Sub-Tests**:
  - [ ] 7.1 Empty stories: <PASS/FAIL>
  - [ ] 7.2 Empty job description: <PASS/FAIL>
  - [ ] 7.3 No sections selected: <PASS/FAIL>
  - [ ] 7.5 Unauthenticated request: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 8: Logout & Session Persistence ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] Logout successful: <PASS/FAIL>
  - [ ] Token cleared: <PASS/FAIL>
  - [ ] Protected routes inaccessible: <PASS/FAIL>
  - [ ] Session not persisted: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 9: Navigation Bar - All States & Interactions ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Sub-Tests**:
  - [ ] 9.1 Logged out state: <PASS/FAIL>
  - [ ] 9.2 Logged in state: <PASS/FAIL>
  - [ ] 9.3 User menu dropdown: <PASS/FAIL>
  - [ ] 9.4 Resume counter updates: <PASS/FAIL>
  - [ ] 9.5 Responsive behavior: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 10: Home Page - Complete UI Validation ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] Hero section renders: <PASS/FAIL>
  - [ ] CTA buttons functional: <PASS/FAIL>
  - [ ] Features section (if implemented): <PASS/FAIL>
  - [ ] Footer renders: <PASS/FAIL>
  - [ ] No placeholder text: <PASS/FAIL>
  - [ ] Professional appearance: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 11: ProcessModal Wizard - Complete UI Flow ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Sub-Tests**:
  - [ ] 11.1 Modal opening: <PASS/FAIL>
  - [ ] 11.2 Step 1 (Personal Stories): <PASS/FAIL>
  - [ ] 11.3 Step 2 (Resume Upload): <PASS/FAIL>
  - [ ] 11.4 Step 3 (Job Description): <PASS/FAIL>
  - [ ] 11.5 Step 4 (Section Selection): <PASS/FAIL>
  - [ ] 11.6 Generation progress: <PASS/FAIL>
  - [ ] 11.7 Success state: <PASS/FAIL>
  - [ ] 11.8 Error state: <PASS/FAIL>
  - [ ] 11.9 Modal close behavior: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 12: Resume Display Page - Complete UI ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] Markdown rendered correctly: <PASS/FAIL>
  - [ ] All sections present: <PASS/FAIL>
  - [ ] Action buttons functional: <PASS/FAIL>
  - [ ] Download works: <PASS/FAIL>
  - [ ] Professional formatting: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 13: Password Reset Flow - Complete UI ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Validation Checks**:
  - [ ] Reset page renders: <PASS/FAIL>
  - [ ] Form validation works: <PASS/FAIL>
  - [ ] Email submission succeeds: <PASS/FAIL>
  - [ ] Success message displays: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 14: Protected Routes & Redirects ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Sub-Tests**:
  - [ ] 14.1 Unauthenticated access blocked: <PASS/FAIL>
  - [ ] 14.2 Authenticated redirects from public routes: <PASS/FAIL>
  - [ ] 14.3 Session expiration handled: <PASS/FAIL>
- **Issues Found**: <list any issues>

### TEST 15: Error Handling & Edge Cases ✅ PASS / ❌ FAIL
- **Status**: <PASS/FAIL>
- **Duration**: <time>
- **Sub-Tests**:
  - [ ] 15.1 Network failures: <PASS/FAIL>
  - [ ] 15.2 API errors: <PASS/FAIL>
  - [ ] 15.3 Invalid JWT token: <PASS/FAIL>
  - [ ] 15.4 Extremely long inputs: <PASS/FAIL>
  - [ ] 15.5 Special characters & Unicode: <PASS/FAIL>
  - [ ] 15.6 Browser compatibility: <PASS/FAIL>
  - [ ] 15.7 Slow internet connection: <PASS/FAIL>
- **Issues Found**: <list any issues>

---

## Critical Issues Found

### High Priority (Blocking)
1. <issue-description> (TEST X)
2. <issue-description> (TEST Y)

### Medium Priority (Non-blocking)
1. <issue-description> (TEST Z)

### Low Priority (Cosmetic)
1. <issue-description>

---

## Recommendations

1. **Fix Critical Issues**: <list fixes>
2. **Improve Error Messages**: <suggestions>
3. **Optimize Performance**: <suggestions>
4. **Enhance UI/UX**: <suggestions>

---

## Database State After Testing

**Users Created**: <count>
**Resumes Generated**: <count>
**Personality Traits Saved**: <count>

**Sample Data** (for verification):
```sql
-- Test user details
SELECT id, email, resumes_generated, resumes_limit, created_at FROM users WHERE email LIKE '%claude-test%';

-- Resumes generated
SELECT id, user_id, title, created_at, tokens_used, cost_usd FROM resumes ORDER BY created_at DESC LIMIT 3;

-- Personality traits
SELECT user_id, openness, conscientiousness, extraversion FROM personality_traits ORDER BY created_at DESC LIMIT 1;
```

---

## Conclusion

<overall-assessment>

**Next Steps**:
1. <action-item>
2. <action-item>
3. <action-item>

---

**Report Generated**: <timestamp>
**Execution Environment**: Claude Chrome Extension + CVstomize v2.0
**Backend Revision**: cvstomize-api-00036-ntj
```

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

**Issue 1: Frontend Not Loading**
- **Symptom**: http://localhost:3010 doesn't respond
- **Solution**: Run `cd /mnt/storage/shared_windows/Cvstomize && PORT=3010 npm start`

**Issue 2: Backend Health Check Fails**
- **Symptom**: curl to /health returns error
- **Solution**: Verify Cloud Run service is deployed (check revision cvstomize-api-00036-ntj)

**Issue 3: Database Connection Error**
- **Symptom**: API returns 500 with "Database connection failed"
- **Solution**: Check Cloud SQL instance is running, verify connection string secret

**Issue 4: Resume Generation Takes Too Long**
- **Symptom**: Generation hangs for >60 seconds
- **Solution**: Check Gemini API quota, verify Vertex AI service account permissions

**Issue 5: Personality Traits Not Saved**
- **Symptom**: Database query shows NULL personality traits
- **Solution**: Verify personal stories contain analyzable text (>50 words)

---

## 📚 Additional Resources

**Documentation**:
- [ROADMAP.md](ROADMAP.md) - Complete project roadmap with session notes
- [SESSION_8_COMPLETE.md](SESSION_8_COMPLETE.md) - Latest session summary
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - Database & API credentials
- [TESTING_SECURITY_STRATEGY.md](TESTING_SECURITY_STRATEGY.md) - QA framework

**Backend API Docs**:
- OpenAPI/Swagger: https://cvstomize-api-351889420459.us-central1.run.app/docs
- Health Check: https://cvstomize-api-351889420459.us-central1.run.app/health

**Database Access**:
```bash
# Connect to PostgreSQL
psql -h 34.67.70.34 -U cvstomize_app -d cvstomize_production

# Password stored in Secret Manager:
gcloud secrets versions access latest --secret="cvstomize-db-password"
```

---

## 🎯 Success Criteria

**Minimum Acceptable Results** (to pass test suite):
- ✅ 13/15 tests passing (87% pass rate minimum)
- ✅ All critical path tests passing (TEST 1, 2, 3, 4 - **MANDATORY**)
- ✅ Core authentication tests passing (TEST 1, 2, 8 - **MANDATORY**)
- ✅ No high-priority blocking issues
- ✅ Database consistency maintained
- ✅ No security vulnerabilities exposed
- ✅ Production-ready status achieved

**Critical Tests (Must Pass 8/8)**:
1. ✅ TEST 1: User Registration
2. ✅ TEST 2: User Login
3. ✅ TEST 3: First Resume Generation
4. ✅ TEST 4: Resume Limit Enforcement
5. ✅ TEST 5: Personality Inference Accuracy
6. ✅ TEST 6: Resume Quality & Personalization
7. ✅ TEST 7: Error Handling (Invalid Inputs)
8. ✅ TEST 8: Logout & Session Persistence

**GUI Tests (Must Pass 5/7 minimum)**:
9. ✅ TEST 9: Navigation Bar (recommended)
10. ✅ TEST 10: Home Page (recommended)
11. ✅ TEST 11: ProcessModal Wizard (highly recommended)
12. ✅ TEST 12: Resume Display Page (highly recommended)
13. ⭕ TEST 13: Password Reset (optional)
14. ✅ TEST 14: Protected Routes (recommended)
15. ⭕ TEST 15: Error Handling & Edge Cases (optional but valuable)

**Optimal Results** (Production Excellence):
- ✅ 15/15 tests passing (100% pass rate)
- ✅ All validation checks passing
- ✅ Resume quality score >90%
- ✅ Personality inference accuracy >85%
- ✅ Zero JavaScript errors
- ✅ Response times <5 seconds for resume generation
- ✅ All GUI elements functional and polished
- ✅ Error states handled gracefully
- ✅ Professional appearance and UX

---

**Last Updated**: 2025-11-04
**Version**: 1.0
**Status**: Ready for Autonomous Execution

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
