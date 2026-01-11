#!/bin/bash
#
# CVstomize Project Launcher
# ===========================
# Opens the project in VS Code Dev Container and starts all services.
#
# Usage:
#   ./launch.sh              # From project directory
#   ~/cvstomize/launch.sh    # From anywhere
#
# What it does:
#   1. Checks Docker is running
#   2. Opens VS Code in Dev Container mode
#   3. Dev Container auto-starts all services (docker compose up)
#   4. Runs database migrations
#   5. Opens http://localhost:3000
#

set -e

# Get the directory where this script lives (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="CVstomize"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Launching $PROJECT_NAME Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Starting Docker..."

    # Try to start Docker based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - open Docker Desktop
        open -a Docker
        echo "   Waiting for Docker to start..."
        while ! docker info > /dev/null 2>&1; do
            sleep 2
        done
        echo "   ✓ Docker is ready"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - try systemctl
        if command -v systemctl &> /dev/null; then
            sudo systemctl start docker 2>/dev/null || {
                echo "❌ Please start Docker manually and re-run this script"
                exit 1
            }
        else
            echo "❌ Please start Docker manually and re-run this script"
            exit 1
        fi
    else
        echo "❌ Please start Docker manually and re-run this script"
        exit 1
    fi
fi

echo "✓ Docker is running"

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code CLI not found. Please install VS Code and add 'code' to PATH"
    echo "   On macOS: Cmd+Shift+P → 'Shell Command: Install code command in PATH'"
    echo "   On Linux: Usually installed with VS Code package"
    exit 1
fi

echo "✓ VS Code CLI available"

# Check if Dev Containers extension is installed
if ! code --list-extensions 2>/dev/null | grep -q "ms-vscode-remote.remote-containers"; then
    echo "📦 Installing Dev Containers extension..."
    code --install-extension ms-vscode-remote.remote-containers
fi

echo "✓ Dev Containers extension ready"
echo ""

# Open VS Code in Dev Container
echo "🔧 Opening $PROJECT_NAME in Dev Container..."
echo "   (VS Code will build the container on first run - this takes ~2 minutes)"
echo ""

# Use devcontainer CLI if available, otherwise fall back to code command
if command -v devcontainer &> /dev/null; then
    # devcontainer CLI is available (faster, more reliable)
    cd "$SCRIPT_DIR"
    devcontainer open .
else
    # Fall back to VS Code command
    # The --folder-uri with devcontainer scheme opens directly in container
    code --folder-uri "vscode-remote://dev-container+$(printf '%s' "$SCRIPT_DIR" | xxd -p -c 256)/workspaces/$(basename "$SCRIPT_DIR")" 2>/dev/null || {
        # Fallback: just open the folder, VS Code will prompt to reopen in container
        code "$SCRIPT_DIR"
        echo ""
        echo "💡 Click 'Reopen in Container' when VS Code prompts you"
    }
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ $PROJECT_NAME Launched!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Once the container starts, open:"
echo "  🌐 Frontend:  http://localhost:3000"
echo "  🔌 Backend:   http://localhost:3001"
echo ""
echo "  First time? Container build takes ~2 minutes."
echo "  Subsequent launches are instant."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
