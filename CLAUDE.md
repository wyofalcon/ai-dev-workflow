# CVstomize - Claude CLI Instructions

## 🚀 First Time Setup

**If this is your first time in this dev container, run the onboarding wizard:**

```bash
bash .devcontainer/onboarding.sh
```

This will walk you through:

1. Setting up Claude CLI authentication
2. Configuring GitHub CLI (for Auditor workflow)
3. Setting your git identity

## Workflow Overview

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Builder        │──────▶│  Pre-commit     │──────▶│  PR Review      │
│  Claude CLI     │       │  Pattern checks │       │  GitHub Copilot │
│  (You write)    │       │  (Auto-runs)    │       │  (Full review)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Builder (Claude CLI):** You generate code and features
- **Auditor (GitHub Copilot):** Reviews code on commit and PR

## Session Modes

Run `gss` (or `source scripts/gemini-session-select.sh`) to choose:

1. **Builder + Auditor** - Pre-commit checks enabled, PR gets Copilot review
2. **Rapid Prototyping** - Skip pre-commit (faster), PR still gets reviewed
3. **Maintenance** - No automation

## Behavioral Guidelines

1. **Be concise** - Short, direct answers. No unnecessary explanations.
2. **Use tools first** - Read files, search code, run commands before answering.
3. **Never guess** - Gather context before making changes.
4. **Edit directly** - Don't print codeblocks, use edit tools instead.
5. **Run commands** - Don't show terminal commands, execute them.
6. **Verify changes** - Check for errors after edits.
7. **Follow project conventions** - CommonJS in backend, ESM in frontend.

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
- **AI Services:** Vertex AI (Gemini 2.5 Pro for resume generation)
- **Infrastructure:** GCP (Cloud Run, Cloud SQL, Secret Manager)

## Critical Rules

### Security First

- **NEVER hardcode secrets** - Use environment variables or GCP Secret Manager
- **No console.log in production code** - Pre-commit will warn
- **No API keys in code** - Pre-commit will block

### AI Service Usage

```javascript
// ✅ ALWAYS use Vertex AI service
const geminiService = require("./services/geminiServiceVertex");
const model = geminiService.getProModel();

// ❌ NEVER use deprecated API-key service
```

### Testing

- All new features must have tests
- Run `npm run test:e2e` for E2E tests
- Run `cd api && npm test` for backend tests

## Key Commands

```bash
# Development
docker compose up -d          # Start all services
docker compose down           # Stop services
npm start                     # Frontend dev server (if not using Docker)

# Testing
npm run test:e2e              # E2E tests (Playwright)
npm run test:e2e:ui           # E2E tests with UI
cd api && npm test            # Backend tests

# Workflow
gss                           # Select session mode
gh pr create                  # Create pull request
```

## File Structure

```
/workspaces/cvstomize/
├── src/                      # Frontend (React)
│   ├── components/           # UI components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   └── services/             # API clients
├── api/                      # Backend (Express)
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── prisma/               # Database schema
│   └── __tests__/            # Tests
├── tests/e2e/                # Playwright tests
└── scripts/                  # Dev scripts
```

## Getting Help

- **README.md** - Project overview
- **CONTRIBUTING.md** - Contribution guidelines
- **ROADMAP.md** - Current priorities
- **docs/** - Additional documentation
