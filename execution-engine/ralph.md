# RALPH EXECUTION PROTOCOL

> ROLE: EXECUTION  
> ⛔ REQUIRES: Gate 4 passed, SCOPE.md exists, prd.json exists

---

## Pre-Flight Check

```
═══════════════════════════════════════════════════════════════════
RALPH PRE-FLIGHT
═══════════════════════════════════════════════════════════════════

[ ] SCOPE.md exists
[ ] prd.json exists  
[ ] Verifiers configured
[ ] Git branch created

Missing any? STOP and run: Follow @workflow/WORKFLOW.md
═══════════════════════════════════════════════════════════════════
```

---

## Execution Loop

For each story in prd.json:

```
1. READ story title and acceptance criteria
2. IMPLEMENT the feature
3. RUN verifiers (lint, typecheck, test)
4. If PASS → commit → mark story done → next
5. If FAIL → fix → retry (max 3 attempts)
6. If STUCK → log to failures.log → ask user
```

---

## Story Format (prd.json)

```json
{
  "feature": "Feature Name",
  "verifiers": ["npm run lint", "npm test"],
  "stories": [
    {
      "id": "FEAT-001",
      "title": "Story title",
      "passes": false,
      "notes": ""
    }
  ]
}
```

---

## Commit Convention

```
feat: [STORY-ID] - Story title

- What was done
- Files changed
```

---

## Failure Handling

After 2 identical failures:
1. Log failure signature
2. Stop execution
3. Ask user for guidance
4. Resume after fix

---

## Completion

When all stories pass:

```
═══════════════════════════════════════════════════════════════════
RALPH COMPLETE
═══════════════════════════════════════════════════════════════════

Feature: [name]
Stories: [X/X] passed
Commits: [list]

Next: make ship-validate
═══════════════════════════════════════════════════════════════════
```
