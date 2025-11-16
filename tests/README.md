# CVstomize Automated Testing Workspace

**Created:** November 15, 2025  
**Purpose:** Automated E2E testing based on COMPLETE_UI_TESTING_GUIDE.md  
**Tools:** Playwright, TypeScript

---

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Run Tests

**Watch tests with UI (Recommended for monitoring):**
```bash
npm run test:e2e:ui
```

**Run all tests in headless mode:**
```bash
npm run test:e2e
```

**Run with browser visible (headed mode):**
```bash
npm run test:e2e:headed
```

**Debug mode (step through tests):**
```bash
npm run test:e2e:debug
```

### 3. View Reports
```bash
npm run test:report
```

---

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── 01-authentication.spec.ts      # Section 1: Auth & Account Management
│   ├── 02-resume-generation.spec.ts   # Section 2: Resume Generation (No Upload)
│   ├── 03-resume-with-upload.spec.ts  # Section 3: Resume Generation (With Upload)
│   ├── 04-resume-history.spec.ts      # Section 4: Resume History & Management
│   ├── 05-profile.spec.ts             # Section 5: Profile Management
│   ├── 06-downloads.spec.ts           # Section 6: Downloads & Export
│   └── helpers.ts                      # Page Object Model & utilities
├── fixtures/
│   └── test-data.json                  # Test data (job descriptions, answers)
└── reports/
    ├── html/                           # HTML test reports
    ├── screenshots/                    # Failure screenshots
    └── results.json                    # JSON results
```

---

## 🎯 Test Coverage

### ✅ Implemented Tests

**Authentication (01-authentication.spec.ts):**
- Test 1.1: Google SSO Signup
- Test 1.2: Email/Password Signup
- Test 1.3: Google SSO Login
- Test 1.6: Logout
- Test 1.7: Profile Completion Modal

**Resume Generation (02-resume-generation.spec.ts):**
- Test 2.1-2.6: Complete flow without existing resume
  - Job description input
  - Question generation (2-5 questions, NOT 11)
  - Answer questions
  - Generate resume
  - Verify content (no placeholders, real user name)

**Downloads (06-downloads.spec.ts):**
- Test 6.1: Markdown download
- Test 6.2: PDF Modern template
- Test 6.3: PDF Classic template
- Test 6.4: PDF Minimal template
- Test 6.5: Multiple downloads

### 📋 To Be Implemented

- Test 3.x: Resume generation WITH upload
- Test 4.x: Resume history & management
- Test 5.x: Profile management
- Test 7.x: Responsive design & browser compatibility

---

## 🔧 Configuration

### Playwright Config (`playwright.config.js`)

**Key Settings:**
- **Workers:** 1 (sequential execution for monitoring)
- **Base URL:** Production frontend
- **Timeouts:** 2min per test (resume generation takes 30s+)
- **Reporters:** HTML, JSON, JUnit, List (terminal)
- **Screenshots:** On failure
- **Videos:** On failure

**Browsers:**
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

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

## 🐛 Critical Checks (Automated)

Every test verifies:
- ✅ No "Alex Johnson" placeholder
- ✅ No "John Doe" placeholder
- ✅ No `[Your Company]` brackets
- ✅ No `[City, State]` brackets
- ✅ Real user name displayed
- ✅ No "11 questions" text
- ✅ 2-5 questions generated (correct range)

---

## 💡 Usage Tips

### Running Specific Tests

**Single test file:**
```bash
npx playwright test 02-resume-generation
```

**Single test case:**
```bash
npx playwright test -g "Complete Resume Generation Flow"
```

**Specific browser:**
```bash
npx playwright test --project=chromium
```

### Watching Tests

The **UI mode** (`npm run test:e2e:ui`) is best for development:
- See tests run in real-time
- Inspect DOM at each step
- Time-travel debugging
- Watch mode (re-run on file changes)

### Test Authentication

**For tests requiring login:**
1. Create auth fixtures for persistent sessions
2. Or use `test.use({ storageState: 'auth.json' })`
3. Run login once, save state, reuse across tests

**Google SSO tests:**
- Currently skipped (require credentials)
- Set `GOOGLE_TEST_EMAIL` env var to enable
- Or mock OAuth flow

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

- **Playwright Docs:** https://playwright.dev
- **Test Guide:** `COMPLETE_UI_TESTING_GUIDE.md`
- **Production URL:** https://cvstomize-frontend-351889420459.us-central1.run.app

---

**Happy Testing! 🚀**
