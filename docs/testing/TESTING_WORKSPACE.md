# 🧪 CVstomize Testing Workspace

**Your Complete Testing Hub**

This workspace contains all the tools and guides you need for comprehensive manual and automated testing of CVstomize.

---

## 🚀 Quick Start

### Option 1: Manual Testing with Tracker
```bash
# Open the interactive test tracker
open tools/test-tracker.html
```
Then test the app and track your progress automatically.

### Option 2: Record Tests with Playwright
```bash
# Record your interactions
./scripts/record-test.sh

# Or record against localhost
./scripts/record-test.sh --local
```

### Option 3: Run Existing E2E Tests
```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI (best for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# View test report
npm run test:report
```

---

## 📁 Testing Resources

### 🛠️ Tools
| Tool | Location | Purpose |
|------|----------|---------|
| **Test Tracker** | `tools/test-tracker.html` | Interactive manual testing assistant |
| **Test Recorder** | `scripts/record-test.sh` | Record interactions with Playwright codegen |

### 📚 Guides
| Guide | Location | What It Covers |
|-------|----------|----------------|
| **Testing Quickstart** | `TESTING_QUICKSTART.md` | Get started testing in 5 minutes |
| **Complete UI Testing Guide** | `COMPLETE_UI_TESTING_GUIDE.md` | Comprehensive manual test checklist |
| **Playwright Codegen Guide** | `docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md` | Record tests for AI enhancement |
| **Full Testing Docs** | `TESTING.md` | Complete testing documentation |

### 🧪 Test Suites
| Suite | Location | Coverage |
|-------|----------|----------|
| **E2E Tests** | `tests/e2e/` | Full user journey tests |
| **Recorded Tests** | `tests/recorded/` | Tests generated from recordings |

---

## 🎯 Testing Workflows

### Workflow 1: Manual Testing Session

**Perfect for: Initial testing, UI/UX review, finding edge cases**

1. Open the test tracker:
   ```bash
   open tools/test-tracker.html
   ```

2. Open CVstomize app in another window:
   ```
   https://cvstomize-frontend-351889420459.us-central1.run.app
   ```

3. Select a test section from the sidebar

4. Follow test steps and check them off

5. Mark tests as Pass/Fail/Skip

6. Add notes for any issues

7. Use Quick Notes for general observations

8. Export test report when done

**Saves to:** Browser localStorage (auto-saves)
**Export as:** Markdown report

---

### Workflow 2: Record & Generate Tests

**Perfect for: Creating new automated tests, training AI agents**

1. Start recording:
   ```bash
   ./scripts/record-test.sh --name my-test-flow
   ```

2. Interact with the app normally

3. Generated code is saved automatically

4. Use AI to enhance the test:
   - Add assertions
   - Create variations
   - Add error handling
   - Generate test fixtures

5. Run your test:
   ```bash
   npx playwright test tests/recorded/my-test-flow-*.spec.js
   ```

**Saves to:** `tests/recorded/`
**Format:** JavaScript or TypeScript

---

### Workflow 3: Run Automated Tests

**Perfect for: Regression testing, CI/CD, quick validation**

1. Run tests with UI (recommended for watching):
   ```bash
   npm run test:e2e:ui
   ```

2. Or run headless (faster):
   ```bash
   npm run test:e2e
   ```

3. View results:
   ```bash
   npm run test:report
   ```

**Results in:** `tests/reports/`
**Artifacts:** Screenshots, videos, traces

---

## 📊 What Gets Tested

### ✅ Current Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| **Authentication** | 4 tests | ✅ Active |
| **Resume Generation (No Upload)** | 3 tests | ✅ Active |
| **Resume Generation (With Upload)** | 2 tests | ✅ Active |
| **Resume History** | 3 tests | ✅ Active |
| **Profile Management** | 2 tests | ✅ Active |
| **Downloads & Export** | 2 tests | ✅ Active |

**Total: 16 comprehensive test scenarios**

### Test Details

1. **Authentication & Account Management**
   - Google SSO signup (new user)
   - Email/password signup
   - Login with existing account
   - Logout functionality

