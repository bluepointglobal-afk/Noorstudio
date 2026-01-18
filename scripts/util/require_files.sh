#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# REQUIRE_FILES.SH
# Checks that required files exist before running the pipeline
# Usage: require_files.sh FILE1 FILE2 FILE3...
# ═══════════════════════════════════════════════════════════════════════════════

missing=()

for f in "$@"; do
  if [[ ! -f "$f" ]]; then
    missing+=("$f")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[ERROR] Missing required files:"
  for m in "${missing[@]}"; do
    echo "        - $m"
  done
  echo ""
  echo "[ACTION] Create missing files before running ship."
  exit 1
fi

exit 0
