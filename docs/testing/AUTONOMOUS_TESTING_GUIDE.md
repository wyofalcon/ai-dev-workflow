# Autonomous Testing System with Gemini AI

**CVStomize Testing Framework v2.0**

## 🎯 Overview

This autonomous testing system uses Google's Gemini AI to run comprehensive UI tests with minimal human intervention. The system:

- **Runs tests autonomously** from a structured checklist
- **Adapts to UI changes** using AI-powered element detection
- **Tracks progress in real-time** via JSON state file
- **Resumes from last checkpoint** after interruptions
- **Pauses for human verification** when needed
- **Generates detailed reports** with screenshots

---

## 📋 Features

### 1. **Intelligent Test Execution**
- Gemini AI analyzes page state and determines next actions
- Adapts to UI changes without updating selectors
- Suggests alternatives when primary actions fail
- Self-healing test logic

### 2. **Progress Tracking**
- Persistent JSON checkpoint system
- Resume testing from last point
- Real-time status updates
- Detailed test history

### 3. **Human Intervention Workflow**
- Automatically pauses for manual verification tests
- Clear prompts for human input
- Records human decisions (pass/fail/skip)
- Continues autonomously after human input

### 4. **Comprehensive Reporting**
- Screenshot capture at each step
- Detailed logs with AI reasoning
- Summary statistics and pass rates
- Exportable test results

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. Install dependencies
npm install puppeteer @google/generative-ai

# 2. Get Gemini API key
# Visit: https://makersuite.google.com/app/apikey

# 3. Set environment variable
export GEMINI_API_KEY="your-api-key-here"

# Optional: Add to ~/.bashrc or ~/.zshrc for persistence
echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

### Running Tests

```bash
# Run all tests autonomously
node tests/autonomous-test-runner.cjs

# Run in headed mode (see browser)
HEADLESS=false node tests/autonomous-test-runner.cjs

# Run with slow motion (500ms between actions)
SLOW_MO=500 HEADLESS=false node tests/autonomous-test-runner.cjs

# View current progress
node tests/view-test-progress.cjs

# View summary only
node tests/view-test-progress.cjs --summary

# View failed tests
node tests/view-test-progress.cjs --failed

# View pending tests
node tests/view-test-progress.cjs --pending

# View specific category
node tests/view-test-progress.cjs --category=authentication
```

---

## 📖 How It Works

### Test Execution Flow

```
┌─────────────────────────────────────────────────┐
│ 1. Load test-progress.json                     │
│    - Find next pending test                     │
│    - Resume from checkpoint                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Initialize Browser & AI                     │
│    - Launch Puppeteer                           │
│    - Connect to Gemini API                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. For Each Test:                               │
│    a. Mark as "running"                         │
│    b. Get page context (URL, text, buttons)     │
│    c. Ask AI: "What should I do next?"          │
│    d. Execute AI-suggested action               │
│    e. Take screenshot                           │
│    f. Repeat until test complete                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Human Intervention (if needed)               │
│    - Pause execution                            │
│    - Display browser to human                   │
│    - Prompt: "pass/fail/skip"                   │
│    - Record human decision                      │
│    - Continue to next test                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Update Progress & Report                     │
│    - Mark test complete (pass/fail/undetermined)│
│    - Save checkpoint to JSON                    │
│    - Generate summary statistics                │
└─────────────────────────────────────────────────┘
```

### AI Decision Making

The AI receives context for each step:

**Input to Gemini:**
```javascript
{
  currentGoal: "Click the Sign Up button",
  pageURL: "https://cvstomize.../",
  pageTitle: "CVStomize - AI Resume Builder",
  visibleText: "Sign Up | Login | Create Resume...",
  buttons: ["Sign Up", "Login", "Create Resume"],
  inputs: ["email", "password"],
  previousActions: ["navigate", "wait"]
}
```

**Output from Gemini:**
```javascript
{
  analysis: "User is on homepage, needs to click signup",
  nextAction: "click",
  target: "button:has-text('Sign Up')",
  reasoning: "Sign Up button is visible in navigation",
  confidence: "high",
  alternatives: [
    "[data-testid='signup-button']",
    "a[href='/signup']"
  ],
  humanNeeded: false
}
```

---

## 📂 File Structure

```
tests/
├── autonomous-test-runner.cjs      # Main autonomous test orchestrator
├── view-test-progress.cjs          # Progress dashboard/viewer
├── test-progress.json              # Checkpoint file (auto-updated)
├── reports/
│   ├── screenshots/                # Step-by-step screenshots
│   │   ├── authentication-1.1-click-1732565123.png
│   │   ├── authentication-1.1-type-1732565125.png
│   │   └── ...
│   ├── html/                       # HTML test reports
│   └── results.json                # Machine-readable results
└── e2e/                            # Playwright test specs (reference)
    ├── 01-authentication.spec.ts
    ├── 02-resume-generation.spec.ts
    └── ...
```

---

## 🎯 Test Categories

The system tests 50+ scenarios across 6 categories:

