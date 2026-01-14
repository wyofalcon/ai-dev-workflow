# 🌟 CVstomize - World-Class Production Setup Guide

**Transform from MVP to Production-Grade in 4 Hours**

---

## 📋 Overview

This guide takes CVstomize from "working MVP" to "production-grade world-class app" with:
- ✅ Proper secret management (no passwords in code)
- ✅ CI/CD pipeline (auto-deploy on git push)
- ✅ Dev/Staging/Production environments
- ✅ Error tracking and monitoring
- ✅ Automated testing
- ✅ Security hardening

**Time Estimate:** 4 hours
**Cost:** +$11/month (dev + staging environments)

---

## 🚀 Part 1: Secret Management (30 minutes)

### **Step 1: Initialize Secret CLI**

```bash
cd /mnt/storage/shared_windows/Cvstomize

# Make scripts executable
chmod +x scripts/manage-secrets.sh
chmod +x scripts/clean-git-history.sh

# Test the CLI
./scripts/manage-secrets.sh list
```

### **Step 2: Create Environment-Specific Secrets**

```bash
# Initialize dev environment
./scripts/manage-secrets.sh init dev

# Initialize staging environment
./scripts/manage-secrets.sh init staging

# For production, secrets already exist, but let's verify
./scripts/manage-secrets.sh get DATABASE_URL
```

### **Step 3: Rotate Production Password**

```bash
# Generate new secure database password
./scripts/manage-secrets.sh rotate-db

# This will:
# ✅ Generate random 32-character password
# ✅ Update Cloud SQL
# ✅ Update Secret Manager
```

### **Step 4: Clean Git History** (OPTIONAL - Coordinate with team!)

```bash
# ⚠️ WARNING: Rewrites git history!
# Only do this if you haven't shared the repo yet

./scripts/clean-git-history.sh

# After running, you'll need to force push:
git push --force --all origin
```

### **Step 5: Update .gitignore**

```bash
cat >> .gitignore <<EOF

# Environment files (NEVER COMMIT THESE!)
.env
.env.local
.env.*.local
.env.development
.env.staging
.env.production

# Backup files
CREDENTIALS_REFERENCE.md
*.backup

EOF

git add .gitignore
git commit -m "chore: Update .gitignore to prevent credential leaks"
```

---

## 🏗️ Part 2: Infrastructure Setup (45 minutes)

### **Step 1: Create Staging Database**

```bash
# Create staging Cloud SQL instance
gcloud sql instances create cvstomize-db-staging \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-flags=max_connections=100 \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --project=cvstomize

# Create database
gcloud sql databases create cvstomize_staging \
  --instance=cvstomize-db-staging \
  --project=cvstomize

# Create user
STAGING_PASSWORD=$(./scripts/manage-secrets.sh generate)
gcloud sql users create cvstomize_app \
  --instance=cvstomize-db-staging \
  --password="$STAGING_PASSWORD" \
  --project=cvstomize

# Update secret with real password
./scripts/manage-secrets.sh set DATABASE_URL_staging \
  "postgresql://cvstomize_app:$STAGING_PASSWORD@localhost/cvstomize_staging?host=/cloudsql/cvstomize:us-central1:cvstomize-db-staging"
```

### **Step 2: Create Dev Database** (Optional - can use local PostgreSQL)

```bash
# If you want a Cloud SQL dev database:
gcloud sql instances create cvstomize-db-dev \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --project=cvstomize

# Or use local PostgreSQL for dev:
./scripts/manage-secrets.sh set DATABASE_URL_dev \
  "postgresql://postgres:postgres@localhost:5432/cvstomize_dev"
```

### **Step 3: Create Cloud Storage Buckets**

```bash
# Staging bucket
gsutil mb -p cvstomize -c STANDARD -l us-central1 gs://cvstomize-resumes-staging
gsutil lifecycle set - gs://cvstomize-resumes-staging <<EOF
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }]
  }
}
EOF

# Dev bucket
gsutil mb -p cvstomize -c STANDARD -l us-central1 gs://cvstomize-resumes-dev
gsutil lifecycle set - gs://cvstomize-resumes-dev <<EOF
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 7}
    }]
  }
}
EOF
```

### **Step 4: Run Database Migrations**

