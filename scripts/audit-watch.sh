#!/bin/bash
# Audit Watch - Runs local-audit.py on every file change
# Uses inotifywait (from inotify-tools) to watch for changes

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUDIT_MODE_FILE="$PROJECT_ROOT/.context/AUDIT_WATCH_MODE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if audit watch is enabled
check_audit_mode() {
    if [ -f "$AUDIT_MODE_FILE" ]; then
        MODE=$(cat "$AUDIT_MODE_FILE" | tr -d '[:space:]')
        if [ "$MODE" = "off" ]; then
            return 1
        fi
    fi
    return 0
}

# Initial mode check
if ! check_audit_mode; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║${NC}  🔍 ${YELLOW}AUDIT WATCH MODE: OFF${NC}                               ${YELLOW}║${NC}"
    echo -e "${YELLOW}║${NC}     Automatic file watching is disabled.                 ${YELLOW}║${NC}"
    echo -e "${YELLOW}║${NC}     Run: ${GREEN}./scripts/toggle-audit-watch.sh${NC} to enable       ${YELLOW}║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Waiting for mode change..."
    # Watch for mode file changes
    while true; do
        sleep 5
        if check_audit_mode; then
            echo -e "${GREEN}Audit Watch enabled! Restarting...${NC}"
            exec "$0"  # Restart this script
        fi
    done
    exit 0
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  🔍 ${GREEN}AUDIT WATCH MODE: ON${NC}                                 ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}     Watching for changes... Press Ctrl+C to stop.        ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show workflow status
if [ -f "$SCRIPT_DIR/show-status.sh" ]; then
    bash "$SCRIPT_DIR/show-status.sh" "$PROJECT_ROOT/.context" oneline
    echo ""
fi

# Check if inotifywait is available
if ! command -v inotifywait &> /dev/null; then
    echo -e "${YELLOW}📦 Installing inotify-tools...${NC}"
    # Wait for apt lock if another process is using it
    while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
        echo -e "${YELLOW}   Waiting for apt lock...${NC}"
        sleep 2
    done
    sudo apt-get update -qq && sudo apt-get install -y -qq inotify-tools
fi

# Debounce: track last run time to avoid running multiple times for one save
LAST_RUN=0
DEBOUNCE_SECONDS=2

run_audit() {
    local file="$1"
    local current_time=$(date +%s)

    # Skip if we just ran (debounce)
    if (( current_time - LAST_RUN < DEBOUNCE_SECONDS )); then
        return
    fi
    LAST_RUN=$current_time

    # Skip certain files/directories
    if [[ "$file" =~ node_modules|\.git|coverage|dist|build|__pycache__|\.pyc ]]; then
        return
    fi

    # Only check relevant file types
    if [[ ! "$file" =~ \.(js|jsx|ts|tsx|py|json|md)$ ]]; then
        return
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "📄 Changed: ${YELLOW}${file}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Run audit on current working directory changes
    cd "$PROJECT_ROOT"

    # Check the specific file for issues
    python3 "$SCRIPT_DIR/audit-file.py" "$file"
}

# Watch for changes
inotifywait -m -r \
    --exclude '(node_modules|\.git|coverage|dist|build|__pycache__)' \
    -e modify,create \
    "$PROJECT_ROOT/src" "$PROJECT_ROOT/api" "$PROJECT_ROOT/scripts" 2>/dev/null | \
while read -r directory events filename; do
    run_audit "${directory}${filename}"
done
