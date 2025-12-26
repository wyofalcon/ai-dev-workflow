# 🤖 AI Dev Workflow

A **Builder/Auditor pattern** for AI-assisted development. Your AI CLI (Gemini or Claude) builds code, while automated checks + GitHub Copilot audit it.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 The Problem

AI coding assistants are powerful, but they can introduce:
- Security vulnerabilities (hardcoded secrets, SQL injection)
- Debugging code left in production (console.log, debugger statements)
- Code that bypasses linting rules

## ✨ The Solution

**Builder/Auditor Workflow:**

```
📝 You (idea) → 🔍 Auditor (refines) → 🤖 Builder (implements) → ✅ Ship!
```

- **Auditor**: GitHub Copilot refines your ideas into Builder prompts
- **Builder**: Gemini CLI or Claude CLI generates code
- **Toggles**: Control how much automation you want

## 🚀 Quick Install

```bash
# In your project directory:
curl -fsSL https://raw.githubusercontent.com/wyofalcon/ai-dev-workflow/main/install.sh | bash
```

Or manually:
```bash
git clone https://github.com/wyofalcon/ai-dev-workflow.git
cp -r ai-dev-workflow/{scripts,.vscode,.context,.audit-config.json} your-project/
```

## 📦 What's Included

| File | Purpose |
|------|---------|
| `scripts/audit-watch.sh` | Real-time file watcher, runs audits on save |
| `scripts/audit-file.py` | Pattern-based security/quality checks |
| `scripts/start-ai-cli.sh` | Launches your configured AI CLI |
| `scripts/toggle-relay-mode.sh` | Toggle prompt relay (review/auto) |
| `scripts/toggle-audit-watch.sh` | Toggle file watching (on/off) |
| `scripts/send-prompt.sh` | Send prompts to Builder |
| `scripts/show-status.sh` | Show current workflow status |
| `.context/` | Workflow state (modes, prompts) |
| `.vscode/tasks.json` | VS Code tasks for easy access |

## ⚙️ Workflow Modes

### Prompt Relay Mode

Controls how Auditor (Copilot) sends prompts to Builder:

| Mode | Description |
|------|-------------|
| `review` | **Default.** Copilot writes to `.context/PROMPT.md`, you review before sending |
| `auto` | Copilot writes prompt, you run `send-prompt.sh` to send immediately |

```bash
# Toggle via UI
bash scripts/toggle-relay-mode.sh

# Or manually
echo "auto" > .context/RELAY_MODE
echo "review" > .context/RELAY_MODE
```

### Audit Watch Mode

Controls automatic file checking on save:

| Mode | Description |
|------|-------------|
| `on` | **Default.** Files are checked when you save |
| `off` | Manual auditing only |

```bash
# Toggle via UI
bash scripts/toggle-audit-watch.sh

# Or manually
echo "on" > .context/AUDIT_WATCH_MODE
echo "off" > .context/AUDIT_WATCH_MODE
```

### Check Current Status

```bash
bash scripts/show-status.sh

# Output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   WORKFLOW STATUS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   📤 Prompt Relay:  REVIEW
#   🔍 Audit Watch:   ON
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🖥️ Usage

### Option 1: VS Code Tasks (Recommended)

Open Command Palette (`Ctrl+Shift+P`) → "Tasks: Run Task":

| Task | Description |
|------|-------------|
| 🚀 Start Dev Workflow | Opens split terminals (auto-runs on folder open) |
| 📊 Show Workflow Status | Display current modes |
| ⚙️ Toggle Relay Mode | Switch review/auto |
| 🔍 Toggle Audit Watch | Switch on/off |
| 📤 Send Prompt to Builder | Send pending prompt |

### Option 2: Manual

```bash
# Terminal 1 - Audit Watch
bash scripts/audit-watch.sh

# Terminal 2 - AI CLI
bash scripts/start-ai-cli.sh
```

### Option 3: Dev Container

If using `.devcontainer/`, everything auto-starts on container open!

## 🔄 The Prompt Relay Flow

1. **Describe your idea** to GitHub Copilot (Auditor)
2. **Copilot refines it** into a well-structured prompt
3. **Prompt saved** to `.context/PROMPT.md`
4. **Review** (if in review mode) or **send immediately**
5. **Paste into Builder** terminal (Gemini/Claude)
6. **Builder implements** your idea

Example `.context/PROMPT.md`:
```markdown
## Task: Add user authentication

### Context
User wants to add login/logout functionality

### Requirements
- Use Firebase Auth
- Support email/password and Google OAuth
- Add protected routes

### Files to Consider
- src/contexts/AuthContext.js
- src/components/Login.js
```

## 🔧 Configuration

Edit `.audit-config.json` to customize patterns:

```json
{
  "watchDirs": ["src", "api", "lib"],
  "patterns": {
    "secrets": {
      "pattern": "(?i)(password|secret|api_key)\\s*[:=]\\s*['\"][^'\"]+['\"]",
      "message": "⚠️  Possible hardcoded secret",
      "severity": "error"
    }
  }
}
```

## 🛡️ Pre-commit Hook

Automatically installed if you're in a git repo. Blocks commits with critical issues.

```bash
# Manual install
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 🤖 Supported AI CLIs

### Gemini CLI (Google)
```bash
npm install -g @google/gemini-cli
gemini  # Opens browser for Google auth
```

### Claude CLI (Anthropic)
```bash
npm install -g @anthropic-ai/claude-code
export ANTHROPIC_API_KEY="your-key"
claude
```

## 📁 Project Structure After Install

```
your-project/
├── .audit-config.json      # Audit patterns config
├── .context/
│   ├── RELAY_MODE          # review or auto
│   ├── AUDIT_WATCH_MODE    # on or off
│   ├── PROMPT.md           # Pending prompts
│   └── WORKFLOW.md         # Documentation
├── .devcontainer/
│   └── builder-setup.sh    # Welcome wizard
├── .vscode/
│   └── tasks.json          # VS Code tasks
└── scripts/
    ├── audit-watch.sh      # File watcher
    ├── audit-file.py       # Pattern checker
    ├── start-ai-cli.sh     # CLI launcher
    ├── toggle-relay-mode.sh
    ├── toggle-audit-watch.sh
    ├── send-prompt.sh
    ├── show-status.sh
    └── pre-commit-hook.sh
```

## 🤝 Philosophy

1. **AI generates, humans verify** - Let AI do the heavy lifting, but maintain oversight
2. **Configurable automation** - Choose your comfort level with toggles
3. **Fail fast** - Catch issues on save, not in production
4. **Non-blocking by default** - Warnings inform, only errors block

## 📄 License

MIT - Use it, fork it, improve it!

---

Built with ❤️ for the AI-assisted development era.
