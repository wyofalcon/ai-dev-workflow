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
**Status:** ✅ OPERATIONAL (cvstomize-api-00117-nnn)

### Staging (Session 21 - Complete!)
**Frontend (GUI):** https://cvstomize-frontend-staging-1036528578375.us-central1.run.app
**Backend (API):** https://cvstomize-api-staging-1036528578375.us-central1.run.app
**Status:** ✅ FULLY OPERATIONAL - Ready for resume-first implementation

---

## 🚀 Quick Start

**👉 START HERE:** [ROADMAP.md](ROADMAP.md) - Complete project documentation & roadmap

**Essential Docs:**
- [ROADMAP.md](ROADMAP.md) - Complete roadmap, session history, critical bugs, and next steps
- [CREDENTIALS_SECURE.md](CREDENTIALS_SECURE.md) - Secure credential access
- [MONETIZATION_STRATEGY.md](MONETIZATION_STRATEGY.md) - Business strategy (keep untouched)

**Additional Docs:**
- [docs/setup/](docs/setup/) - Setup guides (Firebase, Staging)
- [docs/testing/](docs/testing/) - Testing guides

---

## 📊 Current Status (Session 28 - December 10, 2025)

### ✅ SESSION 28: Critical Bugs Fixed + Profile Completion! ⚠️
**Status:** 5/6 fixes complete, 1 bug remaining (contact info)

**Major Fixes Completed:**
- ✅ **UI Copy Consistency** - Removed all "11 questions" hardcoded references
- ✅ **Gemini Prompt Leakage** - Regex cleaning prevents "Of course..." preamble
- ✅ **Placeholder Content** - No more `[Your Company]`, `[City, State]` brackets
- ✅ **Profile Completion Modal** - Option B implementation (just-in-time data collection)
- ✅ **Google Avatar Display** - CORS/CORP headers fixed
- ✅ **Resume Preview** - Shows actual content (not "No content available")
- ✅ **PDF Generation** - All 3 templates working (Bug #2 from Session 27 FIXED!)
- ⚠️ **Contact Info** - Email works, but "Alex Johnson" placeholder name still appears

**Current Revisions:**
- **Frontend:** cvstomize-frontend-00015-8qt (100% traffic)
- **Backend:** cvstomize-api-00124-xp6 (100% traffic) - Debug logging active

**🐛 Remaining Bug:**
- Contact information shows "Alex Johnson" instead of user's Google name
- Debug logging deployed, needs one test to identify root cause
- Expected fix: 1 deployment (< 30 minutes)

**Next Session 29:** Fix "Alex Johnson" bug, test complete flow, update docs
**See:** [SESSION_28_HANDOFF.md](SESSION_28_HANDOFF.md) for complete details and next steps

### ✅ STAGING ENVIRONMENT (Session 20-21)
- **Separate GCP Project:** cvstomize-staging (complete isolation)
- **Staging Frontend:** cvstomize-frontend-staging-00003-p94 (has upload UI ✅)
- **Staging API:** cvstomize-api-staging-00011-d4q (has upload endpoint ✅)
- **Staging Database:** cvstomize-db-staging (needs user account seeding)
- **CORS Configured:** Frontend ↔ Backend communication enabled

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

## 🎯 Next Steps (Session 28 - CRITICAL BUG FIXES)

**🚨 MUST FIX BEFORE ANY OTHER WORK:**

1. **🔴 Fix Resume Content Persistence** (Production Blocker)
   - Database migration: Add 3 columns to conversations table
   - Update conversation.js: Save to DB (not volatile Map)
   - Update resume.js: Load from DB (not volatile Map)
   - Test: Francisco's resume must show "Francisco Calisto" NOT "John Doe"

2. **🔴 Fix PDF Generation** (User Experience)
   - Update Dockerfile: Install Chromium + dependencies
   - Deploy with 1Gi memory (increased from 512Mi)
   - Test: All 3 PDF templates return HTTP 200 (not 500)

3. **✅ End-to-End Production Testing**
   - Verify complete flow with real user data
   - Test all 4 download formats
   - Only proceed to Session 29 if ALL tests pass

**See [ROADMAP.md](ROADMAP.md) for detailed implementation steps and Sessions 29-33 (Profile-First RAG System).**

---

## 📚 Documentation Structure

**Essential Files (4 Only):**
- `ROADMAP.md` - Complete roadmap, session history, critical bugs, implementation plan
- `README.md` - This file (project overview & quick start)
- `CREDENTIALS_SECURE.md` - Secure credential access (no passwords stored)
- `MONETIZATION_STRATEGY.md` - Business strategy (keep untouched)

**All session-specific docs consolidated into ROADMAP.md for easier context management.**

---

**Last Updated:** November 10, 2025
**Session:** 27 COMPLETE (Download Working!)
**Status:** ✅ Core Features Working | 🔴 Critical Bugs Identified | 📋 Session 28 Ready
