# Staging Environment Setup Complete ✅

## Session 20 - World-Class Production Practice

Successfully deployed a complete staging environment in a **separate GCP project** for safe testing and development.

---

## Infrastructure Overview

### GCP Project: cvstomize-staging
- **Project ID:** cvstomize-staging
- **Project Number:** 1036528578375
- **Billing Account:** 019DB3-2FD09E-256E00
- **Region:** us-central1

### Staging Resources

#### 1. Cloud SQL PostgreSQL Database
- **Instance:** cvstomize-db-staging
- **Tier:** db-f1-micro (cost-effective for staging)
- **Database:** cvstomize_staging
- **User:** cvstomize_app
- **Password:** CVstomize_App_Staging_2025
- **Postgres Password:** CVstomize_Staging_2025
- **Status:** RUNNABLE ✅
- **Schema:** Applied from FRESH_DATABASE_SCHEMA.sql (all 12 tables created)

#### 2. API Service (Cloud Run)
- **Service:** cvstomize-api-staging
- **URL:** https://cvstomize-api-staging-1036528578375.us-central1.run.app
- **Revision:** cvstomize-api-staging-00007-8bd
- **Status:** Serving 100% traffic ✅
- **Health Check:** PASSING (`"environment":"staging"`)
- **Memory:** 512Mi
- **CPU:** 1
- **Timeout:** 120s
- **Auto-scaling:** 0-5 instances

#### 3. Secret Manager Secrets
- **DATABASE_URL** (version 2 - latest)
  ```
  postgresql://cvstomize_app:CVstomize_App_Staging_2025@localhost/cvstomize_staging?host=/cloudsql/cvstomize-staging:us-central1:cvstomize-db-staging
  ```
- **GOOGLE_APPLICATION_CREDENTIALS_JSON** (version 1)
  - Service account key for Vertex AI access
- **cvstomize-project-id** (version 1)
  - Firebase project ID: 351889420459
- **cvstomize-service-account-key** (version 1)
  - Firebase Admin SDK credentials

---

## Key Architectural Decisions

### 1. Separate GCP Project (World-Class Practice)
**Why:** Complete isolation prevents staging changes from affecting production.
**Benefit:** Can test destructive operations (schema changes, deployments) safely.
**Cost:** ~$24/month (minimal for the safety gained)

### 2. Environment-Aware Firebase Configuration
**File:** `/mnt/storage/shared_windows/Cvstomize/api/config/firebase.js`
**Change:** Made Secret Manager paths environment-aware using `NODE_ENV`

```javascript
const isStaging = process.env.NODE_ENV === 'staging';
const currentGcpProject = isStaging ? 'cvstomize-staging' : 'cvstomize';
```

**Result:** Same codebase works in both staging and production, pulling secrets from correct project.

### 3. Shared Firebase Project, Separate Databases
**Approach:** Staging and production both use the same Firebase project (cvstomize), but have separate databases.
**Why:** Firebase users/auth is shared, but resume data is isolated.
**Benefit:** Can test with real user accounts without touching production data.

---

## Testing the Staging Environment

### Health Check
```bash
curl https://cvstomize-api-staging-1036528578375.us-central1.run.app/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T05:46:59.933Z",
  "uptime": 15.305804437,
  "environment": "staging"
}
```

### Database Connection Test
```bash
# Connect via Cloud SQL Proxy (already running on port 5436)
export PGPASSWORD='CVstomize_App_Staging_2025'
psql -h 127.0.0.1 -p 5436 -U cvstomize_app -d cvstomize_staging -c "SELECT COUNT(*) FROM users;"
```

---

## Deployment Scripts

### Deploy API to Staging
**File:** `/mnt/storage/shared_windows/Cvstomize/deploy-api-staging.sh`
```bash
#!/bin/bash
cd /mnt/storage/shared_windows/Cvstomize/api

gcloud run deploy cvstomize-api-staging \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=staging" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest" \
  --add-cloudsql-instances="cvstomize-staging:us-central1:cvstomize-db-staging" \
  --project=cvstomize-staging \
  --max-instances=5 \
  --min-instances=0 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=120s \
  --quiet
```

### Deploy Frontend to Staging (To Be Created)
**File:** `/mnt/storage/shared_windows/Cvstomize/deploy-frontend-staging.sh`
```bash
#!/bin/bash
cd /mnt/storage/shared_windows/Cvstomize

gcloud run deploy cvstomize-frontend-staging \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-build-env-vars REACT_APP_API_URL=https://cvstomize-api-staging-1036528578375.us-central1.run.app \
  --project=cvstomize-staging \
  --quiet
```

---

## What's Next

### Immediate Next Steps (Session 20 Continuation)
1. ✅ Staging API deployed and healthy
2. ⏳ Deploy Frontend to staging
3. ⏳ Test end-to-end conversation flow in staging
4. ⏳ Begin resume-first gap analysis implementation in staging
5. ⏳ Test resume-first flow thoroughly before production deployment

