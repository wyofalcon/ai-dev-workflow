#FOR J




# CVstomize Testing Checklist - Recent Changes (Dec 3-5, 2025)

**Branch:** `merge-preview`  
**Purpose:** Verify recent contributions before merging to main  
**Test Environment:** Local dev or Staging  
**Estimated Time:** 45-60 minutes

---

## 🔑 Test Credentials

| Email | Password | User Type |
|-------|----------|-----------|
| `test1@cvstomize.dev` | `TestPassword123!` | Free tier |
| `test2@cvstomize.dev` | `TestPassword123!` | Premium |
| `unlimited@cvstomize.dev` | `TestPassword123!` | Unlimited |

**Local Dev Login:** Use "Login as Persistent User" button (bypasses Firebase)

---

## ✅ Checklist Summary

| # | Feature Area | Tests | Priority |
|---|--------------|-------|----------|
| 1 | Profile Data Persistence | 5 | 🔴 CRITICAL |
| 2 | UX: Uploaded Resume Management | 6 | 🔴 CRITICAL |
| 3 | Dev Auth Fixes | 3 | 🟡 HIGH |
| 4 | Onboarding Flow (Returning Users) | 4 | 🔴 CRITICAL |
| 5 | Resume Paste UX | 3 | 🟡 HIGH |
| 6 | Gold Standard Access | 2 | 🟡 HIGH |

---

## 1️⃣ Profile Data Persistence (CRITICAL)

**What Changed:** Fixed data format mismatch between parsed resume data and UserProfilePage display. Transformation logic added to handle `highlights` → `description`, `school` → `institution`, `graduationDate` → `endDate`.

### Tests:

- [ ] **1.1** Upload a resume during onboarding
  - Navigate through onboarding with a resume upload
  - Complete onboarding and reach the dashboard

- [ ] **1.2** Verify profile shows parsed data
  - Go to Profile page
  - Confirm experience entries show job titles, companies, descriptions
  - Confirm education entries show schools, degrees, graduation dates
  - Confirm skills are populated

- [ ] **1.3** Logout and login again
  - Click logout
  - Login with same account

- [ ] **1.4** Verify profile data persists after re-login
  - Go to Profile page
  - **CRITICAL:** All experience, education, skills should still be visible
  - No empty sections where data existed before

- [ ] **1.5** Edit and save profile data
  - Make a small edit (add a skill, modify a description)
  - Save changes
  - Logout → Login → Verify edit persisted

**Pass Criteria:** Profile data displays correctly AND persists across logout/login cycles.

---

## 2️⃣ Uploaded Resume Management (CRITICAL)

**What Changed:** Added 5-resume upload limit, delete functionality with auth fix, prevent deletion of primary resume, proper context auth token usage.

### Tests:

- [ ] **2.1** Upload multiple resumes
  - Go to Profile or Resume management
  - Upload 2-3 different resume files
  - Verify all appear in the list

- [ ] **2.2** Set primary resume
  - Click "Set as Primary" on a non-primary resume
  - Verify it becomes the primary
  - Verify the indicator updates correctly

- [ ] **2.3** Attempt to delete primary resume
  - Try to delete the resume marked as primary
  - **Expected:** Should be prevented (error message or disabled button)

- [ ] **2.4** Delete non-primary resume
  - Delete a resume that is NOT the primary
  - Verify it's removed from the list
  - Verify no errors in console

- [ ] **2.5** Hit 5-resume limit
  - Upload resumes until you have 5
  - Try to upload a 6th
  - **Expected:** Should be blocked with appropriate message

- [ ] **2.6** Resume list persistence
  - Logout → Login
  - Verify all uploaded resumes still appear

**Pass Criteria:** Upload limit enforced, primary resume protected, delete works for non-primary.

---

## 3️⃣ Dev Auth Fixes (HIGH)

**What Changed:** Fixed `getIdToken` usage in dev auth context for proper API authentication.

### Tests:

- [ ] **3.1** Dev login works
  - Use "Login as Persistent User" in local dev
  - Verify dashboard loads without auth errors

- [ ] **3.2** API calls succeed with dev auth
  - Navigate to Profile page
  - Open browser DevTools → Network tab
  - Verify API calls return 200 (not 401/403)

- [ ] **3.3** Ephemeral login (if applicable)
  - Test "Login as Ephemeral User" if available
  - Verify it works the same way

**Pass Criteria:** Dev auth tokens work for all protected API routes.

---

## 4️⃣ Onboarding Flow - Returning Users (CRITICAL)

**What Changed:** OnboardingPage now handles returning users who want to upload additional resumes.

### Tests:

- [ ] **4.1** New user onboarding
  - Create/use a fresh account
  - Complete full onboarding flow
  - Verify redirected to dashboard after completion

- [ ] **4.2** Returning user from HomePage upload button
  - As logged-in user, click "Upload Resume" on HomePage
  - Should navigate to onboarding
  - Should allow uploading additional resume(s)
  - Should NOT require re-doing the full onboarding

- [ ] **4.3** Returning user can skip steps
  - Verify returning user can bypass already-completed steps
  - Should be able to upload and proceed quickly

- [ ] **4.4** Multiple resume uploads during onboarding
  - Upload one resume
  - Try to add another
  - Both should be stored and accessible later

**Pass Criteria:** Onboarding works for new users AND returning users without requiring full re-onboarding.

---

## 5️⃣ Resume Paste UX (HIGH)

**What Changed:** Added paste text field option alongside file upload in ConversationalWizard and UploadResumeModal, with warning alert.

### Tests:

- [ ] **5.1** Paste option visible
  - Open resume upload modal
  - Verify there's a text area option to paste resume content
  - Verify warning alert about formatting is visible

- [ ] **5.2** Paste resume text
  - Copy text from a plain text resume
  - Paste into the text area
  - Submit and verify it's processed

- [ ] **5.3** Both options work
  - Verify file upload still works
  - Verify paste option works
  - Verify only one method needed (not both)

**Pass Criteria:** Users can paste resume text as alternative to file upload.

---

## 6️⃣ Gold Standard Access (HIGH)

**What Changed:** Fixed resume API endpoint mismatch (changed `/api/resume` to `/api/resume/list`).

### Tests:

- [ ] **6.1** Resume list loads on HomePage
  - Login and go to HomePage/Dashboard
  - Verify any existing resumes are listed
  - No console errors about failed API calls

- [ ] **6.2** Gold Standard path accessible (if Gold tier user)
  - Use test account with Gold access
  - Start the "Tailor Resume" / Gold Standard flow
  - Verify personality questions appear

**Pass Criteria:** Resume list API works, Gold Standard flow accessible to eligible users.

---

## 🐛 Known Issues to NOT Test (Pre-existing)

These are documented bugs not related to recent changes:

1. **Timeout on /api/conversation/complete** - Resume generation may timeout after 5 questions (production blocker, separate fix needed)

---

## 📝 Testing Notes

**When logging issues, include:**
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Network tab failed requests (if any)

**Report issues to:** Create GitHub issue or note in shared doc

---

## ✅ Sign-Off

| Tester | Date | All Tests Pass? | Notes |
|--------|------|-----------------|-------|
| | | | |

---

*Generated: December 5, 2025*
