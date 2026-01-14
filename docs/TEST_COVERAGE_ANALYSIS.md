# Test Coverage Analysis & Recommendations

**Date:** December 3, 2025
**Context:** Session 30 RAG implementation complete, preparing for production deployment
**Current Status:** 230/255 tests passing (90%), but critical gaps exist

---

## 🚨 Critical Finding: NO TESTS FOR NEW FEATURES

### **Session 29-30 Code Added (UNTESTED):**
- ❌ `api/services/profileAnalyzer.js` (650 lines) - **0 tests**
- ❌ `api/services/storyExtractor.js` (150 lines) - **0 tests**
- ❌ `api/services/goldStandardQuestions.js` (400 lines) - **0 tests**
- ❌ `api/routes/goldStandard.js` (600+ lines) - **0 tests**
- ❌ `api/services/embeddingGenerator.js` (205 lines) - **0 tests**
- ❌ `api/services/storyRetriever.js` (310 lines) - **0 tests**
- ❌ `src/components/GoldStandardWizard.js` (800 lines) - **0 tests**

**Total Untested Code:** ~3,100+ lines (15-20% of codebase)

---

## 📊 Current Test Suite Status

### **Backend Tests (10 files, 255 total tests)**

#### **Passing (230 tests - 90%)**
✅ Unit Tests:
- `middleware/security.test.js` - Security headers, CORS, rate limiting
- `middleware/authMiddleware.test.js` - Firebase token verification
- `middleware/errorHandler.test.js` - Error handling
- `services/jobDescriptionAnalyzer.test.js` - JD parsing (some failures)
- `services/personalityInference.test.js` - Personality scoring
- `utils/questionFramework.test.js` - Question generation
- `utils/firebase.test.js` - Firebase config
- `utils/personalityQuestions.test.js` - Question logic

✅ Integration Tests:
- `integration/conversation.test.js` - **FAILING** (supertest deps)
- `integration/resume.test.js` - **FAILING** (supertest deps)

#### **Failing (25 tests - 10%)**
❌ Integration tests failing due to missing `qs` dependency
❌ JD analyzer tests failing (Gemini response format mismatch)

### **Frontend Tests**
❌ **ZERO frontend tests found**

---

## 🎯 Immediate Risks (Production)

### **High Risk - Untested Critical Paths:**

1. **Gold Standard Assessment Flow** (Session 29)
   - `/api/gold-standard/start` - Creates profile
   - `/api/gold-standard/answer` - Saves stories/Likert/hybrid
   - `/api/gold-standard/complete` - Analyzes personality

   **Risk:** Hybrid scoring algorithm untested (70% Likert + 30% NLP)
   - BFI-20 reverse scoring calculation
   - Gemini NLP analysis parsing
   - Score fusion logic
   - Confidence calculation

2. **RAG Story Retrieval** (Session 30)
   - Embedding generation (Vertex AI integration)
   - pgvector storage (raw SQL queries)
   - Semantic search (cosine similarity)
   - Resume integration

   **Risk:** Database queries untested
   - SQL injection potential in `$executeRawUnsafe()`
   - Vector format conversion bugs
   - Similarity threshold edge cases

3. **Resume Generation with RAG**
   - Story retrieval before prompt building
   - Usage tracking
   - Fallback behavior (free tier)

   **Risk:** RAG failures could break resume generation

---

## 📋 Recommended Test Coverage (Priority Order)

### **PRIORITY 1: Critical Backend Tests (Must Have Before Production)**

#### **1.1 Gold Standard Assessment**
Create: `api/__tests__/integration/goldStandard.test.js`

```javascript
describe('POST /api/gold-standard/start', () => {
  it('creates personality profile for Gold tier user');
  it('rejects Free tier user with 403');
  it('returns existing profile if already complete');
});

describe('POST /api/gold-standard/answer', () => {
  it('saves story answers with validation');
  it('saves Likert responses (20 questions)');
  it('saves hybrid answers (7 questions)');
  it('rejects incomplete sections');
});

describe('POST /api/gold-standard/complete', () => {
  it('performs hybrid personality analysis');
  it('generates correct OCEAN scores');
  it('creates embeddings for all stories');
  it('updates user.personalityProfileComplete flag');
  it('returns confidence score and derived traits');
});
```

