#!/bin/bash
# CVstomize - First-Time Setup Script
# Run this after cloning to get started quickly

set -e

# Clear NODE_OPTIONS to avoid VS Code debugger conflicts
unset NODE_OPTIONS

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  🚀 CVstomize Development Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Track what's available
HAS_DOCKER=false
HAS_DOCKER_COMPOSE=false
HAS_VSCODE=false
HAS_NODE=false
HAS_NPM=false

# Check for Docker
echo -e "${BLUE}🔍 Checking dependencies...${NC}"
echo ""

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',')
    echo -e "  ${GREEN}✓${NC} Docker installed (v$DOCKER_VERSION)"
    HAS_DOCKER=true

    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Docker daemon is running"
    else
        echo -e "  ${YELLOW}⚠${NC} Docker is installed but not running"
        echo -e "    ${CYAN}→ Start Docker Desktop or run: sudo systemctl start docker${NC}"
        HAS_DOCKER=false
    fi
else
    echo -e "  ${YELLOW}✗${NC} Docker not found"
fi

# Check for Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Docker Compose available"
    HAS_DOCKER_COMPOSE=true
else
    echo -e "  ${YELLOW}✗${NC} Docker Compose not found"
fi

# Check for VS Code
if command -v code &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} VS Code installed"
    HAS_VSCODE=true
else
    echo -e "  ${YELLOW}✗${NC} VS Code not found (optional)"
fi

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✓${NC} Node.js installed ($NODE_VERSION)"
    HAS_NODE=true

    # Check Node version (need 18+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "    ${YELLOW}⚠ Node.js 18+ recommended (you have $NODE_VERSION)${NC}"
    fi
else
    echo -e "  ${YELLOW}✗${NC} Node.js not found"
fi

# Check for npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✓${NC} npm installed (v$NPM_VERSION)"
    HAS_NPM=true
else
    echo -e "  ${YELLOW}✗${NC} npm not found"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Determine best setup path
if [ "$HAS_DOCKER" = true ] && [ "$HAS_VSCODE" = true ]; then
    echo -e "${GREEN}${BOLD}✨ Recommended: VS Code Dev Container${NC}"
    echo ""
    echo "  This gives you a fully configured development environment with:"
    echo "  • All dependencies pre-installed"
    echo "  • Database, Redis, and services ready"
    echo "  • AI CLI tools (Gemini/Claude) configured"
    echo "  • Playwright for E2E testing"
    echo ""
    echo -e "${BOLD}To get started:${NC}"
    echo ""
    echo "  1. Open this folder in VS Code:"
    echo -e "     ${CYAN}code .${NC}"
    echo ""
    echo -e "  2. When prompted, click \"Reopen in Container\""
    echo "     (or press Ctrl/Cmd+Shift+P → \"Dev Containers: Reopen in Container\")"
    echo ""
    echo "  3. Wait ~2 minutes for initial setup"
    echo ""
    echo "  4. Open http://localhost:3000 🎉"
    echo ""

elif [ "$HAS_DOCKER" = true ]; then
    echo -e "${GREEN}${BOLD}✨ Recommended: Docker Setup${NC}"
    echo ""
    echo "  Run everything with Docker Compose:"
    echo ""
    echo -e "  ${CYAN}./start-local.sh${NC}"
    echo ""
    echo "  This will:"
    echo "  • Build all containers"
    echo "  • Start PostgreSQL, Redis, Backend, Frontend"
    echo "  • Run database migrations"
    echo ""
    echo "  Then open http://localhost:3000 🎉"
    echo ""
    echo -e "  ${YELLOW}Tip:${NC} Install VS Code for the best experience with Dev Containers!"
    echo -e "       ${CYAN}https://code.visualstudio.com/download${NC}"
    echo ""

elif [ "$HAS_NODE" = true ] && [ "$HAS_NPM" = true ]; then
    echo -e "${YELLOW}${BOLD}⚡ Available: Manual Setup (No Docker)${NC}"
    echo ""
    echo "  You can run without Docker, but you'll need:"
    echo "  • PostgreSQL 15+ running locally"
    echo "  • Redis (optional, for caching)"
    echo ""
    echo -e "${BOLD}Backend:${NC}"
    echo -e "  ${CYAN}cd api${NC}"
    echo -e "  ${CYAN}npm install${NC}"
    echo -e "  ${CYAN}npx prisma generate${NC}"
    echo -e "  ${CYAN}npm run dev${NC}"
    echo ""
    echo -e "${BOLD}Frontend (new terminal):${NC}"
    echo -e "  ${CYAN}npm install${NC}"
    echo -e "  ${CYAN}npm start${NC}"
    echo ""
    echo -e "  ${GREEN}Tip:${NC} Docker is highly recommended for easier setup!"
    echo -e "       ${CYAN}https://www.docker.com/products/docker-desktop/${NC}"
    echo ""

else
    echo -e "${RED}${BOLD}❌ Missing Dependencies${NC}"
    echo ""
    echo "  To run CVstomize, you need one of these setups:"
    echo ""
    echo -e "  ${BOLD}Option 1: Docker (Recommended)${NC}"
    echo "  • Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    echo "  • Install VS Code: https://code.visualstudio.com/download"
    echo "  • Then run this script again"
    echo ""
    echo -e "  ${BOLD}Option 2: Manual (Advanced)${NC}"
    echo "  • Install Node.js 18+: https://nodejs.org/"
    echo "  • Install PostgreSQL 15+: https://www.postgresql.org/download/"
    echo "  • Then run this script again"
    echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  📚 Full documentation: ${CYAN}README.md${NC}"
echo -e "  🗺️  Project roadmap:   ${CYAN}ROADMAP.md${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Offer to create desktop shortcut if Docker + VS Code are available
if [ "$HAS_DOCKER" = true ] && [ "$HAS_VSCODE" = true ]; then
    echo ""
    read -p "Would you like to create a Desktop shortcut for this project? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        if [ -f "$SCRIPT_DIR/scripts/create-shortcut.sh" ]; then
            bash "$SCRIPT_DIR/scripts/create-shortcut.sh"
        elif [ -f "./scripts/create-shortcut.sh" ]; then
            bash "./scripts/create-shortcut.sh"
        else
            echo -e "${YELLOW}Shortcut script not found. Run manually:${NC}"
            echo -e "  ${CYAN}./scripts/create-shortcut.sh${NC}"
        fi
    fi
fi

