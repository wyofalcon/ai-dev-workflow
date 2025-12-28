#!/usr/bin/env python3
"""
Credentials Manager - Securely store and manage AI service credentials.
Stores GitHub, Copilot, Gemini, Claude, and other API credentials.
Credentials are saved locally and persist across sessions.
"""

import json
import os
import sys
import subprocess
import base64
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from getpass import getpass

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

CREDENTIALS_FILE = Path.home() / ".ai-workflow-credentials.json"
SCRIPT_DIR = Path(__file__).parent.resolve()

# Supported credential providers
PROVIDERS = {
    "github": {
        "name": "GitHub",
        "icon": "🐙",
        "description": "GitHub account for version control",
        "auth_type": "token",
        "env_var": "GITHUB_TOKEN",
        "setup_url": "https://github.com/settings/tokens"
    },
    "copilot": {
        "name": "GitHub Copilot",
        "icon": "🤖",
        "description": "GitHub Copilot subscription",
        "auth_type": "integrated",
        "env_var": None,
        "setup_url": "https://github.com/features/copilot"
    },
    "gemini": {
        "name": "Google Gemini",
        "icon": "💎",
        "description": "Gemini CLI for AI assistance",
        "auth_type": "oauth_or_key",
        "env_var": "GEMINI_API_KEY",
        "setup_url": "https://aistudio.google.com/app/apikey"
    },
    "claude": {
        "name": "Anthropic Claude",
        "icon": "🎭",
        "description": "Claude CLI for AI assistance",
        "auth_type": "api_key",
        "env_var": "ANTHROPIC_API_KEY",
        "setup_url": "https://console.anthropic.com/settings/keys"
    },
    "openai": {
        "name": "OpenAI",
        "icon": "🧠",
        "description": "OpenAI API for GPT models",
        "auth_type": "api_key",
        "env_var": "OPENAI_API_KEY",
        "setup_url": "https://platform.openai.com/api-keys"
    },
    "supabase": {
        "name": "Supabase",
        "icon": "⚡",
        "description": "Supabase database and auth",
        "auth_type": "api_key",
        "env_var": "SUPABASE_KEY",
        "setup_url": "https://supabase.com/dashboard"
    },
    "stripe": {
        "name": "Stripe",
        "icon": "💳",
        "description": "Stripe payment processing",
        "auth_type": "api_key",
        "env_var": "STRIPE_SECRET_KEY",
        "setup_url": "https://dashboard.stripe.com/apikeys"
    },
    "sendgrid": {
        "name": "SendGrid",
        "icon": "📧",
        "description": "SendGrid email service",
        "auth_type": "api_key",
        "env_var": "SENDGRID_API_KEY",
        "setup_url": "https://app.sendgrid.com/settings/api_keys"
    },
    "aws": {
        "name": "AWS",
        "icon": "☁️",
        "description": "Amazon Web Services",
        "auth_type": "access_key",
        "env_var": "AWS_ACCESS_KEY_ID",
        "setup_url": "https://console.aws.amazon.com/iam"
    },
    "vercel": {
        "name": "Vercel",
        "icon": "▲",
        "description": "Vercel deployment platform",
        "auth_type": "token",
        "env_var": "VERCEL_TOKEN",
        "setup_url": "https://vercel.com/account/tokens"
    }
}


def load_credentials() -> Dict[str, Any]:
    """Load credentials from file."""
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"providers": {}, "metadata": {}}


def save_credentials(creds: Dict[str, Any]) -> None:
    """Save credentials to file."""
    creds["metadata"]["lastUpdated"] = datetime.now().isoformat()

    # Set restrictive permissions
    CREDENTIALS_FILE.touch(mode=0o600)
    with open(CREDENTIALS_FILE, 'w') as f:
        json.dump(creds, f, indent=2)
    os.chmod(CREDENTIALS_FILE, 0o600)


def encode_value(value: str) -> str:
    """Simple obfuscation for stored values (not true encryption)."""
    return base64.b64encode(value.encode()).decode()


def decode_value(encoded: str) -> str:
    """Decode obfuscated value."""
    try:
        return base64.b64decode(encoded.encode()).decode()
    except:
        return encoded


