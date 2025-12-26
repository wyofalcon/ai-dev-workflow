#!/bin/bash
# AI Dev Workflow - Builder Setup Wizard
# Welcomes user and helps them choose their AI CLI

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

clear

# Show welcome banner
echo -e "${BLUE}"
cat << 'BANNER'
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║     █████╗ ██╗    ██████╗ ███████╗██╗   ██╗                  ║
   ║    ██╔══██╗██║    ██╔══██╗██╔════╝██║   ██║                  ║
   ║    ███████║██║    ██║  ██║█████╗  ██║   ██║                  ║
   ║    ██╔══██║██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝                  ║
   ║    ██║  ██║██║    ██████╔╝███████╗ ╚████╔╝                   ║
   ║    ╚═╝  ╚═╝╚═╝    ╚═════╝ ╚══════╝  ╚═══╝                    ║
   ║                                                               ║
   ║           W O R K F L O W                                     ║
   ╚═══════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

echo -e "${CYAN}${BOLD}   🎉 Welcome to AI Dev Workflow!${NC}"
echo ""
echo -e "   ${DIM}A Builder/Auditor pattern for AI-assisted development.${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${BOLD}How it works:${NC}"
echo ""
echo -e "   ${GREEN}🤖 Builder${NC}    Your AI coding assistant (Gemini or Claude CLI)"
echo -e "                Generates code, answers questions, helps you build"
echo ""
echo -e "   ${GREEN}🔍 Auditor${NC}    GitHub Copilot (chat) + automated checks"
echo -e "                Reviews code, catches bugs, ensures quality"
echo ""
echo -e "   ${GREEN}📁 Workflow${NC}   Builder writes → Auditor reviews → You ship!"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${YELLOW}⏳ Preparing setup wizard...${NC}"
echo ""

sleep 2

# Check if whiptail is available
if ! command -v whiptail &> /dev/null; then
    echo -e "   ${YELLOW}📦 Installing UI components...${NC}"
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
        echo -e "    ${CYAN}•${NC} Gemini CLI - configured"
    fi
    if [ "$CLAUDE_CONFIGURED" = true ]; then
        echo -e "    ${CYAN}•${NC} Claude CLI - configured"
    fi
    echo ""
    echo -e "  ${BOLD}Auditor:${NC}"
    echo -e "    ${CYAN}•${NC} GitHub Copilot (this chat + PR reviews)"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 0
fi

# Show Builder selection GUI
AI_CHOICE=$(whiptail --title "🤖 Choose Your AI Builder" \
--menu "\nWelcome to AI Dev Workflow!\n\nThe Builder generates code, the Auditor (GitHub Copilot) reviews it.\n\nWhich AI CLI do you want as your Builder?" 18 65 3 \
"gemini" "Gemini CLI  ⭐ (Google account / API key)" \
"claude" "Claude CLI     (Anthropic API key required)" \
"skip" "Skip for now   (set up later)" \
3>&1 1>&2 2>&3)

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}Setup cancelled. Run this script anytime to configure.${NC}"
    exit 0
fi

# Fix NODE_OPTIONS for npm
unset NODE_OPTIONS

case $AI_CHOICE in
    gemini)
        echo -e "${CYAN}📦 Setting up Gemini CLI...${NC}"
        
        if ! command -v gemini &> /dev/null; then
            npm install -g @google/gemini-cli 2>/dev/null || true
        fi
        
        echo "gemini" > ~/.ai-cli-preference
        
        whiptail --title "✅ Gemini CLI Ready" --msgbox "\
Gemini CLI is installed!\n\n\
On first run, it will open a browser for Google authentication.\n\n\
The AI Builder terminal will start Gemini automatically." 12 60
        ;;
        
    claude)
        echo -e "${CYAN}📦 Setting up Claude CLI...${NC}"
        
        if ! command -v claude &> /dev/null; then
            npm install -g @anthropic-ai/claude-code 2>/dev/null || true
        fi
        
        API_KEY=$(whiptail --title "Claude API Key" \
        --passwordbox "\nEnter your Anthropic API key:\n\n(Get one at: console.anthropic.com/settings/keys)" 12 65 \
        3>&1 1>&2 2>&3)
        
        if [ -n "$API_KEY" ]; then
            echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
            export ANTHROPIC_API_KEY="$API_KEY"
            echo "claude" > ~/.ai-cli-preference
            
            whiptail --title "✅ Claude CLI Ready" --msgbox "\
Claude CLI is configured and ready to use!\n\n\
The AI Builder terminal will start Claude automatically." 10 60
        else
            whiptail --title "⚠️ No API Key" --msgbox "\
No API key provided. You can set it later:\n\n\
  export ANTHROPIC_API_KEY=your-key" 10 55
        fi
        ;;
        
    skip)
        whiptail --title "Setup Skipped" --msgbox "\
No problem! You can set up your AI Builder anytime:\n\n\
  • Gemini: npm i -g @google/gemini-cli && gemini\n\
  • Claude: npm i -g @anthropic-ai/claude-code" 12 60
        ;;
esac

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}⏳ Launching split terminals...${NC}"
echo ""

sleep 1
