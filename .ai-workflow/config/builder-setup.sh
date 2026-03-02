#!/bin/bash
# Builder Setup - Welcomes user and helps them choose their AI CLI
# Shows reassuring messages during container initialization

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="${AI_WORKFLOW_PROJECT_NAME:-My Project}"
FIRST_TIME_MARKER="$HOME/.ai-workflow_welcomed"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Wait for whiptail to be available (may still be installing)
wait_for_whiptail() {
    for i in {1..10}; do
        if command -v whiptail &> /dev/null; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# Show first-time welcome popup
show_first_time_popup() {
    if [ ! -f "$FIRST_TIME_MARKER" ] && wait_for_whiptail; then
        whiptail --title "🎉 Welcome to $PROJECT_NAME!" --msgbox "$(cat << 'EOF'
Welcome! This dev container uses a Builder/Auditor workflow:

📝 HOW IT WORKS:
   • Talk to Copilot (Ctrl+I) to describe features
   • Copilot refines your idea into a clear prompt
   • Copilot sends the prompt to the Builder (Gemini/Claude)
   • Builder implements the code automatically
   • Pre-commit hooks + Copilot review your changes

💬 COPILOT: Your interface (refines & relays prompts)
🔨 BUILDER: Gemini or Claude CLI (implements code)
🔍 AUDITOR: Pre-commit checks + Copilot reviews

🌿 SMART BRANCHING:
   • Copilot can auto-create branches for your tasks
   • Just describe your idea - it picks the branch name!

📋 NEXT STEPS:
   1. Set up your AI Builder (next screen)
   2. Describe ideas to Copilot - it handles the rest!

Press OK to continue...
EOF
)" 24 64

        # Offer to create desktop shortcut
        if whiptail --title "🖥️ Desktop Shortcut" --yesno "Would you like to create a Desktop shortcut to quickly reopen this project?\n\nThis creates a clickable icon that:\n  • Starts Docker if needed\n  • Opens VS Code with this dev container\n  • Works even after restart\n\n(WSL users can choose Windows or Linux desktop)" 16 60; then
            # Run the shortcut creator
            SHORTCUT_SCRIPT="$(git rev-parse --show-toplevel 2>/dev/null)/scripts/create-shortcut.sh"
            if [ -f "$SHORTCUT_SCRIPT" ]; then
                bash "$SHORTCUT_SCRIPT"
            else
                whiptail --title "⚠️ Script Not Found" --msgbox "Shortcut script not found.\n\nYou can run it manually later:\n  ./scripts/create-shortcut.sh" 10 50
            fi
        fi

        touch "$FIRST_TIME_MARKER"
    fi
}

clear

# Show first-time popup before anything else
show_first_time_popup

# Show welcome banner
echo -e "${BLUE}"
cat << 'BANNER'
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║    █████╗ ██╗    ██████╗ ███████╗██╗   ██╗                   ║
   ║   ██╔══██╗██║    ██╔══██╗██╔════╝██║   ██║                   ║
   ║   ███████║██║    ██║  ██║█████╗  ██║   ██║                   ║
   ║   ██╔══██║██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝                   ║
   ║   ██║  ██║██║    ██████╔╝███████╗ ╚████╔╝                    ║
   ║   ╚═╝  ╚═╝╚═╝    ╚═════╝ ╚══════╝  ╚═══╝                    ║
   ║                                                               ║
   ║           Builder / Auditor Workflow                          ║
   ║                                                               ║
   ╚═══════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

echo -e "${CYAN}${BOLD}   🎉 Welcome to $PROJECT_NAME!${NC}"
echo ""
echo -e "   ${DIM}AI-powered Builder/Auditor workflow for quality code.${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${BOLD}How it works:${NC}"
echo ""
echo -e "   ${GREEN}💬 You → Copilot${NC}  Describe features to Copilot (Ctrl+I)"
echo -e "                    Copilot refines your idea into a clear prompt"
echo ""
echo -e "   ${GREEN}🤖 Builder${NC}       Gemini or Claude CLI (runs in tmux)"
echo -e "                    Receives prompts from Copilot, implements code"
echo ""
echo -e "   ${GREEN}🔍 Auditor${NC}       Pre-commit hooks + Copilot reviews"
echo -e "                    Catches issues and reviews your changes"
echo ""
echo -e "   ${GREEN}🌿 Branches${NC}      Copilot auto-creates branches for your tasks"
echo -e "                    Describe an idea, it picks the right branch name"
echo ""
echo -e "   ${GREEN}📁 Workflow${NC}      You → Copilot → Builder → Commit → Auditor"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${YELLOW}⏳ Preparing setup wizard...${NC}"
echo ""

# Brief pause for visual effect
sleep 2

# Check if whiptail is available
if ! command -v whiptail &> /dev/null; then
    echo -e "   ${YELLOW}📦 Installing UI components...${NC}"
    # Wait for apt lock
    while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
        sleep 1
    done
    sudo apt-get update -qq && sudo apt-get install -y -qq whiptail > /dev/null 2>&1
fi

# Check if already configured
GEMINI_CONFIGURED=false
CLAUDE_CONFIGURED=false

if [ -f ~/.gemini/settings.json ]; then
    GEMINI_CONFIGURED=true
fi
if [ -n "$ANTHROPIC_API_KEY" ]; then
    CLAUDE_CONFIGURED=true
fi

