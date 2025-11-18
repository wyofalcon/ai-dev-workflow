# CVstomize Testing Suite

**Created:** November 15, 2025  
**Updated:** November 17, 2025  
**Purpose:** Comprehensive manual and automated E2E testing  
**Tools:** Test Tracker (HTML), Playwright (TypeScript), Playwright Codegen

---

## 🚀 Quick Start

### Choose Your Testing Approach

#### 📝 **Manual Testing with Tracker (Recommended for Exploration)**
Interactive checklist-based testing with progress tracking.

```bash
# Open test tracker
open tools/test-tracker.html

# Or use launcher
./start-testing.sh
```

📖 **Full Guide:** [`../TESTING_WORKSPACE.md`](../TESTING_WORKSPACE.md)

#### 🎬 **Record Tests with Playwright**
Capture interactions and generate test code.

```bash
# Record a test
./scripts/record-test.sh

# Record with options
./scripts/record-test.sh --name my-test
./scripts/record-test.sh --local
```

📖 **Full Guide:** [`../docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md`](../docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md)

#### 🎭 **Run E2E Tests (Automated)**
Execute Playwright test suite.

```bash
# Interactive UI mode
npm run test:e2e:ui

# Headless mode
npm run test:e2e

# View reports
npm run test:report
```

---

## 📁 Test Structure

```
tests/
├── e2e/                                # Playwright TypeScript E2E tests
│   ├── 01-authentication.spec.ts       # Auth flows (SSO, email/password)
│   ├── 02-resume-generation.spec.ts    # Resume creation flow
│   ├── 03-resume-with-upload.spec.ts   # Upload & hybrid flow
│   ├── 04-resume-history.spec.ts       # History management
│   ├── 05-profile.spec.ts              # Profile features
│   ├── 06-downloads.spec.ts            # Export functionality
│   └── helpers.ts                      # Shared test utilities
├── recorded/                           # Tests generated from codegen
│   └── (your-recorded-tests)          # Saved by record-test.sh
├── fixtures/
│   └── test-data.json                  # Test data (job descriptions, answers)
└── reports/
    ├── html/                           # HTML test reports
    ├── screenshots/                    # Failure screenshots
    └── results.json                    # Machine-readable results
```

---

## 🎯 Test Coverage

### 📝 Manual Testing (Test Tracker)

16 comprehensive test scenarios across 6 categories:

1. **Authentication (4 tests)** - Google SSO, email/password, login, logout
2. **Resume Generation - No Upload (3 tests)** - Full creation flow
3. **Resume Generation - With Upload (2 tests)** - Upload & tailoring
4. **Resume History (3 tests)** - View, edit, delete resumes
5. **Profile Management (2 tests)** - View and update profile
6. **Downloads (2 tests)** - PDF and DOCX exports

**Features:**
- Step-by-step guidance
- Progress tracking with auto-save
- Pass/Fail/Skip marking
- Notes for each test
- Export test reports

### 🎭 Playwright E2E Tests

**Implemented:**
- `01-authentication.spec.ts` - Google SSO, email/password auth
- `02-resume-generation.spec.ts` - Complete generation flow
- `03-resume-with-upload.spec.ts` - Upload & hybrid flow
- `04-resume-history.spec.ts` - History management
- `05-profile.spec.ts` - Profile features
- `06-downloads.spec.ts` - All download formats

**Test Count:** 6 test files covering core functionality

---

## 🔧 Configuration

### Playwright Config (`playwright.config.js`)

**Key Settings:**
- **Workers:** 1 (sequential execution)
- **Base URL:** Production frontend
- **Timeouts:** 2min per test
- **Reporters:** HTML, JSON, JUnit, List
- **Screenshots:** On failure
- **Videos:** On failure

**Browsers:**
- Chromium, Firefox, WebKit
- Mobile Chrome, Mobile Safari

---

## 📊 Test Data

All test data is in `tests/fixtures/test-data.json`:

**Job Descriptions:**
- Marketing Manager
- Senior Software Engineer

**Sample Answers:**
- Marketing questions (5 answers)
- Engineering questions (3 answers)

**Profile Data:**
- Default profile information

**Modify this file** to test with different scenarios.

---

## 💡 Usage Tips

