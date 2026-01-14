# CVstomize Project Structure

This document describes the organized structure of the CVstomize project after reorganization.

## Directory Layout

```
cvstomize/
├── api/                              # Backend API service
│   ├── __tests__/                    # Backend test suites
│   ├── config/                       # Configuration files
│   ├── middleware/                   # Express middleware
│   ├── prisma/                       # Database schema and migrations
│   ├── routes/                       # API route handlers
│   ├── services/                     # Business logic services
│   ├── utils/                        # Utility functions
│   ├── index.js                      # API entry point
│   └── package.json                  # Backend dependencies
│
├── ci/                               # Continuous Integration configs
│   ├── cloudbuild.yaml               # Main Cloud Build config
│   ├── cloudbuild.frontend.yaml      # Frontend production build
│   ├── cloudbuild.frontend.preview.yaml  # Frontend preview builds
│   └── cloudbuild.frontend-staging.yaml  # Frontend staging build
│
├── data/                             # Runtime data and generated files
│   ├── generated_resumes/            # Generated resume files (gitignored)
│   └── logs/                         # Application logs (gitignored)
│
├── database/                         # Database related files
│   └── migrations/                   # SQL migration scripts
│       ├── add_messages_column.sql
│       ├── MIGRATION_add_conversation_status.sql
│       └── FRESH_DATABASE_SCHEMA.sql
│
├── docker/                           # Docker configuration
│   ├── Dockerfile                    # Production Dockerfile
│   ├── Dockerfile.dev                # Development Dockerfile
│   ├── Dockerfile.frontend           # Frontend Dockerfile
│   ├── docker-compose.yml            # Production compose
│   ├── docker-compose.dev.yml        # Development compose
│   └── nginx.conf                    # Nginx configuration
│
├── docs/                             # Project documentation
│   ├── archive/                      # Archived documentation
│   ├── deployment/                   # Deployment guides
│   ├── sessions/                     # Development session notes
│   │   ├── SESSION_28_COMPLETE.md
│   │   └── SESSION_28_HANDOFF.md
│   ├── setup/                        # Setup instructions
│   ├── testing/                      # Testing documentation
│   └── VISUAL_NOTES_GUIDE.md         # Chrome DevTools MCP guide
│
├── public/                           # Static frontend assets
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
│
├── scripts/                          # Utility scripts
│   ├── deployment/                   # Deployment scripts
│   │   ├── deploy-api-staging.sh
│   │   ├── deploy-commands.sh
│   │   ├── deploy-frontend-staging.sh
│   │   ├── deploy-frontend.sh
│   │   ├── deploy-windows.bat
│   │   ├── setup-secrets.sh
│   │   ├── setup-staging-environment.sh
│   │   └── start-dev.sh
│   ├── clean-git-history.sh
│   ├── git-sync.sh                   # Git workflow automation
│   ├── manage-secrets.sh
│   ├── seed-staging-direct.sh
│   └── seed-staging.sh
│
├── src/                              # Frontend React application
│   ├── components/                   # React components
│   ├── styles/                       # CSS and styling
│   ├── App.js                        # Main React component
│   └── index.js                      # React entry point
│
├── tests/                            # Automated test suites
│   ├── e2e/                          # End-to-end tests
│   │   ├── helpers.ts                # Test helper functions (Page Object Model)
│   │   ├── 01-authentication.spec.ts
│   │   ├── 02-resume-generation.spec.ts
│   │   └── 06-downloads.spec.ts
│   ├── fixtures/                     # Test data and fixtures
│   │   └── test-data.json
│   ├── reports/                      # Test execution reports (gitignored)
│   └── README.md                     # Testing documentation
│
├── .gitignore                        # Git ignore rules
├── .vscode/                          # VS Code configuration
│   └── tasks.json                    # VS Code task definitions
├── package.json                      # Frontend dependencies
├── playwright.config.js              # Playwright test configuration
├── run-tests.sh                      # Test execution script
├── vercel.json                       # Vercel deployment config
├── COMPLETE_UI_TESTING_GUIDE.md      # Comprehensive manual testing guide
├── TESTING_QUICKSTART.md             # Quick start for running tests
├── README.md                         # Project overview
├── ROADMAP.md                        # Project roadmap
├── MONETIZATION_STRATEGY.md          # Business strategy
├── CREDENTIALS_SECURE.md             # Security documentation
└── GEMINI.md                         # Gemini AI integration notes
```