### 1. Authentication (7 tests)
- Google SSO signup/login
- Email/password signup/login
- Password reset
- Logout
- Profile completion modal

### 2. Resume Generation - No Upload (6 tests)
- Start creation
- Job description input
- AI question generation
- Answer questions
- Generate resume
- Verify content *(requires human)*

### 3. Resume Generation - With Upload (6 tests)
- Upload existing resume
- Job description input
- Gap analysis questions
- Answer gap questions
- Generate hybrid resume *(requires human)*

### 4. Resume History (8 tests)
- Navigate to history
- Card display
- Search functionality
- Filter dropdown
- View resume details
- Download from history
- Delete resume
- Empty state

### 5. Profile Management (4 tests)
- View profile
- Edit profile
- Avatar display
- Resume counter

### 6. Downloads (6 tests)
- Download Markdown
- Download PDF (Modern/Classic/Minimal)
- Multiple downloads
- Timestamp updates

### 7. Edge Cases (5 tests)
- Resume limit enforcement
- Empty inputs
- Unsupported files
- Corrupted files

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
export GEMINI_API_KEY="your-api-key"

# Optional
export HEADLESS="false"           # Run with visible browser
export SLOW_MO="500"              # Slow down actions (ms)
```

### Config File (`autonomous-test-runner.cjs`)

```javascript
const CONFIG = {
  APP_URL: 'https://cvstomize-frontend-351889420459.us-central1.run.app',
  PROGRESS_FILE: 'tests/test-progress.json',
  SCREENSHOTS_DIR: 'tests/reports/screenshots',
  HEADLESS: process.env.HEADLESS !== 'false',
  SLOW_MO: parseInt(process.env.SLOW_MO || '0'),
  GEMINI_MODEL: 'gemini-2.0-flash-exp', // Latest model
};
```

---

## 👤 Human Intervention

### When Does It Happen?

Tests marked with `requiresHuman: true` pause for manual verification:

- **Resume content verification** - AI can't judge quality/accuracy
- **Visual layout checks** - PDF formatting, alignment
- **Subjective assessments** - "Is this a good resume?"

### Human Prompt Example

```
⏸️  ═══════════════════════════════════════════════════════
   HUMAN INTERVENTION REQUIRED
   ═══════════════════════════════════════════════════════
   Test: Resume Preview & Content Verification
   Reason: AI cannot verify resume quality and accuracy

   Please review the browser and provide input:
   - Type "pass" if test passed
   - Type "fail" if test failed
   - Type "skip" to skip this test
   - Add notes after result (e.g., "pass - looks good")
   ═══════════════════════════════════════════════════════

   Your input: _
```

### Responding

```bash
# Pass test
pass

# Pass with notes
pass - Resume looks accurate, all sections present

# Fail test
fail - Contact info shows fake name

# Fail with notes
fail - Missing skills section

# Skip test
skip - Cannot verify at this time
```

---

## 📊 Progress Tracking

### test-progress.json Structure

```json
{
  "lastRun": "2024-11-16T10:30:00.000Z",
  "currentTest": "authentication.1.3-google-sso-login",
  "tests": {
    "authentication": {
      "1.1-google-sso-signup": {
        "name": "Google SSO Signup (New User)",
        "status": "completed",
        "result": "pass",
        "lastAttempt": "2024-11-16T10:25:00.000Z",
        "notes": "Successfully signed up with Google",
        "requiresHuman": false
      },
      "1.2-email-password-signup": {
        "name": "Email/Password Signup",
        "status": "completed",
        "result": "fail",
        "lastAttempt": "2024-11-16T10:27:00.000Z",
        "notes": "Email verification not sent",
        "requiresHuman": false
      },
      "1.3-google-sso-login": {
        "name": "Google SSO Login",
        "status": "running",
        "result": null,
        "lastAttempt": "2024-11-16T10:30:00.000Z",
        "notes": "",
        "requiresHuman": false
      }
    }
  }
}
```

### Test Statuses

- **`not-started`** - Test hasn't run yet
- **`running`** - Currently executing
- **`completed`** - Finished (check `result` field)
- **`needs-human`** - Paused, waiting for human
- **`skipped`** - Human chose to skip
- **`failed`** - Automation failed (not test failure)

### Test Results

- **`pass`** - Test passed successfully
- **`fail`** - Test failed (bug found)
- **`undetermined`** - Couldn't determine pass/fail
- **`null`** - Not completed yet

---

## 📈 Viewing Progress

### Dashboard View

```bash
node tests/view-test-progress.cjs
```

**Output:**
```
═════════════════════════════════════════════════════════════════
  CVSTOMIZE TEST PROGRESS DASHBOARD
═════════════════════════════════════════════════════════════════
  Last Run: Nov 16, 10:30 AM
  Current Test: authentication.1.3-google-sso-login

  Overall Progress
  ──────────────────────────────────────────────────────────────
  ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 42.0%
  21 of 50 tests completed

  Test Results
  ──────────────────────────────────────────────────────────────
  ✅ Passed:         18
  ❌ Failed:          3
  ❓ Undetermined:    0
  ⏸️  Needs Human:    2
  🏃 Running:         1
  ⏭️  Skipped:        0
  ⏳ Not Started:    26

  Pass Rate: 85.7%
