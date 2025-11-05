# Testing Guide - CVstomize Backend

## 📊 Test Status

**Current Status:** ✅ **127/127 tests passing (100%)**

```
Test Suites: 5 passed, 5 total
Tests:       127 passed, 127 total
Time:        ~2.2s
Coverage:    44.43% overall, 86%+ on critical paths
```

## 🚀 Quick Start

### Run All Tests
```bash
cd api
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- tests/resume.test.js
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## 📁 Test Suite Structure

### Test Files (5 suites, 127 tests)

#### 1. **auth.test.js** (9 tests)
- **Purpose:** Authentication flow, registration, JWT verification
- **Coverage:** Firebase integration, user creation, token validation
- **Key Tests:**
  - User registration with Firebase token
  - Login flow and token refresh
  - User profile retrieval
  - Logout functionality

#### 2. **jobDescriptionAnalyzer.test.js** (33 tests)
- **Purpose:** Job description parsing and question generation
- **Coverage:** 95% - Highest coverage in codebase
- **Key Tests:**
  - JD validation (length, content, keywords)
  - AI analysis with Gemini integration
  - Fallback analysis when AI fails
  - Targeted question generation (5 questions per JD)
  - Experience level detection (entry/mid/senior/executive)

#### 3. **personalityQuestions.test.js** (47 tests)
- **Purpose:** 6-question personality framework (Big Five traits)
- **Coverage:** 100% - Fully tested
- **Key Tests:**
  - Question structure and validation
  - Answer validation (word count, content)
  - Conversation flow building (13 steps total)
  - Hint generation and follow-up questions
  - Keyword coverage for personality inference

#### 4. **conversationalEndpoints.test.js** (18 tests)
- **Purpose:** REST API endpoints for conversational resume flow
- **Coverage:** All 3 endpoints tested
- **Key Tests:**
  - POST `/api/resume/analyze-jd` - JD analysis
  - POST `/api/resume/conversation-flow` - Build 13-step conversation
  - POST `/api/resume/validate-answer` - Validate user responses
  - Integration: Full conversational flow end-to-end

#### 5. **resume.test.js** (20 tests)
- **Purpose:** Resume generation, listing, and download
- **Coverage:** 86% - Core business logic
- **Key Tests:**
  - Resume generation with/without personality
  - Resume limit enforcement (subscription tiers)
  - Token usage and cost tracking
  - Resume listing and retrieval
  - Download and markdown generation

## 🏗️ Testing Architecture

### Production-Grade Patterns Used

#### 1. **Centralized Mocking** (`tests/setup.js`)
All mocks defined in one place to prevent conflicts:

```javascript
// Global Firebase mock (configured per test)
global.mockVerifyIdToken = mockVerifyIdToken;
global.mockFirebaseApp = mockFirebaseApp;

// UUID mock (ES modules compatibility)
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid-1234') }));

// Secret Manager mock (prevents external API calls)
jest.mock('@google-cloud/secret-manager', ...);
```

#### 2. **Dependency Injection** (`config/firebase.js`)
Firebase initialization extracted for testability:

```javascript
// Production: Loads from Secret Manager
// Test: Returns mock immediately
async function initializeFirebase() {
  if (process.env.NODE_ENV === 'test') {
    return admin.app(); // Mock injected by tests
  }
  // ... Secret Manager logic
}
```

#### 3. **Test Isolation**
Each test cleans up and reconfigures mocks:

```javascript
beforeEach(() => {
  jest.clearAllMocks();
  // Reconfigure mocks after clearing
  global.mockVerifyIdToken.mockResolvedValue(mockFirebaseUser);
});
```

## 🔧 Common Testing Patterns

### 1. Testing Authenticated Endpoints

```javascript
it('should access protected endpoint', async () => {
  // Setup: Configure Firebase mock
  global.mockVerifyIdToken.mockResolvedValue({
    uid: 'test-uid-123',
    email: 'test@example.com',
    firebase: { sign_in_provider: 'google.com' }
  });

  // Setup: Mock database response
  mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

  // Execute: Make authenticated request
  const response = await request(app)
    .post('/api/resume/generate')
    .set('Authorization', `Bearer ${validToken}`)
    .send({ jobDescription: 'Engineer role', selectedSections: ['Experience'] })
    .expect(201);

  // Assert: Check response
  expect(response.body.success).toBe(true);
});
```

### 2. Testing Error Paths

```javascript
it('should return 401 without auth token', async () => {
  const response = await request(app)
    .post('/api/resume/generate')
    .send({ jobDescription: 'Engineer role' })
    .expect(401);

  expect(response.body.error).toBe('Unauthorized');
});
```

### 3. Testing Database Interactions

```javascript
it('should increment resume counter', async () => {
  mockPrismaClient.user.update.mockResolvedValue({
    ...mockUser,
    resumesGenerated: 1
  });

  await request(app)
    .post('/api/resume/generate')
    .set('Authorization', `Bearer ${validToken}`)
    .send({ /* ... */ })
    .expect(201);

  // Verify database was called correctly
  expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
    where: { id: 'user-123' },
    data: { resumesGenerated: { increment: 1 } }
  });
});
```

## 🐛 Debugging Failed Tests

### 1. View Full Error Output
```bash
npm test -- --verbose
```

### 2. Run Single Test with Debugging
```bash
npm test -- tests/resume.test.js --detectOpenHandles
```

### 3. Add Console Logs in Tests
```javascript
if (response.status !== 201) {
  console.log('Response:', JSON.stringify(response.body, null, 2));
}
```

### 4. Check Mock Configuration
```javascript
beforeEach(() => {
  console.log('Mock calls:', mockPrismaClient.user.findUnique.mock.calls);
});
```

## 📈 Coverage Targets

### Current Coverage by Module

| Module | Coverage | Target | Status |
|--------|----------|--------|--------|
| **resume.js** | 86.36% | 80%+ | ✅ Excellent |
| **personalityQuestions.js** | 100% | 90%+ | ✅ Perfect |
| **jobDescriptionAnalyzer.js** | 95.06% | 90%+ | ✅ Excellent |
| **auth.js** | 53.84% | 70%+ | ⚠️ Good (E2E tested) |
| **geminiServiceVertex.js** | 29.62% | 50%+ | ⚠️ Mocked (external API) |

### Why Some Modules Have Lower Coverage

**auth.js (53%)**: Most auth logic is tested via integration tests (auth.test.js tests the full flow end-to-end rather than unit testing each function).

**geminiServiceVertex.js (29%)**: This is an external API client that's fully mocked in tests. Testing real Gemini API calls would be slow, expensive, and flaky.

**errorHandler.js (15%)**: Error paths require explicit failure injection. Defer until production errors guide what to test.

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Backend Tests
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd api && npm ci
      - run: cd api && npm test
      - run: cd api && npm run test:coverage
```

