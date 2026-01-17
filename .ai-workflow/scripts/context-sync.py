#!/usr/bin/env python3
"""
Context Sync - Ensures agents have up-to-date project context
Runs before prompt injection to:
1. Check SESSION.md freshness
2. Gather current project state
3. Auto-update context if stale
4. Generate context summary for prompts
"""
import subprocess
import sys
import os
import re
from pathlib import Path
from datetime import datetime, timedelta

# Paths relative to this script's location
SCRIPT_DIR = Path(__file__).parent
WORKFLOW_ROOT = SCRIPT_DIR.parent  # .ai-workflow
PROJECT_ROOT = WORKFLOW_ROOT.parent  # project root
CONTEXT_DIR = WORKFLOW_ROOT / "context"
SESSION_FILE = CONTEXT_DIR / "SESSION.md"
MVP_FILE = CONTEXT_DIR / "MVP_MASTER_LIST.md"
AUDIT_LOG = CONTEXT_DIR / "audit.log"

# How old SESSION.md can be before warning (in hours)
STALE_THRESHOLD_HOURS = 24

def run_cmd(cmd: list[str]) -> str:
    """Run a shell command and return output."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
        return result.stdout.strip()
    except Exception:
        return ""

def get_current_branch() -> str:
    """Get current git branch."""
    return run_cmd(["git", "branch", "--show-current"])

def get_recent_commits(n: int = 5) -> list[str]:
    """Get last N commit messages."""
    output = run_cmd(["git", "log", "--oneline", f"-{n}"])
    return output.split("\n") if output else []

def get_uncommitted_changes() -> list[str]:
    """Get list of uncommitted/unstaged files."""
    output = run_cmd(["git", "status", "--porcelain"])
    if not output:
        return []
    return [line[3:] for line in output.split("\n") if line]

def get_session_last_updated() -> tuple[datetime | None, str | None]:
    """Parse SESSION.md for last updated date and agent."""
    if not SESSION_FILE.exists():
        return None, None

    content = SESSION_FILE.read_text()

    # Look for "Last Updated" in table
    date_match = re.search(r'\*\*Last Updated\*\*\s*\|\s*(\d{4}-\d{2}-\d{2})', content)
    agent_match = re.search(r'\*\*Last Agent\*\*\s*\|\s*(\w+)', content)

    last_date = None
    if date_match:
        try:
            last_date = datetime.strptime(date_match.group(1), "%Y-%m-%d")
        except ValueError:
            pass

    last_agent = agent_match.group(1) if agent_match else None

    return last_date, last_agent

def get_current_focus() -> list[str]:
    """Extract current focus items from SESSION.md."""
    if not SESSION_FILE.exists():
        return []

    content = SESSION_FILE.read_text()
    focus_section = re.search(r'## Current Focus\s*\n(.*?)(?=\n## |\Z)', content, re.DOTALL)

    if not focus_section:
        return []

    items = re.findall(r'[-*]\s+(.+)', focus_section.group(1))
    return items[:5]  # Top 5 focus items

def get_mvp_status() -> dict:
    """Get MVP blocker status from MVP_MASTER_LIST.md."""
    if not MVP_FILE.exists():
        return {"total": 0, "done": 0, "pending": 0}

    content = MVP_FILE.read_text()

    # Count checkboxes
    done = len(re.findall(r'\[x\]', content, re.IGNORECASE))
    pending = len(re.findall(r'\[ \]', content))

    return {"total": done + pending, "done": done, "pending": pending}

def check_session_freshness() -> tuple[bool, str]:
    """Check if SESSION.md is stale."""
    last_updated, last_agent = get_session_last_updated()

    if not last_updated:
        return False, "⚠️  SESSION.md has no date - please update it"

    age = datetime.now() - last_updated
    if age > timedelta(hours=STALE_THRESHOLD_HOURS):
        days = age.days
        return False, f"⚠️  SESSION.md is {days} day(s) old (last: {last_agent})"

    return True, f"✅ SESSION.md is current (updated: {last_updated.date()}, by: {last_agent})"

def generate_context_summary() -> str:
    """Generate a context summary to prepend to prompts."""
    branch = get_current_branch()
    commits = get_recent_commits(3)
    changes = get_uncommitted_changes()
    focus = get_current_focus()
    mvp = get_mvp_status()

    summary_lines = [
        "### Project Context (Auto-generated)",
        f"- **Branch:** `{branch}`",
        f"- **MVP Progress:** {mvp['done']}/{mvp['total']} blockers done",
    ]

    if focus:
        summary_lines.append(f"- **Current Focus:** {focus[0][:50]}...")

    if changes:
        summary_lines.append(f"- **Uncommitted Files:** {len(changes)} files")

    if commits:
        summary_lines.append(f"- **Last Commit:** {commits[0][:60]}")

    return "\n".join(summary_lines)

def update_session_date():
    """Update SESSION.md with current date."""
    if not SESSION_FILE.exists():
        return False

    content = SESSION_FILE.read_text()
    today = datetime.now().strftime("%Y-%m-%d")

    # Update the Last Updated field
    new_content = re.sub(
        r'(\*\*Last Updated\*\*\s*\|\s*)\d{4}-\d{2}-\d{2}',
        f'\\g<1>{today}',
        content
    )

    if new_content != content:
        SESSION_FILE.write_text(new_content)
        return True
    return False

def log_sync(status: str, details: str):
    """Log context sync to audit log."""
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] [{status}] [CONTEXT-SYNC] {details}\n"
        with open(AUDIT_LOG, "a") as f:
            f.write(log_line)
    except Exception:
        pass

def sync_context(auto_update: bool = False) -> tuple[bool, str, str]:
    """
    Sync and validate project context.
    Returns: (is_fresh, status_message, context_summary)
    """
    messages = []

    # Check SESSION.md freshness
    is_fresh, freshness_msg = check_session_freshness()
    messages.append(freshness_msg)

    # Get current state
    branch = get_current_branch()
    changes = get_uncommitted_changes()
    mvp = get_mvp_status()

    messages.append(f"📌 Branch: {branch}")
    messages.append(f"📊 MVP: {mvp['done']}/{mvp['total']} complete")

    if changes:
        messages.append(f"📝 {len(changes)} uncommitted file(s)")

    # Auto-update date if requested and stale
    if auto_update and not is_fresh:
        if update_session_date():
            messages.append("🔄 Auto-updated SESSION.md date")
            is_fresh = True

    # Generate context for prompt
    context = generate_context_summary()

    # Log the sync
    log_sync("SYNC", f"Branch: {branch}, MVP: {mvp['done']}/{mvp['total']}, Fresh: {is_fresh}")

    return is_fresh, "\n".join(messages), context

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Sync project context for agents")
    parser.add_argument("--auto-update", action="store_true", help="Auto-update SESSION.md date if stale")
    parser.add_argument("--summary-only", action="store_true", help="Only output context summary (for piping)")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    is_fresh, status, context = sync_context(auto_update=args.auto_update)

    if args.summary_only:
        print(context)
    elif args.json:
        import json
        print(json.dumps({
            "fresh": is_fresh,
            "branch": get_current_branch(),
            "mvp": get_mvp_status(),
            "uncommitted": len(get_uncommitted_changes()),
            "context": context
        }))
    else:
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("🔄 Context Sync")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(status)
        print("")
        if not is_fresh:
            print("💡 Run with --auto-update to refresh SESSION.md date")
            print("   Or manually update .context/SESSION.md")

        sys.exit(0 if is_fresh else 1)

if __name__ == "__main__":
    main()
