# SCOPE_LOCK.md - Frozen Scope Snapshot

> Locked: 2026-01-20
> Gate: 2 - SCOPE LOCK
> Status: CONFIRMED BY FOUNDER

---

## Immutable Scope Reference

This file is a frozen snapshot of the confirmed scope. Do not modify.
Reference this when validating deliverables against original intent.

---

## Locked Values

```yaml
product_type: SaaS Web Application
product_name: NoorStudio
market_model: Hybrid B2C → B2B

primary_user: Children (young Muslims)
secondary_user: Parents/Adults
support_user: Educators

one_outcome: "Child can create and publish their own illustrated book in under an hour"

ship_order:
  1: Image Generation + Consistent Character
  2: PDF/EPUB Export
  3: Data Persistence
  4: Stripe Payments

constraints:
  timeline: ASAP
  tech: Preserve existing stack
  compliance:
    - Islamic content guidelines
    - Child safety
    - COPPA considerations
    - Good etiquette

market_gap: "No platform offers end-to-end: Characters → Universes → Knowledge Base → Stories → Multi-channel publishable books"
```

---

## Validation Checklist

Use this to verify MVP completion:

- [ ] Consistent character generation works
- [ ] PDF export produces downloadable file
- [ ] EPUB export produces downloadable file
- [ ] User data saves to Supabase (not just localStorage)
- [ ] Stripe checkout accepts payment
- [ ] Child can complete book in under 1 hour (test)

---

## Change Control

Any changes to scope require:
1. Re-running Gate 2 workflow
2. Founder CONFIRM
3. Update to both SCOPE.md and this file
