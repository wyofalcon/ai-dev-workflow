#!/bin/bash
# Workflow Signal Detection - Monitors git state and outputs structured workflow status
# Integrates with audit-watch.sh to provide automated workflow recommendations

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONTEXT_DIR="$(dirname "$SCRIPT_DIR")/context"
STATUS_FILE="$CONTEXT_DIR/WORKFLOW_STATUS.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# DETECTION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

check_for_secrets() {
    # Quick secret scan of staged changes
    local secrets_found=0
    local staged_diff=$(git diff --cached 2>/dev/null)

    # Common secret patterns
    local patterns=(
        'AKIA[0-9A-Z]{16}'                    # AWS Access Key
        'AIza[0-9A-Za-z_-]{35}'               # Google API Key
        'ghp_[a-zA-Z0-9]{36}'                 # GitHub Personal Access Token
        'sk-[a-zA-Z0-9]{48}'                  # OpenAI API Key
    )

    for pattern in "${patterns[@]}"; do
        if echo "$staged_diff" | grep -qE "$pattern"; then
            secrets_found=1
            break
        fi
    done

    echo "$secrets_found"
}

detect_ready_signals() {
    local status="In progress"
    local signals=""

    cd "$PROJECT_ROOT" || exit 1

    # Check for uncommitted changes
    local unstaged=$(git diff --name-only 2>/dev/null | wc -l)
    local staged=$(git diff --cached --name-only 2>/dev/null | wc -l)
    local untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
    local branch=$(git branch --show-current 2>/dev/null)

    # Determine status based on git state
    if [ "$staged" -gt 0 ]; then
        status="Ready for commit"
        signals="${signals}$staged files staged; "
    elif [ "$unstaged" -gt 0 ] || [ "$untracked" -gt 0 ]; then
        status="Changes pending"
        signals="${signals}$unstaged modified, $untracked new; "
    else
        # Check if ahead of remote
        local ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
        if [ "$ahead" -gt 0 ]; then
            status="Ready for push"
            signals="${signals}$ahead commits ahead of remote; "
        else
            # Check if on feature branch (could open PR)
            if [ "$branch" != "main" ] && [ "$branch" != "master" ]; then
                # Check if there's a diff from main
                local diff_from_main=$(git rev-list --count main..HEAD 2>/dev/null || echo "0")
                if [ "$diff_from_main" -gt 0 ]; then
                    status="Ready for PR"
                    signals="${signals}$diff_from_main commits ahead of main; "
                else
                    status="Up to date"
                fi
            else
                status="On main - up to date"
            fi
        fi
    fi

    echo "$status|$signals"
}

get_recommended_action() {
    local status="$1"
    local unstaged="$2"
    local staged="$3"
    local action="none"
    local requires_approval="false"
    local command=""

    case "$status" in
        "Changes pending")
            action="stage"
            command="git add -A"
            requires_approval="false"
            ;;
        "Ready for commit")
            action="commit"
            command="git commit -m \"feat: [describe]\""
            requires_approval="false"
            ;;
        "Ready for push")
            action="push"
            command="git push"
            requires_approval="false"
            ;;
        "Ready for PR")
            action="open PR"
            command="gh pr create"
            requires_approval="false"
            ;;
        "Ready for merge")
            action="merge"
            command="gh pr merge"
            requires_approval="true"  # HIGH RISK - requires approval
            ;;
        *)
            action="none"
            command=""
            requires_approval="false"
            ;;
    esac

    echo "$action|$requires_approval|$command"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════

generate_status() {
    cd "$PROJECT_ROOT" || exit 1

    # Get current branch
    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")

    # File counts
    local unstaged=$(git diff --name-only 2>/dev/null | wc -l)
    local staged=$(git diff --cached --name-only 2>/dev/null | wc -l)
    local untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
    local total_changes=$((unstaged + staged + untracked))

    # Detect ready signals
    local ready_result=$(detect_ready_signals)
    local status=$(echo "$ready_result" | cut -d'|' -f1)
    local ready_signals=$(echo "$ready_result" | cut -d'|' -f2)

    # Get recommended action
    local action_result=$(get_recommended_action "$status" "$unstaged" "$staged")
    local action=$(echo "$action_result" | cut -d'|' -f1)
    local requires_approval=$(echo "$action_result" | cut -d'|' -f2)
    local suggested_cmd=$(echo "$action_result" | cut -d'|' -f3)

    # Output format check
    if [ "$1" = "json" ]; then
        # JSON output for programmatic use
        cat << EOF
{
  "status": "$status",
  "branch": "$branch",
  "recommended_action": "$action",
  "requires_approval": $requires_approval,
  "suggested_command": "$suggested_cmd",
  "files": {
    "staged": $staged,
    "unstaged": $unstaged,
    "untracked": $untracked,
    "total": $total_changes
  },
  "signals": "$ready_signals"
}
EOF
        # Save to file
        mkdir -p "$CONTEXT_DIR"
        cat << EOF > "$STATUS_FILE"
{
  "status": "$status",
  "branch": "$branch",
  "recommended_action": "$action",
  "requires_approval": $requires_approval,
  "suggested_command": "$suggested_cmd",
  "files": {
    "staged": $staged,
    "unstaged": $unstaged,
    "untracked": $untracked,
    "total": $total_changes
  },
  "signals": "$ready_signals",
  "timestamp": "$(date -Iseconds)"
}
EOF
    else
        # Pretty terminal output
        echo ""
        echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║${NC}  📊 ${PURPLE}WORKFLOW STATUS${NC}                                      ${CYAN}║${NC}"
        echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"

        # Status with color
        local status_color="${YELLOW}"
        case "$status" in
            "Ready for commit") status_color="${GREEN}" ;;
            "Ready for push") status_color="${GREEN}" ;;
            "Ready for PR") status_color="${BLUE}" ;;
            "Up to date"|"On main - up to date") status_color="${GREEN}" ;;
            "Changes pending") status_color="${YELLOW}" ;;
        esac
        printf "${CYAN}║${NC}  Status:   ${status_color}%-43s${NC}${CYAN}║${NC}\n" "$status"
        printf "${CYAN}║${NC}  Branch:   ${YELLOW}%-43s${NC}${CYAN}║${NC}\n" "$branch"

        # File counts (compact)
        local files_summary="$staged staged | $unstaged modified | $untracked new"
        printf "${CYAN}║${NC}  Files:    ${NC}%-43s${CYAN}║${NC}\n" "$files_summary"

        echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"

        # Recommended action
        if [ "$action" != "none" ]; then
            if [ "$requires_approval" = "true" ]; then
                printf "${CYAN}║${NC}  🎯 Next:  ${RED}%-43s${NC}${CYAN}║${NC}\n" "$action (⚠️ NEEDS APPROVAL)"
            else
                printf "${CYAN}║${NC}  🎯 Next:  ${GREEN}%-43s${NC}${CYAN}║${NC}\n" "$action ✓"
            fi
            if [ -n "$suggested_cmd" ]; then
                printf "${CYAN}║${NC}  💡 Run:   ${BLUE}%-43s${NC}${CYAN}║${NC}\n" "$suggested_cmd"
            fi
        else
            printf "${CYAN}║${NC}  🎯 Next:  ${NC}%-43s${CYAN}║${NC}\n" "Nothing to do"
        fi

        echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

case "$1" in
    json)
        generate_status json
        ;;
    watch)
        # Continuous monitoring mode
        while true; do
            clear
            generate_status
            sleep 5
        done
        ;;
    *)
        generate_status
        ;;
esac
