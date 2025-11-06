# 🚀 CVstomize - Quick Reference Card

**Keep this handy for daily operations!**

---

## 🔐 Secret Management

```bash
# List all secrets
./scripts/manage-secrets.sh list

# Get a secret value
./scripts/manage-secrets.sh get DATABASE_URL

# Set a new secret (will prompt securely)
./scripts/manage-secrets.sh set SECRET_NAME

# Generate secure password
./scripts/manage-secrets.sh generate

# Rotate database password
./scripts/manage-secrets.sh rotate-db

# Export secrets for local dev
./scripts/manage-secrets.sh export .env.local
```

---

## 🚀 Deployment Workflow

### **Development:**
```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. Make changes
# ... edit code ...

# 3. Commit and push
git add .
git commit -m "feat: Add my feature"
git push origin feature/my-feature

# 4. Create PR to dev branch on GitHub
# 5. Tests run automatically
# 6. Merge PR → Auto-deploys to dev environment
```

### **Staging:**
```bash
# Merge dev to staging
git checkout staging
git pull origin staging
git merge dev
git push origin staging

# Auto-deploys to cvstomize-api-staging
```

### **Production:**
```bash
# Merge staging to main
git checkout main
git pull origin main
git merge staging
git push origin main

# Auto-deploys to cvstomize-api (production)
```

---

## 🔍 Monitoring

### **Check Health:**
```bash
# Production
curl https://cvstomize-api-351889420459.us-central1.run.app/health

# Staging
curl https://cvstomize-api-staging-351889420459.us-central1.run.app/health

# Dev
curl https://cvstomize-api-dev-351889420459.us-central1.run.app/health
```

### **View Logs:**
```bash
# Production logs
gcloud run services logs read cvstomize-api --region us-central1 --limit 50

# Staging logs
gcloud run services logs read cvstomize-api-staging --region us-central1 --limit 50

# Dev logs
gcloud run services logs read cvstomize-api-dev --region us-central1 --limit 50
```

### **View Deployments:**
```bash
# List revisions
gcloud run revisions list --service cvstomize-api --region us-central1

# Check current revision
gcloud run services describe cvstomize-api --region us-central1
```

---

## 🐛 Troubleshooting

### **Deployment Failed:**
```bash
# Check GitHub Actions logs
# Go to: https://github.com/YOUR_USERNAME/cvstomize/actions

# Or check Cloud Build
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### **Database Connection Issues:**
```bash
# Verify secret
./scripts/manage-secrets.sh get DATABASE_URL_production

# Test connection locally
psql $(./scripts/manage-secrets.sh get DATABASE_URL_production)
```

### **Secret Not Found:**
```bash
# List all secrets
./scripts/manage-secrets.sh list

# Verify service account has access
gcloud secrets get-iam-policy SECRET_NAME
```

---

## 🔄 Common Operations

### **Rollback Deployment:**
```bash
# Option 1: Revert git commit
git revert HEAD
git push origin main

# Option 2: Route to previous revision
gcloud run services update-traffic cvstomize-api \
  --to-revisions PREVIOUS_REVISION=100 \
  --region us-central1
```

### **Manual Deployment:**
```bash
# Build image
cd api
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api

# Deploy
gcloud run services update cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1
```

### **Database Migration:**
```bash
# Export production secrets
./scripts/manage-secrets.sh export .env.local

# Run migration locally
cd api
npm run migrate

# Or run directly
psql $(./scripts/manage-secrets.sh get DATABASE_URL) < migration.sql
```

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| `README.md` | Project overview |
| `CREDENTIALS_SECURE.md` | How to access secrets |
| `WORLD_CLASS_SETUP.md` | Complete setup guide |
| `DEPLOYMENT_GUIDE.md` | Deployment reference |
| `SESSION_17_SUMMARY.md` | Latest changes |

---

## 🆘 Emergency Contacts

**Git Issues:** Check `.git/config` for remote URL
**Secret Issues:** Run `./scripts/manage-secrets.sh help`
**Deployment Issues:** Check GitHub Actions or Cloud Build logs
**Database Issues:** Verify secret and Cloud SQL instance status

---

## ⚡ Power User Tips

```bash
# Alias for frequent commands (add to ~/.bashrc)
alias secrets='./scripts/manage-secrets.sh'
alias deploy-dev='git push origin dev'
alias deploy-staging='git checkout staging && git merge dev && git push origin staging'
alias deploy-prod='git checkout main && git merge staging && git push origin main'

# Quick health check all environments
for env in "" "-staging" "-dev"; do
  echo "=== cvstomize-api$env ==="
  curl -s https://cvstomize-api$env-351889420459.us-central1.run.app/health | jq
done
```

---

## 🎯 Remember

✅ **Never commit** `.env.local` files
✅ **Always test** in dev before staging
✅ **Always test** in staging before production
✅ **Use Secret Manager** for all credentials
✅ **Let CI/CD handle** deployments (don't deploy manually unless emergency)

---

**Last Updated:** 2025-11-06
**Quick Help:** `./scripts/manage-secrets.sh help`
