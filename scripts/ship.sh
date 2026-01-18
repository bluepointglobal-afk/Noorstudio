#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# SHIP.SH - Ghosty-friendly orchestration entrypoint
# ═══════════════════════════════════════════════════════════════════════════════
# This script orchestrates the deterministic parts of ship-all:
# - Ralph execution (if prd.json exists)
# - Validation adapter selection + scoring
# - Memory ingestion
# - Ship/no-ship gate
#
# The ship-all.md playbook is still run in Claude Code with human checkpoints.
# This script wraps the automation around it.
# ═══════════════════════════════════════════════════════════════════════════════

DRY_RUN="${DRY_RUN:-0}"
CI="${CI:-0}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p reports

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "[SHIP] Ghosty Ship-All Pipeline"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

echo "[SHIP] Loading scope + status..."
PRODUCT_TYPE="$(bash scripts/util/detect_product_type.sh)"
echo "[SHIP] Product Type: ${PRODUCT_TYPE}"

if [[ "$DRY_RUN" == "1" ]]; then
  echo ""
  echo "[SHIP] ══════════════════════════════════════"
  echo "[SHIP] DRY RUN MODE"
  echo "[SHIP] ══════════════════════════════════════"
  echo "[SHIP] Would execute:"
  echo "       1. Memory snapshot → context"
  echo "       2. ship-all.md playbook (Claude Code)"
  echo "       3. Ralph execution loop (if prd.json exists)"
  echo "       4. Validation adapter: ${PRODUCT_TYPE}"
  echo "       5. Score gate → READY_TO_SHIP or GAP_REPORT"
  echo "       6. Memory ingestion"
  echo ""
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# 1) Seed memory snapshot into context (useful for agents/humans)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[SHIP] Step 1: Memory snapshot..."
bash scripts/memory/memory.sh snapshot > /tmp/MEMORY_SNAPSHOT.txt 2>/dev/null || true
if [[ -s /tmp/MEMORY_SNAPSHOT.txt ]]; then
  echo "[SHIP] Memory snapshot written to /tmp/MEMORY_SNAPSHOT.txt"
else
  echo "[SHIP] No existing memory. Fresh start."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2) Reminder: Run ship-all playbook in Claude Code
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[SHIP] Step 2: ship-all playbook"
echo "[SHIP] ══════════════════════════════════════"
echo "[SHIP] Reminder: Run @scripts/ship-all.md in Claude Code with @STATUS.md"
echo "[SHIP] (This script orchestrates surrounding automation.)"
echo "[SHIP] ══════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# 3) Run Ralph execution (if prd.json exists)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[SHIP] Step 3: Ralph execution..."
if [[ -f "scripts/ralph/prd.json" ]]; then
  echo "[SHIP] Found scripts/ralph/prd.json. Running Ralph..."
  bash scripts/ralph/ralph.sh 2>&1 | tee -a scripts/ralph/progress.txt || {
    echo "[SHIP] Ralph exited with non-zero. Check progress.txt"
  }
else
  echo "[SHIP] No scripts/ralph/prd.json found. Skipping Ralph."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4) Run validation adapter (writes reports/SCORE.json)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[SHIP] Step 4: Validation..."
bash scripts/validation/run_validation.sh

SCORE="$(jq -r '.total_percent // empty' reports/SCORE.json 2>/dev/null || true)"
THRESHOLD="$(jq -r '.threshold_percent // 80' reports/SCORE.json 2>/dev/null || echo 80)"

if [[ -z "$SCORE" ]]; then
  echo "[SHIP] ERROR: reports/SCORE.json missing total_percent."
  echo "[SHIP] Action: Run validation in Claude Code, fill SCORE.json, then re-run."
  exit 1
fi

echo ""
echo "[SHIP] ══════════════════════════════════════"
echo "[SHIP] Score: ${SCORE}% (threshold: ${THRESHOLD}%)"
echo "[SHIP] ══════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# 5) Gate: Ship or Gap
# ─────────────────────────────────────────────────────────────────────────────
echo ""
if (( SCORE < THRESHOLD )); then
  echo "[SHIP] ❌ NOT READY TO SHIP"
  echo "[SHIP] ══════════════════════════════════════"
  echo "[SHIP] Writing PRD delta and logging learnings..."
  bash scripts/memory/memory.sh ingest reports/GAP_REPORT.md 2>/dev/null || true
  bash scripts/memory/memory.sh ingest reports/VALIDATION_REPORT.md 2>/dev/null || true
  echo ""
  echo "[SHIP] NEXT ACTIONS:"
  echo "       1. Review reports/GAP_REPORT.md"
  echo "       2. Update PRD or create PRD_DELTA.md"
  echo "       3. Run Ralph to implement fixes"
  echo "       4. Re-run: make ship"
  echo "[SHIP] ══════════════════════════════════════"
  exit 2
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6) Success: Record learnings and ship
# ─────────────────────────────────────────────────────────────────────────────
echo "[SHIP] ✅ READY TO SHIP"
echo "[SHIP] ══════════════════════════════════════"
echo "[SHIP] Recording learnings..."
bash scripts/memory/memory.sh ingest reports/VALIDATION_REPORT.md 2>/dev/null || true
bash scripts/memory/memory.sh record "release" "READY_TO_SHIP score=${SCORE}% type=${PRODUCT_TYPE}"
echo ""
echo "[SHIP] NEXT ACTIONS:"
echo "       1. Git tag release"
echo "       2. Deploy to production"
echo "       3. Update STATUS.md → SHIPPED"
echo "[SHIP] ══════════════════════════════════════"
echo ""
echo "[SHIP] Done."
