#!/bin/bash
# AI Dev Workflow - Quick Install Script
# Run: curl -fsSL https://raw.githubusercontent.com/wyofalcon/ai-dev-workflow/main/install.sh | bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Installing AI Dev Workflow${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in a project directory
if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ] && [ ! -f "Cargo.toml" ]; then
    echo -e "${YELLOW}⚠️  No project detected. Creating in current directory.${NC}"
fi

# Create directories
mkdir -p scripts .devcontainer .vscode

echo -e "${GREEN}📦 Downloading workflow files...${NC}"

# Download files
BASE_URL="https://raw.githubusercontent.com/wyofalcon/ai-dev-workflow/main"

curl -fsSL "$BASE_URL/scripts/audit-watch.sh" -o scripts/audit-watch.sh
curl -fsSL "$BASE_URL/scripts/audit-file.py" -o scripts/audit-file.py
curl -fsSL "$BASE_URL/scripts/start-ai-cli.sh" -o scripts/start-ai-cli.sh
curl -fsSL "$BASE_URL/scripts/pre-commit-hook.sh" -o scripts/pre-commit-hook.sh
curl -fsSL "$BASE_URL/.devcontainer/builder-setup.sh" -o .devcontainer/builder-setup.sh
curl -fsSL "$BASE_URL/.vscode/tasks.json" -o .vscode/tasks.json
curl -fsSL "$BASE_URL/.audit-config.json" -o .audit-config.json

# Make scripts executable
chmod +x scripts/*.sh scripts/*.py .devcontainer/*.sh

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
echo "Next steps:"
echo "  1. Open in VS Code: code ."
echo "  2. If using dev containers, add .devcontainer/devcontainer.json"
echo "  3. Run setup wizard: bash .devcontainer/builder-setup.sh"
echo ""
echo "Or manually start:"
echo "  • Audit Watch: bash scripts/audit-watch.sh"
echo "  • AI Builder:  bash scripts/start-ai-cli.sh"
echo ""
