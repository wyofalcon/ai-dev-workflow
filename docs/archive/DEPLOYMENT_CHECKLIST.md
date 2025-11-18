# Deployment Checklist - CVstomize

**Last Updated**: Session 12 (2025-11-05)

This checklist ensures safe, reliable deployments to staging and production environments.

---

## 🔍 Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] **All tests passing**
  ```bash
  cd api && npm test
  # Expected: 127/127 tests passing
  ```

- [ ] **Test coverage acceptable**
  ```bash
  cd api && npm run test:coverage
  # Expected: 86%+ on critical paths (resume.js, jobDescriptionAnalyzer.js, personalityQuestions.js)
  ```

- [ ] **No console errors or warnings** (check browser console after running frontend)

- [ ] **No linting errors** (if linter configured)

### 2. Environment Configuration ✅

- [ ] **Secrets in Secret Manager** (not in code)
  - `cvstomize-project-id`
  - `cvstomize-service-account-key`
  - `DATABASE_URL`
  - Firebase Admin SDK credentials

- [ ] **Environment variables set correctly**
  ```bash
  # Backend (Cloud Run)
  NODE_ENV=production
  GCP_PROJECT_ID=[from Secret Manager]
  DATABASE_URL=[from Secret Manager]

  # Frontend (React)
  REACT_APP_API_URL=https://cvstomize-api-351889420459.us-central1.run.app
  REACT_APP_FIREBASE_* (all Firebase config vars)
  ```

- [ ] **Database migrations applied**
  ```bash
  npx prisma migrate deploy
  ```

### 3. Database Checks ✅

- [ ] **Prisma schema matches database**
  ```bash
  npx prisma db pull  # Compare with schema.prisma
  ```

- [ ] **Database backups configured** (Cloud SQL automated backups enabled)

- [ ] **Connection pooling configured** (check Cloud SQL Proxy settings)

- [ ] **Test database connection**
  ```bash
  npx prisma studio  # Should open successfully
  ```

### 4. API Integration Checks ✅

- [ ] **Firebase Admin SDK working**
  - Test token verification endpoint: `GET /api/auth/me`
  - Verify Secret Manager access works

- [ ] **Vertex AI (Gemini) access configured**
  - Service account has `aiplatform.user` role
  - `aiplatform.googleapis.com` API enabled
  - Test resume generation endpoint: `POST /api/resume/generate`

- [ ] **Rate limiting configured** (if applicable)

### 5. Security Checks 🔒

- [ ] **CORS origins whitelist set**
  ```javascript
  // api/index.js
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3011',
    'https://cvstomize.com',  // Production frontend
  ];
  ```

- [ ] **Helmet middleware enabled** (security headers)

- [ ] **Body size limits appropriate** (10mb for resume uploads)

- [ ] **Authentication required on protected routes**
  - Test: Try accessing `/api/resume/generate` without token (should 401)

- [ ] **No sensitive data in logs**
  - Review Winston logger configuration
  - Check Cloud Run logs for leaked credentials

### 6. Performance Checks ⚡

- [ ] **Database indexes exist** (check `schema.prisma` for @@index)

- [ ] **Response times acceptable**
  - Auth endpoints: <500ms
  - Resume generation: <10s
  - List endpoints: <1s

- [ ] **Memory usage reasonable**
  - Cloud Run instance: <512 MB
  - Check with: `gcloud run services describe cvstomize-api`

- [ ] **No memory leaks** (run load tests if suspicious)

### 7. Documentation ✅

- [ ] **README.md updated** with current status
- [ ] **ROADMAP.md updated** with session notes
- [ ] **API documentation current** (if using Swagger/OpenAPI)
- [ ] **Environment variable documentation** (CREDENTIALS_REFERENCE.md)

---

## 🚀 Deployment Steps

### Staging Deployment

**Target**: https://staging-cvstomize-api-351889420459.us-central1.run.app (if configured)

