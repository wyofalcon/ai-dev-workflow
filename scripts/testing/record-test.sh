#!/bin/bash

# CVstomize Test Recording Script
# Records user interactions and generates Playwright test code

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 CVstomize Test Recorder${NC}"
echo ""

# Default values
TARGET="javascript"
OUTPUT_DIR="tests/recorded"
URL="https://cvstomize-frontend-351889420459.us-central1.run.app"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            URL="http://localhost:3000"
            shift
            ;;
        --output|-o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --name|-n)
            TEST_NAME="$2"
            shift 2
            ;;
        --typescript)
            TARGET="typescript"
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/record-test.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --local              Record against localhost:3000 instead of production"
            echo "  --output, -o FILE    Save to specific file"
            echo "  --name, -n NAME      Set test name (auto-generates filename)"
            echo "  --typescript         Generate TypeScript instead of JavaScript"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/record-test.sh"
            echo "  ./scripts/record-test.sh --local"
            echo "  ./scripts/record-test.sh --name login-flow"
            echo "  ./scripts/record-test.sh --output tests/my-test.spec.js"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate filename if name provided but no output file
if [ -n "$TEST_NAME" ] && [ -z "$OUTPUT_FILE" ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    if [ "$TARGET" = "typescript" ]; then
        OUTPUT_FILE="$OUTPUT_DIR/${TEST_NAME}-${TIMESTAMP}.spec.ts"
    else
        OUTPUT_FILE="$OUTPUT_DIR/${TEST_NAME}-${TIMESTAMP}.spec.js"
    fi
fi

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "  Target URL: $URL"
echo "  Language: $TARGET"
if [ -n "$OUTPUT_FILE" ]; then
    echo "  Output: $OUTPUT_FILE"
else
    echo "  Output: <will prompt for save>"
fi
echo ""

echo -e "${GREEN}🚀 Starting Playwright Codegen...${NC}"
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "  1. Browser will open with Inspector panel"
echo "  2. Interact with the application normally"
echo "  3. Inspector shows generated code in real-time"
echo "  4. Click 'Record' button to pause/resume recording"
echo "  5. Copy code or save when done"
echo "  6. Close browser to exit"
echo ""
echo -e "${BLUE}Press Enter to start recording...${NC}"
read

# Build codegen command
CMD="npx playwright codegen"
CMD="$CMD --target=$TARGET"

if [ -n "$OUTPUT_FILE" ]; then
    CMD="$CMD -o $OUTPUT_FILE"
fi

CMD="$CMD $URL"

# Run codegen
echo -e "${GREEN}Recording...${NC}"
echo ""
eval $CMD

echo ""
if [ -n "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}✅ Test recorded successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📁 Saved to:${NC} $OUTPUT_FILE"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Review the generated code"
    echo "  2. Add assertions and validations"
    echo "  3. Use AI to enhance the test:"
    echo "     - Add error handling"
    echo "     - Parameterize test data"
    echo "     - Generate test variations"
    echo "  4. Run the test:"
    echo "     npx playwright test $OUTPUT_FILE"
    echo ""
    echo -e "${YELLOW}💡 Tip:${NC} Feed this code to an AI agent to:"
    echo "  - Convert to comprehensive test suite"
    echo "  - Add proper assertions"
    echo "  - Create test fixtures"
    echo "  - Generate documentation"
else
    echo -e "${GREEN}✅ Recording complete!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Copy the generated code and use it to:${NC}"
    echo "  - Create new test files"
    echo "  - Train AI agents on your app's structure"
    echo "  - Generate test variations"
fi