## Key Directories

### `/api`
Backend Node.js/Express API service with Prisma ORM for PostgreSQL database access. Contains all server-side logic, authentication, resume generation, and API routes.

### `/ci`
Cloud Build configuration files for CI/CD pipelines. Separate configs for production, staging, and preview deployments.

### `/data`
Runtime data directory for generated files and logs. **Not committed to git** (gitignored).
- `generated_resumes/` - Temporary storage for generated resume files
- `logs/` - Application log files (error.log, combined.log)

### `/database/migrations`
SQL migration scripts for database schema changes. Applied manually or through migration tools.

### `/docker`
Docker-related configuration files for containerized deployments. Includes Dockerfiles for different environments and docker-compose orchestration.

### `/docs`
Project documentation organized by category:
- `archive/` - Historical documentation
- `deployment/` - Deployment procedures
- `sessions/` - Development session notes
- `setup/` - Initial setup guides
- `testing/` - Testing procedures

### `/scripts`
Utility scripts for various operations:
- `deployment/` - Deployment automation scripts for GCP Cloud Run
- Root level scripts for database seeding, git operations, secret management

### `/src`
Frontend React application source code. Contains components, styles, and application logic.

### `/tests`
Automated testing infrastructure:
- `e2e/` - Playwright end-to-end test suites
- `fixtures/` - Test data and mock objects
- `reports/` - Test execution reports (gitignored)

## File Path Updates

After reorganization, the following path references were updated:

### Deployment Scripts
- `scripts/deployment/deploy-frontend-staging.sh` - Updated cloudbuild path to `../../ci/cloudbuild.frontend-staging.yaml`

### Logger Configuration
- `api/utils/logger.js` - Updated log file paths to `../../data/logs/error.log` and `../../data/logs/combined.log`

### Git Ignore
- `.gitignore` - Updated to ignore `/data/logs/` and `/data/generated_resumes/` instead of root-level `/logs` and `generated_resumes/`

## Production Deployment

The project is deployed on Google Cloud Platform:
- **Frontend**: Cloud Run service at `https://cvstomize-frontend-351889420459.us-central1.run.app`
- **Backend**: Cloud Run service at `https://cvstomize-api-351889420459.us-central1.run.app`
- **Database**: Cloud SQL PostgreSQL instance `cvstomize:us-central1:cvstomize-db`

## Development Environment

Local development uses Docker Compose with the following services:
- Frontend (React dev server on port 3000)
- Backend API (Express on port 3001)
- PostgreSQL database (port 5432)

Start development environment: `./scripts/deployment/start-dev.sh`

## Testing

Run automated tests:
```bash
# Interactive UI mode (recommended for monitoring)
npm run test:e2e:ui

# Headless mode (for CI)
npm run test:e2e

# Headed mode (visible browser)
npm run test:e2e:headed

# Show test report
npm run test:report
```

See `TESTING_QUICKSTART.md` for detailed testing instructions.

## Notes

- All deployment scripts are now in `scripts/deployment/`
- All CI/CD configs are in `ci/`
- All database migrations are in `database/migrations/`
- All session documentation is in `docs/sessions/`
- Runtime data (logs, generated resumes) is in `data/` and gitignored
- Docker configs consolidated in `docker/`
- Test artifacts are in `tests/` with reports gitignored

This organization improves maintainability while preserving all functionality.
