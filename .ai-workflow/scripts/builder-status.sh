#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Builder Status Check - Detect if Builder (Gemini/Claude CLI) is idle or active
# Returns structured status for Copilot to act on
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Check if builder tmux session exists
if ! tmux has-session -t builder 2>/dev/null; then
    echo '{"status":"stopped","idle":false,"message":"Builder tmux session not running"}'
    exit 1
fi

# Capture last 5 lines of builder output
LAST_OUTPUT=$(tmux capture-pane -t builder -p -S -5 2>/dev/null | tail -5)

# Detect idle patterns (CLI waiting for input)
IDLE_PATTERNS=(
    "^>"           # Gemini CLI prompt
    "^❯"          # Claude CLI prompt
    "^claude>"     # Claude prompt
    "^gemini>"     # Gemini prompt
    "^\$"          # Shell prompt
    "waiting for"  # Generic waiting
)

IS_IDLE=false
for pattern in "${IDLE_PATTERNS[@]}"; do
    if echo "$LAST_OUTPUT" | tail -1 | grep -qE "$pattern"; then
        IS_IDLE=true
        break
    fi
done

# Detect completion signals in recent output
COMPLETION_SIGNALS=(
    "committed"
    "changes staged"
    "git add"
    "git commit"
    "Task complete"
    "Done!"
    "finished"
    "All changes"
)

HAS_COMPLETION=false
for signal in "${COMPLETION_SIGNALS[@]}"; do
    if echo "$LAST_OUTPUT" | grep -qi "$signal"; then
        HAS_COMPLETION=true
        break
    fi
done

# Detect error signals
ERROR_SIGNALS=(
    "Error:"
    "error:"
    "FAILED"
    "failed"
    "Cannot find"
    "Module not found"
    "SyntaxError"
    "TypeError"
)

HAS_ERROR=false
ERROR_MSG=""
for signal in "${ERROR_SIGNALS[@]}"; do
    if echo "$LAST_OUTPUT" | grep -qi "$signal"; then
        HAS_ERROR=true
        ERROR_MSG=$(echo "$LAST_OUTPUT" | grep -i "$signal" | tail -1 | tr '"' "'")
        break
    fi
done

# Check for new commits since last known state
LAST_COMMIT=$(git log -1 --format="%H %s" 2>/dev/null)
LAST_COMMIT_AGE=$(git log -1 --format="%cr" 2>/dev/null)

# Build JSON output
if [ "$HAS_ERROR" = true ]; then
    echo "{\"status\":\"error\",\"idle\":$IS_IDLE,\"completed\":false,\"error\":\"$ERROR_MSG\",\"lastCommit\":\"$LAST_COMMIT_AGE\"}"
elif [ "$HAS_COMPLETION" = true ] && [ "$IS_IDLE" = true ]; then
    echo "{\"status\":\"completed\",\"idle\":true,\"completed\":true,\"lastCommit\":\"$LAST_COMMIT_AGE\"}"
elif [ "$IS_IDLE" = true ]; then
    echo "{\"status\":\"idle\",\"idle\":true,\"completed\":false,\"lastCommit\":\"$LAST_COMMIT_AGE\"}"
else
    echo "{\"status\":\"active\",\"idle\":false,\"completed\":false,\"lastCommit\":\"$LAST_COMMIT_AGE\"}"
fi

exit 0
