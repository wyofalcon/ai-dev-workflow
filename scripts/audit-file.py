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
        "message": "🔐 Possible hardcoded secret",
        "severity": "error"
    },
    "console_log": {
        "pattern": r"console\.(log|debug|info)\(",
        "message": "📝 Console statement (remove before commit)",
        "severity": "warning"
    },
    "debugger": {
        "pattern": r"^\s*debugger\s*;?",
        "message": "🐛 Debugger statement",
        "severity": "error"
    },
    "todo_fixme": {
        "pattern": r"(?i)(TODO|FIXME|HACK|XXX):",
        "message": "📌 TODO/FIXME found",
        "severity": "info"
    },
    "eslint_disable": {
        "pattern": r"eslint-disable(?!-next-line)",
        "message": "⚠️  ESLint disabled for block",
        "severity": "warning"
    },
    "sql_injection": {
        "pattern": r"(query|execute)\s*\(\s*['\"].*\$\{|\+\s*[a-zA-Z_]+\s*\+",
        "message": "💉 Possible SQL injection",
        "severity": "error"
    },
    "eval_usage": {
        "pattern": r"\beval\s*\(",
        "message": "🔴 eval() is dangerous",
        "severity": "error"
    },
    "private_key": {
        "pattern": r"-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----",
        "message": "🔐 Private key detected",
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
    
    # Skip test files for some checks
    is_test = any(x in filepath.lower() for x in ['test', 'spec', '__tests__', 'fixtures'])
    
    patterns = load_config()
    issues = []
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except IOError:
        return []
    
    for line_num, line in enumerate(lines, 1):
        line_lower = line.lower()
        
        for name, config in patterns.items():
            if re.search(config['pattern'], line):
                # Smart exclusions to reduce false positives
                if name in ['secrets', 'private_key']:
                    # Skip if using environment variables or example code
                    if 'process.env' in line or 'os.environ' in line:
                        continue
                    if 'example' in line_lower or 'sample' in line_lower:
                        continue
                
                if name == 'console_log' and is_test:
                    continue  # Allow console.log in test files
                
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
    
    if errors:
        print(f"\n{RED}🚨 CRITICAL ({len(errors)}){NC}")
        for issue in errors:
            print(f"   L{issue['line']}: {issue['message']}")
    
    if warnings:
        print(f"\n{YELLOW}⚠️  WARNINGS ({len(warnings)}){NC}")
        for issue in warnings[:5]:
            print(f"   L{issue['line']}: {issue['message']}")
        if len(warnings) > 5:
            print(f"   ... and {len(warnings) - 5} more")
    
    if infos:
        for issue in infos[:3]:
            print(f"   L{issue['line']}: {issue['message']}")

if __name__ == '__main__':
    main()
