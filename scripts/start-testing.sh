#!/bin/bash

# CVstomize Testing Workspace Launcher
# Quick access to all testing tools

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "BANNER"
   _____ _    __    _                  _         
  / ____| |  / /   | |                (_)        
 | |    | | / / ___| |_ ___  _ __ ___  _ _______ 
 | |    | |/ / / __| __/ _ \| '_ \` _ \| |_  / _ \
 | |____| |\ \ \__ \ || (_) | | | | | | |/ /  __/
  \_____|_| \_\___|_| \___/|_| |_| |_|_/___\___|
                                                  
      🧪 Testing Workspace Launcher 🧪
BANNER
echo -e "${NC}"

echo -e "${CYAN}Choose your testing method:${NC}"
echo ""
echo -e "${GREEN}1)${NC} 📝 Open Test Tracker (Manual Testing)"
echo -e "${GREEN}2)${NC} 🎬 Record Test with Playwright"
echo -e "${GREEN}3)${NC} 🎬 Record Test (Local Development)"
echo -e "${GREEN}4)${NC} 🧪 Run E2E Tests (UI Mode)"
echo -e "${GREEN}5)${NC} 🧪 Run E2E Tests (Headless)"
echo -e "${GREEN}6)${NC} 📊 View Test Report"
echo -e "${GREEN}7)${NC} 📚 Open Testing Documentation"
echo -e "${GREEN}8)${NC} 🔧 Install/Update Playwright Browsers"
echo -e "${GREEN}9)${NC} 🚪 Exit"
echo ""
echo -n -e "${YELLOW}Enter choice [1-9]: ${NC}"

read choice

case $choice in
    1)
        echo -e "${GREEN}Opening Test Tracker...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open tools/test-tracker.html
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open tools/test-tracker.html 2>/dev/null || sensible-browser tools/test-tracker.html 2>/dev/null || echo "Please open tools/test-tracker.html in your browser"
        else
            echo "Please open tools/test-tracker.html in your browser"
        fi
        ;;
    2)
        echo -e "${GREEN}Starting Test Recorder (Production)...${NC}"
        ./scripts/record-test.sh
        ;;
    3)
        echo -e "${GREEN}Starting Test Recorder (Local)...${NC}"
        ./scripts/record-test.sh --local
        ;;
    4)
        echo -e "${GREEN}Running E2E Tests in UI Mode...${NC}"
        npm run test:e2e:ui
        ;;
    5)
        echo -e "${GREEN}Running E2E Tests (Headless)...${NC}"
        npm run test:e2e
        ;;
    6)
        echo -e "${GREEN}Opening Test Report...${NC}"
        npm run test:report
        ;;
    7)
        echo -e "${GREEN}Opening Testing Documentation...${NC}"
        echo ""
        echo "📚 Available Documentation:"
        echo "  - TESTING_WORKSPACE.md - Complete testing hub"
        echo "  - START_TESTING.md - Quick start guide"
        echo "  - TESTING_QUICKSTART.md - 5-minute tutorial"
        echo "  - COMPLETE_UI_TESTING_GUIDE.md - Manual testing checklist"
        echo "  - docs/testing/PLAYWRIGHT_CODEGEN_GUIDE.md - Recording guide"
        echo ""
        if command -v code &> /dev/null; then
            echo "Opening in VS Code..."
            code TESTING_WORKSPACE.md
        else
            echo "Please open TESTING_WORKSPACE.md in your editor"
        fi
        ;;
    8)
        echo -e "${GREEN}Installing/Updating Playwright Browsers...${NC}"
        npx playwright install
        echo -e "${GREEN}✅ Done!${NC}"
        ;;
    9)
        echo -e "${GREEN}Happy testing! 🧪✨${NC}"
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Please run again and choose 1-9.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Complete!${NC}"
echo ""
echo -e "${CYAN}Run ./start-testing.sh again to access other tools${NC}"
