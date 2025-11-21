# 🧪 CVStomize Testing Guide

Comprehensive testing suite combining manual testing tools with automated Playwright tests.

---

## 🚀 Quick Start

### 1️⃣ Setup (First Time Only)

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### 2️⃣ Start Testing

```bash
# 📝 Interactive Manual Testing
./start-testing.sh                   # Launch testing workspace menu
open tools/test-tracker.html         # Open test tracker directly

# 🎬 Record Tests
./scripts/record-test.sh             # Record interactions
./scripts/record-test.sh --local     # Record against localhost

# 🧪 Run E2E Tests
npm run test:e2e                     # Run all Playwright tests (headless)
npm run test:e2e:ui                  # Interactive UI mode
npm run test:e2e:headed              # Run with visible browser
npm run test:report                  # View test reports
```

---

## 📝 Manual Testing with Test Tracker

**What it does:**
- Interactive checklist-based testing
- Tracks progress automatically
- Add notes for each test
- Export test reports in markdown
- Auto-saves to browser localStorage

**Features:**
- ✅ Step-by-step test guidance
- ✅ Pass/Fail/Skip marking
- ✅ Real-time progress tracking
- ✅ Quick notes for observations
- ✅ Export comprehensive test reports

**Test Coverage:**
- Authentication (4 tests)
- Resume Generation - No Upload (3 tests)
- Resume Generation - With Upload (2 tests)
- Resume History (3 tests)
- Profile Management (2 tests)
- Downloads (2 tests)

**Usage:**
```bash
# Open test tracker
open tools/test-tracker.html

# Or use the launcher
./start-testing.sh
```

📖 **Full Documentation:** [`TESTING_WORKSPACE.md`](TESTING_WORKSPACE.md)

---

## 🎬 Recording Tests with Playwright

**What it does:**
- Records your interactions as code
- Generates test scripts automatically
- Perfect for creating new tests
- Use recordings to train AI agents

**Usage:**
```bash
# Record a test
./scripts/record-test.sh

# Record with options
./scripts/record-test.sh --name signup-flow
./scripts/record-test.sh --local
./scripts/record-test.sh --typescript
```

📖 **Full Documentation:** [`docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md`](docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md)

---

## 🎭 Playwright E2E Testing

**What it does:**
- TypeScript-based structured tests
- Fast execution with parallel support
- Rich HTML reports with screenshots
- CI/CD integration ready

**Test Files:**
- `tests/e2e/01-authentication.spec.ts` - Auth flows
- `tests/e2e/02-resume-generation.spec.ts` - Resume creation
- `tests/e2e/03-resume-with-upload.spec.ts` - Upload & hybrid
- `tests/e2e/04-resume-history.spec.ts` - History management
- `tests/e2e/05-profile.spec.ts` - Profile features
- `tests/e2e/06-downloads.spec.ts` - Export functionality

**Running Specific Tests:**
```bash
# Single test file
npx playwright test 02-resume-generation

# Single test case
npx playwright test -g "Complete Resume Generation Flow"

# Specific browser
npx playwright test --project=chromium
```

📖 **Full Documentation:** [`tests/README.md`](tests/README.md)

---

## 🎯 Which Testing Approach to Use?

| Scenario | Use Manual Testing | Use Playwright E2E | Use Recording |
|----------|-------------------|-------------------|---------------|
| **Initial exploration** | ✅ Best choice | ❌ Too rigid | ⚠️ After manual |
| **Full regression** | ⚠️ Time consuming | ✅ Best choice | ❌ Not comprehensive |
| **Quick smoke tests** | ✅ Fast feedback | ✅ Automated | ❌ Overkill |
| **Finding bugs** | ✅ Best choice | ⚠️ Limited scope | ❌ Won't find bugs |
| **CI/CD pipeline** | ❌ Manual | ✅ Best choice | ❌ Manual step |
| **Creating new tests** | ⚠️ Document first | ⚠️ Write code | ✅ Best choice |
| **Training/Documentation** | ✅ Great | ⚠️ Technical | ✅ Great |

**Recommendation:** Use **Manual Testing** for initial exploration and bug finding, **Playwright E2E** for regression and CI/CD, and **Recording** to quickly create new automated tests.

---

## 📊 Test Reports & Artifacts

