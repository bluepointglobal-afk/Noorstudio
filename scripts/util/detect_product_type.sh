#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# DETECT_PRODUCT_TYPE.SH
# Reads SCOPE.md and extracts the Product Type for adapter selection
# ═══════════════════════════════════════════════════════════════════════════════

if [[ ! -f "SCOPE.md" ]]; then
  echo "Web"
  exit 0
fi

# Expects a line like: "## Product Type" then next non-empty line contains the type
TYPE="$(awk '
  BEGIN{found=0}
  /^##[[:space:]]+Product[[:space:]]+Type/{found=1; next}
  found==1 && NF>0 {print $0; exit}
' SCOPE.md | tr -d '\r' | xargs || true)"

# Normalize: extract first word (handles "SaaS | Mobile | Web" format)
TYPE="$(echo "$TYPE" | awk '{print $1}')"

case "$TYPE" in
  SaaS|Mobile|Web|API|Content) echo "$TYPE" ;;
  *) echo "Web" ;;
esac
