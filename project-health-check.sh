#!/bin/bash
# Quick Project Health Check for CVStomize

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           CVStomize Project Health Check                 ║"
echo "╔═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm: Not installed"
fi

echo ""
echo "📦 Critical Dependencies:"

# Check for key dependencies
deps=("puppeteer" "@google/generative-ai" "@playwright/test")
for dep in "${deps[@]}"; do
    if npm list "$dep" &> /dev/null; then
        version=$(npm list "$dep" 2>/dev/null | grep "$dep" | head -1 | awk -F@ '{print $NF}')
        echo "   ✅ $dep@$version"
    else
        echo "   ❌ $dep: Not installed"
    fi
done

echo ""
echo "🔑 Environment Variables:"

if [ -n "$GEMINI_API_KEY" ]; then
    echo "   ✅ GEMINI_API_KEY is set"
else
    echo "   ⚠️  GEMINI_API_KEY not set (required for autonomous testing)"
fi

if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
else
    echo "   ⚠️  .env file not found (copy from .env.example)"
fi

echo ""
echo "📁 Project Structure:"

dirs=("tests/e2e" "tests/reports" "docs/testing" ".vscode")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir/"
    else
        echo "   ❌ $dir/ missing"
    fi
done

echo ""
echo "🧪 Test Files:"

if [ -f "tests/autonomous-test-runner.cjs" ]; then
    echo "   ✅ Autonomous test runner"
else
    echo "   ❌ Autonomous test runner missing"
fi

if [ -f "tests/test-progress.json" ]; then
    echo "   ✅ Test progress tracker"
else
    echo "   ❌ Test progress tracker missing"
fi

if [ -f "playwright.config.js" ]; then
    echo "   ✅ Playwright config"
else
    echo "   ❌ Playwright config missing"
fi

echo ""
echo "📚 Documentation:"

docs=("TESTING.md" "docs/testing/AUTONOMOUS_TESTING_GUIDE.md" ".ai-instructions.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "   ✅ $doc"
    else
        echo "   ❌ $doc missing"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"

# Count issues
issues=0
if ! command -v node &> /dev/null; then ((issues++)); fi
if ! npm list "puppeteer" &> /dev/null; then ((issues++)); fi
if ! npm list "@google/generative-ai" &> /dev/null; then ((issues++)); fi
if [ -z "$GEMINI_API_KEY" ]; then ((issues++)); fi

if [ $issues -eq 0 ]; then
    echo "✅ All checks passed! Project is ready for testing."
    echo ""
    echo "Quick Start:"
    echo "  npm run test:autonomous        - Run AI-powered tests"
    echo "  npm run test:e2e:ui            - Run Playwright tests"
    echo "  npm run test:progress          - View test progress"
else
    echo "⚠️  Found $issues issue(s). Please resolve before testing."
    echo ""
    echo "To fix:"
    if [ -z "$GEMINI_API_KEY" ]; then
        echo "  export GEMINI_API_KEY='your-key'"
    fi
    if ! npm list "puppeteer" &> /dev/null || ! npm list "@google/generative-ai" &> /dev/null; then
        echo "  npm install"
    fi
fi

echo "═══════════════════════════════════════════════════════════"
echo ""
