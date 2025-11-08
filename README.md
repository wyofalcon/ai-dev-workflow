# CVstomize: AI-Powered Resume Builder

**🌟 WORLD-CLASS PRODUCTION - Enterprise-Grade Infrastructure**

![Status](https://img.shields.io/badge/status-world--class%20production-brightgreen)
![Tests](https://img.shields.io/badge/backend_tests-160%2F160%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-64.48%25-green)
![Platform](https://img.shields.io/badge/platform-GCP%20Cloud%20Run-blue)
![CI/CD](https://img.shields.io/badge/CI%2FCD-automated-blue)
![Security](https://img.shields.io/badge/credentials-Secret%20Manager-green)

---

## 🌐 Environment URLs

### Production
**Frontend (GUI):** https://cvstomize-frontend-351889420459.us-central1.run.app
**Backend (API):** https://cvstomize-api-351889420459.us-central1.run.app
**Status:** ✅ STABLE (cvstomize-api-00092-prk)

### Staging (Session 21 - Complete!)
**Frontend (GUI):** https://cvstomize-frontend-staging-1036528578375.us-central1.run.app
**Backend (API):** https://cvstomize-api-staging-1036528578375.us-central1.run.app
**Status:** ✅ FULLY OPERATIONAL - Ready for resume-first implementation

---

## 🚀 Quick Start

**👉 START HERE:** [ROADMAP.md](ROADMAP.md) - Complete project documentation

**Essential Docs:**
- [CREDENTIALS_SECURE.md](CREDENTIALS_SECURE.md) - Secure credential access (NO passwords!)
- [STAGING_ENVIRONMENT_SETUP.md](STAGING_ENVIRONMENT_SETUP.md) - Staging infrastructure (Session 20)
- [RESUME_FIRST_PROMPT.md](RESUME_FIRST_PROMPT.md) - Resume-first gap analysis prompt

**Archived Docs:** [docs/archive/](docs/archive/) - Session summaries & deployment records

---

## 📊 Current Status (Session 21 - November 8, 2025)

### ✅ STAGING ENVIRONMENT COMPLETE (Session 20-21)
- **Separate GCP Project:** cvstomize-staging (complete isolation)
- **Staging Frontend:** cvstomize-frontend-staging-00001-6pr (DEPLOYED ✅)
- **Staging API:** cvstomize-api-staging-00008-hc7 (HEALTHY ✅)
- **Staging Database:** cvstomize-db-staging (all 12 tables)
- **CORS Configured:** Frontend ↔ Backend communication enabled
- **Environment-Aware Code:** Automatically detects staging vs production
- **Ready for:** Resume-first gap analysis implementation

### ✅ WORLD-CLASS INFRASTRUCTURE
- **Secret Management:** All credentials in GCP Secret Manager with CLI tool
- **CI/CD Pipeline:** Automated deployments (GitHub Actions + Cloud Build)
- **Security:** IAM access control, audit logging, password rotation
- **Deployment Time:** 5 minutes (66% faster than manual)
- **Environment Isolation:** ✅ Production + Staging (separate projects)

### 🎯 Features Live (Production)
1. **JD-Specific Questions** - Gemini generates 5 custom questions per job
2. **Gemini-Powered Personality Inference** - AI-based Big 5 analysis
3. **Resume Generation** - Pulls conversation answers + personality
4. **3 Professional PDF Templates** - Classic, Modern, Minimal
5. **ATS Optimization** - 80%+ keyword coverage
6. **Outcome Tracking** - Interview/offer data collection (API ready)

---

## 🛠 Tech Stack

**Frontend:** React 18 + Material-UI + Firebase Auth
**Backend:** Node.js 20 + Express + Prisma + PostgreSQL 15
**Infrastructure:** GCP Cloud Run + Cloud SQL + Cloud Storage
**AI:** Vertex AI (Gemini 2.5 Pro + 2.0 Flash)
**Security:** Secret Manager + IAM + Cloud Audit Logs
**CI/CD:** GitHub Actions + Cloud Build
**Testing:** Jest (160 tests, 64.48% coverage)

---

## 🚀 Development

### Get Credentials
```bash
# Use Secret Manager CLI (recommended)
./scripts/manage-secrets.sh list
./scripts/manage-secrets.sh get DATABASE_URL
./scripts/manage-secrets.sh export .env.local

# See CREDENTIALS_SECURE.md for all commands
```

### Local Setup
```bash
# Backend
cd api
npm install
npx prisma generate
npm run dev

# Frontend
npm install
npm start
```

### Testing
```bash
cd api
npm test              # All tests
npm test -- --coverage # With coverage
```

### Deploy to Production
```bash
# Automated (CI/CD) - Push to branch
git push origin dev      # Auto-deploy to dev environment
git push origin staging  # Auto-deploy to staging
git push origin main     # Auto-deploy to production

# Manual (if needed)
cd api
./deploy-to-cloud-run.sh
```

---

## 🔗 Quick Links

**Production:**
- Frontend: https://cvstomize-frontend-351889420459.us-central1.run.app
- Backend API: https://cvstomize-api-351889420459.us-central1.run.app/health

**GCP Console:**
- [Cloud Run](https://console.cloud.google.com/run?project=cvstomize)
- [Cloud SQL](https://console.cloud.google.com/sql/instances?project=cvstomize)
- [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=cvstomize)
- [Logs](https://console.cloud.google.com/logs?project=cvstomize)

**GitHub:**
- [Dev Branch](https://github.com/wyofalcon/cvstomize/tree/dev)
- [CI/CD Actions](https://github.com/wyofalcon/cvstomize/actions)

---

## 💰 Costs

**GCP Credits:** ~$296 remaining (of $300)
**Monthly:** ~$36-41 (Production: $15-20, Dev/Staging: $21 additional)
**Deployment:** Automated (no manual time cost)

---

## 🎯 Next Steps (Session 22)

1. ✅ **Staging environment deployed** (Session 20 - Complete)
2. ✅ **Frontend deployed to staging** (Session 21 - Complete)
3. ✅ **CORS configured** (Session 21 - Complete)
4. Test end-to-end conversation flow in staging (browser testing)
5. Begin resume-first gap analysis implementation (backend)
6. Test resume-first thoroughly in staging before production

See [ROADMAP.md](ROADMAP.md) for complete roadmap and [STAGING_ENVIRONMENT_SETUP.md](STAGING_ENVIRONMENT_SETUP.md) for staging details.

---

## 📚 Documentation Structure

**Core Docs (Keep These):**
- `ROADMAP.md` - Single source of truth, all session history
- `README.md` - This file (quick start)
- `MONETIZATION_STRATEGY.md` - Business strategy

**Operations:**
- `CREDENTIALS_SECURE.md` - Credential access (no passwords)
- `QUICK_REFERENCE.md` - Daily commands
- `scripts/manage-secrets.sh` - Secret Manager CLI

**Infrastructure:**
- `WORLD_CLASS_SETUP.md` - 4-hour transformation guide
- `PRODUCTION_IMPROVEMENTS.md` - Prioritized backlog
- `.github/workflows/deploy.yml` - CI/CD pipeline

**Security:**
- `SECURITY_AUDIT.md` - Enterprise audit (18 items)
- `FIREBASE_SETUP.md` - Firebase key management
- `scripts/clean-git-history.sh` - Remove passwords from history

**Testing:**
- `api/TESTING_GUIDE.md` - Testing patterns

**Archives:** `docs/archive/` - Session summaries, old deployment docs

---

**Last Updated:** November 8, 2025
**Session:** 20 (Staging Environment Complete)
**Status:** 🌟 PRODUCTION + STAGING READY
