#!/usr/bin/env python3
"""
Builder Context Generator - Creates context files for the AI Builder.
Includes code style rules, project structure, and conventions.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    NC = '\033[0m'

SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
CONTEXT_DIR = PROJECT_ROOT / ".context"
STYLE_CONFIG_FILE = CONTEXT_DIR / "code-style.json"
BUILDER_RULES_FILE = CONTEXT_DIR / "BUILDER_RULES.md"
AUDITOR_RULES_FILE = CONTEXT_DIR / "AUDITOR_RULES.md"


def load_style_config() -> Dict[str, Any]:
    """Load the code style configuration."""
    if STYLE_CONFIG_FILE.exists():
        try:
            with open(STYLE_CONFIG_FILE) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def generate_style_rules() -> str:
    """Generate code style rules from tracked patterns."""
    config = load_style_config()

    if not config.get("languages"):
        return ""

    lines = []

    # Global styles
    global_config = config.get("global", {})
    if global_config.get("detected"):
        lines.append("### Global Formatting")
        lines.append("")
        if global_config.get("indentation"):
            indent = global_config["indentation"]
            lines.append(f"- Use **{indent.get('size')} {indent.get('type')}** for indentation")
        if global_config.get("lineEnding"):
            lines.append(f"- Use **{global_config['lineEnding'].upper()}** line endings")
        lines.append("")

    # Per-language styles
    for lang, lang_config in config.get("languages", {}).items():
        if not lang_config.get("detected"):
            continue

        lines.append(f"### {lang.title()}")
        lines.append("")

        rules = []

        if lang_config.get("indentation"):
            indent = lang_config["indentation"]
            rules.append(f"Use {indent.get('size')} {indent.get('type')} for indentation")

        if lang_config.get("quotes"):
            style = lang_config["quotes"].get("style")
            rules.append(f"Use {style} quotes for strings")

        if lang_config.get("semicolons"):
            if lang_config["semicolons"].get("required"):
                rules.append("Always end statements with semicolons")
            else:
                rules.append("Do NOT use semicolons (ASI style)")

        if lang_config.get("trailingComma"):
            style = lang_config["trailingComma"].get("style")
            if style == "always":
                rules.append("Always use trailing commas in arrays/objects")
            else:
                rules.append("Do NOT use trailing commas")

        if lang_config.get("naming"):
            conv = lang_config["naming"].get("variables")
            rules.append(f"Use {conv} for variable and function names")

        if lang_config.get("functions"):
            preferred = lang_config["functions"].get("preferred")
            if preferred == "arrow":
                rules.append("Prefer arrow functions over function declarations")
            else:
                rules.append("Prefer function declarations over arrow functions")

        if lang_config.get("imports"):
            imports = lang_config["imports"]
            if imports.get("moduleSystem") == "esm":
                rules.append("Use ES6 import/export syntax")
            elif imports.get("moduleSystem") == "commonjs":
                rules.append("Use CommonJS require/module.exports")

        if lang_config.get("braces"):
            desc = lang_config["braces"].get("description")
            rules.append(desc)

        for rule in rules:
            lines.append(f"- {rule}")

        lines.append("")

    return "\n".join(lines)


def generate_builder_rules() -> str:
    """Generate the BUILDER_RULES.md file content."""
    style_rules = generate_style_rules()

    content = f"""# 🤖 Builder Rules

These rules are automatically generated based on the detected code style in this project.
**The Builder (Gemini/Claude) MUST follow these rules when generating code.**

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## Code Style Requirements

{style_rules if style_rules else "*No style patterns detected yet. Write some code and the style will be learned automatically.*"}

## General Rules

### Always Do
- Follow the detected code style patterns exactly
- Match the naming conventions used in existing code
- Use the same import/export style as the rest of the project
- Maintain consistent formatting with existing files
- Add appropriate error handling
- Include type annotations if the project uses TypeScript

### Never Do
- Change established code style patterns
- Mix different quote styles in the same file
- Mix tabs and spaces
- Leave console.log/debugger statements in production code
- Hardcode secrets or API keys
- Ignore existing patterns in favor of personal preference

## Learning New Styles

When you encounter code in this project:
1. Note the formatting patterns (indentation, quotes, semicolons)
2. Note the naming conventions (camelCase, snake_case, etc.)
3. Note the structural patterns (how functions are declared, how imports are organized)
4. Apply these same patterns to any new code you write

The Auditor will check your code for style consistency and flag any deviations.

---

*This file is auto-generated by the AI Dev Workflow. Do not edit manually.*
"""
    return content


def generate_auditor_rules() -> str:
    """Generate the AUDITOR_RULES.md file content."""
    style_rules = generate_style_rules()

    content = f"""# 🔍 Auditor Rules

