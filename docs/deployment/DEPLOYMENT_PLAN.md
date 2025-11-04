# CVstomize v2.0 - Deployment Plan

## 🎯 Deployment Overview

**Current State**: https://www.cvstomize.com/ on Vercel (v1.0)
**Target State**: https://www.cvstomize.com/ on GCP (v2.0)
**GitHub Repo**: https://github.com/wyofalcon/cvstomize
**Strategy**: Zero-downtime migration with rollback capability

---

## 📅 Deployment Timeline

### **Phase 1: Development** (Weeks 1-4) - Current Phase
**Location**: Local development (`/mnt/storage/shared_windows/Cvstomize`)
**Status**: Week 2, 60% complete

**Activities**:
- ✅ GCP infrastructure setup (Cloud SQL, Storage, Firebase)
- ✅ Backend API development (Express, Prisma, Auth)
- 🔄 Frontend authentication integration (Next)
- ⏳ Conversational AI profile builder
- ⏳ Resume generation with Gemini
- ⏳ Viral mechanics (social sharing, referrals)

**Output**: Complete v2.0 codebase ready for testing

---

### **Phase 2: GitHub Push** (Week 4, Day 1)
**Repository**: https://github.com/wyofalcon/cvstomize

**Steps**:
1. **Prepare repository**:
   ```bash
   cd /mnt/storage/shared_windows/Cvstomize
   git init
   git remote add origin https://github.com/wyofalcon/cvstomize.git
   ```

2. **Create `.gitignore`**:
   ```
   # Dependencies
   node_modules/
   .pnp/
   .pnp.js

   # Environment variables
   .env
   .env.local
   .env.production
   api/.env

   # Logs
   *.log
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   api/error.log
   api/combined.log

   # Build outputs
   build/
   dist/
   .next/

   # IDE
   .vscode/
   .idea/

   # OS files
   .DS_Store
   Thumbs.db

   # Credentials (should be in Secret Manager only)
   **/credentials.json
   **/service-account.json

   # Prisma
   api/prisma/migrations/
   ```

3. **Create comprehensive README.md** for public viewing
4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: CVstomize v2.0 - Complete viral MVP with AI-powered resume builder"
   git push -u origin main
   ```

5. **Set up GitHub Actions** (optional, Week 4 Day 2):
   - `.github/workflows/deploy-backend.yml` - Deploy API to Cloud Run
   - `.github/workflows/deploy-frontend.yml` - Deploy frontend to Cloud Run/Firebase
   - Automated deployments on push to `main` branch

---

### **Phase 3: GCP Deployment** (Week 4, Days 2-3)

#### **3.1: Backend Deployment to Cloud Run**

**Prerequisites**:
- Dockerfile for backend
- Cloud Run service configuration
- Environment variables in Secret Manager

**Steps**:
1. **Create Dockerfile** (`api/Dockerfile`):
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   EXPOSE 3001
   CMD ["node", "index.js"]
   ```

2. **Build and push container**:
   ```bash
   gcloud builds submit --tag gcr.io/cvstomize/api api/
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy cvstomize-api \
     --image gcr.io/cvstomize/api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,PORT=3001 \
     --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
     --set-secrets DATABASE_URL=cvstomize-db-connection-string:latest,FIREBASE_CONFIG=firebase-config:latest \
     --min-instances 1 \
     --max-instances 10 \
     --memory 512Mi \
     --cpu 1
   ```

4. **Verify API health**:
   ```bash
   curl https://cvstomize-api-XXXXX-uc.a.run.app/health
   ```

#### **3.2: Frontend Deployment**

**Option 1: Cloud Run (Recommended for Phase 1)**
```bash
gcloud run deploy cvstomize-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars REACT_APP_API_URL=https://cvstomize-api-XXXXX-uc.a.run.app
```

**Option 2: Firebase Hosting** (Alternative)
```bash
firebase deploy --only hosting
```

#### **3.3: Test in Staging**
- Test authentication flow (Google SSO + Email/Password)
- Test profile creation conversation
- Test resume generation
- Test social sharing
- Test referral system
- Load test with k6 or Artillery

---

### **Phase 4: DNS Migration** (Week 4, Day 4)

**Current DNS**: Points to Vercel
**Target DNS**: Point to GCP

**Steps**:
1. **Get Cloud Run URL**: `https://cvstomize-frontend-XXXXX-uc.a.run.app`

