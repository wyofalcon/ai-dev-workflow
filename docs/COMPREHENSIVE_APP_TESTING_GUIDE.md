# CVstomize Comprehensive Testing Guide
## Test EVERY Aspect of the Application

**Last Updated:** December 4, 2025
**Production URL:** https://cvstomize-frontend-351889420459.us-central1.run.app
**API URL:** https://cvstomize-api-351889420459.us-central1.run.app
**Test Method:** Claude Chrome Extension
**Estimated Time:** 3-4 hours for complete coverage

---

## 📋 Testing Philosophy

**GOAL:** Click every button, test every form, verify every user flow from signup to resume download.

**Approach:**
- Treat the app like a **brand new user** experiencing it for the first time
- Click EVERYTHING that's clickable
- Fill out EVERY form field
- Test EVERY validation rule
- Verify EVERY navigation path
- Check EVERY API endpoint
- Test on Desktop AND Mobile

---

## 🎯 Complete Test Suite Overview

| Category | Tests | Time | Priority |
|----------|-------|------|----------|
| **1. Landing & Marketing** | 5 tests | 15 min | CRITICAL |
| **2. Authentication** | 8 tests | 20 min | CRITICAL |
| **3. Onboarding** | 7 tests | 25 min | CRITICAL |
| **4. Profile Management** | 10 tests | 30 min | HIGH |
| **5. Build New Resume** | 12 tests | 30 min | CRITICAL |
| **6. Upload & Enhance** | 11 tests | 30 min | CRITICAL |
| **7. Tailor (Gold Standard)** | 15 tests | 45 min | CRITICAL |
| **8. Gold Standard Assessment** | 10 tests | 30 min | HIGH |
| **9. Resume Management** | 12 tests | 25 min | HIGH |
| **10. Billing & Subscription** | 8 tests | 20 min | MEDIUM |
| **11. Navigation & UI** | 10 tests | 15 min | MEDIUM |
| **12. Edge Cases & Errors** | 12 tests | 30 min | HIGH |
| **TOTAL** | **120 tests** | **~4 hours** | - |

---

## 🔥 CRITICAL PATH (Must Pass for Launch)

These tests MUST pass before any user access:

1. ✅ User can sign up
2. ✅ User can complete onboarding
3. ✅ User can access dashboard
4. ✅ User can generate resume (any path)
5. ✅ User can download resume PDF
6. ✅ No data loss bugs
7. ✅ No authentication errors

---

## Test Category 1: Landing & Marketing Pages

### Test 1.1: Homepage Load
**Claude Prompt:**
```
Navigate to https://cvstomize-frontend-351889420459.us-central1.run.app

Test the homepage:
1. Does it load without errors? (Check console)
2. Are all images/icons visible?
3. Is there a clear value proposition headline?
4. Are there visible CTAs (Call-to-Action buttons)?
5. Does the page layout look professional?
6. Test on mobile view (iPhone 12 Pro)

Take screenshots of:
- Desktop homepage
- Mobile homepage
- Any console errors
```

**Expected Results:**
- ✅ Page loads in <3 seconds
- ✅ All assets load (no broken images)
- ✅ Clear headline visible
- ✅ CTA buttons present (Sign Up, Get Started, etc.)
- ✅ Responsive design works

---

### Test 1.2: Navigation Menu
**Claude Prompt:**
```
Test the main navigation menu:
1. Click each menu item (Home, Features, Pricing, About, Login, Sign Up)
2. Verify each link works and goes to correct page
3. Test hamburger menu on mobile view
4. Check if logged-in users see different menu (Profile, Dashboard, Logout)

Document:
- All menu items and their destinations
- Any broken links
- Mobile menu functionality
```

**Expected Results:**
- ✅ All nav links work
- ✅ Mobile menu opens/closes
- ✅ Logged-in state changes menu options

---

### Test 1.3: Features/Benefits Section
**Claude Prompt:**
```
Scroll through the homepage features section:
1. Are there feature cards or sections explaining the product?
2. Do any animations or interactions work smoothly?
3. Are benefits clearly communicated?
4. Click any interactive elements

Screenshot any impressive or broken UI elements.
```

---

### Test 1.4: Pricing Page
**Claude Prompt:**
```
Navigate to the Pricing page:
1. Are pricing tiers clearly displayed?
2. Are features listed for each tier?
3. Can you click "Select Plan" or "Get Started" buttons?
4. Do buttons work for all pricing tiers?
5. Is there a comparison table?

Test:
- Click each pricing tier's CTA button
- Verify it routes correctly (to signup or upgrade flow)
```

**Expected Results:**
- ✅ Pricing tiers visible (Free, Premium, Unlimited)
- ✅ Features listed per tier
- ✅ CTA buttons functional

---

### Test 1.5: Footer Links
**Claude Prompt:**
```
Scroll to the footer:
1. Test all footer links (Privacy Policy, Terms of Service, Contact, etc.)
2. Verify external links open in new tabs
3. Check social media links if present
4. Verify copyright year is current

Document any 404 errors or broken links.
```

---

## Test Category 2: Authentication

### Test 2.1: Sign Up Flow
**Claude Prompt:**
```
Test user registration:
1. Click "Sign Up" button
2. Test form validation:
   - Enter invalid email → should show error
   - Enter weak password → should show requirements
   - Leave fields empty → should show "Required" errors
3. Create account with valid credentials:
   - Email: test-comprehensive-{timestamp}@example.com
   - Password: TestPass123!
4. Verify you're redirected after signup
5. Check if welcome email is mentioned (if applicable)

Take screenshots of:
- Signup form with validation errors
- Successful signup redirect
```

**Expected Results:**
- ✅ Email validation works
- ✅ Password strength enforced (8+ chars, uppercase, number, symbol)
- ✅ Account created successfully
- ✅ Redirects to onboarding or dashboard
- ✅ Firebase auth token stored

---

### Test 2.2: Login Flow
**Claude Prompt:**
```
Test user login:
1. Log out (if logged in)
2. Click "Login" or "Sign In"
3. Test validation:
   - Wrong email → should show "User not found"
   - Wrong password → should show "Incorrect password"
4. Login with correct credentials
5. Verify redirect to dashboard
6. Check if session persists on page refresh

Test "Remember Me" checkbox if present.
```

---

### Test 2.3: Forgot Password
**Claude Prompt:**
```
Test password reset:
1. Click "Forgot Password?" link on login page
2. Enter email address
3. Submit form
4. Verify success message appears
5. Check if you receive password reset email (if email server configured)

Expected behavior: Firebase sends password reset email
```

---

### Test 2.4: Google Sign-In (OAuth)
**Claude Prompt:**
```
Test Google OAuth:
1. Click "Sign in with Google" button
2. Select Google account
3. Grant permissions
4. Verify redirect back to app
5. Check if user is logged in
6. Verify user profile shows Google display name

Test both signup and login with Google.
```

**Expected Results:**
- ✅ Google OAuth popup opens
- ✅ User authenticated after permission grant
- ✅ Display name populated from Google account

---

### Test 2.5: Logout
**Claude Prompt:**
```
Test logout functionality:
1. Click logout button (in menu or profile dropdown)
2. Verify redirect to homepage or login page
3. Try accessing /dashboard directly after logout
4. Expected: Should redirect to login page (protected route)

Verify session is completely cleared (no API auth errors).
```

---

### Test 2.6: Session Persistence
**Claude Prompt:**
```
Test session handling:
1. Login to account
2. Navigate to dashboard
3. Refresh page (F5)
4. Expected: Should stay logged in
5. Close tab and reopen app
6. Expected: Should still be logged in (unless "Remember Me" was unchecked)

Check for "Session expired" errors after long idle time (optional).
```

---

### Test 2.7: Protected Routes
**Claude Prompt:**
```
Test authentication guards:
1. Log out completely
2. Try accessing these URLs directly:
   - /dashboard
   - /profile
   - /resume
   - /gold-standard
3. Expected: All should redirect to /login or /signup

If any protected route is accessible without login, it's a CRITICAL BUG.
```

---

### Test 2.8: Auth Error Handling
**Claude Prompt:**
```
Test error scenarios:
1. Enter SQL injection attempt in email field:
   - Email: admin'--@example.com
   - Expected: Should be treated as invalid email format
2. Enter extremely long password (1000+ characters)
   - Expected: Should either truncate or show error
3. Try rapid-fire signup (submit form 10 times quickly)
   - Expected: Should handle gracefully (no duplicate accounts)

Check console for any security errors.
```

---

