#!/bin/bash
# AI Dev Workflow - Audit Watch
# Watches for file changes and runs security/quality audits in real-time

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 Audit Watch Mode${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Watching for file changes..."
echo -e "${YELLOW}Auditor:${NC} Pattern checks + GitHub Copilot"
echo -e "${YELLOW}Builder:${NC} Gemini/Claude CLI"
echo ""

# Install inotify-tools if not present
if ! command -v inotifywait &> /dev/null; then
    echo -e "${YELLOW}📦 Installing file watcher...${NC}"
    # Wait for apt lock (in case other processes are using it)
    while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
        sleep 1
    done
    sudo apt-get update -qq && sudo apt-get install -y -qq inotify-tools > /dev/null 2>&1
fi

# Load watch directories from config or use defaults
CONFIG_FILE="$PROJECT_ROOT/.audit-config.json"
if [ -f "$CONFIG_FILE" ]; then
    WATCH_DIRS=$(cat "$CONFIG_FILE" | grep -oP '"watchDirs":\s*\[\K[^\]]+' | tr -d '"' | tr ',' ' ')
else
    WATCH_DIRS="src api scripts"
fi

# Build watch path list
WATCH_PATHS=""
for dir in $WATCH_DIRS; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        WATCH_PATHS="$WATCH_PATHS $PROJECT_ROOT/$dir"
    fi
done

if [ -z "$WATCH_PATHS" ]; then
    echo -e "${YELLOW}⚠️  No watch directories found. Watching current directory.${NC}"
    WATCH_PATHS="$PROJECT_ROOT"
fi

echo -e "${BLUE}Watching:${NC} $WATCH_DIRS"
echo ""

# Watch for file changes
LAST_FILE=""
LAST_TIME=0

inotifywait -m -r -e modify,create --format '%w%f' $WATCH_PATHS 2>/dev/null | while read FILE; do
    # Debounce (2 seconds)
    CURRENT_TIME=$(date +%s)
    if [ "$FILE" = "$LAST_FILE" ] && [ $((CURRENT_TIME - LAST_TIME)) -lt 2 ]; then
        continue
    fi
    LAST_FILE="$FILE"
    LAST_TIME=$CURRENT_TIME

    # Skip non-code files
    if [[ ! "$FILE" =~ \.(js|ts|jsx|tsx|py|json|css|scss|html|sql|sh)$ ]]; then
        continue
    fi

    # Skip node_modules and build directories
    if [[ "$FILE" =~ node_modules|dist|build|\.next|__pycache__ ]]; then
        continue
    fi

    RELATIVE_FILE="${FILE#$PROJECT_ROOT/}"
    echo ""
    echo -e "${BLUE}📝 Changed:${NC} $RELATIVE_FILE"
    
    # Run audit on the file
    if [ -f "$SCRIPT_DIR/audit-file.py" ]; then
        python3 "$SCRIPT_DIR/audit-file.py" "$FILE"
    fi
done
