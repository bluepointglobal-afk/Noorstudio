#!/usr/bin/env bash
# ROLE: EXECUTION
# ⛔ REQUIRES: Gate 4 passed, SCOPE.md exists

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════════════════════════════"
echo "GHOSTY SHIP"
echo "═══════════════════════════════════════════════════════════════════"

# Gate check
if [[ ! -f "SCOPE.md" ]]; then
  echo ""
  echo "⛔ GATE VIOLATION"
  echo ""
  echo "Cannot execute: SCOPE.md missing"
  echo "Required: Gate 2 (SCOPE LOCK)"
  echo ""
  echo "Run: Follow @workflow/WORKFLOW.md"
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi

# Detect current state
source <(bash scripts/detect-gate.sh 2>/dev/null) || true

echo "Current Gate: $GATE - $GATE_NAME"
echo ""

mkdir -p reports

# Product type
PRODUCT_TYPE="Web"
if [[ -f "SCOPE.md" ]]; then
  PRODUCT_TYPE=$(awk 'BEGIN{f=0}/^##[[:space:]]+Product[[:space:]]+Type/{f=1;next}f&&NF{print $1;exit}' SCOPE.md | tr -d '\r')
  [[ -z "$PRODUCT_TYPE" ]] && PRODUCT_TYPE="Web"
fi
echo "Product Type: $PRODUCT_TYPE"

# Ralph execution
if [[ -f "scripts/ralph/prd.json" ]]; then
  REMAINING=$(jq '[.stories[]|select(.passes==false)]|length' scripts/ralph/prd.json 2>/dev/null || echo "0")
  
  if [[ "$REMAINING" -gt 0 ]]; then
    echo ""
    echo "Ralph: $REMAINING stories remaining"
    echo ""
    echo "Stories to implement:"
    jq -r '.stories[]|select(.passes==false)|"  - " + .id + ": " + .title' scripts/ralph/prd.json | head -5
    echo ""
    echo "Implement in Claude Code, then re-run: make ship"
    echo "═══════════════════════════════════════════════════════════════════"
    exit 1
  fi
  
  echo "Ralph: All stories complete ✓"
fi

# Validation
echo ""
echo "Running validation..."
bash scripts/validation/run_validation.sh 2>/dev/null || true

# Score check
SCORE=$(jq -r '.total_percent // 0' reports/SCORE.json 2>/dev/null || echo "0")
THRESHOLD=$(jq -r '.threshold_percent // 80' reports/SCORE.json 2>/dev/null || echo "80")

echo ""
echo "Score: ${SCORE}% (threshold: ${THRESHOLD}%)"

if (( SCORE < THRESHOLD )); then
  echo ""
  echo "⚠️  BELOW THRESHOLD"
  echo ""
  echo "Review: reports/GAP_REPORT.md"
  echo "Fix gaps, then re-run: make ship"
  echo "═══════════════════════════════════════════════════════════════════"
  exit 2
fi

echo ""
echo "✅ READY TO SHIP"
echo "═══════════════════════════════════════════════════════════════════"
