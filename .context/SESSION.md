# Current Session Context

> **⚠️ AGENTS: Read this file FIRST when starting a session!**
>
> Update this file after completing tasks and before ending your session.

## Session Status

| Field             | Value      |
| ----------------- | ---------- |
| **Last Updated**  | 2025-12-26 |
| **Last Agent**    | Copilot    |
| **Session State** | Active     |

## Current Focus

<!-- What are we actively working on right now? -->

- Setting up Builder/Auditor workflow automation
- Ensuring agents persist context between sessions

## Recent Progress

<!-- What was accomplished in the last session? -->

- ✅ Configured split terminals (Audit Watch + AI Builder)
- ✅ Fixed NODE_OPTIONS conflict for gemini/claude aliases
- ✅ Created public ai-dev-workflow repo
- ✅ Added smart exclusions to audit-file.py

## Blockers / Open Questions

<!-- Anything stuck or waiting for user input? -->

- None currently

## Next Steps

<!-- What should the next session focus on? -->

1. Verify full container workflow (rebuild to test)
2. Test first-time user experience with onboarding.sh
3. Continue feature development

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
