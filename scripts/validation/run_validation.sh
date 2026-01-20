#!/usr/bin/env bash
# ROLE: VALIDATION
# ⛔ REQUIRES: Gate 4 passed

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

mkdir -p reports

# Detect product type
PRODUCT_TYPE="Web"
if [[ -f "SCOPE.md" ]]; then
  PRODUCT_TYPE=$(awk 'BEGIN{f=0}/^##[[:space:]]+Product[[:space:]]+Type/{f=1;next}f&&NF{print $1;exit}' SCOPE.md | tr -d '\r')
  [[ -z "$PRODUCT_TYPE" ]] && PRODUCT_TYPE="Web"
fi

# Set threshold by product type
THRESHOLD=80
case "$PRODUCT_TYPE" in
  Mobile) THRESHOLD=75 ;;
  Content) THRESHOLD=75 ;;
  *) THRESHOLD=80 ;;
esac

# Create SCORE.json if missing
if [[ ! -f "reports/SCORE.json" ]]; then
  cat > reports/SCORE.json << EOF
{
  "product_type": "$PRODUCT_TYPE",
  "threshold_percent": $THRESHOLD,
  "total_percent": 0,
  "dimensions": {
    "mission_fit": 0,
    "deliverable_quality": 0,
    "outcome_achieved": 0,
    "user_experience": 0,
    "market_readiness": 0
  },
  "notes": "Fill scores after validation (0-100 each)"
}
EOF
fi

SCORE=$(jq -r '.total_percent' reports/SCORE.json)

echo "[VALIDATION] Product: $PRODUCT_TYPE"
echo "[VALIDATION] Score: ${SCORE}%"
echo "[VALIDATION] Threshold: ${THRESHOLD}%"

# Create gap report if below threshold
if (( SCORE < THRESHOLD )) && [[ ! -f "reports/GAP_REPORT.md" ]]; then
  cat > reports/GAP_REPORT.md << EOF
# Gap Report

Score: ${SCORE}% (threshold: ${THRESHOLD}%)

## Gaps to Address

- [ ] Gap 1: [describe]
- [ ] Gap 2: [describe]

## Actions

1. [action]
2. [action]
EOF
fi
