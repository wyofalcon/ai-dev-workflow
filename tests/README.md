# CVstomize Testing Suite

**Created:** November 15, 2025  
**Updated:** November 16, 2025  
**Purpose:** Comprehensive automated E2E testing with AI-powered autonomous execution  
**Tools:** Playwright (TypeScript), Gemini AI, Puppeteer

---

## 🚀 Quick Start

### Choose Your Testing Approach

#### 🤖 **Autonomous AI Testing (Recommended)**
Gemini-powered testing that adapts to UI changes and runs with minimal intervention.

```bash
# Setup (first time only)
./setup-autonomous-testing.sh

# Run all tests autonomously
node autonomous-test-runner.cjs

# Run with visible browser
HEADLESS=false node autonomous-test-runner.cjs

# View progress dashboard
node view-test-progress.cjs
```

📖 **Full Guide:** [`docs/testing/AUTONOMOUS_TESTING_GUIDE.md`](../docs/testing/AUTONOMOUS_TESTING_GUIDE.md)

#### 🎭 **Playwright Testing (Traditional)**
Structured TypeScript tests for specific scenarios.

```bash
# Watch tests with UI
npm run test:e2e:ui

# Run all tests headless
npm run test:e2e

# View reports
npm run test:report
```

---

## 📁 Test Structure

```
tests/
├── autonomous-test-runner.cjs          # 🤖 AI-powered autonomous test orchestrator
├── view-test-progress.cjs              # 📊 Progress dashboard & viewer
├── test-progress.json                  # ✅ Test checkpoint file (auto-updated)
├── setup-autonomous-testing.sh         # ⚙️  Quick setup script
├── ai-enhanced-test-suite.cjs          # 🧠 AI test enhancements (legacy)
├── complete-automated-suite.cjs        # 🎯 Complete test suite (legacy)
├── e2e/                                # Playwright TypeScript tests
│   ├── 01-authentication.spec.ts
│   ├── 02-resume-generation.spec.ts
│   ├── 03-resume-with-upload.spec.ts
│   ├── 04-resume-history.spec.ts
│   ├── 05-profile.spec.ts
│   ├── 06-downloads.spec.ts
│   └── helpers.ts
├── fixtures/
│   └── test-data.json                  # Test data (job descriptions, answers)
└── reports/
    ├── html/                           # HTML test reports
    ├── screenshots/                    # Step-by-step screenshots
    └── results.json                    # Machine-readable results
```

---

## 🎯 Test Coverage

### 🤖 Autonomous Testing (50+ Tests)

The autonomous system tests 50+ scenarios across 6 categories:

1. **Authentication (7 tests)** - SSO, email/password, password reset, logout
2. **Resume Generation - No Upload (6 tests)** - Full creation flow
3. **Resume Generation - With Upload (6 tests)** - Hybrid resume flow
4. **Resume History (8 tests)** - Browse, search, filter, manage
5. **Profile Management (4 tests)** - View, edit, avatar, counter
6. **Downloads (6 tests)** - Markdown, PDF templates, timestamps
7. **Edge Cases (5 tests)** - Validation, limits, error handling

**Progress Tracking:**
- Real-time checkpoint system
- Resume from last test
- Pass/fail/undetermined results
- Human intervention workflow

### 🎭 Playwright Tests (Traditional)

**Implemented:**
- `01-authentication.spec.ts` - Google SSO, email/password auth
- `02-resume-generation.spec.ts` - Complete generation flow
- `06-downloads.spec.ts` - All download formats

**To Be Implemented:**
- `03-resume-with-upload.spec.ts` - Upload & hybrid flow
- `04-resume-history.spec.ts` - History management
- `05-profile.spec.ts` - Profile features

---

## 🔧 Configuration

### Autonomous Testing Config

**Environment Variables:**
```bash
export GEMINI_API_KEY="your-api-key"  # Required
export HEADLESS="false"                # Optional: visible browser
export SLOW_MO="500"                   # Optional: slow down actions
```

**Features:**
- Gemini 2.0 Flash (latest experimental model)
- Intelligent element detection
- Self-healing test logic
- Auto-retry with alternatives
- Screenshot every step
- Real-time progress tracking

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

### Autonomous Testing

**View Progress:**
```bash
node view-test-progress.cjs             # Full dashboard
node view-test-progress.cjs --summary   # Summary only
node view-test-progress.cjs --failed    # Failed tests only
node view-test-progress.cjs --pending   # Pending tests
```

**Human Intervention:**
- Tests pause automatically when manual verification needed
- Browser stays open for inspection
- Terminal prompts: `pass`, `fail`, or `skip`
- Add notes: `pass - looks good`, `fail - missing skills`

**Resume Testing:**
- Tests save state in `test-progress.json`
- Automatically resumes from last checkpoint
- Can restart specific tests by editing JSON

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
