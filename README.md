# CVstomize v2.0: AI-Powered Resume Builder

**Viral Growth → Massive Scale → Strategic Monetization**

---

## 🚀 Quick Start

**For Development Setup:** See **[ROADMAP.md](ROADMAP.md)** - Your single source of truth for:
- Complete project roadmap (12+ months)
- Current progress (Week 1: 35% complete)
- Next session tasks (Day 4: Cloud Storage Setup)
- All GCP infrastructure details
- Session notes and key decisions

**For Credentials:** See **[CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)** for:
- Database connection strings
- Secret Manager access
- GCP project details
- All passwords and access URLs

---

## 📊 Current Status (2025-11-03)

**Phase**: Phase 1 - Viral MVP (Month 1, Week 2)
**Progress**: Week 2 Backend - 95% complete (deployed but debugging 500 errors)
**Next Session**: Debug authentication 500 errors with verbose logging

### ✅ Completed This Session:
- Backend deployed to Cloud Run (cvstomize-api.us-central1.run.app)
- Test suite: **9/9 passing** (register, login, /me, logout, health)
- Fixed Firebase Admin SDK double initialization
- Configured Cloud SQL Proxy for database access
- All secrets stored in Secret Manager
- Frontend authentication pages complete

### ⚠️ Current Blocker:
- **500 errors on all authentication endpoints**
- Firebase initializes successfully but errors not logging
- Need verbose error logging to diagnose database connection
- All infrastructure correct but integration failing

### ⏳ Next Steps (Debugging Priority):
1. Add comprehensive error logging to route handlers
2. Test database connectivity from Cloud Run
3. Verify Prisma client generation and connection
4. Check error handling middleware behavior
5. Complete authentication debugging and testing

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