2. **Resume Generation - WITHOUT Upload**
   - Start resume generation from scratch
   - Complete question flow
   - Generate and preview resume

3. **Resume Generation - WITH Upload**
   - Upload existing resume (PDF/DOCX)
   - Tailor uploaded resume with job description

4. **Resume History & Management**
   - View resume history
   - Edit existing resume
   - Delete resume

5. **Profile Management**
   - View profile
   - Update profile information

6. **Downloads & Export**
   - Download resume as PDF
   - Download resume as DOCX

---

## 🎨 Tool Details

### Test Tracker Features

- ✅ **Auto-Checklist**: Follows your test guide automatically
- 📊 **Progress Tracking**: Real-time stats and progress bar
- 📝 **Notes System**: Per-test and quick notes
- 💾 **Auto-Save**: Never lose your progress
- 📤 **Export**: Generate markdown test reports
- 🎯 **Section Navigation**: Jump between test sections
- 🔲 **Step Tracking**: Check off individual test steps
- 🚦 **Status Marking**: Pass/Fail/Skip buttons

### Test Recorder Features

- 🎬 **Record Actions**: Captures clicks, typing, navigation
- 🎯 **Smart Selectors**: Uses best-practice selectors
- 📝 **Code Generation**: Creates Playwright test code
- 🔧 **Flexible Options**: Save to file, choose language
- 🌐 **Local or Production**: Test any environment
- 💡 **AI Ready**: Perfect input for AI enhancement

---

## 🗂️ Directory Structure

```
cvstomize/
├── tools/                          # Testing tools
│   ├── test-tracker.html          # Interactive test tracker
│   └── README.md                  # Tools documentation
│
├── scripts/
│   └── record-test.sh             # Test recording script
│
├── tests/
│   ├── e2e/                       # E2E test suites
│   │   ├── 01-authentication.spec.ts
│   │   ├── 02-resume-generation.spec.ts
│   │   ├── 03-resume-with-upload.spec.ts
│   │   ├── 04-resume-history.spec.ts
│   │   ├── 05-profile.spec.ts
│   │   └── 06-downloads.spec.ts
│   │
│   ├── recorded/                  # Recorded tests (generated)
│   │   └── [your-recordings].spec.js
│   │
│   ├── fixtures/                  # Test data
│   │   └── test-data.json
│   │
│   └── reports/                   # Test results
│       └── html/                  # HTML reports
│
├── docs/testing/                  # Testing documentation
│   ├── PLAYWRIGHT_CODEGEN_GUIDE.md
│   └── [other guides]
│
├── TESTING_WORKSPACE.md           # This file
├── TESTING_QUICKSTART.md          # Quick start guide
├── COMPLETE_UI_TESTING_GUIDE.md   # Complete manual testing
└── TESTING.md                     # Full testing documentation
```

---

## 🎓 Learning Path

### New to Testing?
1. Read `TESTING_QUICKSTART.md` (5 min)
2. Open `tools/test-tracker.html`
3. Run through a few manual tests
4. Try recording a test with `./scripts/record-test.sh`

### Want to Write Tests?
1. Read `docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md`
2. Record some interactions
3. Review existing tests in `tests/e2e/`
4. Enhance recordings with AI assistance

### Want to Run Tests?
1. Run `npm run test:e2e:ui`
2. Watch tests execute
3. Review reports with `npm run test:report`

---

## 💡 Tips & Best Practices

### For Manual Testing:
- ✅ Test in incognito mode for fresh sessions
- ✅ Document issues as you find them
- ✅ Use Quick Notes for observations
- ✅ Export reports regularly
- ✅ Test both happy paths and error cases

### For Recording Tests:
- ✅ Record complete user journeys
- ✅ Use descriptive names
- ✅ Go slow for better code generation
- ✅ Verify states before moving on
- ✅ Record both success and failure flows

### For Running Tests:
- ✅ Use UI mode during development
- ✅ Use headless for CI/CD
- ✅ Review traces on failures
- ✅ Keep test data fresh
- ✅ Run tests before deploying

---

## 🔧 Configuration

### Test Environment URLs

**Production:**
```
https://cvstomize-frontend-351889420459.us-central1.run.app
```

