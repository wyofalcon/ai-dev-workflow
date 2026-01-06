# CVstomize AI Coding Instructions

## ⚠️ Design Philosophy (READ FIRST)

**Simplicity over feature overload.** CVstomize prioritizes a clean, focused UX that reduces decision anxiety.

### Core UX Principles

1. **Fewer choices = less anxiety.** Too many options overwhelm users. Each screen should have ONE clear primary action.
2. **Progressive disclosure.** Show only what's needed now. Advanced options are hidden until relevant.
3. **Guided flows over dashboards.** Users prefer being led through a process rather than dropped into a control panel.
4. **Conversational > Transactional.** Our AI asks questions and guides—it doesn't dump forms.
5. **Mobile-first mindset.** If it doesn't fit on a phone screen cleanly, simplify it.
6. **App-store ready.** Design for eventual iOS/Android deployment via React Native or Capacitor.

### When Adding Features

- **Ask:** "Does this NEED to be visible, or can it be tucked away?"
- **Default:** Hide advanced options behind "More options" or settings
- **Validate:** Each new button/link should have a clear user story
- **Test:** If users pause > 2 seconds deciding, there are too many choices

### Anti-Patterns to Avoid

❌ Multi-column option grids
❌ Settings pages with 20+ toggles
❌ "Power user" features exposed to everyone
❌ Modals with multiple CTAs
❌ Dense text explanations (use visuals or progressive reveal)

### 📱 Mobile App Migration Strategy

CVstomize is designed for **eventual Play Store / App Store deployment**. Keep these patterns:

- **Use touch-friendly targets:** Buttons ≥44px height, adequate spacing
- **Avoid hover-only interactions:** Everything must work with tap
- **No browser-specific APIs:** Avoid `window.print()`, use PDF generation instead
- **Offline-aware:** Design for spotty connectivity (queue actions, show status)
- **Native-feeling navigation:** Bottom tabs, swipe gestures, pull-to-refresh patterns
- **Camera/file access:** Use standard file inputs that Capacitor/React Native can bridge
- **Push notifications ready:** Firebase Cloud Messaging already integrated

**Migration path:** React web → Capacitor (same codebase) or React Native (rewrite components)

---

## Architecture Overview

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Frontend (src) │──────▶│  Backend (api)  │──────▶│   Vertex AI     │
│  React 18 + MUI │       │  Express/Prisma │       │  Gemini 2.5 Pro │
│  Firebase Auth  │       │  Cloud Run      │       │  Cloud SQL      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Frontend:** React 18 (CRA), Material-UI v7, Firebase Auth (`src/`). Deployed to Cloud Run via Nginx.
- **Backend:** Node.js 20, Express 5, Prisma ORM, PostgreSQL 15 (`api/`). Deployed to Cloud Run.
- **AI Services:** Vertex AI (Gemini 2.5 Pro for resume generation, 2.0 Flash for conversations).
- **Infrastructure:** GCP (Cloud Run, Cloud SQL, Secret Manager, Cloud Build). **NO Vercel**.

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

**Key tables:** `users` (auth + limits), `conversations` (session state as JSONB), `resumes` (generated content), `personality_traits` (Big 5 scores).

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

## Testing Commands

### Backend (Jest + Supertest)

```bash
cd api
npm test                          # Run all tests
npm test -- --coverage            # With coverage report
npm test jobDescriptionAnalyzer   # Single file
```

Target: 80%+ coverage. Critical tests: `api/__tests__/integration/resume.test.js`, `api/__tests__/unit/jobDescriptionAnalyzer.test.js`

### E2E (Playwright)

```bash
npm run test:e2e        # Headless
npm run test:e2e:ui     # Interactive UI (best for debugging)
npm run test:report     # View HTML report
```

Test specs in `tests/e2e/`. Test data in `tests/fixtures/test-data.json`.

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

## Common Gotchas

1. **Cloud Run Stateless:** Don't use in-memory `Map()` for session data—it won't survive scaling/restarts. Store in database (`conversations` table).
2. **PDF Generation Memory:** Requires 1Gi memory allocation. Puppeteer uses `/usr/bin/chromium-browser`.
3. **CORS Origins:** Whitelist in `api/index.js` (`allowedOrigins` array). Add new environments there.
4. **Module Systems:** Backend is CommonJS (`require`), Frontend is ESM (`import`). Check `"type"` in each `package.json`.
