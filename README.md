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

| File                            | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `scripts/audit-watch.sh`        | Real-time file watcher, runs audits on save |
| `scripts/audit-file.py`         | Pattern-based security/quality checks       |
| `scripts/start-ai-cli.sh`       | Launches your configured AI CLI             |
| `scripts/toggle-relay-mode.sh`  | Toggle prompt relay (review/auto)           |
| `scripts/toggle-audit-watch.sh` | Toggle file watching (on/off)               |
| `scripts/send-prompt.sh`        | Send prompts to Builder                     |
| `scripts/show-status.sh`        | Show current workflow status                |
| `.context/`                     | Workflow state (modes, prompts)             |
| `.vscode/tasks.json`            | VS Code tasks for easy access               |

## ⚙️ Workflow Modes

### Prompt Relay Mode

Controls how Auditor (Copilot) sends prompts to Builder:

| Mode     | Description                                                                    |
| -------- | ------------------------------------------------------------------------------ |
| `review` | **Default.** Copilot writes to `.context/PROMPT.md`, you review before sending |
| `auto`   | Copilot writes prompt, you run `send-prompt.sh` to send immediately            |

```bash
# Toggle via UI
bash scripts/toggle-relay-mode.sh

# Or manually
echo "auto" > .context/RELAY_MODE
echo "review" > .context/RELAY_MODE
```

### Audit Watch Mode

Controls automatic file checking on save:

| Mode  | Description                                  |
| ----- | -------------------------------------------- |
| `on`  | **Default.** Files are checked when you save |
| `off` | Manual auditing only                         |

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

## 🌍 Development Environments

Choose your development environment at startup, or switch anytime:

| Environment      | Description                            | Cost Risk    |
| ---------------- | -------------------------------------- | ------------ |
| 🏠 **DevLocal**  | All services mocked locally            | None         |
| 🌐 **DevLive**   | Real dev services (isolated from prod) | Low          |
| 🔀 **DevHybrid** | Mix mock and live per service          | Configurable |

### DevLocal (Default)

Perfect for building without worrying about API costs or external dependencies:

- Database: SQLite in-memory or JSON file
- Email: Console logging or MailHog
- Payments: Stripe mock server
- AI: Fixed responses (no API calls)
- Storage: Local filesystem

### DevLive

Real integrations with development-namespaced services:

- Uses actual APIs with dev/test credentials
- Payments in test mode (no real charges)
- Fully isolated from production data

### DevHybrid

Best of both worlds - configure each service individually:

- Use live database but mock AI
- Use real auth but mock payments
- Full control over cost vs. realism trade-offs

### Quick Commands

```bash
# Switch environments
devenv                    # Interactive menu
devlocal                  # Quick switch to DevLocal
devlive                   # Quick switch to DevLive
devhybrid                 # Quick switch to DevHybrid
devstatus                 # Show current environment
```

## ⚡ DevQuick Presets

Save and restore complete environment configurations:

```bash
# List saved presets
dq --list

# Save current config as preset
dq --save

# Load a preset
dq --load my-preset

# Delete a preset
dq --delete my-preset
```

DevQuick presets save:

- Development environment (DevLocal/DevLive/DevHybrid)
- Service configurations (which are mock vs. live)
- Workflow settings (relay mode, audit watch)

## � Code Style Tracking

The workflow automatically detects and enforces code style patterns:

### How It Works

1. **Learning**: When you write code, styles are detected and saved
2. **Consistency**: The Builder follows detected styles in new code
3. **Enforcement**: The Auditor checks for style consistency

### What's Tracked

| Pattern         | Examples                            |
| --------------- | ----------------------------------- |
| Indentation     | 2 spaces, 4 spaces, tabs            |
| Quotes          | Single `'` vs double `"`            |
| Semicolons      | Required vs ASI (no semicolons)     |
| Naming          | camelCase, snake_case, PascalCase   |
| Functions       | Arrow functions vs function keyword |
| Brace style     | 1TBS, Allman, K&R                   |
| Trailing commas | Always, never                       |
| Imports         | ES6 modules vs CommonJS             |

