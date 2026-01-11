#!/bin/bash

# ==============================================================================
# AUDITOR WORKFLOW INSTALLER
# ==============================================================================
# This script installs the "Builder + Auditor" workflow into the current Git project.
# It sets up:
# 1. The Local Auditor script (scripts/local-audit.py) - Uses GitHub Copilot CLI
# 2. The Git Pre-commit Hook (.git/hooks/pre-commit)
# 3. The Copilot/Claude Instructions (.github/copilot-instructions.md)
# ==============================================================================

# Ensure we are in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Error: This does not appear to be the root of a Git repository."
    echo "   Please run 'git init' or move to the project root."
    exit 1
fi

echo "🚀 Installing Auditor Workflow (GitHub Copilot Edition)..."

# ------------------------------------------------------------------------------
# 1. Install Local Audit Script
# ------------------------------------------------------------------------------
mkdir -p scripts
cat << 'EOF' > scripts/local-audit.py
#!/usr/bin/env python3
import subprocess
import sys
import os
import shutil

# Configuration
# Known models available in GitHub Copilot (User can select one)
MODELS = [
    "gpt-4o",
    "claude-3.5-sonnet",
    "o1-preview"
]

SYSTEM_PROMPT = """
You are the PROJECT AUDITOR. Your job is to block broken, insecure, or messy code from being committed.

RULES:
1.  **Analyze** the provided Git Diff.
2.  **Identify** bugs, security vulnerabilities, console.logs, or sloppy code.
3.  **Verdict**:
    *   If CRITICAL issues (bugs, security, syntax errors) exist: Return [STATUS]: FAIL
    *   If MINOR issues (style, cleanup) exist: Return [STATUS]: WARN
    *   If clean: Return [STATUS]: PASS
4.  **Be concise**. Bullet points only. No fluff.

Your goal is NOT to be nice. Your goal is to keep the codebase clean.
"""

def check_dependencies():
    """Checks if gh and gh-copilot are installed."""
    if not shutil.which("gh"):
        print("❌ Error: GitHub CLI ('gh') is not installed.")
        print("   Please install it: https://cli.github.com/")
        sys.exit(1)
    
    # Check for copilot extension
    try:
        res = subprocess.run(["gh", "extension", "list"], capture_output=True, text=True)
        if "gh-copilot" not in res.stdout:
            print("⚠️  GitHub Copilot extension ('gh-copilot') not found.")
            print("🚀 Installing github/gh-copilot...")
            subprocess.run(["gh", "extension", "install", "github/gh-copilot"], check=True)
            print("✅ Extension installed.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error checking extensions: {e}")
        sys.exit(1)

