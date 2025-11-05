# CVstomize v2.0: AI-Powered Resume Builder

**Viral Growth → Massive Scale → Strategic Monetization**

![Tests](https://img.shields.io/badge/tests-255%2F258%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-61.68%25%20backend-green)
![Status](https://img.shields.io/badge/status-active%20development-orange)

---

## 🚀 Quick Start

**👉 START HERE:** [ROADMAP.md](ROADMAP.md) - Single source of truth
- Current status (Session 13: 61.68% backend coverage)
- Next tasks (authMiddleware.js + errorHandler.js tests)
- Complete roadmap
- Quick commands

**Credentials:** [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)
**Testing:** [api/TESTING_GUIDE.md](api/TESTING_GUIDE.md)

---

## 📊 Current Status (Session 13)

**Coverage:** 61.68% → **Target:** 70%
**Tests:** 255/258 passing (98.8%)

### ✅ Session 13: +17.25% Coverage
- conversation.js: 14% → 95.87% (26 tests)
- personalityInference.js: 10% → 100% (54 tests)
- questionFramework.js: 21% → 100% (51 tests)

### 🎯 Next Session (3-5 hours)
1. authMiddleware.js: 27% → 70%
2. errorHandler.js: 15% → 70%
**Result:** 66-68% total coverage

---

## 💡 What CVstomize Does

1. **Conversational Profile Builder** ✅ DONE
   - AI extracts experience
   - Infers personality traits
   - Builds complete profile

2. **Tailored Resumes** ⏳ NEXT
   - Personality-based framing
   - ATS optimization
   - PDF generation

3. **Viral Growth** (Future)
   - Social sharing
   - Referral rewards

---

## 🛠 Stack

**Frontend:** React 18 + Material-UI + Firebase
**Backend:** Node.js 20 + Express + Prisma + PostgreSQL
**Infrastructure:** Cloud Run + Cloud SQL
**AI:** Gemini 1.5 Flash/Pro
**Testing:** Jest (258 tests, 61.68% coverage)

---

## 📂 Structure

```
Cvstomize/
├── ROADMAP.md              # ⭐ Single source of truth
├── CREDENTIALS_REFERENCE.md # Secrets
├── api/__tests__/          # 258 tests
├── api/routes/             # Endpoints
├── api/services/           # Logic
└── src/                    # React frontend
```

---

## 🚀 Commands

```bash
cd /mnt/storage/shared_windows/Cvstomize
npm test                    # All tests
npm test -- --coverage      # With coverage
npm test -- auth.test.js    # Specific file
```

---

## 🔗 Links

- [GCP Dashboard](https://console.cloud.google.com/home/dashboard?project=cvstomize)
- [Cloud SQL](https://console.cloud.google.com/sql/instances/cvstomize-db?project=cvstomize)
- [Cloud Run](https://console.cloud.google.com/run?project=cvstomize)

---

## 👥 Team

- ashley.caban.c@gmail.com (Owner)
- wyofalcon@gmail.com (Co-owner)

---

**See [ROADMAP.md](ROADMAP.md) for complete details**

*Updated: 2025-11-05 | Next: authMiddleware + errorHandler tests*