### Quick Commands

```bash
# Show detected styles
styles                    # or: style --status

# Scan project for styles
stylescan                 # or: style --scan

# Check a specific file
style --check src/app.js

# Reset all detected styles
stylereset                # or: style --reset

# Generate Builder/Auditor rules
genrules                  # Updates .context/BUILDER_RULES.md
```

### Generated Rules Files

Style tracking generates two context files:

- **`.context/BUILDER_RULES.md`** - Rules for the AI Builder to follow
- **`.context/AUDITOR_RULES.md`** - Rules for the Auditor to check

These files are auto-generated from detected styles. Don't edit manually.

### Example Style Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📐 Code Style Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Global Styles
      ✅ Indentation: 2 spaces
      ✅ Line endings: LF

   JavaScript
      ✅ Quotes: single
      ✅ Semicolons: required
      ✅ Naming: camelCase
      ✅ Functions: arrow preferred
```

## �🔐 Credentials Management

Store API keys and credentials securely (persists across sessions):

```bash
# Interactive setup wizard
creds --setup

# Add specific credential
creds --add github
creds --add gemini
creds --add stripe

# List configured credentials
creds --list

# Export to environment variables
creds --export
```

Supported providers:

- 🐙 GitHub (token)
- 🤖 GitHub Copilot (integrated)
- 💎 Gemini (OAuth or API key)
- 🎭 Claude (API key)
- 🧠 OpenAI (API key)
- ⚡ Supabase (API key)
- 💳 Stripe (API key)
- 📧 SendGrid (API key)
- ☁️ AWS (access keys)
- ▲ Vercel (token)

## 🖥️ Usage

### Option 1: VS Code Tasks (Recommended)

Open Command Palette (`Ctrl+Shift+P`) → "Tasks: Run Task":

| Task                      | Description                                      |
| ------------------------- | ------------------------------------------------ |
| 🚀 Start Dev Workflow     | Opens split terminals (auto-runs on folder open) |
| 🌍 Switch DevEnv          | Change development environment                   |
| ⚡ DevQuick Presets       | Save or load configuration presets               |
| 🔐 Manage Credentials     | Configure API keys and credentials               |
| 🎭 Mock Services Status   | View mock vs. live service config                |
| � Scan Code Styles        | Scan project and detect style patterns           |
| 📝 Generate Rules Context | Update Builder/Auditor rules from styles         |
| 🔎 Show Style Status      | Display detected code styles                     |
| �📊 Show Workflow Status  | Display current modes                            |
| ⚙️ Toggle Relay Mode      | Switch review/auto                               |
| 🔍 Toggle Audit Watch     | Switch on/off                                    |
| 📤 Send Prompt to Builder | Send pending prompt                              |

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
│   ├── ACTIVE_DEVENV       # DevLocal, DevLive, or DevHybrid
│   ├── active-devenv.json  # Current environment config
│   ├── devenv-config.json  # Environment definitions
│   ├── devenv.env          # Generated env variables
│   ├── PROMPT.md           # Pending prompts
│   └── WORKFLOW.md         # Documentation
├── .devcontainer/
│   └── builder-setup.sh    # Welcome wizard + DevEnv selection
├── .vscode/
│   └── tasks.json          # VS Code tasks
└── scripts/
    ├── audit-watch.sh      # File watcher
    ├── audit-file.py       # Pattern checker
    ├── start-ai-cli.sh     # CLI launcher
    ├── devenv-manager.py   # Environment manager
    ├── devquick-manager.py # Preset manager
    ├── credentials-manager.py # Credential storage
    ├── service-mock-manager.py # Mock service config
    ├── switch-devenv.sh    # Quick env switcher
    ├── toggle-relay-mode.sh
    ├── toggle-audit-watch.sh
    ├── send-prompt.sh
    ├── show-status.sh
    └── pre-commit-hook.sh

~/.devquick-presets/        # Saved DevQuick presets (user home)
~/.ai-workflow-credentials.json  # Stored credentials (user home)
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
