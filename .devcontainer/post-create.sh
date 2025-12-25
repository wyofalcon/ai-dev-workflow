#!/bin/bash
# Post-create script for CVstomize dev container
# This runs once when the container is first created

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 Setting up CVstomize Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install system dependencies
echo "🔧 [0/8] Installing system dependencies..."
sudo apt-get update -qq && sudo apt-get install -y -qq whiptail > /dev/null
echo "   ✓ whiptail installed"

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

# Install Gemini CLI
echo "🤖 [6/8] Installing Gemini CLI..."
if ! command -v gemini &> /dev/null; then
    npm install -g @anthropic-ai/claude-code @google/gemini-cli 2>/dev/null || npm install -g @google/gemini-cli 2>/dev/null || echo "   ⚠️  Gemini CLI install failed (install manually: npm i -g @google/gemini-cli)"
    echo "   ✓ Gemini CLI installed"
else
    echo "   ✓ Gemini CLI already installed"
fi

# Set up git configuration
echo "🔧 [7/8] Configuring git..."
git config --global pull.rebase false
git config --global init.defaultBranch main
git config --global core.autocrlf input

# Create local env files if they don't exist
echo "📝 [8/8] Setting up environment files..."
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

# Set up session selector for workflow modes
echo "🎯 Setting up session selector..."
mkdir -p /home/node/bin
cat > /home/node/bin/gemini-session-select << 'SELECTOR'
#!/bin/bash
# Session Selector - Choose workflow mode

if ! command -v whiptail &> /dev/null; then
    echo "⚠️  whiptail not installed. Run: sudo apt-get install whiptail"
    return 2>/dev/null || exit
fi

CURRENT_DIR=$(pwd)

CHOICE=$(whiptail --title "🚀 Gemini CLI: Session Start" \
--menu "Working in: $CURRENT_DIR\nSelect workflow:" 16 78 4 \
"1" "Builder + 2 Auditors  (🛡️ Strict: Blocking Audits)" \
"2" "Rapid Prototyping     (⚡ Fast: No Blocking)" \
"3" "Maintenance           (🛠️  Manual: No AI enforcement)" \
3>&1 1>&2 2>&3)

EXIT_STATUS=$?

if [ $EXIT_STATUS -eq 0 ]; then
    case $CHOICE in
        1)
            export SKIP_AUDITOR=false
            echo "🛡️  [Mode] Builder + 2 Auditors (Active)"
            ;;
        2)
            export SKIP_AUDITOR=true
            echo "⚡ [Mode] Rapid Prototyping (Auditor Skipped)"
            ;;
        3)
            export SKIP_AUDITOR=true
            echo "🛠️  [Mode] Maintenance"
            ;;
    esac
else
    export SKIP_AUDITOR=false
    echo "🛡️  [Mode] Builder + 2 Auditors (Defaulted)"
fi
SELECTOR
chmod +x /home/node/bin/gemini-session-select

# Add ~/bin to PATH and gss alias
if ! grep -q 'export PATH="$HOME/bin:$PATH"' ~/.bashrc 2>/dev/null; then
    echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
fi
if ! grep -q 'alias gss=' ~/.bashrc 2>/dev/null; then
    echo 'alias gss="source ~/bin/gemini-session-select"' >> ~/.bashrc
fi
echo "   ✓ Session selector installed (run 'gss' to use)"

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
echo "     gss                        - Launch session mode selector"
echo "     gemini / claude            - Start your AI assistant"
echo "     docker compose up -d       - Start all services"
echo "     docker compose down        - Stop all services"
echo "     npm run test:e2e           - Run E2E tests"
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

# Run onboarding for first-time setup (if AI CLI not configured)
if [ ! -f ~/.gemini/settings.json ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo ""
    echo "🎉 First time here? Let's set up your dev workflow!"
    echo ""
    sleep 1
    if [ -t 0 ]; then
        # Interactive terminal available
        bash "$(dirname "$0")/onboarding.sh"
    else
        echo "   Run 'bash .devcontainer/onboarding.sh' to set up your AI tools"
    fi
fi
