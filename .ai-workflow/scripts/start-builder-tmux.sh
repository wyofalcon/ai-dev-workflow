#!/bin/bash
# Start Gemini CLI in a tmux session for automated prompt injection
# Session name: builder
#
# IMPORTANT: This creates a DETACHED session so VS Code terminals remain usable.
# Copilot injects prompts via tmux send-keys, no need to attach.
# To view Gemini: tmux attach -t builder

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOW_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$WORKFLOW_ROOT")"
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
    echo -e "${GREEN}✓ Builder session already running (detached)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Copilot can inject prompts - no need to attach!"
    echo ""
    echo "To view Gemini:  tmux attach -t $SESSION_NAME"
    echo "To kill:         tmux kill-session -t $SESSION_NAME"
    echo ""
    exit 0
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
CLI_EXTRA_FLAGS="--yolo"  # YOLO mode: auto-approve all actions so builder doesn't hang
if [ -f ~/.gemini/settings.json ] && grep -q "oauth" ~/.gemini/settings.json 2>/dev/null; then
    CLI_CMD="gemini"
elif [ -n "$ANTHROPIC_API_KEY" ]; then
    CLI_CMD="claude"
    CLI_EXTRA_FLAGS="--dangerously-skip-permissions"  # Claude equivalent of YOLO mode
fi

# Create tmux session with Gemini CLI
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_ROOT"

# Send initial setup commands
tmux send-keys -t "$SESSION_NAME" "cd $PROJECT_ROOT" Enter
tmux send-keys -t "$SESSION_NAME" "clear" Enter
tmux send-keys -t "$SESSION_NAME" "echo '🤖 AI Builder Ready (YOLO mode) - Copilot can inject prompts'" Enter
tmux send-keys -t "$SESSION_NAME" "echo ''" Enter
tmux send-keys -t "$SESSION_NAME" "$CLI_CMD $CLI_EXTRA_FLAGS" Enter

echo -e "${GREEN}✓ Builder session started (detached)${NC}"

# Also create shell session for bash commands if it doesn't exist
if ! tmux has-session -t shell 2>/dev/null; then
    echo -e "${BLUE}Creating shell session for bash commands...${NC}"
    tmux new-session -d -s shell -c "$PROJECT_ROOT"
    tmux send-keys -t shell "cd $PROJECT_ROOT && clear" Enter
    tmux send-keys -t shell "echo '🐚 Shell session ready - for git, docker, npm commands'" Enter
    echo -e "${GREEN}✓ Shell session started (detached)${NC}"
fi

echo ""
echo "Copilot can now inject prompts directly!"
echo ""
echo -e "  Builder (Gemini): ${CYAN}tmux attach -t builder${NC}"
echo -e "  Shell (Bash):     ${CYAN}tmux attach -t shell${NC}"
echo -e "  (Detach with: Ctrl+B, then D)"
echo ""
# Don't attach - keep the terminal free for Copilot commands
exit 0
