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
🤖 Builder (AI CLI)  →  🔍 Auditor (Checks + Copilot)  →  ✅ You Ship!
```

- **Builder**: Gemini CLI or Claude CLI generates code
- **Auditor**: Automated pattern checks + GitHub Copilot reviews
- **Split terminals**: See both side-by-side in VS Code

## 🚀 Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/wyofalcon/ai-dev-workflow/main/install.sh | bash
```

Or manually:

```bash
git clone https://github.com/wyofalcon/ai-dev-workflow.git
cp -r ai-dev-workflow/{scripts,.vscode,.audit-config.json} your-project/
```

## 📦 What's Included

| File | Purpose |
|------|---------|
| `scripts/audit-watch.sh` | Real-time file watcher, runs audits on save |
| `scripts/audit-file.py` | Pattern-based security/quality checks |
| `scripts/start-ai-cli.sh` | Launches your configured AI CLI |
| `scripts/pre-commit-hook.sh` | Blocks commits with critical issues |
| `.devcontainer/` | Dev container with auto-setup |
| `.vscode/tasks.json` | Auto-launch split terminals |
| `.audit-config.json` | Configurable audit patterns |

## 🔧 Configuration

Edit `.audit-config.json` to customize:

```json
{
  "watchDirs": ["src", "api", "lib"],
  "patterns": {
    "secrets": {
      "pattern": "(?i)(password|secret|api_key)\\s*[:=]\\s*['\"][^'\"]+['\"]",
      "message": "⚠️  Possible hardcoded secret",
      "severity": "error"
    },
    "console_log": {
      "pattern": "console\\.(log|debug)\\(",
      "message": "💬 Console statement",
      "severity": "warning"
    }
  }
}
```

### Severity Levels

- `error` - Blocks commits, shown in red
- `warning` - Shown in yellow, doesn't block
- `info` - Informational only

## 🖥️ Usage

### Option 1: VS Code Tasks (Recommended)

Open Command Palette (`Ctrl+Shift+P`) → "Tasks: Run Task" → "🚀 Start Dev Workflow"

This opens split terminals:
- Left: **🔍 Audit Watch** - monitors file changes
- Right: **🤖 AI Builder** - your Gemini/Claude CLI

### Option 2: Manual

```bash
# Terminal 1 - Audit Watch
bash scripts/audit-watch.sh

# Terminal 2 - AI CLI
bash scripts/start-ai-cli.sh
```

### Option 3: Dev Container

If using the included `.devcontainer/`, everything auto-starts on container open!

## 🛡️ Pre-commit Hook

Install the pre-commit hook to catch issues before they're committed:

```bash
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Example output:
```
============================================================
🔍 LOCAL AUDITOR (Pre-commit)
============================================================
Checking: src/api.js
   Line 15: ⚠️  Possible hardcoded secret
   Line 42: 💬 Console statement (remove before commit)
============================================================
❌ AUDIT FAILED - Fix errors before committing
============================================================
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

## 📁 Project Structure

```
your-project/
├── .audit-config.json      # Audit configuration
├── .devcontainer/
│   ├── builder-setup.sh    # Welcome wizard
│   ├── devcontainer.json   # Container config
│   └── post-create.sh      # Setup script
├── .vscode/
│   └── tasks.json          # VS Code tasks
└── scripts/
    ├── audit-watch.sh      # File watcher
    ├── audit-file.py       # Pattern checker
    ├── start-ai-cli.sh     # CLI launcher
    └── pre-commit-hook.sh  # Git hook
```

## 🤝 Philosophy

1. **AI generates, humans verify** - Let AI do the heavy lifting, but maintain oversight
2. **Fail fast** - Catch issues on save, not in production
3. **Non-blocking by default** - Warnings inform, only errors block
4. **Configurable** - Every project has different needs

## 📄 License

MIT - Use it, fork it, improve it!

---

Built with ❤️ for the AI-assisted development era.
