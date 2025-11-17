# 🧪 CVStomize Testing Guide

This project uses **two complementary testing approaches** to ensure comprehensive coverage and reliability.

---

## 🚀 Quick Start

### 1️⃣ Setup (First Time Only)

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Setup autonomous testing (includes API key prompt)
npm run test:setup
```

### 2️⃣ Run Tests

```bash
# 🤖 AI-Powered Autonomous Tests (Recommended)
npm run test:autonomous              # Run all tests with AI
npm run test:autonomous:headed       # Run with visible browser
npm run test:progress                # View progress dashboard

# 🎭 Playwright Traditional Tests
npm run test:e2e                     # Run all Playwright tests
npm run test:e2e:ui                  # Interactive UI mode
npm run test:report                  # View test reports
```

---

## 🤖 Autonomous AI Testing (Gemini-Powered)

**What it does:**
- Runs 50+ comprehensive UI tests autonomously
- Adapts to UI changes using Gemini AI
- Pauses for human verification when needed
- Tracks progress and resumes from checkpoints
- Takes screenshots at every step

**Key Features:**
- ✅ Intelligent element detection (no brittle selectors)
- ✅ Self-healing test logic with alternatives
- ✅ Real-time progress tracking via JSON checkpoint
- ✅ Human intervention workflow for subjective tests
- ✅ Detailed AI reasoning in logs

**Requirements:**
- Gemini API key (free tier: 60 requests/min)
- Set `GEMINI_API_KEY` environment variable

**Test Coverage:**
- Authentication (7 tests)
- Resume Generation - No Upload (6 tests)
- Resume Generation - With Upload (6 tests)
- Resume History (8 tests)
- Profile Management (4 tests)
- Downloads (6 tests)
- Edge Cases (5 tests)

**Progress Tracking:**
```bash
# View full dashboard
npm run test:progress

# View only summary
node tests/view-test-progress.cjs --summary

# View failed tests
node tests/view-test-progress.cjs --failed

# View pending tests
node tests/view-test-progress.cjs --pending
```

📖 **Full Documentation:** [`docs/testing/AUTONOMOUS_TESTING_GUIDE.md`](docs/testing/AUTONOMOUS_TESTING_GUIDE.md)

---

## 🎭 Playwright Testing (Traditional)

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

| Scenario | Use Autonomous AI | Use Playwright |
|----------|------------------|----------------|
| **Full regression testing** | ✅ Best choice | ⚠️ Slower |
| **Quick smoke tests** | ⚠️ Slower setup | ✅ Best choice |
| **UI changes frequently** | ✅ Self-healing | ❌ Breaks easily |
| **Need human verification** | ✅ Built-in | ❌ Manual |
| **CI/CD pipeline** | ⚠️ Requires API key | ✅ No dependencies |
| **Local development** | ✅ Great for exploration | ✅ Fast feedback |
| **First time testing** | ✅ More forgiving | ⚠️ Requires setup |

**Recommendation:** Use **Autonomous AI** for comprehensive manual testing sessions, and **Playwright** for quick smoke tests and CI/CD pipelines.

---

## 📊 Test Reports & Artifacts

### Autonomous Testing
- **Progress:** `tests/test-progress.json` (checkpoint file)
- **Screenshots:** `tests/reports/screenshots/` (every step)
- **Logs:** Console output with AI reasoning

### Playwright Testing
- **HTML Report:** `tests/reports/html/` (view with `npm run test:report`)
- **JSON Results:** `tests/reports/results.json`
- **Screenshots:** Only on failures
- **Videos:** Only on failures

---

## 🛠️ VS Code Integration

### Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- **Run Autonomous Tests (AI-Powered)** - Run all AI tests
- **Run Autonomous Tests (Visible Browser)** - Watch tests run
- **View Test Progress Dashboard** - Check test status
- **Run E2E Tests (UI Mode)** - Playwright UI
- **Show Test Report** - Open HTML report

### Debug Configurations (F5)
- **Run Autonomous Tests (AI)** - Debug AI test runner
- **View Test Progress** - Check progress in debug
- **Run Playwright Tests** - Debug Playwright tests

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for Autonomous AI Testing
GEMINI_API_KEY=your-gemini-api-key-here

# Optional
HEADLESS=true                    # false to see browser
SLOW_MO=0                        # ms delay between actions

# For authenticated tests
GOOGLE_TEST_EMAIL=test@example.com
GOOGLE_TEST_PASSWORD=your-password
```

### Playwright Configuration

Edit `playwright.config.js` to customize:
- Base URL (production vs staging)
- Timeouts
- Browsers to test
- Reporter options

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY not set"
```bash
export GEMINI_API_KEY="your-key"
# Or add to ~/.bashrc for persistence
```

### "Browsers not installed"
```bash
npx playwright install
```

### "Element not found"
- AI will automatically try alternatives
- Increase `SLOW_MO` for slow networks
- Check screenshots in `tests/reports/screenshots/`

### "Test stuck in 'running' state"
```bash
# Edit tests/test-progress.json
# Change status from "running" to "not-started"
```

### Browser won't close
```bash
pkill -f chromium
# or
pkill -f "Google Chrome"
```

---

## 📚 Additional Resources

- **Complete UI Testing Guide:** [`COMPLETE_UI_TESTING_GUIDE.md`](COMPLETE_UI_TESTING_GUIDE.md)
- **AI Testing Guide:** [`docs/testing/AI_TESTING_GUIDE.md`](docs/testing/AI_TESTING_GUIDE.md)
- **Autonomous Testing Guide:** [`docs/testing/AUTONOMOUS_TESTING_GUIDE.md`](docs/testing/AUTONOMOUS_TESTING_GUIDE.md)
- **Project Structure:** [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)
- **AI Code Standards:** [`.ai-instructions.md`](.ai-instructions.md)

---

## 📈 Testing Best Practices

1. **Run autonomous tests before major releases** - Catch UI regressions
2. **Use Playwright for quick validation** - Fast feedback during development
3. **Monitor test progress** - Use dashboard to track failing tests
4. **Review AI reasoning** - Learn from AI decisions in console output
5. **Keep checkpoints** - Commit `test-progress.json` after successful runs
6. **Update test data** - Keep job descriptions and answers realistic
7. **Check screenshots** - Visual verification of failures

---

## 🤝 Contributing Tests

### Adding Autonomous Tests

Edit `tests/test-progress.json`:
```json
"new-category": {
  "test-id": {
    "name": "Test Name",
    "status": "not-started",
    "result": null,
    "lastAttempt": null,
    "notes": "",
    "requiresHuman": false
  }
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

---

**Questions?** Check the detailed guides in [`docs/testing/`](docs/testing/)
