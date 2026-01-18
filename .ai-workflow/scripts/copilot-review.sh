#!/bin/bash
# Copilot CLI Smart Review - Escalates to Opus for complex issues
# Uses Sonnet 4.5 by default, Opus 4.5 for deep analysis

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Models
MODEL_FAST="claude-sonnet-4.5"
MODEL_DEEP="claude-opus-4.5"

# Complexity thresholds (lines changed)
COMPLEXITY_THRESHOLD=100
SECURITY_KEYWORDS="password|secret|api[_-]?key|token|credential|private[_-]?key|auth"

# Usage
usage() {
    echo "Usage: $0 [options] [file|diff]"
    echo ""
    echo "Options:"
    echo "  -d, --diff         Review staged git diff (default)"
    echo "  -f, --file FILE    Review specific file"
    echo "  -c, --commit SHA   Review specific commit"
    echo "  -p, --pr NUMBER    Review pull request"
    echo "  --opus             Force Opus model"
    echo "  --sonnet           Force Sonnet model (default)"
    echo "  -h, --help         Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                           # Review staged changes"
    echo "  $0 -f src/App.js             # Review specific file"
    echo "  $0 -c HEAD~3                 # Review last 3 commits"
    echo "  $0 --opus -d                 # Force Opus for staged diff"
}

# Detect complexity to decide model
detect_complexity() {
    local content="$1"
    local lines=$(echo "$content" | wc -l)
    local has_security=$(echo "$content" | grep -iE "$SECURITY_KEYWORDS" | wc -l)
    local has_complex_patterns=$(echo "$content" | grep -E "(async|await|Promise|Observable|useEffect|useMemo|useCallback)" | wc -l)
    
    # Escalate to Opus if:
    # 1. Large diff (>100 lines)
    # 2. Security-related changes
    # 3. Complex async/hook patterns
    if [ "$lines" -gt "$COMPLEXITY_THRESHOLD" ] || [ "$has_security" -gt 0 ]; then
        echo "opus"
        return
    fi
    
    if [ "$has_complex_patterns" -gt 5 ]; then
        echo "opus"
        return
    fi
    
    echo "sonnet"
}

# Build review prompt based on content type
build_prompt() {
    local review_type="$1"
    local content="$2"
    
    case "$review_type" in
        diff)
            echo "Review this git diff for:
1. Security issues (secrets, injection, auth bypass)
2. Bugs and logic errors
3. Performance problems
4. Code quality and best practices

Be concise. List issues with severity (CRITICAL/WARNING/INFO).

\`\`\`diff
$content
\`\`\`"
            ;;
        file)
            echo "Review this file for issues:
1. Security vulnerabilities
2. Bugs and edge cases
3. Performance issues
4. Code quality

Be concise. List issues with line numbers and severity.

\`\`\`
$content
\`\`\`"
            ;;
        pr)
            echo "Review this pull request:
1. Overall architecture and approach
2. Security concerns
3. Breaking changes
4. Test coverage gaps

Provide actionable feedback.

$content"
            ;;
    esac
}

# Run the review
run_review() {
    local model="$1"
    local prompt="$2"
    local model_name=""
    
    if [ "$model" = "opus" ]; then
        model_name="$MODEL_DEEP"
        echo -e "${PURPLE}🧠 Using Opus 4.5 (deep analysis)${NC}"
    else
        model_name="$MODEL_FAST"
        echo -e "${BLUE}⚡ Using Sonnet 4.5 (fast review)${NC}"
    fi
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if copilot is authenticated
    if ! copilot --version &>/dev/null; then
        echo -e "${RED}❌ Copilot CLI not installed. Run: npm install -g @github/copilot${NC}"
        exit 1
    fi
    
    # Run copilot in non-interactive mode
    copilot --model "$model_name" \
        --allow-all-tools \
        --silent \
        -p "$prompt" 2>&1 || {
            echo -e "${RED}❌ Review failed. You may need to authenticate: copilot${NC}"
            exit 1
        }
    
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Main
main() {
    local mode="diff"
    local target=""
    local force_model=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -d|--diff)
                mode="diff"
                shift
                ;;
            -f|--file)
                mode="file"
                target="$2"
                shift 2
                ;;
            -c|--commit)
                mode="commit"
                target="$2"
                shift 2
                ;;
            -p|--pr)
                mode="pr"
                target="$2"
                shift 2
                ;;
            --opus)
                force_model="opus"
                shift
                ;;
            --sonnet)
                force_model="sonnet"
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                usage
                exit 1
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT"
    
    # Get content based on mode
    local content=""
    local review_type=""
    
    case "$mode" in
        diff)
            content=$(git diff --staged 2>/dev/null)
            if [ -z "$content" ]; then
                content=$(git diff 2>/dev/null)
            fi
            if [ -z "$content" ]; then
                echo -e "${YELLOW}No changes to review.${NC}"
                exit 0
            fi
            review_type="diff"
            echo -e "${GREEN}📋 Reviewing staged/unstaged changes...${NC}"
            ;;
        file)
            if [ ! -f "$target" ]; then
                echo -e "${RED}❌ File not found: $target${NC}"
                exit 1
            fi
            content=$(cat "$target")
            review_type="file"
            echo -e "${GREEN}📄 Reviewing file: $target${NC}"
            ;;
        commit)
            content=$(git show "$target" 2>/dev/null)
            if [ -z "$content" ]; then
                echo -e "${RED}❌ Commit not found: $target${NC}"
                exit 1
            fi
            review_type="diff"
            echo -e "${GREEN}📝 Reviewing commit: $target${NC}"
            ;;
        pr)
            # Use gh CLI to get PR info
            content=$(gh pr view "$target" --json title,body,files,additions,deletions 2>/dev/null)
            if [ -z "$content" ]; then
                echo -e "${RED}❌ PR not found: $target${NC}"
                exit 1
            fi
            review_type="pr"
            echo -e "${GREEN}🔀 Reviewing PR #$target${NC}"
            ;;
    esac
    
    # Determine model
    local model="sonnet"
    if [ -n "$force_model" ]; then
        model="$force_model"
    else
        model=$(detect_complexity "$content")
        if [ "$model" = "opus" ]; then
            echo -e "${PURPLE}🔍 Complexity detected - escalating to Opus${NC}"
        fi
    fi
    
    # Build and run
    local prompt=$(build_prompt "$review_type" "$content")
    run_review "$model" "$prompt"
}

main "$@"
