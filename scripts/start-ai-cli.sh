#!/bin/bash
# Start the configured AI CLI (Gemini or Claude)
# Called by VS Code task to open in split terminal with Audit Watch

# Fix VS Code debugger bootloader issue
unset NODE_OPTIONS

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🤖 AI Builder CLI${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Show session context reminder
if [ -f ".context/SESSION.md" ]; then
    echo -e "${YELLOW}📋 Session Context Available${NC}"
    echo -e "   First thing: ${GREEN}cat .context/SESSION.md${NC}"
    echo -e "   Update it when you complete tasks!"
    echo ""
fi

# Check which CLI is configured
HAS_GEMINI=false
HAS_CLAUDE=false

# Check for Gemini OAuth config
if [ -f ~/.gemini/settings.json ] && grep -q "oauth" ~/.gemini/settings.json 2>/dev/null; then
    HAS_GEMINI=true
fi

# Check for Claude API key
if [ -n "$ANTHROPIC_API_KEY" ]; then
    HAS_CLAUDE=true
fi

# Determine which to use (prefer last configured, or prompt)
if [ "$HAS_GEMINI" = true ] && [ "$HAS_CLAUDE" = false ]; then
    echo -e "Starting ${GREEN}Gemini CLI${NC}..."
    echo ""
    exec gemini
elif [ "$HAS_CLAUDE" = true ] && [ "$HAS_GEMINI" = false ]; then
    echo -e "Starting ${GREEN}Claude CLI${NC}..."
    echo ""
    exec claude
elif [ "$HAS_GEMINI" = true ] && [ "$HAS_CLAUDE" = true ]; then
    # Both configured - check preference file or use Gemini as default
    PREF_FILE=~/.ai-cli-preference
    if [ -f "$PREF_FILE" ]; then
        PREFERRED=$(cat "$PREF_FILE")
    else
        PREFERRED="gemini"
    fi

    echo -e "Both CLIs configured. Using ${GREEN}${PREFERRED}${NC}"
    echo -e "${YELLOW}(To switch: echo 'claude' > ~/.ai-cli-preference)${NC}"
    echo ""

    if [ "$PREFERRED" = "claude" ]; then
        exec claude
    else
        exec gemini
    fi
else
    # Neither configured
    echo -e "${YELLOW}⚠️  No AI CLI configured yet!${NC}"
    echo ""
    echo "Run the onboarding wizard to set up your AI CLI:"
    echo ""
    echo -e "  ${GREEN}bash .devcontainer/onboarding.sh${NC}"
    echo ""
    echo "Or install manually:"
    echo "  • Gemini: gemini (then authenticate with OAuth)"
    echo "  • Claude: export ANTHROPIC_API_KEY=your-key"
    echo ""

    # Keep terminal open
    exec bash
fi
