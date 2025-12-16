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
echo "🔐 [4/7] Making scripts executable..."
chmod +x start-local.sh stop-local.sh scripts/*.sh 2>/dev/null || true

# Install Google Cloud SDK
echo "☁️  [5/7] Installing Google Cloud SDK..."
if ! command -v gcloud &> /dev/null; then
    curl -sSL https://sdk.cloud.google.com > /tmp/install-gcloud.sh
    bash /tmp/install-gcloud.sh --disable-prompts --install-dir=/home/node 2>/dev/null || true
    echo 'source /home/node/google-cloud-sdk/path.bash.inc' >> ~/.bashrc
    echo 'source /home/node/google-cloud-sdk/completion.bash.inc' >> ~/.bashrc
    rm /tmp/install-gcloud.sh
    echo "   ✓ Google Cloud SDK installed"
else
    echo "   ✓ Google Cloud SDK already installed"
fi

# Set up git configuration
echo "🔧 [6/7] Configuring git..."
git config --global pull.rebase false
git config --global init.defaultBranch main
git config --global core.autocrlf input

# Create local env files if they don't exist
echo "📝 [7/7] Setting up environment files..."
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
echo "  💰 COST-FREE LOCAL DEVELOPMENT (Default)"
echo "  ─────────────────────────────────────────"
echo "  • Mock AI enabled (no GCP/Vertex AI costs)"
echo "  • Local PostgreSQL & Redis (Docker containers)"
echo "  • Firebase Auth uses real service (free tier)"
echo ""
echo "  The dev environment will start automatically."
echo "  Once ready, open: http://localhost:3000"
echo ""
echo "  📚 Key Commands:"
echo "     docker compose up -d      - Start all services"
echo "     docker compose down       - Stop all services"
echo "     npm run test:e2e          - Run E2E tests"
echo ""
echo "  🔄 Switch to Real AI (costs money):"
echo "     Edit api/.env → USE_MOCK_AI=false"
echo "     Run: gcloud auth application-default login"
echo ""
echo "  ☁️  GCP Deployment Commands:"
echo "     gcloud auth login                    - Authenticate with GCP"
echo "     gcloud config set project PROJECT_ID - Set your project"
echo "     cd api && ./deploy-to-cloud-run.sh  - Deploy backend"
echo ""
echo "  📖 Documentation: README.md, ROADMAP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