```bash
# Export production schema
pg_dump $(./scripts/manage-secrets.sh get DATABASE_URL) --schema-only > schema.sql

# Apply to staging
psql $(./scripts/manage-secrets.sh get DATABASE_URL_staging) < schema.sql

# Apply to dev (if using Cloud SQL)
# psql $(./scripts/manage-secrets.sh get DATABASE_URL_dev) < schema.sql
```

---

## 🔄 Part 3: CI/CD Setup (1 hour)

### **Option A: GitHub Actions** (Recommended - More Common)

#### **Step 1: Create Service Account Key**

```bash
# Create key for GitHub Actions
gcloud iam service-accounts keys create ~/cvstomize-github-actions-key.json \
  --iam-account=cvstomize-deployer@cvstomize.iam.gserviceaccount.com

# View the key (you'll add this to GitHub)
cat ~/cvstomize-github-actions-key.json
```

#### **Step 2: Add Secret to GitHub**

1. Go to: https://github.com/YOUR_USERNAME/cvstomize/settings/secrets/actions
2. Click "New repository secret"
3. Name: `GCP_SA_KEY`
4. Value: Paste the entire contents of `cvstomize-github-actions-key.json`
5. Click "Add secret"

#### **Step 3: Create Branches**

```bash
# Create staging branch
git checkout -b staging
git push -u origin staging

# Create dev branch
git checkout -b dev
git push -u origin dev

# Go back to main
git checkout main
```

#### **Step 4: Set Up Branch Protection**

Go to: https://github.com/YOUR_USERNAME/cvstomize/settings/branches

**For `main` branch:**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (select "test" job)
- ✅ Require branches to be up to date
- ✅ Include administrators

**For `staging` branch:**
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

#### **Step 5: Test CI/CD**

```bash
# Make a small change
echo "# Test CI/CD" >> README.md

# Commit to dev
git checkout dev
git add README.md
git commit -m "test: CI/CD pipeline"
git push origin dev

# Watch the GitHub Actions run:
# https://github.com/YOUR_USERNAME/cvstomize/actions
```

**Expected behavior:**
- ✅ Tests run
- ✅ Docker image builds
- ✅ Deploys to `cvstomize-api-dev`
- ✅ Smoke tests pass

### **Option B: Cloud Build** (Alternative - Native GCP)

#### **Step 1: Connect Cloud Build to GitHub**

> **⚠️ DEPRECATION WARNING:**
> The `gcloud builds triggers create github` command is deprecated.
> Google Cloud now recommends using the **Cloud Build GitHub App** (2nd Gen) integration.
>
> **Please follow these steps in the Google Cloud Console:**
> 1. Go to **Cloud Build > Triggers**
> 2. Click **Create Trigger**
> 3. Select **GitHub (Cloud Build GitHub App)** as the source
> 4. Authenticate and select `wyofalcon/cvstomize` repository
> 5. Configure the trigger:
>    - **Name:** `deploy-dev`
>    - **Event:** Push to branch
>    - **Source:** `^dev$`
>    - **Configuration:** `Cloud Build configuration file (yaml or json)`
>    - **Location:** `cloudbuild.yaml`
>    - **Substitutions:** `_ENV=dev`
> 6. Repeat for `staging` and `main` branches.

#### **Step 2: Test Cloud Build**

```bash
# Manual trigger
gcloud builds submit --config cloudbuild.yaml --substitutions=_ENV=dev
```

---

## 📊 Part 4: Monitoring & Error Tracking (45 minutes)

### **Step 1: Set Up Sentry**

```bash
# Sign up for free Sentry account: https://sentry.io/signup/

# Create project "CVstomize - Production"
# Get your DSN (looks like: https://...@sentry.io/...)

# Add to Secret Manager
./scripts/manage-secrets.sh set SENTRY_DSN_production "https://YOUR_DSN@sentry.io/PROJECT_ID"
./scripts/manage-secrets.sh set SENTRY_DSN_staging "https://YOUR_DSN@sentry.io/PROJECT_ID"
./scripts/manage-secrets.sh set SENTRY_DSN_dev "https://YOUR_DSN@sentry.io/PROJECT_ID"
```

### **Step 2: Install Sentry in Backend**

