#!/usr/bin/env python3
"""
Code Style Tracker - Detects and tracks code formatting/style patterns.
Learns from existing code and enforces consistency for Builder and Auditor.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter
from datetime import datetime

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    RED = '\033[0;31m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    NC = '\033[0m'

SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
CONTEXT_DIR = PROJECT_ROOT / ".context"
STYLE_CONFIG_FILE = CONTEXT_DIR / "code-style.json"

# File extension to language mapping
LANGUAGE_MAP = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.php': 'php',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
}


def load_style_config() -> Dict[str, Any]:
    """Load the code style configuration."""
    if STYLE_CONFIG_FILE.exists():
        try:
            with open(STYLE_CONFIG_FILE) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    return {
        "version": "1.0",
        "lastUpdated": None,
        "languages": {},
        "global": {
            "detected": False,
            "indentation": None,
            "lineEnding": None,
            "maxLineLength": None,
            "trailingNewline": None
        }
    }


def save_style_config(config: Dict[str, Any]) -> None:
    """Save the code style configuration."""
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    config["lastUpdated"] = datetime.now().isoformat()
    with open(STYLE_CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)


def detect_indentation(lines: List[str]) -> Optional[Dict[str, Any]]:
    """Detect indentation style (tabs vs spaces, size)."""
    tab_count = 0
    space_counts = Counter()

    for line in lines:
        if not line or not line[0].isspace():
            continue

        # Count leading whitespace
        stripped = line.lstrip()
        if not stripped:
            continue

        leading = line[:len(line) - len(stripped)]

        if '\t' in leading:
            tab_count += 1
        else:
            # Count spaces
            space_count = len(leading)
            if space_count > 0:
                # Try to detect the base unit (2 or 4 spaces typically)
                for size in [2, 4, 8]:
                    if space_count % size == 0:
                        space_counts[size] += 1
                        break

    total = tab_count + sum(space_counts.values())
    if total < 5:  # Not enough samples
        return None

    if tab_count > sum(space_counts.values()):
        return {"type": "tabs", "size": 1, "confidence": tab_count / total}
    elif space_counts:
        most_common = space_counts.most_common(1)[0]
        return {"type": "spaces", "size": most_common[0], "confidence": most_common[1] / total}

    return None


def detect_quotes(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect quote style (single vs double)."""
    if language not in ['javascript', 'typescript', 'python']:
        return None

    # Count string literals (simple heuristic)
    single_quotes = len(re.findall(r"'[^']*'", content))
    double_quotes = len(re.findall(r'"[^"]*"', content))

    # Exclude JSON-like structures for JS/TS
    if language in ['javascript', 'typescript']:
        # Subtract object keys
        double_quotes -= len(re.findall(r'"[^"]+"\s*:', content))

    total = single_quotes + double_quotes
    if total < 5:
        return None

    if single_quotes > double_quotes:
        return {"style": "single", "confidence": single_quotes / total}
    else:
        return {"style": "double", "confidence": double_quotes / total}