```bash
# 1. Checkout dev branch
git checkout dev

# 2. Run tests
cd api && npm test
# Expected: 127/127 passing

# 3. Build backend (if needed)
# No build step for Node.js - code is deployed as-is

# 4. Deploy to Cloud Run (staging)
gcloud run deploy cvstomize-api-staging \
  --source . \
  --region us-central1 \
  --project cvstomize-project-437409 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=staging

# 5. Verify deployment
curl https://staging-cvstomize-api-351889420459.us-central1.run.app/health
# Expected: { "status": "ok", "timestamp": "..." }

# 6. Run smoke tests
# Test authentication: POST /api/auth/register
# Test resume generation: POST /api/resume/generate
```

### Production Deployment

**Target**: https://cvstomize-api-351889420459.us-central1.run.app

```bash
# 1. Merge dev to main (via PR)
git checkout main
git pull origin main

# 2. Tag release
git tag -a v1.x.x -m "Release v1.x.x - Session 12: 127/127 tests passing"
git push origin v1.x.x

# 3. Deploy to Cloud Run (production)
gcloud run deploy cvstomize-api \
  --source . \
  --region us-central1 \
  --project cvstomize-project-437409 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# 4. Verify deployment
curl https://cvstomize-api-351889420459.us-central1.run.app/health
# Expected: { "status": "ok", "timestamp": "..." }

# 5. Monitor logs
gcloud run services logs read cvstomize-api --limit=50 --region=us-central1

# 6. Run full test suite
# Execute all 15 tests from CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md
```

---

## 🔙 Rollback Procedure

If deployment fails or causes issues:

```bash
# 1. List recent revisions
gcloud run revisions list --service cvstomize-api --region us-central1

# 2. Roll back to previous revision
gcloud run services update-traffic cvstomize-api \
  --to-revisions REVISION_NAME=100 \
  --region us-central1

# Example: Roll back to revision cvstomize-api-00044-abc
gcloud run services update-traffic cvstomize-api \
  --to-revisions cvstomize-api-00044-abc=100 \
  --region us-central1

# 3. Verify rollback
curl https://cvstomize-api-351889420459.us-central1.run.app/health

# 4. Investigate issue in logs
gcloud run services logs read cvstomize-api --limit=100 --region=us-central1
```

---

## 📊 Post-Deployment Verification

### 1. Health Checks ✅

- [ ] **Health endpoint responds**
  ```bash
  curl https://cvstomize-api-351889420459.us-central1.run.app/health
  # Expected: 200 OK
  ```

- [ ] **Database connectivity**
  - Try listing resumes (should return empty array or data)
  - Try registering new user

- [ ] **External API access**
  - Try resume generation (Vertex AI should respond)

### 2. Authentication Flow ✅

- [ ] **Registration works**
  ```bash
  curl -X POST https://cvstomize-api-351889420459.us-central1.run.app/api/auth/register \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer [FIREBASE_TOKEN]" \
    -d '{"email":"test@example.com","displayName":"Test User"}'
  ```

- [ ] **Login returns token**

- [ ] **Token refresh works**

- [ ] **Protected endpoints require auth**

### 3. Core Features ✅

- [ ] **Resume generation works end-to-end**
  - Submit job description
  - Get 5 targeted questions
  - Generate resume
  - Download resume markdown

- [ ] **Personality inference works**
  - Submit personal stories
  - Personality traits saved to database

- [ ] **Resume limits enforced**
  - Free tier: 1 resume
  - Trying to generate 2nd resume should return 403

### 4. Performance Metrics 📈

- [ ] **Response times acceptable**
  - Check Cloud Run metrics dashboard
  - 95th percentile < 5s for resume generation
  - 95th percentile < 500ms for other endpoints

- [ ] **Error rate low**
  - Check Cloud Run error rate < 1%

- [ ] **Memory usage normal**
  - Check Cloud Run memory usage < 70%

### 5. Monitoring Setup 🔍