### Manual Testing with Test Tracker

**Getting Started:**
```bash
# Open the tracker
open tools/test-tracker.html
```

**Features:**
- Check off steps as you complete them
- Mark tests as Pass/Fail/Skip
- Add detailed notes for each test
- Use Quick Notes for general observations
- Export comprehensive test report

**Progress Auto-Saves:** All progress saved to browser localStorage

### Recording Tests

**Basic Recording:**
```bash
./scripts/record-test.sh --name login-flow
```

**Advanced Options:**
```bash
# Record against localhost
./scripts/record-test.sh --local --name signup

# Generate TypeScript
./scripts/record-test.sh --typescript

# Save to specific file
./scripts/record-test.sh -o tests/e2e/custom.spec.js
```

**Generated tests saved to:** `tests/recorded/`

### Playwright Testing

**Single test file:**
```bash
npx playwright test 02-resume-generation
```

**Single test case:**
```bash
npx playwright test -g "Complete Resume Generation Flow"
```

**UI mode** (best for development):
```bash
npm run test:e2e:ui
```
- Real-time execution
- DOM inspection
- Time-travel debugging
- Auto-rerun on changes

---

## 📈 Monitoring Tests

### VS Code Tasks (Configured)

Press `Ctrl+Shift+P` → "Tasks: Run Task":
- **Run E2E Tests (UI Mode)** - Best for monitoring
- **Run E2E Tests (Headed)** - Watch browser
- **Run E2E Tests (Headless)** - Fast execution
- **Show Test Report** - View last results

### Terminal Output

Tests show progress in real-time:
```
✅ Step 2.1: Started resume creation
✅ Step 2.2: Job description analyzed
✅ Step 2.3: 4 questions generated (correct range)
✅ Step 2.4: Answered all questions
✅ Step 2.5: Resume generation started
✅ Step 2.6: Resume content verified - all checks passed
```

---

## 🔄 CI/CD Integration

Tests are configured for CI environments:
- Retries: 2 (in CI)
- Workers: 1 (sequential)
- Reports: HTML + JSON + JUnit

**GitHub Actions integration:**
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  
- name: Upload Test Report
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: tests/reports/
```

---

## 🆘 Troubleshooting

**"Cannot find module '@playwright/test'"**
```bash
npm install
```

**Browsers not installed:**
```bash
npx playwright install
```

**System dependencies missing (Linux):**
```bash
sudo npx playwright install-deps
```

**Test timeout:**
- Increase timeout in config
- Check production API is responsive
- Verify network connection

**Authentication fails:**
- Check if already logged in
- Clear browser storage
- Use incognito mode

---

## 📝 Adding New Tests

### Manual Testing
Edit `tools/test-tracker.html` and add to `testData` object:
```javascript
{
  title: "New Test Section",
  tests: [{
    id: "X.Y",
    title: "Test Name",
    steps: ["Step 1", "Step 2"],
    expectedResults: ["Result 1", "Result 2"]
  }]
}
```

### Recording Tests
```bash
# Record your interaction
./scripts/record-test.sh --name my-feature

# Enhance with AI or manually edit
# Move to tests/e2e/ if needed
```

### Writing E2E Tests
1. **Create spec file** in `tests/e2e/`
2. **Import helpers:**
   ```typescript
   import { test, expect } from '@playwright/test';
   import { CVstomizePage } from './helpers';
   ```
3. **Use Page Object Model:**
   ```typescript
   const cvPage = new CVstomizePage(page);
   await cvPage.clickCreateResume();
   ```
4. **Follow naming convention:** `##-test-name.spec.ts`
5. **Add test data** to `fixtures/test-data.json` if needed

---

## 🎓 Learn More

- **Complete Testing Hub:** [`../TESTING_WORKSPACE.md`](../TESTING_WORKSPACE.md)
- **Quick Start:** [`../START_TESTING.md`](../START_TESTING.md)
- **Playwright Docs:** https://playwright.dev
- **Codegen Guide:** [`../docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md`](../docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md)
- **Manual Test Guide:** [`../COMPLETE_UI_TESTING_GUIDE.md`](../COMPLETE_UI_TESTING_GUIDE.md)

---

**Happy Testing! 🧪✨**
