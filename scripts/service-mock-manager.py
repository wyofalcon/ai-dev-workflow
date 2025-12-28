#!/usr/bin/env python3
"""
Service Mock Manager - Manages mock services for DevLocal and DevHybrid environments.
Provides templates and helpers for common service mocks.
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any, List

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
MOCKS_DIR = PROJECT_ROOT / "mocks"


# Service mock templates
MOCK_TEMPLATES = {
    "database": {
        "sqlite-memory": {
            "description": "In-memory SQLite database",
            "env_vars": {
                "DATABASE_URL": "file::memory:?cache=shared"
            },
            "setup_code": '''
// SQLite in-memory database setup
import Database from "better-sqlite3";
const db = new Database(":memory:");
export default db;
''',
            "prisma_datasource": '''
datasource db {
  provider = "sqlite"
  url      = "file::memory:?cache=shared"
}
'''
        },
        "json-file": {
            "description": "JSON file-based storage",
            "env_vars": {
                "DATABASE_URL": "file:./data/mock-db.json"
            },
            "setup_code": '''
// JSON file database mock
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
const adapter = new JSONFile("./data/mock-db.json");
const db = new Low(adapter, { users: [], posts: [] });
export default db;
'''
        }
    },

    "cache": {
        "local-memory": {
            "description": "In-memory cache (node-cache)",
            "env_vars": {
                "CACHE_URL": "memory://localhost",
                "REDIS_URL": ""  # Disable Redis
            },
            "setup_code": '''
// Memory cache mock
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 600 });
export const get = (key) => cache.get(key);
export const set = (key, value, ttl) => cache.set(key, value, ttl);
export const del = (key) => cache.del(key);
export default { get, set, del };
'''
        }
    },

    "storage": {
        "local-fs": {
            "description": "Local filesystem storage",
            "env_vars": {
                "STORAGE_PROVIDER": "local",
                "STORAGE_PATH": "./data/uploads",
                "S3_BUCKET": "",
                "S3_ENDPOINT": ""
            },
            "setup_code": '''
// Local filesystem storage mock
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = process.env.STORAGE_PATH || "./data/uploads";

export async function upload(file, filename) {
  await fs.mkdir(STORAGE_PATH, { recursive: true });
  const filepath = path.join(STORAGE_PATH, filename);
  await fs.writeFile(filepath, file);
  return { url: `/uploads/${filename}`, path: filepath };
}

export async function download(filename) {
  return fs.readFile(path.join(STORAGE_PATH, filename));
}

export async function remove(filename) {
  await fs.unlink(path.join(STORAGE_PATH, filename));
}
'''
        }
    },

    "email": {
        "mailhog": {
            "description": "MailHog email testing (Docker)",
            "env_vars": {
                "SMTP_HOST": "localhost",
                "SMTP_PORT": "1025",
                "SMTP_SECURE": "false",
                "SENDGRID_API_KEY": "",
                "EMAIL_PROVIDER": "smtp"
            },
            "docker_compose": '''
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
'''
        },
        "console-log": {
            "description": "Log emails to console (no delivery)",
            "env_vars": {
                "EMAIL_PROVIDER": "console"
            },
            "setup_code": '''
// Console email mock - logs instead of sending
export async function sendEmail({ to, subject, body, html }) {
  console.log("📧 Mock Email:");
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body: ${body?.substring(0, 100)}...`);
  return { success: true, messageId: `mock-${Date.now()}` };
}
'''
        }
    },

    "payment": {
        "stripe-mock": {
            "description": "Stripe mock server (Docker)",
            "env_vars": {
                "STRIPE_SECRET_KEY": "sk_test_mock_key",
                "STRIPE_PUBLISHABLE_KEY": "pk_test_mock_key",
                "STRIPE_WEBHOOK_SECRET": "whsec_mock_secret",
                "STRIPE_API_BASE": "http://localhost:12111"
            },
            "docker_compose": '''
  stripe-mock:
    image: stripe/stripe-mock:latest
    ports:
      - "12111:12111"
      - "12112:12112"
'''
        },
        "mock-checkout": {
            "description": "Simple mock checkout (always succeeds)",
            "env_vars": {
                "PAYMENT_PROVIDER": "mock",
                "STRIPE_SECRET_KEY": ""
            },
            "setup_code": '''
// Mock payment processor - always succeeds
export async function createCheckout(items, customer) {
  return {
    id: `mock_checkout_${Date.now()}`,
    url: `/mock-checkout?session=${Date.now()}`,
    status: "pending"
  };
}

export async function confirmPayment(sessionId) {
  return {
    id: sessionId,
    status: "paid",
    amount: 1000,
    currency: "usd"
  };
}

export async function refund(paymentId, amount) {
  return { id: `refund_${Date.now()}`, status: "succeeded" };
}
'''
        }
    },

    "auth": {
        "local-jwt": {
            "description": "Local JWT authentication",
            "env_vars": {
                "AUTH_PROVIDER": "local",
                "JWT_SECRET": "dev-secret-key-change-in-production",
                "AUTH0_DOMAIN": "",
                "CLERK_SECRET_KEY": ""
            },
            "setup_code": '''
// Local JWT authentication mock
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";
const users = new Map();

export function signUp(email, password) {
  const id = `user_${Date.now()}`;
  users.set(email, { id, email, password });
  return { id, email, token: createToken({ id, email }) };
}

export function signIn(email, password) {
  const user = users.get(email);
  if (!user || user.password !== password) throw new Error("Invalid credentials");
  return { ...user, token: createToken({ id: user.id, email }) };
}

export function createToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
'''
        }
    },

    "ai": {
        "mock-responses": {
            "description": "Fixed AI responses (no API calls)",
            "env_vars": {
                "AI_PROVIDER": "mock",
                "OPENAI_API_KEY": "",
                "ANTHROPIC_API_KEY": ""
            },
            "setup_code": '''
// Mock AI responses - no actual API calls
const MOCK_RESPONSES = {
  default: "This is a mock AI response. In DevLocal mode, AI calls are simulated.",
  greeting: "Hello! I'm a mock AI assistant. Configure DevLive for real responses.",
  code: "```javascript\\nfunction example() { return 'mock'; }\\n```"
};

export async function chat(messages, options = {}) {
  await new Promise(r => setTimeout(r, 500)); // Simulate latency
  const lastMessage = messages[messages.length - 1]?.content || "";

  // Simple pattern matching for varied responses
  if (lastMessage.toLowerCase().includes("hello")) {
    return { content: MOCK_RESPONSES.greeting, model: "mock-1" };
  }
  if (lastMessage.toLowerCase().includes("code")) {
    return { content: MOCK_RESPONSES.code, model: "mock-1" };
  }
  return { content: MOCK_RESPONSES.default, model: "mock-1" };
}

export async function complete(prompt) {
  await new Promise(r => setTimeout(r, 300));
  return { text: `Mock completion for: ${prompt.substring(0, 50)}...` };
}
'''
        },
        "delayed-echo": {
            "description": "Echo input with delay (testing)",
            "env_vars": {
                "AI_PROVIDER": "echo"
            },
            "setup_code": '''
// Echo AI mock - returns input with delay
export async function chat(messages) {
  await new Promise(r => setTimeout(r, 1000));
  const lastMessage = messages[messages.length - 1]?.content || "No message";
  return { content: `Echo: ${lastMessage}`, model: "echo-1" };
}
'''
        }
    },

    "analytics": {
        "console-log": {
            "description": "Log analytics to console",
            "env_vars": {
                "ANALYTICS_PROVIDER": "console",
                "POSTHOG_API_KEY": "",
                "MIXPANEL_TOKEN": ""
            },
            "setup_code": '''
// Console analytics mock
export function track(event, properties = {}) {
  console.log("📊 Analytics:", event, properties);
}

export function identify(userId, traits = {}) {
  console.log("👤 Identify:", userId, traits);
}

export function page(name, properties = {}) {
  console.log("📄 Page View:", name, properties);
}
'''
        },
        "noop": {
            "description": "No-op analytics (silent)",
            "env_vars": {
                "ANALYTICS_PROVIDER": "noop"
            },
            "setup_code": '''
// No-op analytics - does nothing
export const track = () => {};
export const identify = () => {};
export const page = () => {};
'''
        }
    },

    "queue": {
        "bull-memory": {
            "description": "In-memory job queue (Bull without Redis)",
            "env_vars": {
                "QUEUE_PROVIDER": "memory",
                "REDIS_URL": ""
            },
            "setup_code": '''
// In-memory queue mock
const queues = new Map();
const jobs = [];

export function createQueue(name) {
  const queue = {
    name,
    add: async (data, opts) => {
      const job = { id: jobs.length, data, opts, status: "waiting" };
      jobs.push(job);
      // Process immediately in memory mode
      setTimeout(() => processJob(name, job), 0);
      return job;
    },
    process: (handler) => { queues.set(name, handler); }
  };
  return queue;
}

async function processJob(queueName, job) {
  const handler = queues.get(queueName);
  if (handler) {
    job.status = "active";
    try {
      await handler(job);
      job.status = "completed";
    } catch (e) {
      job.status = "failed";
      job.error = e.message;
    }
  }
}
'''
        }
    }
}


def get_active_environment() -> Optional[str]:
    """Get the currently active environment."""
    active_env_file = CONTEXT_DIR / "ACTIVE_DEVENV"
    if active_env_file.exists():
        return active_env_file.read_text().strip()
    return "DevLocal"


def get_active_services() -> Dict[str, str]:
    """Get the active service configuration."""
    active_config_file = CONTEXT_DIR / "active-devenv.json"
    if active_config_file.exists():
        with open(active_config_file) as f:
            config = json.load(f)
        services = {}
        for name, info in config.get("services", {}).items():
            if isinstance(info, dict):
                services[name] = info.get("type", "mock")
        return services
    return {}


def generate_env_file() -> str:
    """Generate .env file content based on active mock configuration."""
    env = get_active_environment()
    services = get_active_services()

    lines = [
        "# =============================================================================",
        "# AUTO-GENERATED BY SERVICE MOCK MANAGER",
        f"# Environment: {env}",
        "# =============================================================================",
        "",
        f"DEVENV_MODE={env}",
        ""
    ]

    for service_name, service_type in services.items():
        if service_type == "mock" and service_name in MOCK_TEMPLATES:
            # Get first available mock provider
            providers = list(MOCK_TEMPLATES[service_name].keys())
            if providers:
                provider = providers[0]
                mock_config = MOCK_TEMPLATES[service_name][provider]

                lines.append(f"# {service_name.upper()} ({provider})")
                for var, value in mock_config.get("env_vars", {}).items():
                    lines.append(f"{var}={value}")
                lines.append("")

    return "\n".join(lines)


def generate_docker_compose_mocks() -> str:
    """Generate docker-compose services for mock infrastructure."""
    services = get_active_services()

    compose_services = []

    for service_name, service_type in services.items():
        if service_type == "mock" and service_name in MOCK_TEMPLATES:
            for provider_name, provider_config in MOCK_TEMPLATES[service_name].items():
                if "docker_compose" in provider_config:
                    compose_services.append(provider_config["docker_compose"])
                    break

    if not compose_services:
        return ""

    return f"""# Auto-generated mock services