**Estimated:** 15-20 tests

#### **1.2 Profile Analyzer (Unit Tests)**
Create: `api/__tests__/unit/services/profileAnalyzer.test.js`

```javascript
describe('calculateBFI20Scores', () => {
  it('calculates openness score correctly');
  it('handles reverse-scored items (q2, q4, etc.)');
  it('normalizes to 0-100 scale');
  it('detects inconsistent responses');
});

describe('fuseScores', () => {
  it('weights Likert 70% and NLP 30%');
  it('rounds to integers');
  it('handles edge cases (0, 100)');
});

describe('calculateConfidence', () => {
  it('returns high confidence for consistent responses');
  it('penalizes contradictory Likert + NLP scores');
});

describe('deriveWorkPreferences', () => {
  it('maps high openness → creative work style');
  it('maps high conscientiousness → structured style');
  it('generates communication style from extraversion');
});
```

**Estimated:** 20-25 tests

#### **1.3 RAG Integration (Unit + Integration)**
Create: `api/__tests__/integration/ragFlow.test.js`

```javascript
describe('Embedding Generation', () => {
  it('generates 768-dim vector from Vertex AI');
  it('formats embedding for pgvector correctly');
  it('handles batch processing with rate limiting');
  it('throws error on API failure');
});

describe('Story Retrieval', () => {
  it('retrieves top 5 stories by cosine similarity');
  it('filters by question type (achievement/innovation for resumes)');
  it('respects similarity threshold (0.4 for resumes)');
  it('returns empty array if no embeddings exist');
  it('prevents SQL injection in raw queries');
});

describe('Resume Integration', () => {
  it('calls RAG retrieval for Gold tier users');
  it('skips RAG for Free tier users');
  it('tracks story usage in database');
  it('includes RAG stories in prompt');
  it('handles RAG failure gracefully');
});
```

**Estimated:** 15-20 tests

#### **1.4 Story Extractor (Unit Tests)**
Create: `api/__tests__/unit/services/storyExtractor.test.js`

```javascript
describe('extractStoryData', () => {
  it('summarizes story with Gemini');
  it('categorizes story type (technical_leadership, etc.)');
  it('extracts themes and skills');
  it('detects personality signals');
  it('handles Gemini API errors gracefully');
});

describe('batchExtractStories', () => {
  it('processes 8+ stories in parallel');
  it('respects rate limits');
  it('returns partial results on failures');
});
```

**Estimated:** 8-10 tests

---

### **PRIORITY 2: Frontend Tests (Important for UX)**

#### **2.1 Gold Standard Wizard**
Create: `src/__tests__/components/GoldStandardWizard.test.js`

```javascript
describe('GoldStandardWizard', () => {
  it('renders 3-step wizard (Stories → Likert → Hybrid)');
  it('validates story word count (min 50 words)');
  it('saves stories to backend via POST /answer');
  it('advances to Likert section after 8 stories');
  it('requires all 20 Likert questions answered');
  it('shows progress indicator');
  it('displays results dialog with OCEAN scores');
  it('blocks non-Gold tier users');
});
```

**Estimated:** 10-12 tests

#### **2.2 Resume View Page**
Create: `src/__tests__/components/ResumeViewPage.test.js`

```javascript
describe('ResumeViewPage', () => {
  it('loads resume via GET /resume/:id');
  it('displays ATS score badge');
  it('downloads markdown file');
  it('downloads PDF (3 templates)');
  it('shows "RAG-enhanced" badge for Gold tier');
  it('handles 404 resume not found');
});
```

**Estimated:** 8-10 tests

---

### **PRIORITY 3: E2E Tests (Deployment Validation)**

#### **3.1 Gold Standard End-to-End**
Create: `api/__tests__/e2e/goldStandardFlow.test.js`

