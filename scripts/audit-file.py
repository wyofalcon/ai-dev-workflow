#!/usr/bin/env python3
"""
Single File Auditor - Checks a specific file for issues
Used by audit-watch.sh for real-time feedback
"""
import sys
import os
import re

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def audit_file(filepath):
    """Run pattern-based security and quality checks on a single file."""
    if not os.path.exists(filepath):
        return

    # Skip test files for some checks
    is_test = any(x in filepath.lower() for x in ['test', 'spec', '__tests__', 'fixtures'])

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"{Colors.RED}❌ Could not read file: {e}{Colors.NC}")
        return

    lines = content.split('\n')
    issues = {"critical": [], "warning": []}

    for i, line in enumerate(lines, 1):
        line_lower = line.lower()

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
            if re.search(pattern, line, re.IGNORECASE):
                if 'process.env' not in line and 'example' not in line_lower and 'test' not in line_lower:
                    issues["critical"].append(f"🔐 L{i}: Possible {name}")

        # CRITICAL: SQL injection patterns
        if re.search(r'\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)', line, re.IGNORECASE):
            issues["critical"].append(f"💉 L{i}: Possible SQL injection")

        # WARNING: Console.log (skip test files)
        if 'console.log' in line and not is_test:
            issues["warning"].append(f"📝 L{i}: console.log")

        # WARNING: Debugger statements
        if 'debugger' in line and not line.strip().startswith('//'):
            issues["warning"].append(f"🐛 L{i}: debugger statement")

        # WARNING: TODO/FIXME/HACK (info only)
        if any(tag in line for tag in ['TODO:', 'FIXME:', 'HACK:', 'XXX:']):
            issues["warning"].append(f"📌 L{i}: TODO/FIXME")

        # WARNING: Disabled eslint rules
        if 'eslint-disable' in line:
            issues["warning"].append(f"⚠️  L{i}: ESLint disabled")

    # Print results
    total_issues = len(issues["critical"]) + len(issues["warning"])

    if total_issues == 0:
        print(f"{Colors.GREEN}✅ No issues found{Colors.NC}")
        return

    if issues["critical"]:
        print(f"\n{Colors.RED}🚨 CRITICAL ({len(issues['critical'])}){Colors.NC}")
        for issue in issues["critical"]:
            print(f"   {issue}")

    if issues["warning"]:
        print(f"\n{Colors.YELLOW}⚠️  WARNINGS ({len(issues['warning'])}){Colors.NC}")
        for issue in issues["warning"][:5]:  # Limit to first 5
            print(f"   {issue}")
        if len(issues["warning"]) > 5:
            print(f"   ... and {len(issues['warning']) - 5} more")

    # Check code style consistency
    style_issues = check_code_style(filepath)
    if style_issues:
        print(f"\n{Colors.BLUE}📝 STYLE ({len(style_issues)}){Colors.NC}")
        for issue in style_issues[:3]:
            print(f"   {issue['message']}")
        if len(style_issues) > 3:
            print(f"   ... and {len(style_issues) - 3} more")

    # Track style from this file (learn patterns)
    track_file_style(filepath)

    print()


def check_code_style(filepath):
    """Check file against tracked code styles."""
    try:
        from style_tracker import check_file_style
        return check_file_style(filepath)
    except ImportError:
        # Try importing from same directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, script_dir)
        try:
            from style_tracker import check_file_style
            return check_file_style(filepath)
        except ImportError:
            return []


def track_file_style(filepath):
    """Track style patterns from this file."""
    try:
        from style_tracker import track_file
        track_file(filepath, quiet=True)
    except ImportError:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, script_dir)
        try:
            from style_tracker import track_file
            track_file(filepath, quiet=True)
        except ImportError:
            pass


def main():
    if len(sys.argv) < 2:
        print("Usage: audit-file.py <filepath>")
        sys.exit(1)

    filepath = sys.argv[1]
    audit_file(filepath)

if __name__ == "__main__":
    main()
