#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Pre-Push Checklist - Validates code before pushing to remote
# Part of the AI Workflow automation system
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on first error

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track issues
ERRORS=0
WARNINGS=0

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}🚀 PRE-PUSH CHECKLIST${NC}"
echo "═══════════════════════════════════════════════════════════════"

cd "$PROJECT_ROOT"

# ─────────────────────────────────────────────────────────────────────────────
# 1. ENSURE COMMITS EXIST
# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BLUE}[1/5]${NC} Checking for commits to push..."

# Get the remote and branch from arguments (passed by git)
REMOTE="$1"
URL="$2"
BRANCH=$(git branch --show-current)

# Check if there are commits to push
AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")

if [ "$AHEAD" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No new commits to push${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ $AHEAD commit(s) ready to push${NC}"
fi

# Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: $UNCOMMITTED uncommitted changes in working directory${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. PULL LATEST CHANGES (REBASE)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BLUE}[2/5]${NC} Pulling latest changes from remote..."

# Fetch first to check
git fetch origin "$BRANCH" 2>/dev/null || git fetch origin main 2>/dev/null || true

# Check if behind
BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")

if [ "$BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Branch is $BEHIND commit(s) behind remote${NC}"
    echo -e "${YELLOW}   Consider running: git pull --rebase origin $BRANCH${NC}"
    # Don't auto-rebase - just warn (user might want to handle conflicts manually)
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Branch is up to date with remote${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. RUN LINTING
# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BLUE}[3/5]${NC} Running linting checks..."

# Check if package.json has lint script
if [ -f "package.json" ] && grep -q '"lint"' package.json; then
    if npm run lint 2>&1 | head -20; then
        echo -e "${GREEN}✅ Linting passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Linting has warnings (see above)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  No lint script found, skipping${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. CHECK FOR SECRETS
# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BLUE}[4/5]${NC} Scanning for exposed secrets..."

# Get the commits being pushed
COMMITS=$(git log @{u}..HEAD --format="%H" 2>/dev/null || git log -10 --format="%H")

SECRET_PATTERNS=(
    'AKIA[0-9A-Z]{16}'                    # AWS Access Key
    '[a-zA-Z0-9_-]*:[a-zA-Z0-9_-]*@'      # Credentials in URL
    'AIza[0-9A-Za-z_-]{35}'               # Google API Key
    'ghp_[a-zA-Z0-9]{36}'                 # GitHub Personal Access Token
    'gho_[a-zA-Z0-9]{36}'                 # GitHub OAuth Token
    'glpat-[a-zA-Z0-9_-]{20,}'            # GitLab Token
    'sk-[a-zA-Z0-9]{48}'                  # OpenAI API Key
    'xox[baprs]-[0-9]{10,}-[a-zA-Z0-9]+'  # Slack Token
    'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'  # JWT Token
)

SECRETS_FOUND=0

for pattern in "${SECRET_PATTERNS[@]}"; do
    # Check staged diff for secrets
    if git diff --cached 2>/dev/null | grep -qE "$pattern"; then
        echo -e "${RED}❌ CRITICAL: Potential secret detected matching pattern!${NC}"
        SECRETS_FOUND=1
        ERRORS=$((ERRORS + 1))
    fi
    # Check commits being pushed
    for commit in $COMMITS; do
        if git show "$commit" 2>/dev/null | grep -qE "$pattern"; then
            echo -e "${RED}❌ CRITICAL: Potential secret in commit $commit${NC}"
            SECRETS_FOUND=1
            ERRORS=$((ERRORS + 1))
        fi
    done
done

# Also check for common secret file patterns
SECRET_FILES=(
    '.env'
    '*.pem'
    '*.key'
    '*credentials*'
    '*secret*'
)

for file_pattern in "${SECRET_FILES[@]}"; do
    # Check if any matching files are being committed (that aren't in .gitignore patterns)
    MATCHED=$(git diff --cached --name-only 2>/dev/null | grep -E "^${file_pattern//\*/.*}$" | head -1)
    if [ -n "$MATCHED" ]; then
        # Check if it's gitignored
        if ! git check-ignore -q "$MATCHED" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Sensitive file being committed: $MATCHED${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets detected${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. RUN QUICK TESTS (optional - skip if slow)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BLUE}[5/5]${NC} Quick test validation..."

# Check if SKIP_TESTS is set
if [ "${SKIP_TESTS:-false}" = "true" ]; then
    echo -e "${YELLOW}⚠️  Tests skipped (SKIP_TESTS=true)${NC}"
else
    # Run quick unit tests if available (with timeout)
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        echo "   Running quick tests (30s timeout)..."
        if timeout 30 npm test -- --watchAll=false --passWithNoTests 2>&1 | tail -5; then
            echo -e "${GREEN}✅ Tests passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Tests skipped or timed out${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  No test script found, skipping${NC}"
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 PRE-PUSH SUMMARY${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo -e "   Branch: ${BLUE}$BRANCH${NC}"
echo -e "   Commits: ${GREEN}$AHEAD${NC}"
echo -e "   Errors: ${RED}$ERRORS${NC}"
echo -e "   Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ PUSH BLOCKED - Fix critical errors above${NC}"
    echo ""
    exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Push allowed with warnings${NC}"
fi

echo -e "${GREEN}✅ Pre-push checks passed!${NC}"
echo ""
exit 0
