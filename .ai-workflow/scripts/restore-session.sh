#!/bin/bash
# Restore SESSION.md if the Builder modified it
# Called automatically by watch-builder.sh or manually after a Builder run

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SESSION_FILE="$PROJECT_ROOT/.ai-workflow/context/SESSION.md"
SESSION_BACKUP="$PROJECT_ROOT/.ai-workflow/context/.SESSION.md.bak"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f "$SESSION_BACKUP" ]; then
    echo -e "${YELLOW}ℹ️  No SESSION.md backup found — nothing to restore.${NC}"
    exit 0
fi

if [ ! -f "$SESSION_FILE" ]; then
    echo -e "${RED}⚠️  SESSION.md is missing! Restoring from backup...${NC}"
    cp "$SESSION_BACKUP" "$SESSION_FILE"
    echo -e "${GREEN}✅ SESSION.md restored from backup.${NC}"
    exit 0
fi

# Compare current SESSION.md with backup
if ! diff -q "$SESSION_FILE" "$SESSION_BACKUP" > /dev/null 2>&1; then
    # Files differ — check if Builder shortened it (sign of overwrite)
    BACKUP_LINES=$(wc -l < "$SESSION_BACKUP")
    CURRENT_LINES=$(wc -l < "$SESSION_FILE")

    if [ "$CURRENT_LINES" -lt "$((BACKUP_LINES / 2))" ]; then
        echo -e "${RED}🚨 SESSION.md was overwritten by Builder! (${CURRENT_LINES} lines vs ${BACKUP_LINES} backup)${NC}"
        echo -e "${YELLOW}   Restoring from backup...${NC}"
        cp "$SESSION_BACKUP" "$SESSION_FILE"
        echo -e "${GREEN}✅ SESSION.md restored to pre-Builder state (${BACKUP_LINES} lines).${NC}"
        echo -e "${YELLOW}   The Auditor should now refresh SESSION.md with Builder's changes.${NC}"
    else
        echo -e "${YELLOW}ℹ️  SESSION.md changed but not truncated (${CURRENT_LINES} vs ${BACKUP_LINES} lines).${NC}"
        echo -e "   Review the diff to decide if it should be restored:"
        echo -e "   ${GREEN}diff $SESSION_FILE $SESSION_BACKUP${NC}"
    fi
else
    echo -e "${GREEN}✅ SESSION.md unchanged — no restore needed.${NC}"
fi
