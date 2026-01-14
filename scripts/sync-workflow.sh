#!/bin/bash
# Sync AI Dev Workflow files between cvstomize and the public template repo
# Usage: ./scripts/sync-workflow.sh [push|pull]
#   push: Copy cvstomize changes → ai-dev-workflow repo
#   pull: Copy ai-dev-workflow → cvstomize

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOW_REMOTE="workflow"
WORKFLOW_REPO="wyofalcon/ai-dev-workflow"

# Files that are part of the workflow (shared between repos)
WORKFLOW_FILES=(
    "scripts/audit-file.py"
    "scripts/audit-watch.sh"
    "scripts/start-ai-cli.sh"
    "scripts/toggle-relay-mode.sh"
    "scripts/toggle-audit-watch.sh"
    "scripts/send-prompt.sh"
    "scripts/show-status.sh"
    ".devcontainer/builder-setup.sh"
    ".vscode/tasks.json"
)

# Files that exist only in workflow repo (templates)
WORKFLOW_ONLY_FILES=(
    "install.sh"
    "README.md"
    "CHANGELOG.md"
    "CONTRIBUTING.md"
    "LICENSE"
    ".audit-config.json"
    ".context/WORKFLOW.md"
    ".context/PROMPT.md"
    ".context/RELAY_MODE"
    ".context/AUDIT_WATCH_MODE"
    ".devcontainer/devcontainer.json"
    ".devcontainer/post-create.sh"
    "scripts/pre-commit-hook.sh"
)

cd "$ROOT_DIR"

# Ensure workflow remote exists
if ! git remote | grep -q "^${WORKFLOW_REMOTE}$"; then
    echo -e "${YELLOW}Adding workflow remote...${NC}"
    git remote add "$WORKFLOW_REMOTE" "https://github.com/${WORKFLOW_REPO}.git"
fi

show_usage() {
    echo ""
    echo -e "${CYAN}AI Dev Workflow Sync${NC}"
    echo ""
    echo "Usage: $0 [push|pull|diff|status]"
    echo ""
    echo "Commands:"
    echo "  push    Copy cvstomize workflow files → ai-dev-workflow repo"
    echo "  pull    Copy ai-dev-workflow files → cvstomize"
    echo "  diff    Show differences between repos"
    echo "  status  Show which files are in sync"
    echo ""
}

sync_push() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📤 Pushing cvstomize → ai-dev-workflow${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Create temp directory for workflow repo
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT

    echo -e "${CYAN}Cloning workflow repo...${NC}"
    git clone --quiet "https://github.com/${WORKFLOW_REPO}.git" "$TEMP_DIR"

    echo -e "${CYAN}Copying workflow files...${NC}"
    for file in "${WORKFLOW_FILES[@]}"; do
        if [ -f "$ROOT_DIR/$file" ]; then
            mkdir -p "$TEMP_DIR/$(dirname "$file")"
            cp "$ROOT_DIR/$file" "$TEMP_DIR/$file"
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${YELLOW}⚠${NC} $file (not found in cvstomize)"
        fi
    done

    # Commit and push
    cd "$TEMP_DIR"
    git add -A

    if git diff --staged --quiet; then
        echo ""
        echo -e "${GREEN}✓ No changes to push - repos are in sync${NC}"
    else
        echo ""
        echo -e "${CYAN}Changes to push:${NC}"
        git diff --staged --stat
        echo ""
        read -p "Push these changes to ai-dev-workflow? [y/N] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git commit -m "sync: Update workflow files from cvstomize"
            git push origin main
            echo ""
            echo -e "${GREEN}✅ Pushed to ai-dev-workflow!${NC}"
        else
            echo -e "${YELLOW}Cancelled.${NC}"
        fi
    fi
}

