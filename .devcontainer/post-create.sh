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

# Add gemini/claude aliases to fix VS Code NODE_OPTIONS conflict
if ! grep -q 'alias gemini=' ~/.bashrc 2>/dev/null; then
    cat >> ~/.bashrc << 'ALIAS_EOF'

# Fix for Gemini/Claude CLI in VS Code (NODE_OPTIONS conflict)
alias gemini='unset NODE_OPTIONS && command gemini'
alias claude='unset NODE_OPTIONS && command claude'
ALIAS_EOF
    echo "✅ CLI aliases configured (gemini/claude work directly)"
fi

echo "✅ Setup complete!"
echo ""
