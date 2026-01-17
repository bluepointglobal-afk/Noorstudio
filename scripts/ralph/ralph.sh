#!/bin/bash
# Ralph - Autonomous AI Agent Loop for Claude Code
# Usage: ./ralph.sh [max_iterations]

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"

# Check prerequisites
if ! command -v claude &> /dev/null; then
    echo "Error: Claude Code CLI not found. Install with: npm i -g @anthropic-ai/claude-code"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq not found. Install with: brew install jq"
    exit 1
fi

if [ ! -f "$PRD_FILE" ]; then
    echo "Error: prd.json not found at $PRD_FILE"
    echo "Run the PRD creation workflow first."
    exit 1
fi

# Initialize progress file if needed
if [ ! -f "$PROGRESS_FILE" ]; then
    echo "# Progress Log" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "## Codebase Patterns" >> "$PROGRESS_FILE"
    echo "(Add reusable patterns here as you discover them)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

echo "=========================================="
echo "Ralph - Autonomous AI Agent"
echo "Max iterations: $MAX_ITERATIONS"
echo "PRD: $PRD_FILE"
echo "=========================================="

# Count incomplete stories
count_incomplete() {
    jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE"
}

ITERATION=0
while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    INCOMPLETE=$(count_incomplete)
    
    echo ""
    echo "--- Iteration $ITERATION of $MAX_ITERATIONS ---"
    echo "Incomplete stories: $INCOMPLETE"
    
    if [ "$INCOMPLETE" -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "✅ ALL STORIES COMPLETE!"
        echo "=========================================="
        exit 0
    fi
    
    # Run Claude Code with the prompt
    echo "Starting Claude Code..."
    cd "$(dirname "$SCRIPT_DIR")" # Go to project root
    
    OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | claude -p --dangerously-skip-permissions 2>&1) || true
    
    echo "$OUTPUT"
    
    # Check for completion signal
    if echo "$OUTPUT" | grep -q "COMPLETE"; then
        echo ""
        echo "=========================================="
        echo "✅ RALPH COMPLETE!"
        echo "=========================================="
        exit 0
    fi
    
    echo "Iteration $ITERATION complete. Continuing..."
    sleep 2
done

echo ""
echo "=========================================="
echo "⚠️  Max iterations ($MAX_ITERATIONS) reached"
echo "Incomplete stories: $(count_incomplete)"
echo "=========================================="
