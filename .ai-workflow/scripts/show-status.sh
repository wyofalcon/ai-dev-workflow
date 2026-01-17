#!/bin/bash
# Show current workflow mode status
# Called from terminal headers and on-demand

CONTEXT_DIR="${1:-.context}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

# Get current modes
get_relay_mode() {
    if [ -f "$CONTEXT_DIR/RELAY_MODE" ]; then
        cat "$CONTEXT_DIR/RELAY_MODE" | tr -d '[:space:]'
    else
        echo "review"
    fi
}

get_audit_mode() {
    if [ -f "$CONTEXT_DIR/AUDIT_WATCH_MODE" ]; then
        cat "$CONTEXT_DIR/AUDIT_WATCH_MODE" | tr -d '[:space:]'
    else
        echo "on"
    fi
}

RELAY_MODE=$(get_relay_mode)
AUDIT_MODE=$(get_audit_mode)

# Format for display
if [ "$RELAY_MODE" = "auto" ]; then
    RELAY_DISPLAY="${GREEN}AUTO${NC}"
else
    RELAY_DISPLAY="${YELLOW}REVIEW${NC}"
fi

if [ "$AUDIT_MODE" = "on" ]; then
    AUDIT_DISPLAY="${GREEN}ON${NC}"
else
    AUDIT_DISPLAY="${YELLOW}OFF${NC}"
fi

# Output format based on argument
case "${2:-full}" in
    compact)
        echo -e "[Relay: $RELAY_DISPLAY | Audit: $AUDIT_DISPLAY]"
        ;;
    oneline)
        echo -e "📤 Relay: $RELAY_DISPLAY  🔍 Audit: $AUDIT_DISPLAY"
        ;;
    *)
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${DIM}WORKFLOW STATUS${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  📤 Prompt Relay:  $RELAY_DISPLAY"
        echo -e "  🔍 Audit Watch:   $AUDIT_DISPLAY"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${DIM}Toggle: ./scripts/toggle-relay-mode.sh${NC}"
        echo -e "  ${DIM}Toggle: ./scripts/toggle-audit-watch.sh${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ;;
esac
