#!/bin/bash
# Show a VS Code notification popup on container open
# Uses VS Code's notification system via the code CLI

MARKER_FILE="$HOME/.cvstomize_welcomed"
FIRST_TIME=false

# Check if this is first time
if [ ! -f "$MARKER_FILE" ]; then
    FIRST_TIME=true
    touch "$MARKER_FILE"
fi

# The notification message
if [ "$FIRST_TIME" = true ]; then
    MSG="🎉 Welcome to CVstomize! First time here? Run 'bash .devcontainer/onboarding.sh' in the terminal to set up your AI Builder."
else
    MSG="👋 Welcome back to CVstomize! Your Builder/Auditor workflow is ready. Check .context/SESSION.md for current status."
fi

# Show VS Code notification using the --notify flag (works in remote containers)
# This uses VS Code's notification API through the integrated terminal

# Option 1: Use whiptail for terminal-based popup
if command -v whiptail &> /dev/null; then
    if [ "$FIRST_TIME" = true ]; then
        whiptail --title "🎉 Welcome to CVstomize!" --msgbox "$(cat << 'EOF'
First time here? Great! Here's what you need to do:

1. 🤖 SET UP YOUR AI BUILDER
   Run: bash .devcontainer/onboarding.sh
   This sets up Gemini or Claude CLI as your coding assistant.

2. 🔍 USE THE AUDITOR
   GitHub Copilot (this chat) reviews your code.
   Just ask questions or request code reviews!

3. 📁 CHECK SESSION CONTEXT
   See .context/SESSION.md for current project status.

4. 🚀 START CODING!
   Your terminals are already set up:
   - Left: Audit Watch (file change monitoring)
   - Right: AI Builder (Gemini/Claude CLI)

Press OK to continue...
EOF
)" 20 65
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 Quick Reference"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ "$FIRST_TIME" = true ]; then
    echo "  🆕 FIRST TIME SETUP:"
    echo "     bash .devcontainer/onboarding.sh"
    echo ""
fi
echo "  📄 Current Status:  .context/SESSION.md"
echo "  🤖 Start Builder:   gemini  or  claude"
echo "  🔍 Ask Auditor:     GitHub Copilot Chat (Ctrl+Shift+I)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
