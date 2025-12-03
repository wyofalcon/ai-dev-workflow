#!/bin/bash
# Post-create script for CVstomize dev container
# This runs once when the container is first created

set -e

echo "🔧 Setting up CVstomize development environment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api && npm install && cd ..

# Make scripts executable
echo "🔐 Making scripts executable..."
chmod +x start-local.sh stop-local.sh
chmod +x scripts/*.sh 2>/dev/null || true

# Set up git configuration
echo "🔧 Configuring git..."
git config --global pull.rebase false
git config --global init.defaultBranch main

# Create local env file if it doesn't exist
if [ ! -f api/.env ]; then
    echo "📝 Creating API .env from example..."
    if [ -f api/.env.example ]; then
        cp api/.env.example api/.env
    fi
fi

# Install Playwright browsers (for E2E testing)
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium --with-deps 2>/dev/null || echo "⚠️ Playwright install skipped (run manually if needed)"

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 QUICK START"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Start the dev environment:  ./start-local.sh"
echo "  2. Open in browser:            http://localhost:3000"
echo "  3. Stop when done:             ./stop-local.sh"
echo ""
echo "  📚 See CONTRIBUTING.md for full documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
