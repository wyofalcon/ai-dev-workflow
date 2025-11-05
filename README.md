# CVstomize v2.0: AI-Powered Resume Builder

**Viral Growth → Massive Scale → Strategic Monetization**

![Tests](https://img.shields.io/badge/tests-127%2F127%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-86%25%20critical%20paths-green)
![Backend](https://img.shields.io/badge/backend-production%20ready-blue)
![Status](https://img.shields.io/badge/status-active%20development-orange)

---

## 🚀 Quick Start

**For Development Setup:** See **[ROADMAP.md](ROADMAP.md)** - Your single source of truth for:
- Complete project roadmap (12+ months)
- Current progress (Week 2: ✅ 100% COMPLETE)
- Next session tasks (Week 3: Conversational Profile Builder)
- All GCP infrastructure details
- Session notes and implementation details

**For Credentials:** See **[CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)** for:
- Database connection strings
- Secret Manager access
- GCP project details
- All passwords and access URLs

---

## 📊 Current Status (2025-11-05)

**Phase**: Phase 1 - Viral MVP (Month 1, Week 3)
**Progress**: Session 12 COMPLETE - Production-Ready Testing Infrastructure
**Next Session**: Frontend Testing + CI/CD Setup

👉 **START HERE**: [TESTING_GUIDE.md](api/TESTING_GUIDE.md) - Backend testing documentation

### ✅ Session 12 Complete (2025-11-05): Backend Testing - 100% Pass Rate
- ✅ **127/127 Tests Passing (100%)** - Production-ready test coverage
  - ✅ 5 test suites: auth (9), JD analyzer (33), personality (47), endpoints (18), resume (20)
  - ✅ Coverage: 44.43% overall, **86%+ on critical paths**
  - ✅ All tests run in ~2.2 seconds
- ✅ **Production-Grade Architecture** - World-class testing patterns
  - ✅ Firebase initialization refactored ([api/config/firebase.js](api/config/firebase.js))
  - ✅ Centralized test mocking ([api/tests/setup.js](api/tests/setup.js))
  - ✅ Test isolation patterns implemented
  - ✅ Environment-aware configuration (test/dev/prod)
- ✅ **6 Production Bugs Found & Fixed** - Testing prevented runtime failures
  - ✅ Prisma model naming mismatch (personalityTrait → personalityTraits)
  - ✅ Express route ordering bug (/list before /:id)
  - ✅ Missing user lookup in list route
  - ✅ Model version inconsistencies
  - ✅ Case-sensitive error matching
  - ✅ Incorrect response expectations
- ✅ **Comprehensive Documentation** - [TESTING_GUIDE.md](api/TESTING_GUIDE.md) (350+ lines)
  - ✅ Quick start commands
  - ✅ Testing patterns and examples
  - ✅ Debugging guide
  - ✅ Coverage targets
  - ✅ Best practices

### ✅ Session 11 Complete (2025-11-04): Conversational Flow
- ✅ **Job-Description-First Architecture** - Parse JD → Generate targeted questions
- ✅ **6-Question Personality Framework** - Big Five traits with 13-step conversation
- ✅ **3 New API Endpoints** - JD analysis, conversation flow, answer validation
- ✅ **Personality Inference** - Natural language processing from user stories

### ✅ Previous Sessions Complete:
- ✅ Backend deployed to Cloud Run (revision **cvstomize-api-00045-xls** ✅ CURRENT)
- ✅ Google OAuth + Email/Password authentication fully working
- ✅ Profile picture display fixed (proxied through backend)
- ✅ Database connection verified (Cloud SQL + Unix socket)
- ✅ Gemini Vertex AI Integration working
- ✅ Resume generation endpoint with authentication
- ✅ Personality inference from personal stories
- ✅ Resume limit enforcement (free tier: 1 resume)
- ✅ Database tracking (resumes table)

**Next Session Priorities** (Choice 2 & 3 from Session 12):
- 🎯 **Frontend Testing** (2-3 hours): Setup React Testing Library, test components
  - Test ConversationalWizard component
  - Test ConversationalResumePage component
  - Test critical user flows (login, resume generation)
  - Generate frontend coverage report
- 🎯 **CI/CD Pipeline** (1-2 hours): Automate testing and deployment
  - Setup GitHub Actions workflow
  - Configure automated tests on PR to dev branch
  - Add deploy-on-merge to staging
  - Add production deploy gate (manual approval)

**See**:
- [TESTING_GUIDE.md](api/TESTING_GUIDE.md) - **Backend testing documentation** ⭐ NEW
- [ROADMAP.md](ROADMAP.md) - **Single source of truth** (updated with Session 12)
- [CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md](CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md) - E2E testing framework

---

## 💡 What CVstomize Does

CVstomize helps job seekers create perfect, tailored resumes in 5 minutes through:

1. **Conversational AI Profile Builder** (5-10 mins)
   - Natural conversation extracts your experience
   - Infers personality traits (Big Five model)
   - Builds complete professional profile

2. **Personality-Tailored Resumes**
   - Analyzes job descriptions for keywords
   - Frames your experience based on personality
   - ATS-optimized format
   - Professional PDF output

3. **Viral Growth Mechanics**
   - Social sharing gate to unlock resume
   - Referral system with rewards
   - Viral coefficient tracking

---

## 🛠 Technology Stack

**Frontend:**
- React 18.3.1 + Material-UI
- Firebase Auth (Google SSO + Email/Password)
- React Router v7

**Backend:**
- Node.js 20 LTS + Express.js
- Prisma ORM (PostgreSQL)
- Puppeteer (PDF generation)

**Infrastructure:**
- Google Cloud Platform (GCP)
- Cloud Run (auto-scaling containers)
- Cloud SQL (PostgreSQL 15)
- Cloud Storage (resume PDFs)
- Secret Manager (credentials)
- Firebase Authentication

**AI Services:**
- Gemini 1.5 Flash (conversation)
- Gemini 1.5 Pro (resume generation)

---

## 📈 Monetization Strategy

**Phase 1** (Months 1-3): $1K Budget
- Viral MVP with social share gate
- Target: 1,000-5,000 users
- Cost: <$0.025 per user

**Phase 2** (Months 4-12): $250K Google Credits
- Remove social gate, fully free
- Target: 100,000+ users
- Press coverage and partnerships

**Phase 3** (Month 13+): Freemium Model
- Free tier: 3 resumes/month
- Pro tier: $12/month (15 resumes)
- Enterprise: $499/month
- Target: $500K+ ARR

---

## 📂 Project Structure & Documentation

```
Cvstomize/
├── README.md                            # This file - Quick start guide
├── ROADMAP.md                           # ⭐ PRIMARY REFERENCE - 12-month plan
├── SESSION_HANDOFF.md                   # Latest session summary & deployment commands
├── CREDENTIALS_REFERENCE.md             # All passwords and access details
├── RESUME_OPTIMIZATION_STRATEGY.md      # Week 3-4 implementation guide
├── TESTING_SECURITY_STRATEGY.md         # Testing framework (85%+ coverage)
├── PROJECT_OVERVIEW.md                  # Detailed project summary
├── SESSION_6_SUMMARY.md                 # Previous session notes
├── database/
│   └── schema.sql                      # PostgreSQL schema (12 tables)
├── api/                                # Backend (Node.js + Express)
│   ├── generate-cv.js                  # Existing Gemini integration (Vercel)
│   ├── routes/                         # API routes
│   └── middleware/                     # Auth, CORS, etc.
├── src/                                # Frontend (React)
└── archive/                            # Old documentation
```

**📚 Essential Reading Order**:
1. [README.md](README.md) ← You are here
2. [ROADMAP.md](ROADMAP.md) - Full project plan with Week 2 complete (100%)
3. [SESSION_HANDOFF.md](SESSION_HANDOFF.md) - Latest session details
4. [RESUME_OPTIMIZATION_STRATEGY.md](RESUME_OPTIMIZATION_STRATEGY.md) - Next steps (Weeks 3-4)
5. [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - When you need access

---

## 🔗 Essential Links

**GCP Console:**
- Project Dashboard: https://console.cloud.google.com/home/dashboard?project=cvstomize
- Cloud SQL: https://console.cloud.google.com/sql/instances/cvstomize-db?project=cvstomize
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=cvstomize
- Firebase: https://console.firebase.google.com/project/cvstomize

**Database:**
- Instance: `cvstomize-db` (PostgreSQL 15)
- Database: `cvstomize_production`
- Connection: `34.67.70.34:5432`
- User: `cvstomize_app`

---

## 👥 Team

- **ashley.caban.c@gmail.com** - Primary Owner
- **wyofalcon@gmail.com** - Co-owner & Billing Admin

---

## 📝 Version History

**v2.0** (Current - 2025-02-02)
- Migrating from Vercel to GCP
- Adding conversational AI profile builder
- Implementing viral growth mechanics
- Building for 100,000+ user scale

**v1.0** (Previous)
- Basic resume generation
- Vercel deployment
- Single-page application

---

**For detailed implementation plan, progress tracking, and next steps:**
👉 **See [ROADMAP.md](ROADMAP.md)**

**For credentials and access:**
👉 **See [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)**