## Test Category 3: Onboarding Flow

### Test 3.1: Onboarding Start
**Claude Prompt:**
```
After creating new account, test onboarding:
1. Does onboarding wizard appear automatically?
2. Is there a progress indicator (e.g., "Step 1 of 5")?
3. Is the first step clear (e.g., "Tell us about yourself")?
4. Can you skip onboarding? (Test if "Skip" button exists)

Screenshot the first onboarding screen.
```

**Expected Results:**
- ✅ Onboarding appears for new users
- ✅ Progress indicator shows
- ✅ Cannot skip (or skip is intentionally allowed)

---

### Test 3.2: Personal Information Step
**Claude Prompt:**
```
Complete onboarding personal info step:
1. Fill out:
   - Full Name: John Doe
   - Location: San Francisco, CA
   - Phone: (555) 123-4567
   - LinkedIn URL: linkedin.com/in/johndoe
2. Test validation:
   - Invalid phone format → should show error
   - Invalid LinkedIn URL → should show error
3. Click "Next"

Verify data persists if you go back and forward.
```

**Expected Results:**
- ✅ All fields have proper validation
- ✅ LinkedIn URL format checked
- ✅ Phone number format validated
- ✅ Data persists when navigating steps

---

### Test 3.3: Professional Background Step
**Claude Prompt:**
```
Test professional background section:
1. Select current job title from dropdown or type
2. Select industry (e.g., Technology, Finance, etc.)
3. Enter years of experience
4. Optionally add current company

Test edge cases:
- 0 years experience (entry-level)
- 50+ years experience (should accept or cap at reasonable limit)
```

---

### Test 3.4: Skills Selection
**Claude Prompt:**
```
Test skills selection:
1. Is there a skill search/autocomplete?
2. Can you add multiple skills?
3. Can you remove skills after adding?
4. Is there a skill suggestion list?
5. Test adding 20+ skills (should it allow or limit?)

Add a mix of technical and soft skills.
```

---

### Test 3.5: Education Step
**Claude Prompt:**
```
Test education section:
1. Add degree (Bachelor's, Master's, PhD, etc.)
2. Enter school name
3. Enter graduation year
4. Test "Add Another Degree" if available

Validation:
- Future graduation year → should show warning or error
- Graduation year before 1950 → reasonable?
```

---

### Test 3.6: Preferences/Goals
**Claude Prompt:**
```
Test user preferences:
1. What is your primary goal? (Job search, Career change, etc.)
2. Preferred resume format (if asked)
3. Target job titles or industries (if asked)

This step varies by app design - document what's actually shown.
```

---

### Test 3.7: Complete Onboarding
**Claude Prompt:**
```
Complete the onboarding flow:
1. Click final "Complete" or "Finish Setup" button
2. Verify redirect to dashboard
3. Check if onboarding data is saved:
   - Go to Profile page
   - Verify all entered data appears correctly
4. Try accessing onboarding again - should not re-appear (or show "Edit Profile" instead)

Screenshot the dashboard after completion.
```

**Expected Results:**
- ✅ Completes without errors
- ✅ Redirects to dashboard
- ✅ Data saved to profile
- ✅ Cannot re-trigger onboarding
- ✅ `onboarding_completed` field set to `true` in database

---

## Test Category 4: Profile Management

### Test 4.1: View Profile
**Claude Prompt:**
```
Navigate to Profile page:
1. Click "Profile" in navigation menu
2. Verify all onboarding data displays:
   - Personal info (name, email, phone, location, LinkedIn)
   - Professional background (title, company, experience)
   - Skills list
   - Education
3. Is the layout clean and organized?

Screenshot the profile page.
```

---

### Test 4.2: Edit Profile - Personal Info
**Claude Prompt:**
```
Test editing personal information:
1. Click "Edit" button (if present) or edit fields directly
2. Change:
   - Full name to "Jane Smith"
   - Location to "New York, NY"
   - Phone to "(555) 987-6543"
3. Click "Save" or "Update Profile"
4. Verify changes persist on page refresh

Test validation when saving invalid data.
```

---

### Test 4.3: Edit Profile - Professional Info
**Claude Prompt:**
```
Update professional information:
1. Change job title to "Senior Software Engineer"
2. Update current company to "Acme Corp"
3. Increase years of experience
4. Save changes

Verify updates reflect in profile view.
```

---

### Test 4.4: Add/Remove Skills
**Claude Prompt:**
```
Test skill management:
1. Add 3 new skills (React, Python, Project Management)
2. Remove 2 existing skills
3. Save changes
4. Refresh page and verify changes persisted

Test: Can you add duplicate skills? (Should prevent)
```

---

### Test 4.5: Add/Edit Education
**Claude Prompt:**
```
Test education management:
1. Add a second degree (if not already present)
2. Edit existing degree details
3. Remove a degree (if delete option exists)
4. Save changes

Verify multiple degrees display correctly.
```

---

### Test 4.6: Upload Profile Photo
**Claude Prompt:**
```
Test profile photo upload (if feature exists):
1. Click "Upload Photo" or avatar placeholder
2. Select image file (JPG/PNG, <5MB)
3. Test image preview before save
4. Save and verify photo appears in:
   - Profile page
   - Navigation menu (avatar)
   - Any other locations

Test edge cases:
- Upload 20MB image → should show size error
- Upload .txt file → should show format error
```

---

### Test 4.7: Change Password
**Claude Prompt:**
```
Test password change (if not using OAuth):
1. Navigate to Security or Account Settings
2. Click "Change Password"
3. Test validation:
   - Wrong current password → error
   - New password too weak → error
   - Passwords don't match → error
4. Change to new valid password
5. Log out and log back in with new password

Verify old password no longer works.
```

---

### Test 4.8: Account Settings
**Claude Prompt:**
```
Test account settings:
1. Email notifications toggle (if exists)
2. Language preference (if exists)
3. Time zone setting (if exists)
4. Privacy settings (profile visibility, etc.)

Test toggling each setting and saving.
```

---

### Test 4.9: Delete Account
**Claude Prompt:**
```
Test account deletion (DESTRUCTIVE - use test account):
1. Find "Delete Account" or "Close Account" option
2. Expected: Should show confirmation dialog with warning
3. Test canceling deletion
4. Proceed with deletion (if willing to lose test account)
5. Verify:
   - Account deleted from database
   - Cannot log in anymore
   - Redirected to homepage

Only test this if you're okay losing the test account!
```

---

### Test 4.10: Export Data (GDPR Compliance)
**Claude Prompt:**
```
Test data export (if feature exists):
1. Look for "Export My Data" or "Download Data" option
2. Request data export
3. Verify you receive:
   - JSON or CSV file
   - Contains profile data, resumes, etc.
4. Check file format is readable

This is a GDPR/privacy law requirement.
```

---

## Test Category 5: Build New Resume (Path A)

### Test 5.1: Access Build New Resume
**Claude Prompt:**
```
Test accessing "Build New Resume" feature:
1. From dashboard, find the purple card labeled "BUILD NEW RESUME/CV"
2. Hover over it - does it show tooltip?
3. Click the card
4. Verify BuildResumeModal opens (5-step wizard)

Screenshot the homepage with the 3 resume cards visible.
```

**Expected Results:**
- ✅ Purple card visible on homepage
- ✅ Tooltip shows: "Start from scratch! Great for creating your first resume."
- ✅ Modal opens when clicked
- ✅ 5 steps visible in stepper: "Job Posting" → "Upload Resume (Optional)" → "Select Sections" → "Personal Information" → "Review & Generate"

---

### Test 5.2: Step 1 - Job Posting Input
**Claude Prompt:**
```
Complete Step 1 of Build New Resume wizard:
1. Paste a job description (use sample below or real one)
2. Verify text area accepts 500+ words
3. Test validation:
   - Try clicking "Next" with empty field → should show error
4. Fill with valid job description
5. Click "Next"

Sample job description to use:
"Senior Software Engineer at TechCorp. 5+ years experience in React, Node.js,
and AWS. Responsible for building scalable web applications, mentoring junior
developers, and architecting microservices. Must have strong communication
skills and experience with Agile methodologies. Bachelor's degree in Computer
Science or equivalent experience required."

Verify the text persists if you click "Back" and then "Next" again.
```

**Expected Results:**
- ✅ Text area accepts job description
- ✅ Validation enforces non-empty field
- ✅ "Next" button advances to Step 2
- ✅ Data persists when navigating back

---