### Manual Testing
- **Progress:** Browser localStorage (auto-saved)
- **Reports:** Export as markdown from test tracker
- **Notes:** Per-test notes and quick notes
- **Location:** `tools/test-tracker.html`

### Playwright Testing
- **HTML Report:** `tests/reports/html/` (view with `npm run test:report`)
- **Screenshots:** On failures
- **Videos:** On first retry
- **Traces:** On first retry
- **Location:** `tests/reports/`

### Recorded Tests
- **Test Files:** `tests/recorded/`
- **Format:** JavaScript or TypeScript
- **Usage:** Can be run with Playwright or enhanced with AI

---

## 🛠️ VS Code Integration

### Using the Testing Workspace
```bash
# Open the testing workspace
code .vscode/testing.code-workspace
```

### Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- **Open Test Tracker** - Launch manual testing tool
- **Record Test** - Record interactions (production)
- **Record Test (Local)** - Record against localhost
- **Run E2E Tests (UI Mode)** - Playwright interactive mode
- **Run E2E Tests (Headed)** - Visible browser
- **Run E2E Tests (Headless)** - Fast headless mode
- **Show Test Report** - Open HTML report

### Debug Configurations (F5)
- **Record Test** - Debug test recording
- **Record Test (Local)** - Debug local recording
- **Run All E2E Tests** - Debug test execution
- **Run E2E Tests (UI)** - Debug in UI mode
- **Run E2E Tests (Headed)** - Debug with visible browser
- **Debug Current Test** - Debug open test file
- **Show Test Report** - View test results

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Optional - for authenticated tests
GOOGLE_TEST_EMAIL=test@example.com
GOOGLE_TEST_PASSWORD=your-password

# Playwright options
HEADLESS=true                    # false to see browser
SLOW_MO=0                        # ms delay between actions
```

### Playwright Configuration

Edit `playwright.config.js` to customize:
- Base URL (production vs staging)
- Timeouts
- Browsers to test
- Reporter options

---

## 🐛 Troubleshooting

### "Browsers not installed"
```bash
npx playwright install
```

### "Test tracker won't open"
```bash
# Try different methods
open tools/test-tracker.html
xdg-open tools/test-tracker.html
# Or drag file to browser
```

### "Element not found" in Playwright tests
- Re-record the test with `./scripts/record-test.sh`
- Update selectors in test file
- Check if UI has changed

### "Test tracker progress not saving"
- Check browser localStorage is enabled
- Try exporting report as backup
- Clear cache and reload if corrupted

### Browser won't close
```bash
pkill -f chromium
# or
pkill -f "Google Chrome"
```

---

## 📚 Additional Resources

- **Testing Workspace Hub:** [`TESTING_WORKSPACE.md`](TESTING_WORKSPACE.md) - Your main reference
- **Quick Start:** [`START_TESTING.md`](START_TESTING.md) - 2-minute setup
- **Complete UI Testing Guide:** [`COMPLETE_UI_TESTING_GUIDE.md`](COMPLETE_UI_TESTING_GUIDE.md) - Manual testing checklist
- **Playwright Codegen Guide:** [`docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md`](docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md) - Recording guide
- **Test Quickstart:** [`TESTING_QUICKSTART.md`](TESTING_QUICKSTART.md) - 5-minute tutorial
- **Project Structure:** [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)

---

## 📈 Testing Best Practices

1. **Start with manual testing** - Use test tracker to explore and find issues
2. **Record common flows** - Use codegen to create automated tests
3. **Run E2E before releases** - Catch regressions early
4. **Document as you test** - Add notes for every issue found
5. **Test in incognito** - Fresh sessions for authentication tests
6. **Export reports regularly** - Save your testing progress
7. **Keep tests updated** - Re-record when UI changes

---

## 🤝 Contributing Tests

### Adding Manual Test Cases

Edit `tools/test-tracker.html` and add to `testData` object:
```javascript
{
  title: "New Test Section",
  tests: [
    {
      id: "X.Y",
      title: "Test Name",
      steps: ["Step 1", "Step 2"],
      expectedResults: ["Result 1", "Result 2"]
    }
  ]
}
```

### Adding Playwright Tests

Create `tests/e2e/##-test-name.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test code
  });
});
```

Or record a test:
```bash
./scripts/record-test.sh --name feature-name
```

---

**Questions?** Check [`TESTING_WORKSPACE.md`](TESTING_WORKSPACE.md) for the complete testing hub
