#!/usr/bin/env python3
"""AI Dev Workflow - Single File Auditor

Runs pattern-based security and quality checks on a single file.
Configurable via .audit-config.json in project root.
"""

import sys
import re
import os
import json

# Colors
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
GREEN = '\033[0;32m'
NC = '\033[0m'

# Default patterns (can be overridden by .audit-config.json)
DEFAULT_PATTERNS = {
    "secrets": {
        "pattern": r"(?i)(password|secret|api[_-]?key|token|auth)\s*[:=]\s*['\"][^'\"]{8,}['\"]",
        "message": "⚠️  Possible hardcoded secret",
        "severity": "error"
    },
    "console_log": {
        "pattern": r"console\.(log|debug|info)\(",
        "message": "💬 Console statement (remove before commit)",
        "severity": "warning"
    },
    "debugger": {
        "pattern": r"^\s*debugger\s*;?",
        "message": "🔴 Debugger statement",
        "severity": "error"
    },
    "todo_fixme": {
        "pattern": r"(?i)(TODO|FIXME|HACK|XXX):",
        "message": "📝 TODO/FIXME found",
        "severity": "info"
    },
    "eslint_disable": {
        "pattern": r"eslint-disable(?!-next-line)",
        "message": "⚠️  ESLint disabled for block",
        "severity": "warning"
    },
    "sql_injection": {
        "pattern": r"(query|execute)\s*\(\s*['\"].*\$\{|\+\s*[a-zA-Z_]+\s*\+",
        "message": "🔴 Possible SQL injection",
        "severity": "error"
    },
    "eval_usage": {
        "pattern": r"\beval\s*\(",
        "message": "🔴 eval() is dangerous",
        "severity": "error"
    }
}

def load_config():
    """Load patterns from .audit-config.json if it exists."""
    config_path = os.path.join(os.getcwd(), '.audit-config.json')
    
    # Also check project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    alt_config_path = os.path.join(project_root, '.audit-config.json')
    
    for path in [config_path, alt_config_path]:
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    config = json.load(f)
                    if 'patterns' in config:
                        return config['patterns']
            except (json.JSONDecodeError, IOError):
                pass
    
    return DEFAULT_PATTERNS

def audit_file(filepath):
    """Audit a single file for pattern violations."""
    if not os.path.exists(filepath):
        return []
    
    patterns = load_config()
    issues = []
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except IOError:
        return []
    
    for line_num, line in enumerate(lines, 1):
        for name, config in patterns.items():
            if re.search(config['pattern'], line):
                issues.append({
                    'line': line_num,
                    'message': config['message'],
                    'severity': config.get('severity', 'warning'),
                    'content': line.strip()[:60]
                })
    
    return issues

def main():
    if len(sys.argv) < 2:
        print(f"{RED}Usage: audit-file.py <filepath>{NC}")
        sys.exit(1)
    
    filepath = sys.argv[1]
    issues = audit_file(filepath)
    
    if not issues:
        print(f"{GREEN}   ✓ No issues found{NC}")
        return
    
    # Group by severity
    errors = [i for i in issues if i['severity'] == 'error']
    warnings = [i for i in issues if i['severity'] == 'warning']
    infos = [i for i in issues if i['severity'] == 'info']
    
    for issue in errors:
        print(f"{RED}   Line {issue['line']}: {issue['message']}{NC}")
    
    for issue in warnings:
        print(f"{YELLOW}   Line {issue['line']}: {issue['message']}{NC}")
    
    for issue in infos:
        print(f"   Line {issue['line']}: {issue['message']}")

if __name__ == '__main__':
    main()
