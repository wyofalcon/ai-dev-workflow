#!/bin/bash
# Start Gemini CLI in a tmux session for automated prompt injection
# Session name: builder

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SESSION_NAME="builder"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fix VS Code debugger bootloader issue
unset NODE_OPTIONS

cd "$PROJECT_ROOT" || exit 1

# Check if tmux session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Builder session already running${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Options:"
    echo "  • Attach: tmux attach -t $SESSION_NAME"
    echo "  • Kill:   tmux kill-session -t $SESSION_NAME"
    echo ""
    echo -e "${CYAN}Attaching now...${NC}"
    exec tmux attach -t "$SESSION_NAME"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🤖 Starting AI Builder in tmux session${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Session name: ${CYAN}$SESSION_NAME${NC}"
echo -e "Copilot can now inject prompts directly!"
echo ""

# Determine which CLI to use
CLI_CMD="gemini"
if [ -f ~/.gemini/settings.json ] && grep -q "oauth" ~/.gemini/settings.json 2>/dev/null; then
    CLI_CMD="gemini"
elif [ -n "$ANTHROPIC_API_KEY" ]; then
    CLI_CMD="claude"
fi

# Create tmux session with Gemini CLI
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_ROOT"

# Send initial setup commands
tmux send-keys -t "$SESSION_NAME" "cd $PROJECT_ROOT" Enter
tmux send-keys -t "$SESSION_NAME" "clear" Enter
tmux send-keys -t "$SESSION_NAME" "echo '🤖 AI Builder Ready - Copilot can inject prompts'" Enter
tmux send-keys -t "$SESSION_NAME" "echo ''" Enter
tmux send-keys -t "$SESSION_NAME" "$CLI_CMD" Enter

echo -e "${GREEN}✓ Builder session started${NC}"
echo ""
echo -e "To view: ${CYAN}tmux attach -t $SESSION_NAME${NC}"
echo ""

# Attach to the session
exec tmux attach -t "$SESSION_NAME"
