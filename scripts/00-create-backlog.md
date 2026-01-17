# Step 0.5: Create Feature Backlog from Status

## Goal

Take the gap analysis from STATUS.md and create a prioritized feature backlog. Each item becomes one PRD → one Ralph execution.

## Process

1. Read STATUS.md
2. Extract all items from "Partially Built 🟡" and "Not Started ❌"
3. Create BACKLOG.md with prioritized features
4. Each feature gets its own workflow run

## Output Format

Create `BACKLOG.md` in project root:

```markdown
# Feature Backlog

Generated from STATUS.md on [date]

## Priority Order

Features are ordered by dependency (what unblocks what).

| # | Feature | Status | Blocks | PRD | Ralph |
|---|---------|--------|--------|-----|-------|
| 1 | [Feature name] | 🟡 Partial | [what it unblocks] | ⬜ | ⬜ |
| 2 | [Feature name] | ❌ Missing | [what it unblocks] | ⬜ | ⬜ |
| 3 | [Feature name] | ❌ Missing | [what it unblocks] | ⬜ | ⬜ |

## Feature Details

### 1. [Feature Name]
**Current state:** [from STATUS.md]
**What's needed:** [brief scope]
**Dependencies:** [what must be done first]
**Unblocks:** [what this enables]

### 2. [Feature Name]
...
```

## Workflow Integration

After creating BACKLOG.md, for each feature row:

1. Run `01-create-prd.md` for that feature
2. Run `02-generate-tasks.md`
3. Run `03-convert-to-ralph.md`
4. Run `ralph.sh`
5. Mark PRD ✅ and Ralph ✅ in BACKLOG.md
6. Move to next feature

## Command

In Claude Code:
```
Use @scripts/00-create-backlog.md
Read @STATUS.md and create a prioritized BACKLOG.md
Order by: what unblocks what (dependencies first)
```

## Clarifying Questions to Ask

Before creating the backlog, ask:

```
1. What's the immediate goal?
   A. Demo/investor presentation
   B. Beta launch to users
   C. Production with payments
   D. Other: [specify]

2. What's the timeline pressure?
   A. This week
   B. This month
   C. This quarter
   D. No fixed deadline

3. Any features to skip for now?
   A. Skip i18n/translations
   B. Skip analytics
   C. Skip team collaboration
   D. Include everything from STATUS.md
```

This determines priority order.
