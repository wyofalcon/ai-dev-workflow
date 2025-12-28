#!/usr/bin/env python3
"""
DevEnv Manager - Development Environment Configuration
Allows users to choose between DevLocal, DevLive, and DevHybrid environments.
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

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
DEVENV_CONFIG = CONTEXT_DIR / "devenv-config.json"
ACTIVE_ENV_FILE = CONTEXT_DIR / "ACTIVE_DEVENV"
CREDENTIALS_FILE = Path.home() / ".ai-workflow-credentials.json"
DEVQUICK_DIR = Path.home() / ".devquick-presets"


def load_config() -> Dict[str, Any]:
    """Load the DevEnv configuration."""
    if DEVENV_CONFIG.exists():
        with open(DEVENV_CONFIG) as f:
            return json.load(f)
    return {"environments": {}, "currentEnvironment": None}


def save_config(config: Dict[str, Any]) -> None:
    """Save the DevEnv configuration."""
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    with open(DEVENV_CONFIG, 'w') as f:
        json.dump(config, f, indent=2)


def get_active_environment() -> Optional[str]:
    """Get the currently active environment."""
    if ACTIVE_ENV_FILE.exists():
        return ACTIVE_ENV_FILE.read_text().strip()
    return None


def set_active_environment(env_name: str) -> None:
    """Set the active environment."""
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    ACTIVE_ENV_FILE.write_text(env_name)


def has_whiptail() -> bool:
    """Check if whiptail is available for GUI dialogs."""
    try:
        subprocess.run(["whiptail", "--version"], capture_output=True)
        return True
    except FileNotFoundError:
        return False


def show_env_selection_gui() -> Optional[str]:
    """Show environment selection using whiptail."""
    config = load_config()
    envs = config.get("environments", {})

    # Build menu items
    menu_items = []
    for key, env in envs.items():
        icon = env.get("icon", "")
        desc = env.get("description", "")[:40]
        menu_items.extend([key, f"{icon} {desc}"])

    # Add DevQuick option if presets exist
    if DEVQUICK_DIR.exists() and list(DEVQUICK_DIR.glob("*.json")):
        menu_items.extend(["DevQuick", "⚡ Load a saved configuration preset"])

    try:
        result = subprocess.run(
            [
                "whiptail", "--title", "🌍 Choose Development Environment",
                "--menu",
                "\nSelect your development environment:\n\n"
                "• DevLocal: Mock services (free, no external calls)\n"
                "• DevLive: Real dev services (isolated from prod)\n"
                "• DevHybrid: Mix mock and live services\n",
                "22", "75", "4"
            ] + menu_items,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return result.stderr.strip()
    except Exception as e:
        print(f"{Colors.RED}Error showing GUI: {e}{Colors.NC}")

    return None


def show_env_selection_cli() -> Optional[str]:
    """Show environment selection in terminal (fallback)."""
    config = load_config()
    envs = config.get("environments", {})

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   🌍 Choose Development Environment{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()

    options = list(envs.keys())
    for i, key in enumerate(options, 1):
        env = envs[key]
        icon = env.get("icon", "")
        desc = env.get("description", "")
        cost = env.get("costRisk", "unknown")
        print(f"   {Colors.GREEN}{i}{Colors.NC}. {icon} {Colors.BOLD}{key}{Colors.NC}")
        print(f"      {Colors.DIM}{desc}{Colors.NC}")
        print(f"      {Colors.DIM}Cost Risk: {cost}{Colors.NC}")
        print()

    # Check for DevQuick presets
    if DEVQUICK_DIR.exists() and list(DEVQUICK_DIR.glob("*.json")):
        print(f"   {Colors.YELLOW}Q{Colors.NC}. ⚡ {Colors.BOLD}DevQuick{Colors.NC} - Load a saved preset")
        print()

    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")

    try:
        choice = input(f"\n   Enter choice (1-{len(options)}): ").strip()
        if choice.lower() == 'q':
            return "DevQuick"
        if choice.isdigit() and 1 <= int(choice) <= len(options):
            return options[int(choice) - 1]
    except (KeyboardInterrupt, EOFError):
        pass

    return None


def configure_hybrid_services() -> Dict[str, str]:
    """Let user configure which services are mock vs live for DevHybrid."""
    config = load_config()
    hybrid_env = config["environments"].get("DevHybrid", {})
    services = hybrid_env.get("services", {})
    providers = config.get("serviceProviders", {})

    service_config = {}

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   🔀 Configure Hybrid Services{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()
    print(f"   {Colors.DIM}For each service, choose [M]ock (free) or [L]ive{Colors.NC}")
    print(f"   {Colors.DIM}Press Enter to use default{Colors.NC}")
    print()

    for service_name, service_info in services.items():
        if service_name == "mode":
            continue

        default = service_info.get("default", "mock")
        default_display = f"[{default.upper()[0]}]"

        try:
            choice = input(f"   {service_name:12} {Colors.DIM}{default_display}{Colors.NC}: ").strip().lower()
            if choice in ['m', 'mock']:
                service_config[service_name] = "mock"
            elif choice in ['l', 'live']:
                service_config[service_name] = "live"
            else:
                service_config[service_name] = default
        except (KeyboardInterrupt, EOFError):
            service_config[service_name] = default

    print()
    return service_config


def apply_environment(env_name: str, service_overrides: Optional[Dict] = None) -> bool:
    """Apply the selected environment configuration."""
    config = load_config()

    if env_name not in config["environments"]:
        print(f"{Colors.RED}Unknown environment: {env_name}{Colors.NC}")
        return False

    env = config["environments"][env_name]

    # Create environment-specific configuration
    active_config = {
        "environment": env_name,
        "icon": env.get("icon", ""),
        "services": env.get("services", {}),
        "isolation": env.get("isolation", "unknown"),
        "costRisk": env.get("costRisk", "unknown"),
        "timestamp": __import__("datetime").datetime.now().isoformat()
    }

    # Apply service overrides for DevHybrid
    if service_overrides and env_name == "DevHybrid":
        for service, mode in service_overrides.items():
            if service in active_config["services"]:
                active_config["services"][service]["type"] = mode

    # Save active environment
    set_active_environment(env_name)

    # Save active configuration
    active_config_file = CONTEXT_DIR / "active-devenv.json"
    with open(active_config_file, 'w') as f:
        json.dump(active_config, f, indent=2)

    # Generate environment variables file
    generate_env_file(active_config)

    return True


def generate_env_file(config: Dict[str, Any]) -> None:
    """Generate .env file based on environment configuration."""
    env_lines = [
        "# Auto-generated by DevEnv Manager",
        f"# Environment: {config['environment']}",
        f"# Generated: {config.get('timestamp', 'unknown')}",
        "",
        f"DEVENV_MODE={config['environment']}",
        f"DEVENV_ISOLATION={config['isolation']}",
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


def show_environment_status() -> None:
    """Display current environment status."""
    active_env = get_active_environment()
    config = load_config()

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   🌍 Development Environment Status{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()

    if active_env:
        env = config["environments"].get(active_env, {})
        icon = env.get("icon", "")
        desc = env.get("description", "")
        cost = env.get("costRisk", "unknown")

        print(f"   Active: {icon} {Colors.GREEN}{Colors.BOLD}{active_env}{Colors.NC}")
        print(f"   {Colors.DIM}{desc}{Colors.NC}")
        print(f"   Cost Risk: {cost}")

        # Show active services config
        active_config_file = CONTEXT_DIR / "active-devenv.json"
        if active_config_file.exists():
            with open(active_config_file) as f:
                active_cfg = json.load(f)

            print()
            print(f"   {Colors.BOLD}Services:{Colors.NC}")
            for svc, info in active_cfg.get("services", {}).items():
                if svc == "mode":
                    continue
                if isinstance(info, dict):
                    svc_type = info.get("type", "?")
                    color = Colors.GREEN if svc_type == "mock" else Colors.YELLOW
                    print(f"     {svc:12} → {color}{svc_type}{Colors.NC}")
    else:
        print(f"   {Colors.YELLOW}No environment selected{Colors.NC}")
        print(f"   Run: {Colors.GREEN}./scripts/devenv-manager.py{Colors.NC}")

    print()
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="DevEnv Manager")
    parser.add_argument("--status", action="store_true", help="Show current environment status")
    parser.add_argument("--set", metavar="ENV", help="Set environment (DevLocal|DevLive|DevHybrid)")
    parser.add_argument("--interactive", action="store_true", help="Interactive mode (default)")
    args = parser.parse_args()

    if args.status:
        show_environment_status()
        return

    if args.set:
        if apply_environment(args.set):
            print(f"{Colors.GREEN}✅ Environment set to {args.set}{Colors.NC}")
        return

    # Interactive mode
    if has_whiptail():
        choice = show_env_selection_gui()
    else:
        choice = show_env_selection_cli()

    if not choice:
        print(f"{Colors.YELLOW}No environment selected.{Colors.NC}")
        return

    if choice == "DevQuick":
        # Handle DevQuick presets (implemented in devquick-manager.py)
        subprocess.run([sys.executable, str(SCRIPT_DIR / "devquick-manager.py"), "--load"])
        return

    # Configure hybrid services if needed
    service_overrides = None
    if choice == "DevHybrid":
        service_overrides = configure_hybrid_services()

    if apply_environment(choice, service_overrides):
        config = load_config()
        env = config["environments"].get(choice, {})
        icon = env.get("icon", "")

        print()
        print(f"{Colors.GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print(f"{Colors.GREEN}  ✅ Environment Set: {icon} {choice}{Colors.NC}")
        print(f"{Colors.GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
        print()

        # Prompt to save as DevQuick
        try:
            save = input(f"   Save this as a DevQuick preset? (y/N): ").strip().lower()
            if save == 'y':
                subprocess.run([
                    sys.executable,
                    str(SCRIPT_DIR / "devquick-manager.py"),
                    "--save"
                ])
        except (KeyboardInterrupt, EOFError):
            pass


if __name__ == "__main__":
    main()
