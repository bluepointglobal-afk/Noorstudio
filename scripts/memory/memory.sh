#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# MEMORY.SH - Learning Memory System
# ═══════════════════════════════════════════════════════════════════════════════
# Append-only logs + curated playbook + lightweight index
#
# Commands:
#   record <kind> <message>  - Write to learnings.log + index
#   ingest <file>            - Store file reference + excerpt in failures.log
#   summary                  - Show recent learnings
#   snapshot                 - Full memory dump for agent context
# ═══════════════════════════════════════════════════════════════════════════════

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MEMORY_DIR="${MEMORY_HOME:-$ROOT/scripts/memory}"
cd "$MEMORY_DIR"
mkdir -p .

cmd="${1:-}"

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

ensure_files() {
  touch learnings.log failures.log decisions.log
  [[ -f index.json ]] || echo '[]' > index.json
  [[ -f patterns.md ]] || cat > patterns.md << 'EOF'
# Patterns (Distilled)

Curate recurring learnings here. This becomes your playbook.

## Architecture Patterns
- [Add patterns that work]

## Common Pitfalls
- [Add mistakes to avoid]

## Validation Learnings
- [Add what predicts shipping success]
EOF
}

record() {
  local kind="$1"; shift
  local msg="$*"
  ensure_files
  local ts; ts="$(timestamp)"
  echo "[$ts] [$kind] $msg" >> learnings.log
  
  # Update index
  python3 - "$kind" "$msg" << 'PY'
import json, time, sys, os

kind = sys.argv[1]
msg = sys.argv[2]

idx_path = "index.json"
with open(idx_path, "r", encoding="utf-8") as f:
    idx = json.load(f)

idx.append({
    "ts": time.time(),
    "kind": kind,
    "summary": msg[:240]
})

# Keep index manageable (last 500 entries)
if len(idx) > 500:
    idx = idx[-500:]

with open(idx_path, "w", encoding="utf-8") as f:
    json.dump(idx, f, indent=2)
PY
  echo "[MEMORY] Recorded: [$kind] $msg"
}

ingest() {
  local file="$1"
  ensure_files
  
  # Handle relative paths
  if [[ ! -f "$file" && -f "$ROOT/$file" ]]; then
    file="$ROOT/$file"
  fi
  
  if [[ ! -f "$file" ]]; then
    echo "[MEMORY] Missing file: $file" >&2
    return 1
  fi
  
  local ts; ts="$(timestamp)"
  echo "[$ts] [ingest] $file" >> learnings.log
  
  # Store pointer + first lines in failures.log
  {
    echo ""
    echo "════════════════════════════════════════"
    echo "INGEST $ts"
    echo "FILE: $file"
    echo "════════════════════════════════════════"
    sed -n '1,80p' "$file"
    echo ""
    echo "[truncated at 80 lines]"
  } >> failures.log
  
  echo "[MEMORY] Ingested: $file"
}

summary() {
  ensure_files
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "MEMORY SUMMARY"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "── Last 15 learnings ──────────────────────────────────────────────────────────"
  tail -n 15 learnings.log 2>/dev/null || echo "(none)"
  echo ""
  echo "── Last 5 decisions ───────────────────────────────────────────────────────────"
  tail -n 5 decisions.log 2>/dev/null || echo "(none)"
  echo ""
  echo "── Patterns (curated) ─────────────────────────────────────────────────────────"
  sed -n '1,40p' patterns.md 2>/dev/null || echo "(none)"
}

snapshot() {
  ensure_files
  cat << 'HEADER'
## Project Memory Snapshot

This snapshot provides context from past iterations.
Use it to avoid repeating mistakes and leverage proven patterns.

HEADER

  echo "### Recent Learnings"
  echo '```'
  tail -n 30 learnings.log 2>/dev/null || echo "(none)"
  echo '```'
  echo ""
  
  echo "### Recent Failures/Gaps"
  echo '```'
  tail -n 40 failures.log 2>/dev/null || echo "(none)"
  echo '```'
  echo ""
  
  echo "### Architectural Decisions"
  echo '```'
  tail -n 20 decisions.log 2>/dev/null || echo "(none)"
  echo '```'
  echo ""
  
  echo "### Distilled Patterns"
  cat patterns.md 2>/dev/null || echo "(none)"
}

query() {
  local term="$1"
  ensure_files
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "MEMORY QUERY: $term"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "── Learnings ──"
  grep -i "$term" learnings.log 2>/dev/null | tail -n 10 || echo "(no matches)"
  echo ""
  echo "── Failures ──"
  grep -i "$term" failures.log 2>/dev/null | tail -n 10 || echo "(no matches)"
  echo ""
  echo "── Decisions ──"
  grep -i "$term" decisions.log 2>/dev/null | tail -n 10 || echo "(no matches)"
}

case "$cmd" in
  record)   shift; record "$@" ;;
  ingest)   shift; ingest "$@" ;;
  summary)  summary ;;
  snapshot) snapshot ;;
  query)    shift; query "$@" ;;
  *)
    echo "Usage: memory.sh {record|ingest|summary|snapshot|query} ..."
    echo ""
    echo "Commands:"
    echo "  record <kind> <msg>  - Log a learning (kind: release, fix, decision, pattern)"
    echo "  ingest <file>        - Store file reference + excerpt"
    echo "  summary              - Show recent memory"
    echo "  snapshot             - Full dump for agent context"
    echo "  query <term>         - Search memory"
    exit 1
    ;;
esac