# If already configured, show quick summary and exit
if [ "$GEMINI_CONFIGURED" = true ] || [ "$CLAUDE_CONFIGURED" = true ]; then
    clear
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ Development Environment Ready!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BOLD}Your AI Builder:${NC}"
    if [ "$GEMINI_CONFIGURED" = true ]; then
        echo -e "    ${CYAN}•${NC} Gemini CLI - run ${GREEN}gemini${NC} to start"
    fi
    if [ "$CLAUDE_CONFIGURED" = true ]; then
        echo -e "    ${CYAN}•${NC} Claude CLI - run ${GREEN}claude${NC} to start"
    fi
    echo ""
    echo -e "  ${BOLD}Auditor:${NC}"
    echo -e "    ${CYAN}•${NC} GitHub Copilot (this chat + PR reviews)"
    echo ""
    echo -e "  ${BOLD}Commands:${NC}"
    echo -e "    ${CYAN}gss${NC}     - Switch session mode (Audit on/off)"
    echo -e "    ${CYAN}gemini${NC}  - Start Gemini CLI"
    echo -e "    ${CYAN}claude${NC}  - Start Claude CLI"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 0
fi

# Show Builder selection GUI
AI_CHOICE=$(whiptail --title "🤖 Choose Your AI Builder" \
--menu "\nWelcome to $PROJECT_NAME!\n\nThe Builder generates code, the Auditor (GitHub Copilot) reviews it.\n\nWhich AI CLI do you want as your Builder?" 18 65 3 \
"gemini" "Gemini CLI  ⭐ (Google account / API key)" \
"claude" "Claude CLI     (Anthropic API key required)" \
"skip" "Skip for now   (set up later)" \
3>&1 1>&2 2>&3)

# Handle cancel
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}Setup cancelled. Run 'bash .devcontainer/onboarding.sh' anytime.${NC}"
    exit 0
fi

case $AI_CHOICE in
    gemini)
        echo ""
        echo -e "${CYAN}📦 Setting up Gemini CLI...${NC}"

        if ! command -v gemini &> /dev/null; then
            unset NODE_OPTIONS
            npm install -g @google/gemini-cli 2>/dev/null || true
        fi

        # Ask for auth method
        AUTH_CHOICE=$(whiptail --title "Gemini Authentication" \
        --menu "\nHow do you want to authenticate?\n" 14 65 2 \
        "oauth" "Google Account - best for Gemini Advanced/Ultra" \
        "apikey" "API Key - free tier from aistudio.google.com" \
        3>&1 1>&2 2>&3)

        mkdir -p ~/.gemini
        if [ "$AUTH_CHOICE" = "oauth" ]; then
            cat > ~/.gemini/settings.json << 'SETTINGS'
{
  "ide": {"hasSeenNudge": true, "enabled": true},
  "security": {"auth": {"selectedType": "oauth"}},
  "general": {"previewFeatures": true}
}
SETTINGS
            # Set preference
            echo "gemini" > ~/.ai-cli-preference

            whiptail --title "✅ Gemini CLI Ready" --msgbox "\
Gemini CLI is configured for Google Account login.\n\n\
When the AI Builder terminal opens, it will prompt you\n\
to authenticate with your Google account.\n\n\
If you have Gemini Advanced/Ultra, you'll get those perks!" 14 60
        else
            cat > ~/.gemini/settings.json << 'SETTINGS'
{
  "ide": {"hasSeenNudge": true, "enabled": true},
  "security": {"auth": {"selectedType": "gemini-api-key"}},
  "general": {"previewFeatures": true}
}
SETTINGS
            # Set preference
            echo "gemini" > ~/.ai-cli-preference

            whiptail --title "✅ Gemini CLI Ready" --msgbox "\
Gemini CLI is configured for API Key authentication.\n\n\
To get your free API key:\n\
  1. Go to: https://aistudio.google.com/app/apikey\n\
  2. Create a new API key\n\
  3. Paste it when the AI Builder terminal prompts you" 14 65
        fi
        ;;

    claude)
        echo ""
        echo -e "${CYAN}📦 Setting up Claude CLI...${NC}"

        if ! command -v claude &> /dev/null; then
            unset NODE_OPTIONS
            npm install -g @anthropic-ai/claude-code 2>/dev/null || true
        fi

        # Get API key
        API_KEY=$(whiptail --title "Claude API Key" \
        --passwordbox "\nEnter your Anthropic API key:\n\n(Get one at: console.anthropic.com/settings/keys)" 12 65 \
        3>&1 1>&2 2>&3)

        if [ -n "$API_KEY" ]; then
            # Add to bashrc
            echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
            export ANTHROPIC_API_KEY="$API_KEY"

            # Set preference
            echo "claude" > ~/.ai-cli-preference

            whiptail --title "✅ Claude CLI Ready" --msgbox "\
Claude CLI is configured and ready to use!\n\n\
The AI Builder terminal will start Claude automatically." 10 60
        else
            whiptail --title "⚠️ No API Key" --msgbox "\
No API key provided. You can set it later:\n\n\
  export ANTHROPIC_API_KEY=your-key\n\n\
Or run: bash .devcontainer/onboarding.sh" 12 55
        fi
        ;;

    skip)
        whiptail --title "Setup Skipped" --msgbox "\
No problem! You can set up your AI Builder anytime:\n\n\
  bash .devcontainer/onboarding.sh\n\n\
Or install directly:\n\
  • Gemini: npm i -g @google/gemini-cli && gemini\n\
  • Claude: npm i -g @anthropic-ai/claude-code" 14 60
        ;;
esac

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}⏳ Launching split terminals...${NC}"
echo ""

# Give VS Code a moment to finish, then close this terminal
sleep 1
