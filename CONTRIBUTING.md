# Contributing to CVstomize

Welcome! This guide will help you get started contributing to CVstomize.

> ⚠️ **IMPORTANT: Dev Container Required**
>
> All development for CVstomize **must** be done inside the Dev Container. This ensures:
> - Identical development environments for all contributors
> - Correct Node.js, npm, and tool versions
> - Pre-configured extensions and editor settings
> - Consistent database and service setup
>
> **Development outside the Dev Container is not supported.** If you encounter issues while not using the Dev Container, please switch to it before reporting bugs.

## Quick Start

### Prerequisites

- [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)
- 8GB+ RAM recommended

### First-Time Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/wyofalcon/cvstomize.git
   cd cvstomize
   ```

2. **Open in VS Code:**

   ```bash
   code .
   ```

3. **Reopen in Container:**

   - Press `F1` → "Dev Containers: Reopen in Container"
   - Wait for the container to build (~3-5 min first time)
   - Dependencies install automatically via `post-create.sh`

4. **Start the app:**
   - Services start automatically, or run: `docker compose up -d`
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Project Structure

```
cvstomize/
├── api/                  # Backend (Node.js + Express + Prisma)
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic (Gemini AI, PDF gen, etc.)
│   ├── middleware/       # Auth, error handling
│   ├── prisma/           # Database schema & migrations
│   └── __tests__/        # Jest tests
├── src/                  # Frontend (React 18 + Material-UI)
│   ├── components/       # React components
│   ├── contexts/         # Auth, state management
│   ├── services/         # API client
│   └── hooks/            # Custom React hooks
├── tests/e2e/            # Playwright E2E tests
├── docs/                 # Documentation
└── .devcontainer/        # Dev container configuration
```

## Development Workflow

### VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")

| Task                    | Description                    |
| ----------------------- | ------------------------------ |
| Start All Services      | Launch Docker containers       |
| Stop All Services       | Stop Docker containers         |
| View Container Logs     | Follow all container logs      |
| Run E2E Tests (UI Mode) | Interactive Playwright testing |
| Run Backend Tests       | Jest API tests                 |
| Prisma Studio           | Database GUI                   |
| Git Sync                | Stage, commit, pull, push      |

### Common Commands

```bash
# Start/stop services
docker compose up -d
docker compose down

# Run tests
npm run test:e2e          # E2E tests (headless)
npm run test:e2e:ui       # E2E tests (interactive)
cd api && npm test        # Backend unit tests

# Database
cd api && npx prisma studio       # Open database GUI
cd api && npx prisma migrate dev  # Apply migrations
cd api && npx prisma generate     # Regenerate client

# View logs
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
```

## Code Style

- **Formatting:** Prettier (auto-formats on save)
- **Linting:** ESLint with React rules
- **Backend:** CommonJS (`require`)
- **Frontend:** ESM (`import`)

## Git Workflow

1. Create a feature branch from `dev`:

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:

   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   ```

3. Push and create a PR:

   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Target `dev` branch for PRs (not `main`)

### Commit Message Format

```
type: short description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance
```

## Environment Variables

**Never commit secrets!** Copy the example and fill in values:

```bash
cp api/.env.example api/.env
```

Required variables are documented in `api/.env.example`.

For production secrets, use GCP Secret Manager:

```bash
./scripts/manage-secrets.sh list
./scripts/manage-secrets.sh get DATABASE_URL
```

## Testing

### Backend Tests (Jest)

```bash
cd api
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test <filename>         # Single file
```

### E2E Tests (Playwright)

```bash
npm run test:e2e           # Headless (fast)
npm run test:e2e:ui        # Interactive UI (best for debugging)
npm run test:e2e:headed    # Browser visible
npm run test:report        # View HTML report
```

## Key Architecture Decisions

1. **Vertex AI (not API keys):** Use `geminiServiceVertex.js`, not the deprecated API-key service
2. **Database sessions:** Don't use in-memory storage (Cloud Run is stateless)
3. **Error handling:** Always pass errors to `next()` for centralized handling
4. **Auth:** Firebase Auth on frontend, Firebase Admin SDK on backend

## Getting Help

- Check `README.md` and `ROADMAP.md` for project context
- Browse `docs/` for detailed guides
- Ask in the team chat

---

Happy coding! 🚀
