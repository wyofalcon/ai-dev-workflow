# Session 6 Fix Plan - Frontend-Backend Connection Issues

**Date**: 2025-11-03
**Status**: Week 2 - 98% Complete (2 issues to fix)

---

## 🔍 Root Causes Identified

### Issue 1: Frontend Pointing to Wrong Backend ❌
**Problem**: Frontend `.env` has `REACT_APP_API_URL=http://localhost:3001/api`
- Frontend is trying to connect to local backend (port 3001)
- But local backend isn't running - only Cloud Run backend exists
- This explains why no users are created in database

**Evidence**:
```bash
cat ~/cvstomize/.env | grep API
# Result: REACT_APP_API_URL=http://localhost:3001/api
```

**Fix Required**: Update frontend `.env` to point to Cloud Run backend

---

### Issue 2: Firebase Double Initialization Bug Still Occurring ⚠️
**Problem**: Despite our fix, Firebase is still trying to initialize twice
```
✅ Firebase Admin SDK initialized successfully
❌ Failed to get/initialize Firebase Admin SDK: Firebase app named "[DEFAULT]" already exists
```

**Evidence from logs**:
- 05:33:42 - First initialization succeeds
- 05:33:43 - Second initialization fails with "already exists" error
- POST /api/auth/register returns 401 (Firebase middleware failing)

**Root Cause**: The `getFirebaseAdmin()` function is being called multiple times per request
- Once in middleware initialization
- Once when middleware actually runs
- Need to ensure singleton pattern works correctly

---

## 🛠️ Fix Steps for Next Session

### Step 1: Update Frontend .env (5 minutes)

**File**: `/mnt/storage/shared_windows/Cvstomize/.env`

**Change**:
```env
# OLD (wrong - local backend)
REACT_APP_API_URL=http://localhost:3001/api

# NEW (correct - Cloud Run backend)
REACT_APP_API_URL=https://cvstomize-api-351889420459.us-central1.run.app/api
```

**Commands**:
```bash
cd /mnt/storage/shared_windows/Cvstomize

# Update .env file
sed -i 's|http://localhost:3001/api|https://cvstomize-api-351889420459.us-central1.run.app/api|' .env

# Verify change
cat .env | grep API_URL

# Restart frontend (if running)
# npm start will pick up new .env
```

---

### Step 2: Fix Firebase Double Initialization (15 minutes)

**File**: `/mnt/storage/shared_windows/Cvstomize/api/middleware/authMiddleware.js`

**Problem Location**: Lines 10-50 (getFirebaseAdmin function)

**Current Code Issue**:
```javascript
// This gets called multiple times per request
async function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();  // Returns existing app
  }
  // But if called simultaneously, both calls reach here before first finishes
  const app = admin.initializeApp({...});  // Second call fails here
  return app;
}
```

**Solution**: Add a promise-based lock to prevent concurrent initialization

**Fixed Code**:
```javascript
let firebaseInitPromise = null;

async function getFirebaseAdmin() {
  // If already initialized, return existing app
  if (admin.apps.length > 0) {
    console.log('🔥 Firebase app already exists, reusing...');
    return admin.app();
  }

  // If initialization is in progress, wait for it
  if (firebaseInitPromise) {
    console.log('⏳ Firebase initialization in progress, waiting...');
    return firebaseInitPromise;
  }

  // Start initialization and cache the promise
  console.log('🚀 Initializing Firebase Admin SDK...');
  firebaseInitPromise = (async () => {
    try {
      const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
      const client = new SecretManagerServiceClient();

      // Fetch secrets...
      const [projectIdResponse] = await client.accessSecretVersion({
        name: 'projects/351889420459/secrets/cvstomize-project-id/versions/latest',
      });
      const projectId = projectIdResponse.payload.data.toString('utf8');

      const [serviceAccountResponse] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/cvstomize-service-account-key/versions/latest`,
      });
      const serviceAccountKey = JSON.parse(
        serviceAccountResponse.payload.data.toString('utf8')
      );

      // Initialize Firebase
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: projectId,
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
      return app;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      firebaseInitPromise = null; // Reset on error
      throw error;
    }
  })();

  return firebaseInitPromise;
}
```

**What This Fixes**:
- ✅ First call starts initialization and stores promise
- ✅ Concurrent calls wait for the same promise
- ✅ No double initialization possible
- ✅ Error handling resets the promise for retry

---

### Step 3: Test End-to-End (10 minutes)

**After applying both fixes**:

1. **Rebuild and Deploy Backend**:
```bash
cd ~/cvstomize/api

