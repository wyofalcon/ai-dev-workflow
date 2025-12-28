#!/bin/bash
# Show current workflow mode and environment status
# Called from terminal headers and on-demand

CONTEXT_DIR="${1:-.context}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
DIM='\033[2m'
BOLD='\033[1m'
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

get_devenv() {
    if [ -f "$CONTEXT_DIR/ACTIVE_DEVENV" ]; then
        cat "$CONTEXT_DIR/ACTIVE_DEVENV" | tr -d '[:space:]'
    else
        echo "DevLocal"
    fi
}

get_devenv_icon() {
    local env="$1"
    case "$env" in
        DevLocal) echo "🏠" ;;
        DevLive) echo "🌐" ;;
        DevHybrid) echo "🔀" ;;
        *) echo "🌍" ;;
    esac
}

RELAY_MODE=$(get_relay_mode)
AUDIT_MODE=$(get_audit_mode)
DEVENV=$(get_devenv)
DEVENV_ICON=$(get_devenv_icon "$DEVENV")

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

case "$DEVENV" in
    DevLocal) DEVENV_DISPLAY="${GREEN}DevLocal${NC}" ;;
    DevLive) DEVENV_DISPLAY="${YELLOW}DevLive${NC}" ;;
    DevHybrid) DEVENV_DISPLAY="${BLUE}DevHybrid${NC}" ;;
    *) DEVENV_DISPLAY="${DIM}$DEVENV${NC}" ;;
esac

# Output format based on argument
case "${2:-full}" in
    compact)
        echo -e "[${DEVENV_ICON} $DEVENV_DISPLAY | Relay: $RELAY_DISPLAY | Audit: $AUDIT_DISPLAY]"
        ;;
    oneline)
        echo -e "${DEVENV_ICON} $DEVENV_DISPLAY  📤 Relay: $RELAY_DISPLAY  🔍 Audit: $AUDIT_DISPLAY"
        ;;
    env-only)
        echo -e "${DEVENV_ICON} $DEVENV_DISPLAY"
        ;;
    *)
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${DIM}WORKFLOW STATUS${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${DEVENV_ICON} Environment:   $DEVENV_DISPLAY"
        echo -e "  📤 Prompt Relay:  $RELAY_DISPLAY"
        echo -e "  🔍 Audit Watch:   $AUDIT_DISPLAY"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${DIM}Commands:${NC}"
        echo -e "  ${DIM}  devenv    - Change environment${NC}"
        echo -e "  ${DIM}  dq        - DevQuick presets${NC}"
        echo -e "  ${DIM}  creds     - Manage credentials${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ;;
esac

