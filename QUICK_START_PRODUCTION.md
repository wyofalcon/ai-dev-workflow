# CVstomize Production - Quick Start Guide

**Production URL:** https://cvstomize-api-351889420459.us-central1.run.app
**Status:** 🟢 LIVE (90% complete - see Pending Tasks below)

---

## 🚀 Quick Commands

### Check Service Health
```bash
curl https://cvstomize-api-351889420459.us-central1.run.app/health
```

### View Recent Logs
```bash
gcloud run services logs read cvstomize-api --region us-central1 --limit 20 --project cvstomize
```

### Rebuild and Redeploy
```bash
cd /mnt/storage/shared_windows/Cvstomize/api
./deploy-to-cloud-run.sh
```

### Run Database Migrations
```bash
gcloud run jobs execute cvstomize-migrate --region us-central1 --project cvstomize
```

---

## ⚠️ Pending Tasks

### 1. Fix Database Permissions (5 minutes) - REQUIRED
```bash
# Connect to Cloud SQL as postgres
gcloud sql connect cvstomize-db --user=postgres --database=cvstomize_production

# Grant ownership
ALTER TABLE resumes OWNER TO cvstomize_app;

# Verify
\d resumes

# Re-run migrations
gcloud run jobs execute cvstomize-migrate --region us-central1
```

### 2. Test End-to-End (30 minutes)
- Register test user on frontend
- Complete conversational flow
- Generate resume
- Download PDF (3 templates)
- Verify Cloud Storage upload
- Test outcome tracking

---

## 📁 Key Files

**Deployment:**
- `api/Dockerfile` - Container configuration
- `api/deploy-to-cloud-run.sh` - Deployment script
- `api/run-migrations.js` - Migration runner

**Migrations:**
- `api/add_pdf_template.sql` ✅ Applied
- `api/add_outcome_tracking.sql` ⏳ Pending permissions

**Documentation:**
- `DEPLOYMENT_STATUS.md` - Detailed deployment status
- `SESSION_16_DEPLOYMENT.md` - Session summary
- `ROADMAP.md` - Phase 7 details (lines 440-498)

---

## 🔧 Environment Variables

**Set on Cloud Run:**
```
NODE_ENV=production
LOG_LEVEL=info
ENABLE_CLOUD_STORAGE=true
GCS_RESUMES_BUCKET=cvstomize-resumes-prod
GCP_PROJECT_ID=cvstomize
DATABASE_URL=postgresql://cvstomize_app:***@localhost/...
```

---

## 📊 Resources

**Cloud Run Service:**
- Memory: 2 GiB
- CPU: 2 vCPUs
- Timeout: 60 seconds
- Scales to zero when idle

**Cloud Storage:**
- Bucket: `cvstomize-resumes-prod`
- Region: `us-central1`
- Lifecycle: 365 days

**Cloud SQL:**
- Instance: `cvstomize:us-central1:cvstomize-db`
- Database: `cvstomize_production`
- Connection: Unix socket

---

## 🚨 Known Issue

**Database Permission Error:**
```
ERROR: must be owner of table resumes
```

**Fix:** See Pending Task #1 above

---

## 📖 Full Documentation

See [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for complete deployment details.
See [SESSION_16_DEPLOYMENT.md](SESSION_16_DEPLOYMENT.md) for session summary.

---

**Last Updated:** 2025-11-06 02:45 UTC
