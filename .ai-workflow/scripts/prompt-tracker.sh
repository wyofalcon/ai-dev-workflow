#!/bin/bash
# Prompt Tracker - Manages unique prompt IDs for the AI dev workflow
# IDs follow format: HHMM:MMDD:letter (EST military time, month/day, sequential letter)
#
# Usage:
#   prompt-tracker.sh add "description"         → Logs a new prompt, returns the ID
#   prompt-tracker.sh status ID new_status      → Updates status (CRAFTED→SENT→BUILDING→DONE→FAILED)
#   prompt-tracker.sh show                      → Shows recent prompts with status
#   prompt-tracker.sh show-compact              → One-line summary for terminal headers
#   prompt-tracker.sh next-id                   → Returns the next ID (without logging)
#   prompt-tracker.sh reset-counter             → Resets the letter counter (new batch)
#   prompt-tracker.sh batch-start               → Starts a new batch (resets counter, returns first ID)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"
TRACKER_FILE="$CONTEXT_DIR/PROMPT_TRACKER.log"
COUNTER_FILE="$CONTEXT_DIR/.prompt-counter"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GOLD='\033[38;5;220m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Ensure files exist
mkdir -p "$CONTEXT_DIR"
touch "$TRACKER_FILE"

# Get current EST time components
get_est_time() {
    TZ="America/New_York" date "+%H%M"
}

get_est_date() {
    TZ="America/New_York" date "+%m%d"
}

get_full_timestamp() {
    TZ="America/New_York" date "+%Y-%m-%dT%H:%M:%S%z"
}

# Get the current letter counter (a=1, b=2, etc.)
get_counter() {
    if [ -f "$COUNTER_FILE" ]; then
        cat "$COUNTER_FILE" | tr -d '[:space:]'
    else
        echo "0"
    fi
}

# Increment counter and return the letter
next_letter() {
    local count=$(get_counter)
    count=$((count + 1))
    echo "$count" > "$COUNTER_FILE"
    # Convert number to letter (1=a, 2=b, ..., 26=z)
    printf "\\$(printf '%03o' $((count + 96)))"
}

# Generate the next prompt ID
generate_id() {
    local time_part=$(get_est_time)
    local date_part=$(get_est_date)
    local letter=$(next_letter)
    echo "${time_part}:${date_part}:${letter}"
}

# Peek at the next ID without consuming it
peek_next_id() {
    local time_part=$(get_est_time)
    local date_part=$(get_est_date)
    local count=$(get_counter)
    count=$((count + 1))
    local letter=$(printf "\\$(printf '%03o' $((count + 96)))")
    echo "${time_part}:${date_part}:${letter}"
}

# Status emoji mapping
status_emoji() {
    case "$1" in
        CRAFTED)  echo "📝" ;;
        SENT)     echo "📤" ;;
        BUILDING) echo "🔨" ;;
        DONE)     echo "✅" ;;
        FAILED)   echo "❌" ;;
        PARTIAL)  echo "⚠️" ;;
        *)        echo "❓" ;;
    esac
}

# Status color mapping
status_color() {
    case "$1" in
        CRAFTED)  echo "$YELLOW" ;;
        SENT)     echo "$BLUE" ;;
        BUILDING) echo "$PURPLE" ;;
        DONE)     echo "$GREEN" ;;
        FAILED)   echo "$RED" ;;
        PARTIAL)  echo "$YELLOW" ;;
        *)        echo "$NC" ;;
    esac
}

# ═══════════════════════════════════════════════════════════════
# COMMANDS
# ═══════════════════════════════════════════════════════════════