- [ ] **Error alerts configured** (if using Google Cloud Monitoring)

- [ ] **Uptime checks running**
  - Create uptime check for `/health` endpoint

- [ ] **Log queries saved**
  ```bash
  # Example: Find 500 errors in last hour
  gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
    --limit 50 \
    --format json
  ```

---

## 🐛 Common Deployment Issues

### Issue 1: "Cannot connect to database"
**Cause**: Cloud SQL Proxy not configured or DATABASE_URL incorrect

**Fix**:
```bash
# Verify DATABASE_URL format (Unix socket for Cloud Run)
postgresql://user:password@/dbname?host=/cloudsql/project:region:instance

# Test connection from Cloud Shell
gcloud sql connect cvstomize-db --user=cvstomize_user --project=cvstomize-project-437409
```

### Issue 2: "Firebase Admin SDK initialization failed"
**Cause**: Secret Manager access denied or secret not found

**Fix**:
```bash
# Grant Secret Manager access to service account
gcloud projects add-iam-policy-binding cvstomize-project-437409 \
  --member="serviceAccount:351889420459-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Verify secret exists
gcloud secrets versions access latest --secret="cvstomize-service-account-key"
```

### Issue 3: "Vertex AI permission denied"
**Cause**: Service account missing `aiplatform.user` role

**Fix**:
```bash
# Grant Vertex AI access
gcloud projects add-iam-policy-binding cvstomize-project-437409 \
  --member="serviceAccount:351889420459-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Verify API enabled
gcloud services enable aiplatform.googleapis.com
```

### Issue 4: "413 Request Entity Too Large"
**Cause**: Body size limit too small for resume data

**Fix**:
```javascript
// api/index.js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Issue 5: "CORS policy error"
**Cause**: Frontend origin not in CORS whitelist

**Fix**:
```javascript
// api/index.js
const allowedOrigins = [
  'http://localhost:3000',
  'https://cvstomize.com',  // Add production frontend domain
];
```

---

## 📝 Deployment Log Template

Use this template to document each deployment:

```markdown
## Deployment - [Date] [Time] - Session [X]

**Deployed By**: [Name]
**Branch**: [dev/main]
**Revision**: [Cloud Run revision name]
**Changes**: [Brief description or link to PR]

### Pre-Deployment
- [ ] Tests passing: [127/127]
- [ ] Code review completed: [Yes/No]
- [ ] Database migrations applied: [Yes/No]

### Deployment
- [ ] Deployment command executed: [timestamp]
- [ ] Health check passed: [Yes/No]
- [ ] Smoke tests passed: [Yes/No]

### Post-Deployment
- [ ] Monitoring confirmed: [Yes/No]
- [ ] Error rate: [X%]
- [ ] Response time p95: [Xms]

### Issues Encountered
- [None / List issues and resolutions]

### Rollback
- [ ] Rollback needed: [Yes/No]
- [ ] Rollback completed: [timestamp]
```

---

## 🎯 Production Readiness Criteria

Before deploying to production, ensure:

- ✅ **127/127 backend tests passing**
- ✅ **Frontend tests passing** (when implemented)
- ✅ **CI/CD pipeline configured** (when implemented)
- ✅ **Database backups enabled**
- ✅ **Monitoring and alerting configured**
- ✅ **Error handling comprehensive**
- ✅ **Security audit complete**
- ✅ **Performance testing complete**
- ✅ **Documentation up to date**
- ✅ **Rollback procedure tested**

---

## 📚 Related Documentation

- [TESTING_GUIDE.md](api/TESTING_GUIDE.md) - Backend testing documentation
- [ROADMAP.md](ROADMAP.md) - Project roadmap and session notes
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - All credentials and access info
- [CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md](CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md) - E2E testing guide

---

**Last Deployment**: Session 9 - Revision cvstomize-api-00045-xls (2025-11-04)
**Next Deployment**: After frontend testing + CI/CD setup (Session 13+)