### Test 5.3: Step 2 - Upload Resume (Optional)
**Claude Prompt:**
```
Test optional resume upload:
1. Test uploading a resume file:
   - Upload PDF resume → should accept
   - Upload DOCX resume → should accept
   - Upload .txt file → should accept or reject?
   - Upload 30MB file → should show size error
2. After upload, verify:
   - File name displays
   - "Selected: {filename}" shows
3. Test skipping this step (leave empty and click "Next")
4. Test uploading, then changing file

Check if uploaded resume text is extracted (loading indicator?).
```

**Expected Results:**
- ✅ PDF, DOC, DOCX accepted
- ✅ File size limit enforced (max 10MB per UI text)
- ✅ Can skip this step (optional)
- ✅ Text extraction works (check backend API call in Network tab)

---

### Test 5.4: Step 3 - Select Sections
**Claude Prompt:**
```
Test resume section selection:
1. Verify default selections:
   - Professional Summary ✓
   - Work Experience ✓
   - Education ✓
   - Skills ✓
2. Click additional sections:
   - Certifications
   - Projects
   - Volunteer Experience
   - Publications
   - Awards & Honors
   - Languages
3. Deselect "Education" (test toggle)
4. Re-select "Education"
5. Click "Next"

Verify at least 2 sections must be selected (validation).
```

**Expected Results:**
- ✅ 10 section options available
- ✅ Chips toggle on/off when clicked
- ✅ Color changes (secondary = selected, default = unselected)
- ✅ Minimum 2 sections required

---

### Test 5.5: Step 4 - Personal Information
**Claude Prompt:**
```
Test personal info input:
1. Auto-populated from profile? (If user completed onboarding)
2. If empty, fill out:
   - Full Name: John Doe
   - Email: john.doe@example.com
   - Phone: (555) 123-4567
   - Location: San Francisco, CA
3. Test validation:
   - Invalid email → error
   - Invalid phone → error
4. Click "Next"

Verify user profile data is used if available.
```

**Expected Results:**
- ✅ Fields pre-filled from user profile
- ✅ Can override profile data
- ✅ Validation works
- ✅ Advances to Step 5

---

### Test 5.6: Step 5 - Review & Generate
**Claude Prompt:**
```
Review and generate resume:
1. Verify review screen shows:
   - Job posting snippet (first 100 chars)
   - Uploaded resume name (if uploaded)
   - Selected sections (chips)
   - Personal info summary
2. Click "Generate Resume" button
3. Observe:
   - Loading state (spinner in button?)
   - "Generating..." text or progress indicator
4. Wait for generation to complete (30-90 seconds)

Check Network tab in DevTools:
- POST request to /api/resume/build-new
- Response should include resume ID and markdown content

Take screenshots of loading state and success.
```

**Expected Results:**
- ✅ Review screen shows all data
- ✅ "Generate Resume" button visible
- ✅ Loading state appears during generation
- ✅ API call succeeds (200 status)
- ✅ Redirects to resume view page after success

---

### Test 5.7: Build New - Generated Resume View
**Claude Prompt:**
```
After resume generation completes:
1. Verify redirect to /resume/{id} page
2. Check resume content:
   - Contact information correct?
   - Professional Summary present?
   - Sections match selections?
   - Content is realistic and professional?
3. Verify resume uses job description keywords
4. Check if resume is ATS-optimized (simple formatting, no tables)

Take full screenshot of generated resume.
```

**Expected Results:**
- ✅ Resume displays in markdown or formatted view
- ✅ All selected sections present
- ✅ Content matches job description
- ✅ Professional quality
- ✅ ATS-friendly format

---

### Test 5.8: Build New - Download Resume
**Claude Prompt:**
```
Test downloading the generated resume:
1. Find "Download PDF" or "Export" button
2. Click download
3. Verify:
   - PDF downloads successfully
   - Filename is meaningful (e.g., "Resume_John_Doe.pdf")
   - PDF opens in viewer
   - Content matches web view
   - Formatting is clean (no broken layouts)

Test downloading in multiple formats if available (PDF, DOCX, TXT).
```

**Expected Results:**
- ✅ PDF generates and downloads
- ✅ Content matches web view
- ✅ Professional formatting
- ✅ No broken layouts or encoding issues

---

### Test 5.9: Build New - Edit Resume
**Claude Prompt:**
```
Test editing the generated resume:
1. Click "Edit" button (if exists)
2. Can you modify resume content directly?
3. Save edits
4. Verify changes persist

If no edit feature, note this as a potential enhancement.
```

---

### Test 5.10: Build New - Delete Resume
**Claude Prompt:**
```
Test deleting a resume:
1. From resume view or resume list, find "Delete" option
2. Click delete
3. Expected: Confirmation dialog appears
4. Cancel deletion first
5. Delete again and confirm
6. Verify:
   - Resume removed from list
   - Cannot access /resume/{id} anymore (404 or redirect)

Check if deletion is soft (archived) or hard (permanently deleted).
```

---

### Test 5.11: Build New - Resume Limit Check
**Claude Prompt:**
```
Test resume generation limits (if user is on free tier):
1. Check current tier: Free (3 resumes) or Premium (unlimited)
2. If free tier, generate resumes until limit is reached
3. Try generating 4th resume
4. Expected: Should show upgrade prompt or limit message

Screenshot the limit message if shown.
```

**Expected Results:**
- ✅ Limit enforced for free users
- ✅ Clear upgrade CTA shown
- ✅ Premium users have no limit

---

### Test 5.12: Build New - Error Handling
**Claude Prompt:**
```
Test error scenarios:
1. Close browser during generation (after clicking "Generate Resume")
2. Reopen and check:
   - Is resume saved as "In Progress"?
   - Can you retry generation?
3. Test network error simulation:
   - Open DevTools > Network tab
   - Set throttling to "Offline"
   - Try generating resume
   - Expected: Error message with retry option

Document error handling quality.
```

---

## Test Category 6: Upload & Enhance Resume (Path B)

### Test 6.1: Access Upload & Enhance
**Claude Prompt:**
```
Test accessing "Upload Existing Resume" feature:
1. From dashboard, find the blue card labeled "UPLOAD EXISTING RESUME/CV"
2. Verify icon is CloudUploadIcon (upload symbol)
3. Hover to see tooltip
4. Click card
5. Verify UploadResumeModal opens (4-step wizard)

Expected steps: "Upload Resume" → "Target Job Posting" → "Select Sections" → "Review & Generate"
```

**Expected Results:**
- ✅ Blue card visible on homepage
- ✅ Tooltip shows: "Upload PDF/DOC and enhance with ATS optimization"
- ✅ Modal opens with 4 steps

---

### Test 6.2: Step 1 - Upload Resume File
**Claude Prompt:**
```
Test resume file upload:
1. Click the upload area (large dashed box)
2. Test file selection:
   - Upload PDF resume → should accept and extract text
   - Upload DOCX resume → should accept
   - Upload .jpg image → should reject with format error
   - Upload 30MB PDF → should reject with size error (max 25MB)
3. After successful upload:
   - Verify loading state ("Extracting text from resume...")
   - Verify success state (green checkmark, file name, character count)
   - Auto-advances to Step 2 after 0.5 seconds

Test "Upload Different File" button to replace uploaded file.
```

**Expected Results:**
- ✅ Only PDF, DOC, DOCX accepted
- ✅ File size limit 25MB enforced
- ✅ Text extraction works (API call to /api/resume/extract-text)
- ✅ Success state shows: filename, "X.Xk characters extracted"
- ✅ Auto-advances to next step

---

### Test 6.3: Upload - Text Extraction Quality
**Claude Prompt:**
```
Verify resume text extraction quality:
1. After upload, check Network tab:
   - POST /api/resume/extract-text
   - Response should include "text" field with extracted content
2. Copy the extracted text from response
3. Verify:
   - Is the text readable?
   - Are there any encoding issues (�� symbols)?
   - Is formatting preserved (line breaks, sections)?
   - Are all sections extracted (not truncated)?

Compare extracted text with original PDF to check accuracy.
```

**Expected Results:**
- ✅ Extraction preserves content accurately
- ✅ No encoding errors
- ✅ Reasonable formatting (line breaks preserved)

---

### Test 6.4: Step 2 - Target Job Posting
**Claude Prompt:**
```
Complete Step 2 - Job Posting input:
1. Paste a job description (different from the one in your uploaded resume)
2. Test validation:
   - Empty field → should block "Next" button
3. Fill with valid JD
4. Click "Next"

Use this sample JD:
"Product Manager role at StartupXYZ. Looking for 3+ years experience
managing digital products, strong analytical skills, and experience with
A/B testing. Must be able to work cross-functionally with engineering,
design, and marketing teams. MBA preferred but not required."

Verify text persists when navigating back.
```

