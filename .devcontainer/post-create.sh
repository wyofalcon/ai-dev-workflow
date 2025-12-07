#!/bin/bash
# Post-create script for CVstomize dev container
# This runs once when the container is first created

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 Setting up CVstomize Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install root dependencies
echo "📦 [1/6] Installing frontend dependencies..."
npm install --legacy-peer-deps

# Install API dependencies
echo "📦 [2/6] Installing backend dependencies..."
cd api && npm install && cd ..

# Generate Prisma client
echo "🗃️  [3/6] Generating Prisma client..."
cd api && npx prisma generate && cd ..

# Make scripts executable
echo "🔐 [4/6] Making scripts executable..."
chmod +x start-local.sh stop-local.sh scripts/*.sh 2>/dev/null || true

# Set up git configuration
echo "🔧 [5/6] Configuring git..."
git config --global pull.rebase false
git config --global init.defaultBranch main
git config --global core.autocrlf input

# Create local env files if they don't exist
echo "📝 [6/6] Setting up environment files..."
if [ ! -f api/.env ]; then
    if [ -f api/.env.example ]; then
        cp api/.env.example api/.env
        echo "   ✓ Created api/.env from example"
    fi
fi

# Install Playwright browsers (optional - can be slow)
echo ""
echo "🎭 Installing Playwright browsers (this may take a minute)..."
npx playwright install chromium --with-deps 2>/dev/null || echo "⚠️  Playwright install skipped (run 'npx playwright install' manually if needed)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Development Environment Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  The dev environment will start automatically."
echo "  Once ready, open: http://localhost:3000"
echo ""
echo "  📚 Key Commands:"
echo "     ./start-local.sh   - Start all services"
echo "     ./stop-local.sh    - Stop all services"
echo "     npm run test:e2e   - Run E2E tests"
echo ""
echo "  📖 Documentation: README.md, ROADMAP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
