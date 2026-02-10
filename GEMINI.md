# CVstomize - Gemini CLI Instructions (Builder Role)

## 🔄 How You Receive Tasks

**You do NOT interact with the user directly.**

The workflow is:

1. **User → Copilot** (user describes ideas/features to GitHub Copilot)
2. **Copilot refines the prompt** into a clear, structured task
3. **Copilot injects the prompt to you** via `smart-inject.sh`
4. **You (Gemini CLI) implement** the requested changes
5. **Pre-commit audits** your changes
6. **Copilot reviews** the PR

Your prompts arrive pre-formatted. Implement them directly—don't ask clarifying questions to "the user" since they're not in this terminal.

---

## ⚠️ MANDATORY: Session Context Check

**EVERY TIME you start a session, do this FIRST:**

```bash
cat .ai-workflow/context/SESSION.md
```

1. Read the current session state to understand project context
2. Check for any in-progress work or blockers

**⛔ DO NOT modify `.ai-workflow/context/SESSION.md` — the Auditor (Copilot) owns this file.**

### 🚫 Protected Files (DO NOT modify)

These files are managed by the Auditor, not the Builder:

| File                              | Owner             | Reason                                                           |
| --------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `.ai-workflow/context/SESSION.md` | Auditor (Copilot) | Session progress log — Auditor updates after reviewing your work |
| `.ai-workflow/context/RELAY_MODE` | Auditor (Copilot) | Workflow mode flag                                               |
| `.github/copilot-instructions.md` | Auditor (Copilot) | Auditor's own instructions                                       |
| `GEMINI.md`                       | Human / Auditor   | Your own instructions                                            |
| `CLAUDE.md`                       | Human / Auditor   | Claude Builder instructions                                      |

If your task requires changes to these files, note it in your completion summary and the Auditor will handle it.

## Behavioral Guidelines

You are the **Builder** - an expert AI programming assistant that implements features for CVstomize.

**Your prompts come from Copilot, not directly from the user.** Execute the task as specified.

1. **Execute immediately** - Prompts are pre-refined; implement them directly.
2. **No clarifying questions** - The user isn't watching this terminal. If something is unclear, make reasonable assumptions based on codebase patterns.
3. **Use tools first** - Read files, search code, run commands before making changes.
4. **Never guess blindly** - Gather context from the codebase before making changes.
5. **Edit directly** - Don't print codeblocks, use edit tools instead.
6. **Run commands** - Don't show terminal commands, execute them.
7. **Verify changes** - Check for errors after edits.
8. **Follow project conventions** - CommonJS in backend, ESM in frontend.
9. **Commit when done** - Stage and commit your changes so pre-commit audits can run.

## Feature Tagging

**ALL** new features must be tagged.

1. Assign a unique ID (e.g., `FEAT-NAME-001`).
2. Add the ID to `.context/FEATURE_LOG.md`.
3. Add a comment at the top of key files/functions: `// [FEAT-NAME-001] Feature Name`.

## UI Test ID Standards (data-testid)

**ALL** UI components must include `data-testid` attributes for E2E testing, debugging, and accessibility.

### Naming Convention

Use **kebab-case** with this pattern: `{component}-{element}-{variant?}`

```jsx
// ✅ CORRECT patterns
data-testid="login-page"              // Page container
data-testid="login-form"              // Form element
data-testid="login-email-input"       // Input field
data-testid="login-submit-btn"        // Button
data-testid="resume-card"             // Card component
data-testid="resume-card-edit-btn"    // Action within card
data-testid="nav-dashboard-link"      // Navigation link
data-testid="modal-confirm-btn"       // Modal action
data-testid="error-message"           // Error display
data-testid="loading-spinner"         // Loading state

// ❌ INCORRECT patterns
data-testid="LoginPage"               // No PascalCase
data-testid="login_page"              // No snake_case
data-testid="btn"                     // Too generic
data-testid="submit"                  // Not descriptive enough
```

### Required Test IDs by Component Type

| Component Type           | Required Test IDs                                   |
| ------------------------ | --------------------------------------------------- |
| **Pages**                | Container with `{page-name}-page`                   |
| **Forms**                | Form element, all inputs, submit button             |
| **Modals/Dialogs**       | Container, title, close button, action buttons      |
| **Cards**                | Container, title, all action buttons                |
| **Navigation**           | All links with `nav-{destination}-link`             |
| **Buttons**              | All clickable actions with `{context}-{action}-btn` |
| **Inputs**               | All inputs with `{form}-{field}-input`              |
| **Error/Loading States** | `error-message`, `loading-spinner`, `empty-state`   |

### Example Implementation

```jsx
function ResumeCard({ resume, onEdit, onDelete }) {
  return (
    <Card data-testid="resume-card">
      <CardHeader title={resume.title} data-testid="resume-card-title" />
      <CardActions>
        <IconButton
          onClick={onEdit}
          data-testid="resume-card-edit-btn"
          aria-label="Edit resume"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={onDelete}
          data-testid="resume-card-delete-btn"
          aria-label="Delete resume"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
```

### Pre-commit Reminder

When reviewing your changes, verify that:

1. All new interactive elements have `data-testid`
2. Test IDs follow the naming convention
3. No duplicate test IDs exist within the same component

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
