# Ship All: Automated Pipeline

## Goal

One command. Claude executes the entire workflow sequentially until all features are shipped.

## The Command

```
Use @scripts/ship-all.md
Start from: @STATUS.md
```

## Automated Pipeline

Claude will execute these steps WITHOUT stopping for manual input:

```
PHASE 1: BACKLOG
├── Read STATUS.md
├── Ask priority questions (wait for answer once)
├── Generate BACKLOG.md
└── Continue automatically

PHASE 2: FOR EACH FEATURE IN BACKLOG
├── Generate PRD (use defaults, minimal questions)
├── Generate Tasks (auto-approve parent tasks)
├── Convert to prd.json
├── Execute Ralph inline (not shell script)
│   ├── Pick story where passes: false
│   ├── Implement
│   ├── Run checks
│   ├── Commit
│   ├── Mark passes: true
│   └── Loop until all stories pass
├── Mark feature complete in BACKLOG.md
└── Move to next feature

PHASE 3: DONE
└── Report: all features shipped
```

## Execution Rules

### Minimize Human Interaction
- Ask priority questions ONCE at the start
- Use sensible defaults for PRD questions
- Auto-approve task generation (no "Go" wait)
- Only stop if blocked or error

### PRD Defaults (skip questionnaire)
When generating PRDs automatically, use:
- Scope: Minimal viable version
- Target: All users
- Timeline: Standard

If critical ambiguity, ask ONE question max, then proceed.

### Task Defaults
- Auto-approve parent tasks
- Generate sub-tasks immediately
- No "Go" confirmation needed

### Ralph Inline Execution
Instead of calling ralph.sh, execute the Ralph loop directly:
1. Read prd.json
2. Find first story where `passes: false`
3. Implement it
4. Run: `npm run typecheck` (or project equivalent)
5. If pass: commit, mark `passes: true`
6. If fail: fix and retry (max 3 attempts)
7. Loop until all stories pass
8. Move to next feature

### Error Handling
- If stuck on a story for 3 attempts: skip, log to BACKLOG.md, continue
- If critical error: stop and report

## Progress Tracking

Update BACKLOG.md after each feature:

```markdown
| # | Feature | PRD | Tasks | Ralph | Status |
|---|---------|-----|-------|-------|--------|
| 1 | Image Generation | ✅ | ✅ | ✅ | SHIPPED |
| 2 | PDF Export | ✅ | ✅ | 🔄 | IN PROGRESS |
| 3 | Payments | ⬜ | ⬜ | ⬜ | PENDING |
```

## Output

At the end, Claude reports:

```
## Ship All Complete

Features Shipped: 4/5
- ✅ Image Generation (12 commits)
- ✅ PDF Export (8 commits)
- ✅ Stripe Payments (6 commits)
- ✅ Layout & Cover (4 commits)
- ⚠️ Team Collaboration (skipped - blocked on auth refactor)

Total commits: 30
Branch: feature/mvp-completion
Ready for: git push origin feature/mvp-completion
```

## Start

To run the full automated pipeline:

```
Use @scripts/ship-all.md
Reference: @STATUS.md
Goal: [demo/beta/production]
```

Claude takes over from there.
