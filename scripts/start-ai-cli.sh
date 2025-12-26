#!/bin/bash
# AI Dev Workflow - Start AI CLI
# Launches the configured AI CLI (Gemini or Claude)

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

# Determine which to use (prefer preference file)
if [ "$HAS_GEMINI" = true ] && [ "$HAS_CLAUDE" = false ]; then
    echo -e "Starting ${GREEN}Gemini CLI${NC}..."
    echo ""
    exec gemini
elif [ "$HAS_CLAUDE" = true ] && [ "$HAS_GEMINI" = false ]; then
    echo -e "Starting ${GREEN}Claude CLI${NC}..."
    echo ""
    exec claude
elif [ "$HAS_GEMINI" = true ] && [ "$HAS_CLAUDE" = true ]; then
    # Both configured - check preference file
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
    echo -e "${YELLOW}No AI CLI configured yet.${NC}"
    echo ""
    echo "To set up:"
    echo "  • Gemini: npm i -g @google/gemini-cli && gemini"
    echo "  • Claude: npm i -g @anthropic-ai/claude-code"
    echo ""
    echo "Or run the setup wizard:"
    echo "  bash .devcontainer/builder-setup.sh"
    echo ""
    
    # Keep terminal open for manual setup
    exec bash
fi
