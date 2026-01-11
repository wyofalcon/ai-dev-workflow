# 📚 CVstomize v2.0 - Documentation Map

**Last Updated**: 2025-11-03 (Week 2 Complete)

---

## 🎯 Quick Navigation

**I want to...**
- **Get started** → [README.md](README.md)
- **See the full plan** → [ROADMAP.md](ROADMAP.md)
- **Understand current status** → [SESSION_HANDOFF.md](SESSION_HANDOFF.md)
- **Get database/API credentials** → [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)
- **Implement Week 3-4** → [RESUME_OPTIMIZATION_STRATEGY.md](RESUME_OPTIMIZATION_STRATEGY.md)
- **Deploy the backend** → [SESSION_HANDOFF.md](SESSION_HANDOFF.md#quick-commands-reference)
- **Review database schema** → [database/schema.sql](database/schema.sql)
- **Set up testing** → [TESTING_SECURITY_STRATEGY.md](TESTING_SECURITY_STRATEGY.md)
- **Troubleshoot deployment** → [DEPLOY_DEBUG_INSTRUCTIONS.md](DEPLOY_DEBUG_INSTRUCTIONS.md)

---

## 📂 All Documentation Files

### ⭐ Primary Documents (Must Read)

| File | Purpose | Size | Last Updated |
|------|---------|------|--------------|
| [README.md](README.md) | Quick start guide, current status | 6.3K | 2025-11-03 |
| [ROADMAP.md](ROADMAP.md) | Complete 12-month plan, progress tracking | 63K | 2025-11-03 |
| [SESSION_HANDOFF.md](SESSION_HANDOFF.md) | Latest session summary, deployment commands | 11K | 2025-11-03 |
| [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) | All passwords, connection strings, access | 11K | 2025-11-02 |

### 🛠 Implementation Guides

| File | Purpose | Size | Status |
|------|---------|------|--------|
| [RESUME_OPTIMIZATION_STRATEGY.md](RESUME_OPTIMIZATION_STRATEGY.md) | Week 3-4 implementation plan | 12K | ✅ Ready |
| [TESTING_SECURITY_STRATEGY.md](TESTING_SECURITY_STRATEGY.md) | Testing framework, security guidelines | 29K | Reference |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | High-level architecture summary | 14K | Reference |

### 🚀 Deployment References

| File | Purpose | Size | When to Use |
|------|---------|------|-------------|
| [CLOUD_SHELL_DEPLOY.md](CLOUD_SHELL_DEPLOY.md) | Cloud Shell deployment notes | 1.9K | If deploying from GCP Console |
| [DEPLOY_DEBUG_INSTRUCTIONS.md](DEPLOY_DEBUG_INSTRUCTIONS.md) | Troubleshooting deployment issues | 5.6K | When deployment fails |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | General deployment guide | 3.9K | First-time deployment |
| [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) | Original deployment planning | 8.4K | Historical reference |
| [DEPLOY_NOW.md](DEPLOY_NOW.md) | Quick deploy reference | 7.1K | Quick deploy checklist |
| [PRODUCTION_READY.md](PRODUCTION_READY.md) | Production readiness checklist | 2.9K | Pre-launch review |

### 📝 Session Notes

| File | Purpose | Size | Status |
|------|---------|------|--------|
| [SESSION_7_FINAL_SUMMARY.md](SESSION_7_FINAL_SUMMARY.md) | Week 3 backend complete - Vertex AI integrated | 12K | ✅ Current |
| [SESSION_7_WEEK3_PROGRESS.md](SESSION_7_WEEK3_PROGRESS.md) | Week 3 technical implementation details | 13K | ✅ Current |
| [GEMINI_SETUP_GUIDE.md](GEMINI_SETUP_GUIDE.md) | Gemini API options (API key vs Vertex AI) | 6K | ✅ Current |
| [SESSION_HANDOFF.md](SESSION_HANDOFF.md) | Week 2 complete summary | 11K | Historical |
| [SESSION_6_SUMMARY.md](SESSION_6_SUMMARY.md) | Session 6 notes | 7.5K | Historical |

### 📁 Archive (Old Documents)

Located in [archive/](archive/) directory:
- Day 1 getting started notes
- Week 1 checklists
- Old session summaries
- GCP project decision logs

---

## 🗺 Documentation Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  START HERE: README.md (Current Status & Quick Start)   │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬─────────────────┐
        ▼                       ▼                 ▼
┌───────────────┐   ┌───────────────────┐   ┌──────────────┐
│  ROADMAP.md   │   │ SESSION_HANDOFF   │   │ CREDENTIALS  │
│ (Full Plan)   │   │ (Latest Session)  │   │  (Access)    │
└───────┬───────┘   └─────────┬─────────┘   └──────────────┘
        │                     │
        │         ┌───────────┴────────────┬──────────────┐
        │         ▼                        ▼              ▼
        │   ┌──────────────┐   ┌──────────────────┐   ┌────────┐
        │   │ RESUME_OPT   │   │ database/schema  │   │ Deploy │
        │   │ (Week 3-4)   │   │  (DB Structure)  │   │ Guides │
        │   └──────────────┘   └──────────────────┘   └────────┘
        │
        └──► Implementation Details (Week by Week)
```

---

## 🔍 By Topic

### Authentication & Security
- [ROADMAP.md](ROADMAP.md) - Week 2: Authentication & API Restructure (100% complete)
- [SESSION_HANDOFF.md](SESSION_HANDOFF.md) - Google OAuth + Email/Password working
- [TESTING_SECURITY_STRATEGY.md](TESTING_SECURITY_STRATEGY.md) - Security guidelines
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - Firebase config, JWT secrets

### Database
- [database/schema.sql](database/schema.sql) - Complete PostgreSQL schema (12 tables)
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - Connection strings, passwords
- [ROADMAP.md](ROADMAP.md) - Week 1: Database Setup (100% complete)

### AI/ML (Gemini)
- [RESUME_OPTIMIZATION_STRATEGY.md](RESUME_OPTIMIZATION_STRATEGY.md) - Complete strategy
- [api/generate-cv.js](api/generate-cv.js) - Existing Gemini Pro integration
- [ROADMAP.md](ROADMAP.md) - Week 3-4: Conversational AI & Resume Generation

### Deployment
- [SESSION_HANDOFF.md](SESSION_HANDOFF.md#quick-commands-reference) - Quick deploy commands
- [DEPLOY_DEBUG_INSTRUCTIONS.md](DEPLOY_DEBUG_INSTRUCTIONS.md) - Troubleshooting
- [CLOUD_SHELL_DEPLOY.md](CLOUD_SHELL_DEPLOY.md) - Cloud Shell specific

### Testing
- [TESTING_SECURITY_STRATEGY.md](TESTING_SECURITY_STRATEGY.md) - Complete testing framework
- [api/__tests__/](api/__tests__/) - 9/9 tests passing
- [ROADMAP.md](ROADMAP.md) - Week 2: Testing (100% complete)

---

## 📅 When to Reference Each Document

**Daily Development**:
- [SESSION_HANDOFF.md](SESSION_HANDOFF.md) - Current status, what to work on
- [ROADMAP.md](ROADMAP.md) - Check current week tasks
- [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - When you need credentials

**Starting New Week**:
- [ROADMAP.md](ROADMAP.md) - Read upcoming week's goals
- [RESUME_OPTIMIZATION_STRATEGY.md](RESUME_OPTIMIZATION_STRATEGY.md) - For Week 3-4 specifically

**Deployment**:
- [SESSION_HANDOFF.md](SESSION_HANDOFF.md#quick-commands-reference) - Quick commands
- [DEPLOY_DEBUG_INSTRUCTIONS.md](DEPLOY_DEBUG_INSTRUCTIONS.md) - If issues arise

**End of Session**:
- Update [SESSION_HANDOFF.md](SESSION_HANDOFF.md)
- Check off completed tasks in [ROADMAP.md](ROADMAP.md)
- Update [README.md](README.md) current status

**Onboarding New Developer**:
1. [README.md](README.md) - Overview
2. [ROADMAP.md](ROADMAP.md) - Full context
3. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Architecture
4. [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) - Access setup

---

## ✅ Documentation Maintenance Checklist

**End of Each Session**:
- [ ] Update [SESSION_HANDOFF.md](SESSION_HANDOFF.md) with session summary
- [ ] Check off completed tasks in [ROADMAP.md](ROADMAP.md)
- [ ] Update [README.md](README.md) "Current Status" section
- [ ] Add new credentials to [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md) if any

**End of Each Week**:
- [ ] Mark week as complete in [ROADMAP.md](ROADMAP.md)
- [ ] Archive old SESSION_*.md files if needed
- [ ] Update cost estimates in [ROADMAP.md](ROADMAP.md)

**Before Long Break**:
- [ ] Ensure [SESSION_HANDOFF.md](SESSION_HANDOFF.md) has complete context
- [ ] Document any known issues
- [ ] List clear next steps

---

## 🎯 Current Status (Week 3 - 90% Complete)

**What's Done**:
- ✅ Week 1: GCP Infrastructure (70% - database, storage, security)
- ✅ Week 2: Authentication & API (100% - Google OAuth + Email/Password working)
- ✅ Week 3 Backend: Conversational Profile Builder (100% - Vertex AI integrated)

**What's Next**:
- Week 3 Frontend: Build React Chat UI component (20% complete)
- Week 4: Enhanced Resume Generation (personality-based framing)

**Where to Start Next Session**:
👉 Build `src/components/ProfileBuilder/ChatInterface.jsx` - Chat UI component
👉 See [SESSION_7_FINAL_SUMMARY.md](SESSION_7_FINAL_SUMMARY.md) for complete context

---

**Last Updated**: 2025-11-04 (Session 7)
**Current Branch**: dev
**Backend Revision**: cvstomize-api-00035-z2m ✅ LIVE (Vertex AI enabled)
