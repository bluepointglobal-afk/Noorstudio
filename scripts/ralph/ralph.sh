#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# RALPH.SH - Governed Execution Loop Wrapper
# ═══════════════════════════════════════════════════════════════════════════════
# Reads: scripts/ralph/prd.json
# Writes: scripts/ralph/progress.txt, scripts/ralph/failure_signatures.log
# Enforces: verifier commands, max attempts, stop-on-repeat-failure
#
# NOTE: This wrapper does NOT "run Claude" itself.
# You run Claude Code to implement stories, then this wrapper:
#   1. Runs verifiers
#   2. Commits on success
#   3. Marks story as passed
#   4. Advances to next story
# ═══════════════════════════════════════════════════════════════════════════════

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PRD_JSON="scripts/ralph/prd.json"
PROGRESS="scripts/ralph/progress.txt"
FAIL_SIGS="scripts/ralph/failure_signatures.log"

MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"
MAX_STORIES="${MAX_STORIES:-0}"           # 0 means no cap
REPEAT_FAIL_LIMIT="${REPEAT_FAIL_LIMIT:-2}" # stop if same signature repeats N times

mkdir -p scripts/ralph
touch "$PROGRESS" "$FAIL_SIGS"

if [[ ! -f "$PRD_JSON" ]]; then
  echo "[RALPH] ════════════════════════════════════════"
  echo "[RALPH] Missing $PRD_JSON"
  echo "[RALPH] ════════════════════════════════════════"
  echo "[RALPH] Create it first:"
  echo "        make prd-to-ralph FEATURE=<name> NAME=\"Feature Name\""
  echo ""
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────

signature_from_file() {
  local f="$1"
  # Take last 60 lines, strip ANSI, collapse whitespace, hash
  tail -n 60 "$f" 2>/dev/null \
    | sed -E 's/\x1b\[[0-9;]*m//g' \
    | tr -s '[:space:]' ' ' \
    | sha256sum \
    | awk '{print $1}'
}

repeat_fail_count() {
  local sig="$1"
  grep -c "$sig" "$FAIL_SIGS" 2>/dev/null || echo 0
}

log_line() {
  local msg="$1"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $msg" | tee -a "$PROGRESS"
}

# ─────────────────────────────────────────────────────────────────────────────
# PRD JSON operations
# ─────────────────────────────────────────────────────────────────────────────

read_verifiers() {
  jq -r '.verifiers[]? // empty' "$PRD_JSON"
}

run_verifiers() {
  local out="/tmp/ralph_verify.out"
  : > "$out"
  local any=0
  
  while IFS= read -r cmd; do
    [[ -z "$cmd" ]] && continue
    any=1
    log_line "[RALPH] Verifier: $cmd"
    set +e
    bash -lc "$cmd" >> "$out" 2>&1
    local rc=$?
    set -e
    if [[ $rc -ne 0 ]]; then
      echo "$out"
      return 1
    fi
  done < <(read_verifiers)

  if [[ $any -eq 0 ]]; then
    log_line "[RALPH] No verifiers configured. Add verifiers[] to prd.json."
  fi
  return 0
}

mark_story_passed() {
  local story_id="$1"
  tmp="$(mktemp)"
  jq --arg id "$story_id" '
    .stories = (.stories | map(if .id == $id then .passes = true else . end))
  ' "$PRD_JSON" > "$tmp"
  mv "$tmp" "$PRD_JSON"
}

next_story_id() {
  jq -r '.stories[] | select(.passes == false) | .id' "$PRD_JSON" | head -n 1
}

story_title() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.stories[] | select(.id==$id) | .title' "$PRD_JSON"
}

story_branch() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.stories[] | select(.id==$id) | (.branch // empty)' "$PRD_JSON"
}

total_stories() {
  jq '.stories | length' "$PRD_JSON"
}

passed_stories() {
  jq '[.stories[] | select(.passes == true)] | length' "$PRD_JSON"
}

# ─────────────────────────────────────────────────────────────────────────────
# Git operations
# ─────────────────────────────────────────────────────────────────────────────

ensure_git_cleanish() {
  if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
    log_line "[RALPH] WARN: Working tree has uncommitted changes."
  fi
}

