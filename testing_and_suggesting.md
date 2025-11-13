# CVstomize - Complete UI Testing Guide for Collaborators

**Version:** 1.0 (Session 29)
**Date:** November 11, 2025
**Purpose:** Comprehensive manual testing of ALL GUI features
**Audience:** QA testers, collaborators, non-technical stakeholders
**Time Required:** 45-60 minutes for full test suite

---

## 📋 Pre-Test Setup

### What You'll Need:
- [ ] Modern web browser (Chrome, Firefox, Safari, Edge)
- [ ] Two email accounts for testing:
  - **Google account** for SSO testing
  - **Any email** for email/password signup testing
- [ ] **Sample resume file** (.pdf, .docx, or .txt) for upload testing
- [ ] **Sample job description** (provided below or use your own)
- [ ] **This checklist** to mark off completed items

### Production URL:
```
https://cvstomize-frontend-351889420459.us-central1.run.app
```

### Test Accounts (Optional):
- **Existing test account:** fco.calisto@gmail.com (Google SSO)
- **Create your own:** Use any email for fresh user testing

---

## 🎯 Testing Strategy

This guide covers **6 major test sections:**

1. **Authentication & Account Management** (SSO + Email/Password)
2. **Resume Generation Flow - WITHOUT Existing Resume**
3. **Resume Generation Flow - WITH Existing Resume Upload**
4. **Resume History & Management**
5. **Profile Management**
6. **Downloads & Export Features**