# Build
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api .

# Deploy
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances="cvstomize:us-central1:cvstomize-db" \
  --set-secrets="DATABASE_URL=cvstomize-db-url:latest,GCP_PROJECT_ID=cvstomize-project-id:latest"
```

2. **Restart Frontend** (on local machine):
```bash
cd /mnt/storage/shared_windows/Cvstomize

# Kill existing process
# Ctrl+C if running, or:
pkill -f "react-scripts start"

# Start fresh (will pick up new .env)
npm start
```

3. **Test Registration**:
- Open http://localhost:3010
- Click "Sign Up with Google"
- Complete OAuth
- Check browser console for successful response
- Verify user in database:
```bash
psql -h localhost -p 5432 -U cvstomize_app -d cvstomize_production \
  -c "SELECT id, email, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 5;"
```

---

## 📊 Expected Results After Fixes

**Frontend Logs (Browser Console)**:
```
✅ POST https://cvstomize-api-351889420459.us-central1.run.app/api/auth/register
Status: 201 Created
Response: {"message":"User registered successfully","user":{...}}
```

**Backend Logs (Cloud Run)**:
```
🚀 Initializing Firebase Admin SDK...
✅ Firebase Admin SDK initialized successfully
📝 /api/auth/register - Starting registration
🔍 Checking for existing user: abc123xyz
✅ Database query successful, existing user: false
➕ Creating new user in database
✅ User created successfully, ID: uuid-here
📋 Creating audit log entry
✅ Audit log created
🎉 Registration complete, sending response
```

**Database Query**:
```sql
 id   | email              | display_name | created_at
------+--------------------+--------------+------------------------
 uuid | ashley.caban.c@... | Ashley Caban | 2025-11-03 05:45:00+00
```

---

## 🎯 Success Criteria

✅ Frontend connects to Cloud Run backend (not localhost)
✅ Firebase initializes once per container (no double init errors)
✅ User registration creates record in database
✅ Audit logs track registration, login, logout events
✅ No 401 or 500 errors in authentication flow

**Estimated Time**: 30 minutes total
- 5 min: Update .env
- 15 min: Fix Firebase initialization
- 10 min: Deploy and test

---

## 📁 Files to Modify

1. `/mnt/storage/shared_windows/Cvstomize/.env` - Update REACT_APP_API_URL
2. `/mnt/storage/shared_windows/Cvstomize/api/middleware/authMiddleware.js` - Fix Firebase init

---

## 🔗 Quick Reference

**Frontend URL**: http://localhost:3010
**Backend URL**: https://cvstomize-api-351889420459.us-central1.run.app
**Database**: cvstomize_production (NOT cvstomize)
**Current Revision**: cvstomize-api-00025-7zh (active)

---

## 💡 Why These Issues Occurred

1. **Frontend URL Issue**:
   - Frontend was developed with local backend in mind
   - .env wasn't updated when backend was deployed to Cloud Run
   - Frontend couldn't reach localhost:3001 (not running)

2. **Firebase Double Init**:
   - Concurrent requests calling `getFirebaseAdmin()` simultaneously
   - Both checked `admin.apps.length` before first finished initializing
   - Race condition: both tried to initialize
   - Solution: Promise-based lock ensures single initialization

---

**Status**: Ready to fix next session. Both issues identified with clear solutions.

**Last Updated**: 2025-11-03
**Next Session**: Apply fixes above, test end-to-end, mark Week 2 as 100% complete!
