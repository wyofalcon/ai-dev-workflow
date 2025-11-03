# CVstomize v2.0: AI-Powered Resume Builder

**Viral Growth → Massive Scale → Strategic Monetization**

---

## 🚀 Quick Start

**For Development Setup:** See **[ROADMAP.md](ROADMAP.md)** - Your single source of truth for:
- Complete project roadmap (12+ months)
- Current progress (Week 2: 98% complete)
- Next session tasks (2 quick fixes - 30 min to complete Week 2)
- All GCP infrastructure details
- Session notes and detailed fix instructions

**For Credentials:** See **[CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)** for:
- Database connection strings
- Secret Manager access
- GCP project details
- All passwords and access URLs

---

## 📊 Current Status (2025-11-03)

**Phase**: Phase 1 - Viral MVP (Month 1, Week 2)
**Progress**: Week 2 - 98% complete (2 quick fixes remaining)
**Next Session**: Fix frontend URL and Firebase race condition (30 minutes)

### ✅ Completed Today:
- Backend deployed to Cloud Run (revision cvstomize-api-00025-7zh)
- Test suite: **9/9 passing** (register, login, /me, logout, health)
- Fixed Firebase Admin SDK double initialization
- Fixed DATABASE_URL format for Cloud SQL Proxy (Unix socket)
- Fixed database name (`cvstomize_production` not `cvstomize`)
- **Database connection verified and working** ✅
- Verbose error logging added throughout
- Test endpoints created for debugging

### ⚠️ 2 Quick Fixes Remaining (30 min):
1. **Frontend URL** - Update `.env` to point to Cloud Run (not localhost:3001)
2. **Firebase Race Condition** - Add promise lock to prevent concurrent initialization

### ⏳ Next Session (Complete Week 2):
1. Update `REACT_APP_API_URL` in frontend `.env` to Cloud Run URL (5 min)
2. Fix Firebase `getFirebaseAdmin()` with promise-based lock (15 min)
3. Deploy, test registration, verify user in database (10 min)

**See ROADMAP.md Session 5 notes for detailed fix instructions**

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

## 📂 Project Structure

```
Cvstomize/
├── ROADMAP.md                    # ⭐ PRIMARY REFERENCE - Start here
├── CREDENTIALS_REFERENCE.md      # All passwords and access
├── README.md                     # This file
├── TESTING_SECURITY_STRATEGY.md  # Testing framework (85%+ coverage)
├── PROJECT_OVERVIEW.md           # Detailed project summary
├── database/
│   └── schema.sql               # PostgreSQL schema (12 tables)
├── api/                         # Backend (Node.js + Express)
├── src/                         # Frontend (React)
└── archive/                     # Old documentation
```

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
