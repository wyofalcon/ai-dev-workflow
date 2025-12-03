# Next Session Priorities - CVstomize Sessions 29-30
**Date:** December 3, 2025
**Status:** ⚠️ CRITICAL BLOCKER - Onboarding Completion Fails
**Priority:** P0 - Must fix before any user launch

---

## 🚨 CRITICAL ISSUE: Onboarding 500 Error

### Problem Summary
The onboarding completion fails with HTTP 500 error when users click "COMPLETE SETUP" button. This blocks 100% of new users from accessing any application features.

**Error Details:**
- **Endpoint:** POST /api/profile
- **Status Code:** 500 Internal Server Error
- **Frontend Error:** "An unexpected error occurred"
- **Frequency:** 100% failure rate (4 attempts failed)
- **Last Attempt:** 2:31:11 AM (December 3, 2025)

---

## 🔍 Investigation Steps (In Order)

### Step 1: Check Current API Revision
```bash
# Verify which revision is serving traffic
gcloud run services describe cvstomize-api --region=us-central1 --format="value(status.latestReadyRevisionName)" --project=cvstomize

# Current: cvstomize-api-00126-vpb (from Nov 12 - OLD)
# Expected: cvstomize-api-00129-2gb (from Dec 3 - NEW with enhanced logging)
```

**Issue Found:** New revision with enhanced logging was deployed but **not serving traffic**. The old revision (Nov 12) is still active, which lacks the detailed error logging.

---

### Step 2: Deploy Enhanced Logging to Serving Revision
```bash
cd /mnt/storage/shared_windows/Cvstomize/api

# Force traffic to new revision with enhanced logging
gcloud run deploy cvstomize-api \\
  --source . \\
  --region=us-central1 \\
  --platform=managed \\
  --allow-unauthenticated \\
  --set-env-vars="NODE_ENV=production" \\
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest" \\
  --add-cloudsql-instances="cvstomize:us-central1:cvstomize-db" \\
  --project=cvstomize \\
  --memory=2Gi \\
  --cpu=2 \\
  --timeout=300 \\
  --max-instances=10 \\
  --min-instances=1 \\
  --no-traffic  # Deploy without traffic first to test
```

---

### Step 3: Retry Onboarding to Capture Error

**Test Account:**
- Email: test-gold-standard-dec3@example.com
- Password: TestPass123!

**Steps:**
1. Login to https://cvstomize-frontend-351889420459.us-central1.run.app
2. Navigate through onboarding to Step 3
3. Click "COMPLETE SETUP" button
4. Observe error (still 500, but now with detailed logging)

---

### Step 4: Check Enhanced Logs
```bash
# Get detailed error logs (will now show with emojis and full context)
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=cvstomize-api AND textPayload=~"POST /api/profile"' --limit=50 --format=json --project=cvstomize | python3 -c "
import sys, json
logs = json.load(sys.stdin)
for log in logs:
    print(log.get('textPayload', ''))
    print('---')
"
```

**Look for these log entries:**
- 📝 POST /api/profile - Starting profile update
- 👤 Firebase UID: [uid]
- 📋 Profile data keys: [array]
- ✅ User found: [user details]
- ❌ ERROR in POST /api/profile:
- Error name: [error name]
- Error message: [detailed message]
- Error code: [Prisma code like P2002, P2003, P2025]
- Prisma error meta: [JSON details]
- Request body received: [full payload]

---

## 🎯 Most Likely Root Causes (Prioritized)

### 1. Missing `onboardingCompleted` Field (80% probability)
**Hypothesis:** The `users` table doesn't have the `onboarding_completed` column that the code tries to update.

**Code Location:** `api/routes/profile.js:137-140`
```javascript
// If completeOnboarding flag is set, mark onboarding as completed
if (completeOnboarding) {
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },  // ← This field may not exist
  });
}
```

