#!/usr/bin/env python3
"""
Local Auditor - Pre-commit code checks
Auditor: GitHub Copilot (via VS Code / PR review)
Builder: Gemini CLI or Claude CLI

This script runs basic pattern checks before commit.
Full AI review happens via GitHub Copilot on PR.
"""
import subprocess
import sys
import os
import re
from datetime import datetime
from pathlib import Path

# Paths relative to this script's location
SCRIPT_DIR = Path(__file__).parent
WORKFLOW_ROOT = SCRIPT_DIR.parent  # .ai-workflow
CONTEXT_DIR = WORKFLOW_ROOT / "context"
AUDIT_LOG = CONTEXT_DIR / "audit.log"

def log_audit(status: str, target: str, details: str = ""):
    """Append audit result to log file."""
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] [{status}] [{target}] {details}\n"
        with open(AUDIT_LOG, "a") as f:
            f.write(log_line)
    except Exception:
        pass  # Don't fail audit if logging fails

def get_staged_diff():
    """Retrieves the staged changes from git."""
    try:
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

def check_skip_auditor():
    """Check if auditor should be skipped (Rapid Prototyping mode)."""
    return os.environ.get("SKIP_AUDITOR", "").lower() in ("true", "1", "yes")

def audit_diff(diff):
    """Run pattern-based security and quality checks."""
    issues = {"critical": [], "warning": []}
    lines = diff.split('\n')

    current_file = ""
    for i, line in enumerate(lines):
        # Track which file we're in
        if line.startswith('+++ b/'):
            current_file = line[6:]
            continue
        if not line.startswith('+') or line.startswith('+++'):
            continue

        line_content = line[1:]  # Remove the + prefix
        line_lower = line_content.lower()

        # CRITICAL: Hardcoded secrets
        secret_patterns = [
            (r'api[_-]?key\s*[=:]\s*["\'][^"\']{10,}["\']', "API key"),
            (r'password\s*[=:]\s*["\'][^"\']+["\']', "Password"),
            (r'secret\s*[=:]\s*["\'][^"\']{10,}["\']', "Secret"),
            (r'token\s*[=:]\s*["\'][^"\']{20,}["\']', "Token"),
            (r'private[_-]?key', "Private key"),
            (r'-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----', "Private key block"),
        ]

        for pattern, name in secret_patterns:
            if re.search(pattern, line_content, re.IGNORECASE):
                if 'process.env' not in line_content and 'example' not in line_lower and 'test' not in line_lower:
                    issues["critical"].append(f"🔐 Possible {name} found (line ~{i+1})")

        # CRITICAL: SQL injection patterns (skip shell scripts — ${VAR} is normal bash syntax)
        if not current_file.endswith(('.sh', '.bash', '.md')):
            if re.search(r'\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)', line_content, re.IGNORECASE):
                issues["critical"].append(f"💉 Possible SQL injection (line ~{i+1})")

        # WARNING: Console.log in non-test files
        if 'console.log' in line_content:
            if not any(x in line_lower for x in ['test', 'spec', 'debug']):
                issues["warning"].append(f"📝 console.log found (line ~{i+1})")

        # WARNING: Debugger statements
        if 'debugger' in line_content:
            issues["warning"].append(f"🐛 debugger statement (line ~{i+1})")

        # WARNING: TODO/FIXME/HACK
        if any(tag in line_content for tag in ['TODO:', 'FIXME:', 'HACK:', 'XXX:']):
            issues["warning"].append(f"📌 TODO/FIXME found (line ~{i+1})")

        # WARNING: Disabled eslint rules
        if 'eslint-disable' in line_content:
            issues["warning"].append(f"⚠️  ESLint disabled (line ~{i+1})")

    return issues

def main():
    print("")
    print("="*60)
    print("🔍 LOCAL AUDITOR (Pre-commit)")
    print("   Auditor: GitHub Copilot • Builder: Gemini/Claude CLI")
    print("="*60)

    # Check if auditor should be skipped (Rapid Prototyping mode)
    if check_skip_auditor():
        print("⏭️  Auditor skipped (SKIP_AUDITOR=true / Rapid Prototyping)")
        print("="*60)
        sys.exit(0)

    # Get staged changes
    diff = get_staged_diff()

    if not diff:
        print("ℹ️  No staged changes to audit.")
        print("="*60)
        log_audit("SKIP", "staged-changes", "No staged changes")
        sys.exit(0)

    # Run audit
    issues = audit_diff(diff)

    # Report findings
    if issues["critical"]:
        print("\n❌ CRITICAL ISSUES (must fix):")
        for issue in issues["critical"]:
            print(f"   {issue}")

    if issues["warning"]:
        print("\n⚠️  WARNINGS (consider fixing):")
        for issue in issues["warning"][:10]:
            print(f"   {issue}")
        if len(issues["warning"]) > 10:
            print(f"   ... and {len(issues['warning']) - 10} more")

    print("")
    print("="*60)

    # Verdict
    if issues["critical"]:
        print("❌ AUDIT FAILED - Fix critical issues before committing")
        print("")
        print("   💡 Tip: Full AI review will run on PR via GitHub Copilot")
        print("="*60)
        log_audit("FAIL", "staged-changes", f"Critical: {len(issues['critical'])}, Warnings: {len(issues['warning'])}")
        sys.exit(1)
    elif issues["warning"]:
        print("⚠️  AUDIT PASSED with warnings")
        print("")
        print("   💡 Tip: GitHub Copilot will review on PR")
        print("="*60)
        log_audit("WARN", "staged-changes", f"Warnings: {len(issues['warning'])}")
        sys.exit(0)
    else:
        print("✅ AUDIT PASSED - No issues detected")
        print("")
        print("   💡 Tip: GitHub Copilot will do full review on PR")
        print("="*60)
        log_audit("PASS", "staged-changes", "Clean")
        sys.exit(0)

if __name__ == "__main__":
    main()