**Expected Results:**
- ✅ Text area accepts job description
- ✅ Validation enforces non-empty
- ✅ Data persists

---

### Test 6.5: Step 3 - Select Sections (Upload Path)
**Claude Prompt:**
```
Test section selection:
1. Same section selection UI as Build New path
2. Select sections:
   - Professional Summary ✓
   - Work Experience ✓
   - Education ✓
   - Skills ✓
   - Projects ✓
3. Click "Next"

This should be identical to Build New Test 5.4.
```

---

### Test 6.6: Step 4 - Review & Enhance
**Claude Prompt:**
```
Review and enhance resume:
1. Verify review screen shows:
   - Uploaded resume name
   - Job posting snippet
   - Selected sections
2. Click "Enhance Resume" button
3. Observe loading state
4. Wait for enhancement to complete (45-90 seconds)

Check API call:
- POST /api/resume/enhance-uploaded
- Should include extractedResumeText and jobPosting

Take screenshots of review and loading states.
```

**Expected Results:**
- ✅ Review shows all data
- ✅ "Enhance Resume" button visible
- ✅ Loading indicator appears
- ✅ API call succeeds
- ✅ Redirects to enhanced resume view

---

### Test 6.7: Upload - Enhanced Resume Quality
**Claude Prompt:**
```
Compare original vs enhanced resume:
1. Review the enhanced resume
2. Check for improvements:
   - Are keywords from job description integrated?
   - Is content reordered for relevance?
   - Are bullet points strengthened with action verbs?
   - Is formatting cleaner/more ATS-friendly?
3. Compare specific sections:
   - Professional Summary: Is it tailored to the job?
   - Work Experience: Are relevant experiences emphasized?
   - Skills: Are job-relevant skills highlighted?

Take screenshots of both original and enhanced for comparison.
```

**Expected Results:**
- ✅ Enhanced resume is noticeably improved
- ✅ Job keywords integrated naturally
- ✅ Relevant experience emphasized
- ✅ Professional quality maintained

---

### Test 6.8: Upload - Download Enhanced Resume
**Claude Prompt:**
```
Download the enhanced resume:
1. Click "Download PDF"
2. Verify PDF quality
3. Compare PDF to web view
4. Check filename (should be "Enhanced_Resume_..." or similar)

Same test as Build New Test 5.8.
```

---

### Test 6.9: Upload - Multiple File Formats
**Claude Prompt:**
```
Test uploading different resume formats:
1. Create a new upload session
2. Upload a DOCX resume
3. Verify extraction works
4. Create another session
5. Upload a scanned PDF (image-based, not text)
6. Expected: Should show error or poor extraction quality

Document which formats work best.
```

**Expected Results:**
- ✅ Text-based PDFs: Excellent extraction
- ✅ DOCX: Good extraction
- ✅ Scanned PDFs: May fail or extract poorly (expected limitation)

---

### Test 6.10: Upload - Error Handling
**Claude Prompt:**
```
Test error scenarios:
1. Upload corrupted PDF file
2. Expected: Error message "Failed to extract text"
3. Upload empty PDF (0 bytes)
4. Expected: File size error
5. Upload resume, then close browser during enhancement
6. Reopen - check if resume is saved

Document error messages shown.
```

---

### Test 6.11: Upload - Resume Limit (Free Tier)
**Claude Prompt:**
```
Test resume limits for Upload path:
1. If on free tier, check current count
2. Upload & enhance until limit reached
3. Try one more
4. Expected: Upgrade prompt shown

Same as Build New Test 5.11.
```

---

## Test Category 7: Tailor to Specific Job - Gold Standard (Path C)

### Test 7.1: Access Gold Standard Path
**Claude Prompt:**
```
Test accessing "Tailor to Specific Job (GOLD STANDARD)" feature:
1. From dashboard, find the gold/yellow card
2. Verify it says "TAILOR TO SPECIFIC JOB (GOLD STANDARD)"
3. Hover to see tooltip
4. Expected tooltip: "🎯 PREMIUM: Personality-authentic resume generation..."
5. Check if card is disabled (grayed out) if user has 0 resumes
6. If disabled, try clicking → should show message "You need at least 1 resume/CV saved"
7. If enabled (user has ≥1 resume), click card
8. Verify redirect to /create-resume (ConversationalWizard)

Test the prerequisite check.
```

**Expected Results:**
- ✅ Gold card visible on homepage
- ✅ Disabled if user has 0 resumes
- ✅ Enabled if user has ≥1 resume
- ✅ Routes to conversational wizard
- ✅ Tooltip emphasizes PREMIUM and 90% accuracy

---

### Test 7.2: Gold Standard - Job Description Input
**Claude Prompt:**
```
Start Gold Standard resume generation:
1. Paste a job description
2. Test validation:
   - Empty JD → should block progress
   - Very short JD (<50 words) → warning?
3. Paste detailed job description:

Sample JD for Gold Standard:
"Staff Software Engineer at TechGiant Inc. We're seeking an exceptional
engineer with 8+ years of experience building distributed systems at scale.
You'll lead architecture decisions, mentor a team of 10+ engineers, and drive
technical strategy. Must have deep expertise in Kubernetes, microservices,
event-driven architectures, and cloud platforms (AWS/GCP). Strong collaboration
and communication skills essential. You'll work closely with product managers
and stakeholders to define roadmaps. Track record of shipping high-impact
features to millions of users required. Competitive comp package including
equity. On-site in Seattle with hybrid flexibility."

4. Click "Next" or "Continue"
5. Verify it analyzes the JD (loading state?)

Check API call: POST /api/resume/analyze-jd
```

**Expected Results:**
- ✅ JD input works
- ✅ Validation enforces non-empty
- ✅ API analyzes JD and generates personalized questions

---

### Test 7.3: Gold Standard - Personalized Questions
**Claude Prompt:**
```
Answer personalized questions generated by AI:
1. Verify questions are specific to the job description
2. Example questions for "Staff Software Engineer":
   - "Describe your experience leading distributed systems architecture"
   - "Tell me about a time you mentored junior engineers"
   - "Explain a high-impact feature you shipped to millions of users"
3. For each question (typically 3-5 questions):
   - Write detailed 50-100 word answer
   - Verify word count validation
   - Click "Next"
4. Test "Back" button to review previous answers

Verify answers persist when navigating.
```

**Expected Results:**
- ✅ 3-5 personalized questions generated
- ✅ Questions match job requirements
- ✅ Word count validation (min 50 words)
- ✅ Progress indicator shows (e.g., "Question 2 of 4")
- ✅ Answers persist when navigating back

---

### Test 7.4: Gold Standard - Complete Conversation
**Claude Prompt:**
```
Complete the conversational flow:
1. Answer all questions
2. On final question, click "Generate Resume" or "Complete"
3. Observe:
   - Loading state ("Generating your personality-authentic resume...")
   - Progress indicator if available
4. Wait for generation (may take 2-3 minutes due to:
   - Personality profile lookup
   - RAG story retrieval
   - Gemini 2.5 Pro generation
5. Check Network tab:
   - POST /api/resume/generate
   - Response should include resume ID, markdown, atsAnalysis

Document generation time.
```

**Expected Results:**
- ✅ Generates within 3 minutes
- ✅ No timeout errors
- ✅ Loading state shows progress
- ✅ API returns success (200)

---

### Test 7.5: Gold Standard - Verify Personality Integration
**Claude Prompt:**
```
After resume generation, analyze content for personality alignment:
1. Review the generated resume
2. Check if personality traits are evident:
   - Action verbs match personality (e.g., "pioneered" for high Openness)
   - Tone matches (bold vs conservative based on Neuroticism)
   - Framing matches (team-focused vs independent based on Extraversion)
3. Compare to a generic resume (from Build New path)
4. Note differences in:
   - Word choice
   - Bullet point framing
   - Professional summary tone

Look for phrases like:
- High Openness: "innovated," "transformed," "reimagined"
- High Conscientiousness: "meticulously," "systematically"
- High Extraversion: "led team of," "collaborated with"

Take screenshots highlighting personality-aligned language.
```

**Expected Results:**
- ✅ Resume language matches personality
- ✅ Noticeably different from generic resume
- ✅ Professional quality maintained
- ✅ Authentically represents candidate

---

