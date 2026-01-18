#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONVERT_PRD_TO_PRDJSON.SH
# Converts a tasks/tasks-*.md or PRD markdown file into scripts/ralph/prd.json
# Usage: convert_prd_to_prdjson.sh <input.md> <feature_name>
# Example: convert_prd_to_prdjson.sh tasks/tasks-pdf-export.md "PDF Export"
# ═══════════════════════════════════════════════════════════════════════════════

INPUT="${1:-}"
FEATURE_NAME="${2:-Feature}"

if [[ -z "$INPUT" || ! -f "$INPUT" ]]; then
  echo "[ERROR] Usage: convert_prd_to_prdjson.sh <input.md> <feature_name>"
  echo "        Input file: $INPUT (not found)"
  exit 1
fi

mkdir -p scripts/ralph

python3 - <<'PY' "$INPUT" "$FEATURE_NAME"
import json, re, sys, os, hashlib

inp = sys.argv[1]
feature = sys.argv[2]

with open(inp, "r", encoding="utf-8") as f:
    text = f.read()

lines = [l.rstrip() for l in text.splitlines()]

# Extract actionable items:
# - unchecked task list items: "- [ ] ..."
# - bullet items: "- ..." under a Tasks section
# - headings "## ..." used as grouping; we'll still create stories from bullets
items = []
for l in lines:
    # Unchecked checkboxes
    m = re.match(r'^\s*-\s*\[\s*\]\s+(.*)$', l)
    if m:
        items.append(m.group(1).strip())
        continue
    # Simple bullets (if file is PRD-style)
    m2 = re.match(r'^\s*-\s+(.*)$', l)
    if m2:
        v = m2.group(1).strip()
        # Avoid capturing obvious non-task bullets
        if len(v) >= 6 and not v.lower().startswith(("example:", "note:", "threshold", "reply like", "[x]")):
            items.append(v)

# Deduplicate while preserving order
seen = set()
clean = []
for it in items:
    it2 = re.sub(r'\s+', ' ', it).strip()
    if not it2 or it2.lower() in seen:
        continue
    seen.add(it2.lower())
    clean.append(it2)

def story_id(i, title):
    base = f"{feature}:{i}:{title}".encode("utf-8")
    h = hashlib.sha1(base).hexdigest()[:8]
    slug = re.sub(r'[^a-z0-9]+', '-', feature.lower()).strip('-')
    return f"{slug}-{i:02d}-{h}"

stories = []
for i, title in enumerate(clean, start=1):
    slug = re.sub(r'[^a-z0-9]+', '-', feature.lower()).strip('-')
    stories.append({
        "id": story_id(i, title),
        "title": title,
        "passes": False,
        "notes": "",
        "branch": f"feature/{slug}/{i:02d}"
    })

# Default verifiers — edit these per repo
prd = {
    "feature": feature,
    "verifiers": [
        "npm test",
        "npm run lint",
        "npm run typecheck"
    ],
    "stories": stories
}

out = "scripts/ralph/prd.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(prd, f, indent=2)

print(f"[CONVERTER] Wrote {out} with {len(stories)} stories.")
print(f"[CONVERTER] ACTION: Edit 'verifiers' in prd.json to match your repo (pnpm/make/pytest/etc.)")
PY
