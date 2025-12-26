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

echo "✅ Setup complete!"
echo ""
