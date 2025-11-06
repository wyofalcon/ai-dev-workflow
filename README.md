# CVstomize: AI-Powered Resume Builder

**🚀 LIVE IN PRODUCTION - Full Stack Deployed on GCP**

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Tests](https://img.shields.io/badge/backend_tests-160%2F160%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-64.48%25-green)
![Platform](https://img.shields.io/badge/platform-GCP%20Cloud%20Run-blue)

---

## 🌐 Production URLs

**Frontend (GUI):** https://cvstomize-frontend-351889420459.us-central1.run.app  
**Backend (API):** https://cvstomize-api-351889420459.us-central1.run.app

**Status:** ✅ All systems operational

---

## 🚀 Quick Start

**👉 START HERE:** [ROADMAP.md](ROADMAP.md) - Single source of truth

**Key Docs:**
- [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) - Production deployment report
- [QUICK_START_PRODUCTION.md](QUICK_START_PRODUCTION.md) - Production commands
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - All credentials

---

## 📊 Current Status (Session 16 - Nov 6, 2025)

### ✅ PRODUCTION DEPLOYED
- Frontend: React on GCP Cloud Run ✅
- Backend: Node.js on GCP Cloud Run ✅
- Database: PostgreSQL on Cloud SQL ✅
- Storage: Google Cloud Storage ✅
- AI: Vertex AI (Gemini) ✅

### 🎯 Features Live
1. **11-Question Conversational Flow** - AI personality inference
2. **Personality-Based Resume Generation** - Dynamic framing
3. **3 Professional PDF Templates** - Classic, Modern, Minimal
4. **ATS Optimization** - 80%+ keyword coverage
5. **Outcome Tracking** - Interview/offer data collection

---

## 🛠 Tech Stack

**Frontend:** React 18 + Material-UI + Firebase Auth  
**Backend:** Node.js 20 + Express + Prisma + PostgreSQL 15  
**Infrastructure:** GCP Cloud Run + Cloud SQL + Cloud Storage  
**AI:** Vertex AI (Gemini 2.5 Pro + 2.0 Flash)  
**Testing:** Jest (160 tests, 64.48% coverage)

---

## 🚀 Development

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
# Backend
cd api
./deploy-to-cloud-run.sh

# Frontend
gcloud builds submit --config=cloudbuild.frontend.yaml .
```

---

## 🔗 Links

**Production:**
- Frontend: https://cvstomize-frontend-351889420459.us-central1.run.app
- Backend API: https://cvstomize-api-351889420459.us-central1.run.app/health

**GCP Console:**
- [Cloud Run](https://console.cloud.google.com/run?project=cvstomize)
- [Cloud SQL](https://console.cloud.google.com/sql/instances?project=cvstomize)
- [Logs](https://console.cloud.google.com/logs?project=cvstomize)

**GitHub:**
- [Dev Branch](https://github.com/wyofalcon/cvstomize/tree/dev)

---

## 💰 Costs

**GCP Credits:** ~$298 remaining (of $300)  
**Monthly:** ~$15-20 (Cloud SQL ~$10, Vertex AI ~$5-10)

---

## 🎯 Next Steps

1. End-to-end testing
2. Frontend Phase 7 integration (outcome tracking UI)
3. User beta testing

See [ROADMAP.md](ROADMAP.md) for complete details.

---

**Last Updated:** November 6, 2025  
**Session:** 16 (Production Complete)  
**Status:** 🚀 LIVE
