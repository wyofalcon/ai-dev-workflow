# CVstomize - Complete Project Reference

**Generated:** 2025-11-20  
**Purpose:** Single-file project documentation for AI agent reference  
**Branch:** dev  
**Status:** Production Operational (Session 28)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Current Status](#current-status)
4. [Critical Workflows](#critical-workflows)
5. [Database Schema](#database-schema)
6. [Key Source Files](#key-source-files)
7. [API Endpoints](#api-endpoints)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Known Issues](#known-issues)
11. [Next Steps](#next-steps)

---

## Project Overview

CVstomize is an AI-powered resume builder that creates personalized, ATS-optimized resumes through conversational AI. It uses personality inference (Big Five model) and job description analysis to generate tailored resumes.

### Key Features

- **Resume-First Gap Analysis**: Upload existing resume + JD → AI identifies gaps → 2-5 targeted questions (not generic 16)
- **AI Personality Inference**: Gemini analyzes conversation to infer Big Five personality traits
- **Personality-Driven Content**: Resume framing adapts to user's communication style, work preferences
- **ATS Optimization**: 80%+ keyword coverage with job-specific terminology
- **Multiple Templates**: 3 PDF templates (Classic, Modern, Minimal) + Markdown export
- **Outcome Tracking**: Interview/offer data collection for data moat strategy

### Live URLs

- **Production Frontend**: https://cvstomize-frontend-351889420459.us-central1.run.app
- **Production API**: https://cvstomize-api-351889420459.us-central1.run.app
- **Staging Frontend**: https://cvstomize-frontend-staging-1036528578375.us-central1.run.app
- **Staging API**: https://cvstomize-api-staging-1036528578375.us-central1.run.app

---

## Architecture & Tech Stack

### Frontend

- **Framework**: React 18 (Create React App)
- **UI Library**: Material-UI (MUI) v7
- **Auth**: Firebase Auth (Email/Password + Google SSO)
- **Routing**: React Router v6
- **HTTP**: Axios
- **Hosting**: GCP Cloud Run (via Nginx)
- **Build**: Multi-stage Docker (node:20 → nginx:alpine)

### Backend

- **Runtime**: Node.js 20
- **Framework**: Express 5
- **ORM**: Prisma (PostgreSQL)
- **Database**: Cloud SQL (PostgreSQL 15)
- **AI**: Vertex AI (Gemini 2.5 Pro, 2.0 Flash)
- **Auth**: Firebase Admin SDK
- **PDF**: Puppeteer (headless Chromium)
- **Storage**: Cloud Storage (PDF archives)
- **Hosting**: GCP Cloud Run
- **Secrets**: Secret Manager

### Infrastructure

- **Platform**: Google Cloud Platform (GCP)
- **Projects**: 
  - Production: `cvstomize`
  - Staging: `cvstomize-staging`
- **CI/CD**: Cloud Build (automated deployments)
- **Monitoring**: Cloud Logging, Cloud Monitoring
- **Security**: IAM, Secret Manager, Audit Logs

---

## Current Status

**Session 28 (Nov 10, 2025)** - Critical bug fixes deployed

### Production Revisions

- **Frontend**: cvstomize-frontend-00015-8qt (100% traffic)
- **API**: cvstomize-api-00124-xp6 (100% traffic)

### What's Working

✅ Resume upload & text extraction (PDF/DOCX/TXT, 25MB limit)  
✅ Job description analysis with gap-based questions  
✅ AI conversation flow (2-5 targeted questions OR 16 comprehensive)  
✅ Personality inference (Gemini-powered Big 5)  
✅ Resume generation (personality-driven, ATS-optimized)  
✅ Download functionality (Markdown + 3 PDF templates)  
✅ Google SSO authentication  
✅ Resume library & history  

### Recent Fixes

- ✅ UI copy consistency (removed "11 questions" hardcoded text)
- ✅ Gemini prompt leakage (regex cleaning prevents "Of course..." preamble)
- ✅ Placeholder content (no more `[Your Company]`, `[City, State]` brackets)
- ✅ Profile completion modal (Option B: just-in-time data collection)
- ✅ Google avatar display (CORS/CORP headers fixed)
- ✅ Resume preview (shows actual content)
- ✅ PDF generation (all 3 templates working)

### Known Issues

⚠️ **Contact Info Bug**: Email works, but name shows "Alex Johnson" placeholder instead of user's Google display name  
  - Debug logging active in production  
  - Root cause investigation in progress

---

## Critical Workflows

### 1. Secrets Management

**NEVER hardcode secrets.** All credentials stored in GCP Secret Manager.

```bash
# Fetch secrets
./scripts/manage-secrets.sh get DATABASE_URL
./scripts/manage-secrets.sh get FIREBASE_SERVICE_ACCOUNT_KEY

# Export all secrets to .env.local
./scripts/manage-secrets.sh export .env.local

# List all secrets
./scripts/manage-secrets.sh list
```

### 2. Deployment

**DO NOT use Vercel.** Deploy via scripts or Cloud Build.

```bash
# Backend deployment
cd api
./deploy-to-cloud-run.sh

# Frontend deployment (via Cloud Build)
git push origin dev      # Auto-deploy to dev
git push origin staging  # Auto-deploy to staging
git push origin main     # Auto-deploy to production
```

### 3. Database Migrations

**Source of truth**: `api/prisma/schema.prisma`

```bash
# Local development
cd api
npx prisma migrate dev --name descriptive_name

# Production (via migration script)
node run-migrations.js
```

### 4. Resume Generation Flow

```
1. Upload Resume (Optional)
   ↓
2. Job Description Analysis
   ↓ (Gap Analysis if resume provided)
3. Targeted Questions (2-5 if resume, 16 if not)
   ↓
4. Personality Inference (Big 5 traits)
   ↓
5. Resume Generation (Personality-aware prompts)
   ↓
6. PDF Rendering (Puppeteer + Chromium)
```

**Key Files**:
- `jobDescriptionAnalyzer.js` - Compares JD vs resume, generates questions
- `personalityInferenceGemini.js` - Infers Big 5 from conversation
- `geminiServiceVertex.js` - Vertex AI integration (NOT deprecated geminiService.js)
- `resume.js` - Resume generation endpoint
- `pdfGenerator.js` - PDF rendering with templates

---

## Database Schema

**PostgreSQL 15 on Cloud SQL**

### Key Tables

**users**
- Firebase Auth integration (firebaseUid)
- Resume limit tracking (resumesGenerated, resumesLimit)
- Subscription tier management

**user_profiles**
- Contact information (fullName, phone, location, linkedinUrl)
- Career data (yearsExperience, targetRoles, skills)
- One-to-one with users

**personality_traits**
- Big Five scores (openness, conscientiousness, extraversion, agreeableness, neuroticism)
- Derived traits (workStyle, leadershipStyle, communicationStyle)
- Inference metadata (confidence, analysisVersion)

**conversations**
- Session storage (sessionId, messages as JSONB array)
- Resume-first data (existingResume, gapAnalysis, jobDescription)
- **CRITICAL**: Store in DB, not volatile Map (Cloud Run scales/restarts)

**resumes**
- Generated content (resumeMarkdown, resumeHtml)
- PDF storage (pdfUrl, pdfBucket, pdfPath)
- Outcome tracking (interviewReceived, jobOfferReceived, salaryOffered)
- Engagement metrics (viewedCount, sharedCount, lastViewedAt)

**Full Schema**: See `api/prisma/schema.prisma` (650 lines)

---

## Key Source Files

### Backend Core

**api/index.js** (200 lines)
- Express app initialization
- CORS configuration (production + staging + dev)
- Health check endpoints
- Route mounting
- Firebase Admin initialization
- Graceful shutdown handlers

**api/routes/resume.js** (1,400 lines)
- POST /api/resume/generate - Main resume generation
- POST /api/resume/analyze-jd - Job description analysis
- POST /api/resume/extract-text - File upload & text extraction
- GET /api/resume/list - User's resume library
- GET /api/resume/:id - Single resume details
- GET /api/resume/:id/pdf - PDF download (3 templates)
- POST /api/resume/:id/report-outcome - Outcome tracking

**api/routes/conversation.js** (700 lines)
- POST /api/conversation/start - Start session (JD analysis + questions)
- POST /api/conversation/message - Process answers, get next question
- POST /api/conversation/complete - Finalize & run personality inference
- GET /api/conversation/history/:sessionId - Conversation history

**api/services/geminiServiceVertex.js** (200 lines)
- Vertex AI integration (Gemini 2.5 Pro, 2.0 Flash)
- Personality-aware resume prompt builder
- **DO NOT use geminiService.js** (deprecated, uses API keys)

**api/services/jobDescriptionAnalyzer.js** (600 lines)
- AI-powered JD analysis
- Gap analysis (if existing resume provided)
- Custom question generation (2-5 targeted OR 5 comprehensive)
- Keyword extraction for ATS optimization

**api/services/personalityInferenceGemini.js** (200 lines)
- Gemini-based Big Five inference
- Replaces keyword-matching approach
- Returns personality profile with confidence score

**api/services/pdfGenerator.js** (800 lines)
- Puppeteer + Chromium for PDF rendering
- 3 templates: Classic, Modern, Minimal
- HTML → PDF with proper styling
- Uses system Chromium: `/usr/bin/chromium-browser`

### Frontend Core

**src/App.js** (250 lines)
- React Router configuration
- Protected routes (auth required)
- Public routes (login, signup)
- Main layout with header/footer

**src/contexts/AuthContext.js** (300 lines)
- Firebase Auth management
- User profile fetching from backend
- Google SSO integration
- Token management
- Avatar proxying (CORS workaround)

**src/components/ConversationalResumePage.js** (1,000 lines)
- Resume upload UI (drag-and-drop)
- Job description input
- Conversation wizard
- Progress tracking
- Resume generation trigger

**src/components/ResumeViewPage.js** (370 lines)
- Resume preview (formatted Markdown)
- Download buttons (MD + 3 PDFs)
- ATS analysis display
- Edit/delete actions

### Configuration

**api/prisma/schema.prisma** (650 lines)
- Complete database schema
- All tables, relationships, indexes
- GDPR compliance fields
- Outcome tracking fields

**api/Dockerfile** (40 lines)
- Multi-stage build (Node.js 20 → slim)
- Chromium installation (for PDF)
- Prisma client generation
- Production optimizations

**Dockerfile** (Frontend, 30 lines)
- Multi-stage build (node:20 → nginx:alpine)
- React app compilation
- Nginx configuration

---

## API Endpoints

### Authentication

```
POST /api/auth/register - Register user in backend DB
POST /api/auth/login - Update login timestamp
GET /api/auth/me - Get current user profile
POST /api/auth/logout - Log logout event
POST /api/auth/upgrade-unlimited - Upgrade to unlimited tier
```

### Conversation

```
POST /api/conversation/start
  Body: { jobDescription, existingResume? }
  Returns: sessionId, first question, progress

POST /api/conversation/message
  Body: { sessionId, message, currentQuestionId }
  Returns: next question, progress, isComplete

POST /api/conversation/complete
  Body: { sessionId }
  Returns: personality profile, nextStep

GET /api/conversation/history/:sessionId
  Returns: messages array, currentQuestion, progress
```

### Resume

```
POST /api/resume/generate
  Headers: Authorization: Bearer <token>
  Body: {
    resumeText?,
    personalStories?,
    jobDescription,
    selectedSections,
    targetCompany?,
    sessionId?
  }
  Returns: resume object, ATS analysis, usage stats

POST /api/resume/extract-text
  Headers: Authorization: Bearer <token>
  Body: FormData with files (PDF/DOCX/TXT, 25MB max, 5 files max)
  Returns: { text, files, totalLength }

POST /api/resume/analyze-jd
  Body: { jobDescription }
  Returns: analysis, questions, metadata

GET /api/resume/list
  Returns: resumes array, total count

GET /api/resume/:id
  Returns: resume object (full)

GET /api/resume/:id/pdf?template=classic|modern|minimal
  Returns: PDF file download

GET /api/resume/:id/ats-analysis
  Returns: detailed ATS scores, keywords, optimizations

POST /api/resume/:id/report-outcome
  Body: { interviewReceived, jobOfferReceived, salaryOffered?, outcomeNotes? }
  Returns: updated outcome data

DELETE /api/resume/:id
  Returns: success confirmation
```

### Health Checks

```
GET /health - Quick health check (no DB)
GET /health/detailed - Full health (DB + Firebase)
```

---

## Deployment

### Backend (Cloud Run)

**Dockerfile**: `api/Dockerfile`

```dockerfile
FROM node:20-slim
WORKDIR /app

# Install Chromium (for PDF generation)
RUN apt-get update && apt-get install -y \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
```

**Deploy Script**: `api/deploy-to-cloud-run.sh`

```bash
# Build image
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api

# Deploy to Cloud Run
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --allow-unauthenticated

# Route 100% traffic to latest revision
gcloud run services update-traffic cvstomize-api \
  --to-latest \
  --region us-central1
```

### Frontend (Cloud Run + Cloud Build)

**Dockerfile**: `Dockerfile`

```dockerfile
# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**Cloud Build**: Triggered on git push to dev/staging/main branches

**Configuration**: `ci/cloudbuild.frontend.yaml`

### Environment Variables

**Backend** (via Secret Manager):
- `DATABASE_URL` - PostgreSQL connection string
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin credentials
- `GCP_PROJECT_ID` - cvstomize or cvstomize-staging
- `NODE_ENV` - production, staging, or development

**Frontend** (via .env):
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_FIREBASE_API_KEY` - Firebase client config
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

---

## Testing

### Backend Tests

**Location**: `api/__tests__/`

**Run Tests**:
```bash
cd api
npm test              # All tests
npm test -- --coverage # With coverage
npm test -- integration/resume.test.js # Specific file
```

**Test Structure**:
- `unit/` - Service/utility unit tests
- `integration/` - API endpoint tests (supertest)

**Current Coverage** (Session 26):
- **Total**: 64.48% (was 23.66%)
- **conversation.js**: 73.29%
- **jobDescriptionAnalyzer.js**: 89.24%
- **5 services**: 100% coverage

**Key Test Files**:
- `integration/resume.test.js` - Resume generation flow
- `integration/conversation.test.js` - Conversation API
- `unit/personalityInferenceGemini.test.js` - Personality analysis
- `unit/jobDescriptionAnalyzer.test.js` - JD analysis

### E2E Tests

**Framework**: Playwright

**Run Tests**:
```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # Browser visible
npm run test:report       # View HTML report
```

**Location**: `tests/e2e/`

### Manual Testing

**Staging Environment**:
1. Navigate to staging frontend URL
2. Create test account or use seeded users:
   - `test-free@cvstomize.com` / `TestPass123!`
   - `test-premium@cvstomize.com` / `TestPass123!`
   - `test-unlimited@cvstomize.com` / `TestPass123!`
3. Test complete flow: Upload → JD → Questions → Generate → Download

---

## Known Issues

### High Priority

1. **Contact Info Bug** (Session 28)
   - Email displays correctly
   - Name shows "Alex Johnson" placeholder instead of user's Google display name
   - Debug logging active in production
   - Expected fix: 1 deployment (< 30 minutes)

### Fixed (Session 28)

- ✅ Resume content persistence (stored in DB, not volatile Map)
- ✅ PDF generation (Chromium installed, 1Gi memory)
- ✅ UI copy consistency (no more "11 questions" hardcoded)
- ✅ Gemini prompt leakage (regex cleaning)
- ✅ Placeholder content (no brackets in output)
- ✅ Google avatar display (CORS headers)
- ✅ Resume preview (shows actual content)

---

## Next Steps

### Session 29: Contact Info Bug Fix

1. Test with user account to reproduce bug
2. Identify root cause via debug logs
3. Update contact info resolution logic
4. Deploy and verify fix
5. Update documentation

### Session 30+: Profile-First RAG System

**Strategic Goal**: Deep personality profiles with story retrieval

**Architecture**:
- **pgvector** extension for semantic search
- **Embeddings** for user stories (OpenAI or Vertex AI)
- **12 conversational questions** for profile building
- **RAG retrieval** for resume/cover letter generation

**Database Changes**:
```sql
CREATE TABLE personality_profiles (
  user_id INTEGER UNIQUE,
  openness INTEGER,
  core_values TEXT[],
  passions TEXT[],
  unique_skills TEXT[],
  ...
);

CREATE TABLE profile_stories (
  user_id INTEGER,
  question_asked TEXT,
  story_text TEXT,
  embedding VECTOR(1536),
  relevance_tags TEXT[],
  times_used_in_resumes INTEGER,
  ...
);
```

**Benefits**:
- **Cover letter generation** (currently blocked by shallow profiles)
- **User lock-in** (investment in profile = switching cost)
- **Better personalization** (semantic search finds relevant stories)
- **Competitive advantage** (most AI resume builders don't have this)

---

## Additional Resources

**Documentation**:
- `ROADMAP.md` - Complete project roadmap (2,353 lines)
- `README.md` - Quick start guide
- `docs/project_info/CREDENTIALS_SECURE.md` - Secret Manager guide
- `docs/project_info/MONETIZATION_STRATEGY.md` - Business strategy
- `docs/setup/` - Setup guides
- `docs/testing/` - Testing guides

**Scripts**:
- `scripts/manage-secrets.sh` - Secret Manager CLI
- `scripts/deployment/` - Deployment automation
- `scripts/seed-staging.sh` - Staging data seeding
- `scripts/project-health-check.sh` - Health checks

**GCP Console Links**:
- [Cloud Run](https://console.cloud.google.com/run?project=cvstomize)
- [Cloud SQL](https://console.cloud.google.com/sql/instances?project=cvstomize)
- [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=cvstomize)
- [Cloud Build](https://console.cloud.google.com/cloud-build/builds?project=cvstomize)
- [Logs](https://console.cloud.google.com/logs?project=cvstomize)

**GitHub**:
- Repository: https://github.com/wyofalcon/cvstomize
- Current Branch: dev
- CI/CD Actions: https://github.com/wyofalcon/cvstomize/actions

---

## Code Patterns & Conventions

### Authentication

**Frontend** (`src/contexts/AuthContext.js`):
- Firebase Auth for user authentication
- Token exchange with backend
- Avatar proxying for CORS

**Backend** (`api/middleware/authMiddleware.js`):
- Firebase token verification
- User lookup in database
- Request authorization

### Error Handling

**Backend** (`api/middleware/errorHandler.js`):
```javascript
// All routes should pass errors to next(err)
app.post('/api/endpoint', async (req, res, next) => {
  try {
    // ... logic
  } catch (error) {
    next(error); // Error handler catches this
  }
});
```

### AI Service Usage

**ALWAYS use Vertex AI** (`api/services/geminiServiceVertex.js`):
```javascript
const geminiService = require('./services/geminiServiceVertex');
const model = geminiService.getProModel(); // Gemini 2.5 Pro
const result = await model.generateContent(prompt);
```

**DO NOT use** `geminiService.js` (deprecated, API key approach)

### Database Access

**Use Prisma ORM**:
```javascript
const prisma = require('./config/database'); // Singleton instance

const user = await prisma.user.findUnique({
  where: { firebaseUid: 'abc123' },
  select: { id: true, email: true }
});
```

### Resume Generation Prompt Structure

**Personality-Aware Framing**:
1. Extract Big Five scores from database
2. Build personality guidance (Openness → Innovation/Reliability)
3. Include in prompt to Gemini
4. Frame all achievements through personality lens

**Gap Analysis (Resume-First)**:
1. Load existing resume from `conversations.existing_resume`
2. Load gap analysis from `conversations.gap_analysis`
3. Build HYBRID prompt (KEEP + ENHANCE + FILL)
4. Result: 85-95% ATS match

---

## Dependencies

### Backend Key Packages

```json
{
  "@google-cloud/vertexai": "^1.10.0",
  "@google-cloud/storage": "^7.17.3",
  "@google-cloud/secret-manager": "^6.1.1",
  "@prisma/client": "^6.18.0",
  "express": "^5.1.0",
  "firebase-admin": "^13.6.0",
  "puppeteer": "^24.29.0",
  "multer": "^2.0.2",
  "pdf-parse": "1.1.1",
  "mammoth": "^1.11.0",
  "marked": "^16.4.1"
}
```

### Frontend Key Packages

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "@mui/material": "^7.3.4",
  "@emotion/react": "^11.14.0",
  "firebase": "^12.5.0",
  "axios": "^1.13.1",
  "react-markdown": "^9.0.1"
}
```

---

## Performance & Scaling

### Current Limits

- **Memory**: 1Gi (API), 512Mi (Frontend)
- **CPU**: 1 vCPU
- **Max Instances**: 10
- **Request Timeout**: 300s (5 minutes for Gemini calls)
- **File Upload**: 25MB per file, 5 files max

### Optimization Notes

- **PDF Generation**: Requires 1Gi memory (Puppeteer + Chromium)
- **Gemini Calls**: Can take 10-30 seconds, use streaming for UX
- **Database Connections**: Use Prisma connection pooling
- **Cloud Run Scaling**: Cold start ~5-10s, warm requests ~200ms

### Cost Optimization

- **GCP Credits**: ~$296 remaining (of $300)
- **Monthly Cost**: ~$36-41
  - Production: $15-20
  - Dev/Staging: $21
- **Gemini API**: Pay-per-token (1M tokens = $1.25 for Gemini 2.5 Pro)

---

## Security Considerations

### Secrets Management

- ✅ No secrets in code or git
- ✅ All credentials in Secret Manager
- ✅ Environment-specific secrets (prod vs staging)
- ✅ IAM access control
- ✅ Secret rotation supported

### Authentication

- ✅ Firebase Auth (industry standard)
- ✅ Token verification on every API call
- ✅ User ownership checks (can't access others' resumes)
- ✅ Email verification required
- ✅ Password reset flow

### CORS

- ✅ Whitelist approach (no wildcard)
- ✅ Production + staging + dev origins
- ✅ Credentials: true (for cookies/auth)
- ✅ Logs blocked origins

### Rate Limiting

- ✅ 100 requests per 15 minutes per IP
- ✅ Applied to /api/* routes
- ✅ Trust proxy for Cloud Run

### Data Privacy

- ✅ GDPR consent tracking
- ✅ Data retention policies
- ✅ User can delete account + all data
- ✅ Audit logs for compliance

---

**END OF REFERENCE DOCUMENT**

This document contains the complete project structure, architecture, and implementation details for CVstomize. Use it as a comprehensive reference for understanding the codebase, making changes, or onboarding new developers/AI agents.
