#!/bin/bash
# Quick setup script for autonomous testing

echo "🚀 Setting up Autonomous Testing System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."

if ! npm list puppeteer &> /dev/null; then
    echo "Installing puppeteer..."
    npm install puppeteer
fi

if ! npm list @google/generative-ai &> /dev/null; then
    echo "Installing @google/generative-ai..."
    npm install @google/generative-ai
fi

echo "✅ Dependencies installed"
echo ""

# Check for Gemini API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY environment variable not set"
    echo ""
    echo "To set up your API key:"
    echo "1. Visit: https://makersuite.google.com/app/apikey"
    echo "2. Create or sign in with your Google account"
    echo "3. Click 'Create API Key'"
    echo "4. Copy your key"
    echo ""
    echo "Then set the environment variable:"
    echo "  export GEMINI_API_KEY='your-api-key-here'"
    echo ""
    echo "Or add to your ~/.bashrc or ~/.zshrc for persistence:"
    echo "  echo 'export GEMINI_API_KEY=\"your-key\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    echo ""
    read -p "Do you want to set it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Gemini API key: " api_key
        export GEMINI_API_KEY="$api_key"
        echo "✅ API key set for this session"
        echo ""
        echo "To make it permanent, add this to ~/.bashrc:"
        echo "  export GEMINI_API_KEY=\"$api_key\""
    fi
else
    echo "✅ GEMINI_API_KEY is set"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Setup Complete! 🎉"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Quick Commands:"
echo ""
echo "  Run all tests:"
echo "    node tests/autonomous-test-runner.cjs"
echo ""
echo "  Run with visible browser:"
echo "    HEADLESS=false node tests/autonomous-test-runner.cjs"
echo ""
echo "  View progress:"
echo "    node tests/view-test-progress.cjs"
echo ""
echo "  View summary only:"
echo "    node tests/view-test-progress.cjs --summary"
echo ""
echo "For full documentation:"
echo "  docs/testing/AUTONOMOUS_TESTING_GUIDE.md"
echo ""
echo "═══════════════════════════════════════════════════════════"
