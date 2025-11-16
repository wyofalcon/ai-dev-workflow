# Visual Notes Guide - Chrome DevTools + Gemini CLI

## Overview
Chrome DevTools MCP is configured and ready to use with Gemini CLI for taking visual notes of the CVstomize application.

## Configuration Status
✅ **Extension Installed**: `chrome-devtools-mcp` (latest)
✅ **MCP Server**: `chrome-devtools` configured
✅ **Project Context**: GEMINI.md, ROADMAP.md, README.md, CREDENTIALS_SECURE.md loaded

## How to Use

### 1. Start Gemini CLI with Chrome DevTools
```bash
cd /home/wyofalcon/cvstomize
gemini
```

The chrome-devtools MCP server will automatically connect when needed.

### 2. Common Commands for Visual Documentation

#### Take Screenshots
```
Take a screenshot of https://cvstomize-frontend-351889420459.us-central1.run.app
```

#### Navigate and Document
```
Open Chrome to the CVstomize production frontend, take screenshots of:
1. Login page
2. Dashboard after login
3. Resume generation flow
4. Profile page
```

#### Performance Analysis
```
Record a performance trace of the resume generation process and analyze it
```

#### Network Inspection
```
Navigate to the app and show me all API calls being made
```

#### Console Debugging
```
Open the app and check the browser console for any errors
```

### 3. Example Workflow for Dev Team Documentation

**Create a visual walkthrough:**
```
Please help me create visual documentation:
1. Open Chrome to https://cvstomize-frontend-351889420459.us-central1.run.app
2. Take a screenshot of the homepage
3. Click the login button
4. Take a screenshot of the login form
5. Navigate through the main features
6. Save all screenshots to /home/wyofalcon/cvstomize/docs/screenshots/
```

**Debug visual issues:**
```
Open the staging frontend and compare the layout with production.
Take screenshots of both and highlight differences.
```

**Performance testing:**
```
Record a trace of the complete resume generation flow from start to finish.
Analyze for bottlenecks and slow operations.
```

## Available Chrome DevTools MCP Tools

Based on the extension, you have access to:
- `puppeteer_navigate` - Navigate to URLs
- `puppeteer_screenshot` - Capture screenshots
- `puppeteer_click` - Click elements
- `puppeteer_fill` - Fill form inputs
- `puppeteer_select` - Select dropdown options
- `puppeteer_hover` - Hover over elements
- `puppeteer_evaluate` - Run JavaScript in browser
- `devtools_get_console_logs` - Get console messages
- `devtools_get_network_logs` - Get network activity
- `devtools_record_trace` - Record performance traces
- `devtools_get_cookies` - Get browser cookies

## Tips for Best Results

1. **Be Specific**: Instead of "screenshot the app", say "screenshot the resume generation page at step 3"
2. **Use URLs**: Always specify full URLs for production/staging environments
3. **Sequential Steps**: Break down workflows into clear steps
4. **Save Artifacts**: Ask to save screenshots to specific folders for organization
5. **Context Matters**: Reference the ROADMAP.md when asking about features to document

## Production URLs (from README.md)

- **Production Frontend**: https://cvstomize-frontend-351889420459.us-central1.run.app
- **Production API**: https://cvstomize-api-351889420459.us-central1.run.app
- **Staging Frontend**: https://cvstomize-frontend-staging-1036528578375.us-central1.run.app
- **Staging API**: https://cvstomize-api-staging-1036528578375.us-central1.run.app

## Example Documentation Tasks

### For UI/UX Review
```
Open the production app and document the complete user flow:
1. Landing page
2. Sign up process
3. Profile creation
4. Resume upload
5. Job description input
6. Question answering
7. Resume generation
8. Download options

Take annotated screenshots at each step.
```

### For Bug Reporting
```
Navigate to the staging app and reproduce the contact info bug mentioned in Session 28.
Take screenshots showing "Alex Johnson" instead of the user's real name.
```

### For Performance Documentation
```
Record a performance trace of the full resume generation workflow.
Identify any operations taking >2 seconds and document them.
```

## Notes
- Chrome must be installed on the system (already available)
- The MCP server will launch Chrome automatically
- Screenshots are saved in memory by default unless you specify a path
- For persistent documentation, always specify save locations
- The extension works seamlessly with Gemini's context about your codebase

## Next Steps
1. Try taking a screenshot of production homepage
2. Document the current UI state for Session 29 planning
3. Create visual comparison between staging and production
4. Build a screenshot library for dev team reference

---

**Last Updated**: 2025-11-14
**Status**: ✅ Ready to use
**Session**: Post-Session 28 (Contact info bug identified, ready for visual documentation)
