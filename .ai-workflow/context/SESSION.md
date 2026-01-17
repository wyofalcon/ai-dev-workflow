# Current Session Context

> **⚠️ AGENTS: Read this file FIRST when starting a session!**
>
> Update this file after completing tasks and before ending your session.

## Session Status

| Field             | Value      |
| ----------------- | ---------- |
| **Last Updated**  | 2026-01-17 |
| **Last Agent**    | Copilot    |
| **Session State** | Active     |

## Current Focus

<!-- What are we actively working on right now? -->

- ✨ **Easy CV Redesign** (Refinement)
- 🚀 **Onboarding UX Optimization** (Removing mandatory gates)
- 🛑 **PAUSED:** WebLLM / Local AI features (put on back burner)
- 🔄 **PIVOT:** Using Vertex AI (Backend) for ALL AI features (including extension)
- 🔧 **DevContainer MCP Stability** (Fixed)

## Recent Progress

<!-- What was accomplished in the last session? -->

- ✅ **Reorganized AI Workflow as Reusable Template:**
  - Moved all AI workflow scripts from `/scripts/` to `/.ai-workflow/scripts/`
  - Moved MCP config from `.devcontainer/` to `/.ai-workflow/config/`
  - Moved `.context/` folder to `/.ai-workflow/context/` (symlinked for backward compat)
  - Updated all path references in tasks.json, devcontainer.json, copilot-instructions.md
  - Made scripts portable using `$SCRIPT_DIR` relative paths
  - Created README.md documenting the workflow as a reusable template
- ✅ **Fixed MCP Server Persistence on Container Restart:**
  - Created `.ai-workflow/config/setup-mcp-servers.sh` to configure all MCP servers for Gemini CLI
  - Created `.ai-workflow/config/ensure-mcp-servers.sh` to pre-warm MCP packages on startup
  - Updated `devcontainer.json` postStartCommand to run ensure-mcp-servers script
  - MCP servers are now stored in workspace `.gemini/settings.json` which persists across restarts
  - Pre-warming runs `npx -y` for each MCP package in background to cache them
- ✅ **Removed Mandatory Onboarding Gate:**
  - Updated `src/App.js` to remove `onboardingCompleted` redirects in `ProtectedRoute` and `LandingPageRoute`.
  - Logged-in users now go directly to `/dashboard` regardless of onboarding status.
  - Converted `/onboarding` to an optional path using `ProtectedRoute` (requires login but not completion).
  - Removed `OnboardingRoute` wrapper definition and cleaned up unused `useLocation` import.
- ✅ **Implemented Easy CV Overlay Architecture (`src/components/EasyCvWizard.js`):**
  - Imported `LandingPage` and rendered it as the background layer.
  - Refactored wizard states (Consent, Minimized, Expanded) to use conditional fixed overlays instead of exclusive routing.
  - Ensured landing page remains visible/interactive when wizard is minimized.
- ✅ **Redesigned Easy CV Wizard (`src/components/EasyCvWizard.js`):**
  - **Floating Window:** Transformed full-screen UI into a contained, floating modal with minimize support.
  - **Paper Preview:** Styled the resume preview to mimic a physical A4/Letter page.
  - **Interactive Sections:** Added click-to-edit functionality for resume sections, triggering a conversational intervention flow.
- **STRATEGY SHIFT:** Paused WebLLM/Local AI. Focus on Vertex AI to use up credits and simplify launch.
- ✅ **Refactored Extension:** Connected to Vertex AI, removed WebLLM.
- ✅ **Finished Portfolio Feature:**
  - Verified backend logic and created unit tests (`api/__tests__/unit/services/portfolioService.test.js`)
  - Updated `portfolioService.js` to sync generated URL to user profile
  - Enhanced frontend UI with template style selection (Modern/Minimal/Creative)
- ✅ **Optimized Cloud Build caching (Backend):** Enabled layer caching to reduce build time.

## Blockers / Open Questions

<!-- Anything stuck or waiting for user input? -->

- **Backend Integration:** The interactive edit logic in Easy CV is currently mocked. Needs to be connected to real Vertex AI conversation endpoints.
- **M2:** Test configuration needs fixing

## Next Steps

<!-- What should the next session focus on? -->

1. **Verify Easy CV:** Manually test the new flow, especially the edit interaction.
2. **Connect AI:** Hook up the `handleSectionEdit` logic to the backend conversation API.
3. **Priority: MVP Blockers** - Follow `.context/MVP_MASTER_LIST.md` phases
