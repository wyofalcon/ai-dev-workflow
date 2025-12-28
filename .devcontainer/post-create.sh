#!/bin/bash
# AI Dev Workflow - Post-create setup

# Fix VS Code debugger bootloader issue
unset NODE_OPTIONS

echo "🔧 Setting up AI Dev Workflow..."

# Make scripts executable
chmod +x scripts/*.sh scripts/*.py 2>/dev/null || true
chmod +x .devcontainer/*.sh 2>/dev/null || true

# Install pre-commit hook
if [ -d .git ]; then
    cp scripts/pre-commit-hook.sh .git/hooks/pre-commit 2>/dev/null || true
    chmod +x .git/hooks/pre-commit 2>/dev/null || true
    echo "✅ Pre-commit hook installed"
fi

# Install inotify-tools in background
(sudo apt-get update -qq && sudo apt-get install -y -qq inotify-tools whiptail > /dev/null 2>&1) &

# Add aliases for DevEnv management and CLI tools
if ! grep -q 'alias devenv=' ~/.bashrc 2>/dev/null; then
    cat >> ~/.bashrc << 'ALIAS_EOF'

# AI Dev Workflow Aliases
# Fix for Gemini/Claude CLI in VS Code (NODE_OPTIONS conflict)
alias gemini='unset NODE_OPTIONS && command gemini'
alias claude='unset NODE_OPTIONS && command claude'

# DevEnv Management
alias devenv='python3 ./scripts/devenv-manager.py'
alias dq='python3 ./scripts/devquick-manager.py'
alias creds='python3 ./scripts/credentials-manager.py'
alias devstatus='python3 ./scripts/devenv-manager.py --status'

# Quick environment switches
alias devlocal='python3 ./scripts/devenv-manager.py --set DevLocal && echo "✅ Switched to DevLocal"'
alias devlive='python3 ./scripts/devenv-manager.py --set DevLive && echo "✅ Switched to DevLive"'
alias devhybrid='python3 ./scripts/devenv-manager.py --set DevHybrid && echo "✅ Switched to DevHybrid"'

# Code Style Management
alias style='python3 ./scripts/style-tracker.py'
alias styles='python3 ./scripts/style-tracker.py --status'
alias stylescan='python3 ./scripts/style-tracker.py --scan'
alias stylereset='python3 ./scripts/style-tracker.py --reset'
alias genrules='python3 ./scripts/generate-context.py --update'
ALIAS_EOF
    echo "✅ CLI aliases configured (devenv, dq, creds, style, gemini, claude)"
fi

# Create initial context directory structure
mkdir -p .context
echo "✅ Context directory ready"

echo "✅ Setup complete!"
echo ""
