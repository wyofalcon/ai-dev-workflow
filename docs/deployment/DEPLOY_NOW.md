# 🚀 CVstomize v2.0 - Deploy Backend API Now

Quick guide to deploy the backend API to Google Cloud Run for testing the authentication flow.

---

## ✅ Prerequisites

You need:
1. **Google Cloud SDK** installed and configured
2. **Authenticated** with gcloud: `gcloud auth login`
3. **Billing enabled** on the cvstomize project
4. **APIs enabled**: Cloud Run, Cloud Build, Secret Manager, Cloud SQL (already done ✅)

---

## 🚀 Option 1: Automated Deployment (Recommended)

### Step 1: Navigate to API directory
```bash
cd /mnt/storage/shared_windows/Cvstomize/api
```

### Step 2: Run deployment script
```bash
./deploy-to-cloud-run.sh
```

This will:
- ✅ Build the Docker container image
- ✅ Push to Google Container Registry
- ✅ Deploy to Cloud Run
- ✅ Configure environment variables
- ✅ Connect to Cloud SQL via internal network
- ✅ Load secrets from Secret Manager

**Time**: ~3-5 minutes

---

## 🔧 Option 2: Manual Deployment

### Step 1: Build container
```bash
cd /mnt/storage/shared_windows/Cvstomize/api
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api .
```

### Step 2: Deploy to Cloud Run
```bash
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,PORT=3001,GCP_PROJECT_ID=cvstomize,LOG_LEVEL=info \
  --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
  --set-secrets DATABASE_URL=cvstomize-db-connection-string:latest
```

### Step 3: Get service URL
```bash
gcloud run services describe cvstomize-api --region us-central1 --format 'value(status.url)'
```

---

## ✅ Test Deployment

### 1. Test Health Endpoint
```bash
curl https://cvstomize-api-XXXXX-uc.a.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T...",
  "uptime": 12.345,
  "environment": "production"
}
```

### 2. Test Database Connection
The health endpoint will return 500 if database connection fails.

### 3. Test Firebase Admin SDK
Try registering a user:
```bash
# Get Firebase token from frontend first, then:
curl -X POST https://cvstomize-api-XXXXX-uc.a.run.app/api/auth/register \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔗 Update Frontend Configuration

### Step 1: Get Cloud Run URL
```bash
gcloud run services describe cvstomize-api --region us-central1 --format 'value(status.url)'
```

### Step 2: Update frontend .env
```bash
cd /mnt/storage/shared_windows/Cvstomize
```

Edit `.env`:
```env
# Change from:
REACT_APP_API_URL=http://localhost:3001/api

# To:
REACT_APP_API_URL=https://cvstomize-api-XXXXX-uc.a.run.app/api
```

### Step 3: Rebuild frontend
```bash
npm run build
```

---

## 🧪 Test Authentication Flow

### 1. Start frontend locally
```bash
npm start
# Opens http://localhost:3000
```

### 2. Test signup flow
- Go to http://localhost:3000/signup
- Click "Sign up with Google" or use email/password
- Check browser console for API calls
- Check backend logs: `gcloud run logs read cvstomize-api --region us-central1 --limit 50`

### 3. Test login flow
- Go to http://localhost:3000/login
- Sign in with the account you created
- Verify you're redirected to home page
- Check navbar shows user info and resume count

### 4. Test protected routes
- Try accessing http://localhost:3000/ without logging in → should redirect to /login
- Log in, then access http://localhost:3000/ → should work

---

## 📊 Monitor Deployment

### View logs
```bash
# Recent logs
gcloud run logs read cvstomize-api --region us-central1 --limit 50

# Follow logs in real-time
gcloud run logs tail cvstomize-api --region us-central1
```

### Check metrics
```bash
# Service details
gcloud run services describe cvstomize-api --region us-central1

# Revisions
gcloud run revisions list --service cvstomize-api --region us-central1
```

### View in Console
- **Cloud Run**: https://console.cloud.google.com/run?project=cvstomize
- **Logs**: https://console.cloud.google.com/logs/query?project=cvstomize&query=resource.type%3D%22cloud_run_revision%22

---

## 💰 Cost Estimate

**Cloud Run Pricing** (with free tier):
- **Free tier**: 2 million requests/month, 360,000 GB-seconds/month
- **Expected cost**: $0-3/month for development
- **Min instances: 0** = scales to zero when not in use = $0 when idle

**Total infrastructure cost** (Phase 1):
- Cloud SQL: ~$7-10/month
- Cloud Storage: ~$1/month
- Cloud Run: ~$0-3/month
- **Total: ~$8-14/month** ✅ Well within $1,000 budget

---

## 🔄 Rollback if Needed

### Roll back to previous revision
```bash
# List revisions
gcloud run revisions list --service cvstomize-api --region us-central1

# Roll back
gcloud run services update-traffic cvstomize-api --to-revisions PREVIOUS_REVISION=100 --region us-central1
```

### Delete deployment
```bash
gcloud run services delete cvstomize-api --region us-central1
```

---

## ⚠️ Troubleshooting

### Issue: "Permission denied" on deployment
**Fix**: Ensure you're authenticated:
```bash
gcloud auth login
gcloud config set project cvstomize
```

### Issue: "Service account does not have permission"
**Fix**: Grant Cloud Run service account access to Secret Manager:
```bash
gcloud projects add-iam-policy-binding cvstomize \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### Issue: "Cloud SQL connection failed"
**Fix**: Check Cloud SQL instance name and region:
```bash
gcloud sql instances describe cvstomize-db --format="value(connectionName)"
```

### Issue: "DATABASE_URL secret not found"
**Fix**: Verify secret exists:
```bash
gcloud secrets list --project=cvstomize
gcloud secrets versions access latest --secret=cvstomize-db-connection-string
```

### Issue: Health check returns 500
**Check logs**:
```bash
gcloud run logs read cvstomize-api --region us-central1 --limit 50
```

Common causes:
- Database connection failed (wrong connection string)
- Firebase Admin SDK failed to initialize (missing service account)
- Prisma client not generated (build issue)

---

## 📝 Next Steps After Deployment

1. ✅ Test authentication flow completely
2. ✅ Verify user data is saved in database
3. ✅ Check Cloud SQL for new user records
4. 🔄 Begin Week 3: Conversational Profile Builder
5. 🔄 Integrate Gemini API for personality assessment
6. 🔄 Build resume generation flow

---

## 🔗 Related Documents

- [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) - Full deployment strategy (Vercel → GCP)
- [api/README.md](api/README.md) - Backend API documentation
- [ROADMAP.md](ROADMAP.md) - Project roadmap and progress

---

**Ready to deploy?** Run `./deploy-to-cloud-run.sh` and test the full authentication flow! 🚀