```javascript
describe('Gold Standard E2E Flow', () => {
  it('completes full assessment and generates resume with RAG', async () => {
    // 1. Start assessment
    const { profileId } = await POST('/gold-standard/start');

    // 2. Answer 8 story questions
    await POST('/gold-standard/answer', { section: 'stories', answers: [...] });

    // 3. Answer 20 Likert questions
    await POST('/gold-standard/answer', { section: 'likert', answers: {...} });

    // 4. Answer 7 hybrid questions
    await POST('/gold-standard/answer', { section: 'hybrid', answers: [...] });

    // 5. Complete assessment
    const { results } = await POST('/gold-standard/complete');
    expect(results.ocean.openness).toBeGreaterThan(0);

    // 6. Verify embeddings created
    const stories = await db.profileStory.findMany({ where: { profileId } });
    expect(stories.every(s => s.embedding !== null)).toBe(true);

    // 7. Generate resume with RAG
    const resume = await POST('/resume/generate', { jobDescription: '...' });
    expect(resume.metadata.ragStoriesUsed).toBeGreaterThan(0);
    expect(resume.metadata.premiumFeatures).toContain('gold-standard-rag');
  });
});
```

**Estimated:** 3-5 tests

---

## 🔧 How to Implement Tests

### **Step 1: Fix Existing Test Infrastructure**

1. **Install missing dependency:**
```bash
cd /mnt/storage/shared_windows/Cvstomize
npm install --save-dev qs
```

2. **Mock Vertex AI in tests:**
```javascript
// api/__tests__/setup.js
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    preview: {
      getGenerativeModel: jest.fn(() => ({
        generateContent: jest.fn(() => ({
          response: {
            candidates: [{ content: { parts: [{ text: 'mock' }] } }]
          }
        })),
        embedContent: jest.fn(() => ({
          embedding: { values: new Array(768).fill(0.1) }
        }))
      }))
    }
  }))
}));
```

3. **Create test database:**
```bash
# Use separate test DB to avoid polluting production
DATABASE_URL="postgresql://user:pass@localhost:5432/cvstomize_test"
```

### **Step 2: Write Priority 1 Tests (4-6 hours)**
- Gold Standard integration tests (15 tests)
- Profile analyzer unit tests (20 tests)
- RAG integration tests (15 tests)
- Story extractor tests (8 tests)

**Total:** ~58 new tests

### **Step 3: Run Test Coverage Report**
```bash
cd api
npm run test:coverage
```

**Target:** 80%+ coverage on new code

### **Step 4: Add Frontend Test Infrastructure**
```bash
cd src
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

Create `src/setupTests.js`:
```javascript
import '@testing-library/jest-dom';
```

### **Step 5: CI/CD Integration**
Add to GitHub Actions:
```yaml
- name: Run Backend Tests
  run: |
    cd api
    npm test -- --coverage

- name: Run Frontend Tests
  run: |
    cd src
    npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## 📈 Coverage Goals

### **Current:**
- Backend: ~60% coverage (excluding new features)
- Frontend: 0% coverage
- Overall: ~40% coverage

### **Target (Production Ready):**
- Backend: 85%+ coverage
- Frontend: 70%+ coverage
- Overall: 80%+ coverage

### **Critical Paths (Must be 100%):**
- ✅ Payment/billing logic
- ✅ User authentication
- ✅ Gold Standard scoring algorithm
- ✅ RAG story retrieval
- ✅ Resume generation
- ✅ PDF generation

---

## 🚦 Go/No-Go Decision

### **Can We Deploy Session 30 to Production Now?**

**NO** - Recommended to add critical tests first.

**Why:**
1. **2,300+ lines of untested code** in core premium features
2. **SQL injection risk** in pgvector raw queries (untested)
3. **Scoring algorithm** could be wrong (no validation)
4. **RAG failures** might break resume generation (no fallback tests)
5. **Integration tests failing** (supertest dependency issue)

### **Minimum Tests Before Deployment:**

**Must Have (3-4 hours work):**
1. ✅ Gold Standard `/complete` integration test (verify OCEAN scores)
2. ✅ RAG retrieval test (verify embeddings + search work)
3. ✅ Resume generation with RAG test (verify integration)
4. ✅ Fix existing failing tests (install `qs` dependency)

**Should Have (6-8 hours work):**
5. Unit tests for profileAnalyzer.js (scoring algorithm)
6. Unit tests for embeddingGenerator.js (Vertex AI integration)
7. SQL injection tests (pgvector queries)
8. E2E Gold Standard flow test

**Nice to Have (12+ hours):**
9. Frontend tests for GoldStandardWizard
10. Full coverage reports
11. CI/CD integration