### Test 7.6: Gold Standard - Verify RAG Story Retrieval
**Claude Prompt:**
```
Verify RAG (semantic story retrieval) is working:
1. Review resume content
2. Look for stories you wrote in Gold Standard assessment
3. Check if relevant stories appear in:
   - Work Experience bullets
   - Achievements section
   - Professional Summary
4. Verify stories match the job description
5. Check if irrelevant stories are excluded

Compare resume content to your original Section A stories from
Gold Standard assessment to confirm retrieval.
```

**Expected Results:**
- ✅ Relevant stories appear in resume
- ✅ Stories match job requirements
- ✅ Irrelevant stories excluded (semantic matching works)
- ✅ Story content is naturally integrated

---

### Test 7.7: Gold Standard - ATS Analysis
**Claude Prompt:**
```
Check ATS optimization analysis:
1. Look for ATS score or analysis section
2. Verify it shows:
   - Keyword coverage percentage (e.g., "85% keyword match")
   - Must-have keywords matched
   - Missing critical keywords
   - ATS-friendly formatting score
3. Check if suggestions are provided
4. Verify resume uses simple formatting (no tables, images, fancy fonts)

This is typically shown on resume view page or in a separate tab.
```

**Expected Results:**
- ✅ ATS analysis displays
- ✅ Coverage percentage shown (typically 70-95%)
- ✅ Keyword match list
- ✅ Optimization suggestions
- ✅ Formatting is ATS-compliant

---

### Test 7.8: Gold Standard - Quality Comparison
**Claude Prompt:**
```
Compare all three resume generation paths:
1. Generate the SAME job description through all 3 paths:
   - Build New Resume
   - Upload & Enhance
   - Tailor (Gold Standard)
2. Compare results side-by-side:
   - Professional Summary quality
   - Action verb strength
   - Relevance to job
   - Personality authenticity
   - Overall professionalism
3. Rank them: Which resume would YOU hire from?

Expected quality ranking: Gold Standard > Upload > Build New

Take screenshots of all 3 for comparison.
```

**Expected Results:**
- ✅ Gold Standard clearly best quality
- ✅ Upload & Enhance shows improvement over original
- ✅ Build New is good but generic
- ✅ Clear differentiation visible

---

### Test 7.9: Gold Standard - Metadata Tracking
**Claude Prompt:**
```
Verify metadata is tracked:
1. View resume in list or details page
2. Check for metadata:
   - Model used: "gemini-2.5-pro"
   - Type: (implicitly Gold Standard)
   - Personality used: Yes/No
   - RAG stories used: Number (e.g., "5 stories")
   - ATS optimized: Yes
   - Generation time
   - Token usage
3. Verify this data is stored (check API response)

This metadata helps track premium feature usage.
```

**Expected Results:**
- ✅ Metadata tracked and displayed
- ✅ Shows "Personality used: true"
- ✅ Shows RAG story count
- ✅ Model = Gemini 2.5 Pro (not Flash)

---

### Test 7.10: Gold Standard - Resume Limit
**Claude Prompt:**
```
Test resume limits for Gold Standard path:
1. Same as other paths - respects global resume limit
2. If free tier (3 resumes), should still block after 3 total
3. Premium tier should allow unlimited

No special limits for Gold Standard path specifically.
```

---

### Test 7.11: Gold Standard - Error: No Personality Assessment
**Claude Prompt:**
```
Test error handling if user hasn't completed Gold Standard assessment:
1. Create a new test account
2. Skip Gold Standard personality assessment
3. Generate a resume via Build New path (to get ≥1 resume)
4. Try accessing Tailor (Gold Standard) path
5. Expected: Should still work but WITHOUT personality framing

Check API logs: Should show "⚠️ No personality profile found" warning

Alternatively, app may REQUIRE personality assessment before allowing
Tailor path. Document actual behavior.
```

**Expected Results:**
- ✅ Falls back to generic resume if no personality
- ✅ OR blocks user and prompts to complete assessment
- ✅ Clear messaging to user

---

### Test 7.12: Gold Standard - Premium Access Control
**Claude Prompt:**
```
Test premium feature access:
1. If user is on free tier, can they access Gold Standard path?
2. Expected behavior (confirm with current implementation):
   - Option A: Available to all, but limited by resume count
   - Option B: Requires premium subscription
3. If premium-only, verify:
   - Free users see "Upgrade to Premium" CTA
   - Premium users can access freely

Check pricing page for current feature availability.
```

---

### Test 7.13: Gold Standard - Conversation Session Persistence
**Claude Prompt:**
```
Test session handling:
1. Start Gold Standard flow
2. Answer 2 questions
3. Close browser tab completely
4. Reopen app and navigate to /create-resume
5. Expected: Should resume where you left off (Q3)

Or: Should start fresh (questions not saved)

Document actual behavior and check if this is intentional.
```

---

### Test 7.14: Gold Standard - Download & Share
**Claude Prompt:**
```
Test downloading Gold Standard resume:
1. Click "Download PDF"
2. Verify PDF quality (same as other paths)
3. Check if PDF includes any personality metadata (optional)
4. Test sharing features if available (email, link, etc.)

Same as Build New Test 5.8.
```

---

### Test 7.15: Gold Standard - Edit Generated Resume
**Claude Prompt:**
```
Test editing Gold Standard resume:
1. After generation, click "Edit" (if available)
2. Can you modify:
   - Professional Summary?
   - Individual bullet points?
   - Section order?
3. Save edits
4. Verify changes persist
5. Check if personality alignment is maintained after manual edits

Document edit capabilities.
```

---

## Test Category 8: Gold Standard Personality Assessment

**NOTE:** This overlaps with the existing CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md Tests 3-6. Include here for completeness.

### Test 8.1: Access Gold Standard Assessment
**Claude Prompt:**
```
Navigate to Gold Standard personality assessment:
1. Look for assessment in:
   - Main navigation menu
   - Dashboard widget or card
   - Profile page
   - Settings page
2. Click to access /gold-standard route
3. Verify GoldStandardWizard component loads
4. Check for premium access control (if applicable)

Screenshot the discovery path.
```

---

### Test 8.2: Section A - Behavioral Stories (8 Questions)
**Claude Prompt:**
```
Complete Section A (same as existing Test 3):
1. Answer all 8 story questions
2. Each requires 50+ words
3. Test word count validation
4. Verify progress indicator
5. Test navigation (Back/Next)

Use the existing test guide for detailed instructions.
```

---

### Test 8.3: Section B - BFI-20 Likert Items (20 Questions)
**Claude Prompt:**
```
Complete Section B (same as existing Test 4):
1. Answer all 20 Likert scale questions
2. 5-point scale for each
3. Test validation (cannot skip items)
4. Verify progress bar

Refer to existing test guide for details.
```

---

### Test 8.4: Section C - Hybrid Questions (7 Questions)
**Claude Prompt:**
```
Complete Section C (same as existing Test 5):
1. Answer 7 hybrid questions
2. Each requires 30+ words
3. Test word count validation
4. Complete assessment

Refer to existing test guide.
```

---

### Test 8.5: Results Display
**Claude Prompt:**
```
View assessment results (same as existing Test 6):
1. Verify OCEAN scores (0-100)
2. Check derived traits
3. Review confidence score
4. Read profile summary

Refer to existing test guide for expected results.
```

---

### Test 8.6: Results - Save & Access Later
**Claude Prompt:**
```
Test results persistence:
1. After viewing results, close dialog
2. Navigate away from page
3. Return to Gold Standard assessment
4. Expected: Should show "View Results" instead of retaking
5. Click "View Results"
6. Verify same scores appear

Test if user can retake assessment (should prevent or warn).
```

---

### Test 8.7: Export Personality Report
**Claude Prompt:**
```
Test exporting personality results (if feature exists):
1. Look for "Download Report" or "Export PDF" option
2. Generate personality report
3. Verify report includes:
   - OCEAN scores
   - Derived traits
   - Key insights
   - Recommendations
4. Check PDF quality

This may not be implemented yet - document if missing.
```

---

### Test 8.8: Retake Assessment
**Claude Prompt:**
```
Test retaking assessment:
1. After completing once, find "Retake Assessment" option
2. Expected behavior (confirm implementation):
   - Option A: Blocked (can only take once)
   - Option B: Allowed after 30/60/90 days
   - Option C: Allowed anytime (overwrites previous)
3. If retake is allowed:
   - Previous answers should NOT pre-fill
   - New results should replace old
4. Verify personality profile updates in database

Document retake policy.
```

---