```bash
cd api
npm install @sentry/node @sentry/profiling-node
```

Add to `api/index.js` (AFTER existing imports, BEFORE routes):

```javascript
// Error tracking
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  // Request handler must be first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ... existing routes ...

// Error handler must be AFTER all routes
if (process.env.NODE_ENV !== 'development') {
  app.use(Sentry.Handlers.errorHandler());
}
```

### **Step 3: Update Cloud Run Deployment**

Add SENTRY_DSN to secrets in `.github/workflows/deploy.yml`:

```yaml
--set-secrets="DATABASE_URL=DATABASE_URL_$ENV:latest,JWT_SECRET=JWT_SECRET_$ENV:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME_$ENV:latest,SENTRY_DSN=SENTRY_DSN_$ENV:latest"
```

### **Step 4: Set Up Cloud Monitoring Alerts**

```bash
# Create error rate alert
gcloud alpha monitoring policies create \
  --notification-channels=$(gcloud alpha monitoring channels list --format="value(name)" --filter="displayName:Email") \
  --display-name="CVstomize High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name=~"cvstomize-api.*" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"' \
  --condition-aggregation-alignment-period=60s

# Create latency alert
gcloud alpha monitoring policies create \
  --notification-channels=$(gcloud alpha monitoring channels list --format="value(name)" --filter="displayName:Email") \
  --display-name="CVstomize High Latency" \
  --condition-display-name="P95 latency > 2 seconds" \
  --condition-threshold-value=2000 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name=~"cvstomize-api.*" AND metric.type="run.googleapis.com/request_latencies"' \
  --condition-aggregation-alignment-period=60s \
  --condition-aggregation-per-series-aligner=ALIGN_PERCENTILE_95
```

---

## 🎯 Part 5: Testing & Verification (30 minutes)

### **Development Workflow Test**

```bash
# 1. Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/test-workflow

# 2. Make a change
echo "console.log('Testing CI/CD');" >> api/index.js

# 3. Commit and push
git add .
git commit -m "feat: Test CI/CD workflow"
git push origin feature/test-workflow

# 4. Create PR to dev branch
# Go to GitHub and create PR: feature/test-workflow → dev

# 5. Watch tests run
# Tests should pass, then merge PR

# 6. Verify deployment
# Dev environment should auto-deploy

# 7. Promote to staging
git checkout staging
git merge dev
git push origin staging

# 8. Test staging
curl https://cvstomize-api-staging-351889420459.us-central1.run.app/health

# 9. Promote to production
git checkout main
git merge staging
git push origin main

# 10. Verify production
curl https://cvstomize-api-351889420459.us-central1.run.app/health
```

### **Secret Management Test**

```bash
# Get a secret
./scripts/manage-secrets.sh get JWT_SECRET_dev

# Update a secret
./scripts/manage-secrets.sh set TEST_SECRET "test-value-123"

# Verify it was created
./scripts/manage-secrets.sh list | grep TEST_SECRET

# Export for local dev
./scripts/manage-secrets.sh export .env.local
cat .env.local  # Should contain all secrets
```

### **Error Tracking Test**

```bash
# Trigger an error in dev
curl -X POST https://cvstomize-api-dev-351889420459.us-central1.run.app/api/nonexistent

# Check Sentry dashboard
# Should see the 404 error logged
```

---

## 📚 Part 6: Documentation Updates (30 minutes)

### **Update README.md**

Add deployment badges and new workflow instructions:

```markdown
# CVstomize - AI-Powered Resume Builder

[![Deploy Production](https://github.com/YOUR_USERNAME/cvstomize/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/YOUR_USERNAME/cvstomize/actions/workflows/deploy.yml)

## 🚀 Deployments

- **Production:** https://cvstomize-api-351889420459.us-central1.run.app
- **Staging:** https://cvstomize-api-staging-351889420459.us-central1.run.app
- **Dev:** https://cvstomize-api-dev-351889420459.us-central1.run.app

## 🔧 Development Workflow

1. Create feature branch from `dev`
2. Make changes
3. Push to feature branch
4. Create PR to `dev`
5. Tests run automatically
6. Merge to `dev` → Auto-deploys to dev environment
7. Test in dev, then merge `dev` → `staging`
8. Test in staging, then merge `staging` → `main`
9. Production deployment automatic

## 🔐 Secret Management

All credentials managed via Secret Manager CLI:

\`\`\`bash
# List secrets
./scripts/manage-secrets.sh list

# Get a secret
./scripts/manage-secrets.sh get DATABASE_URL

# Rotate database password
./scripts/manage-secrets.sh rotate-db
\`\`\`

See [CREDENTIALS_SECURE.md](CREDENTIALS_SECURE.md) for details.
```