commit_story() {
  local story_id="$1"
  local title="$2"
  
  git add -A 2>/dev/null || true
  if git diff --cached --quiet 2>/dev/null; then
    log_line "[RALPH] No staged changes to commit for $story_id."
    return 0
  fi
  git commit -m "ralph: ${story_id} ${title}" -m "Automated story completion with verifiers." >/dev/null 2>&1 || true
  log_line "[RALPH] Committed: ralph: ${story_id}"
}

# ─────────────────────────────────────────────────────────────────────────────
# Main Loop
# ─────────────────────────────────────────────────────────────────────────────

echo ""
log_line "[RALPH] ════════════════════════════════════════"
log_line "[RALPH] Governed Execution Loop"
log_line "[RALPH] ════════════════════════════════════════"
log_line "[RALPH] Stories: $(passed_stories)/$(total_stories) passed"
log_line "[RALPH] Max attempts per story: $MAX_ATTEMPTS"

ensure_git_cleanish

stories_done=0

while true; do
  sid="$(next_story_id || true)"
  if [[ -z "${sid}" ]]; then
    log_line "[RALPH] ✅ All stories passed. Done."
    exit 0
  fi

  if [[ "$MAX_STORIES" != "0" && "$stories_done" -ge "$MAX_STORIES" ]]; then
    log_line "[RALPH] Reached MAX_STORIES=${MAX_STORIES}. Stopping."
    exit 0
  fi

  title="$(story_title "$sid")"
  br="$(story_branch "$sid" || true)"
  
  echo ""
  log_line "[RALPH] ────────────────────────────────────────"
  log_line "[RALPH] Story: ${sid}"
  log_line "[RALPH] Title: ${title}"
  
  if [[ -n "$br" ]]; then
    if git show-ref --verify --quiet "refs/heads/$br" 2>/dev/null; then
      git checkout "$br" >/dev/null 2>&1 || true
    else
      git checkout -b "$br" >/dev/null 2>&1 || true
    fi
    log_line "[RALPH] Branch: $br"
  fi

  log_line "[RALPH] ────────────────────────────────────────"
  log_line "[RALPH] IMPLEMENTATION REQUIRED:"
  log_line "[RALPH]   1. Open prd.json, find story: $sid"
  log_line "[RALPH]   2. Implement in Claude Code"
  log_line "[RALPH]   3. Re-run: make ralph"
  log_line "[RALPH] ────────────────────────────────────────"

  # Try verifiers
  attempt=1
  while [[ "$attempt" -le "$MAX_ATTEMPTS" ]]; do
    log_line "[RALPH] Attempt ${attempt}/${MAX_ATTEMPTS}: running verifiers..."
    out="/tmp/ralph_verify.out"
    : > "$out"

    if run_verifiers; then
      log_line "[RALPH] ✅ Verifiers PASSED for $sid"
      mark_story_passed "$sid"
      commit_story "$sid" "$title"
      stories_done=$((stories_done + 1))
      break
    else
      sig="$(signature_from_file "$out")"
      echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] story=${sid} sig=${sig}" >> "$FAIL_SIGS"
      cnt="$(repeat_fail_count "$sig")"
      log_line "[RALPH] ❌ Verifiers FAILED. Signature: ${sig:0:16}... (seen ${cnt}x)"

      if [[ "$cnt" -ge "$REPEAT_FAIL_LIMIT" ]]; then
        log_line "[RALPH] ════════════════════════════════════════"
        log_line "[RALPH] STOP: Same failure repeated ${cnt}x"
        log_line "[RALPH] ════════════════════════════════════════"
        log_line "[RALPH] Actions:"
        log_line "[RALPH]   1. Check /tmp/ralph_verify.out"
        log_line "[RALPH]   2. Fix the root cause"
        log_line "[RALPH]   3. Tighten PRD or update verifiers"
        log_line "[RALPH]   4. Re-run: make ralph"
        exit 2
      fi

      log_line "[RALPH] Action: Fix errors, then re-run: make ralph"
      log_line "[RALPH] See: /tmp/ralph_verify.out"
      attempt=$((attempt + 1))
      exit 1
    fi
  done
done