**Local Development:**
```
http://localhost:3000
```

### Test Accounts

For testing authentication:
- Use your own Google account (SSO)
- Create fresh email/password accounts
- Test account: `fco.calisto@gmail.com` (Google SSO)

### Playwright Config

Location: `playwright.config.js`
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30s per test
- **Screenshots**: On failure
- **Videos**: On first retry
- **Traces**: On first retry

---

## 📈 Test Reports & Results

### Where to Find Results

**HTML Reports:**
```bash
npm run test:report
# Opens: tests/reports/html/index.html
```

**Manual Test Reports:**
```
Exported from test tracker
Format: Markdown
Contains: All test results, notes, statistics
```

**Test Artifacts:**
```
tests/test-results/
├── screenshots/
├── videos/
└── traces/
```

### Understanding Results

- **✅ Green/Pass**: Test passed successfully
- **❌ Red/Fail**: Test failed, check logs
- **⏭️ Skip**: Test skipped
- **⏳ Pending**: Not started yet

---

## 🚨 Troubleshooting

### Test Tracker Issues

**Progress not saving?**
- Check browser localStorage is enabled
- Try exporting report as backup

**Can't open test tracker?**
- Try: `open tools/test-tracker.html`
- Or double-click the file
- Or drag to browser

### Recording Issues

**Codegen won't start?**
```bash
# Install Playwright browsers
npx playwright install

# Try recording directly
npx playwright codegen https://cvstomize-frontend-351889420459.us-central1.run.app
```

**Recording saved but can't run?**
```bash
# Check the file exists
ls tests/recorded/

# Try running directly
npx playwright test [your-test-file]
```

### E2E Test Failures

**Tests timing out?**
- Increase timeout in `playwright.config.js`
- Check network connection
- Verify app is running

**Selectors not found?**
- UI may have changed
- Re-record the test
- Update selectors in test file

**Authentication failing?**
- Check test credentials
- Firebase config may need updating
- Try manual login first

---

## 🎯 Next Steps

### After Manual Testing:
1. Export your test report
2. Share findings with team
3. Create issues for bugs found
4. Record common flows for automation

### After Recording Tests:
1. Enhance recordings with AI
2. Add proper assertions
3. Create test fixtures
4. Add to CI/CD pipeline

### After Running Tests:
1. Review failures
2. Update tests if UI changed
3. Add new test coverage
4. Monitor test trends

---

## 📞 Quick Commands Reference

```bash
# MANUAL TESTING
open tools/test-tracker.html              # Open test tracker

# RECORDING TESTS
./scripts/record-test.sh                  # Record new test
./scripts/record-test.sh --local          # Record against localhost
./scripts/record-test.sh --name login     # Named recording

# RUNNING TESTS
npm run test:e2e                          # Run all tests (headless)
npm run test:e2e:ui                       # Run with UI
npm run test:e2e:headed                   # Run with visible browser
npm run test:e2e:debug                    # Debug mode
npm run test:report                       # View test report

# PLAYWRIGHT COMMANDS
npx playwright codegen [URL]              # Record interactions
npx playwright test                       # Run all tests
npx playwright test --headed              # Run with browser visible
npx playwright test --ui                  # Run in UI mode
npx playwright test --debug               # Debug tests
npx playwright show-report                # Show last report
npx playwright show-trace [trace-file]    # View trace file
```

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Codegen](https://playwright.dev/docs/codegen)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Page Object Models](https://playwright.dev/docs/pom)

---

## ✅ Testing Checklist

Use this checklist to ensure you have a complete testing setup:

- [ ] Read `TESTING_QUICKSTART.md`
- [ ] Open `tools/test-tracker.html` and familiarize yourself
- [ ] Run at least one manual test session
- [ ] Export a test report
- [ ] Record at least one test flow
- [ ] Run the E2E test suite
- [ ] Review a test report
- [ ] Understand where to find test artifacts
- [ ] Know how to troubleshoot common issues

---

**Need Help?**
- Check guides in `docs/testing/`
- Review existing tests in `tests/e2e/`
- Refer to `TESTING.md` for comprehensive documentation

**Happy Testing! 🧪✨**
