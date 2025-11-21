# CVstomize AI Coding Instructions

## Architecture & Stack
- **Frontend:** React 18 (CRA), Material-UI, Firebase Auth (`src/`). Hosted on Cloud Run via Nginx.
- **Backend:** Node.js 20, Express, Prisma ORM, PostgreSQL (`api/`). Hosted on Cloud Run.
- **Infrastructure:** Google Cloud Platform (Cloud Run, Cloud SQL, Secret Manager, Cloud Build).
- **AI:** Vertex AI (Gemini 2.5 Pro/2.0 Flash). **ALWAYS** use `api/services/geminiServiceVertex.js`, NOT the deprecated `geminiService.js`.

## Critical Workflows
- **Secrets Management:** NEVER hardcode secrets. Use `scripts/manage-secrets.sh` to fetch/set secrets from GCP Secret Manager.
  - Example: `./scripts/manage-secrets.sh get DATABASE_URL`
- **Deployment:** Use scripts in `scripts/deployment/` (e.g., `deploy-dev.sh`). Do NOT use Vercel.
- **Database:** 
  - Schema source of truth: `api/prisma/schema.prisma`.
  - Apply changes: `npx prisma migrate dev` (local) or via migration scripts (prod).
  - **Note:** `conversations` table stores session state; `resumes` table stores generated content.

## Code Patterns & Conventions
- **Authentication:** 
  - Frontend: `AuthContext.js` manages Firebase Auth and exchanges ID token for backend access.
  - Backend: `authMiddleware.js` verifies Firebase tokens.
- **Resume Generation Flow:**
  1. **Gap Analysis:** `jobDescriptionAnalyzer.js` compares JD vs. existing resume.
  2. **Personality:** `personalityInferenceGemini.js` infers Big 5 traits from chat.
  3. **Generation:** `resume.js` uses `geminiServiceVertex.js` with personality-aware prompts.
  4. **PDF:** `pdfGenerator.js` uses Puppeteer (headless Chromium) to render templates.
- **Error Handling:** Use `api/middleware/errorHandler.js`. All routes should pass errors to `next(err)`.

## Testing
- **Backend Unit/Integration:** `cd api && npm test`. Uses Jest + Supertest.
  - Key tests: `api/__tests__/integration/resume.test.js`.
- **E2E:** `npm run test:e2e`. Uses Playwright.
