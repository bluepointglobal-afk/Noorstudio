#!/usr/bin/env bash
# ROLE: SYSTEM_THINKING
# Auto-detect which gate a project is currently at

set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

GATE=0
GATE_NAME="IDEA"

# Check each gate's artifacts
if [[ -f "project-context/IDEA.md" ]] || [[ -f "IDEA.md" ]]; then
  GATE=1; GATE_NAME="MARKET"
fi

if [[ -f "project-context/MARKET_VALIDATION.md" ]] || [[ -f "MARKET_VALIDATION.md" ]]; then
  GATE=2; GATE_NAME="SCOPE"
fi

if [[ -f "SCOPE.md" ]]; then
  GATE=3; GATE_NAME="ARCHITECTURE"
fi

if [[ -f "ARCHITECTURE.md" ]]; then
  GATE=4; GATE_NAME="EXECUTION"
fi

if [[ -f "scripts/ralph/prd.json" ]]; then
  # Check if all stories are done
  REMAINING=$(jq '[.stories[]|select(.passes==false)]|length' scripts/ralph/prd.json 2>/dev/null || echo "0")
  if [[ "$REMAINING" == "0" ]]; then
    GATE=5; GATE_NAME="VALIDATION"
  fi
fi

if [[ -f "reports/SCORE.json" ]]; then
  SCORE=$(jq -r '.total_percent // 0' reports/SCORE.json 2>/dev/null || echo "0")
  THRESHOLD=$(jq -r '.threshold_percent // 80' reports/SCORE.json 2>/dev/null || echo "80")
  if (( SCORE >= THRESHOLD )); then
    GATE=6; GATE_NAME="SHIPPED"
  fi
fi

# Detect project type
PROJECT_TYPE="greenfield"
if [[ -d "src" ]] || [[ -d "app" ]] || [[ -f "package.json" ]]; then
  PROJECT_TYPE="brownfield"
fi

# Output
echo "GATE=$GATE"
echo "GATE_NAME=$GATE_NAME"
echo "PROJECT_TYPE=$PROJECT_TYPE"

# Detailed status
echo ""
echo "ARTIFACTS:"
[[ -f "project-context/IDEA.md" ]] && echo "  [x] IDEA.md" || echo "  [ ] IDEA.md"
[[ -f "project-context/MARKET_VALIDATION.md" ]] && echo "  [x] MARKET_VALIDATION.md" || echo "  [ ] MARKET_VALIDATION.md"
[[ -f "SCOPE.md" ]] && echo "  [x] SCOPE.md" || echo "  [ ] SCOPE.md"
[[ -f "ARCHITECTURE.md" ]] && echo "  [x] ARCHITECTURE.md" || echo "  [ ] ARCHITECTURE.md"
[[ -f "scripts/ralph/prd.json" ]] && echo "  [x] prd.json" || echo "  [ ] prd.json"
[[ -f "reports/SCORE.json" ]] && echo "  [x] SCORE.json" || echo "  [ ] SCORE.json"
