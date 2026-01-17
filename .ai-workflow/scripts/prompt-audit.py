#!/usr/bin/env python3
"""
Prompt Pre-Audit - Checks prompts before sending to Gemini
1. Duplicate detection - similar tasks in history
2. File conflict detection - pending changes to same files
3. Auto-append formatting rules to ensure consistent code style
"""
import sys
import os
import re
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

# Paths relative to this script's location
SCRIPT_DIR = Path(__file__).parent
WORKFLOW_ROOT = SCRIPT_DIR.parent  # .ai-workflow
CONTEXT_DIR = WORKFLOW_ROOT / "context"
PROMPT_HISTORY = CONTEXT_DIR / "PROMPT_HISTORY.md"
AUDIT_LOG = CONTEXT_DIR / "audit.log"

# Coding standards to append to every prompt
CODING_STANDARDS = """
### Coding Standards (Auto-appended)
- Use double quotes for strings (not single quotes)
- Use semicolons at end of statements
- Use 2-space indentation
- No console.log (use proper logging or remove)
- No debugger statements
- Use async/await over .then() chains
- Destructure props: `const { prop1, prop2 } = props`
- Use functional components with hooks (no class components)
- Follow existing file patterns - check similar files first
- MUI v7 patterns: use `sx` prop, not `makeStyles`
"""

def log_audit(status: str, target: str, details: str = ""):
    """Append audit result to log file."""
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] [{status}] [PROMPT] {target}: {details}\n"
        with open(AUDIT_LOG, "a") as f:
            f.write(log_line)
    except Exception:
        pass

def get_prompt_history() -> list[dict]:
    """Parse prompt history file and extract previous prompts."""
    prompts = []
    if not PROMPT_HISTORY.exists():
        return prompts

    content = PROMPT_HISTORY.read_text()
    # Split by date headers
    sections = re.split(r'---\n## \d{4}-\d{2}-\d{2}', content)

    for section in sections[1:]:  # Skip header
        # Extract the prompt text
        match = re.search(r'```\n?(.*?)\n?```', section, re.DOTALL)
        if match:
            prompt_text = match.group(1).strip()
            # Extract task title if present
            title_match = re.search(r'Task:?\s*([^\n]+)', prompt_text)
            title = title_match.group(1).strip() if title_match else prompt_text[:50]
            prompts.append({
                'title': title,
                'text': prompt_text,
                'files': extract_files(prompt_text)
            })

    return prompts

def extract_files(prompt: str) -> list[str]:
    """Extract file paths mentioned in a prompt."""
    # Match common file path patterns
    patterns = [
        r'src/[a-zA-Z0-9_/.-]+\.(js|jsx|ts|tsx|css)',
        r'api/[a-zA-Z0-9_/.-]+\.(js|ts)',
        r'[a-zA-Z0-9_]+\.(js|jsx|ts|tsx|py|sh)',
    ]
    files = []
    for pattern in patterns:
        files.extend(re.findall(pattern, prompt))
    # Also check for "Files to Modify" section
    files_section = re.search(r'Files to (?:Modify|Consider)[:\s]*\n((?:[-*]\s*[^\n]+\n?)+)', prompt, re.IGNORECASE)
    if files_section:
        for line in files_section.group(1).split('\n'):
            # Extract file paths from list items
            file_match = re.search(r'`?([a-zA-Z0-9_/.-]+\.[a-z]+)`?', line)
            if file_match:
                files.append(file_match.group(1))
    return list(set(files))

def check_duplicate(new_prompt: str, history: list[dict], threshold: float = 0.6) -> tuple[bool, str]:
    """Check if prompt is similar to recent ones."""
    new_title_match = re.search(r'Task:?\s*([^\n]+)', new_prompt)
    new_title = new_title_match.group(1).strip().lower() if new_title_match else new_prompt[:50].lower()

    for old in history[-10:]:  # Check last 10 prompts
        old_title = old['title'].lower()
        similarity = SequenceMatcher(None, new_title, old_title).ratio()
        if similarity > threshold:
            return True, old['title']
    return False, ""

def check_file_conflicts(new_prompt: str, history: list[dict]) -> list[str]:
    """Check if prompt modifies files with pending changes."""
    new_files = extract_files(new_prompt)
    conflicts = []

    for old in history[-5:]:  # Check last 5 prompts
        for f in old.get('files', []):
            if f in new_files:
                conflicts.append(f"{f} (from: {old['title'][:30]}...)")

    return conflicts

def append_standards(prompt: str) -> str:
    """Append coding standards if not already present."""
    if "Coding Standards" in prompt or "coding standards" in prompt:
        return prompt
    return prompt + "\n" + CODING_STANDARDS

def audit_prompt(prompt: str) -> tuple[bool, str, str]:
    """
    Audit a prompt before sending.
    Returns: (should_proceed, status, enhanced_prompt)
    """
    warnings = []

    # Load history
    history = get_prompt_history()

    # Check for duplicates
    is_dup, dup_title = check_duplicate(prompt, history)
    if is_dup:
        warnings.append(f"⚠️  Similar task exists: '{dup_title}'")

    # Check for file conflicts
    conflicts = check_file_conflicts(prompt, history)
    if conflicts:
        warnings.append(f"⚠️  File conflicts: {', '.join(conflicts[:3])}")

    # Append coding standards
    enhanced = append_standards(prompt)

    # Log the audit
    if warnings:
        log_audit("WARN", "pre-audit", "; ".join(warnings))
        return True, "\n".join(warnings), enhanced
    else:
        log_audit("PASS", "pre-audit", "Clean prompt")
        return True, "✅ Prompt passed pre-audit", enhanced

def main():
    if len(sys.argv) < 2:
        print("Usage: prompt-audit.py <prompt-text>")
        print("       prompt-audit.py --file <prompt-file>")
        sys.exit(1)

    if sys.argv[1] == "--file" and len(sys.argv) > 2:
        prompt = Path(sys.argv[2]).read_text()
    else:
        prompt = " ".join(sys.argv[1:])

    should_proceed, status, enhanced = audit_prompt(prompt)

    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📋 Prompt Pre-Audit")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(status)
    print("")

    if should_proceed:
        # Output enhanced prompt (for piping)
        print("--- Enhanced Prompt ---")
        print(enhanced)
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