def add_credential(provider: str, value: Optional[str] = None) -> bool:
    """Add or update a credential."""
    if provider not in PROVIDERS:
        print(f"{Colors.RED}Unknown provider: {provider}{Colors.NC}")
        print(f"Available: {', '.join(PROVIDERS.keys())}")
        return False

    provider_info = PROVIDERS[provider]

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   {provider_info['icon']} {provider_info['name']}{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()
    print(f"   {Colors.DIM}{provider_info['description']}{Colors.NC}")
    print(f"   {Colors.DIM}Get credentials: {provider_info['setup_url']}{Colors.NC}")
    print()

    if provider_info["auth_type"] == "integrated":
        print(f"   {Colors.YELLOW}This provider uses integrated authentication.{Colors.NC}")
        print(f"   {Colors.DIM}Sign in through VS Code or the CLI.{Colors.NC}")
        return True

    if not value:
        try:
            if provider_info["auth_type"] == "access_key":
                value = getpass(f"   Access Key ID: ")
                secret = getpass(f"   Secret Access Key: ")
                value = f"{value}:{secret}"
            else:
                value = getpass(f"   Enter {provider_info['auth_type'].replace('_', ' ')}: ")
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Cancelled.{Colors.NC}")
            return False

    if not value:
        print(f"{Colors.RED}No value provided.{Colors.NC}")
        return False

    creds = load_credentials()
    creds["providers"][provider] = {
        "value": encode_value(value),
        "type": provider_info["auth_type"],
        "env_var": provider_info["env_var"],
        "added": datetime.now().isoformat()
    }
    save_credentials(creds)

    # Also set environment variable if applicable
    if provider_info["env_var"]:
        set_env_var(provider_info["env_var"], value)

    print(f"\n{Colors.GREEN}✅ {provider_info['name']} credential saved!{Colors.NC}")
    return True


def remove_credential(provider: str) -> bool:
    """Remove a credential."""
    creds = load_credentials()

    if provider not in creds.get("providers", {}):
        print(f"{Colors.YELLOW}No credential found for: {provider}{Colors.NC}")
        return False

    del creds["providers"][provider]
    save_credentials(creds)

    print(f"{Colors.GREEN}✅ Removed credential for {provider}{Colors.NC}")
    return True


def get_credential(provider: str) -> Optional[str]:
    """Get a credential value."""
    creds = load_credentials()

    if provider not in creds.get("providers", {}):
        return None

    return decode_value(creds["providers"][provider]["value"])


def set_env_var(var_name: str, value: str) -> None:
    """Set environment variable in bashrc."""
    bashrc = Path.home() / ".bashrc"

    # Check if already set
    if bashrc.exists():
        content = bashrc.read_text()
        if f"export {var_name}=" in content:
            # Update existing
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith(f"export {var_name}="):
                    new_lines.append(f'export {var_name}="{value}"')
                else:
                    new_lines.append(line)
            bashrc.write_text('\n'.join(new_lines))
            return

    # Add new
    with open(bashrc, 'a') as f:
        f.write(f'\nexport {var_name}="{value}"\n')

    # Also set in current environment
    os.environ[var_name] = value


def export_to_env() -> None:
    """Export all credentials to environment variables."""
    creds = load_credentials()

    for provider, data in creds.get("providers", {}).items():
        env_var = data.get("env_var")
        if env_var:
            value = decode_value(data["value"])
            set_env_var(env_var, value)
            print(f"   {Colors.GREEN}✓{Colors.NC} {env_var}")


def show_credentials() -> None:
    """Display configured credentials."""
    creds = load_credentials()
    configured = creds.get("providers", {})

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   🔐 AI Workflow Credentials{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()

    for key, provider in PROVIDERS.items():
        icon = provider["icon"]
        name = provider["name"]

        if key in configured:
            added = configured[key].get("added", "")[:10]
            print(f"   {icon} {name:20} {Colors.GREEN}✓ Configured{Colors.NC} {Colors.DIM}({added}){Colors.NC}")
        else:
            print(f"   {icon} {name:20} {Colors.DIM}Not configured{Colors.NC}")

    print()
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"   {Colors.DIM}Add:    ./scripts/credentials-manager.py --add <provider>{Colors.NC}")
    print(f"   {Colors.DIM}Remove: ./scripts/credentials-manager.py --remove <provider>{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")


def interactive_setup() -> None:
    """Interactive credential setup wizard."""
    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   🔐 Credentials Setup Wizard{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()
    print(f"   {Colors.DIM}Set up your AI and service credentials.{Colors.NC}")
    print(f"   {Colors.DIM}Credentials are stored locally and persist across sessions.{Colors.NC}")
    print()

    # Priority order for setup
    priority_providers = ["github", "gemini", "claude"]

    for provider in priority_providers:
        info = PROVIDERS[provider]
        creds = load_credentials()

        if provider in creds.get("providers", {}):
            print(f"   {info['icon']} {info['name']}: {Colors.GREEN}Already configured{Colors.NC}")
            continue

        try:
            setup = input(f"   Set up {info['icon']} {info['name']}? (y/N): ").strip().lower()
            if setup == 'y':
                add_credential(provider)
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Skipping remaining setup.{Colors.NC}")
            break

    print()
    print(f"{Colors.GREEN}✅ Credential setup complete!{Colors.NC}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="AI Workflow Credentials Manager")
    parser.add_argument("--add", metavar="PROVIDER", help="Add/update a credential")
    parser.add_argument("--remove", metavar="PROVIDER", help="Remove a credential")
    parser.add_argument("--get", metavar="PROVIDER", help="Get a credential value")
    parser.add_argument("--list", action="store_true", help="List all credentials")
    parser.add_argument("--export", action="store_true", help="Export to environment variables")
    parser.add_argument("--setup", action="store_true", help="Interactive setup wizard")
    parser.add_argument("--providers", action="store_true", help="List available providers")
    args = parser.parse_args()

    if args.add:
        add_credential(args.add)
    elif args.remove:
        remove_credential(args.remove)
    elif args.get:
        value = get_credential(args.get)
        if value:
            print(value)
        else:
            sys.exit(1)
    elif args.export:
        print(f"\n{Colors.BOLD}Exporting credentials to environment...{Colors.NC}")
        export_to_env()
        print(f"\n{Colors.GREEN}✅ Done! Restart your shell to apply.{Colors.NC}")
    elif args.setup:
        interactive_setup()
    elif args.providers:
        print("\nAvailable providers:")
        for key, info in PROVIDERS.items():
            print(f"  {info['icon']} {key:12} - {info['description']}")
    else:
        show_credentials()


if __name__ == "__main__":
    main()
