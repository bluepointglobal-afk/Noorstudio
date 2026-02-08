#!/bin/bash

# IMG2IMG Test Runner Script
# Runs the img2img implementation test and displays results

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TEST_FILE="$PROJECT_DIR/tests/img2img-test.ts"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        IMG2IMG Character Consistency Test Suite          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Project: NoorStudio"
echo "Test: img2img-test.ts"
echo "Working Directory: $PROJECT_DIR"
echo ""

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Error: Test file not found at $TEST_FILE"
    exit 1
fi

# Check if tsx is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js."
    exit 1
fi

echo "Starting test..."
echo "───────────────────────────────────────────────────────────"
echo ""

# Run the test
cd "$PROJECT_DIR"
npx tsx "$TEST_FILE"

TEST_EXIT_CODE=$?

echo ""
echo "───────────────────────────────────────────────────────────"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Test completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Review the diagnostic report above"
    echo "  2. Generate a real multi-chapter book"
    echo "  3. Visually inspect character consistency"
    echo "  4. Measure regeneration rates"
else
    echo "❌ Test failed with exit code $TEST_EXIT_CODE"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check the error messages above"
    echo "  2. Verify all dependencies are installed"
    echo "  3. See IMG2IMG_QUICK_REFERENCE.md for common issues"
    echo "  4. Review IMG2IMG_IMPLEMENTATION_SUMMARY.md for details"
fi

echo ""
echo "For more information:"
echo "  - Quick Reference: IMG2IMG_QUICK_REFERENCE.md"
echo "  - Full Docs: docs/IMG2IMG_ARCHITECTURE.md"
echo "  - Implementation: IMG2IMG_IMPLEMENTATION_SUMMARY.md"
echo ""

exit $TEST_EXIT_CODE
