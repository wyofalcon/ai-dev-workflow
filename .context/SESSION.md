# Current Session Context

> **⚠️ AGENTS: Read this file FIRST when starting a session!**
>
> Update this file after completing tasks and before ending your session.

## Session Status

| Field             | Value      |
| ----------------- | ---------- |
| **Last Updated**  | 2026-01-13 |
| **Last Agent**    | Copilot    |
| **Session State** | Active     |

## Current Focus

<!-- What are we actively working on right now? -->

- 🛑 **PAUSED:** WebLLM / Local AI features (put on back burner)
- 🔄 **PIVOT:** Using Vertex AI (Backend) for ALL AI features (including extension)
- ✅ Session handoff documents updated (SESSION_37_HANDOFF.md created)
- ✅ ROADMAP.md updated with MVP launch phases
- MVP Launch Preparation - see `.context/MVP_MASTER_LIST.md`

## Recent Progress

<!-- What was accomplished in the last session? -->

- **STRATEGY SHIFT:** Paused WebLLM/Local AI. Focus on Vertex AI to use up credits and simplify launch.
- ✅ **Refactored Extension:** Connected to Vertex AI, removed WebLLM.
- ✅ **Rebuilt DevLive:** Environment running with new API endpoints.
- ✅ **Finished Portfolio Feature:**
    - Verified backend logic and created unit tests (`api/__tests__/unit/services/portfolioService.test.js`)
    - Updated `portfolioService.js` to sync generated URL to user profile
    - Enhanced frontend UI with template style selection (Modern/Minimal/Creative)
    - Updated `.env.example` with required `GITHUB_PAT`
- ✅ **Created SESSION_37_HANDOFF.md** documenting all changes since Session 36
- ✅ **Updated ROADMAP.md** with 8-phase MVP launch plan
- ✅ **MVP Master List created** with 12 blockers identified, 22 items deferred

## Blockers / Open Questions

<!-- Anything stuck or waiting for user input? -->

- **M1:** Production build needs diagnosis
- **M2:** Test configuration needs fixing
- **M12:** Quick Tailor needs verification (User Testing)

## Next Steps

<!-- What should the next session focus on? -->

1. **Verify Extension (User):** Load `extension-dist` in Chrome, login to localhost:3000, test on a job page.
2. **Priority: MVP Blockers** - Follow `.context/MVP_MASTER_LIST.md` phases
3. Fix production build (M1)
4. Fix test configuration (M2)
5. Audit deprecated dependencies (M3)
---

## 📋 How Agents Should Use This File

### On Session Start

```
1. Read this file to understand current state
2. Summarize what you learned to the user
3. Ask: "Ready to continue with [Next Steps]?"
```

### During Session

```
- Update "Current Focus" when switching tasks
- Add completed items to "Recent Progress"
- Note any blockers encountered
```

### On Session End (when user says goodbye/done)

```
1. Update "Recent Progress" with what was accomplished
2. Update "Next Steps" with what to do next
3. Update "Last Updated" timestamp
4. Append summary to .context/HISTORY.md
```