### **Create CHANGELOG.md**

```bash
cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to CVstomize will be documented in this file.

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions
- Automated deployments to dev/staging/production
- Secret management CLI
- Sentry error tracking
- Cloud Monitoring alerts

### Changed
- Migrated to Secret Manager (no more plaintext passwords)
- Updated deployment process (now fully automated)

### Security
- Removed passwords from git history
- Rotated all production credentials
- Added branch protection rules

## [1.0.0] - 2025-11-06

### Added
- Initial production deployment
- Week 4 resume generation features
- Phase 7 outcome tracking
- Gemini AI integration (Vertex AI)

EOF
```

---

## ✅ Verification Checklist

After completing all steps, verify:

### **Security**
- [ ] No passwords in git history
- [ ] All secrets in Secret Manager
- [ ] DATABASE_URL uses unique passwords per environment
- [ ] JWT_SECRET is different for dev/staging/production
- [ ] .gitignore prevents credential commits
- [ ] Branch protection enabled on `main` and `staging`

### **CI/CD**
- [ ] Push to `dev` triggers deployment to dev environment
- [ ] Push to `staging` triggers deployment to staging
- [ ] Push to `main` triggers deployment to production
- [ ] Tests run before deployment
- [ ] Smoke tests verify deployment success
- [ ] Failed tests block deployment

### **Monitoring**
- [ ] Sentry receives errors
- [ ] Cloud Monitoring shows metrics
- [ ] Email alerts configured
- [ ] Health checks passing

### **Documentation**
- [ ] CREDENTIALS_SECURE.md is accurate
- [ ] DEPLOYMENT_GUIDE.md updated
- [ ] README.md has deployment workflow
- [ ] CHANGELOG.md started

---

## 🎉 Congratulations!

You now have a **world-class production setup**:

✅ **Security:** Secrets in Secret Manager, passwords rotated, git history clean
✅ **Automation:** Push to deploy, tests run automatically
✅ **Environments:** Dev, staging, production isolation
✅ **Monitoring:** Sentry + Cloud Monitoring + alerts
✅ **Reliability:** Health checks, smoke tests, rollback capability

---

## 📊 Cost Breakdown

| Item | Before | After | Change |
|------|--------|-------|--------|
| Cloud Run (prod) | $10 | $10 | - |
| Cloud Run (staging) | $0 | $5 | +$5 |
| Cloud Run (dev) | $0 | $3 | +$3 |
| Cloud SQL (prod) | $10 | $10 | - |
| Cloud SQL (staging) | $0 | $10 | +$10 |
| Secret Manager | $0 | $1 | +$1 |
| Cloud Storage | $2 | $4 | +$2 |
| **Total** | **$22/mo** | **$43/mo** | **+$21/mo** |

**ROI:** One prevented production incident saves 10+ hours of debugging time ($200+ value)

---

## 🆘 Troubleshooting

### "GitHub Actions failing with 403 error"
- Check that `GCP_SA_KEY` secret is set correctly in GitHub
- Verify service account has necessary permissions

### "Database connection failing in staging"
- Verify `DATABASE_URL_staging` secret is correct
- Check Cloud SQL instance is running
- Verify `--add-cloudsql-instances` includes staging instance

### "Secrets not found"
- Run `./scripts/manage-secrets.sh list` to verify secrets exist
- Check secret names match environment (e.g., `JWT_SECRET_dev`)
- Verify deployer service account has `secretAccessor` role

---

## 📞 Support

- **Documentation:** [CREDENTIALS_SECURE.md](CREDENTIALS_SECURE.md)
- **Issues:** https://github.com/YOUR_USERNAME/cvstomize/issues
- **Email:** ashley.caban.c@gmail.com

**Last Updated:** 2025-11-06
