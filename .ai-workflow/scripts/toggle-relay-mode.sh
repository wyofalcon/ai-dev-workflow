#!/bin/bash
# Toggle between Review and Auto mode for prompt relay
# Shows a visual menu to switch modes

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"

RELAY_MODE_FILE="$CONTEXT_DIR/RELAY_MODE"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get current mode
if [ -f "$RELAY_MODE_FILE" ]; then
    CURRENT_MODE=$(cat "$RELAY_MODE_FILE" | tr -d '[:space:]')
else
    CURRENT_MODE="review"
fi

# Check for whiptail
if ! command -v whiptail &> /dev/null; then
    echo -e "${YELLOW}Installing UI components...${NC}"
    sudo apt-get update -qq && sudo apt-get install -y -qq whiptail > /dev/null 2>&1
fi

# Show toggle menu
if [ "$CURRENT_MODE" = "auto" ]; then
    REVIEW_MARKER=""
    AUTO_MARKER=" ✓"
else
    REVIEW_MARKER=" ✓"
    AUTO_MARKER=""
fi

CHOICE=$(whiptail --title "⚙️  Prompt Relay Mode" \
--menu "Current mode: $CURRENT_MODE\n\nHow should Copilot send prompts to the Builder?" 16 65 2 \
"review" "Review Mode$REVIEW_MARKER - You check prompts before sending" \
"auto" "Auto Mode$AUTO_MARKER - Prompts ready to send immediately" \
3>&1 1>&2 2>&3)

# Check if user cancelled
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Cancelled. Mode unchanged: $CURRENT_MODE${NC}"
    exit 0
fi

# Save the new mode
echo "$CHOICE" > "$RELAY_MODE_FILE"

# Show confirmation
clear
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Prompt Relay Mode Updated${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$CHOICE" = "auto" ]; then
    echo -e "  Mode: ${GREEN}AUTO${NC}"
    echo ""
    echo "  When you describe an idea to Copilot:"
    echo "    1. Copilot writes the prompt to .context/PROMPT.md"
    echo "    2. Run: ${GREEN}./scripts/send-prompt.sh${NC}"
    echo "    3. Paste into Builder terminal"
else
    echo -e "  Mode: ${YELLOW}REVIEW${NC}"
    echo ""
    echo "  When you describe an idea to Copilot:"
    echo "    1. Copilot writes the prompt to .context/PROMPT.md"
    echo "    2. Review the prompt in that file"
    echo "    3. Copy/paste to Builder when ready"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