These rules define what the Auditor (GitHub Copilot + automated checks) should verify.
**Check all code against these patterns for consistency.**

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## Style Enforcement

{style_rules if style_rules else "*No style patterns detected yet. Styles will be learned as code is written.*"}

## What to Check

### High Priority (Block if violated)
- [ ] Security issues (hardcoded secrets, SQL injection, etc.)
- [ ] Debugger statements left in code
- [ ] ESLint disable for entire blocks without justification

### Medium Priority (Warn)
- [ ] Code style deviations from detected patterns
- [ ] Inconsistent naming conventions
- [ ] Console.log statements in non-test files
- [ ] TODO/FIXME comments (track for resolution)

### Low Priority (Info)
- [ ] Minor formatting inconsistencies
- [ ] Style preferences not yet established

## Style Learning

The Auditor should:
1. **Learn** - When new code is written, detect and save the formatting/style patterns
2. **Verify** - Check that new code matches established patterns
3. **Report** - Flag deviations as warnings (not errors) for human decision
4. **Adapt** - If a pattern changes consistently, update the learned style

## Flagging Issues

When flagging a style issue, include:
- What the expected style is
- What was found instead
- Where the pattern was learned from (if known)

Example:
```
📝 STYLE: Expected single quotes, found double quotes
   Detected style: single quotes (from src/index.js)
   Found: "hello world" on line 42
```

---

*This file is auto-generated by the AI Dev Workflow. Do not edit manually.*
"""
    return content


def update_rules() -> None:
    """Update both Builder and Auditor rules files."""
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate and save Builder rules
    builder_content = generate_builder_rules()
    BUILDER_RULES_FILE.write_text(builder_content)

    # Generate and save Auditor rules
    auditor_content = generate_auditor_rules()
    AUDITOR_RULES_FILE.write_text(auditor_content)

    print(f"{Colors.GREEN}✅ Updated rules files:{Colors.NC}")
    print(f"   📝 {BUILDER_RULES_FILE.relative_to(PROJECT_ROOT)}")
    print(f"   🔍 {AUDITOR_RULES_FILE.relative_to(PROJECT_ROOT)}")


def show_builder_context() -> None:
    """Display the current Builder context."""
    if BUILDER_RULES_FILE.exists():
        print(BUILDER_RULES_FILE.read_text())
    else:
        print(f"{Colors.YELLOW}No Builder rules generated yet.{Colors.NC}")
        print(f"Run: {Colors.GREEN}./scripts/generate-context.py --update{Colors.NC}")


def show_auditor_context() -> None:
    """Display the current Auditor context."""
    if AUDITOR_RULES_FILE.exists():
        print(AUDITOR_RULES_FILE.read_text())
    else:
        print(f"{Colors.YELLOW}No Auditor rules generated yet.{Colors.NC}")
        print(f"Run: {Colors.GREEN}./scripts/generate-context.py --update{Colors.NC}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate Builder/Auditor Context")
    parser.add_argument("--update", action="store_true", help="Update rules files")
    parser.add_argument("--builder", action="store_true", help="Show Builder rules")
    parser.add_argument("--auditor", action="store_true", help="Show Auditor rules")
    parser.add_argument("--style-only", action="store_true", help="Show only style rules")
    args = parser.parse_args()

    if args.update:
        update_rules()
    elif args.builder:
        show_builder_context()
    elif args.auditor:
        show_auditor_context()
    elif args.style_only:
        rules = generate_style_rules()
        if rules:
            print(rules)
        else:
            print("No style rules detected yet.")
    else:
        # Default: show status
        print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print(f"{Colors.BOLD}   📋 Builder/Auditor Context{Colors.NC}")
        print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print()

        if BUILDER_RULES_FILE.exists():
            mtime = datetime.fromtimestamp(BUILDER_RULES_FILE.stat().st_mtime)
            print(f"   📝 Builder Rules: {Colors.GREEN}Generated{Colors.NC}")
            print(f"      {Colors.DIM}Last updated: {mtime.strftime('%Y-%m-%d %H:%M')}{Colors.NC}")
        else:
            print(f"   📝 Builder Rules: {Colors.YELLOW}Not generated{Colors.NC}")

        if AUDITOR_RULES_FILE.exists():
            mtime = datetime.fromtimestamp(AUDITOR_RULES_FILE.stat().st_mtime)
            print(f"   🔍 Auditor Rules: {Colors.GREEN}Generated{Colors.NC}")
            print(f"      {Colors.DIM}Last updated: {mtime.strftime('%Y-%m-%d %H:%M')}{Colors.NC}")
        else:
            print(f"   🔍 Auditor Rules: {Colors.YELLOW}Not generated{Colors.NC}")

        print()
        print(f"   {Colors.DIM}Update with: ./scripts/generate-context.py --update{Colors.NC}")
        print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")


if __name__ == "__main__":
    main()
