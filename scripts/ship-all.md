# ship-all.md

Universal product shipping pipeline. Works for SaaS, Mobile, Web, API, and Content.

---

## PHASE 0: DISCOVERY (Agent-Driven)

Agent extracts from conversation:
- [ ] Product Type (SaaS/Mobile/Web/API/Content)
- [ ] Market (B2B/B2C/Internal/Hybrid)
- [ ] Target Persona
- [ ] Primary Outcome (1 sentence)
- [ ] Core Deliverables
- [ ] Success Criteria
- [ ] Context & Constraints

Agent confirms understanding with user, then generates:

```bash
bash scripts/util/generate_scope.sh --json '{
  "product_type": "...",
  "market": "...",
  "persona": "...",
  "outcome": "...",
  "deliverables": [...],
  "success_criteria": [...],
  "context": "...",
  "constraints": [...]
}'
```

**Checkpoint:** SCOPE.md generated and confirmed.

---

## PHASE 1: SCOPE LOCK

- [ ] Review generated SCOPE.md
- [ ] User confirms or requests adjustments
- [ ] If adjustments: regenerate SCOPE.md
- [ ] Lock scope (no changes after this)

**Checkpoint:** SCOPE.md is locked. Drives all downstream decisions.

---

## PHASE 2: ARCHITECTURE

- [ ] Define technical approach
- [ ] Identify key components
- [ ] Document decisions in decisions.log
- [ ] Create PRD or tasks/*.md

**Checkpoint:** Architecture documented, PRD ready.

---

## PHASE 3: IMPLEMENTATION

- [ ] Convert PRD to Ralph stories (make prd-to-ralph)
- [ ] Run Ralph loop (make ralph)
- [ ] All stories pass verifiers
- [ ] Code committed per story

**Checkpoint:** All stories implemented and verified.

---

## PHASE 4: INTEGRATION

- [ ] End-to-end flow works
- [ ] External integrations tested
- [ ] Data flows correctly
- [ ] No blocking errors

**Checkpoint:** System works as integrated whole.

---

## PHASE 5: VALIDATION (MANDATORY)

```
├── Read Product Type from SCOPE.md
├── Load validation adapter:
│   - SaaS  → scripts/validation/saas.md
│   - Mobile → scripts/validation/mobile.md
│   - Web   → scripts/validation/web.md
│   - API   → scripts/validation/api.md
│   - Content → scripts/validation/content.md
│
├── Execute adapter scenarios
├── Fill SCORE.json
│
├── If score ≥ threshold:
│   └── Mark READY_TO_SHIP
│
└── If score < threshold:
    ├── Generate GAP_REPORT.md
    ├── Generate PRD_DELTA.md
    └── Loop back to PHASE 2
```

**Checkpoint:** Validation complete, SCORE.json filled.

---

## SHIP GATE

Run: `make ship`

- Score ≥ threshold → READY_TO_SHIP
- Score < threshold → Review GAP_REPORT.md, iterate

---

## POST-SHIP

- [ ] Tag release
- [ ] Deploy to production
- [ ] Update STATUS.md → SHIPPED
- [ ] Record learnings (automatic via memory.sh)

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `make ship` | Full pipeline |
| `make ship-dry` | Preview without running |
| `make ship-validate` | Run only validation |
| `make ralph` | Run Ralph story loop |
| `make ship-memory` | View learnings |
| `make prd-to-ralph FEATURE=x NAME="Y"` | Convert PRD to stories |
