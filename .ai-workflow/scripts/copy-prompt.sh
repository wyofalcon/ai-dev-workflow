#!/bin/bash
# Copy the contents of PROMPT.md to clipboard using VS Code
# Works in devcontainers where system clipboard isn't available

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"

PROMPT_FILE="$CONTEXT_DIR/PROMPT.md"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "❌ No prompt file found"
    exit 1
fi

# Extract just the prompt content (between the --- markers)
PROMPT=$(awk '/^---$/{p=!p; next} p && !/^## How to Send/' "$PROMPT_FILE" | sed '/^$/d')

if [ -z "$PROMPT" ]; then
    echo "❌ No prompt content found"
    exit 1
fi

# Write to a temp file that VS Code can access
TEMP_FILE="/tmp/copilot-prompt.txt"
echo "$PROMPT" > "$TEMP_FILE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PROMPT READY TO COPY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$PROMPT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📎 Select all text above and copy (Ctrl+Shift+C in terminal)"
echo "   Or: The prompt is also in /tmp/copilot-prompt.txt"
echo ""
