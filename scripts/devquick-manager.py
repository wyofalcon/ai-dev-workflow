#!/usr/bin/env python3
"""
DevQuick Manager - Save and load development environment presets.
Allows users to quickly restore their preferred configurations.
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List
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
DEVQUICK_DIR = Path.home() / ".devquick-presets"
CREDENTIALS_FILE = Path.home() / ".ai-workflow-credentials.json"


def ensure_dirs():
    """Ensure required directories exist."""
    DEVQUICK_DIR.mkdir(parents=True, exist_ok=True)
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)


def get_current_config() -> Dict[str, Any]:
    """Get the current active environment configuration."""
    active_config_file = CONTEXT_DIR / "active-devenv.json"
    if active_config_file.exists():
        with open(active_config_file) as f:
            return json.load(f)
    return {}


def get_credentials() -> Dict[str, Any]:
    """Load saved credentials (without exposing values)."""
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE) as f:
            creds = json.load(f)
        # Return credential names only, not values
        return {k: "****" if v else None for k, v in creds.get("providers", {}).items()}
    return {}


def list_presets() -> List[Dict[str, Any]]:
    """List all saved DevQuick presets."""
    ensure_dirs()
    presets = []

    for preset_file in sorted(DEVQUICK_DIR.glob("*.json")):
        try:
            with open(preset_file) as f:
                preset = json.load(f)
            preset["_filename"] = preset_file.name
            presets.append(preset)
        except (json.JSONDecodeError, IOError):
            continue

    return presets


def save_preset(name: Optional[str] = None) -> bool:
    """Save current configuration as a DevQuick preset."""
    ensure_dirs()

    current_config = get_current_config()
    if not current_config:
        print(f"{Colors.RED}No active environment configuration to save.{Colors.NC}")
        print(f"First select an environment with: {Colors.GREEN}./scripts/devenv-manager.py{Colors.NC}")
        return False

    # Get preset name
    if not name:
        print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print(f"{Colors.BOLD}   ⚡ Save DevQuick Preset{Colors.NC}")
        print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print()

        try:
            name = input(f"   Preset name: ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Cancelled.{Colors.NC}")
            return False

    if not name:
        print(f"{Colors.RED}Preset name is required.{Colors.NC}")
        return False

    # Sanitize filename
    safe_name = "".join(c for c in name if c.isalnum() or c in "._- ").strip()
    safe_name = safe_name.replace(" ", "-").lower()

    # Get description
    try:
        description = input(f"   Description (optional): ").strip()
    except (KeyboardInterrupt, EOFError):
        description = ""

    # Build preset
    preset = {
        "name": name,
        "description": description,
        "environment": current_config.get("environment"),
        "services": current_config.get("services", {}),
        "created": datetime.now().isoformat(),
        "version": "1.0"
    }

    # Include workflow settings
    relay_mode_file = CONTEXT_DIR / "RELAY_MODE"
    audit_mode_file = CONTEXT_DIR / "AUDIT_WATCH_MODE"

    preset["workflowSettings"] = {
        "relayMode": relay_mode_file.read_text().strip() if relay_mode_file.exists() else "review",
        "auditWatch": audit_mode_file.read_text().strip() if audit_mode_file.exists() else "on"
    }

    # Save preset file
    preset_file = DEVQUICK_DIR / f"{safe_name}.json"
    with open(preset_file, 'w') as f:
        json.dump(preset, f, indent=2)

    print()
    print(f"{Colors.GREEN}✅ Saved: {preset_file}{Colors.NC}")
    print(f"   Load with: {Colors.CYAN}./scripts/devquick-manager.py --load {safe_name}{Colors.NC}")

    return True


def load_preset(name: Optional[str] = None) -> bool:
    """Load a DevQuick preset."""
    presets = list_presets()

    if not presets:
        print(f"{Colors.YELLOW}No DevQuick presets found.{Colors.NC}")
        print(f"Save one with: {Colors.GREEN}./scripts/devquick-manager.py --save{Colors.NC}")
        return False

    # If no name provided, show selection
    if not name:
        print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print(f"{Colors.BOLD}   ⚡ Load DevQuick Preset{Colors.NC}")
        print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print()

        for i, preset in enumerate(presets, 1):
            env = preset.get("environment", "?")
            desc = preset.get("description", "")
            created = preset.get("created", "")[:10]
            print(f"   {Colors.GREEN}{i}{Colors.NC}. {Colors.BOLD}{preset['name']}{Colors.NC}")
            print(f"      {Colors.DIM}Env: {env} | Created: {created}{Colors.NC}")
            if desc:
                print(f"      {Colors.DIM}{desc}{Colors.NC}")
            print()

        try:
            choice = input(f"   Select preset (1-{len(presets)}): ").strip()
            if choice.isdigit() and 1 <= int(choice) <= len(presets):
                selected = presets[int(choice) - 1]
            else:
                print(f"{Colors.YELLOW}Invalid selection.{Colors.NC}")
                return False
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Cancelled.{Colors.NC}")
            return False
    else:
        # Find preset by name
        selected = None
        for preset in presets:
            safe_name = preset["_filename"].replace(".json", "")
            if safe_name == name or preset["name"].lower() == name.lower():
                selected = preset
                break

        if not selected:
            print(f"{Colors.RED}Preset not found: {name}{Colors.NC}")
            return False

    # Apply preset
    return apply_preset(selected)


def apply_preset(preset: Dict[str, Any]) -> bool:
    """Apply a preset configuration."""
    env_name = preset.get("environment")
    services = preset.get("services", {})
    workflow = preset.get("workflowSettings", {})

    # Write active environment
    active_env_file = CONTEXT_DIR / "ACTIVE_DEVENV"
    active_env_file.write_text(env_name)

    # Write active config
    active_config = {
        "environment": env_name,
        "services": services,
        "timestamp": datetime.now().isoformat(),
        "loadedFrom": preset.get("name", "unknown")
    }

    with open(CONTEXT_DIR / "active-devenv.json", 'w') as f:
        json.dump(active_config, f, indent=2)

    # Apply workflow settings
    if "relayMode" in workflow:
        (CONTEXT_DIR / "RELAY_MODE").write_text(workflow["relayMode"])
    if "auditWatch" in workflow:
        (CONTEXT_DIR / "AUDIT_WATCH_MODE").write_text(workflow["auditWatch"])

    # Generate env file
    generate_env_file(active_config)

    print()
    print(f"{Colors.GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.GREEN}  ⚡ DevQuick Preset Loaded: {preset['name']}{Colors.NC}")
    print(f"{Colors.GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"   Environment: {env_name}")
    if workflow:
        print(f"   Relay Mode: {workflow.get('relayMode', 'review')}")
        print(f"   Audit Watch: {workflow.get('auditWatch', 'on')}")
    print()

    return True


def generate_env_file(config: Dict[str, Any]) -> None:
    """Generate environment variables file."""
    env_lines = [
        "# Auto-generated by DevQuick Manager",
        f"# Environment: {config.get('environment', 'unknown')}",
        f"# Generated: {config.get('timestamp', 'unknown')}",
        f"# Loaded from: {config.get('loadedFrom', 'unknown')}",
        "",
        f"DEVENV_MODE={config.get('environment', 'unknown')}",
        ""
    ]

    services = config.get("services", {})
    for service_name, service_info in services.items():
        if service_name == "mode":
            continue
        if isinstance(service_info, dict):
            svc_type = service_info.get("type", "mock")
            env_lines.append(f"SERVICE_{service_name.upper()}_MODE={svc_type}")

    env_file = CONTEXT_DIR / "devenv.env"
    env_file.write_text("\n".join(env_lines))


def delete_preset(name: str) -> bool:
    """Delete a DevQuick preset."""
    presets = list_presets()

    for preset in presets:
        safe_name = preset["_filename"].replace(".json", "")
        if safe_name == name or preset["name"].lower() == name.lower():
            preset_file = DEVQUICK_DIR / preset["_filename"]
            preset_file.unlink()
            print(f"{Colors.GREEN}✅ Deleted preset: {preset['name']}{Colors.NC}")
            return True

    print(f"{Colors.RED}Preset not found: {name}{Colors.NC}")
    return False


def show_presets() -> None:
    """Display all saved presets."""
    presets = list_presets()

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   ⚡ DevQuick Presets{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()

    if not presets:
        print(f"   {Colors.DIM}No presets saved yet.{Colors.NC}")
        print(f"   Save one with: {Colors.GREEN}./scripts/devquick-manager.py --save{Colors.NC}")
    else:
        for preset in presets:
            env = preset.get("environment", "?")
            desc = preset.get("description", "")
            created = preset.get("created", "")[:10]
            filename = preset["_filename"].replace(".json", "")

            print(f"   {Colors.BOLD}{preset['name']}{Colors.NC} ({filename})")
            print(f"   {Colors.DIM}├─ Environment: {env}{Colors.NC}")
            print(f"   {Colors.DIM}├─ Created: {created}{Colors.NC}")
            if desc:
                print(f"   {Colors.DIM}└─ {desc}{Colors.NC}")
            else:
                print(f"   {Colors.DIM}└─ (no description){Colors.NC}")
            print()

    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="DevQuick Preset Manager")
    parser.add_argument("--save", action="store_true", help="Save current config as preset")
    parser.add_argument("--load", nargs="?", const="", metavar="NAME", help="Load a preset")
    parser.add_argument("--delete", metavar="NAME", help="Delete a preset")
    parser.add_argument("--list", action="store_true", help="List all presets")
    args = parser.parse_args()

    if args.save:
        save_preset()
    elif args.load is not None:
        load_preset(args.load if args.load else None)
    elif args.delete:
        delete_preset(args.delete)
    elif args.list:
        show_presets()
    else:
        # Default: show list
        show_presets()


if __name__ == "__main__":
    main()
