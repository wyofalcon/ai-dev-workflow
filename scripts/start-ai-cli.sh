#!/bin/bash
# Start the configured AI CLI (Gemini or Claude)
# Called by VS Code task to open in split terminal with Audit Watch

# Fix VS Code debugger bootloader issue
unset NODE_OPTIONS

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.context/.ai-builder.pid"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cleanup function
cleanup() {
    rm -f "$PID_FILE" 2>/dev/null
    exit 0
}
trap cleanup EXIT INT TERM

# Check if another instance is already running
check_already_running() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${YELLOW}⚠️  AI Builder CLI is already running (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo ""
            echo "Options:"
            echo "  • Switch to that terminal"
            echo "  • Kill it: kill $OLD_PID"
            echo "  • Force restart: rm $PID_FILE && $0"
            echo ""
            return 1
        else
            # Stale PID file, remove it
            rm -f "$PID_FILE" 2>/dev/null
        fi
    fi
    return 0
}

# Check for duplicate instance
if ! check_already_running; then
    exit 0
fi

# Write our PID
mkdir -p "$(dirname "$PID_FILE")"
echo $$ > "$PID_FILE"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🤖 AI Builder CLI${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Show workflow status
if [ -f "$SCRIPT_DIR/show-status.sh" ]; then
    bash "$SCRIPT_DIR/show-status.sh" ".context" oneline
    echo ""
fi

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
