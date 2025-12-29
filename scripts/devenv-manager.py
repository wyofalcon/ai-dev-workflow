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


def apply_environment(env_name: str, service_overrides: Optional[Dict] = None,
                      restart_services: bool = False, run_migrations: bool = False) -> bool:
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

    # Handle Docker services restart
    if restart_services:
        restart_docker_services(env_name)

    # Run database migrations
    if run_migrations:
        run_db_migrations()

    return True


def restart_docker_services(env_name: str) -> bool:
    """Restart Docker containers based on environment."""
    print(f"\n{Colors.CYAN}🔄 Restarting Docker services...{Colors.NC}")

    # DevLive uses overlay compose file on top of base
    if env_name == "DevLive":
        compose_args = ["-f", "docker-compose.yml", "-f", "docker-compose.devlive.yml"]
    else:
        compose_args = ["-f", "docker-compose.yml"]

    try:
        # Stop existing containers
        subprocess.run(
            ["docker", "compose"] + compose_args + ["down"],
            cwd=PROJECT_ROOT,
            capture_output=True
        )

        # Start fresh containers
        result = subprocess.run(
            ["docker", "compose"] + compose_args + ["up", "-d", "--build"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"{Colors.GREEN}✅ Docker services restarted{Colors.NC}")
            return True
        else:
            print(f"{Colors.RED}❌ Docker restart failed: {result.stderr}{Colors.NC}")
            return False
    except Exception as e:
        print(f"{Colors.RED}❌ Error restarting Docker: {e}{Colors.NC}")
        return False


def run_db_migrations() -> bool:
    """Run Prisma database migrations."""
    print(f"\n{Colors.CYAN}📦 Running database migrations...{Colors.NC}")

    api_dir = PROJECT_ROOT / "api"

    try:
        # Wait for database to be ready
        import time
        print(f"{Colors.DIM}   Waiting for database...{Colors.NC}")
        time.sleep(5)

        result = subprocess.run(
            ["npx", "prisma", "migrate", "dev", "--skip-generate"],
            cwd=api_dir,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"{Colors.GREEN}✅ Migrations complete{Colors.NC}")
            return True
        else:
            # Check if it's just "already applied"
            if "already in sync" in result.stdout or "No pending migrations" in result.stdout:
                print(f"{Colors.GREEN}✅ Database already up to date{Colors.NC}")
                return True
            print(f"{Colors.YELLOW}⚠️  Migration output: {result.stdout}{Colors.NC}")
            return True
    except Exception as e:
        print(f"{Colors.RED}❌ Error running migrations: {e}{Colors.NC}")
        return False


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
    parser.add_argument("--restart", action="store_true", help="Restart Docker services after switching")
    parser.add_argument("--migrate", action="store_true", help="Run database migrations after switching")
    parser.add_argument("--full-reset", action="store_true", help="Full reset: wipe DB, restart services, run migrations")
    parser.add_argument("--save-preset", metavar="NAME", help="Save current config as a preset")
    parser.add_argument("--load-preset", metavar="NAME", help="Load a saved preset")
    args = parser.parse_args()

    if args.status:
        show_environment_status()
        return

    # Handle preset save/load
    if args.save_preset:
        subprocess.run([sys.executable, str(SCRIPT_DIR / "devquick-manager.py"), "--save", args.save_preset])
        return

    if args.load_preset:
        subprocess.run([sys.executable, str(SCRIPT_DIR / "devquick-manager.py"), "--load", args.load_preset])
        return

    # Handle full reset
    if args.full_reset:
        print(f"\n{Colors.YELLOW}⚠️  Full Reset will:{Colors.NC}")
        print(f"   • Stop all Docker containers")
        print(f"   • Wipe database volumes")
        print(f"   • Rebuild and restart services")
        print(f"   • Run database migrations")
        print()
        try:
            confirm = input(f"   Continue? (y/N): ").strip().lower()
            if confirm != 'y':
                print(f"{Colors.YELLOW}Cancelled.{Colors.NC}")
                return
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Cancelled.{Colors.NC}")
            return

        # Perform full reset
        print(f"\n{Colors.CYAN}🗑️  Stopping and wiping containers...{Colors.NC}")
        subprocess.run(["docker", "compose", "down", "-v"], cwd=PROJECT_ROOT)

        env_name = get_active_environment() or "DevLocal"
        apply_environment(env_name, restart_services=True, run_migrations=True)

        print(f"\n{Colors.GREEN}✅ Full reset complete!{Colors.NC}")
        return

    if args.set:
        restart = args.restart or args.full_reset
        migrate = args.migrate or args.full_reset
        if apply_environment(args.set, restart_services=restart, run_migrations=migrate):
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

    # Ask about restart/migration
    do_restart = False
    do_migrate = False

    try:
        print()
        print(f"   {Colors.BOLD}Service Options:{Colors.NC}")
        print(f"   {Colors.GREEN}1{Colors.NC}. Quick switch (config only)")
        print(f"   {Colors.GREEN}2{Colors.NC}. Restart Docker services")
        print(f"   {Colors.GREEN}3{Colors.NC}. Full reset (wipe DB + restart + migrate)")
        print()
        service_choice = input(f"   Select (1-3) [1]: ").strip()

        if service_choice == "2":
            do_restart = True
        elif service_choice == "3":
            do_restart = True
            do_migrate = True
            # Wipe volumes first
            print(f"\n{Colors.CYAN}🗑️  Wiping Docker volumes...{Colors.NC}")
            subprocess.run(["docker", "compose", "down", "-v"], cwd=PROJECT_ROOT, capture_output=True)
    except (KeyboardInterrupt, EOFError):
        pass

    if apply_environment(choice, service_overrides, restart_services=do_restart, run_migrations=do_migrate):
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
