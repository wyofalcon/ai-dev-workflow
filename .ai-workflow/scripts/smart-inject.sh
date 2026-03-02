#!/bin/bash
# Smart Prompt Injection with Branch Management
# Analyzes prompt, suggests branch, and handles switching before injection
# Also runs prompt pre-audit for duplicates and auto-appends coding standards

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT="$1"
FORCE_BRANCH="$2"  # Optional: override branch name

if [ -z "$PROMPT" ]; then
    echo "❌ Usage: smart-inject.sh \"<prompt>\" [branch-name]"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════
# CONTEXT SYNC - Ensure agents have current project state
# ═══════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Syncing Project Context..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run context sync and capture summary
CONTEXT_OUTPUT=$(python3 "$SCRIPT_DIR/context-sync.py" --auto-update 2>&1) || true
echo "$CONTEXT_OUTPUT" | grep -E "^(✅|⚠️|📌|📊|📝|🔄)" || true

# Get context summary to prepend to prompt
CONTEXT_SUMMARY=$(python3 "$SCRIPT_DIR/context-sync.py" --summary-only 2>/dev/null) || true

# ═══════════════════════════════════════════════════════════════
# PROMPT PRE-AUDIT
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Running Prompt Pre-Audit..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run prompt audit and capture enhanced prompt
AUDIT_OUTPUT=$(python3 "$SCRIPT_DIR/prompt-audit.py" "$PROMPT" 2>&1) || true

# Extract warnings (lines starting with ⚠️)
WARNINGS=$(echo "$AUDIT_OUTPUT" | grep -E "^⚠️" || true)
if [ -n "$WARNINGS" ]; then
    echo "$WARNINGS"
    echo ""
fi

# Extract enhanced prompt (after "--- Enhanced Prompt ---")
ENHANCED_PROMPT=$(echo "$AUDIT_OUTPUT" | sed -n '/--- Enhanced Prompt ---/,$p' | tail -n +2)
if [ -n "$ENHANCED_PROMPT" ]; then
    PROMPT="$ENHANCED_PROMPT"
    echo "✅ Coding standards auto-appended"
else
    echo "✅ Prompt passed pre-audit"
fi

# Prepend context summary to prompt
if [ -n "$CONTEXT_SUMMARY" ]; then
    PROMPT="$CONTEXT_SUMMARY

$PROMPT"
    echo "✅ Project context prepended"
fi

# ═══════════════════════════════════════════════════════════════
# BRANCH ANALYSIS
# ═══════════════════════════════════════════════════════════════

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Smart Branch Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Current branch: $CURRENT_BRANCH"

