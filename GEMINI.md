# CVstomize - Gemini CLI Instructions

## ⚠️ MANDATORY: Session Context Check

**EVERY TIME you start a session, do this FIRST:**

```bash
cat .context/SESSION.md
```

1. Read the current session state
2. Summarize what's in progress to the user
3. Ask: "Ready to continue with [Next Steps], or do you have something else in mind?"

**Update `.context/SESSION.md` after completing tasks and before ending your session.**

---

## 🚀 First Time Setup

**If the user is new to this dev container, point them to the onboarding wizard:**

```bash
bash .devcontainer/onboarding.sh
```

This sets up their AI CLI (Gemini or Claude) and GitHub authentication.

## Behavioral Guidelines

You are an expert AI programming assistant working on CVstomize. Follow these rules:

1. **Be concise** - Short, direct answers. No unnecessary explanations.
2. **Use tools first** - Read files, search code, run commands before answering.
3. **Never guess** - Gather context before making changes.
4. **Edit directly** - Don't print codeblocks, use edit tools instead.
5. **Run commands** - Don't show terminal commands, execute them.
6. **One thing at a time** - Mark todos in-progress before starting, complete before moving on.
7. **Verify changes** - Check for errors after edits.
8. **Follow project conventions** - CommonJS in backend, ESM in frontend.

## Project Overview

CVstomize is a personality-aware resume builder that uses AI to generate tailored resumes based on job descriptions and user personality traits (Big 5 model).

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Frontend (src) │──────▶│  Backend (api)  │──────▶│   Vertex AI     │
│  React 18 + MUI │       │  Express/Prisma │       │  Gemini 2.5 Pro │
│  Firebase Auth  │       │  Cloud Run      │       │  Cloud SQL      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Frontend:** React 18 (CRA), Material-UI v7, Firebase Auth (`src/`)
- **Backend:** Node.js 20, Express 5, Prisma ORM, PostgreSQL 15 (`api/`)
- **AI Services:** Vertex AI (Gemini 2.5 Pro for resume generation, 2.0 Flash for conversations)
- **Infrastructure:** GCP (Cloud Run, Cloud SQL, Secret Manager, Cloud Build)

## Critical Rules

### AI Service Usage

```javascript
// ✅ ALWAYS use Vertex AI service (GCP-native, service account auth)
const geminiService = require("./services/geminiServiceVertex");
const model = geminiService.getProModel(); // Gemini 2.5 Pro for complex tasks

// ❌ NEVER use deprecated API-key service
// const geminiService = require('./services/geminiService'); // DEPRECATED
```

### Secrets Management

**NEVER hardcode secrets.** All credentials live in GCP Secret Manager.

```bash
./scripts/manage-secrets.sh list              # List all secrets
./scripts/manage-secrets.sh get DATABASE_URL  # Get specific secret
./scripts/manage-secrets.sh export .env.local # Export all to local env
```

### Database Changes

Schema source of truth: `api/prisma/schema.prisma`

```bash
cd api
npx prisma migrate dev --name descriptive_name  # Local development
npx prisma generate                              # Regenerate client after schema changes
```

### Error Handling Pattern

All routes must pass errors to Express error handler:

```javascript
router.post("/endpoint", verifyFirebaseToken, async (req, res, next) => {
  try {
    // ... business logic
  } catch (error) {
    next(error); // Let errorHandler.js handle it
  }
});
```

## Core Data Flows

### Resume Generation Pipeline

```
1. POST /api/conversation/start (jobDescription, existingResume?)
   └─▶ jobDescriptionAnalyzer.js → Gap analysis + 2-5 targeted questions

2. POST /api/conversation/message (sessionId, answer)
   └─▶ Store answers in conversations.messages (JSONB)

3. POST /api/conversation/complete (sessionId)
   └─▶ personalityInferenceGemini.js → Big 5 traits from conversation

4. POST /api/resume/generate (sessionId, jobDescription, selectedSections)
   └─▶ geminiServiceVertex.js → Personality-aware resume generation
   └─▶ pdfGenerator.js → Puppeteer renders 3 templates (Classic/Modern/Minimal)
```

### Authentication Flow

```
Frontend: Firebase Auth (src/contexts/AuthContext.js)
   │
   ▼  getIdToken() → Authorization: Bearer <token>
   │
Backend: verifyFirebaseToken (api/middleware/authMiddleware.js)
   │
   ▼  Firebase Admin SDK verifies token
   │
req.user = { firebaseUid, email, displayName, photoUrl }
```

## Key Files Reference

| Purpose                    | File                                         |
| -------------------------- | -------------------------------------------- |
| Express app entry          | `api/index.js`                               |
| Resume generation endpoint | `api/routes/resume.js`                       |
| Conversation flow          | `api/routes/conversation.js`                 |
| Vertex AI wrapper          | `api/services/geminiServiceVertex.js`        |
| JD analysis + questions    | `api/services/jobDescriptionAnalyzer.js`     |
| Big 5 inference            | `api/services/personalityInferenceGemini.js` |
| PDF rendering              | `api/services/pdfGenerator.js`               |
| Auth context               | `src/contexts/AuthContext.js`                |
| Main resume UI             | `src/components/ConversationalResumePage.js` |
| Database schema            | `api/prisma/schema.prisma`                   |

## Testing Commands

### Backend (Jest + Supertest)

```bash
cd api
npm test                          # Run all tests
npm test -- --coverage            # With coverage report
npm test jobDescriptionAnalyzer   # Single file
```

### E2E (Playwright)

```bash
npm run test:e2e        # Headless
npm run test:e2e:ui     # Interactive UI (best for debugging)
npm run test:report     # View HTML report
```

## Deployment

### Quick Deploy (CI/CD)

```bash
git push origin dev      # Auto-deploy to dev environment
git push origin staging  # Auto-deploy to staging
git push origin main     # Auto-deploy to production
```

### Manual Deploy

```bash
cd api && ./deploy-to-cloud-run.sh  # Backend
# Frontend deploys via Cloud Build triggers
```

## Common Gotchas

1. **Cloud Run Stateless:** Don't use in-memory `Map()` for session data—it won't survive scaling/restarts. Store in database (`conversations` table).
2. **PDF Generation Memory:** Requires 1Gi memory allocation. Puppeteer uses `/usr/bin/chromium-browser`.
3. **CORS Origins:** Whitelist in `api/index.js` (`allowedOrigins` array). Add new environments there.
4. **Module Systems:** Backend is CommonJS (`require`), Frontend is ESM (`import`). Check `"type"` in each `package.json`.
5. **NO Vercel** - This project uses GCP Cloud Run exclusively.

## Directory Structure

- `src/` - React frontend (CRA)
- `api/` - Express backend with Prisma ORM
- `api/services/` - Business logic including AI services
- `api/routes/` - API endpoints
- `api/prisma/` - Database schema and migrations
- `tests/e2e/` - Playwright E2E tests
- `scripts/` - Utility scripts (deployment, secrets, testing)
