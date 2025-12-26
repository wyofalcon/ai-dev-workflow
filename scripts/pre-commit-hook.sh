#!/bin/bash
# AI Dev Workflow - Pre-commit Hook
# Install: cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# If installed as git hook, find scripts directory
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
    AUDIT_SCRIPT="$PROJECT_ROOT/scripts/audit-file.py"
else
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    AUDIT_SCRIPT="$SCRIPT_DIR/audit-file.py"
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "============================================================"
echo "🔍 LOCAL AUDITOR (Pre-commit)"
echo "   Auditor: GitHub Copilot • Builder: Gemini/Claude CLI"
echo "============================================================"
echo ""

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|jsx|tsx|py|json)$')

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️  No staged code files to audit."
    echo "============================================================"
    exit 0
fi

HAS_ERRORS=false

for FILE in $STAGED_FILES; do
    if [ -f "$PROJECT_ROOT/$FILE" ]; then
        echo -e "${YELLOW}Checking:${NC} $FILE"
        
        # Run audit
        OUTPUT=$(python3 "$AUDIT_SCRIPT" "$PROJECT_ROOT/$FILE" 2>&1)
        
        if echo "$OUTPUT" | grep -q "🔴\|⚠️.*secret"; then
            HAS_ERRORS=true
            echo "$OUTPUT"
        elif echo "$OUTPUT" | grep -q "⚠️"; then
            echo "$OUTPUT"
        fi
    fi
done

echo ""

if [ "$HAS_ERRORS" = true ]; then
    echo "============================================================"
    echo -e "${RED}❌ AUDIT FAILED - Fix errors before committing${NC}"
    echo ""
    echo "   Bypass with: git commit --no-verify"
    echo "============================================================"
    exit 1
else
    echo "============================================================"
    echo -e "${GREEN}✅ AUDIT PASSED - No critical issues detected${NC}"
    echo ""
    echo "   💡 Tip: GitHub Copilot will do full review on PR"
    echo "============================================================"
    exit 0
fi