# Extract keywords from prompt to suggest branch name
suggest_branch() {
    local prompt="$1"
    local suggestion=""

    # Convert to lowercase for matching
    local lower_prompt=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

    # Match common patterns
    if echo "$lower_prompt" | grep -qE "onboarding|onboard"; then
        suggestion="remove-onboarding"
    elif echo "$lower_prompt" | grep -qE "wizard|onboard"; then
        suggestion="wizard-feature"
    elif echo "$lower_prompt" | grep -qE "portfolio"; then
        suggestion="portfolio-feature"
    elif echo "$lower_prompt" | grep -qE "auth|login|signup|register"; then
        suggestion="auth-improvements"
    elif echo "$lower_prompt" | grep -qE "test|testing|jest|playwright"; then
        suggestion="test-fixes"
    elif echo "$lower_prompt" | grep -qE "bug|fix|hotfix|patch"; then
        suggestion="bugfix"
    elif echo "$lower_prompt" | grep -qE "refactor|cleanup|clean.?up"; then
        suggestion="refactor"
    elif echo "$lower_prompt" | grep -qE "docs|documentation|readme"; then
        suggestion="docs-update"
    elif echo "$lower_prompt" | grep -qE "deploy|ci|cd|pipeline"; then
        suggestion="infra"
    elif echo "$lower_prompt" | grep -qE "ui|ux|design|style|css"; then
        suggestion="ui-improvements"
    elif echo "$lower_prompt" | grep -qE "api|backend|endpoint"; then
        suggestion="api-changes"
    elif echo "$lower_prompt" | grep -qE "extension|chrome|browser"; then
        suggestion="extension-update"
    else
        # Extract first significant noun from Task title if present
        local task_title=$(echo "$prompt" | grep -oP '(?<=Task:?\s)[^\n]+' | head -1)
        if [ -n "$task_title" ]; then
            # Convert to kebab-case
            suggestion=$(echo "$task_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-30)
        fi
    fi

    echo "$suggestion"
}

# Get suggested branch
if [ -n "$FORCE_BRANCH" ]; then
    SUGGESTED_BRANCH="$FORCE_BRANCH"
    echo "📝 Forced branch: $SUGGESTED_BRANCH"
else
    SUGGESTED_BRANCH=$(suggest_branch "$PROMPT")
    if [ -n "$SUGGESTED_BRANCH" ]; then
        echo "💡 Suggested branch: $SUGGESTED_BRANCH"
    else
        echo "💡 No specific branch detected, using current"
        SUGGESTED_BRANCH="$CURRENT_BRANCH"
    fi
fi

# Check if we need to switch
if [ "$CURRENT_BRANCH" != "$SUGGESTED_BRANCH" ] && [ "$SUGGESTED_BRANCH" != "$CURRENT_BRANCH" ]; then
    echo ""
    echo "⚠️  Branch mismatch detected!"
    echo "   Current:   $CURRENT_BRANCH"
    echo "   Suggested: $SUGGESTED_BRANCH"
    echo ""

    # Check for uncommitted changes
    if ! git diff --quiet HEAD 2>/dev/null; then
        echo "📦 Stashing uncommitted changes..."
        git stash push -m "Auto-stash before branch switch for: $SUGGESTED_BRANCH"
        STASHED=true
    fi

    # Check if branch exists
    if git show-ref --verify --quiet "refs/heads/$SUGGESTED_BRANCH"; then
        echo "🔀 Switching to existing branch: $SUGGESTED_BRANCH"
        git checkout "$SUGGESTED_BRANCH"
    else
        echo "🌿 Creating new branch: $SUGGESTED_BRANCH (from main)"
        git checkout main 2>/dev/null || git checkout master
        git pull --rebase origin main 2>/dev/null || git pull --rebase origin master 2>/dev/null || true
        git checkout -b "$SUGGESTED_BRANCH"
    fi

    # Restore stashed changes if any
    if [ "$STASHED" = true ]; then
        echo "📦 Restoring stashed changes..."
        git stash pop || echo "⚠️  Could not auto-restore stash, check 'git stash list'"
    fi

    echo "✅ Now on branch: $(git branch --show-current)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 Injecting prompt into Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Try tmux first, then fall back to writing prompt file
if tmux has-session -t builder 2>/dev/null; then
    echo "📡 Using tmux session: builder"

    # === FILE-BASED INJECTION ===
    # Write prompt to a workspace-local file so Gemini CLI can read it via @filepath.
    # /tmp/ is outside Gemini's workspace scope, so we use .ai-workflow/context/
    PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
    PROMPT_TMPFILE="$PROJECT_ROOT/.ai-workflow/context/BUILDER_PROMPT.md"
    echo "$PROMPT" > "$PROMPT_TMPFILE"

    # Send @filepath reference to Gemini CLI — it reads the file natively
    # NOTE: Gemini CLI requires TWO Enters (empty line) to submit input.
    # First C-m moves to new line, second C-m submits on empty line.
    tmux send-keys -t builder "@.ai-workflow/context/BUILDER_PROMPT.md Implement the tasks described in this file. Commit when done." C-m
    sleep 0.5
    tmux send-keys -t builder C-m

    echo "✅ Prompt sent via file injection on branch: $(git branch --show-current)"
    echo "   Prompt file: $PROMPT_TMPFILE"
    echo ""
    echo "View session: tmux attach -t builder"
else
    # No tmux session - write to PROMPT.md for manual copy or VS Code task pickup
    # Use SCRIPT_DIR to find PROJECT_ROOT/.ai-workflow/context
    PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
    PROMPT_FILE="$PROJECT_ROOT/.ai-workflow/context/PROMPT.md"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    echo "📝 No tmux session found. Writing to PROMPT.md..."

    cat > "$PROMPT_FILE" << EOF
# Pending Prompt for Builder

> **Status:** Ready to send
> **Generated by:** smart-inject.sh
> **Timestamp:** $TIMESTAMP
> **Branch:** $(git branch --show-current)

---

\`\`\`
$PROMPT
\`\`\`

---

## How to Send

**Option 1:** Copy the prompt above and paste into Gemini CLI

**Option 2:** Start tmux builder session:
\`\`\`bash
./scripts/start-builder-tmux.sh
# Then re-run smart-inject
\`\`\`
EOF

    echo "✅ Prompt written to: $PROMPT_FILE"
    echo "   Branch: $(git branch --show-current)"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy prompt from .context/PROMPT.md"
    echo "   2. Paste into your Gemini CLI terminal"
    echo "   OR"
    echo "   Start tmux: ./scripts/start-builder-tmux.sh"
fi