def get_staged_diff():
    """Retrieves the staged changes from git."""
    try:
        # Run git diff --staged
        result = subprocess.run(
            ["git", "diff", "--staged"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        print("❌ Error: Failed to get staged diff. Is this a git repo?")
        sys.exit(1)

def select_model():
    """Asks the user to select a model."""
    print("\n🤖 Select AI Model for Audit (GitHub Copilot):")
    for i, m in enumerate(MODELS):
        print(f"   {i+1}) {m}")
    
    # Simple input loop
    if not sys.stdin.isatty():
        # Non-interactive mode (e.g. CI), default to first
        print(f"   (Non-interactive) Defaulting to {MODELS[0]}")
        return MODELS[0]

    try:
        choice = input(f"\n   Enter selection [1-{len(MODELS)}] (default 1): ").strip()
    except EOFError:
        return MODELS[0]

    if not choice:
        return MODELS[0]
    
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(MODELS):
            return MODELS[idx]
    except ValueError:
        pass
    
    print(f"   Invalid selection. Defaulting to {MODELS[0]}")
    return MODELS[0]

def audit_code(diff, model):
    """Sends the diff to gh copilot explain."""
    print(f"\n🔍 Auditor (via GitHub Copilot - {model}) is reviewing changes...")
    
    # Construct the query
    # We prepend the system prompt and instructions.
    query = f"{SYSTEM_PROMPT}\n\n[CONTEXT: Using Model {model}]\n\nCODE DIFF TO REVIEW:\n{diff}"
    
    # Limit query size roughly to avoid shell argument limits if passing as string is needed.
    if len(query) > 120000: # Approximate char limit for large context
        print("⚠️  Diff is extremely large. Truncating for Audit...")
        query = query[:120000] + "\n...(truncated)..."

    try:
        # We use 'gh copilot explain'
        # Note: 'gh copilot' is interactive by default. 
        # We can't easily force it to be non-interactive and return just text without 'expect' or similar.
        # BUT 'gh copilot explain "<query>"' usually prints the explanation to stdout.
        
        result = subprocess.run(
            ["gh", "copilot", "explain", query],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Fallback or error
            return f"Error from Copilot: {result.stderr}"
        
        return result.stdout.strip()

    except Exception as e:
        return f"Error executing gh copilot: {str(e)}"

def main():
    # 0. Check dependencies
    check_dependencies()

    # 1. Get Staged Changes
    diff = get_staged_diff()
    
    if not diff:
        print("ℹ️  No staged changes to audit. (Use 'git add' first)")
        sys.exit(0)

    # 2. Select Model
    model = select_model()

    # 3. Audit
    report = audit_code(diff, model)
    
    # 4. Output Report
    print("\n" + "="*60)
    print("🤖 AUDITOR REPORT")
    print("="*60)
    print(report)
    print("="*60 + "\n")

    # 5. Check for Escalation Conditions
    # gh copilot might not return "[STATUS]: FAIL" exactly unless well-prompted.
    # We'll check for keywords.
    
    if "[STATUS]: FAIL" in report or "CRITICAL" in report:
        print("❌ Audit FAILED (or Critical Issues found). Fix issues before committing.")
        sys.exit(1)
        
    elif "[STATUS]: WARN" in report:
        print("⚠️  Audit Passed with WARNINGS.")
        sys.exit(0)
    
    # If uncertain, we default to PASS but warn user to read.
    print("✅ Audit PASSED (or no critical issues detected).")
    sys.exit(0)

if __name__ == "__main__":
    main()
EOF
chmod +x scripts/local-audit.py
echo "✅ Installed scripts/local-audit.py"

# ------------------------------------------------------------------------------
# 2. Install Git Pre-commit Hook
# ------------------------------------------------------------------------------
mkdir -p .git/hooks
cat << 'EOF' > .git/hooks/pre-commit
#!/bin/bash
# Pre-commit hook to run local-audit.py

REPO_ROOT=$(git rev-parse --show-toplevel)
AUDIT_SCRIPT="$REPO_ROOT/scripts/local-audit.py"

# Ensure interactive input is possible (tty)
exec < /dev/tty

if [ -x "$AUDIT_SCRIPT" ]; then
    echo "🔍 Starting Auditor (GitHub Copilot)..."
    "$AUDIT_SCRIPT"
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ Commit blocked by Auditor."
        echo "   Please fix the issues above and try again."
        exit 1
    fi
else
    echo "⚠️  Audit script not found or not executable. Skipping audit."
fi

exit 0
EOF
chmod +x .git/hooks/pre-commit
echo "✅ Installed .git/hooks/pre-commit"

# ------------------------------------------------------------------------------
# 3. Install Copilot/Claude Instructions (Generic Template)
# ------------------------------------------------------------------------------
mkdir -p .github
cat << 'EOF' > .github/copilot-instructions.md
# AI Coding Instructions (Auditor 2)

## Role & Responsibility
You are the **Senior Auditor**. Your goal is to provide deep reasoning, architectural guidance, and complex troubleshooting when the Local Auditor (Auditor 1) fails or is insufficient.

## 🛡️ Critical Rules
1.  **Security First:** Never introduce secrets, API keys, or PII into the codebase.
2.  **No Deprecated Code:** Always verify libraries are up to date and supported.
3.  **Strict Typing:** Enforce strong typing where applicable (TypeScript, Python hints, etc.).
4.  **Testing is Mandatory:** All new features must be accompanied by tests.

## 🏗️ Architecture (FILL THIS IN)
*   **Frontend:** [Tech Stack]
*   **Backend:** [Tech Stack]
*   **Infrastructure:** [Cloud/Infra]

## 📝 Workflow
1.  **Builder (Gemini):** Generates initial code and features.
2.  **Auditor 1 (Local):** Uses GitHub Copilot CLI to check staged changes.
3.  **Auditor 2 (You):** Complex review, refactoring, and "unstucking" the user.

If the user says "Auditor 1 failed", analyzing the git diff and the specific error report is your highest priority.
EOF
echo "✅ Installed .github/copilot-instructions.md"

echo ""
echo "🎉 Workflow Installation Complete (GitHub Copilot Edition)!"
echo "----------------------------------------------------------------"
echo "1. Run 'git add .' and 'git commit' to test the Auditor."
echo "2. Ensure you have run 'gh auth login' and 'gh extension install github/gh-copilot'."
echo "3. Save this script to '~/bin/install-auditor-workflow' to use in future projects."
echo "----------------------------------------------------------------"