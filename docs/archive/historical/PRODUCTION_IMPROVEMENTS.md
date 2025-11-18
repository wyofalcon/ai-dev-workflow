# 🚀 CVstomize Production Improvements Roadmap

**Current State:** Working but not production-grade
**Goal:** Enterprise-level reliability, security, and maintainability

---

## 🔴 CRITICAL (Do Immediately)

### 1. **Remove Passwords from Git**
**Risk:** Database password exposed in git history, docs, and deployment files

**Action:**
```bash
# Remove sensitive data from git history
git filter-repo --invert-paths --path CREDENTIALS_REFERENCE.md
git filter-repo --replace-text <(echo "CVst0mize_App_2025!==[REDACTED]")

# Or start fresh (nuclear option):
# 1. Delete .git folder
# 2. Create new repo
# 3. Push to new remote
```

**Files to clean:**
- `CREDENTIALS_REFERENCE.md` - Move to private 1Password/LastPass
- `DEPLOYMENT_GUIDE.md` - Remove password, use Secret Manager reference
- `GEMINI_FIX_DEPLOYMENT.md` - Remove password

### 2. **Rotate Database Password**
```bash
# Generate new secure password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update in Cloud SQL
gcloud sql users set-password cvstomize_app \
  --instance=cvstomize-db \
  --password="$NEW_PASSWORD"

# Update Secret Manager
echo -n "postgresql://cvstomize_app:$NEW_PASSWORD@localhost/cvstomize_production?host=/cloudsql/cvstomize:us-central1:cvstomize-db" | \
  gcloud secrets versions add DATABASE_URL --data-file=-

# Redeploy with secrets
gcloud run deploy cvstomize-api \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --region us-central1
```

### 3. **Enable Cloud Run Secret Manager Integration**
**Current:** Using env vars (visible in service YAML)
**Fix:** Use `--set-secrets` instead

```bash
# Migration script
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account cvstomize-deployer@cvstomize.iam.gserviceaccount.com \
  --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
  --set-env-vars "NODE_ENV=production,LOG_LEVEL=info" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest" \
  --port=3001 \
  --timeout=60 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10
```

**Benefits:**
- Secrets not visible in Cloud Console
- Easier rotation (update secret, redeploy)
- Audit logs for access

---

## 🟠 HIGH PRIORITY (This Month)

### 4. **Set Up CI/CD Pipeline**

**Option A: Cloud Build (Native)**
```yaml
# cloudbuild.yaml
steps:
  # Install dependencies
  - name: 'node:20'
    dir: 'api'
    entrypoint: npm
    args: ['ci']

  # Run tests
  - name: 'node:20'
    dir: 'api'
    entrypoint: npm
    args: ['test']
    env:
      - 'DATABASE_URL=postgresql://test@localhost/test'

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/cvstomize-api:$SHORT_SHA', '-t', 'gcr.io/$PROJECT_ID/cvstomize-api:latest', './api']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', 'gcr.io/$PROJECT_ID/cvstomize-api']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'cvstomize-api'
      - '--image=gcr.io/$PROJECT_ID/cvstomize-api:$SHORT_SHA'
      - '--region=us-central1'
      - '--set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest'

# Trigger on push to main
triggers:
  - name: deploy-production
    github:
      owner: YourGitHubUsername
      name: cvstomize
      push:
        branch: ^main$
```

**Setup:**
```bash
# Connect Cloud Build to GitHub
gcloud builds triggers create github \
  --name="cvstomize-deploy" \
  --repo-owner=YourUsername \
  --repo-name=cvstomize \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

**Option B: GitHub Actions (Portable)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Build and Deploy
        run: |
          gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api
          gcloud run deploy cvstomize-api \
            --image gcr.io/cvstomize/cvstomize-api \
            --region us-central1 \
            --set-secrets="DATABASE_URL=DATABASE_URL:latest"
```

### 5. **Add Error Tracking**

**Sentry Integration:**
```bash
npm install @sentry/node @sentry/profiling-node
```

```javascript
// api/index.js (add at top)
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

**Create Sentry secret:**
```bash
gcloud secrets create SENTRY_DSN --data-file=<(echo "https://...@sentry.io/...")
```

### 6. **Implement Health Checks & Monitoring**

```javascript
// api/routes/health.js
router.get('/health/ready', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Vertex AI
    const model = geminiService.getFlashModel();

    // Check Cloud Storage
    await storage.bucket(process.env.GCS_RESUMES_BUCKET).exists();

    res.json({
      status: 'ready',
      checks: {
        database: 'ok',
        vertexAI: 'ok',
        storage: 'ok'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message
    });
  }
});
```

**Set up Cloud Monitoring alerts:**
```bash
# Alert on error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_EMAIL_CHANNEL \
  --display-name="CVstomize Error Rate Alert" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

