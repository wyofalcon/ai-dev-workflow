# Create Test Resume for Gold Standard Testing

**Account:** `claude.test.20250403@example.com`
**Status:** Gold tier ✅ | Needs 1 resume to enable Gold Standard button

---

## Problem

The Gold Standard button on the dashboard requires **at least 1 resume** to be enabled. The test account currently has **0 resumes**.

**Current Status:**
- ✅ Subscription tier: `gold`
- ❌ Resume count: `0`
- ❌ Gold Standard button: Disabled (grayed out)

**Expected After Fix:**
- ✅ Resume count: `1+`
- ✅ Gold Standard button: Enabled (gold/yellow, clickable)

---

## Option 1: Create Resume via UI (Recommended - 2 minutes)

**This is the easiest and most realistic test approach:**

1. **Login** to test account:
   - Go to: https://cvstomize-frontend-351889420459.us-central1.run.app
   - Email: `claude.test.20250403@example.com`
   - Password: [Your test password]

2. **Click "BUILD NEW RESUME/CV"** (purple card)

3. **Fill out the wizard:**
   - **Step 1 - Job Posting:** Paste any job description (e.g., "Software Engineer position requiring Python and React")
   - **Step 2 - Upload Resume:** Skip (click Next)
   - **Step 3 - Select Sections:** Keep defaults (Summary, Experience, Skills, Education)
   - **Step 4 - Personal Info:**
     - Name: Test User
     - Email: claude.test.20250403@example.com
     - Phone: (555) 123-4567
     - Location: San Francisco, CA
   - **Step 5 - Review:** Click "GENERATE RESUME"

4. **Wait ~5-10 seconds** for generation

5. **Verify:**
   - Resume displays successfully
   - Return to dashboard (click logo or back)
   - "Tailor to Specific Job (Gold Standard)" button should now be **ENABLED** (gold/yellow)

---

## Option 2: Via GCP Console SQL (30 seconds)

If you have access to GCP Console:

1. Open: https://console.cloud.google.com/sql/instances/cvstomize-db?project=cvstomize

2. Click **"OPEN CLOUD SHELL EDITOR"**

3. Connect to database:
```bash
gcloud sql connect cvstomize-db --user=cvstomize_app --database=cvstomize_production
# Password: CVstomize_Fresh_2025_2157
```

4. Run SQL:
```sql
-- Insert test resume
INSERT INTO resumes (
  user_id,
  target_company,
  markdown_content,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  'Test Company',
  '# Test User

San Francisco, CA | (555) 123-4567 | claude.test.20250403@example.com

## Professional Summary
Experienced software engineer with expertise in full-stack development.

## Experience
### Software Engineer | Tech Company
*2020 - Present*
- Developed web applications using React and Node.js

## Skills
Python, JavaScript, React, Node.js

## Education
### Bachelor of Science in Computer Science
University of California | 2020',
  'generated',
  NOW(),
  NOW()
FROM users
WHERE email = 'claude.test.20250403@example.com';

-- Verify
SELECT r.id, r.target_company, u.email
FROM resumes r
JOIN users u ON r.user_id = u.id
WHERE u.email = 'claude.test.20250403@example.com';
```

5. Exit: `\q`

---

## Option 3: Via API Call (Advanced)

**Prerequisites:** Firebase auth token for the test account

1. **Get Firebase Token:**
   - Login to https://cvstomize-frontend-351889420459.us-central1.run.app
   - Open DevTools Console (F12)
   - Run: `firebase.auth().currentUser.getIdToken().then(token => console.log(token))`
   - Copy the token

2. **Create Resume via API:**
```bash
curl -X POST https://cvstomize-api-351889420459.us-central1.run.app/api/resume/build-new \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPosting": "Software Engineer position requiring Python and React experience.",
    "selectedSections": ["Summary", "Experience", "Skills", "Education"],
    "personalInfo": {
      "fullName": "Test User",
      "email": "claude.test.20250403@example.com",
      "phone": "(555) 123-4567",
      "location": "San Francisco, CA"
    }
  }'
```

3. **Verify response:**
   - Should return `{"resume": {"id": "...", ...}}`
   - Status code: `200`

---

## Verification Steps

After creating the resume via any method:

1. **Check API:**
```bash
# Get resumes list (replace with actual Firebase token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://cvstomize-api-351889420459.us-central1.run.app/api/resume/list
```

Expected response:
```json
{
  "resumes": [
    {
      "id": "...",
      "targetCompany": "Test Company",
      "status": "generated",
      "createdAt": "2025-12-04T..."
    }
  ],
  "total": 1
}
```

2. **Check Frontend:**
   - Navigate to dashboard
   - Hard refresh (Ctrl+Shift+R)
   - Verify "Tailor to Specific Job (Gold Standard)" button is **clickable**
   - Button should have gold/yellow color (not grayed out)
   - Click button → should navigate to `/create-resume`

3. **Check Database (optional):**
```sql
SELECT
  u.email,
  u.subscription_tier,
  COUNT(r.id) as resume_count
FROM users u
LEFT JOIN resumes r ON u.id = r.user_id
WHERE u.email = 'claude.test.20250403@example.com'
GROUP BY u.email, u.subscription_tier;
```

Expected:
```
email                            | subscription_tier | resume_count
claude.test.20250403@example.com | gold             | 1 (or more)
```

---

## Why This Matters

The Gold Standard feature requires:
1. ✅ **Gold tier subscription** (DONE)
2. ❌ **At least 1 resume** (NEEDED)

Without a resume, the ConversationalWizard cannot:
- Perform gap analysis between existing resume and job description
- Generate personalized questions based on user's background
- Create personality-authentic tailored resumes

---

## Recommended Approach

**Use Option 1 (UI)** because:
- ✅ Tests the complete Build New Resume flow
- ✅ Validates resume generation works end-to-end
- ✅ Creates realistic test data
- ✅ Mimics actual user behavior
- ✅ Takes only 2 minutes

Then proceed with **Gold Standard testing** (Test Categories 7-8):
1. Complete Gold Standard Assessment (30 min)
2. Test Gold Standard Resume Generation (45 min)
3. Compare quality across all 3 paths (15 min)

---

## Troubleshooting

**Button still disabled after creating resume?**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Logout and login again
- Check browser console for errors

**"Resume limit reached" error?**
- Free tier allows 1 resume (currently shows "0 / 1")
- Gold tier allows unlimited
- Check subscription tier: `SELECT subscription_tier FROM users WHERE email='...'`

**API returns 404 or 400?**
- Check Firebase auth token is valid
- Check API logs: `gcloud run services logs read cvstomize-api --region=us-central1 --limit=20`
- Verify user exists: `SELECT * FROM users WHERE email='claude.test.20250403@example.com'`

---

**Next Step:** Choose Option 1, 2, or 3 above to create the test resume, then verify the Gold Standard button becomes enabled.
