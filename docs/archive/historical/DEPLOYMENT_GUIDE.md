# 🚀 CVstomize Deployment Guide

**Last Updated:** November 6, 2025
**Purpose:** Prevent secret configuration issues and streamline future deployments

---

## 📋 Overview

CVstomize uses **direct environment variables** (not Secret Manager) for deployment. This guide documents the correct deployment process.

---

## ✅ What Was Fixed (Session 17)

### **Issue:** Job descriptions showing generic "Position (extracted from JD)" instead of actual job titles

**Root Cause:** Gemini API response handling bug in `jobDescriptionAnalyzer.js`

**Fix Applied:**
```javascript
// Before (BROKEN):
const result = await model.generateContent(prompt);
const responseText = result.response.text(); // ❌ Missing await

// After (FIXED):
const result = await model.generateContent(prompt);
const response = await result.response;  // ✅ Await the Promise
const responseText = response.text();    // ✅ Now works
```

**Commit:** `f8224d8`
**Build:** `53de2800-1ed0-4ef1-a971-eced4b765caf`
**Deployed:** Revision `cvstomize-api-00056-pxv` (updated image, same revision name)

---

## 🔐 Secret Manager Created (But Not Used)

During troubleshooting, we created secrets in Secret Manager for future use:

| Secret Name | Value | Purpose |
|------------|-------|---------|
| DATABASE_URL | `postgresql://cvstomize_app:...@localhost/cvstomize_production?host=/cloudsql/...` | Database connection |
| GEMINI_API_KEY | `VERTEX_AI_USES_ADC_NOT_API_KEY` | Placeholder (Vertex uses IAM) |
| JWT_SECRET | `[random 32-byte base64]` | JWT signing |
| GCS_BUCKET_NAME | `cvstomize-resumes-prod` | Cloud Storage bucket |
| FIREBASE_PROJECT_ID | `cvstomize` | Firebase project |
| FIREBASE_CLIENT_EMAIL | `firebase-adminsdk-fbsvc@cvstomize.iam.gserviceaccount.com` | Firebase service account |
| FIREBASE_PRIVATE_KEY | `NOT_CURRENTLY_USED_PLACEHOLDER` | Firebase private key |

**IAM Permissions Granted:**
- `cvstomize-deployer@cvstomize.iam.gserviceaccount.com` has:
  - `roles/secretmanager.admin` - Create/manage secrets
  - `roles/secretmanager.secretAccessor` - Read secrets

**These secrets are available but NOT currently used.** The deployment uses direct env vars instead.

---

## 🚀 Correct Deployment Method

### **Option 1: Update Existing Service (Recommended)**

This updates the Docker image while keeping all existing configuration:

```bash
gcloud run services update cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1
```

✅ **This is the simplest and safest method** - it preserves all environment variables and Cloud SQL configuration.

---

### **Option 2: Full Deployment with Env Vars**

If you need to redeploy from scratch or modify configuration:

```bash
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account cvstomize-deployer@cvstomize.iam.gserviceaccount.com \
  --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
  --set-env-vars "NODE_ENV=production,LOG_LEVEL=info,ENABLE_CLOUD_STORAGE=true,GCS_RESUMES_BUCKET=cvstomize-resumes-prod,GCP_PROJECT_ID=cvstomize,DATABASE_URL=postgresql://cvstomize_app:CVst0mize_App_2025!@localhost/cvstomize_production?host=/cloudsql/cvstomize:us-central1:cvstomize-db,CORS_ORIGIN=https://cvstomize-frontend-351889420459.us-central1.run.app" \
  --port=3001 \
  --timeout=60 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10
```

**⚠️ Important Notes:**
- DATABASE_URL must use Cloud SQL Unix socket: `?host=/cloudsql/cvstomize:us-central1:cvstomize-db`
- Do NOT set PORT as env var (Cloud Run sets it automatically)
- Use `--port=3001` flag instead
- Must include `--add-cloudsql-instances` for database connectivity

---

### **Option 3: Migrate to Secret Manager (Future)**

To use Secret Manager instead of env vars:

1. **Update secrets to use correct values** (already created):
```bash
# DATABASE_URL is already correct (version 3)
gcloud secrets versions access latest --secret=DATABASE_URL --project=cvstomize
```

2. **Deploy with `--set-secrets` instead of `--set-env-vars`:**
```bash
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account cvstomize-deployer@cvstomize.iam.gserviceaccount.com \
  --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest" \
  --port=3001 \
  --timeout=60 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10
```

