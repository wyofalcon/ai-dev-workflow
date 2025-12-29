#!/usr/bin/env python3
"""
Audit Log Viewer - View and analyze audit history
"""
import os
import sys
import json
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOG_DIR = os.path.join(PROJECT_ROOT, '.context', 'audit-logs')
SUMMARY_FILE = os.path.join(LOG_DIR, 'audit-summary.json')

# Colors
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'
    BOLD = '\033[1m'

def show_summary():
    """Show audit summary statistics."""
    if not os.path.exists(SUMMARY_FILE):
        print(f"{Colors.YELLOW}No audit history found. Run some audits first!{Colors.NC}")
        return

    with open(SUMMARY_FILE, 'r') as f:
        summary = json.load(f)

    stats = summary.get('stats', {})
    files = summary.get('files', {})

    print(f"\n{Colors.BOLD}📊 AUDIT SUMMARY{Colors.NC}")
    print("=" * 60)
    print(f"Total audits run: {stats.get('total_audits', 0)}")
    print(f"Total issues found: {stats.get('total_issues', 0)}")
    print(f"Last run: {stats.get('last_run', 'Never')}")
    print()

    # Group files by status
    failed = [(f, d) for f, d in files.items() if d['status'] == 'FAIL']
    warned = [(f, d) for f, d in files.items() if d['status'] == 'WARN']
    passed = [(f, d) for f, d in files.items() if d['status'] == 'PASS']

    if failed:
        print(f"{Colors.RED}🚨 FILES WITH CRITICAL ISSUES ({len(failed)}){Colors.NC}")
        for filepath, data in sorted(failed, key=lambda x: x[1]['last_audit'], reverse=True)[:10]:
            print(f"   {filepath}")
            print(f"      Critical: {data['critical']}, Warnings: {data['warnings']}")
        print()

    if warned:
        print(f"{Colors.YELLOW}⚠️  FILES WITH WARNINGS ({len(warned)}){Colors.NC}")
        for filepath, data in sorted(warned, key=lambda x: x[1]['last_audit'], reverse=True)[:10]:
            print(f"   {filepath} ({data['warnings']} warnings)")
        print()

    print(f"{Colors.GREEN}✅ Clean files: {len(passed)}{Colors.NC}")
    print()

def show_today_log():
    """Show today's audit log."""
    log_file = os.path.join(LOG_DIR, datetime.now().strftime('%Y-%m-%d') + '.log')

    if not os.path.exists(log_file):
        print(f"{Colors.YELLOW}No audits run today.{Colors.NC}")
        return

    print(f"\n{Colors.BOLD}📋 TODAY'S AUDIT LOG{Colors.NC}")
    print("=" * 60)

    with open(log_file, 'r') as f:
        print(f.read())

def show_file_history(filepath):
    """Show audit history for a specific file."""
    if not os.path.exists(SUMMARY_FILE):
        print(f"{Colors.YELLOW}No audit history found.{Colors.NC}")
        return

    with open(SUMMARY_FILE, 'r') as f:
        summary = json.load(f)

    # Normalize filepath
    rel_path = os.path.relpath(filepath, PROJECT_ROOT)

    if rel_path not in summary.get('files', {}):
        print(f"{Colors.YELLOW}No audit history for: {rel_path}{Colors.NC}")
        return

    data = summary['files'][rel_path]
    print(f"\n{Colors.BOLD}📁 AUDIT HISTORY: {rel_path}{Colors.NC}")
    print("=" * 60)
    print(f"Last audit: {data['last_audit']}")
    print(f"Status: {data['status']}")
    print(f"Critical issues: {data['critical']}")
    print(f"Warnings: {data['warnings']}")

def clear_logs():
    """Clear all audit logs."""
    import shutil
    if os.path.exists(LOG_DIR):
        shutil.rmtree(LOG_DIR)
        print(f"{Colors.GREEN}✅ Audit logs cleared.{Colors.NC}")
    else:
        print(f"{Colors.YELLOW}No logs to clear.{Colors.NC}")

def main():
    if len(sys.argv) < 2:
        show_summary()
        return

    cmd = sys.argv[1]

    if cmd in ['--today', '-t', 'today']:
        show_today_log()
    elif cmd in ['--summary', '-s', 'summary']:
        show_summary()
    elif cmd in ['--clear', 'clear']:
        clear_logs()
    elif cmd in ['--help', '-h', 'help']:
        print("Usage: audit-logs.py [command] [options]")
        print()
        print("Commands:")
        print("  (none)           Show audit summary")
        print("  today, -t        Show today's detailed log")
        print("  summary, -s      Show audit summary")
        print("  <filepath>       Show history for specific file")
        print("  clear            Clear all audit logs")
        print("  help, -h         Show this help")
    else:
        # Assume it's a filepath
        show_file_history(cmd)

if __name__ == "__main__":
    main()
