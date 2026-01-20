# SHIPPER

> ROLE: EXECUTION  
> ⛔ REQUIRES: Gate 5 passed, SCORE.json score >= threshold

---

## Pre-Ship Checklist

```
═══════════════════════════════════════════════════════════════════
SHIP CHECKLIST
═══════════════════════════════════════════════════════════════════

[ ] All stories complete (prd.json)
[ ] Tests passing
[ ] Build succeeds
[ ] SCORE.json >= threshold
[ ] No critical gaps in GAP_REPORT.md
[ ] Git committed and pushed
[ ] PR created (if applicable)

═══════════════════════════════════════════════════════════════════
```

---

## Ship Actions

1. **Merge** - PR to main/master
2. **Tag** - Version tag
3. **Deploy** - Run deploy script
4. **Notify** - Update STATUS.md
5. **Archive** - Move to completed

---

## Post-Ship

```
═══════════════════════════════════════════════════════════════════
SHIPPED ✅
═══════════════════════════════════════════════════════════════════

Feature: [name]
Version: [tag]
Deployed: [yes/no]

Next feature in BACKLOG.md: [name]
Run: Follow @workflow/WORKFLOW.md
═══════════════════════════════════════════════════════════════════
```