version: '3.8'
services:
{''.join(compose_services)}
"""


def generate_mock_file(service: str, provider: str) -> Optional[str]:
    """Generate a mock service file."""
    if service not in MOCK_TEMPLATES:
        return None
    if provider not in MOCK_TEMPLATES[service]:
        return None

    return MOCK_TEMPLATES[service][provider].get("setup_code", "")


def show_mock_status() -> None:
    """Display mock service status."""
    env = get_active_environment()
    services = get_active_services()

    print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print(f"{Colors.BOLD}   🎭 Service Mock Status{Colors.NC}")
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")
    print()
    print(f"   Environment: {Colors.GREEN}{env}{Colors.NC}")
    print()

    for service, mode in services.items():
        if mode == "mock":
            color = Colors.GREEN
            icon = "🏠"
            status = "MOCK"
        else:
            color = Colors.YELLOW
            icon = "🌐"
            status = "LIVE"

        print(f"   {icon} {service:12} {color}{status}{Colors.NC}")

    print()
    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.NC}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Service Mock Manager")
    parser.add_argument("--status", action="store_true", help="Show mock status")
    parser.add_argument("--generate-env", action="store_true", help="Generate .env file")
    parser.add_argument("--generate-compose", action="store_true", help="Generate docker-compose mocks")
    parser.add_argument("--generate-mock", nargs=2, metavar=("SERVICE", "PROVIDER"),
                       help="Generate mock file for service")
    parser.add_argument("--list-providers", metavar="SERVICE", help="List available mock providers")
    args = parser.parse_args()

    if args.status:
        show_mock_status()
    elif args.generate_env:
        print(generate_env_file())
    elif args.generate_compose:
        compose = generate_docker_compose_mocks()
        if compose:
            print(compose)
        else:
            print("# No Docker-based mocks configured")
    elif args.generate_mock:
        code = generate_mock_file(args.generate_mock[0], args.generate_mock[1])
        if code:
            print(code)
        else:
            print(f"# No mock template for {args.generate_mock[0]}/{args.generate_mock[1]}")
    elif args.list_providers:
        service = args.list_providers
        if service in MOCK_TEMPLATES:
            print(f"\nAvailable mock providers for {service}:")
            for name, config in MOCK_TEMPLATES[service].items():
                print(f"  • {name}: {config.get('description', '')}")
        else:
            print(f"Unknown service: {service}")
            print(f"Available: {', '.join(MOCK_TEMPLATES.keys())}")
    else:
        show_mock_status()


if __name__ == "__main__":
    main()