def detect_semicolons(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect semicolon usage (for JS/TS)."""
    if language not in ['javascript', 'typescript']:
        return None

    lines = content.split('\n')
    with_semi = 0
    without_semi = 0

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('//') or stripped.startswith('/*'):
            continue

        # Skip lines that shouldn't end with semicolon
        if any(stripped.endswith(x) for x in ['{', '}', ',', '(', ':', '?']):
            continue
        if any(stripped.startswith(x) for x in ['if', 'else', 'for', 'while', 'switch', 'try', 'catch', 'finally', 'function', 'class', 'import', 'export']):
            if not stripped.endswith(';'):
                continue

        if stripped.endswith(';'):
            with_semi += 1
        elif re.match(r'^[\w\d\s\.\[\]\(\)\'\"=+\-*/]+$', stripped):
            without_semi += 1

    total = with_semi + without_semi
    if total < 5:
        return None

    if with_semi > without_semi:
        return {"required": True, "confidence": with_semi / total}
    else:
        return {"required": False, "confidence": without_semi / total}


def detect_trailing_comma(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect trailing comma style in arrays/objects."""
    if language not in ['javascript', 'typescript', 'python']:
        return None

    # Find array/object endings
    with_trailing = len(re.findall(r',\s*[\]\}]', content))
    without_trailing = len(re.findall(r'[^\s,]\s*[\]\}]', content))

    total = with_trailing + without_trailing
    if total < 3:
        return None

    if with_trailing > without_trailing:
        return {"style": "always", "confidence": with_trailing / total}
    else:
        return {"style": "never", "confidence": without_trailing / total}


def detect_naming_convention(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect naming conventions (camelCase, snake_case, etc.)."""
    conventions = {
        "camelCase": 0,
        "PascalCase": 0,
        "snake_case": 0,
        "SCREAMING_SNAKE": 0,
        "kebab-case": 0
    }

    # Extract identifiers (simplified)
    if language in ['javascript', 'typescript']:
        # Variable/function names
        identifiers = re.findall(r'\b(?:const|let|var|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)', content)
        identifiers += re.findall(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:]\s*(?:function|\()', content)
    elif language == 'python':
        identifiers = re.findall(r'\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)', content)
        identifiers += re.findall(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*=', content, re.MULTILINE)
    else:
        identifiers = re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b', content)

    for ident in identifiers:
        if ident.isupper() and '_' in ident:
            conventions["SCREAMING_SNAKE"] += 1
        elif '_' in ident and ident.islower():
            conventions["snake_case"] += 1
        elif '-' in ident:
            conventions["kebab-case"] += 1
        elif ident[0].isupper() and not ident.isupper():
            conventions["PascalCase"] += 1
        elif ident[0].islower() and any(c.isupper() for c in ident):
            conventions["camelCase"] += 1

    total = sum(conventions.values())
    if total < 5:
        return None

    # Return the most common for variables/functions
    most_common = max(conventions.items(), key=lambda x: x[1])
    return {
        "variables": most_common[0],
        "confidence": most_common[1] / total,
        "breakdown": {k: v for k, v in conventions.items() if v > 0}
    }


def detect_import_style(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect import/module style."""
    if language not in ['javascript', 'typescript', 'python']:
        return None

    result = {}

    if language in ['javascript', 'typescript']:
        # ES6 imports vs require
        es6_imports = len(re.findall(r'^import\s+', content, re.MULTILINE))
        requires = len(re.findall(r'require\s*\(', content))

        if es6_imports + requires > 0:
            if es6_imports > requires:
                result["moduleSystem"] = "esm"
            else:
                result["moduleSystem"] = "commonjs"

        # Grouped vs individual imports
        grouped = len(re.findall(r'import\s*\{[^}]+\}', content))
        individual = len(re.findall(r'import\s+\w+\s+from', content))

        if grouped + individual > 2:
            result["destructuredImports"] = grouped > individual

    elif language == 'python':
        # from x import y vs import x
        from_imports = len(re.findall(r'^from\s+\w+\s+import', content, re.MULTILINE))
        direct_imports = len(re.findall(r'^import\s+\w+', content, re.MULTILINE))

        if from_imports + direct_imports > 2:
            result["preferFromImport"] = from_imports > direct_imports

    return result if result else None


def detect_function_style(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect function declaration style."""
    if language not in ['javascript', 'typescript']:
        return None

    arrow_functions = len(re.findall(r'=>', content))
    regular_functions = len(re.findall(r'\bfunction\b', content))

    total = arrow_functions + regular_functions
    if total < 3:
        return None

    if arrow_functions > regular_functions:
        return {"preferred": "arrow", "confidence": arrow_functions / total}
    else:
        return {"preferred": "function", "confidence": regular_functions / total}


def detect_brace_style(content: str, language: str) -> Optional[Dict[str, Any]]:
    """Detect brace placement style (same line vs new line)."""
    if language not in ['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go']:
        return None

    # Opening brace on same line
    same_line = len(re.findall(r'\)\s*\{', content))
    same_line += len(re.findall(r'\b(?:else|try|finally)\s*\{', content))

    # Opening brace on new line (Allman style)
    new_line = len(re.findall(r'\)\s*\n\s*\{', content))

    total = same_line + new_line
    if total < 3:
        return None

    if same_line > new_line:
        return {"style": "1tbs", "description": "Opening brace on same line", "confidence": same_line / total}
    else:
        return {"style": "allman", "description": "Opening brace on new line", "confidence": new_line / total}


def analyze_file(filepath: str) -> Optional[Dict[str, Any]]:
    """Analyze a file and detect its style patterns."""
    path = Path(filepath)

    if not path.exists():
        return None

    ext = path.suffix.lower()
    language = LANGUAGE_MAP.get(ext)

    if not language:
        return None

    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return None

    if len(content) < 100:  # Skip very small files
        return None

    lines = content.split('\n')

    detected = {
        "language": language,
        "file": str(path.name),
        "analyzedAt": datetime.now().isoformat()
    }

    # Global patterns
    indent = detect_indentation(lines)
    if indent:
        detected["indentation"] = indent

    # Language-specific patterns
    quotes = detect_quotes(content, language)
    if quotes:
        detected["quotes"] = quotes

    semicolons = detect_semicolons(content, language)
    if semicolons:
        detected["semicolons"] = semicolons

    trailing_comma = detect_trailing_comma(content, language)
    if trailing_comma:
        detected["trailingComma"] = trailing_comma

    naming = detect_naming_convention(content, language)
    if naming:
        detected["naming"] = naming

    imports = detect_import_style(content, language)
    if imports:
        detected["imports"] = imports

    functions = detect_function_style(content, language)
    if functions:
        detected["functions"] = functions

    braces = detect_brace_style(content, language)
    if braces:
        detected["braces"] = braces

    # Line endings and trailing newline
    if '\r\n' in content:
        detected["lineEnding"] = "crlf"
    else:
        detected["lineEnding"] = "lf"

    detected["trailingNewline"] = content.endswith('\n')

    # Max line length (90th percentile)
    line_lengths = [len(line) for line in lines if line.strip()]
    if line_lengths:
        line_lengths.sort()
        idx = int(len(line_lengths) * 0.9)
        detected["typicalMaxLineLength"] = line_lengths[idx] if idx < len(line_lengths) else line_lengths[-1]

    return detected


def merge_style_detection(existing: Dict[str, Any], new_detection: Dict[str, Any]) -> Dict[str, Any]:
    """Merge new style detection with existing config, only updating if not already set."""
    language = new_detection.get("language")

    if not language:
        return existing

    # Initialize language config if needed
    if language not in existing.get("languages", {}):
        existing.setdefault("languages", {})[language] = {
            "detected": False,
            "samples": 0
        }

    lang_config = existing["languages"][language]
    lang_config["samples"] = lang_config.get("samples", 0) + 1

    # Only update if not already detected with high confidence
    for key, value in new_detection.items():
        if key in ["language", "file", "analyzedAt"]:
            continue

        if isinstance(value, dict) and "confidence" in value:
            # Only update if new detection has higher confidence or not yet set
            existing_val = lang_config.get(key)
            if not existing_val or (isinstance(existing_val, dict) and
                                    value.get("confidence", 0) > existing_val.get("confidence", 0)):
                lang_config[key] = value
                lang_config["detected"] = True
        elif key not in lang_config:
            lang_config[key] = value
            lang_config["detected"] = True

    # Update global patterns
    if "indentation" in new_detection and not existing.get("global", {}).get("indentation"):
        existing.setdefault("global", {})["indentation"] = new_detection["indentation"]
        existing["global"]["detected"] = True

    if "lineEnding" in new_detection and not existing.get("global", {}).get("lineEnding"):
        existing.setdefault("global", {})["lineEnding"] = new_detection["lineEnding"]

    return existing


def track_file(filepath: str, quiet: bool = False) -> bool:
    """Track style from a file and update the config."""
    detection = analyze_file(filepath)

    if not detection:
        if not quiet:
            print(f"{Colors.YELLOW}Could not analyze: {filepath}{Colors.NC}")
        return False

    config = load_style_config()
    config = merge_style_detection(config, detection)
    save_style_config(config)

    if not quiet:
        print(f"{Colors.GREEN}✓ Tracked style from: {filepath}{Colors.NC}")
        print(f"  Language: {detection.get('language')}")
        if detection.get('indentation'):
            indent = detection['indentation']
            print(f"  Indentation: {indent.get('size')} {indent.get('type')}")
        if detection.get('quotes'):
            print(f"  Quotes: {detection['quotes'].get('style')}")
        if detection.get('semicolons'):
            print(f"  Semicolons: {'yes' if detection['semicolons'].get('required') else 'no'}")

    return True


def check_file_style(filepath: str) -> List[Dict[str, Any]]:
    """Check a file against tracked style rules."""
    detection = analyze_file(filepath)

    if not detection:
        return []

    config = load_style_config()
    language = detection.get("language")

    if language not in config.get("languages", {}):
        return []

    lang_config = config["languages"][language]
    issues = []

    # Check indentation
    if lang_config.get("indentation") and detection.get("indentation"):
        expected = lang_config["indentation"]
        actual = detection["indentation"]
        if expected.get("type") != actual.get("type") or expected.get("size") != actual.get("size"):
            issues.append({
                "type": "style",
                "rule": "indentation",
                "severity": "warning",
                "message": f"Expected {expected.get('size')} {expected.get('type')}, found {actual.get('size')} {actual.get('type')}"
            })

    # Check quotes
    if lang_config.get("quotes") and detection.get("quotes"):
        expected = lang_config["quotes"].get("style")
        actual = detection["quotes"].get("style")
        if expected != actual:
            issues.append({
                "type": "style",
                "rule": "quotes",
                "severity": "warning",
                "message": f"Expected {expected} quotes, found {actual}"
            })

    # Check semicolons
    if lang_config.get("semicolons") and detection.get("semicolons"):
        expected = lang_config["semicolons"].get("required")
        actual = detection["semicolons"].get("required")
        if expected != actual:
            issues.append({
                "type": "style",
                "rule": "semicolons",
                "severity": "warning",
                "message": f"Semicolons {'expected' if expected else 'not expected'}"
            })

    # Check function style
    if lang_config.get("functions") and detection.get("functions"):
        expected = lang_config["functions"].get("preferred")
        actual = detection["functions"].get("preferred")
        if expected != actual:
            issues.append({
                "type": "style",
                "rule": "functions",
                "severity": "info",
                "message": f"Prefer {expected} functions over {actual}"
            })

    return issues


def generate_builder_context() -> str:
    """Generate style context for the Builder (Gemini/Claude)."""
    config = load_style_config()

    if not config.get("languages"):
        return "No code style has been detected yet. Style will be tracked as you write code."

    lines = [
        "# Code Style Guide",
        "",
        "Follow these detected code style patterns for consistency:",
        ""
    ]

    # Global styles
    global_config = config.get("global", {})
    if global_config.get("detected"):
        lines.append("## Global Styles")
        if global_config.get("indentation"):
            indent = global_config["indentation"]
            lines.append(f"- **Indentation**: {indent.get('size')} {indent.get('type')}")
        if global_config.get("lineEnding"):
            lines.append(f"- **Line Endings**: {global_config['lineEnding'].upper()}")
        lines.append("")

    # Per-language styles
    for lang, lang_config in config.get("languages", {}).items():
        if not lang_config.get("detected"):
            continue

        lines.append(f"## {lang.title()}")

        if lang_config.get("indentation"):
            indent = lang_config["indentation"]
            lines.append(f"- **Indentation**: {indent.get('size')} {indent.get('type')}")

        if lang_config.get("quotes"):
            lines.append(f"- **Quotes**: {lang_config['quotes'].get('style')} quotes")

        if lang_config.get("semicolons"):
            semi = "required" if lang_config["semicolons"].get("required") else "not used"
            lines.append(f"- **Semicolons**: {semi}")

        if lang_config.get("trailingComma"):
            lines.append(f"- **Trailing Commas**: {lang_config['trailingComma'].get('style')}")

        if lang_config.get("naming"):
            lines.append(f"- **Naming Convention**: {lang_config['naming'].get('variables')}")

        if lang_config.get("functions"):
            lines.append(f"- **Functions**: prefer {lang_config['functions'].get('preferred')}")

        if lang_config.get("imports"):
            imports = lang_config["imports"]
            if "moduleSystem" in imports:
                lines.append(f"- **Module System**: {imports['moduleSystem'].upper()}")

        if lang_config.get("braces"):
            lines.append(f"- **Brace Style**: {lang_config['braces'].get('description')}")

        lines.append("")

    return "\n".join(lines)


def show_status() -> None:
    """Display current style tracking status."""
    config = load_style_config()

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   📝 Code Style Tracker{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()

    if not config.get("languages"):
        print(f"   {Colors.DIM}No styles tracked yet.{Colors.NC}")
        print(f"   Run: {Colors.GREEN}./scripts/style-tracker.py --scan{Colors.NC}")
    else:
        # Global
        global_config = config.get("global", {})
        if global_config.get("indentation"):
            indent = global_config["indentation"]
            print(f"   {Colors.BOLD}Global:{Colors.NC}")
            print(f"     Indentation: {indent.get('size')} {indent.get('type')}")
            print()

        # Per language
        for lang, lang_config in config.get("languages", {}).items():
            if not lang_config.get("detected"):
                continue

            samples = lang_config.get("samples", 0)
            print(f"   {Colors.BOLD}{lang.title()}{Colors.NC} ({samples} samples)")

            if lang_config.get("quotes"):
                print(f"     Quotes: {lang_config['quotes'].get('style')}")
            if lang_config.get("semicolons"):
                semi = "yes" if lang_config["semicolons"].get("required") else "no"
                print(f"     Semicolons: {semi}")
            if lang_config.get("naming"):
                print(f"     Naming: {lang_config['naming'].get('variables')}")
            if lang_config.get("functions"):
                print(f"     Functions: {lang_config['functions'].get('preferred')}")
            print()

    if config.get("lastUpdated"):
        print(f"   {Colors.DIM}Last updated: {config['lastUpdated'][:19]}{Colors.NC}")

    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")


def scan_project(quiet: bool = False) -> None:
    """Scan the project to detect style from existing files."""
    config = load_style_config()

    # Find source files
    source_dirs = ["src", "lib", "api", "app", "components", "pages", "scripts"]
    extensions = list(LANGUAGE_MAP.keys())

    files_scanned = 0

    if not quiet:
        print(f"\n{Colors.CYAN}Scanning project for code style...{Colors.NC}\n")

    for source_dir in source_dirs:
        dir_path = PROJECT_ROOT / source_dir
        if not dir_path.exists():
            continue

        for ext in extensions:
            for filepath in dir_path.rglob(f"*{ext}"):
                # Skip node_modules, build dirs, etc.
                if any(x in str(filepath) for x in ['node_modules', 'dist', 'build', '.next', '__pycache__']):
                    continue

                detection = analyze_file(str(filepath))
                if detection:
                    config = merge_style_detection(config, detection)
                    files_scanned += 1
                    if not quiet:
                        print(f"   {Colors.GREEN}✓{Colors.NC} {filepath.relative_to(PROJECT_ROOT)}")

    save_style_config(config)

    if not quiet:
        print(f"\n{Colors.GREEN}✅ Scanned {files_scanned} files{Colors.NC}")
        print(f"   Style config saved to: {STYLE_CONFIG_FILE.relative_to(PROJECT_ROOT)}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Code Style Tracker")
    parser.add_argument("--track", metavar="FILE", help="Track style from a file")
    parser.add_argument("--check", metavar="FILE", help="Check file against tracked styles")
    parser.add_argument("--scan", action="store_true", help="Scan project for existing styles")
    parser.add_argument("--status", action="store_true", help="Show current style status")
    parser.add_argument("--context", action="store_true", help="Generate Builder context")
    parser.add_argument("--reset", action="store_true", help="Reset all tracked styles")
    parser.add_argument("--quiet", "-q", action="store_true", help="Quiet mode (minimal output)")
    args = parser.parse_args()

    if args.track:
        track_file(args.track, quiet=args.quiet)
    elif args.check:
        issues = check_file_style(args.check)
        if issues:
            if not args.quiet:
                print(f"\n{Colors.YELLOW}Style issues found:{Colors.NC}")
                for issue in issues:
                    print(f"   {issue['severity'].upper()}: {issue['message']}")
        else:
            if not args.quiet:
                print(f"{Colors.GREEN}✓ No style issues{Colors.NC}")
    elif args.scan:
        scan_project(quiet=args.quiet)
    elif args.context:
        print(generate_builder_context())
    elif args.reset:
        if STYLE_CONFIG_FILE.exists():
            STYLE_CONFIG_FILE.unlink()
        if not args.quiet:
            print(f"{Colors.GREEN}✓ Style tracking reset{Colors.NC}")
    else:
        show_status()


if __name__ == "__main__":
    main()
