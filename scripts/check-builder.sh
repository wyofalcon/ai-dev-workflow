#!/bin/bash
# Check if the builder tmux session is running
# Returns exit code 0 if running, 1 if not
# Used by Copilot to verify before injecting prompts

SESSION_NAME="builder"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "running"
    exit 0
else
    echo "stopped"
    exit 1
fi
