# MILESTONE_1.md (Outline) — NoorStudio

Milestone 1 should align to **SCOPE.md** priorities:

1) **Image generation + consistent character** (1st priority)
2) **PDF/EPUB export** (2nd priority)

This outline is deliberately scoped to land a demonstrable, reliable core loop:

**Create book → Generate chapters → Generate illustrations with consistent character → Export a real PDF + EPUB**

---

## 1. Objective

Ship a usable MVP-quality pipeline where a user can produce a publishable book package (PDF + EPUB) in under ~60 minutes, with character consistency across illustrations.

---

## 2. Deliverables

### D1 — Consistent Character Illustrations

- Character “Visual DNA” reliably influences every illustration prompt.
- Pose sheet usage (12 poses) integrated as references.
- Variant selection persists (selectedVariantId → imageUrl).
- Clear user-facing controls for:
  - regenerate scene
  - regenerate variant
  - choose variant
  - lock character style

### D2 — Real Export (not stub)

- Export stage produces:
  - **PDF** generated via `jsPDF`
  - **EPUB** generated via `JSZip`
- Export artifact stores downloadable blobs/URLs (depending on architecture choice):
  - local download via `downloadBlob()`
  - optional Supabase Storage upload in later milestone

### D3 — Reliability & Guardrails

- Stage dependency enforcement works (canRunStage)
- Parse-repair flow is stable (raw output, retry parse, regenerate)
- Credit enforcement matches stage completion (charge only on success)
- Rate limiting enforced server-side for real provider modes

---

## 3. Scope (In / Out)

### In

- Pipeline stages: outline, chapters, illustrations, layout, cover, export
- Mock providers remain usable for local demo
- Real provider wiring validated behind server proxy

### Out (post-M1)

- Full cloud persistence (Supabase sync for every artifact)
- Stripe payments end-to-end (checkout + webhooks)
- Multi-tenant / org accounts

---

## 4. Success Criteria (Acceptance)

- A new project can run through **all stages** without manual hacks.
- Illustration set shows strong visual consistency for the selected character.
- Export produces files that open correctly in common readers:
  - PDF: Preview (macOS) / Adobe
  - EPUB: Apple Books / Calibre
- No stage charges credits unless it completes.

---

## 5. Key Workstreams & Tasks

### W1 — Character Consistency System

- [ ] Audit prompt construction in `src/lib/ai/imagePrompts.ts`
- [ ] Ensure character Visual DNA is always injected
- [ ] Add pose sheet references pipeline (URLs, selection)
- [ ] Add test fixtures for prompt assembly
- [ ] Add UI affordances to “lock style” and warn on drift

### W2 — Export Stage (Real)

- [ ] Wire UI `export` stage to `runExportStage` (currently uses mock job runner)
- [ ] Ensure export prerequisites exist (`layout`, `chapters`, optional `cover`/`illustrations`)
- [ ] Implement download UX (PDF + EPUB buttons)
- [ ] Add minimal regression tests around `generatePDF` + `generateEPUB`

### W3 — Pipeline UX & Failure Recovery

- [ ] Standardize stage progress reporting
- [ ] Improve parse error banner flows for outline/chapters/humanize
- [ ] Add “reset from here” (invalidate downstream stages)

### W4 — Server Proxy Hardening (for real keys)

- [ ] Validate env + providers
- [ ] Confirm middleware order: helmet/cors/rate-limit/auth/credits
- [ ] Verify `/api/ai/text` and `/api/ai/image` return useful errors

---

## 6. Risks / Failure Points

- Character drift despite prompt injection (needs reference-image strategy + pose sheet usage)
- Export formatting edge cases (fonts, pagination, image sizing)
- Client-side memory limits for large PDFs/EPUBs
- Auth/credits/rate-limits not aligned across mock vs real providers

---

## 7. Demo Script (Milestone Exit)

1. Start app (`npm run dev`)
2. Create project with 1 character
3. Run outline → chapters
4. Run illustrations (select best variants)
5. Run layout → cover
6. Run export → download PDF + EPUB
7. Open files in native viewers