### Resume-First Implementation (ROADMAP Priority #1)
Now that staging is ready, we can safely implement the resume-first gap analysis feature:

**Phase 1 (Backend - Do in Staging First):**
- Update `jobDescriptionAnalyzer.js` to accept `existingResume` parameter
- Implement gap analysis prompt (see RESUME_FIRST_PROMPT.md)
- Test with multiple resume + JD combinations
- Deploy to staging, verify quality
- Only deploy to production when confident

**Phase 2 (Frontend):**
- Add resume input field to ConversationalWizard
- Update conversation start to include resume text
- Test in staging frontend

**Phase 3 (File Upload):**
- Implement PDF/DOCX parsing
- Add drag-and-drop resume upload
- Test in staging

**Phase 4 (Advanced):**
- LinkedIn import
- Resume quality scoring
- Gap severity ranking

---

## Lessons Learned

### Issue 1: Hardcoded Production Project ID
**Problem:** `firebase.js` had hardcoded `projects/351889420459/secrets/...`
**Fix:** Environment detection using `NODE_ENV` to select `cvstomize-staging` vs `cvstomize`
**Lesson:** Never hardcode project IDs; always make code environment-aware

### Issue 2: Empty Host in DATABASE_URL
**Problem:** Prisma rejected `postgresql://user:pass@/db?host=/cloudsql/...`
**Fix:** Added `@localhost` placeholder: `postgresql://user:pass@localhost/db?host=/cloudsql/...`
**Lesson:** Prisma needs a host placeholder even when using unix sockets

### Issue 3: Service Account Secret Access
**Problem:** Cloud Run service account couldn't access secrets
**Fix:** Granted `roles/secretmanager.secretAccessor` to `1036528578375-compute@developer.gserviceaccount.com`
**Lesson:** Cloud Run default service account needs explicit secret permissions

### Issue 4: Missing Cloud Build API
**Problem:** `gcloud run deploy --source` failed without Cloud Build
**Fix:** Enabled `cloudbuild.googleapis.com` in staging project
**Lesson:** Source-based deployments require Cloud Build API

---

## Security & Access

### IAM Permissions
- **Service Account:** cvstomize-deployer@cvstomize.iam.gserviceaccount.com
- **Role on staging:** roles/owner
- **Cloud Run Service Account:** 1036528578375-compute@developer.gserviceaccount.com
  - roles/secretmanager.secretAccessor (DATABASE_URL, GOOGLE_APPLICATION_CREDENTIALS_JSON, cvstomize-project-id, cvstomize-service-account-key)

### Enabled APIs (cvstomize-staging)
- Cloud Run Admin API
- Cloud SQL Admin API
- Secret Manager API
- Cloud Build API
- Service Networking API
- Compute Engine API
- Cloud Resource Manager API

---

## Cost Estimate

### Monthly Costs (Staging)
- **Cloud SQL db-f1-micro:** ~$15/month
- **Cloud Run (low usage):** ~$5/month
- **Secret Manager:** ~$1/month
- **Networking:** ~$3/month
- **Total:** ~$24/month

**Worth it?** Absolutely. Prevents production incidents that could cost thousands in downtime or data loss.

---

## Production vs Staging Comparison

| Resource | Production | Staging |
|----------|-----------|---------|
| GCP Project | cvstomize (351889420459) | cvstomize-staging (1036528578375) |
| API URL | https://cvstomize-api-351889420459.us-central1.run.app | https://cvstomize-api-staging-1036528578375.us-central1.run.app |
| Database Instance | cvstomize-db-prod | cvstomize-db-staging |
| Database Name | cvstomize_production | cvstomize_staging |
| Database Password | CVstomize_Fresh_2025_2157 | CVstomize_App_Staging_2025 |
| NODE_ENV | production | staging |
| Firebase Project | cvstomize (shared) | cvstomize (shared) |
| Billing | Production budget | Separate staging budget |

---

## Deployment Workflow (Going Forward)

### New Feature Development
1. Develop feature locally
2. Deploy to **staging** first
3. Test thoroughly in staging (separate database, safe to break)
4. Run integration tests, check logs
5. If stable, deploy to **production**
6. Monitor production logs for issues

### Rollback Strategy
If production deployment fails:
1. Check staging - is it still working?
2. If staging works but production doesn't, likely an environment-specific issue
3. Roll back production to previous revision
4. Debug in staging (safe to experiment)
5. Fix issue, test in staging
6. Re-deploy to production

---

## Session 20 Achievement

✅ **World-class staging environment deployed**
- Separate GCP project for complete isolation
- All infrastructure replicated (database, API, secrets)
- Environment-aware code (Firebase config)
- Ready for safe resume-first implementation
- Zero risk to production during development

**Time saved in future:** Countless hours of production debugging, incident recovery, and data restoration.

**Next session:** Deploy frontend to staging, begin resume-first gap analysis implementation.

---

**Created:** 2025-11-08
**Session:** 20
**Status:** COMPLETE ✅
