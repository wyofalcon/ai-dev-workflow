#!/usr/bin/env python3
"""
Single File Auditor - Checks a specific file for issues
Used by audit-watch.sh for real-time feedback

Features:
- Pattern-based security and quality checks
- Code style consistency checking
- Saves detailed logs to .context/audit-logs/
"""
import sys
import os
import re
import json
from datetime import datetime

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    MAGENTA = '\033[0;35m'
    NC = '\033[0m'  # No Color
    BOLD = '\033[1m'
    DIM = '\033[2m'

# Log directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOG_DIR = os.path.join(PROJECT_ROOT, '.context', 'audit-logs')
SUMMARY_FILE = os.path.join(LOG_DIR, 'audit-summary.json')

def ensure_log_dir():
    """Create log directory if it doesn't exist."""
    os.makedirs(LOG_DIR, exist_ok=True)

def get_line_context(lines, line_num, context=2):
    """Get surrounding lines for context."""
    start = max(0, line_num - context - 1)
    end = min(len(lines), line_num + context)
    result = []
    for i in range(start, end):
        prefix = ">>> " if i == line_num - 1 else "    "
        result.append(f"{prefix}{i+1:4}: {lines[i][:80]}")
    return result

def save_audit_log(filepath, issues, details):
    """Save detailed audit log to file."""
    ensure_log_dir()

    timestamp = datetime.now().isoformat()
    rel_path = os.path.relpath(filepath, PROJECT_ROOT)

    # Individual log file (append mode)
    log_filename = datetime.now().strftime('%Y-%m-%d') + '.log'
    log_path = os.path.join(LOG_DIR, log_filename)

    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"\n{'='*70}\n")
        f.write(f"[{timestamp}] {rel_path}\n")
        f.write(f"{'='*70}\n")

        total = len(issues.get('critical', [])) + len(issues.get('warning', []))
        if total == 0:
            f.write("✅ No issues found\n")
        else:
            if issues.get('critical'):
                f.write(f"\n🚨 CRITICAL ISSUES ({len(issues['critical'])})\n")
                for issue in issues['critical']:
                    f.write(f"  • {issue['message']}\n")
                    if issue.get('context'):
                        for ctx_line in issue['context']:
                            f.write(f"      {ctx_line}\n")

            if issues.get('warning'):
                f.write(f"\n⚠️  WARNINGS ({len(issues['warning'])})\n")
                for issue in issues['warning']:
                    f.write(f"  • {issue['message']}\n")
                    if issue.get('context'):
                        for ctx_line in issue['context']:
                            f.write(f"      {ctx_line}\n")

    # Update summary JSON
    update_summary(rel_path, issues, timestamp)

def update_summary(filepath, issues, timestamp):
    """Update the audit summary JSON file."""
    summary = {}
    if os.path.exists(SUMMARY_FILE):
        try:
            with open(SUMMARY_FILE, 'r') as f:
                summary = json.load(f)
        except:
            summary = {}

    if 'files' not in summary:
        summary['files'] = {}
    if 'stats' not in summary:
        summary['stats'] = {'total_audits': 0, 'total_issues': 0, 'last_run': None}

    critical_count = len(issues.get('critical', []))
    warning_count = len(issues.get('warning', []))

    summary['files'][filepath] = {
        'last_audit': timestamp,
        'critical': critical_count,
        'warnings': warning_count,
        'status': 'FAIL' if critical_count > 0 else ('WARN' if warning_count > 0 else 'PASS')
    }

    summary['stats']['total_audits'] += 1
    summary['stats']['total_issues'] += critical_count + warning_count
    summary['stats']['last_run'] = timestamp

    with open(SUMMARY_FILE, 'w') as f:
        json.dump(summary, f, indent=2)

