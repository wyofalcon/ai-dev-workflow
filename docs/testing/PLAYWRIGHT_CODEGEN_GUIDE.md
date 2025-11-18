# Playwright Codegen for AI-Assisted Testing

This guide shows how to use Playwright's codegen to record interactions and use them for AI-enhanced testing.

## 🎬 Quick Start

### Record a test flow:
```bash
# Using the helper script (recommended)
./scripts/record-test.sh

# Or directly with Playwright
npx playwright codegen https://cvstomize-frontend-351889420459.us-central1.run.app
```

### With options:
```bash
# Record against localhost
./scripts/record-test.sh --local

# Save with specific name
./scripts/record-test.sh --name signup-flow

# Generate TypeScript
./scripts/record-test.sh --typescript --name login-test

# Save to specific file
./scripts/record-test.sh --output tests/e2e/custom-test.spec.js
```

## 🤖 Using Recorded Code with AI

### Workflow:

1. **Record your interaction**
   ```bash
   ./scripts/record-test.sh --name user-signup
   ```

2. **Get generated code** (example):
   ```javascript
   await page.goto('https://cvstomize-frontend-351889420459.us-central1.run.app/');
   await page.getByRole('button', { name: 'Sign Up' }).click();
   await page.getByLabel('Email').fill('test@example.com');
   ```

3. **Feed to AI agent** to enhance with assertions, error handling, and test variations

## 💡 Best Practices

- Record complete user journeys (end-to-end flows)
- Use descriptive names for recordings
- Record happy path first, then error cases
- Keep recordings focused (one flow per recording)
- Clean data between recordings (use incognito mode)

See full guide for detailed workflows and examples.
