#!/bin/bash
# Audit Watch - Runs local-audit.py on every file change
# Uses inotifywait (from inotify-tools) to watch for changes

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
AUDIT_MODE_FILE="$CONTEXT_DIR/AUDIT_WATCH_MODE"
PID_FILE="$CONTEXT_DIR/.audit-watch.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Cleanup function
cleanup() {
    rm -f "$PID_FILE" 2>/dev/null
    exit 0
}
trap cleanup EXIT INT TERM

# Check if another instance is already running
check_already_running() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${YELLOW}⚠️  Audit Watch is already running (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo ""
            echo "Options:"
            echo "  • Switch to that terminal"
            echo "  • Kill it: kill $OLD_PID"
            echo "  • Force restart: rm $PID_FILE && $0"
            echo ""
            return 1
        else
            # Stale PID file, remove it
            rm -f "$PID_FILE" 2>/dev/null
        fi
    fi
    return 0
}

# Check for duplicate instance
if ! check_already_running; then
    exit 0
fi

# Write our PID
mkdir -p "$(dirname "$PID_FILE")"
echo $$ > "$PID_FILE"

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
if [ "$COPILOT_REVIEW" = "1" ]; then
echo -e "${BLUE}║${NC}  🤖 ${PURPLE}COPILOT CLI: ENABLED${NC} (Sonnet/Opus auto-escalation)   ${BLUE}║${NC}"
else
echo -e "${BLUE}║${NC}  💡 Tip: COPILOT_REVIEW=1 to enable AI reviews           ${BLUE}║${NC}"
fi
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

# Copilot CLI review mode (off by default, enable with COPILOT_REVIEW=1)
COPILOT_REVIEW="${COPILOT_REVIEW:-0}"
COPILOT_REVIEW_INTERVAL=30  # Minimum seconds between Copilot reviews
LAST_COPILOT_RUN=0

# Workflow signal detection interval
WORKFLOW_CHECK_INTERVAL=60
LAST_WORKFLOW_CHECK=0

show_workflow_signals() {
    local current_time=$(date +%s)
    if (( current_time - LAST_WORKFLOW_CHECK >= WORKFLOW_CHECK_INTERVAL )); then
        LAST_WORKFLOW_CHECK=$current_time
        echo ""
        if [ -x "$SCRIPT_DIR/workflow-signals.sh" ]; then
            "$SCRIPT_DIR/workflow-signals.sh"
        fi
    fi
}

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

    # Check the specific file for issues (pattern-based)
    python3 "$SCRIPT_DIR/audit-file.py" "$file"
    local audit_exit=$?

    # If pattern audit found issues OR Copilot review is enabled, run Copilot
    if [ "$COPILOT_REVIEW" = "1" ]; then
        local time_since_copilot=$((current_time - LAST_COPILOT_RUN))
        if [ $time_since_copilot -ge $COPILOT_REVIEW_INTERVAL ]; then
            LAST_COPILOT_RUN=$current_time
            echo ""
            echo -e "${PURPLE}🤖 Running Copilot CLI review...${NC}"
            "$SCRIPT_DIR/copilot-review.sh" -f "$file" 2>/dev/null || true
        fi
    elif [ $audit_exit -ne 0 ]; then
        # Pattern audit found issues - offer Copilot escalation
        echo ""
        echo -e "${YELLOW}💡 Tip: Run 'COPILOT_REVIEW=1' to enable AI review${NC}"
        echo -e "${YELLOW}   Or: .ai-workflow/scripts/copilot-review.sh -f $file${NC}"
    fi

    # Periodically show workflow status
    show_workflow_signals
}

# Watch for changes
inotifywait -m -r \
    --exclude '(node_modules|\.git|coverage|dist|build|__pycache__)' \
    -e modify,create \
    "$PROJECT_ROOT/src" "$PROJECT_ROOT/api" "$PROJECT_ROOT/scripts" 2>/dev/null | \
while read -r directory events filename; do
    run_audit "${directory}${filename}"
done
