# GATES REFERENCE

> ROLE: REFERENCE  
> Explains the gate system. Read-only reference.

---

## Gate Overview

| Gate | Name | Purpose | Output | Can Skip? |
|------|------|---------|--------|-----------|
| 0 | IDEA | Capture problem | IDEA.md | No (greenfield) / Yes (brownfield) |
| 1 | MARKET | Validate market | MARKET_VALIDATION.md | Yes (SKIP-MARKET) |
| 2 | SCOPE | Lock scope | SCOPE.md | **NO - MANDATORY** |
| 3 | ARCHITECTURE | Lock architecture | ARCHITECTURE.md | Yes (simple features) |
| 4 | EXECUTION | Build features | prd.json, code | No |
| 5 | VALIDATION | Verify & ship | SCORE.json | No |

---

## Gate Dependencies

```
Gate 0 ──→ Gate 1 ──→ Gate 2 ──→ Gate 3 ──→ Gate 4 ──→ Gate 5
  │           │                     │
  │           ▼                     ▼
  │      [SKIP-MARKET]         [SKIP-ARCH]
  │           │                     │
  ▼           ▼                     ▼
[Brownfield joins here]────────────→
```

---

## How to Skip Gates

### Skip Market (Gate 1)
```
Type: SKIP-MARKET
When: Internal tool, validated already, prototype
```

### Skip Architecture (Gate 3)
```
Type: SKIP-ARCH or answer "A" when asked
When: Simple feature, existing codebase, bug fix
```

### Cannot Skip
- **Gate 2 (Scope)** - Always required
- **Gate 4 (Execution)** - That's the building
- **Gate 5 (Validation)** - That's the shipping

---

## Auto-Detection Logic

Agent checks on startup:

```
project-context/IDEA.md        → Gate 0 passed
project-context/MARKET_*.md    → Gate 1 passed  
SCOPE.md                       → Gate 2 passed
ARCHITECTURE.md                → Gate 3 passed
scripts/ralph/prd.json         → Gate 4 active
reports/SCORE.json (score > 0) → Gate 5 active
```

---

## Brownfield vs Greenfield

**Greenfield (empty folder):**
- Starts at Gate 0
- All gates available

**Brownfield (existing code):**
- Starts at Gate 2 (scope)
- Skips Gate 0-1 automatically
- Agent audits existing code first

---

## Gate Violations

If user tries to execute without scope:

```
═══════════════════════════════════════════════════════════════════
⛔ GATE VIOLATION
═══════════════════════════════════════════════════════════════════

Cannot execute: SCOPE.md missing
Required gate: Gate 2 (SCOPE LOCK)

Run: Follow @workflow/WORKFLOW.md
═══════════════════════════════════════════════════════════════════
```

---

## Emergency Override

If you MUST skip gates (not recommended):

```
Type: EMERGENCY-OVERRIDE
Confirm: YES-I-UNDERSTAND-THE-RISKS
```

This logs the override and proceeds. Use only for hotfixes.