---

## 🟡 MEDIUM PRIORITY (Next 3 Months)

### 7. **Staging Environment**
```bash
# Create staging database
gcloud sql instances create cvstomize-db-staging \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Deploy staging service
gcloud run deploy cvstomize-api-staging \
  --image gcr.io/cvstomize/cvstomize-api:staging \
  --region us-central1 \
  --set-env-vars="NODE_ENV=staging"
```

**Branching strategy:**
- `main` → Production
- `staging` → Staging environment
- `feature/*` → Preview environments

### 8. **Load Testing**
```bash
# Install k6
npm install -g k6

# Create load test
cat > load-test.js <<EOF
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let res = http.get('https://cvstomize-api-351889420459.us-central1.run.app/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

# Run test
k6 run load-test.js
```

### 9. **Database Backups & Disaster Recovery**
```bash
# Automated daily backups
gcloud sql backups create \
  --instance=cvstomize-db \
  --description="Daily automated backup"

# Enable point-in-time recovery
gcloud sql instances patch cvstomize-db \
  --backup-start-time=02:00 \
  --enable-point-in-time-recovery
```

### 10. **Rate Limiting (Per User, Not IP)**
```javascript
// Current: Rate limit by IP (easily bypassed)
// Better: Rate limit by user ID + API key

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const limiter = rateLimit({
  store: new RedisStore({
    client: new Redis(process.env.REDIS_URL),
  }),
  keyGenerator: (req) => {
    // Use user ID from JWT token
    return req.user?.id || req.ip;
  },
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🟢 NICE TO HAVE (Future)

### 11. **Feature Flags**
```javascript
// LaunchDarkly, Unleash, or GrowthBook
const featureFlags = require('./services/featureFlags');

if (await featureFlags.isEnabled('new-resume-template', user)) {
  // Show new template
} else {
  // Show old template
}
```

### 12. **A/B Testing**
- Test different resume formats
- Test pricing ($5 vs $10 vs $15)
- Test onboarding flows

### 13. **CDN for Frontend**
```bash
# Cloud CDN for frontend assets
gcloud compute backend-services update cvstomize-frontend \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC
```

### 14. **Multi-Region Deployment**
- Deploy API to `us-central1` + `europe-west1`
- Use Cloud Load Balancer for geo-routing
- Replicate database to multiple regions

---

## 📊 Metrics to Track

### **Reliability (SLA: 99.9%)**
- Uptime
- Error rate (target: <1%)
- Latency (P50, P95, P99)

### **Performance**
- API response time (target: <200ms P95)
- Resume generation time (target: <5 seconds)
- PDF generation time (target: <2 seconds)

### **Business**
- Daily active users
- Resumes created per day
- Conversion rate (free → paid)
- Customer satisfaction (NPS)

### **Security**
- Failed login attempts
- Suspicious activity
- Secret access logs

---

## 💰 Cost Estimates

| Item | Current | With Improvements | Increase |
|------|---------|-------------------|----------|
| Cloud Run | ~$10/month | ~$15/month | +$5 |
| Cloud SQL | ~$10/month | ~$15/month (staging) | +$5 |
| Secret Manager | $0 | ~$1/month | +$1 |
| Monitoring | Included | Included | $0 |
| Sentry | $0 (free tier) | $0 | $0 |
| **Total** | **~$20/month** | **~$31/month** | **+$11** |

**ROI:** Prevents 1 production incident = saves 10+ hours of debugging time

---

## 🎯 Implementation Timeline

### **Week 1 (CRITICAL):**
- Remove passwords from git
- Rotate database password
- Enable Secret Manager integration

### **Week 2-3 (HIGH PRIORITY):**
- Set up CI/CD (Cloud Build or GitHub Actions)
- Add Sentry error tracking
- Implement health checks

### **Month 2 (MEDIUM PRIORITY):**
- Create staging environment
- Load testing
- Database backups & DR plan

### **Month 3+ (NICE TO HAVE):**
- Feature flags
- A/B testing
- Multi-region deployment

---

## 🔗 Resources

- [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)
- [12-Factor App Methodology](https://12factor.net/)
- [SRE Book (Google)](https://sre.google/sre-book/table-of-contents/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** 2025-11-06
**Next Review:** Weekly during implementation
