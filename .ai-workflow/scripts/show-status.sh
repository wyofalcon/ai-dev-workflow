#!/bin/bash
# Show current workflow mode status + git workflow signals
# Called from terminal headers and on-demand

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="${1:-$SCRIPT_DIR/../context}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
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
    workflow)
        # Run the full workflow signals detection
        "$SCRIPT_DIR/workflow-signals.sh"
        ;;
    *)
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${DIM}AI DEV WORKFLOW STATUS${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  📤 Prompt Relay:  $RELAY_DISPLAY"
        echo -e "  🔍 Audit Watch:   $AUDIT_DISPLAY"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

        # Show workflow signals if available
        if [ -x "$SCRIPT_DIR/workflow-signals.sh" ]; then
            "$SCRIPT_DIR/workflow-signals.sh"
        fi

        echo ""
        echo -e "  ${DIM}Commands:${NC}"
        echo -e "  ${DIM}  Toggle relay:  .ai-workflow/scripts/toggle-relay-mode.sh${NC}"
        echo -e "  ${DIM}  Toggle audit:  .ai-workflow/scripts/toggle-audit-watch.sh${NC}"
        echo -e "  ${DIM}  Workflow only: .ai-workflow/scripts/workflow-signals.sh${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ;;
esac