2. **Set up custom domain in Cloud Run**:
   ```bash
   gcloud beta run domain-mappings create --service cvstomize-frontend --domain cvstomize.com --region us-central1
   gcloud beta run domain-mappings create --service cvstomize-frontend --domain www.cvstomize.com --region us-central1
   ```

3. **Update DNS records** (wherever domain is registered):
   - **Type**: A Record
   - **Name**: `@` (apex) and `www`
   - **Value**: Cloud Run IP (provided by domain mapping command)
   - **TTL**: 300 (5 minutes for quick rollback)

4. **Enable HTTPS**:
   - Cloud Run automatically provisions SSL certificates
   - Wait 15-30 minutes for certificate provisation

5. **Monitor DNS propagation**:
   ```bash
   dig cvstomize.com
   curl https://cvstomize.com/health
   ```

---

### **Phase 5: Monitoring & Rollback** (Week 4, Day 5)

#### **Monitoring**:
- **Cloud Run Metrics**: Request count, latency, errors
- **Cloud SQL Monitoring**: Connection count, CPU, memory
- **Error Logs**: Winston logs in Cloud Logging
- **User Behavior**: Firebase Analytics

#### **Rollback Plan** (if issues arise):
1. **Immediate**: Revert DNS to point back to Vercel (5 min TTL = 5 min rollback)
2. **Quick**: Roll back Cloud Run to previous revision:
   ```bash
   gcloud run services update-traffic cvstomize-frontend --to-revisions PREVIOUS_REVISION=100
   ```
3. **Debug**: Fix issues in staging, redeploy

#### **Success Criteria**:
- 99.9% uptime for 48 hours
- <500ms average response time
- Zero authentication errors
- All features working (auth, profile, resume, sharing)
- No increase in error rate

---

### **Phase 6: Decommission Vercel** (Week 5)

Once GCP is stable for 7 days:

1. **Archive Vercel deployment** (keep as backup)
2. **Update documentation** to reflect GCP-only deployment
3. **Remove Vercel from DNS** (increase TTL to 3600)
4. **Celebrate!** 🎉

---

## 🔒 Security Checklist

Before going live:
- [ ] All secrets in Secret Manager (no hardcoded credentials)
- [ ] HTTPS enabled with valid SSL certificates
- [ ] CORS configured correctly (no wildcard in production)
- [ ] Rate limiting enabled on API
- [ ] Firebase Auth configured with proper domains
- [ ] Cloud SQL has NO public IP (Cloud Run uses internal networking)
- [ ] IAM roles follow principle of least privilege
- [ ] Audit logs enabled for database and API
- [ ] GDPR consent flow implemented
- [ ] Privacy policy and terms of service pages live

---

## 💰 Cost Monitoring

**Phase 1 Target**: <$15/month
- Cloud SQL: ~$7-10/month
- Cloud Storage: ~$1/month
- Cloud Run: ~$1-3/month (with generous free tier)
- Gemini API: ~$2/month (0.5M tokens with free tier)

**Phase 2 Target** (with $250K credits): Effectively $0
- 100,000+ users
- 500,000+ resumes
- Full utilization of Google for Startups credits

---

## 📞 Support Plan

**During Migration**:
- Monitor #cvstomize Slack channel
- On-call rotation (ashley.caban.c + wyofalcon)
- Status page updates every 2 hours

**Post-Migration**:
- Daily health checks
- Weekly cost reviews
- Monthly performance audits

---

## 🚀 Quick Reference Commands

**Deploy backend**:
```bash
cd api
gcloud builds submit --tag gcr.io/cvstomize/api .
gcloud run deploy cvstomize-api --image gcr.io/cvstomize/api --region us-central1
```

**Deploy frontend**:
```bash
gcloud run deploy cvstomize-frontend --source . --region us-central1
```

**View logs**:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cvstomize-api" --limit 50
```

**Check health**:
```bash
curl https://cvstomize-api-XXXXX-uc.a.run.app/health
curl https://cvstomize.com/health
```

---

## 📝 Related Documents

- [ROADMAP.md](ROADMAP.md) - Complete project roadmap
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - All credentials and access
- [api/README.md](api/README.md) - Backend API documentation
- [README.md](README.md) - Project overview

---

**Last Updated**: 2025-11-02
**Version**: 1.0
**Status**: Ready for execution at end of Week 4
