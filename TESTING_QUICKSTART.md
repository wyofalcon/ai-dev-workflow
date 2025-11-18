# 🚀 Quick Start: Automated Testing

## Run Tests in 3 Steps

### 1. Open VS Code Command Palette
Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)

### 2. Type and Select
```
Tasks: Run Task
```

### 3. Choose Test Mode

**Recommended for monitoring:**
```
▶️ Run E2E Tests (UI Mode)
```
This opens an interactive UI where you can:
- Watch tests run in real-time
- See each step execute
- Inspect the page at any point
- Time-travel through test execution
- Re-run failed tests

**Other options:**
- `Run E2E Tests (Headed)` - See browser window
- `Run E2E Tests (Headless)` - Fast, no UI
- `Show Test Report` - View last results

---

## Or Run from Terminal

```bash
# Interactive UI (BEST for monitoring)
npm run test:e2e:ui

# With visible browser
npm run test:e2e:headed

# Headless (fast)
npm run test:e2e

# View report
npm run test:report
```

---

## What Gets Tested Automatically

✅ **Authentication**
- Google SSO signup/login
- Email/password signup/login
- Profile completion modal

✅ **Resume Generation**
- Job description input
- 2-5 questions generated (NOT 11)
- Answer questions
- Generate resume
- Verify NO placeholders
- Verify real user name (not "Alex Johnson")

✅ **Downloads**
- Markdown (.md)
- PDF Modern template
- PDF Classic template
- PDF Minimal template

✅ **Critical Checks on Every Test**
- No `[Your Company]` brackets
- No `[City, State]` brackets
- No "Alex Johnson" fake name
- No "John Doe" placeholder
- No "11 questions" text

---

## Test Reports Location

After tests run, find results in:
```
tests/reports/
├── html/              # HTML report (open index.html)
├── screenshots/       # Failure screenshots
└── results.json       # JSON results
```

---

## Test Data

Customize test scenarios in:
```
tests/fixtures/test-data.json
```

Includes:
- Job descriptions
- Sample answers
- Profile data

---

## Need Help?

Read the full guide:
```
tests/README.md
```

---

**That's it! Your automated testing workspace is ready.** 🎉
