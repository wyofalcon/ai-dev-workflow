#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Post-Push Automation - Handles PR creation, labeling, and notifications
# Part of the AI Workflow automation system
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

cd "$PROJECT_ROOT"

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

BRANCH=$(git branch --show-current)
DEFAULT_BRANCH="main"
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed or not in PATH${NC}"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub. Run: gh auth login${NC}"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

detect_ai_generated() {
    # Check recent commit messages for AI signals
    local ai_signals=0
    local recent_commits=$(git log -5 --format="%s %b" 2>/dev/null)

    if echo "$recent_commits" | grep -qiE "(copilot|gemini|claude|ai-generated|auto-generated|builder)"; then
        ai_signals=1
    fi

    # Check if commits came from known AI patterns
    if echo "$recent_commits" | grep -qiE "(feat:|fix:|chore:|refactor:)"; then
        # Conventional commits are often AI-generated
        ai_signals=1
    fi

    echo "$ai_signals"
}

generate_pr_title() {
    local branch="$1"
    local title=""

    # Parse branch name for PR title
    case "$branch" in
        feature/*|feat/*)
            title="feat: ${branch#*/}"
            ;;
        fix/*|bugfix/*)
            title="fix: ${branch#*/}"
            ;;
        chore/*|maintenance/*)
            title="chore: ${branch#*/}"
            ;;
        EasyCV*|easycv*)
            title="feat(easy-cv): ${branch}"
            ;;
        *)
            # Use last commit message as fallback
            title=$(git log -1 --format="%s" 2>/dev/null)
            ;;
    esac

    echo "$title"
}

generate_pr_body() {
    local ai_generated="$1"
    local commits=$(git log "$DEFAULT_BRANCH"..HEAD --format="- %s" 2>/dev/null | head -10)

    cat << EOF
## Summary

<!-- Brief description of changes -->

## Changes

$commits

## Checklist

- [ ] Tests pass locally
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if applicable)

---

EOF

    if [ "$ai_generated" -eq 1 ]; then
        echo "🤖 **Note:** This PR contains AI-assisted code. Please review carefully."
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# MAIN LOGIC
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}📤 POST-PUSH AUTOMATION${NC}"
echo "═══════════════════════════════════════════════════════════════"

# Check if on default branch (no PR needed)
if [ "$BRANCH" = "$DEFAULT_BRANCH" ] || [ "$BRANCH" = "master" ]; then
    echo -e "${YELLOW}⚠️  On default branch ($BRANCH). No PR actions needed.${NC}"
    exit 0
fi

# Check if PR already exists
EXISTING_PR=$(gh pr view "$BRANCH" --json number,state -q '.number' 2>/dev/null || echo "")

if [ -n "$EXISTING_PR" ]; then
    echo -e "${GREEN}✅ PR #$EXISTING_PR already exists for branch $BRANCH${NC}"

    # Update labels if needed
    AI_GENERATED=$(detect_ai_generated)
    if [ "$AI_GENERATED" -eq 1 ]; then
        echo -e "${BLUE}   Adding AI-generated label...${NC}"
        gh pr edit "$EXISTING_PR" --add-label "AI-generated" 2>/dev/null || true
    fi

    # Show PR URL
    PR_URL=$(gh pr view "$BRANCH" --json url -q '.url' 2>/dev/null)
    echo -e "${BLUE}   URL: $PR_URL${NC}"
    exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# CREATE NEW PR
# ─────────────────────────────────────────────────────────────────────────────

echo -e "\n${BLUE}Creating Pull Request...${NC}"

AI_GENERATED=$(detect_ai_generated)
PR_TITLE=$(generate_pr_title "$BRANCH")
PR_BODY=$(generate_pr_body "$AI_GENERATED")

# Determine labels
LABELS="ready-for-review"
if [ "$AI_GENERATED" -eq 1 ]; then
    LABELS="$LABELS,AI-generated"
fi

# Check if branch prefix suggests type
case "$BRANCH" in
    feature/*|feat/*|EasyCV*)
        LABELS="$LABELS,enhancement"
        ;;
    fix/*|bugfix/*)
        LABELS="$LABELS,bug"
        ;;
esac

echo -e "${BLUE}   Title: $PR_TITLE${NC}"
echo -e "${BLUE}   Labels: $LABELS${NC}"

# Prompt for confirmation in interactive mode
if [ -t 0 ]; then
    echo ""
    read -p "Create PR with these settings? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled.${NC}"
        exit 0
    fi
fi

# Create the PR
PR_URL=$(gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --label "$LABELS" \
    --base "$DEFAULT_BRANCH" \
    2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pull Request created successfully!${NC}"
    echo -e "${BLUE}   URL: $PR_URL${NC}"

    # Log to context
    echo "[$(date)] PR created: $PR_URL" >> "$CONTEXT_DIR/audit.log" 2>/dev/null || true
else
    echo -e "${RED}❌ Failed to create PR${NC}"
    echo "$PR_URL"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# NOTIFY STAKEHOLDERS (optional - requires additional setup)
# ─────────────────────────────────────────────────────────────────────────────

# Check for Slack webhook (optional)
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    echo -e "\n${BLUE}Sending Slack notification...${NC}"
    curl -s -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 New PR opened: $PR_TITLE\n$PR_URL\"}" \
        "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ Slack notification sent${NC}" || \
        echo -e "${YELLOW}⚠️  Slack notification failed${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Post-push automation complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