**Benefits:**
- ✅ Credentials not visible in service YAML
- ✅ Easier rotation (update secret, redeploy)
- ✅ Audit logs for secret access

**Note:** This was NOT implemented yet to avoid complexity during the Gemini bug fix.

---

## 🔍 Verifying Deployment

### 1. Check Service Health
```bash
curl https://cvstomize-api-351889420459.us-central1.run.app/health
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. Check Vertex AI Initialization
```bash
gcloud run services logs read cvstomize-api --region us-central1 --limit 20 | grep "Vertex AI"
```

**Expected Output:**
```
✅ Vertex AI initialized for project: cvstomize
```

### 3. Check Current Revision
```bash
gcloud run services describe cvstomize-api --region us-central1 --format="value(status.traffic[0].revisionName,status.traffic[0].percent)"
```

### 4. View Environment Variables
```bash
gcloud run services describe cvstomize-api --region us-central1 --format yaml | grep -A 20 "env:"
```

---

## 📝 Standard Deployment Workflow

### **Step 1: Make Code Changes**
```bash
cd /mnt/storage/shared_windows/Cvstomize
# Edit code, test locally
git add -A
git commit -m "feat: your changes here"
```

### **Step 2: Build Docker Image**
```bash
cd api
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api
```

### **Step 3: Deploy to Cloud Run**
```bash
gcloud run services update cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1
```

### **Step 4: Verify**
```bash
curl https://cvstomize-api-351889420459.us-central1.run.app/health
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Secret not found" errors
**Cause:** Trying to use `--set-secrets` when secrets don't have correct values or service wasn't configured for them.

**Solution:** Use Option 1 (`services update`) or Option 2 (direct env vars).

### Issue 2: "Empty host in database URL"
**Cause:** DATABASE_URL doesn't include the Unix socket path.

**Solution:** Must use this format:
```
postgresql://cvstomize_app:PASSWORD@localhost/cvstomize_production?host=/cloudsql/cvstomize:us-central1:cvstomize-db
```

### Issue 3: "Container failed to start on PORT"
**Cause:** Container not listening on the port Cloud Run expects.

**Solution:**
- Use `--port=3001` flag (not `--set-env-vars PORT=3001`)
- Ensure `api/index.js` listens on `process.env.PORT || 3001`

### Issue 4: "Can't reach database server at 34.67.70.34"
**Cause:** Missing `--add-cloudsql-instances` flag.

**Solution:** Always include:
```bash
--add-cloudsql-instances cvstomize:us-central1:cvstomize-db
```

### Issue 5: Deployment succeeds but old code runs
**Cause:** Cloud Run cached an old revision.

**Solution:**
```bash
# Force traffic to latest revision
gcloud run revisions list --service cvstomize-api --region us-central1
gcloud run services update-traffic cvstomize-api \
  --to-revisions LATEST_REVISION_NAME=100 \
  --region us-central1
```

---

## 🛡️ Preventing Future Issues

### ✅ DO:
- Use `gcloud run services update` for code changes (Option 1)
- Test locally before deploying
- Check logs after deployment: `gcloud run services logs read cvstomize-api --region us-central1 --limit 50`
- Commit code changes before building/deploying
- Keep this guide updated with new env vars or configuration

### ❌ DON'T:
- Use `--set-secrets` unless you've verified all secrets exist and have correct values
- Set PORT in `--set-env-vars` (Cloud Run sets it automatically)
- Use public IP for DATABASE_URL (use Unix socket)
- Deploy without checking current working configuration first

---

## 📚 Related Documentation

- [GEMINI_FIX_DEPLOYMENT.md](GEMINI_FIX_DEPLOYMENT.md) - Detailed analysis of Session 17 Gemini bug fix
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - All credentials and access info
- [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) - Session 16 initial production deployment
- [ROADMAP.md](ROADMAP.md) - Project roadmap and status

---

## 🔄 Change Log

| Date | Change | Session |
|------|--------|---------|
| 2025-11-06 | Created guide after Gemini bug fix and secret troubleshooting | Session 17 |
| 2025-11-06 | Fixed Gemini API response handling bug (f8224d8) | Session 17 |
| 2025-11-06 | Created 7 secrets in Secret Manager (not yet used in deployment) | Session 17 |
| 2025-11-06 | Granted Secret Manager permissions to cvstomize-deployer SA | Session 17 |

---

**Last Verified:** 2025-11-06 05:19 UTC
**Current Revision:** cvstomize-api-00056-pxv (with Gemini fix)
**Service URL:** https://cvstomize-api-351889420459.us-central1.run.app
**Status:** ✅ HEALTHY - Gemini fix deployed successfully