### Test 8.9: Assessment Analytics
**Claude Prompt:**
```
Check if assessment analytics are tracked (admin feature):
1. Not user-visible, but verify API calls include:
   - Assessment completion rate
   - Time taken to complete
   - Drop-off points (which section users quit)
2. This would be in backend analytics/logs

This is for product improvement - not critical for user testing.
```

---

### Test 8.10: Mobile Responsiveness
**Claude Prompt:**
```
Test Gold Standard assessment on mobile:
1. Open DevTools > Toggle device toolbar
2. Select iPhone 12 Pro
3. Complete entire assessment on mobile view
4. Check:
   - Text inputs work on mobile keyboard
   - Radio buttons are large enough to tap
   - Progress indicator visible
   - Navigation buttons accessible
   - Results dialog readable

This is part of existing Test 8 but worth dedicated focus.
```

---

## Test Category 9: Resume Management

### Test 9.1: View Resume List
**Claude Prompt:**
```
Navigate to resume list page:
1. Go to /resume or /resumes (check which route exists)
2. Verify all generated resumes display
3. Check what's shown for each resume:
   - Title (e.g., "Resume for TechCorp")
   - Date created
   - Target company (if applicable)
   - Type indicator (Build New, Upload, Gold Standard?)
   - Status (Generated, Draft, etc.)
4. Test sorting options if available (by date, name, etc.)
5. Test filtering if available (by type, status, etc.)

Screenshot the resume list view.
```

**Expected Results:**
- ✅ All resumes display in list/grid
- ✅ Metadata shown (title, date, type)
- ✅ Clear visual organization
- ✅ Sorting/filtering works (if implemented)

---

### Test 9.2: Resume Search
**Claude Prompt:**
```
Test resume search functionality (if exists):
1. Enter search term (e.g., "Software Engineer")
2. Verify results filter to matching resumes
3. Test search by:
   - Job title
   - Company name
   - Keywords
4. Test clearing search
5. Verify "No results found" message for invalid search

Document search capability.
```

---

### Test 9.3: Resume Cards/Grid View
**Claude Prompt:**
```
Test resume display options:
1. Check if there's a view toggle (List vs Grid)
2. Switch between views
3. Verify both show same information
4. Test which view is more user-friendly

Grid view typically shows cards with preview.
List view typically shows table with details.
```

---

### Test 9.4: Resume Preview/Quick View
**Claude Prompt:**
```
Test resume preview functionality:
1. Hover over resume card (if hover preview exists)
2. Click "Preview" or eye icon
3. Verify preview modal shows resume content
4. Check if you can:
   - Download from preview
   - Edit from preview
   - Delete from preview
   - Close preview

This is a UX enhancement - may not be implemented.
```

---

### Test 9.5: Open Resume Detail Page
**Claude Prompt:**
```
Open a resume for full view:
1. Click on resume title or "View" button
2. Verify route /resume/{id}
3. Check resume detail page shows:
   - Full resume content (formatted)
   - Metadata (created date, model used, etc.)
   - ATS analysis (if applicable)
   - Action buttons (Edit, Download, Delete, Share)
4. Verify content matches what was generated

Take full-page screenshot.
```

**Expected Results:**
- ✅ Detail page loads
- ✅ Full resume displayed
- ✅ All actions available
- ✅ Clean, professional layout

---

### Test 9.6: Set Primary Resume
**Claude Prompt:**
```
Test marking a resume as "primary" (if feature exists):
1. From resume list, find "Set as Primary" or star icon
2. Click to mark resume as primary
3. Verify:
   - Resume gets highlighted or starred
   - Other resumes are unmarked
4. Check if primary resume is used as default for:
   - Profile display
   - Quick actions
   - Sharing

This feature may be called "Default Resume" or "Featured Resume".
```

---

### Test 9.7: Duplicate Resume
**Claude Prompt:**
```
Test duplicating a resume:
1. Find "Duplicate" or "Clone" option
2. Click to duplicate
3. Verify:
   - New resume created with same content
   - Title appended with "(Copy)" or similar
   - New resume ID assigned
4. Edit duplicate and verify original is unchanged

This allows users to create variations easily.
```

---

### Test 9.8: Share Resume
**Claude Prompt:**
```
Test resume sharing functionality:
1. Click "Share" button
2. Check sharing options:
   - Copy link (public URL?)
   - Email resume
   - Download for sharing
3. If link sharing exists:
   - Copy link
   - Open in incognito window
   - Verify resume is viewable
   - Check if public view is read-only
4. Test privacy controls (if any)

Document sharing capabilities.
```

---

### Test 9.9: Bulk Actions
**Claude Prompt:**
```
Test bulk resume actions (if implemented):
1. Select multiple resumes (checkboxes)
2. Test bulk actions:
   - Delete selected
   - Download selected (as ZIP?)
   - Export selected
3. Verify confirmation dialogs for destructive actions
4. Test "Select All" and "Deselect All"

This is an advanced feature - may not exist yet.
```

---

### Test 9.10: Resume History/Versions
**Claude Prompt:**
```
Test resume versioning (if implemented):
1. Edit a resume and save
2. Check for "Version History" or "Revision History"
3. View previous versions
4. Test restoring an old version
5. Check if version timestamps are shown

This feature enables undo/rollback. May not be implemented.
```

---

### Test 9.11: Archive Resume
**Claude Prompt:**
```
Test archiving resumes:
1. Find "Archive" option (alternative to delete)
2. Archive a resume
3. Verify it's removed from main list
4. Check if there's an "Archived" filter or section
5. Test unarchiving

Archiving is soft-delete - data preserved.
```

---

### Test 9.12: Resume Counter
**Claude Prompt:**
```
Test resume counter/limit display:
1. Check if counter shows current usage (e.g., "2 / 3 resumes")
2. Verify it updates after generating new resume
3. Check if it shows differently for premium users ("Unlimited")
4. Test clicking counter - does it show usage details?

This was mentioned in Session 32 testing notes.
```

**Expected Results:**
- ✅ Counter displays correctly
- ✅ Updates in real-time
- ✅ Shows "0 / 3" for new free users
- ✅ Shows "∞" or "Unlimited" for premium

---

## Test Category 10: Billing & Subscription

### Test 10.1: View Current Plan
**Claude Prompt:**
```
Check current subscription status:
1. Navigate to Billing, Subscription, or Account page
2. Verify displayed information:
   - Current tier (Free, Premium, Unlimited)
   - Price (if applicable)
   - Renewal date (if applicable)
   - Features included
   - Resume limit
3. Check if free tier shows upgrade CTA

Screenshot subscription/billing page.
```

**Expected Results:**
- ✅ Plan details clearly shown
- ✅ Accurate resume limit
- ✅ Renewal date for paid plans
- ✅ Upgrade CTA for free users

---

### Test 10.2: Upgrade Flow
**Claude Prompt:**
```
Test upgrading subscription:
1. Click "Upgrade to Premium" or similar CTA
2. Verify upgrade page shows:
   - Pricing tiers comparison
   - Features per tier
   - Payment options
3. Select a plan (Premium or Unlimited)
4. Fill payment details:
   - Use Stripe test card: 4242 4242 4242 4242
   - Expiry: Any future date (12/25)
   - CVC: Any 3 digits (123)
   - ZIP: Any 5 digits (94102)
5. Complete payment
6. Verify:
   - Payment succeeds
   - Subscription updated immediately
   - Resume limit increases
   - Confirmation shown

⚠️ ONLY use test card numbers! Do not enter real payment info.
```

**Expected Results:**
- ✅ Stripe checkout appears
- ✅ Test payment succeeds
- ✅ Subscription upgraded instantly
- ✅ Features unlocked
- ✅ Confirmation email sent (if configured)

---

### Test 10.3: Downgrade Plan
**Claude Prompt:**
```
Test downgrading subscription:
1. If currently on paid plan, find "Change Plan" option
2. Select lower tier or "Cancel Premium"
3. Verify confirmation dialog:
   - Shows what you'll lose
   - Asks for downgrade reason (optional)
4. Confirm downgrade
5. Check if:
   - Downgrade is immediate or at end of billing period?
   - Premium features still accessible until period ends?

Document downgrade policy.
```

---

### Test 10.4: Cancel Subscription
**Claude Prompt:**
```
Test subscription cancellation:
1. Find "Cancel Subscription" option
2. Verify cancellation flow:
   - Confirmation dialog with warning
   - Optional feedback form ("Why are you canceling?")
3. Confirm cancellation
4. Check:
   - Subscription status = "Canceled" or "Ends on [date]"
   - Premium features accessible until end date?
   - Resume limit reverts to free tier at end?

Test using a paid test account (if available).
```