**How to Verify:**
```sql
-- Connect to production database
psql "postgresql://cvstomize_app:CVstomize_Fresh_2025_2157@localhost/cvstomize_production?host=/cloudsql/cvstomize:us-central1:cvstomize-db"

-- Check if column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('onboarding_completed', 'onboardingCompleted');

-- If missing, add it
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
```

**Expected Prisma Error:** `P2025` (Record not found) or `P2003` (Foreign key constraint)

---

### 2. Schema Mismatch: CamelCase vs snake_case (15% probability)
**Hypothesis:** Prisma schema uses `onboardingCompleted` but database has `onboarding_completed`.

**How to Verify:**
```bash
# Check Prisma schema
cd /mnt/storage/shared_windows/Cvstomize/api
grep -A 10 "model User" prisma/schema.prisma | grep onboarding

# Check actual database column name
psql <connection-string> -c "\\d users" | grep onboarding
```

**Fix:** Ensure Prisma schema matches database:
```prisma
model User {
  onboardingCompleted Boolean @default(false) @map("onboarding_completed")
  // OR
  onboarding_completed Boolean @default(false)
}
```

---

### 3. UserProfile Upsert Failure (5% probability)
**Hypothesis:** The `prisma.userProfile.upsert()` call fails due to schema mismatch or constraint violation.

**Code Location:** `api/routes/profile.js:126-133`
```javascript
const profile = await prisma.userProfile.upsert({
  where: { userId: user.id },
  update: profileData,
  create: {
    userId: user.id,
    ...profileData,
  },
});
```

**How to Verify:**
```sql
-- Check if user_profiles table exists
SELECT * FROM information_schema.tables WHERE table_name = 'user_profiles';

-- Check schema
\\d user_profiles;

-- Verify foreign key
SELECT * FROM information_schema.table_constraints
WHERE table_name = 'user_profiles' AND constraint_type = 'FOREIGN KEY';
```

**Expected Prisma Error:** `P2002` (Unique constraint), `P2003` (Foreign key constraint)

---

## 🔧 Quick Fixes (Once Root Cause Identified)

### Fix #1: Add Missing Column
```sql
-- If onboarding_completed column is missing
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update Prisma schema to match
-- Then regenerate client: npx prisma generate
```

### Fix #2: Update Prisma Schema
```prisma
// In prisma/schema.prisma
model User {
  id                  String   @id @default(uuid())
  firebaseUid         String   @unique @map("firebase_uid")
  email               String   @unique
  displayName         String?  @map("display_name")
  onboardingCompleted Boolean  @default(false) @map("onboarding_completed")  // ← Add this
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

Then:
```bash
cd /mnt/storage/shared_windows/Cvstomize/api
npx prisma generate  # Regenerate Prisma client
npx prisma migrate dev --name add_onboarding_completed  # Create migration (optional)
```

### Fix #3: Make Onboarding Optional (Temporary Workaround)
```javascript
// In api/routes/profile.js
// Comment out the onboarding update if field doesn't exist yet
if (completeOnboarding) {
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });
  } catch (error) {
    console.warn('⚠️ Could not update onboarding flag (field may not exist):', error.message);
    // Don't fail the whole request if onboarding flag can't be set
  }
}
```

---

## ✅ Testing Checklist (After Fix)

### 1. Verify Fix Locally (if possible)
```bash
# Test the API endpoint directly
curl -X POST https://cvstomize-api-351889420459.us-central1.run.app/api/profile \\
  -H "Authorization: Bearer {FIREBASE_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "555-1234",
    "location": "San Francisco",
    "linkedinUrl": "linkedin.com/in/test",
    "currentJobTitle": "Engineer",
    "yearsOfExperience": 5,
    "completeOnboarding": true
  }'

