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
deps=("@playwright/test" "firebase" "axios")
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

if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
else
    echo "   ⚠️  .env file not found (copy from .env.example)"
fi

echo ""
echo "📁 Project Structure:"

dirs=("tests/e2e" "tests/recorded" "tests/reports" "tests/fixtures" "docs/testing" "tools" "scripts" ".vscode")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir/"
    else
        echo "   ❌ $dir/ missing"
    fi
done

echo ""
echo "🧪 Test Files:"

if [ -f "playwright.config.js" ]; then
    echo "   ✅ Playwright config"
else
    echo "   ❌ Playwright config missing"
fi

# Count E2E test files
if [ -d "tests/e2e" ]; then
    test_count=$(find tests/e2e -name "*.spec.ts" -o -name "*.spec.js" | wc -l)
    echo "   ✅ E2E test files: $test_count"
else
    echo "   ❌ E2E test directory missing"
fi

if [ -f "tools/test-tracker.html" ]; then
    echo "   ✅ Test tracker tool"
else
    echo "   ❌ Test tracker missing"
fi

if [ -f "scripts/record-test.sh" ]; then
    echo "   ✅ Test recording script"
else
    echo "   ❌ Test recording script missing"
fi

if [ -f "start-testing.sh" ]; then
    echo "   ✅ Testing workspace launcher"
else
    echo "   ❌ Testing workspace launcher missing"
fi

echo ""
echo "📚 Documentation:"

docs=("TESTING_WORKSPACE.md" "START_TESTING.md" "TESTING.md" "COMPLETE_UI_TESTING_GUIDE.md" "docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md")
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
if ! npm list "@playwright/test" &> /dev/null; then ((issues++)); fi
if ! npm list "firebase" &> /dev/null; then ((issues++)); fi

if [ $issues -eq 0 ]; then
    echo "✅ All checks passed! Project is ready for testing."
    echo ""
    echo "Quick Start:"
    echo "  ./start-testing.sh             - Open testing workspace"
    echo "  npm run test:e2e:ui            - Run Playwright tests (UI)"
    echo "  npm run test:e2e               - Run Playwright tests (headless)"
    echo "  open tools/test-tracker.html   - Manual testing tracker"
    echo "  ./scripts/record-test.sh       - Record new test"
else
    echo "⚠️  Found $issues issue(s). Please resolve before testing."
    echo ""
    echo "To fix:"
    if ! npm list "@playwright/test" &> /dev/null || ! npm list "firebase" &> /dev/null; then
        echo "  npm install"
    fi
    if ! command -v node &> /dev/null; then
        echo "  Install Node.js from https://nodejs.org"
    fi
fi

echo "═══════════════════════════════════════════════════════════"
echo ""
