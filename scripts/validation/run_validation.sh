#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# RUN_VALIDATION.SH
# Selects the correct validation adapter based on SCOPE.md product type
# Writes: reports/VALIDATION_REPORT.md, reports/SCORE.json, reports/GAP_REPORT.md
# ═══════════════════════════════════════════════════════════════════════════════

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
mkdir -p reports

PRODUCT_TYPE="$(bash scripts/util/detect_product_type.sh)"

ADAPTER=""
THRESHOLD="80"
case "${PRODUCT_TYPE}" in
  SaaS)    ADAPTER="scripts/validation/saas.md";    THRESHOLD="80" ;;
  Mobile)  ADAPTER="scripts/validation/mobile.md";  THRESHOLD="75" ;;
  Web)     ADAPTER="scripts/validation/web.md";     THRESHOLD="80" ;;
  API)     ADAPTER="scripts/validation/api.md";     THRESHOLD="80" ;;
  Content) ADAPTER="scripts/validation/content.md"; THRESHOLD="75" ;;
  *)       ADAPTER="scripts/validation/web.md";     THRESHOLD="80" ;;
esac

echo "[VALIDATION] Product Type: ${PRODUCT_TYPE}"
echo "[VALIDATION] Adapter: ${ADAPTER}"
echo "[VALIDATION] Threshold: ${THRESHOLD}%"

# ─────────────────────────────────────────────────────────────────────────────
# Create placeholder reports if they don't exist
# In practice, you run the adapter in Claude Code and fill these manually
# ─────────────────────────────────────────────────────────────────────────────

if [[ ! -f "reports/VALIDATION_REPORT.md" ]]; then
  cat > reports/VALIDATION_REPORT.md << EOF
# Validation Report

**Product Type:** ${PRODUCT_TYPE}
**Adapter:** ${ADAPTER}
**Threshold:** ${THRESHOLD}%

## Instructions

Run the validation playbook in Claude Code:
1. Reference: SCOPE.md, STATUS.md
2. Execute scenarios with Playwright or manual testing
3. Produce deliverables
4. Fill scoring rubric below

## Scenarios Tested
- [ ] Scenario 1: [description]
- [ ] Scenario 2: [description]
- [ ] Scenario 3: [description]

## Findings
[Document what worked, what didn't]

## Recommendations
[List improvements needed]
EOF
  echo "[VALIDATION] Created placeholder: reports/VALIDATION_REPORT.md"
fi

if [[ ! -f "reports/SCORE.json" ]]; then
  cat > reports/SCORE.json << EOF
{
  "product_type": "${PRODUCT_TYPE}",
  "threshold_percent": ${THRESHOLD},
  "total_percent": 0,
  "dimensions": {
    "mission_fit": 0,
    "deliverable_quality": 0,
    "outcome_achieved": 0,
    "user_experience": 0,
    "market_readiness": 0
  },
  "notes": "Populate after running SME/consumer validation. Each dimension: 0-100."
}
EOF
  echo "[VALIDATION] Created placeholder: reports/SCORE.json"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check score and create GAP_REPORT if needed
# ─────────────────────────────────────────────────────────────────────────────

SCORE="$(jq -r '.total_percent' reports/SCORE.json 2>/dev/null || echo 0)"

if (( SCORE < THRESHOLD )); then
  if [[ ! -f "reports/GAP_REPORT.md" ]]; then
    cat > reports/GAP_REPORT.md << EOF
# Gap Report

**Score:** ${SCORE}% < ${THRESHOLD}% (threshold)
**Product Type:** ${PRODUCT_TYPE}

## Critical Gaps (must fix before ship)
- [ ] Gap 1

## Major Gaps (should fix before ship)
- [ ] Gap 2

## Minor Gaps (nice to have)
- [ ] Gap 3

## Recommended PRD Changes
[What to add/change in the PRD to address gaps]
EOF
    echo "[VALIDATION] Score below threshold. Created: reports/GAP_REPORT.md"
  fi
fi

echo "[VALIDATION] SCORE.json: reports/SCORE.json"
echo "[VALIDATION] Current score: ${SCORE}%"
