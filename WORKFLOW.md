# GHOSTY WORKFLOW

> Copy this entire file content into Claude Code to start.

---

## PHASE 1: AUDIT

Scan this codebase:
- src/, app/, components/, pages/
- package.json, README.md
- Any existing STATUS.md, BACKLOG.md, PRDs

---

## PHASE 2: SCOPE VALIDATION (REQUIRES USER CONFIRMATION)

Based on audit, present this to user:

```
═══════════════════════════════════════════════════════════════════
SCOPE VALIDATION - Please confirm or correct
═══════════════════════════════════════════════════════════════════

Product Type: [SaaS / Mobile / Web / API / Content]
Market:       [B2B / B2C / Internal / Hybrid]
Persona:      [SME / Consumer / Enterprise / Developer / Creator]

Outcome (1 sentence):
[What the user achieves with this product]

Deliverables:
- [What the product outputs - files, reports, screens, etc.]

Success Criteria:
- [How we measure it works]

───────────────────────────────────────────────────────────────────
QUESTIONS - Reply with answers or corrections:

1. Is product type correct?
2. Who is the primary user?
3. What ONE thing should they achieve?
4. Top incomplete feature to ship first?
5. Any constraints? (tech stack, timeline, compliance, budget)
═══════════════════════════════════════════════════════════════════
```

**STOP. Wait for user response before continuing.**

---

## PHASE 3: LOCK & PLAN (after user confirms)

1. Generate SCOPE.md (locked)
2. Create/update BACKLOG.md with ALL incomplete features, prioritized
3. Pick #1 feature from backlog
4. Create tasks/tasks-<feature>.md with checkboxes
5. Convert to scripts/ralph/prd.json

---

## PHASE 4: EXECUTE

Tell user:

```
Ready to ship: [feature name]
Stories: [count]
Run: make ship
```

---

## PHASE 5: VALIDATE & SHIP

After stories complete, fill reports/SCORE.json:
- Score each: mission_fit, deliverable_quality, outcome, UX, market_readiness (0-100)
- Calculate total_percent

If score >= threshold: READY TO SHIP
If score < threshold: Create GAP_REPORT.md, loop back

---

## RULES

1. **Never skip PHASE 2** - User must confirm scope
2. **One feature at a time** - Backlog holds the rest
3. **make ship is the only command** - It runs everything
4. **SCOPE.md is sacred** - Changes require new questionnaire
5. **Agent detects, user confirms** - No assumptions
