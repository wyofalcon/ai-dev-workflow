#!/bin/bash
# CVstomize E2E Test Runner
# Usage: ./run-tests.sh [ui|headed|headless|report]

set -e

MODE=${1:-ui}

echo "🧪 CVstomize Automated Testing"
echo "================================"
echo ""

case $MODE in
  ui)
    echo "🎯 Running in UI mode (interactive)"
    echo "Best for monitoring and debugging tests"
    echo ""
    npm run test:e2e:ui
    ;;
    
  headed)
    echo "👀 Running in headed mode (visible browser)"
    echo "You'll see the browser window"
    echo ""
    npm run test:e2e:headed
    ;;
    
  headless)
    echo "⚡ Running in headless mode (fast)"
    echo "No browser window, fastest execution"
    echo ""
    npm run test:e2e
    ;;
    
  report)
    echo "📊 Opening test report..."
    npm run test:report
    ;;
    
  *)
    echo "❌ Unknown mode: $MODE"
    echo ""
    echo "Usage: ./run-tests.sh [ui|headed|headless|report]"
    echo ""
    echo "Modes:"
    echo "  ui        - Interactive UI (recommended)"
    echo "  headed    - Visible browser"
    echo "  headless  - Fast, no UI"
    echo "  report    - Open last report"
    exit 1
    ;;
esac
