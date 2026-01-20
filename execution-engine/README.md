# /execution-engine

> ROLE: EXECUTION

## Purpose
Contains all execution workflows (Ralph, Ryan Carson style, task decomposition).

## When to use
- ONLY after Gate 4 (Execution) is reached
- ONLY when SCOPE.md exists
- ONLY when prd.json is generated

## When NOT to use
- Before scope is locked
- For ideation or architecture
- For validation

## Required Gate
**Gate 4: EXECUTION**

## Pre-check (agent must verify)
```
if (!exists("SCOPE.md")) {
  STOP("Cannot execute: SCOPE.md missing. Run workflow first.")
}
```

## Files
| File | Purpose |
|------|---------|
| ralph.md | Ralph-style story execution |
| task-decomposition.md | Breaking features into tasks |
| shipper.md | Final shipping checklist |