### Pre-commit Hook (Optional)
```bash
# .git/hooks/pre-commit
#!/bin/bash
cd api && npm test || exit 1
```

## 🛠️ Maintaining Tests

### Adding New Tests

1. **Create test file** matching source file name:
   ```
   api/services/newService.js
   api/tests/newService.test.js
   ```

2. **Follow existing patterns**:
   ```javascript
   // Use global mocks from setup.js
   describe('NewService', () => {
     beforeEach(() => {
       jest.clearAllMocks();
       global.mockVerifyIdToken.mockResolvedValue(mockUser);
     });

     it('should do something', async () => {
       // Arrange, Act, Assert
     });
   });
   ```

3. **Run tests to verify**:
   ```bash
   npm test -- tests/newService.test.js
   ```

### Updating Tests After Code Changes

1. **Identify affected tests**: Run full suite, note failures
2. **Update mocks if needed**: Check if API contracts changed
3. **Fix expectations**: Update assertions to match new behavior
4. **Verify coverage**: Ensure new code paths are tested

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module 'supertest'"
**Cause:** devDependencies not installed (NODE_ENV=production)
**Solution:**
```bash
export NODE_ENV=development
npm install
```

### Issue 2: "Cannot read properties of undefined"
**Cause:** Mock not configured before test runs
**Solution:** Add mock setup in `beforeEach()`:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
  mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
});
```

### Issue 3: "Firebase initialization failed"
**Cause:** Real Firebase trying to initialize in test environment
**Solution:** Check `tests/setup.js` has proper Firebase mocks

### Issue 4: Route returns 404 unexpectedly
**Cause:** Express route ordering (/:id matches before /list)
**Solution:** Define specific routes BEFORE parameterized routes:
```javascript
router.get('/list', ...);    // ✅ First
router.get('/:id', ...);     // ✅ Second
```

## 📚 Best Practices

### ✅ DO
- Use global mocks from `tests/setup.js`
- Clear and reconfigure mocks in `beforeEach()`
- Test both success and error paths
- Use meaningful test descriptions
- Group related tests with `describe()` blocks
- Mock external APIs (Gemini, Firebase)
- Test critical business logic thoroughly

### ❌ DON'T
- Create duplicate mocks in test files
- Use real external API calls in tests
- Skip testing error paths
- Test implementation details (test behavior)
- Leave `console.log()` statements in tests
- Commit `.only()` or `.skip()` to version control

## 🎯 Testing Philosophy

**"Test behavior, not implementation"**

Good Test:
```javascript
it('should reject user without subscription', async () => {
  // Tests WHAT happens, not HOW
  const response = await generateResume({ tier: 'free', count: 5, limit: 5 });
  expect(response.status).toBe(403);
});
```

Bad Test:
```javascript
it('should call checkResumeLimit middleware', async () => {
  // Tests implementation detail
  expect(checkResumeLimit).toHaveBeenCalled();
});
```

## 📞 Support

**Questions?** Check:
1. This guide's Common Issues section
2. Existing test files for patterns
3. Jest documentation: https://jestjs.io/docs/getting-started

**Found a bug?** Add a test that reproduces it, then fix the code.

---

**Last Updated:** Session 12 - 100% Test Pass Rate Achieved ✅
