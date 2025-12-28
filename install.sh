#!/bin/bash
# AI Dev Workflow - Quick Install Script
# Run: curl -fsSL https://raw.githubusercontent.com/wyofalcon/ai-dev-workflow/main/install.sh | bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Installing AI Dev Workflow${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in a project directory
if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ] && [ ! -f "Cargo.toml" ] && [ ! -f "go.mod" ]; then
    echo -e "${YELLOW}⚠️  No project detected. Installing in current directory.${NC}"
fi

# Create directories
mkdir -p scripts .devcontainer .vscode .context

echo -e "${GREEN}📦 Downloading workflow files...${NC}"

# Download files
BASE_URL="https://raw.githubusercontent.com/wyofalcon/ai-dev-workflow/main"

# Core scripts
curl -fsSL "$BASE_URL/scripts/audit-watch.sh" -o scripts/audit-watch.sh
curl -fsSL "$BASE_URL/scripts/audit-file.py" -o scripts/audit-file.py
curl -fsSL "$BASE_URL/scripts/start-ai-cli.sh" -o scripts/start-ai-cli.sh
curl -fsSL "$BASE_URL/scripts/pre-commit-hook.sh" -o scripts/pre-commit-hook.sh

# Toggle & status scripts
curl -fsSL "$BASE_URL/scripts/toggle-relay-mode.sh" -o scripts/toggle-relay-mode.sh
curl -fsSL "$BASE_URL/scripts/toggle-audit-watch.sh" -o scripts/toggle-audit-watch.sh
curl -fsSL "$BASE_URL/scripts/send-prompt.sh" -o scripts/send-prompt.sh
curl -fsSL "$BASE_URL/scripts/show-status.sh" -o scripts/show-status.sh

# DevEnv management scripts
curl -fsSL "$BASE_URL/scripts/devenv-manager.py" -o scripts/devenv-manager.py
curl -fsSL "$BASE_URL/scripts/devquick-manager.py" -o scripts/devquick-manager.py
curl -fsSL "$BASE_URL/scripts/credentials-manager.py" -o scripts/credentials-manager.py
curl -fsSL "$BASE_URL/scripts/service-mock-manager.py" -o scripts/service-mock-manager.py
curl -fsSL "$BASE_URL/scripts/switch-devenv.sh" -o scripts/switch-devenv.sh

# Code style tracking scripts
curl -fsSL "$BASE_URL/scripts/style-tracker.py" -o scripts/style-tracker.py
curl -fsSL "$BASE_URL/scripts/generate-context.py" -o scripts/generate-context.py

# Config files
curl -fsSL "$BASE_URL/.devcontainer/builder-setup.sh" -o .devcontainer/builder-setup.sh
curl -fsSL "$BASE_URL/.devcontainer/post-create.sh" -o .devcontainer/post-create.sh
curl -fsSL "$BASE_URL/.vscode/tasks.json" -o .vscode/tasks.json
curl -fsSL "$BASE_URL/.audit-config.json" -o .audit-config.json

# DevEnv config
curl -fsSL "$BASE_URL/.context/devenv-config.json" -o .context/devenv-config.json

# Context files (workflow state)
curl -fsSL "$BASE_URL/.context/WORKFLOW.md" -o .context/WORKFLOW.md
curl -fsSL "$BASE_URL/.context/PROMPT.md" -o .context/PROMPT.md
echo "review" > .context/RELAY_MODE
echo "on" > .context/AUDIT_WATCH_MODE

# Make scripts executable
chmod +x scripts/*.sh scripts/*.py .devcontainer/*.sh 2>/dev/null || true

# Install pre-commit hook if in git repo
if [ -d ".git" ]; then
    cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Pre-commit hook installed${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ AI Dev Workflow installed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. Open in VS Code: ${GREEN}code .${NC}"
echo "  2. Run setup wizard: ${GREEN}bash .devcontainer/builder-setup.sh${NC}"
echo "  3. Scan code styles: ${GREEN}python3 scripts/style-tracker.py --scan${NC}"
echo ""
echo -e "${CYAN}Quick commands:${NC}"
echo "  • Start workflow:  ${GREEN}bash scripts/audit-watch.sh${NC} (terminal 1)"
echo "  •                  ${GREEN}bash scripts/start-ai-cli.sh${NC} (terminal 2)"
echo "  • Show status:     ${GREEN}bash scripts/show-status.sh${NC}"
echo "  • Switch env:      ${GREEN}python3 scripts/devenv-manager.py${NC}"
echo "  • View styles:     ${GREEN}python3 scripts/style-tracker.py --status${NC}"
echo ""
echo -e "${CYAN}Environments:${NC}"
echo "  • DevLocal:  All services mocked (free)"
echo "  • DevLive:   Real dev services (isolated)"
echo "  • DevHybrid: Mix mock + live per service"
echo ""
