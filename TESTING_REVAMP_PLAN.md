# Plan to Achieve World-Class Testing Coverage

**Current Status (Dec 19, 2025):**
- **Tests:** 290 Passing, 100 Failing (25% Failure Rate)
- **Coverage:** ~24% Line Coverage (Target: >80%)
- **Critical Issues:** Broken mocks, ESM syntax errors in tests, database connection failures in integration tests.

---

## Phase 1: Fix the Broken Foundation (Immediate Priority)

The first step is to get the existing 390 tests passing. We cannot build on a broken foundation.

### 1.1 Fix ESM/CommonJS Conflicts (`goldStandard.test.js`)
- **Issue:** `SyntaxError: Unexpected token 'export'` in `node_modules/marked`.
- **Fix:** Update `jest.config.js` to properly transform ESM modules or mock `marked` library in tests.

### 1.2 Fix Global Mocks (`firebase` & `Secret Manager`)
- **Issue:** `authMiddleware.test.js` and `firebase.test.js` failing due to initialization logic.
- **Fix:** Centralize mocks in `api/__tests__/setup.js` to ensure consistent behavior for `firebase-admin` and `@google-cloud/secret-manager`.

### 1.3 Fix Integration Test Database
- **Issue:** `ragFlow.test.js` failing with `Authentication failed`.
- **Fix:** Ensure `process.env.DATABASE_URL` is correctly set for the test environment in `docker-compose` or `jest` setup. Use a dedicated test database container.

### 1.4 Fix Unit Test Logic
- **Issue:** `embeddingGenerator.test.js` failing with `calculateCosineSimilarity is not a function`.
- **Fix:** Export the missing function or test the public interface that uses it.

---

## Phase 2: Restore & Verify Coverage

Once tests are passing, we re-run coverage to establish the real baseline.

- **Goal:** 0 Failing Tests.
- **Target Coverage:** Expecting ~60% after fixes (up from 24%).

---

## Phase 3: Expand Backend Coverage (Critical Paths)

Address the "0% coverage" areas identified in the analysis.

### 3.1 AI Service Layer (`geminiServiceVertex.js`)
- **Action:** Mock Vertex AI responses for various scenarios (success, safety block, timeout).
- **Target:** >80% coverage.

### 3.2 RAG & Vector Search (`storyRetriever.js`)
- **Action:** Test the cosine similarity logic and SQL query generation (mocking `prisma.$queryRaw`).
- **Target:** >80% coverage.

### 3.3 Resume Generation Route (`routes/resume.js`)
- **Action:** Integration tests for the full `/generate` endpoint, mocking the PDF generation and AI service.
- **Target:** >80% coverage.

---

## Phase 4: Frontend Automation (World Class Standard)

Move from "manual agentic testing" to automated CI/CD pipelines.

### 4.1 Automated E2E Auth
- **Action:** Create a `global-setup.ts` in Playwright to generate and save a valid authentication state (storage state).
- **Benefit:** Allows E2E tests to bypass the Google SSO login screen.

### 4.2 CI/CD Integration
- **Action:** Add a `frontend-test` job to `deploy.yml`.
- **Command:** `npx playwright test`
- **Blocking:** Deploy fails if E2E tests fail.

---

## Execution Order

1. **Fix 1.1 & 1.4:** Quick wins to fix syntax/logic errors.
2. **Fix 1.2:** Stabilize auth mocks.
3. **Fix 1.3:** Fix database connection for integration tests.
4. **Phase 2:** Verify baseline.
5. **Phase 3:** Write missing backend tests.
6. **Phase 4:** Setup Frontend CI.