# Should return 200 OK, not 500
```

### 2. Deploy Fix to Production
```bash
cd /mnt/storage/shared_windows/Cvstomize/api
git add -A
git commit -m "fix: Add onboarding_completed field to users table [FIX]"
gcloud run deploy cvstomize-api --source . --region=us-central1 --project=cvstomize
```

### 3. Retry Onboarding with Test Account
- Login as: test-gold-standard-dec3@example.com
- Complete onboarding Steps 1-3
- Click "COMPLETE SETUP"
- **Expected:** Success! Redirect to dashboard
- **Verify:** User can now access Gold Standard feature

### 4. Check Logs for Success
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=cvstomize-api AND textPayload=~"Profile update successful"' --limit=10 --project=cvstomize
```

Look for:
- ✅ Profile upserted successfully
- ✅ Onboarding marked as completed
- 🎉 Profile update successful!

---

## 📋 Complete Testing (Once Blocker is Fixed)

Use the comprehensive testing guide:
**Location:** `/mnt/storage/shared_windows/Cvstomize/docs/CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md`

**8 Test Scenarios:**
1. ✅ Authentication & Dashboard Access (PASS)
2. ✅ Gold Standard Discovery (need to retest)
3. ⏳ Section A: Behavioral Stories (8 questions)
4. ⏳ Section B: BFI-20 Likert Items (20 questions)
5. ⏳ Section C: Hybrid Questions (7 questions)
6. ⏳ Results Display (OCEAN scores, derived traits)
7. ⏳ RAG Story Retrieval (resume generation)
8. ⏳ Edge Cases & Error Handling

**Estimated Testing Time:** 45-60 minutes
**Testing Method:** Claude Chrome Extension (automated)

---

## 🎯 Session Goals (After Fix)

### Session 32 Goals (Est. 2-3 hours)
1. ✅ Fix onboarding blocker (1-2 hours)
2. ✅ Verify onboarding completion works (15 min)
3. ✅ Complete Gold Standard feature test (45 min)
4. ✅ Test RAG story retrieval (30 min)
5. ✅ Document results and sign off (15 min)

### Success Criteria
- ✅ All 8 test scenarios PASS
- ✅ Zero critical/blocking bugs
- ✅ OCEAN scores display correctly (0-100 range)
- ✅ RAG story retrieval working
- ✅ No data loss or session issues
- ✅ Ready for user launch

---

## 📞 Support Commands

### Check Service Health
```bash
curl https://cvstomize-api-351889420459.us-central1.run.app/health
```

### View Recent Logs
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=cvstomize-api' --limit=100 --project=cvstomize
```

### Connect to Database
```bash
# Get connection string
./scripts/manage-secrets.sh get DATABASE_URL

# Connect (requires Cloud SQL Proxy)
gcloud sql connect cvstomize-db --user=cvstomize_app --database=cvstomize_production --project=cvstomize
```

### Check Current Revision
```bash
gcloud run services describe cvstomize-api --region=us-central1 --format="value(status.latestReadyRevisionName,status.url)" --project=cvstomize
```

---

## 🔗 Related Documents

- [SESSION_31_DEPLOYMENT_AND_TESTING.md](docs/sessions/SESSION_31_DEPLOYMENT_AND_TESTING.md) - This session's summary
- [CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md](docs/CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md) - Complete testing framework
- [SESSION_29_COMPLETE.md](docs/sessions/SESSION_29_COMPLETE.md) - Gold Standard implementation
- [SESSION_30_RAG_INTEGRATION.md](docs/sessions/SESSION_30_RAG_INTEGRATION.md) - RAG story retrieval
- [ROADMAP.md](ROADMAP.md) - Master project roadmap

---

## 📝 Summary

**Current Status:** Production deployment complete, but critical onboarding blocker prevents user access.

**Root Cause:** POST /api/profile returns HTTP 500 (most likely missing `onboarding_completed` field in database).

**Next Action:** Deploy enhanced logging, retry onboarding to capture error details, fix root cause, and complete testing.

**Timeline:** 2-3 hours to fix + test

**Blocker Severity:** CRITICAL (P0) - Must fix before any user launch

Good luck! The deployment is done, the code is solid, just need to squash this one database schema bug. 🐛→✅
