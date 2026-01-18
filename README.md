# AI Dev Workflow Template

> **A reusable Builder/Auditor workflow for AI-assisted development in devcontainers**

[![Use this template](https://img.shields.io/badge/Use%20this-template-blue?style=for-the-badge)](https://github.com/wyofalcon/ai-dev-workflow/generate)

## Quick Start

### Use as GitHub Template
Click **"Use this template"** button to create a new repo with this workflow.

### Add to Existing Project
```bash
git clone https://github.com/wyofalcon/ai-dev-workflow.git temp-workflow
cp -r temp-workflow/.ai-workflow your-project/
cp -r temp-workflow/.devcontainer your-project/
cp -r temp-workflow/.github your-project/
cp -r temp-workflow/.vscode your-project/
rm -rf temp-workflow
```

## What's Included

- **.ai-workflow/** - Scripts, config, and session context
- **.devcontainer/** - Dev container setup with onboarding
- **.github/** - Copilot instructions and workflows
- **.vscode/** - Tasks and settings

## First Time Setup

1. Open in Codespace or Dev Container
2. Run: `bash .devcontainer/onboarding.sh`
3. Start workflow: `.ai-workflow/scripts/start-builder-tmux.sh`

## How It Works

```
Builder (Gemini/Claude) → Pre-commit Checks → Auditor (Copilot)
```

See [.ai-workflow/README.md](.ai-workflow/README.md) for full documentation.

## License

MIT