---

## 🎯 Recommended Action Plan

### **Option A: Deploy with Minimal Tests (Fastest)**
1. Write 3-4 critical integration tests (3 hours)
2. Fix failing tests (1 hour)
3. Manual QA on staging (2 hours)
4. Deploy to production with monitoring
5. **Risk:** Medium (core logic untested)

### **Option B: Comprehensive Testing (Recommended)**
1. Write all Priority 1 tests (6-8 hours)
2. Fix existing test suite (1 hour)
3. Achieve 80%+ coverage (2 hours)
4. Automated QA + manual verification (2 hours)
5. Deploy to production
6. **Risk:** Low (high confidence)

### **Option C: Test-Driven Refactor (Safest)**
1. Write all Priority 1 + Priority 2 tests (12+ hours)
2. Add frontend tests (6 hours)
3. CI/CD pipeline (4 hours)
4. Full regression suite (2 hours)
5. Deploy to production
6. **Risk:** Minimal (enterprise-grade)

---

## 💡 My Recommendation

**Go with Option B: Comprehensive Testing**

**Why:**
- Gold Standard is a **premium feature** ($29-49/mo) - must be bulletproof
- RAG involves **SQL queries** and **AI APIs** - high bug potential
- We have **3,100+ lines of untested code** - too risky to ship blind
- Writing tests now will **save debugging time** in production
- Tests serve as **documentation** for future developers

**Timeline:**
- **Today:** Write Priority 1 tests (6-8 hours)
- **Tomorrow:** Test on staging, deploy to production
- **This Week:** Add Priority 2 frontend tests (8 hours)
- **Next Week:** CI/CD integration

**ROI:**
- 1 production bug = 2-4 hours debugging + potential revenue loss
- 6 hours writing tests prevents 10+ hours debugging
- Tests enable faster iteration on Sessions 31-33

---

## 🔍 Specific Test I'd Write First

```javascript
// api/__tests__/integration/goldStandard.test.js
describe('POST /api/gold-standard/complete - Critical Path', () => {
  it('performs hybrid personality analysis and creates embeddings', async () => {
    // Setup: Create Gold tier user
    const user = await createTestUser({ subscriptionTier: 'gold' });
    const token = await getAuthToken(user);

    // Step 1: Start assessment
    const startRes = await request(app)
      .post('/api/gold-standard/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { profileId } = startRes.body;

    // Step 2: Submit 8 stories
    await request(app)
      .post('/api/gold-standard/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        section: 'stories',
        answers: MOCK_STORIES // 8 realistic stories
      })
      .expect(200);

    // Step 3: Submit 20 Likert responses
    await request(app)
      .post('/api/gold-standard/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        section: 'likert',
        answers: MOCK_LIKERT_HIGH_OPENNESS // High openness scores
      })
      .expect(200);

    // Step 4: Submit 7 hybrid answers
    await request(app)
      .post('/api/gold-standard/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        section: 'hybrid',
        answers: MOCK_HYBRID
      })
      .expect(200);

    // Step 5: Complete assessment
    const completeRes = await request(app)
      .post('/api/gold-standard/complete')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assertions: Verify OCEAN scores
    expect(completeRes.body.results.ocean.openness).toBeGreaterThan(70); // High openness
    expect(completeRes.body.results.ocean.openness).toBeLessThanOrEqual(100);
    expect(completeRes.body.results.confidence).toBeGreaterThan(0.7);

    // Verify embeddings created in database
    const stories = await prisma.profileStory.findMany({
      where: { profileId }
    });

    expect(stories).toHaveLength(15); // 8 stories + 7 hybrid

    // Verify all stories have embeddings
    const storiesWithEmbeddings = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as count FROM profile_stories WHERE profile_id = $1 AND embedding IS NOT NULL',
      profileId
    );

    expect(storiesWithEmbeddings[0].count).toBe(15);

    // Verify user flag updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(updatedUser.personalityProfileComplete).toBe(true);
  });
});
```

This single test validates:
- ✅ Full Gold Standard flow
- ✅ Personality scoring works
- ✅ Embeddings generated correctly
- ✅ Database updates succeed
- ✅ API returns correct data

**Would you like me to start implementing these tests now?**
