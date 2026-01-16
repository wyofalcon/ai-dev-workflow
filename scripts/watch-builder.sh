#!/bin/bash
# Watch Gemini builder status without attaching to tmux
# Shows last few lines of output and activity indicator

SESSION_NAME="builder"
REFRESH_RATE=2

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Spinner frames
SPINNER=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

clear
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🤖 Gemini Builder Monitor${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop watching${NC}"
echo ""

i=0
last_output=""
while true; do
    # Check if session exists
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Builder session not running${NC}"
        echo "Start with: ./scripts/start-builder-tmux.sh"
        exit 1
    fi

    # Capture current pane output (last 15 lines)
    current_output=$(tmux capture-pane -t "$SESSION_NAME" -p 2>/dev/null | tail -15)

    # Spinner animation
    spinner="${SPINNER[$((i % ${#SPINNER[@]}))]}"
    ((i++))

    # Clear and redraw
    clear
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🤖 Gemini Builder Monitor ${spinner}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Detect activity
    if [ "$current_output" != "$last_output" ]; then
        echo -e "${GREEN}● ACTIVE${NC} - Gemini is working..."
    else
        echo -e "${YELLOW}○ IDLE${NC} - Waiting or complete"
    fi
    last_output="$current_output"

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Show last lines (cleaned up)
    echo "$current_output" | grep -v "^$" | tail -12

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Ctrl+C to stop | Full view: tmux attach -t builder${NC}"

    sleep $REFRESH_RATE
done
