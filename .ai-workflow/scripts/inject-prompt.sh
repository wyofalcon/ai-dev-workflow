#!/bin/bash
# Inject a prompt into the running builder tmux session
# Called by Copilot to send refined prompts to Gemini CLI
#
# Usage: ./scripts/inject-prompt.sh "your prompt here"
#    or: ./scripts/inject-prompt.sh --file /path/to/prompt.md

SESSION_NAME="builder"
PROMPT_LOG=".context/PROMPT_HISTORY.md"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if tmux session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${RED}❌ Builder session not running${NC}"
    echo ""
    echo "Start it with: ./scripts/start-builder-tmux.sh"
    exit 1
fi

# Get the prompt
PROMPT=""
if [ "$1" = "--file" ] && [ -n "$2" ]; then
    if [ -f "$2" ]; then
        PROMPT=$(cat "$2")
    else
        echo -e "${RED}❌ File not found: $2${NC}"
        exit 1
    fi
elif [ -n "$1" ]; then
    PROMPT="$1"
else
    # Read from stdin
    PROMPT=$(cat)
fi

if [ -z "$PROMPT" ]; then
    echo -e "${RED}❌ No prompt provided${NC}"
    echo "Usage: $0 \"your prompt here\""
    echo "   or: $0 --file /path/to/prompt.md"
    echo "   or: echo \"prompt\" | $0"
    exit 1
fi

# Log the prompt
mkdir -p "$(dirname "$PROMPT_LOG")"
{
    echo ""
    echo "---"
    echo "## $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo '```'
    echo "$PROMPT"
    echo '```'
} >> "$PROMPT_LOG"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📤 Injecting prompt into Builder${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Escape special characters for tmux
# Replace newlines with literal Enter key presses
# This handles multi-line prompts properly

# For multi-line prompts, we need to be careful
# Gemini CLI accepts multi-line input, so we can send it directly
# But we need to escape special tmux characters

# Write prompt to temp file and use tmux load-buffer
TEMP_FILE=$(mktemp)
echo "$PROMPT" > "$TEMP_FILE"

# Load into tmux buffer and paste
tmux load-buffer -b prompt "$TEMP_FILE"
tmux paste-buffer -b prompt -t "$SESSION_NAME"
# Small delay to ensure paste completes before sending Enter
sleep 0.3
tmux send-keys -t "$SESSION_NAME" C-m

rm -f "$TEMP_FILE"

echo -e "${GREEN}✓ Prompt sent to Gemini CLI${NC}"
echo ""
echo -e "View session: ${CYAN}tmux attach -t $SESSION_NAME${NC}"
