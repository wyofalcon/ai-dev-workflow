# AI Workflow Template

> **A reusable AI-assisted development workflow for devcontainers**

This folder contains all the tooling for the AI Builder/Auditor workflow and is designed to be:

- **Self-contained**: All AI workflow scripts and context live here
- **Portable**: Can be copied to any devcontainer project
- **Non-invasive**: Doesn't mix with application code

## 📁 Structure

```
.ai-workflow/
├── scripts/           # All AI workflow automation scripts
│   ├── smart-inject.sh      # Main prompt injection with branch detection
│   ├── start-builder-tmux.sh # Start AI builder in tmux session
│   ├── check-builder.sh     # Check if builder is running
│   ├── inject-prompt.sh     # Direct prompt injection
│   ├── audit-watch.sh       # Watch mode for continuous auditing
│   ├── local-audit.py       # Pre-commit pattern checks
│   ├── prompt-audit.py      # Prompt pre-audit (duplicates, etc.)
│   ├── context-sync.py      # Session context synchronization
│   └── ...
├── config/            # Configuration scripts
│   ├── builder-setup.sh     # One-time builder CLI setup
│   ├── setup-mcp-servers.sh # MCP server configuration
│   └── ensure-mcp-servers.sh # Pre-warm MCP servers
└── context/           # Session state and history
    ├── SESSION.md           # Current session state
    ├── RELAY_MODE           # 'auto' or 'review'
    ├── PROMPT.md            # Pending prompt for builder
    ├── PROMPT_HISTORY.md    # History of sent prompts
    └── audit.log            # Audit event log
```

## 🚀 Quick Start

### 1. Setup (First Time)

```bash
bash .ai-workflow/config/builder-setup.sh
```

### 2. Start the Workflow

```bash
# Start AI builder in tmux
.ai-workflow/scripts/start-builder-tmux.sh

# (Optional) Start audit watch in another terminal
.ai-workflow/scripts/audit-watch.sh
```

### 3. Send Prompts

```bash
# Smart injection with auto branch detection
.ai-workflow/scripts/smart-inject.sh "Your prompt here"

# Or specify a branch
.ai-workflow/scripts/smart-inject.sh "Your prompt" "feature-branch"
```

## 🔧 Integration with Your Project

### Tasks (`.vscode/tasks.json`)

Add these tasks to your project:

```json
{
  "label": "🤖 AI Builder",
  "command": "${workspaceFolder}/.ai-workflow/scripts/start-builder-tmux.sh",
  "type": "shell",
  "isBackground": true
},
{
  "label": "🔍 Audit Watch",
  "command": "${workspaceFolder}/.ai-workflow/scripts/audit-watch.sh",
  "type": "shell",
  "isBackground": true
}
```

### Devcontainer (`postStartCommand`)

```json
"postStartCommand": "bash .ai-workflow/config/ensure-mcp-servers.sh 2>/dev/null || true"
```

### Copilot Instructions (`.github/copilot-instructions.md`)

See the main project's copilot-instructions.md for integration example.

## 🔄 Relay Modes

| Mode     | Behavior                                      |
| -------- | --------------------------------------------- |
| `auto`   | Copilot directly injects prompts into builder |
| `review` | Copilot writes to PROMPT.md, user confirms    |

Switch modes:

```bash
.ai-workflow/scripts/toggle-relay-mode.sh
```

## 📋 Using as a Template

To use this in another project:

1. Copy the `.ai-workflow/` folder to your project root
2. Update `.vscode/tasks.json` with the AI workflow tasks
3. Add copilot instructions to `.github/copilot-instructions.md`
4. Run setup: `bash .ai-workflow/config/builder-setup.sh`

## 🛡️ What It Does

- **Builder**: Gemini CLI or Claude CLI generates code
- **Auditor 1**: Pre-commit pattern checks (secrets, console.log, etc.)
- **Auditor 2**: GitHub Copilot for complex reviews
- **Context Sync**: Keeps session state fresh across agent handoffs
- **Prompt Pre-Audit**: Detects duplicates, auto-appends coding standards
