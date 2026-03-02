#!/bin/bash
# Start AI Auditor Delegate in a background tmux session
# Session name: auditor-ai

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOW_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$WORKFLOW_ROOT")"
SESSION_NAME="auditor-ai"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$PROJECT_ROOT" || exit 1

# Check if tmux session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓ AI Auditor session already running (detached)${NC}"
    exit 0
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🧠 Starting AI Auditor Delegate in tmux session${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Source config if exists
if [ -f "$WORKFLOW_ROOT/config/models.conf" ]; then
    source "$WORKFLOW_ROOT/config/models.conf"
fi

MODEL=${AUDITOR_AI_MODEL:-"gemini-2.0-flash"}

# Create tmux session
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_ROOT"

# Send initial setup and prompt
tmux send-keys -t "$SESSION_NAME" "unset NODE_OPTIONS" Enter
tmux send-keys -t "$SESSION_NAME" "gemini --model $MODEL --sandbox=auto_edit" Enter

sleep 2 # wait for gemini to load

INITIAL_PROMPT="You are a code auditor. Your ONLY job is to review code changes and report issues. You NEVER write code or make changes. You respond with structured JSON audit reports. When given a diff or file to review, respond with: {"severity": "pass|warn|fail", "issues": [{"type": "security|quality|style|perf|test", "severity": "critical|warning|info", "file": "path", "line": N, "message": "description", "suggestion": "fix hint"}], "summary": "one-line summary"} Rules: - Flag hardcoded secrets, SQL injection, XSS vectors (critical) - Flag missing error handling in async functions (warning) - Flag missing data-testid on interactive UI elements (warning) - Flag console.log in non-test files (warning) - Flag functions >50 lines (info) - Flag missing TypeScript types or JSDoc (info) - Flag potential memory leaks (useEffect without cleanup) (warning) - Flag direct DOM manipulation in React components (warning) - Flag missing input validation on API endpoints (warning)"

tmux send-keys -t "$SESSION_NAME" "$INITIAL_PROMPT" Enter

echo -e "${GREEN}✓ AI Auditor session started (detached)${NC}"