**How to use this guide:**
- ✅ Check each box as you complete the test
- 📝 Note any issues in the "Issues Found" section at the end
- 🔄 If a test fails, mark it and continue (don't stop testing)

---

# Section 1: Authentication & Account Management

## Test 1.1: Google SSO Signup (New User)

**Objective:** Test Google single sign-on for new user registration

**Steps:**

1. [ ] Open browser in **Incognito/Private mode**
2. [ ] Navigate to: https://cvstomize-frontend-351889420459.us-central1.run.app
3. [ ] Click **"Sign Up"** button in top-right corner
4. [ ] Verify you're redirected to signup page
5. [ ] Click **"Sign in with Google"** button
6. [ ] Select a Google account you've NEVER used with CVstomize before
7. [ ] Grant permissions when prompted

**Expected Results:**
- [ ] Successfully redirected to homepage (/)
- [ ] Top-right shows your Google avatar/photo
- [ ] Top-right shows "0 / 1 resumes" (free tier)
- [ ] Dropdown menu shows your email address
- [ ] No error messages displayed

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 1.2: Email/Password Signup (New User)

**Objective:** Test traditional email/password registration

**Steps:**

1. [ ] Open new Incognito/Private window
2. [ ] Navigate to signup page
3. [ ] Click **"Sign up with Email"** (or similar option)
4. [ ] Fill out form:
   - Email: (use a NEW email you haven't registered)
   - Password: (8+ characters, strong password)
   - Confirm Password: (same as above)
5. [ ] Click **"Sign Up"** or **"Create Account"**
6. [ ] Check email inbox for verification email (if required)
7. [ ] Click verification link (if sent)

**Expected Results:**
- [ ] Account created successfully
- [ ] Redirected to homepage OR verification pending page
- [ ] If email verification required: Email received within 2 minutes
- [ ] After verification: Can log in successfully
- [ ] Profile shows correct email address

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 1.3: Google SSO Login (Existing User)

**Objective:** Test Google login for returning users

**Steps:**

1. [ ] Log out if currently logged in
2. [ ] Click **"Login"** in top-right
3. [ ] Click **"Sign in with Google"**
4. [ ] Select Google account used in Test 1.1
5. [ ] Verify successful login

**Expected Results:**
- [ ] Redirected to homepage
- [ ] Resume count preserved from previous session
- [ ] Avatar/photo displays correctly
- [ ] User data intact (no data loss)

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 1.4: Email/Password Login (Existing User)

**Objective:** Test email/password login for returning users

**Steps:**

1. [ ] Log out if currently logged in
2. [ ] Click **"Login"**
3. [ ] Enter email from Test 1.2
4. [ ] Enter password from Test 1.2
5. [ ] Click **"Sign In"** or **"Log In"**

**Expected Results:**
- [ ] Login successful
- [ ] Redirected to homepage
- [ ] User data preserved

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 1.5: Password Reset Flow

**Objective:** Test forgot password functionality

**Steps:**

1. [ ] Log out
2. [ ] Click **"Login"**
3. [ ] Click **"Forgot Password?"** or similar link
4. [ ] Enter email from Test 1.2
5. [ ] Submit form
6. [ ] Check email inbox
7. [ ] Click reset link in email
8. [ ] Enter new password
9. [ ] Confirm new password
10. [ ] Submit
11. [ ] Try logging in with new password

**Expected Results:**
- [ ] Reset email received within 2 minutes
- [ ] Reset link works (not expired)
- [ ] New password accepted
- [ ] Can log in with new password
- [ ] Old password no longer works

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 1.6: Logout Functionality

**Objective:** Test logout across all auth methods

**Steps:**

1. [ ] While logged in, click avatar/menu in top-right
2. [ ] Click **"Logout"**

**Expected Results:**
- [ ] Redirected to login page
- [ ] Session cleared (can't access protected pages)
- [ ] Must log in again to access features

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 1.7: Profile Completion Modal (First-Time Users)

**Objective:** Test just-in-time profile data collection

**Steps:**

1. [ ] Log in as NEW user (from Test 1.1 or 1.2)
2. [ ] Click **"Create Your AI Resume"** button
3. [ ] Paste any job description
4. [ ] Wait for modal to appear

**Modal Verification:**
- [ ] Modal appears asking for profile information
- [ ] Fields present: Full Name, Phone, Location, LinkedIn URL
- [ ] Email field pre-filled and disabled
- [ ] Full Name pre-filled with Google display name (if SSO user)
- [ ] **"Skip for Now"** button visible
- [ ] **"Save & Continue"** button visible

**Test 1.7a: Skip Profile Completion**

5a. [ ] Click **"Skip for Now"**

**Expected:**
- [ ] Modal closes
- [ ] Can continue with resume generation
- [ ] Resume will have limited contact info

**Test Result:** ✅ PASS / ❌ FAIL

**Test 1.7b: Complete Profile**

5b. [ ] Re-trigger modal (refresh page, start new resume)
6. [ ] Fill in all fields:
   - Full Name: John Smith
   - Phone: (555) 123-4567
   - Location: San Francisco, CA
   - LinkedIn: linkedin.com/in/johnsmith
7. [ ] Click **"Save & Continue"**

**Expected:**
- [ ] Modal closes
- [ ] Profile saved (visible in menu/settings later)
- [ ] Can continue with resume generation
- [ ] Resume will include full contact info

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# Section 2: Resume Generation - WITHOUT Existing Resume

## Test 2.1: Start Resume Creation (Fresh/From Scratch)

**Objective:** Test resume generation flow when user does NOT upload existing resume

**Job Description to Use:**
```
Marketing Manager - Digital Strategy

Join our innovative marketing team as a Digital Marketing Manager!

Responsibilities:
- Lead digital marketing campaigns across social media, email, and paid channels
- Analyze campaign performance and ROI using Google Analytics
- Manage a team of 3 marketing specialists
- Develop content strategy and SEO optimization
- Collaborate with sales team on lead generation

Requirements:
- 5+ years of digital marketing experience
- Expert in Google Analytics, Facebook Ads, Google Ads
- Experience managing marketing teams
- Strong analytical and communication skills
- Bachelor's degree in Marketing or related field
```

**Steps:**

1. [ ] Log in as any test user
2. [ ] Click **"Create Your AI Resume"** button on homepage
3. [ ] Verify you're on the resume creation page

**Expected:**
- [ ] Page loads successfully
- [ ] Form fields visible
- [ ] Clear instructions displayed

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 2.2: Job Description Input (No Resume Upload)

**Steps:**

1. [ ] **DO NOT** upload any existing resume file
2. [ ] **DO NOT** paste any existing resume text
3. [ ] Paste the **Marketing Manager job description** (above) into the Job Description field
4. [ ] Verify character count or word limit (if displayed)
5. [ ] Click **"Next"** or **"Analyze Job Description"** button

**Expected Results:**
- [ ] Job description accepted (no errors)
- [ ] AI analyzes job description (~3-10 seconds)
- [ ] Progress indicator shows analysis happening
- [ ] Advances to question generation step

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 2.3: AI Question Generation & Gap Analysis

**Steps:**

1. [ ] Wait for AI to generate questions
2. [ ] Count how many questions are generated
3. [ ] Read each question

**Expected Results:**
- [ ] **2-5 questions generated** (NOT 11 questions)
- [ ] Questions are RELEVANT to Marketing Manager role
- [ ] Questions ask about:
  - Digital marketing experience
  - Analytics/data skills
  - Team management
  - Campaign examples
  - Motivation/fit
- [ ] UI says **"Answer our questions"** (NOT "Answer 11 questions")
- [ ] Each question has text input field
- [ ] **"Generate Resume"** button visible at bottom

**Question Examples (should be similar):**
- "Tell me about your digital marketing campaign experience..."
- "What analytics tools have you used and how?"
- "Describe your team management experience..."
- "Share an example of a successful campaign you led..."
- "What motivates you in marketing?"

**Test Result:** ✅ PASS / ❌ FAIL
**Actual Question Count:** _____
**Notes:** _______________________________________________

---

## Test 2.4: Answer Questions (Conversational Input)

**Steps:**

1. [ ] Answer each question with 2-4 sentences
2. [ ] Use the sample answers below or create your own realistic answers

**Sample Answers:**

**Q1: Digital marketing experience**
```
I've led digital marketing campaigns for 6 years across SaaS and e-commerce companies. I managed budgets of $50K-200K/month across Facebook Ads, Google Ads, and LinkedIn. My campaigns consistently achieved 3-5x ROAS through A/B testing and audience segmentation. I'm experienced with both brand awareness and performance marketing.
```

**Q2: Analytics tools**
```
I use Google Analytics daily to track user behavior, conversion funnels, and campaign attribution. I've built custom dashboards in Google Data Studio and use Facebook Pixel for retargeting. I also have experience with Mixpanel and Hotjar for deeper user insights. Data-driven decision making is core to my approach.
```

**Q3: Team management**
```
I currently manage a team of 3 marketing specialists - one focused on content, one on paid ads, and one on social media. I hold weekly 1-on-1s, set clear OKRs, and foster a collaborative culture. Last year, my team exceeded our lead generation goals by 40% while staying under budget.
```

**Q4: Successful campaign example**
```
I launched a multi-channel campaign for a product launch that generated 5,000 qualified leads in 30 days. I coordinated email sequences, social media ads, and influencer partnerships. By optimizing ad creative and targeting, we reduced cost-per-lead by 60% compared to previous campaigns. The campaign directly resulted in $500K in new revenue.
```

**Q5: Motivation**
```
I love the creativity and data science blend in marketing. Seeing campaigns go from concept to driving real business results is incredibly rewarding. I'm motivated by challenging goals and continuous learning - the marketing landscape changes fast and I enjoy staying ahead of trends. Building and mentoring teams is also a passion of mine.
```

**Expected Results:**
- [ ] Text input fields accept 200+ characters
- [ ] Can edit answers after typing
- [ ] No character limit errors (unless very long)
- [ ] All questions answerable
- [ ] **"Generate Resume"** button remains visible

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 2.5: Generate Resume (Processing)

**Steps:**

1. [ ] Click **"Generate Resume"** button
2. [ ] Observe processing/loading state

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Progress message shows (e.g., "Generating your resume...")
- [ ] Takes **10-30 seconds** (typical Gemini processing time)
- [ ] No timeout errors
- [ ] No 500/server errors
- [ ] Successfully generates resume

**Test Result:** ✅ PASS / ❌ FAIL
**Processing Time:** _____ seconds
**Notes:** _______________________________________________

---

## Test 2.6: Resume Preview & Content Verification

**Steps:**

1. [ ] Review the generated resume carefully
2. [ ] Scroll through entire resume
3. [ ] Check each section

### **CRITICAL CHECKS:**

**Contact Information (Header):**
- [ ] Shows **YOUR REAL NAME** (from Google or profile)
  - ❌ NOT "Alex Johnson"
  - ❌ NOT "John Doe"
  - ❌ NOT any fake placeholder name
- [ ] Shows your real email address
- [ ] Shows phone (if you entered in profile) OR empty
- [ ] Shows location (if entered) OR empty
- [ ] **NO fake contact information**

**Resume Content:**
- [ ] Professional summary present
- [ ] Summary mentions **digital marketing** or **marketing manager**
- [ ] Experience section exists
- [ ] Experience includes **YOUR ACTUAL ANSWERS**:
  - [ ] "6 years" or similar timeframe (from your answer)
  - [ ] "Google Analytics" mentioned (from Q2)
  - [ ] "Team of 3" or team management (from Q3)
  - [ ] "5,000 leads" or campaign metrics (from Q4)
- [ ] Skills section lists:
  - [ ] Google Analytics
  - [ ] Facebook Ads
  - [ ] Google Ads
  - [ ] (Other tools you mentioned)
- [ ] **NO invented companies** you never mentioned
- [ ] **NO fake experiences** you didn't describe
- [ ] **NO placeholder brackets** like [Your Company], [City, State]

**Formatting:**
- [ ] Professional appearance
- [ ] Proper headings (# for name, ## for sections)
- [ ] Bullet points formatted correctly
- [ ] Consistent style throughout
- [ ] Readable and well-structured

**Test Result:** ✅ PASS / ❌ FAIL
**Issues Found:** _______________________________________________

---

# Section 3: Resume Generation - WITH Existing Resume Upload

## Test 3.1: Start New Resume with Upload

**Objective:** Test resume-first mode where user uploads existing resume

**Steps:**

1. [ ] Navigate to homepage
2. [ ] Click **"Create Your AI Resume"** button
3. [ ] Look for **"Upload Existing Resume"** option or file upload area

**Expected:**
- [ ] File upload button/dropzone visible
- [ ] Accepts .pdf, .docx, .txt files
- [ ] Option to paste resume text instead

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 3.2: Upload Existing Resume File

**Preparation:**
- Use your actual resume file OR download sample from: [provide sample resume URL]
- File should be .pdf, .docx, or .txt format
- Resume should have typical sections (Experience, Education, Skills)

**Steps:**

1. [ ] Click **"Upload Resume"** or drag file to dropzone
2. [ ] Select your resume file
3. [ ] Wait for upload to complete

**Expected Results:**
- [ ] File uploads successfully (progress bar if large file)
- [ ] File name displayed after upload
- [ ] Resume text extracted and displayed (preview)
- [ ] No upload errors
- [ ] Can proceed to next step

**Test Result:** ✅ PASS / ❌ FAIL
**File Type Tested:** _______________
**Notes:** _______________________________________________

---

## Test 3.3: Job Description Input (With Uploaded Resume)

**Job Description to Use:**
```
Senior Software Engineer - Backend

We're seeking an experienced backend engineer to join our platform team.

Responsibilities:
- Design and build scalable microservices using Node.js and Python
- Optimize database performance (PostgreSQL, MongoDB)
- Implement RESTful APIs and GraphQL endpoints
- Collaborate with frontend team on API contracts
- Write comprehensive tests and documentation

Requirements:
- 5+ years backend development experience
- Expert in Node.js or Python
- Strong SQL and NoSQL database skills
- Experience with Docker and Kubernetes
- BS in Computer Science or equivalent
```

**Steps:**

1. [ ] After uploading resume, paste **Senior Software Engineer job description** (above)
2. [ ] Click **"Analyze"** or **"Next"**
3. [ ] Wait for gap analysis

**Expected Results:**
- [ ] System analyzes BOTH your existing resume AND job description
- [ ] Gap analysis performed (~5-10 seconds)
- [ ] Questions generated based on **gaps between your resume and JD**
- [ ] Fewer questions than "from scratch" mode (2-4 questions typical)

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 3.4: Gap Analysis Questions (Resume-First Mode)

**Steps:**

1. [ ] Count questions generated
2. [ ] Read each question carefully

**Expected Results:**
- [ ] **2-4 questions** (fewer than no-resume mode)
- [ ] Questions ask about **GAPS or WEAK AREAS** identified:
  - Missing skills from JD
  - Weak experience areas
  - Specific examples needed
- [ ] Questions do NOT ask about things already strong in your resume
- [ ] UI indicates this is "gap-filling" mode

**Example Questions (depends on resume uploaded):**
- "Tell me about your GraphQL experience..." (if missing from resume)
- "Describe your Kubernetes/container experience..." (if light in resume)
- "Share an example of optimizing database performance..." (needs specifics)

**Test Result:** ✅ PASS / ❌ FAIL
**Question Count:** _____
**Notes:** _______________________________________________

---

## Test 3.5: Answer Gap Analysis Questions

**Steps:**

1. [ ] Answer each gap-focused question with 2-3 sentences
2. [ ] Provide specific examples to fill identified gaps

**Sample Answers (adjust to YOUR resume gaps):**

**Q1: GraphQL experience**
```
I've built GraphQL APIs for two projects in the past year. I designed the schema, implemented resolvers in Node.js, and used Apollo Server. The GraphQL implementation reduced over-fetching and improved mobile app performance by 40% compared to our REST endpoints.
```

**Q2: Kubernetes experience**
```
I've deployed microservices to Kubernetes clusters in AWS EKS. I wrote Helm charts for application deployments and configured auto-scaling based on CPU metrics. I also set up monitoring with Prometheus and Grafana for our K8s infrastructure.
```

**Q3: Database optimization example**
```
I optimized a slow PostgreSQL query that was taking 12 seconds down to 200ms. I analyzed the query plan, added composite indexes, and rewrote the query to avoid N+1 issues. I also implemented connection pooling with PgBouncer to handle increased load.
```

**Expected:**
- [ ] Answers accepted
- [ ] Can proceed to generation

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 3.6: Generate Hybrid Resume

**Steps:**

1. [ ] Click **"Generate Resume"**
2. [ ] Wait for processing (10-30 seconds)
3. [ ] Review generated resume

### **HYBRID RESUME VERIFICATION:**

**What Should Be KEPT (from original resume):**
- [ ] Strong existing experiences preserved
- [ ] Existing job titles and companies intact
- [ ] Education section preserved
- [ ] Strong skills from original resume kept

**What Should Be ENHANCED:**
- [ ] Weak sections improved with new examples
- [ ] Gap areas filled with answers from questions
- [ ] Skills section updated with JD requirements
- [ ] ATS keyword optimization (job-specific terms added)

**What Should Be ADDED:**
- [ ] Missing skills from answers (GraphQL, Kubernetes, etc.)
- [ ] New specific examples from your answers
- [ ] Job-tailored summary
- [ ] Keywords from job description

**Critical Checks:**
- [ ] Shows **YOUR REAL NAME** (not "Alex Johnson")
- [ ] Contact info from profile
- [ ] **NO removal of good existing content**
- [ ] Result is 85%+ relevant to job description
- [ ] Professional formatting maintained

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# Section 4: Resume History & Management

## Test 4.1: Navigate to Resume History

**Steps:**

1. [ ] Generate at least 1 resume (from Section 2 or 3)
2. [ ] Click user avatar/menu in top-right corner
3. [ ] Click **"My Resumes"** menu item

**Expected Results:**
- [ ] Navigate to `/resume` page
- [ ] Page loads successfully (no infinite "Loading...")
- [ ] Resume cards displayed in grid
- [ ] Header shows "My Resumes"
- [ ] **"Create New Resume"** button visible

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 4.2: Resume Cards Display

**Steps:**

1. [ ] Observe all resume cards on the page
2. [ ] Check each card's content

**Per Card, Verify:**
- [ ] **Title** displays (e.g., "Resume for Software Engineer - Full Stack")
- [ ] **Company** displays OR empty space if none
- [ ] **Status chip** shows (e.g., "generated", "draft", "completed")
- [ ] **Created date** displays (e.g., "Nov 10, 2025")
- [ ] **Downloaded date** shows:
  - "Nov 10, 2025" if downloaded
  - "Not yet" if never downloaded
- [ ] **AI tokens** count displays (e.g., "4,308")
- [ ] **Action buttons** visible (View, Download, Delete icons)

**Grid Layout:**
- [ ] Cards arranged in responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- [ ] **ALL CARDS HAVE EQUAL HEIGHT** (no size inconsistencies)
- [ ] Cards have hover effect (lift on hover)
- [ ] Professional appearance

**Test Result:** ✅ PASS / ❌ FAIL
**Total Resumes Displayed:** _____
**Notes:** _______________________________________________

---

## Test 4.3: Search Functionality

**Steps:**

1. [ ] Locate search box (usually top of page)
2. [ ] Type "Software" in search box
3. [ ] Observe results filter in real-time

**Expected:**
- [ ] Results filter instantly (no page reload)
- [ ] Only resumes with "Software" in title or company show
- [ ] Result count updates (e.g., "Showing 2 of 10 resumes")
- [ ] Cards maintain equal height

**Continue Testing:**

4. [ ] Clear search (delete text)
5. [ ] Verify all resumes return
6. [ ] Try search term that matches NO resumes (e.g., "ZZZZZ")

**Expected for No Results:**
- [ ] Shows "No resumes match your filters" message
- [ ] **"Clear Filters"** button appears
- [ ] Can click to clear and return to full list

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 4.4: Filter Dropdown

**Steps:**

1. [ ] Locate **"Filter by status"** dropdown
2. [ ] Click dropdown
3. [ ] Verify options present:
   - [ ] All Statuses
   - [ ] Draft
   - [ ] Completed
   - [ ] Pending

4. [ ] Select **"Completed"** (or status present in your resumes)
5. [ ] Observe filtering

**Expected:**
- [ ] Only resumes with selected status show
- [ ] Result count updates
- [ ] Can combine filter + search
- [ ] Selecting "All Statuses" shows all resumes again

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 4.5: View Resume (Detail Page)

**Steps:**

1. [ ] Click **View icon** (eye icon) on any resume card
2. [ ] Observe navigation

**Expected Results:**
- [ ] Navigate to `/resume/:id` (specific resume page)
- [ ] Full resume content displays
- [ ] Markdown formatted resume visible
- [ ] Download options available on this page
- [ ] Can navigate back to history

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 4.6: Download from History

**Steps:**

1. [ ] Return to "My Resumes" page
2. [ ] Click **Download icon** (arrow down icon) on a resume card

**Expected Results:**
- [ ] Navigate to resume download page OR
- [ ] Navigate to resume detail page with download options
- [ ] Can download in multiple formats

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 4.7: Delete Resume

**Steps:**

1. [ ] Click **Delete icon** (trash icon, red) on a resume card
2. [ ] Observe confirmation dialog

**Expected Results:**
- [ ] Confirmation dialog appears asking "Are you sure?"
- [ ] Dialog has **"Cancel"** and **"Delete"** buttons

**Test 4.7a: Cancel Delete**

3a. [ ] Click **"Cancel"**

**Expected:**
- [ ] Dialog closes
- [ ] Resume NOT deleted (still in list)

**Test 4.7b: Confirm Delete**

3b. [ ] Click delete icon again
4. [ ] Click **"Delete"** or **"Confirm"**

**Expected:**
- [ ] Resume removed from grid immediately
- [ ] Result count updates (e.g., "Showing 9 of 9 resumes")
- [ ] No page reload needed (optimistic UI update)
- [ ] Resume permanently deleted

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 4.8: Empty State (No Resumes)

**Steps:**

1. [ ] Delete all resumes OR use a fresh account with 0 resumes
2. [ ] Navigate to "My Resumes"

**Expected Results:**
- [ ] Shows **"No resumes yet"** message
- [ ] Shows **"Create your first AI-powered resume"** text
- [ ] **"Create Your First Resume"** button visible
- [ ] Button navigates to resume creation flow

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# Section 5: Profile Management

## Test 5.1: View Profile

**Steps:**

1. [ ] Click user avatar/menu in top-right
2. [ ] Look for **"Profile"** or **"Settings"** menu item
3. [ ] Click to view profile

**Expected Results:**
- [ ] Profile page loads OR profile modal opens
- [ ] Shows current profile data:
  - [ ] Full Name
  - [ ] Email (from account)
  - [ ] Phone
  - [ ] Location
  - [ ] LinkedIn URL
- [ ] Data matches what was entered in profile completion modal

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 5.2: Edit Profile

**Steps:**

1. [ ] Click **"Edit"** or **"Edit Profile"** button
2. [ ] Change the following:
   - Full Name: Jane Doe
   - Phone: (555) 987-6543
   - Location: New York, NY
   - LinkedIn: linkedin.com/in/janedoe
3. [ ] Click **"Save"** or **"Update Profile"**

**Expected Results:**
- [ ] Changes saved successfully
- [ ] Success message appears
- [ ] Profile updates reflected immediately
- [ ] Future resumes will use new contact info

**Verify Update:**

4. [ ] Generate a new resume
5. [ ] Check if new contact info appears in resume header

**Expected:**
- [ ] New name "Jane Doe" in header (NOT old name)
- [ ] New phone number in resume
- [ ] New location in resume
- [ ] Updated LinkedIn URL

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 5.3: User Avatar Display

**Steps:**

1. [ ] Check top-right corner of page
2. [ ] Observe user avatar/photo

**For Google SSO Users:**
- [ ] Google profile photo displays correctly
- [ ] Photo loads (not broken image)
- [ ] Photo is circular/rounded
- [ ] Clicking opens dropdown menu

**For Email/Password Users:**
- [ ] Default avatar/icon displays OR
- [ ] First letter of name in circle
- [ ] Clicking opens dropdown menu

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 5.4: Resume Counter Display

**Steps:**

1. [ ] Observe top-right corner (near avatar)
2. [ ] Check resume count display

**Expected:**
- [ ] Shows format: "X / Y resumes"
  - X = resumes generated
  - Y = resume limit
- [ ] Example: "3 / 1 resumes" (if over limit)
- [ ] Example: "0 / 1 resumes" (new user, free tier)

**After Generating Resume:**

3. [ ] Generate a new resume
4. [ ] Return to homepage
5. [ ] Check if counter updated

**Expected:**
- [ ] Counter increments (e.g., "1 / 1" becomes "2 / 1" or upgrades)

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# Section 6: Downloads & Export Features

## Test 6.1: Download Markdown (.md)

**Steps:**

1. [ ] Generate a resume OR navigate to existing resume
2. [ ] Click **"Download Markdown"** button
3. [ ] Check your Downloads folder

**Expected Results:**
- [ ] File downloads successfully
- [ ] File name format: `resume-[title]-[date].md` or similar
- [ ] File size: 1-5 KB (typical)
- [ ] File opens in text editor
- [ ] Content is valid Markdown:
  - [ ] Headers use `#` symbols
  - [ ] Bullet points use `-` or `*`
  - [ ] Formatting preserved

**Test Result:** ✅ PASS / ❌ FAIL
**File Size:** _____ KB
**Notes:** _______________________________________________

---

## Test 6.2: Download PDF - Modern Template

**Steps:**

1. [ ] Click **"Download PDF - Modern"** or select Modern template
2. [ ] Wait for PDF generation (3-10 seconds)
3. [ ] Check Downloads folder
4. [ ] Open PDF file

**Expected Results:**
- [ ] PDF downloads successfully (NO 500 error)
- [ ] File size: 50-200 KB (typical)
- [ ] PDF opens in PDF reader
- [ ] **Visual Inspection:**
  - [ ] Modern, clean design
  - [ ] Professional fonts
  - [ ] Proper spacing and margins
  - [ ] All sections visible
  - [ ] No overlapping text
  - [ ] Contact info at top
  - [ ] Sections clearly separated

**Test Result:** ✅ PASS / ❌ FAIL
**File Size:** _____ KB
**Visual Issues:** _______________________________________________

---

## Test 6.3: Download PDF - Classic Template

**Steps:**

1. [ ] Click **"Download PDF - Classic"**
2. [ ] Wait for generation
3. [ ] Open PDF

**Expected Results:**
- [ ] PDF downloads (NO 500 error)
- [ ] Classic/traditional design
- [ ] Serif or professional font
- [ ] Formal layout
- [ ] All content visible

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 6.4: Download PDF - Minimal Template

**Steps:**

1. [ ] Click **"Download PDF - Minimal"**
2. [ ] Wait for generation
3. [ ] Open PDF

**Expected Results:**
- [ ] PDF downloads (NO 500 error)
- [ ] Minimal, simple design
- [ ] Sans-serif font
- [ ] Clean, uncluttered layout
- [ ] All content visible

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 6.5: Multiple Downloads (Same Resume)

**Steps:**

1. [ ] Download the SAME resume multiple times:
   - Download Markdown
   - Download PDF Modern
   - Download PDF Classic
   - Download PDF Minimal
2. [ ] Check Downloads folder

**Expected Results:**
- [ ] All 4 files downloaded
- [ ] Files have unique names OR numbered (resume-1.pdf, resume-2.pdf)
- [ ] All files open correctly
- [ ] No file corruption

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 6.6: Download Timestamp Update

**Steps:**

1. [ ] Download a resume (any format)
2. [ ] Return to "My Resumes" page
3. [ ] Check the resume card

**Expected Results:**
- [ ] **Downloaded date** field updates
- [ ] Shows current date/time
- [ ] If downloaded multiple times, shows latest download time

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# Section 7: Additional UI/UX Tests

## Test 7.1: Responsive Design - Mobile

**Steps:**

1. [ ] Open browser DevTools (F12)
2. [ ] Toggle device toolbar (mobile view)
3. [ ] Select **iPhone 12 Pro** or **Samsung Galaxy S20**
4. [ ] Navigate through app:
   - Homepage
   - Resume creation
   - Resume history
   - Profile

**Expected Results:**
- [ ] All pages responsive (no horizontal scroll)
- [ ] Buttons appropriately sized (tap-friendly)
- [ ] Text readable (not too small)
- [ ] Resume cards stack vertically (1 column)
- [ ] Menus accessible
- [ ] No broken layouts

**Test Result:** ✅ PASS / ❌ FAIL
**Device Tested:** _______________
**Notes:** _______________________________________________

---

## Test 7.2: Responsive Design - Tablet

**Steps:**

1. [ ] Switch to **iPad Air** or **iPad Pro** view
2. [ ] Navigate through app

**Expected Results:**
- [ ] Resume cards show 2 columns
- [ ] Layout adjusts appropriately
- [ ] Touch-friendly interface
- [ ] No broken layouts

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 7.3: Browser Compatibility - Chrome

**Steps:**

1. [ ] Test entire flow in **Google Chrome**
2. [ ] Check for any console errors (F12 → Console tab)

**Expected Results:**
- [ ] All features work
- [ ] No critical errors in console
- [ ] Warnings acceptable (minor)

**Test Result:** ✅ PASS / ❌ FAIL
**Chrome Version:** _______________
**Notes:** _______________________________________________

---

## Test 7.4: Browser Compatibility - Firefox

**Steps:**

1. [ ] Test entire flow in **Mozilla Firefox**

**Expected Results:**
- [ ] All features work
- [ ] No critical errors

**Test Result:** ✅ PASS / ❌ FAIL
**Firefox Version:** _______________
**Notes:** _______________________________________________

---

## Test 7.5: Browser Compatibility - Safari (Mac only)

**Steps:**

1. [ ] Test entire flow in **Safari**

**Expected Results:**
- [ ] All features work
- [ ] No critical errors

**Test Result:** ✅ PASS / ❌ FAIL
**Safari Version:** _______________
**Notes:** _______________________________________________

---

## Test 7.6: Page Load Performance

**Steps:**

1. [ ] Open Chrome DevTools → Network tab
2. [ ] Reload homepage
3. [ ] Check **Load time** (bottom of Network tab)

**Expected Results:**
- [ ] Homepage loads in < 3 seconds
- [ ] Resume history page loads in < 3 seconds
- [ ] No excessively large assets (>5 MB)

**Test Result:** ✅ PASS / ❌ FAIL
**Homepage Load Time:** _____ seconds
**Notes:** _______________________________________________

---

## Test 7.7: Error Handling - Network Offline

**Steps:**

1. [ ] Open DevTools → Network tab
2. [ ] Set throttling to **Offline**
3. [ ] Try to generate a resume

**Expected Results:**
- [ ] Error message displays
- [ ] Message is user-friendly (not raw error)
- [ ] Suggests checking internet connection
- [ ] App doesn't crash

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 7.8: Long Content Handling

**Steps:**

1. [ ] Paste a VERY LONG job description (3,000+ words)
2. [ ] Answer questions with VERY LONG answers (500+ words each)
3. [ ] Generate resume

**Expected Results:**
- [ ] System accepts long content
- [ ] No character limit errors OR appropriate error message
- [ ] Resume generates successfully
- [ ] PDF doesn't have layout issues

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 7.9: Special Characters in Input

**Steps:**

1. [ ] Enter special characters in job description:
   - Emoji: 🚀 💻 📊
   - Accents: café, résumé, Zürich
   - Symbols: $100K, C++, .NET
2. [ ] Generate resume

**Expected Results:**
- [ ] Special characters accepted
- [ ] Characters display correctly in resume
- [ ] PDF renders characters properly
- [ ] No encoding issues

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 7.10: Session Persistence

**Steps:**

1. [ ] Log in
2. [ ] Start creating a resume (don't finish)
3. [ ] Close browser tab
4. [ ] Re-open app (new tab)

**Expected Results:**
- [ ] Still logged in (session persisted)
- [ ] Resume counter accurate
- [ ] Don't need to log in again

**After 24 Hours:**

5. [ ] Return to app after 24 hours

**Expected:**
- [ ] May need to log in again (session timeout acceptable)
- [ ] Data persisted after re-login

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# Section 8: Edge Cases & Negative Tests

## Test 8.1: Resume Limit Enforcement (Free Tier)

**Steps:**

1. [ ] As a free tier user (limit: 1 resume)
2. [ ] Generate 1 resume successfully
3. [ ] Try to generate a 2nd resume

**Expected Results:**
- [ ] Blocked with limit message: "You've used 1/1 resumes"
- [ ] Offered upgrade option
- [ ] Cannot generate more resumes without upgrading

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 8.2: Empty Job Description

**Steps:**

1. [ ] Start resume creation
2. [ ] Leave job description field EMPTY
3. [ ] Try to proceed

**Expected Results:**
- [ ] Validation error appears
- [ ] Error message: "Job description is required" or similar
- [ ] Cannot proceed to questions

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 8.3: Skip All Questions

**Steps:**

1. [ ] Paste job description
2. [ ] Get questions generated
3. [ ] Leave ALL answers EMPTY
4. [ ] Try to generate resume

**Expected Results:**
- [ ] Validation error OR
- [ ] Resume generates but is very generic/weak
- [ ] User warned about quality

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 8.4: Unsupported File Upload

**Steps:**

1. [ ] Try to upload a file type NOT supported (e.g., .exe, .zip, .jpg)
2. [ ] Observe error

**Expected Results:**
- [ ] Error message: "Only .pdf, .docx, .txt files supported"
- [ ] File rejected
- [ ] Cannot proceed

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

## Test 8.5: Corrupted File Upload

**Steps:**

1. [ ] Create a corrupted .pdf file (rename .txt to .pdf)
2. [ ] Try to upload

**Expected Results:**
- [ ] Error message: "Unable to read file" or similar
- [ ] File rejected
- [ ] User-friendly error (not raw exception)

**Test Result:** ✅ PASS / ❌ FAIL
**Notes:** _______________________________________________

---

# 📊 Test Summary Report

## Overall Results

**Total Tests Executed:** _____ / 85
**Tests Passed:** _____
**Tests Failed:** _____
**Pass Rate:** _____%

**Test Duration:** _____ minutes
**Tester Name:** _______________________
**Test Date:** _______________________
**Environment:** Production

---

## Critical Bugs Found

**Bug #1:**
**Severity:** Critical / High / Medium / Low
**Description:** _______________________________________________
**Steps to Reproduce:** _______________________________________________

**Bug #2:**
**Severity:** Critical / High / Medium / Low
**Description:** _______________________________________________
**Steps to Reproduce:** _______________________________________________

*(Add more as needed)*

---

## Non-Critical Issues Found

**Issue #1:** _______________________________________________
**Issue #2:** _______________________________________________
**Issue #3:** _______________________________________________

---

## Feature-Specific Results

### Authentication (Tests 1.1-1.7)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### Resume Generation - No Upload (Tests 2.1-2.6)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### Resume Generation - With Upload (Tests 3.1-3.6)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### Resume History (Tests 4.1-4.8)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### Profile Management (Tests 5.1-5.4)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### Downloads (Tests 6.1-6.6)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### UI/UX (Tests 7.1-7.10)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

### Edge Cases (Tests 8.1-8.5)
- [ ] ✅ All Passed
- [ ] ⚠️ Some Failed
- [ ] ❌ Critical Failures

**Notes:** _______________________________________________

---

## Session 28 & 29 Bug Verification

**Bug #1 - "Alex Johnson" Fake Contact Info:**
- [ ] ✅ FIXED - Real Google name shows
- [ ] ❌ NOT FIXED - Still shows fake names

**Bug #2 - PDF Generation 500 Errors:**
- [ ] ✅ FIXED - All PDFs download
- [ ] ❌ NOT FIXED - PDFs fail

**Resume History Loading:**
- [ ] ✅ WORKING - Loads from API
- [ ] ❌ BROKEN - Infinite loading

**Card Equal Heights:**
- [ ] ✅ WORKING - All cards equal
- [ ] ❌ BROKEN - Inconsistent heights

---

## Recommendations

**Should we deploy to production?**
- [ ] ✅ YES - Ready for production
- [ ] ⚠️ YES with minor fixes
- [ ] ❌ NO - Critical bugs must be fixed first

**Priority Fixes Required:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Nice-to-Have Improvements:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Additional Notes

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

**Tester Signature:** _______________________
**Date Completed:** _______________________

---

**End of Testing Guide**

---

# Suggestions from the User

- Provide a convenient link to ZipRecruiter, LinkedIn, Indeed.
- Add a disclaimer that our agent may make mistakes and to ALWAYS double-check.
- Add drag and drop functionality to the file upload box.
- In follow-up questions, provide a way to skip the questions (e.g., if they add multiple resumes with all the details already).
- Consider offering the original, simpler application as a standard version and the current build as a "Premium" tier.
- Implement token limits for each person to prevent abuse or malicious intent.
- Provide an option for users to save their responses to follow-up questions, informing them that these are likely interview questions.
- "Complete your profile" information should be auto-filled from resume information, with users prompted to double-check it.
- Offer resume format options or a "surprise me" feature.
- Replace the tagline with "You're more capable than you think, we will prove it."
- Allow for multiple resumes, mainly to extract relevant skills.
- Inform users about accepted file types and maximum upload size (per document or total).
- Add an inappropriate Easter egg.
- Add an FAQ section.
- Add a feedback link or a non-intrusive pop-up to ask for feedback.
- Add a "share with a friend" link.
- Add a "buy the dev a coffee" link.
