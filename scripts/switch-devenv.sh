#!/bin/bash
# Switch Development Environment
# Quick toggle between DevLocal, DevLive, and DevHybrid

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTEXT_DIR="$PROJECT_ROOT/.context"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Get current environment
get_current_env() {
    if [ -f "$CONTEXT_DIR/ACTIVE_DEVENV" ]; then
        cat "$CONTEXT_DIR/ACTIVE_DEVENV" | tr -d '[:space:]'
    else
        echo "DevLocal"
    fi
}

CURRENT=$(get_current_env)

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}   🌍 Switch Development Environment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   Current: ${GREEN}${BOLD}$CURRENT${NC}"
echo ""

# Check if argument provided
if [ -n "$1" ]; then
    TARGET="$1"
else
    # Show menu
    echo -e "   ${GREEN}1${NC}. 🏠 DevLocal  - Mock services (zero cost)"
    echo -e "   ${GREEN}2${NC}. 🌐 DevLive   - Real dev services"
    echo -e "   ${GREEN}3${NC}. 🔀 DevHybrid - Mix and match"
    echo ""
    read -p "   Select (1-3): " choice

    case "$choice" in
        1) TARGET="DevLocal" ;;
        2) TARGET="DevLive" ;;
        3) TARGET="DevHybrid" ;;
        *)
            echo -e "${YELLOW}Cancelled.${NC}"
            exit 0
            ;;
    esac
fi

# Validate target
case "$TARGET" in
    DevLocal|devlocal|local|1)
        TARGET="DevLocal"
        ;;
    DevLive|devlive|live|2)
        TARGET="DevLive"
        ;;
    DevHybrid|devhybrid|hybrid|3)
        TARGET="DevHybrid"
        ;;
    *)
        echo -e "${YELLOW}Unknown environment: $TARGET${NC}"
        echo "Valid options: DevLocal, DevLive, DevHybrid"
        exit 1
        ;;
esac

# Apply the change
python3 "$SCRIPT_DIR/devenv-manager.py" --set "$TARGET"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Switched to $TARGET${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