---

### Test 10.5: Payment Method Management
**Claude Prompt:**
```
Test updating payment method:
1. Navigate to Billing > Payment Methods
2. Click "Update Card" or "Add Payment Method"
3. Enter new card details (Stripe test card)
4. Save changes
5. Verify new card is default
6. Test removing old card

Check if you can have multiple payment methods on file.
```

---

### Test 10.6: Billing History
**Claude Prompt:**
```
View billing/invoice history:
1. Navigate to Billing > Invoices or Payment History
2. Verify list shows:
   - Date of payment
   - Amount charged
   - Plan purchased
   - Payment status (Paid, Failed, Pending)
3. Test downloading invoice PDF
4. Verify invoice includes:
   - Company name (CVstomize)
   - Customer details
   - Itemized charges
   - Total amount

Screenshot a sample invoice.
```

**Expected Results:**
- ✅ Payment history displays
- ✅ Invoices downloadable as PDF
- ✅ Professional invoice format
- ✅ Accurate charges shown

---

### Test 10.7: Failed Payment Handling
**Claude Prompt:**
```
Test payment failure scenario:
1. Use Stripe test card for declined payment: 4000 0000 0000 0002
2. Attempt upgrade or renewal
3. Expected behavior:
   - Payment fails
   - Error message shown
   - Subscription not upgraded
   - User prompted to try different card
4. Test recovery:
   - Update to valid card (4242 4242 4242 4242)
   - Retry payment
   - Verify success

This ensures graceful error handling.
```

---

### Test 10.8: Promo Code / Coupon
**Claude Prompt:**
```
Test promo code functionality (if implemented):
1. Find "Have a promo code?" field during checkout
2. Enter invalid code → should show error
3. Enter valid code (if you have one)
4. Verify discount applied:
   - Price updated
   - Discount shown in summary
5. Complete purchase
6. Verify discounted amount charged

If no promo code feature exists, note this as potential enhancement.
```

---

## Test Category 11: Navigation & UI

### Test 11.1: Main Navigation Menu
**Claude Prompt:**
```
Test main navigation thoroughly:
1. Click each nav item:
   - Home/Dashboard
   - Resumes / My Resumes
   - Profile
   - Billing / Subscription
   - Help / Support
   - Settings
2. Verify each route works
3. Check active state highlighting (current page)
4. Test breadcrumbs if present

Document full navigation structure.
```

---

### Test 11.2: User Profile Dropdown
**Claude Prompt:**
```
Test user menu dropdown:
1. Click user avatar or name in top-right
2. Verify dropdown shows:
   - User name
   - Email
   - Account type (Free/Premium)
   - Profile link
   - Settings link
   - Logout button
3. Test each dropdown option
4. Verify dropdown closes when clicking outside

Screenshot the dropdown menu.
```

---

### Test 11.3: Dashboard Widgets
**Claude Prompt:**
```
Test dashboard UI:
1. Review dashboard layout
2. Check for widgets/cards:
   - Resume count / limit
   - Recent resumes
   - Quick actions (Generate Resume, etc.)
   - Personality assessment status
   - Upgrade CTA (if free tier)
3. Test interactivity of each widget
4. Verify data is accurate

Dashboard is the user's home after login.
```

---

### Test 11.4: Search Functionality
**Claude Prompt:**
```
Test global search (if exists):
1. Find search bar (usually in top nav)
2. Enter search query
3. Check what's searchable:
   - Resumes by title/company
   - Help articles
   - Settings
4. Test search results quality
5. Test "No results found" state

Global search may not be implemented - document if missing.
```

---

### Test 11.5: Notifications / Alerts
**Claude Prompt:**
```
Test notification system (if exists):
1. Look for notification bell icon
2. Check notification types:
   - Resume generated successfully
   - Payment processed
   - Account updated
3. Test marking as read
4. Test clearing notifications
5. Check if notifications persist (database-backed?)

Many apps have notification centers - verify if implemented.
```

---

### Test 11.6: Help / Support Section
**Claude Prompt:**
```
Test help/support features:
1. Find Help, Support, or FAQ section
2. Check for:
   - FAQ articles
   - Search help articles
   - Contact form
   - Live chat widget
   - Email support link
3. Test submitting a support request
4. Verify confirmation message

Screenshot help section layout.
```

---

### Test 11.7: Tooltips & Help Text
**Claude Prompt:**
```
Test UI guidance elements:
1. Hover over form fields, buttons, icons
2. Verify tooltips appear with helpful text
3. Check for "?" icons with explanatory text
4. Test contextual help (e.g., "What is Gold Standard?")
5. Verify tooltips are clear and useful

Good tooltips improve UX significantly.
```

---

### Test 11.8: Loading States
**Claude Prompt:**
```
Test loading indicators throughout app:
1. During resume generation: Spinner, progress bar, or skeleton?
2. During page navigation: Loading overlay?
3. During data fetch: Skeleton screens or spinners?
4. Verify loading states are visible but not intrusive
5. Check for timeout errors if loading takes >60 seconds

Loading states improve perceived performance.
```

---

### Test 11.9: Empty States
**Claude Prompt:**
```
Test empty state designs:
1. New user with 0 resumes:
   - Does it show helpful empty state?
   - CTA to create first resume?
2. Search with no results:
   - Clear "No results" message?
   - Suggestions to broaden search?
3. Empty sections in profile (no skills added yet):
   - Prompts to add content?

Empty states should guide users, not confuse them.
```

---

### Test 11.10: Responsive Design
**Claude Prompt:**
```
Test responsiveness across devices:
1. Desktop (1920x1080)
2. Laptop (1366x768)
3. Tablet (iPad: 768x1024)
4. Mobile (iPhone 12 Pro: 390x844)

For each device:
- Navigation menu adapts (hamburger on mobile?)
- Cards/grids reflow properly
- Buttons are large enough to tap (mobile)
- Text is readable (not too small)
- No horizontal scrolling on mobile
- Forms are usable on small screens

Test on actual devices if possible, not just DevTools emulation.
```

**Expected Results:**
- ✅ Responsive at all breakpoints
- ✅ Touch-friendly on mobile
- ✅ No layout breaks
- ✅ Content readable

---

## Test Category 12: Edge Cases & Error Handling

### Test 12.1: Network Errors
**Claude Prompt:**
```
Test offline/network error handling:
1. Open DevTools > Network tab
2. Set throttling to "Offline"
3. Try generating resume
4. Expected: Error message like "Network error. Check your connection."
5. Set throttling to "Slow 3G"
6. Try generating resume again
7. Expected: Slow but should complete or timeout gracefully

Verify error messages are user-friendly, not technical.
```

---

### Test 12.2: Session Timeout
**Claude Prompt:**
```
Test session expiration:
1. Login to account
2. Wait 30+ minutes (or modify session timeout for testing)
3. Try generating resume or accessing protected route
4. Expected: Session expired error
5. Redirects to login page
6. After re-login, redirects back to original page

Session timeout is typically 1-24 hours.
```

---

### Test 12.3: Concurrent Sessions
**Claude Prompt:**
```
Test multiple browser sessions:
1. Login on Chrome
2. Login on Firefox (or incognito) with same account
3. Generate resume on Chrome
4. Check Firefox - does it update?
5. Logout on Chrome
6. Check Firefox - is it still logged in?

Test if app supports multiple sessions or enforces single session.
```

---

### Test 12.4: Browser Compatibility
**Claude Prompt:**
```
Test on multiple browsers:
1. Chrome (latest)
2. Firefox (latest)
3. Safari (latest)
4. Edge (latest)

Check for:
- UI rendering issues
- JavaScript errors
- Feature incompatibilities
- Performance differences

Focus on Chrome and Safari as they represent most users.
```

---

### Test 12.5: Data Validation - Injection Attacks
**Claude Prompt:**
```
Test security against injection attacks:
1. Try SQL injection in form fields:
   - Email: admin'--@example.com
   - Name: Robert'); DROP TABLE users;--
2. Try XSS in text inputs:
   - Name: <script>alert('XSS')</script>
   - Summary: <img src=x onerror=alert('XSS')>
3. Try HTML injection:
   - Summary: <h1>HACKED</h1><marquee>SCROLLING TEXT</marquee>

Expected behavior:
- Inputs sanitized (script tags escaped)
- No JavaScript execution
- No database errors

⚠️ This is security testing - don't be malicious!
```

