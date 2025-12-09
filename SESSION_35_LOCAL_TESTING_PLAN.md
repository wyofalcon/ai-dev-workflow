# 🧪 Session 35 - Local Testing Plan (Before Production Deployment)

**Date:** December 9, 2025
**PRs:** #23 (Auto-skip assessment), #24 (Resume context)
**Status:** Ready for local testing

---

## 🎯 Testing Strategy

**Goal:** Validate both features work correctly BEFORE deploying to production

**Method:** Local development testing with database connection to production DB

---

## 🔧 Setup: Local Testing Environment

### Step 1: Checkout Feature Branches

```bash
# Test PR #23 first (Auto-skip assessment)
git checkout feature/35-fix-redundant-assessment

# Install dependencies
npm install
cd api && npm install && cd ..
```

### Step 2: Configure Environment

```bash
# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:5000/api

# Backend (api/.env)
DATABASE_URL=postgresql://cvstomize_app:CVstomize_Fresh_2025_2157@34.67.70.34/cvstomize_production
GOOGLE_CLOUD_PROJECT=cvstomize
# ... (copy other env vars from production)
```

### Step 3: Start Local Servers

```bash
# Terminal 1: Start Backend
cd api
npm start

# Terminal 2: Start Frontend
npm start
```

**Frontend:** http://localhost:3000
**Backend:** http://localhost:5000

---

## ✅ TEST 1: Auto-Skip Personality Assessment (PR #23)

### Prerequisites
- Use existing Gold account: `claude.test.20250403@example.com` (password: TestGold2025!)
- This account already has a completed personality profile

### Test Steps

1. **Login to local app**
   - Navigate to http://localhost:3000
   - Login with Gold account

2. **Navigate to Gold Standard**
   - Click "TAILOR TO SPECIFIC JOB (GOLD STANDARD)" card
   - **Expected:** Should see "Checking your profile status..." spinner

3. **Verify Auto-Skip Behavior**
   - **Expected:** After 1-2 seconds, automatically skip to results/resume generation
   - **Should NOT see:** "Start Assessment" button or 35-question wizard
   - **Should see:** OCEAN scores from existing profile OR resume generation form

4. **Check Browser Console**
   - Open DevTools → Console
   - **Expected log:** "Gold Standard profile already complete, loading results..."
   - **Expected API call:** POST /api/gold-standard/start → returns `status: 'already_complete'`

5. **Test Error Handling**
   - Simulate network failure (throttle in DevTools)
   - **Expected:** Graceful fallback - can still click "Start Assessment" button

### Success Criteria
- ✅ Profile completion check happens automatically on mount
- ✅ Users with existing profiles skip directly to results
- ✅ Loading spinner shows during check
- ✅ No redundant 35-question assessment

---

## ✅ TEST 2: Resume Context Integration (PR #24)

### Prerequisites
- Existing user with uploaded/generated resumes in database
- OR create test data manually

### Setup Test Data (If Needed)

```sql
-- Check if test user has resumes
SELECT COUNT(*) FROM uploaded_resumes WHERE user_id = (SELECT id FROM users WHERE email = 'claude.test.20250403@example.com');
SELECT COUNT(*) FROM resumes WHERE user_id = (SELECT id FROM users WHERE email = 'claude.test.20250403@example.com');

-- If none exist, you can insert test data or upload a resume via the app
```

### Test Steps

1. **Checkout PR #24 branch**
   ```bash
   git checkout feature/35-resume-context-integration
   npm install
   cd api && npm install && cd ..
   ```

2. **Start servers** (same as Test 1)

3. **Generate a new resume**
   - Login as Gold user
   - Start resume generation (any path: Gold Standard, Upload & Enhance, or Build New)
   - Provide job description

4. **Check Backend Logs**
   - Watch terminal running `npm start` in api/
   - **Expected logs:**
     ```
     📚 Fetching resume context for user <userId> (limit: 5)...
     ✅ Found X uploaded + Y generated resumes
     📊 Aggregated context: {skills: 20, experience: 3, achievements: 5, ...}
     ```

5. **Inspect Generated Resume**
   - After resume is generated, review content
   - **Expected:** Resume includes:
     - Skills from previous resumes
     - Consistent job titles
     - Experience that matches past resumes

6. **Verify Token Efficiency**
   - Check logs for Gemini API call
   - **Expected:** Resume context included in prompt but limited to prevent bloat
   - Prompt should show: "📁 RESUME HISTORY CONTEXT (from X previous resumes)"

### Success Criteria
- ✅ Resume context fetched from database
- ✅ Skills aggregated from uploaded + generated resumes
- ✅ Context included in Gemini prompt
- ✅ Generated resume shows continuity with past resumes
- ✅ No token bloat (5 resume limit enforced)

---

## 📊 TEST 3: Integration Test (Both Features Together)

### Scenario: Returning Gold User Generates New Resume

1. **Login** as Gold user (with existing profile + past resumes)

2. **Navigate to Gold Standard**
   - **Expected:** Auto-skip to results (PR #23 working)

3. **Generate new resume** with job description
   - **Expected:** Resume context pulled from pool (PR #24 working)

4. **Verify combined behavior:**
   - ✅ No redundant assessment (saved 25+ minutes)
   - ✅ Resume includes skills from past resumes
   - ✅ Consistent work history across versions

---

## 🐛 Common Issues & Troubleshooting

### Issue: Frontend can't connect to backend
**Fix:** Check REACT_APP_API_URL in .env.local is http://localhost:5000/api

### Issue: Database connection fails
**Fix:** 
- Verify DATABASE_URL has correct IP: 34.67.70.34
- Check firewall allows your IP to connect to Cloud SQL
- OR use Cloud SQL Proxy: `cloud-sql-proxy cvstomize:us-central1:cvstomize-db`

### Issue: "Profile not found" error
**Fix:** 
- Verify test account exists: `claude.test.20250403@example.com`
- Check personality_profiles table has entry for this user
- Run: `SELECT * FROM personality_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'claude.test.20250403@example.com');`

---

## ✅ When Local Tests Pass → Deploy to Production

**After both PRs tested locally and working:**

1. **Merge PR #23** to `dev`
2. **Merge PR #24** to `dev`
3. **Deploy to GCP Cloud Run:**
   ```bash
   # Deploy backend
   gcloud run deploy cvstomize-api --source ./api --region us-central1
   
   # Deploy frontend
   gcloud run deploy cvstomize-frontend --source . --region us-central1
   ```
4. **Test on production URL:** https://cvstomize-frontend-351889420459.us-central1.run.app
5. **Use Claude Chrome Extension** to run full comparison test

---

## 📝 Notes

- Local testing allows iteration without production downtime
- You can use production database safely (read-only for testing)
- Once validated locally, production deployment is low-risk
- Consider creating a staging environment for future iterations