sync_pull() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📥 Pulling ai-dev-workflow → cvstomize${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${CYAN}Fetching workflow repo...${NC}"
    git fetch "$WORKFLOW_REMOTE" main --quiet

    echo -e "${CYAN}Comparing files...${NC}"
    CHANGED=0
    for file in "${WORKFLOW_FILES[@]}"; do
        if git show "${WORKFLOW_REMOTE}/main:${file}" &>/dev/null; then
            WORKFLOW_CONTENT=$(git show "${WORKFLOW_REMOTE}/main:${file}" 2>/dev/null)
            if [ -f "$ROOT_DIR/$file" ]; then
                LOCAL_CONTENT=$(cat "$ROOT_DIR/$file")
                if [ "$WORKFLOW_CONTENT" != "$LOCAL_CONTENT" ]; then
                    echo -e "  ${YELLOW}≠${NC} $file (differs)"
                    CHANGED=1
                else
                    echo -e "  ${GREEN}✓${NC} $file (in sync)"
                fi
            else
                echo -e "  ${CYAN}+${NC} $file (new)"
                CHANGED=1
            fi
        fi
    done

    if [ $CHANGED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ All files are in sync${NC}"
    else
        echo ""
        read -p "Pull differing files from ai-dev-workflow? [y/N] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for file in "${WORKFLOW_FILES[@]}"; do
                if git show "${WORKFLOW_REMOTE}/main:${file}" &>/dev/null; then
                    mkdir -p "$ROOT_DIR/$(dirname "$file")"
                    git show "${WORKFLOW_REMOTE}/main:${file}" > "$ROOT_DIR/$file"
                    echo -e "  ${GREEN}✓${NC} Updated $file"
                fi
            done
            echo ""
            echo -e "${GREEN}✅ Pulled workflow files!${NC}"
            echo -e "${YELLOW}Remember to commit these changes.${NC}"
        else
            echo -e "${YELLOW}Cancelled.${NC}"
        fi
    fi
}

sync_diff() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🔍 Diff: cvstomize vs ai-dev-workflow${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    git fetch "$WORKFLOW_REMOTE" main --quiet

    for file in "${WORKFLOW_FILES[@]}"; do
        if git show "${WORKFLOW_REMOTE}/main:${file}" &>/dev/null && [ -f "$ROOT_DIR/$file" ]; then
            DIFF=$(diff <(git show "${WORKFLOW_REMOTE}/main:${file}") "$ROOT_DIR/$file" 2>/dev/null || true)
            if [ -n "$DIFF" ]; then
                echo -e "${CYAN}═══ $file ═══${NC}"
                echo "$DIFF" | head -30
                echo ""
            fi
        fi
    done
}

sync_status() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Workflow Sync Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    git fetch "$WORKFLOW_REMOTE" main --quiet 2>/dev/null || true

    echo -e "${CYAN}Shared workflow files:${NC}"
    for file in "${WORKFLOW_FILES[@]}"; do
        if [ -f "$ROOT_DIR/$file" ]; then
            if git show "${WORKFLOW_REMOTE}/main:${file}" &>/dev/null; then
                WORKFLOW_CONTENT=$(git show "${WORKFLOW_REMOTE}/main:${file}" 2>/dev/null)
                LOCAL_CONTENT=$(cat "$ROOT_DIR/$file")
                if [ "$WORKFLOW_CONTENT" = "$LOCAL_CONTENT" ]; then
                    echo -e "  ${GREEN}✓${NC} $file"
                else
                    echo -e "  ${YELLOW}≠${NC} $file (out of sync)"
                fi
            else
                echo -e "  ${CYAN}→${NC} $file (cvstomize only)"
            fi
        else
            echo -e "  ${RED}✗${NC} $file (missing locally)"
        fi
    done

    echo ""
    echo -e "${CYAN}Workflow-only files (template repo):${NC}"
    for file in "${WORKFLOW_ONLY_FILES[@]}"; do
        if git show "${WORKFLOW_REMOTE}/main:${file}" &>/dev/null; then
            echo -e "  ${BLUE}•${NC} $file"
        fi
    done
    echo ""
}

case "${1:-}" in
    push)
        sync_push
        ;;
    pull)
        sync_pull
        ;;
    diff)
        sync_diff
        ;;
    status)
        sync_status
        ;;
    *)
        show_usage
        sync_status
        ;;
esac