def audit_file(filepath, verbose=False):
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
                    issues["critical"].append({
                        "line": i,
                        "message": f"🔐 L{i}: Possible {name}",
                        "type": "secret",
                        "context": get_line_context(lines, i)
                    })

        # CRITICAL: SQL injection patterns
        if re.search(r'\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)', line, re.IGNORECASE):
            issues["critical"].append({
                "line": i,
                "message": f"💉 L{i}: Possible SQL injection",
                "type": "sql_injection",
                "context": get_line_context(lines, i)
            })

        # WARNING: Console.log (skip test files)
        if 'console.log' in line and not is_test:
            issues["warning"].append({
                "line": i,
                "message": f"📝 L{i}: console.log",
                "type": "console_log",
                "context": get_line_context(lines, i) if verbose else None
            })

        # WARNING: Debugger statements
        if 'debugger' in line and not line.strip().startswith('//'):
            issues["warning"].append({
                "line": i,
                "message": f"🐛 L{i}: debugger statement",
                "type": "debugger",
                "context": get_line_context(lines, i)
            })

        # WARNING: TODO/FIXME/HACK (info only)
        if any(tag in line for tag in ['TODO:', 'FIXME:', 'HACK:', 'XXX:']):
            issues["warning"].append({
                "line": i,
                "message": f"📌 L{i}: TODO/FIXME",
                "type": "todo",
                "context": get_line_context(lines, i) if verbose else None
            })

        # WARNING: Disabled eslint rules
        if 'eslint-disable' in line:
            issues["warning"].append({
                "line": i,
                "message": f"⚠️  L{i}: ESLint disabled",
                "type": "eslint_disable",
                "context": get_line_context(lines, i)
            })

    # Save log before printing
    save_audit_log(filepath, issues, {})

    # Print results
    total_issues = len(issues["critical"]) + len(issues["warning"])

    if total_issues == 0:
        print(f"{Colors.GREEN}✅ No issues found{Colors.NC}")
        return

    if issues["critical"]:
        print(f"\n{Colors.RED}{Colors.BOLD}🚨 CRITICAL ({len(issues['critical'])}){Colors.NC}")
        for issue in issues["critical"]:
            print(f"   {issue['message']}")
            # Always show context for critical issues
            if issue.get('context'):
                print(f"{Colors.DIM}")
                for ctx_line in issue['context']:
                    print(f"      {ctx_line}")
                print(f"{Colors.NC}")

    if issues["warning"]:
        print(f"\n{Colors.YELLOW}⚠️  WARNINGS ({len(issues['warning'])}){Colors.NC}")
        show_count = 10 if verbose else 5
        for issue in issues["warning"][:show_count]:
            print(f"   {issue['message']}")
            # Show context if verbose or for serious warnings
            if issue.get('context') and (verbose or issue['type'] in ['debugger', 'eslint_disable']):
                print(f"{Colors.DIM}")
                for ctx_line in issue['context']:
                    print(f"      {ctx_line}")
                print(f"{Colors.NC}")

        if len(issues["warning"]) > show_count:
            remaining = len(issues["warning"]) - show_count
            log_hint = os.path.join('.context', 'audit-logs', datetime.now().strftime('%Y-%m-%d') + '.log')
            print(f"   {Colors.CYAN}... and {remaining} more (see {log_hint}){Colors.NC}")

    # Check code style consistency
    style_issues = check_code_style(filepath)
    if style_issues:
        print(f"\n{Colors.BLUE}� STYLE ({len(style_issues)}){Colors.NC}")
        for issue in style_issues[:3]:
            print(f"   {issue['message']}")
        if len(style_issues) > 3:
            print(f"   ... and {len(style_issues) - 3} more")

    # Track style from this file (learn patterns)
    track_file_style(filepath)

    # Show log location hint
    if total_issues > 0:
        log_file = os.path.join('.context', 'audit-logs', datetime.now().strftime('%Y-%m-%d') + '.log')
        print(f"\n{Colors.CYAN}📁 Full details: {log_file}{Colors.NC}")

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
        print("Usage: audit-file.py <filepath> [--verbose|-v]")
        print("\nOptions:")
        print("  --verbose, -v    Show full context for all issues")
        print("\nLogs saved to: .context/audit-logs/")
        sys.exit(1)

    filepath = sys.argv[1]
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    audit_file(filepath, verbose=verbose)

if __name__ == "__main__":
    main()