═════════════════════════════════════════════════════════════════
```

### Category Details

```bash
node tests/view-test-progress.cjs --category=authentication
```

### Failed Tests Only

```bash
node tests/view-test-progress.cjs --failed
```

---

## 🐛 Troubleshooting

### "AI guidance failed"

**Cause:** API key issue or rate limit

**Solution:**
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Check API quota
# Visit: https://console.cloud.google.com/apis/api/generativeai.googleapis.com

# Wait 1 minute if rate limited (60 requests/min free tier)
```

### "Element not found"

**Cause:** UI changed or slow network

**Solution:**
- AI will automatically try alternatives
- Increase `SLOW_MO` to give page more time to load
- Check screenshots in `tests/reports/screenshots/`

### "Test stuck in 'running' state"

**Cause:** Previous run crashed

**Solution:**
```bash
# Manually edit test-progress.json
# Change status from "running" to "not-started"

# Or reset all tests:
cp tests/test-progress.json tests/test-progress.backup.json
# Edit test-progress.json and set all statuses to "not-started"
```

### "Browser won't close"

**Cause:** Test crashed mid-execution

**Solution:**
```bash
# Kill all Chrome/Chromium processes
pkill -f chromium

# Or on macOS:
pkill -f "Google Chrome for Testing"
```

---

## 💡 Best Practices

### For Running Tests

1. **Start with headed mode** to watch AI in action:
   ```bash
   HEADLESS=false node tests/autonomous-test-runner.cjs
   ```

2. **Use slow motion** for debugging:
   ```bash
   SLOW_MO=1000 HEADLESS=false node tests/autonomous-test-runner.cjs
   ```

3. **Check progress frequently**:
   ```bash
   node tests/view-test-progress.cjs --summary
   ```

4. **Review failed tests immediately**:
   ```bash
   node tests/view-test-progress.cjs --failed
   ```

### For Human Intervention

1. **Be Ready:** Tests pause unpredictably - monitor the terminal
2. **Be Specific:** Add detailed notes when marking pass/fail
3. **Take Screenshots:** Capture issues for bug reports
4. **Resume Quickly:** Long pauses may timeout browser session

### For Collaboration

1. **Commit progress file** after successful runs:
   ```bash
   git add tests/test-progress.json
   git commit -m "test: updated progress after Session 30 testing"
   ```

2. **Share failed test screenshots**:
   ```bash
   git add tests/reports/screenshots/*error*.png
   git commit -m "test: screenshots of failures in auth flow"
   ```

3. **Reset progress** for fresh runs by collaborators:
   ```bash
   # In test-progress.json, set all:
   # "status": "not-started"
   # "result": null
   # "notes": ""
   ```

---

## 🎓 Advanced Usage

### Running Specific Test

Currently tests run sequentially. To run a specific test, edit `test-progress.json`:

1. Set all tests before target to `"status": "completed"`
2. Set target test to `"status": "not-started"`
3. Set all tests after to `"status": "not-started"`
4. Run: `node tests/autonomous-test-runner.cjs`

### Customizing AI Behavior

Edit `autonomous-test-runner.cjs`:

```javascript
// Change AI model
GEMINI_MODEL: 'gemini-2.0-flash-exp',  // Fast, experimental
// or
GEMINI_MODEL: 'gemini-1.5-pro',        // Slower, more accurate

// Adjust AI creativity
generationConfig: {
  temperature: 0.7,  // Lower = more deterministic
  maxOutputTokens: 1000,
}

// Change max steps per test
let maxSteps = 20;  // Increase for complex tests
```

### Adding New Tests

1. **Edit `test-progress.json`** - Add new test entry:
   ```json
   "7.1-new-feature-test": {
     "name": "Test New Feature",
     "status": "not-started",
     "result": null,
     "lastAttempt": null,
     "notes": "",
     "requiresHuman": false
   }
   ```

2. **Run tests** - AI will automatically execute new test

---

## 📞 Support & Resources

- **Main Testing Guide:** `/COMPLETE_UI_TESTING_GUIDE.md`
- **AI Testing Guide:** `/docs/testing/AI_TESTING_GUIDE.md`
- **Project Structure:** `/PROJECT_STRUCTURE.md`
- **Roadmap:** `/ROADMAP.md`

---

## 🚀 Roadmap

### Planned Features

- [ ] Parallel test execution (multiple browsers)
- [ ] Visual regression testing with AI
- [ ] Automatic bug report generation
- [ ] Integration with CI/CD (GitHub Actions)
- [ ] Test result export (HTML, PDF reports)
- [ ] Slack/Discord notifications
- [ ] Performance metrics tracking
- [ ] Cross-browser testing (Firefox, Safari)
- [ ] Mobile device emulation

---

**Version:** 2.0  
**Last Updated:** November 16, 2025  
**Maintained by:** CVStomize Team