**Expected Results:**
- ✅ All malicious inputs sanitized
- ✅ No XSS vulnerabilities
- ✅ No SQL injection possible
- ✅ HTML is escaped in display

---

### Test 12.6: Rate Limiting
**Claude Prompt:**
```
Test API rate limiting:
1. Generate 10 resumes rapidly (as fast as possible)
2. Expected behavior:
   - Should allow normal usage
   - May show warning after X requests
   - May block temporarily after abuse threshold
3. Try 100+ rapid API calls (using browser console):
   - fetch('/api/resume/list') repeatedly
4. Expected: Rate limit error (429 Too Many Requests)

Rate limiting prevents API abuse.
```

---

### Test 12.7: Large Data Inputs
**Claude Prompt:**
```
Test handling of unusually large inputs:
1. Paste 10,000-word job description
2. Upload 20MB PDF resume
3. Enter 500-character name
4. Add 1000 skills

Expected behavior:
- Input truncated gracefully
- File size limit enforced (error shown)
- Character limits enforced with counter
- No crashes or hangs

Test app's data limits.
```

---

### Test 12.8: Special Characters
**Claude Prompt:**
```
Test special character handling:
1. Enter name with accents: José García-Müller
2. Enter location with special chars: São Paulo, Brazil
3. Enter emoji in text fields: 😀 💼 🚀
4. Enter right-to-left text (Arabic): مرحبا
5. Enter Chinese characters: 你好

Verify:
- Characters display correctly
- Database stores correctly
- PDF export preserves characters
- No encoding errors (�� symbols)

Unicode support is critical for global apps.
```

---

### Test 12.9: Browser Back/Forward
**Claude Prompt:**
```
Test browser navigation buttons:
1. Navigate through app (Home > Profile > Resumes > Resume Detail)
2. Click browser "Back" button repeatedly
3. Verify:
   - Each back goes to previous page correctly
   - State is preserved (e.g., resume list scroll position)
   - No broken states or errors
4. Click "Forward" button
5. Verify same behavior

Test with and without saving data to check for warnings.
```

---

### Test 12.10: Page Refresh During Action
**Claude Prompt:**
```
Test data loss prevention:
1. Start filling out "Build New Resume" wizard (Step 2/5)
2. Refresh page (F5)
3. Expected:
   - Data is lost (no auto-save) OR
   - Data is preserved (auto-saved to session/db)
4. If data lost, check for warning:
   - "Are you sure? Unsaved changes will be lost."

Test on all multi-step forms (onboarding, resume wizards, etc.).
```

**Expected Results:**
- ✅ Either auto-save works OR warning shown
- ✅ No silent data loss

---

### Test 12.11: Copy/Paste Functionality
**Claude Prompt:**
```
Test copy/paste throughout app:
1. Copy generated resume text from view page
2. Paste into Word/Google Docs
3. Verify:
   - Formatting preserved reasonably
   - No encoding issues
   - Bullets and structure intact
4. Copy resume from PDF
5. Paste back into text editor
6. Verify readability

Test if users can easily copy content.
```

---

### Test 12.12: Accessibility (A11y)
**Claude Prompt:**
```
Test basic accessibility:
1. Navigate app using only keyboard (Tab, Enter, Escape)
2. Verify:
   - All interactive elements are accessible
   - Focus indicators visible
   - Modals can be closed with Escape
   - Forms can be submitted with Enter
3. Check for ARIA labels on icons and buttons
4. Test with screen reader if possible (optional)
5. Verify color contrast (text readable on backgrounds)

Use browser extension like "WAVE" or "Axe" for automated checks.

Accessibility ensures app is usable by everyone.
```

**Expected Results:**
- ✅ Full keyboard navigation
- ✅ Focus indicators visible
- ✅ ARIA labels on icons
- ✅ Good color contrast (WCAG AA minimum)

---

## 📊 Test Results Template

```markdown
# CVstomize Comprehensive Test Report

**Date:** [Date]
**Tester:** [Name]
**Browser:** Chrome [Version]
**Environment:** Production

## Summary
- **Total Tests:** 120
- **Tests Passed:** [X]
- **Tests Failed:** [X]
- **Tests Skipped:** [X]
- **Overall Status:** ✅ PASS / ⚠️ PASS WITH ISSUES / ❌ FAIL

---

## Category Results

### 1. Landing & Marketing (5 tests)
- [x] 1.1 Homepage Load - PASS
- [x] 1.2 Navigation Menu - PASS
- [ ] 1.3 Features Section - SKIP (not implemented)
- [x] 1.4 Pricing Page - PASS
- [x] 1.5 Footer Links - PASS

**Issues:**
1. [None / List issues]

---

### 2. Authentication (8 tests)
- [x] 2.1 Sign Up Flow - PASS
- [x] 2.2 Login Flow - PASS
- [x] 2.3 Forgot Password - PASS
- [x] 2.4 Google Sign-In - PASS
- [x] 2.5 Logout - PASS
- [x] 2.6 Session Persistence - PASS
- [x] 2.7 Protected Routes - PASS
- [x] 2.8 Auth Error Handling - PASS

**Issues:**
1. [None / List issues]

---

[Continue for all 12 categories...]

---

## Critical Bugs (BLOCKERS)
1. [None / List critical issues that prevent launch]

## High Priority Issues
1. [List high-priority bugs]

## Medium Priority Issues
1. [List medium-priority bugs]

## Low Priority / Enhancements
1. [List nice-to-have improvements]

## Recommendations
1. [Strategic suggestions]

---

## Production Readiness Assessment

**GO / NO-GO Decision:** [✅ GO / ❌ NO-GO]

**Reasoning:**
[Explain decision based on test results]

**Remaining Work Before Launch:**
1. [List any pre-launch tasks]

---

**Tested By:** [Name]
**Sign-Off Date:** [Date]
```

---

## 🎯 Testing Priorities

If you have limited time, focus on **CRITICAL PATH** tests first:

**Phase 1 - CRITICAL (Must Pass):**
- Test 2.1: Sign Up
- Test 2.2: Login
- Test 3.7: Complete Onboarding
- Test 5.1-5.8: Build New Resume (full flow)
- Test 6.1-6.8: Upload & Enhance (full flow)
- Test 7.1-7.4: Gold Standard (full flow)
- Test 9.1: View Resume List
- Test 9.5: Resume Detail Page

**Phase 2 - HIGH (Should Pass):**
- Test 4.1-4.3: Profile Management
- Test 8.1-8.5: Gold Standard Assessment
- Test 10.1-10.2: Billing & Upgrade
- Test 12.1-12.5: Core Error Handling

**Phase 3 - MEDIUM (Nice to Have):**
- All remaining tests

---

## ✅ Success Criteria

**Application is PRODUCTION READY if:**
- ✅ 100% of CRITICAL tests pass
- ✅ 90%+ of HIGH tests pass
- ✅ 70%+ of MEDIUM tests pass
- ✅ Zero blocking bugs
- ✅ No data loss scenarios
- ✅ Mobile responsiveness works
- ✅ Performance acceptable (<3s page loads)

**Deployment should be DELAYED if:**
- ❌ Any CRITICAL test fails
- ❌ Authentication broken
- ❌ Cannot generate resumes
- ❌ Data loss bugs found
- ❌ Security vulnerabilities discovered

---

## 🤖 Using Claude Chrome Extension

**Optimal Testing Workflow:**

1. **Open app in Chrome:** https://cvstomize-frontend-351889420459.us-central1.run.app
2. **Open DevTools:** Press F12 (keep open entire session)
3. **Open Claude Extension:** Click extension icon
4. **Start with Category 1:** Copy first test prompt
5. **Paste to Claude:** "Test this page: [paste prompt from test]"
6. **Document results:** Copy Claude's findings to test report
7. **Repeat for all 120 tests**

**Pro Tips:**
- Test in order (categories build on each other)
- Take screenshots of PASS and FAIL states
- Use Chrome DevTools Network tab to verify API calls
- Use Console tab to check for errors
- Test on real mobile device if possible

---

## 📞 Support

**If you encounter critical bugs during testing:**
1. Document reproduction steps
2. Take screenshots/videos
3. Check backend logs: `gcloud run logs read cvstomize-api --limit 100`
4. Create GitHub issue with label "bug" and "testing"
5. Tag as "blocker" if it prevents launch

---

## 🏁 End of Comprehensive Testing Guide

**Total Test Coverage:** 120 tests across 12 categories

This guide ensures **every clickable element**, **every form field**, **every user flow**, and **every edge case** is thoroughly tested before launch.

**Good luck with comprehensive testing! 🚀**
