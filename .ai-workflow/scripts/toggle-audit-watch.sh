#!/bin/bash
# Toggle Audit Watch Mode on/off
# Shows a visual menu to switch modes

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"

AUDIT_MODE_FILE="$CONTEXT_DIR/AUDIT_WATCH_MODE"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Get current mode
if [ -f "$AUDIT_MODE_FILE" ]; then
    CURRENT_MODE=$(cat "$AUDIT_MODE_FILE" | tr -d '[:space:]')
else
    CURRENT_MODE="on"
fi

# Check for whiptail
if ! command -v whiptail &> /dev/null; then
    echo -e "${YELLOW}Installing UI components...${NC}"
    sudo apt-get update -qq && sudo apt-get install -y -qq whiptail > /dev/null 2>&1
fi

# Show toggle menu
if [ "$CURRENT_MODE" = "on" ]; then
    ON_MARKER=" ✓"
    OFF_MARKER=""
else
    ON_MARKER=""
    OFF_MARKER=" ✓"
fi

CHOICE=$(whiptail --title "🔍 Audit Watch Mode" \
--menu "Current mode: $CURRENT_MODE\n\nShould the Auditor auto-check files on save?" 16 65 2 \
"on" "On$ON_MARKER - Auto-audit files when you save" \
"off" "Off$OFF_MARKER - Manual auditing only" \
3>&1 1>&2 2>&3)

# Check if user cancelled
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Cancelled. Mode unchanged: $CURRENT_MODE${NC}"
    exit 0
fi

# Save the new mode
echo "$CHOICE" > "$AUDIT_MODE_FILE"

# Show confirmation
clear
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Audit Watch Mode Updated${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$CHOICE" = "on" ]; then
    echo -e "  Mode: ${GREEN}ON${NC}"
    echo ""
    echo "  The Auditor will automatically check files when you save."
    echo "  Watch the 'Audit Watch' terminal for real-time feedback."
    echo ""
    echo -e "  ${YELLOW}Note: Restart the Audit Watch task to apply changes.${NC}"
else
    echo -e "  Mode: ${RED}OFF${NC}"
    echo ""
    echo "  Automatic file watching is disabled."
    echo "  Run audits manually:"
    echo "    ${GREEN}./scripts/audit-file.py <file>${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