case "${1:-show}" in
    add)
        # Add a new prompt entry
        DESCRIPTION="${2:-No description}"
        ID=$(generate_id)
        TIMESTAMP=$(get_full_timestamp)
        echo "${ID}|CRAFTED|${TIMESTAMP}|${DESCRIPTION}" >> "$TRACKER_FILE"
        echo "$ID"
        ;;

    status)
        # Update the status of a prompt
        PROMPT_ID="$2"
        NEW_STATUS="$3"
        if [ -z "$PROMPT_ID" ] || [ -z "$NEW_STATUS" ]; then
            echo "Usage: prompt-tracker.sh status <ID> <STATUS>"
            echo "Statuses: CRAFTED, SENT, BUILDING, DONE, FAILED, PARTIAL"
            exit 1
        fi
        # Update in place using sed
        if grep -q "^${PROMPT_ID}|" "$TRACKER_FILE"; then
            sed -i "s/^${PROMPT_ID}|\([^|]*\)|/${PROMPT_ID}|${NEW_STATUS}|/" "$TRACKER_FILE"
            echo -e "$(status_emoji "$NEW_STATUS") ${PROMPT_ID} → ${NEW_STATUS}"
        else
            echo -e "${RED}❌ Prompt ID not found: ${PROMPT_ID}${NC}"
            exit 1
        fi
        ;;

    show)
        # Show recent prompts with status
        if [ ! -s "$TRACKER_FILE" ]; then
            echo -e "${DIM}No prompts tracked yet.${NC}"
            exit 0
        fi
        echo -e "${GOLD}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GOLD}${BOLD}║${NC}  🏷️  ${GOLD}${BOLD}PROMPT TRACKER${NC}                                     ${GOLD}${BOLD}║${NC}"
        echo -e "${GOLD}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""

        # Show last 10 prompts (most recent first)
        tac "$TRACKER_FILE" | head -10 | while IFS='|' read -r id status timestamp desc; do
            local_emoji=$(status_emoji "$status")
            local_color=$(status_color "$status")
            # Truncate description to 40 chars
            short_desc="${desc:0:45}"
            [ "${#desc}" -gt 45 ] && short_desc="${short_desc}..."
            echo -e "  ${GOLD}${BOLD}${id}${NC}  ${local_color}${status}${NC}  ${local_emoji}  ${DIM}${short_desc}${NC}"
        done
        echo ""
        ;;

    show-compact)
        # Two-line summary: last committed prompt + any active prompt
        if [ ! -s "$TRACKER_FILE" ]; then
            echo -e "🏷️  No prompts tracked yet"
            exit 0
        fi

        DONE_COUNT=$(grep -c '|DONE|' "$TRACKER_FILE" 2>/dev/null | tr -d '[:space:]')
        FAILED_COUNT=$(grep -c '|FAILED|' "$TRACKER_FILE" 2>/dev/null | tr -d '[:space:]')
        PARTIAL_COUNT=$(grep -c '|PARTIAL|' "$TRACKER_FILE" 2>/dev/null | tr -d '[:space:]')
        DONE_COUNT=${DONE_COUNT:-0}
        FAILED_COUNT=${FAILED_COUNT:-0}
        PARTIAL_COUNT=${PARTIAL_COUNT:-0}

        # Last fully committed (DONE) prompt
        LAST_DONE_LINE=$(grep '|DONE|' "$TRACKER_FILE" | tail -1)
        if [ -n "$LAST_DONE_LINE" ]; then
            LAST_DONE_ID=$(echo "$LAST_DONE_LINE" | cut -d'|' -f1)
            LAST_DONE_DESC=$(echo "$LAST_DONE_LINE" | cut -d'|' -f4)
            SHORT_DESC="${LAST_DONE_DESC:0:35}"
            [ "${#LAST_DONE_DESC}" -gt 35 ] && SHORT_DESC="${SHORT_DESC}..."
            echo -e "  ${GREEN}✅ Last Committed:${NC} ${GOLD}${BOLD}${LAST_DONE_ID}${NC}  ${DIM}${SHORT_DESC}${NC}"
        else
            echo -e "  ${DIM}✅ Last Committed: none yet${NC}"
        fi

        # Any active (CRAFTED/SENT/BUILDING) prompt
        ACTIVE_LINE=$(grep -E '\|(CRAFTED|SENT|BUILDING)\|' "$TRACKER_FILE" | tail -1)
        if [ -n "$ACTIVE_LINE" ]; then
            ACTIVE_ID=$(echo "$ACTIVE_LINE" | cut -d'|' -f1)
            ACTIVE_STATUS=$(echo "$ACTIVE_LINE" | cut -d'|' -f2)
            ACTIVE_DESC=$(echo "$ACTIVE_LINE" | cut -d'|' -f4)
            ACTIVE_EMOJI=$(status_emoji "$ACTIVE_STATUS")
            SHORT_ADESC="${ACTIVE_DESC:0:35}"
            [ "${#ACTIVE_DESC}" -gt 35 ] && SHORT_ADESC="${SHORT_ADESC}..."
            ACOLOR=$(status_color "$ACTIVE_STATUS")
            echo -e "  ${PURPLE}🔨 In Progress:${NC}    ${GOLD}${BOLD}${ACTIVE_ID}${NC}  ${ACOLOR}${ACTIVE_STATUS}${NC} ${ACTIVE_EMOJI}  ${DIM}${SHORT_ADESC}${NC}"
        else
            echo -e "  ${DIM}🔨 In Progress:    none${NC}"
        fi

        # Failure/partial alerts
        if [ "$FAILED_COUNT" -gt 0 ] || [ "$PARTIAL_COUNT" -gt 0 ]; then
            echo -e "  ${RED}⚠️  Alerts: ${FAILED_COUNT} FAILED, ${PARTIAL_COUNT} PARTIAL${NC}"
        fi
        ;;

    next-id)
        # Peek at the next ID without consuming it
        peek_next_id
        ;;

    reset-counter)
        # Reset the letter counter for a new batch
        echo "0" > "$COUNTER_FILE"
        echo -e "${GREEN}✓ Prompt counter reset${NC}"
        ;;

    batch-start)
        # Start a new batch: reset counter and return the first available ID
        echo "0" > "$COUNTER_FILE"
        peek_next_id
        ;;

    clear)
        # Clear all tracked prompts (archive first)
        if [ -s "$TRACKER_FILE" ]; then
            ARCHIVE="$CONTEXT_DIR/PROMPT_TRACKER_$(date +%Y%m%d_%H%M%S).archive"
            cp "$TRACKER_FILE" "$ARCHIVE"
            > "$TRACKER_FILE"
            echo "0" > "$COUNTER_FILE"
            echo -e "${GREEN}✓ Tracker cleared. Archive: ${ARCHIVE}${NC}"
        else
            echo -e "${DIM}Nothing to clear.${NC}"
        fi
        ;;

    *)
        echo "Usage: prompt-tracker.sh <command>"
        echo ""
        echo "Commands:"
        echo "  add \"description\"       Log a new prompt, returns its ID"
        echo "  status ID STATUS        Update prompt status"
        echo "  show                    Show recent prompts"
        echo "  show-compact            One-line summary"
        echo "  next-id                 Preview next ID (without logging)"
        echo "  reset-counter           Reset letter counter"
        echo "  batch-start             Reset counter, return first ID"
        echo "  clear                   Archive and clear tracker"
        echo ""
        echo "Statuses: CRAFTED, SENT, BUILDING, DONE, FAILED, PARTIAL"
        ;;
esac
