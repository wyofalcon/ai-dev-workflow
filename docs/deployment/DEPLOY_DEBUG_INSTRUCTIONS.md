# Debug Deployment Instructions

## What Was Fixed

### 1. ✅ Added Verbose Error Logging
Added comprehensive logging to [api/routes/auth.js](api/routes/auth.js):
- Step-by-step console.log for each operation
- Detailed error logging with stack traces, error codes, and messages
- Logs will now appear in Cloud Run stdout

### 2. ✅ Created Database Test Endpoint
Added `GET /api/auth/test/db`:
- Tests Prisma connection directly
- No authentication required
- Returns database query result or detailed error

### 3. ✅ Created Token Test Endpoint
Added `GET /api/auth/test/token`:
- Tests Firebase token verification only (no database)
- Requires valid Firebase token
- Isolates Firebase vs database issues

### 4. ✅ Fixed DATABASE_URL Format
Created deploy script that updates the secret to use Cloud SQL Proxy socket:

**Old (External IP - doesn't work with Cloud SQL Proxy):**
```
postgresql://cvstomize_app:CVst0mize_App_2025!@34.67.70.34:5432/cvstomize?schema=public
```

**New (Unix Socket - correct for Cloud SQL Proxy):**
```
postgresql://cvstomize_app:CVst0mize_App_2025!@localhost/cvstomize?host=/cloudsql/cvstomize:us-central1:cvstomize-db&schema=public
```

---

## Deployment Steps

### Option 1: Use the Deploy Script (Recommended)

```bash
cd ~/cvstomize/api
./deploy-debug.sh
```

This script will:
1. Update the DATABASE_URL secret
2. Build a fresh Docker image
3. Deploy to Cloud Run
4. Test the endpoints automatically

### Option 2: Manual Deployment

```bash
# 1. Update DATABASE_URL secret
echo -n "postgresql://cvstomize_app:CVst0mize_App_2025!@localhost/cvstomize?host=/cloudsql/cvstomize:us-central1:cvstomize-db&schema=public" | \
  gcloud secrets versions add cvstomize-db-url --data-file=-

# 2. Build image
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api --build-arg CACHEBUST=$(date +%s)

# 3. Deploy
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances="cvstomize:us-central1:cvstomize-db" \
  --set-secrets="DATABASE_URL=cvstomize-db-url:latest,GCP_PROJECT_ID=cvstomize-project-id:latest"

# 4. Test database endpoint
curl https://cvstomize-api-351889420459.us-central1.run.app/api/auth/test/db
```

---

## Testing After Deployment

### 1. Check Cloud Run Logs
```bash
gcloud run services logs read cvstomize-api --limit=50
```

You should now see detailed logs like:
```
🧪 Testing database connection...
✅ Database query successful: [...]
```

Or error logs like:
```
❌ Database connection failed: {
  message: "Can't reach database server...",
  code: "P1001"
}
```

### 2. Test Database Connection
```bash
curl https://cvstomize-api-351889420459.us-central1.run.app/api/auth/test/db | jq '.'
```

**Expected Success Response:**
```json
{
  "status": "connected",
  "message": "Database connection successful",
  "result": [{"test": 1, "current_time": "2025-11-03T..."}],
  "prismaVersion": {...}
}
```

**Expected Error Response (if database still failing):**
```json
{
  "status": "failed",
  "message": "Database connection failed",
  "error": "Can't reach database server at `localhost`:`/cloudsql/cvstomize:us-central1:cvstomize-db`",
  "code": "P1001"
}
```

### 3. Test Firebase Token (from Browser Console)
```javascript
// Get current user's token
const token = await firebase.auth().currentUser.getIdToken();

// Test token verification
fetch('https://cvstomize-api-351889420459.us-central1.run.app/api/auth/test/token', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);

// Test registration with verbose logging
fetch('https://cvstomize-api-351889420459.us-central1.run.app/api/auth/register', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

---

## Expected Outcomes

### Scenario A: Database Connection Fixed ✅
If the Unix socket path fix works:
- `/api/auth/test/db` returns 200 with database result
- Logs show: `✅ Database query successful`
- `/api/auth/register` works and creates users
- Problem solved!

### Scenario B: Database Still Failing ❌
If database still can't connect:
- `/api/auth/test/db` returns 500 with Prisma error code
- Logs show: `❌ Database connection failed: Can't reach database server`
- Error will include Prisma error code (P1001, P1002, etc.)
- We'll know the exact Prisma error and can fix accordingly

### Scenario C: Firebase Token Issue ❌
If Firebase token verification fails:
- `/api/auth/test/token` returns 401
- Logs show Firebase error message
- We know the issue is with Firebase, not database

---

## Common Prisma Error Codes

If you see these in the logs:

- **P1001**: Can't reach database server
  - Check Cloud SQL Proxy is attached to Cloud Run
  - Verify socket path in DATABASE_URL

- **P1002**: Database server reached but timed out
  - Database is overloaded or slow
  - Check Cloud SQL instance is running

- **P1003**: Database doesn't exist
  - Database name is wrong (should be `cvstomize`)

- **P1008**: Operations timed out
  - Connection timeout too short
  - Add `?connect_timeout=30` to DATABASE_URL

---

## Files Changed

- [api/routes/auth.js](api/routes/auth.js) - Added verbose logging and test endpoints
- [api/deploy-debug.sh](api/deploy-debug.sh) - Deployment script with DATABASE_URL fix

## Next Steps After Success

Once the 500 errors are resolved:
1. Test complete registration flow end-to-end
2. Remove or disable test endpoints (`/api/auth/test/*`)
3. Reduce logging verbosity for production
4. Update ROADMAP.md to mark Week 2 as 100% complete
5. Begin Week 3: Conversational Profile Builder
