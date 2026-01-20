# Feature Backlog

> Generated: 2026-01-20
> Gate: 4 - EXECUTION
> Aligned with: SCOPE.md (Gate 2)

**Goal:** Child can create and publish their own illustrated book in under an hour
**Ship Order:** Image Gen → Export → Persistence → Payments

---

## Priority Order (from SCOPE.md)

| # | Feature | Status | Actual Gap | Blocks |
|---|---------|--------|------------|--------|
| 1 | **Image Generation + Consistent Character** | 🔴 40% | Prompt mismatch, 12-pose broken, consistency | Illustrations, Covers |
| 2 | PDF/EPUB Export | 🟡 70% | File generation works, needs polish | Users downloading |
| 3 | Data Persistence | ❌ 0% | localStorage only | Multi-device, scale |
| 4 | Stripe Payments | 🟡 10% | Webhook skeleton only | Revenue |

---

## Feature 1: Image Generation + Consistent Character (CURRENT)

**Status:** 🔴 40% - Critical gaps remain

### What's Working
- NanoBanana API connected
- Basic image generation endpoint exists
- Image prompt builder exists
- Character visual DNA structure defined

### Actual Gaps

#### Gap 1.1: Prompt → Image Mismatch
- Visual DNA inputs (colors, clothing, features) don't influence output
- Character descriptions ignored by image generation
- Need to restructure prompts for NanoBanana's model

#### Gap 1.2: 12-Pose Reference Sheet Broken
- Single API call for 12 poses not working
- Need sequential generation with consistent seed
- Pose-specific prompt templates incomplete

#### Gap 1.3: Character Consistency Across Illustrations
- No mechanism to reference character sheet in scene generation
- Characters look different in each illustration
- Solution: Pass 12-pose reference as context for consistency
- Constraint: Max 2-3 characters per scene

#### Gap 1.4: Book Covers Incomplete
- Front cover: Missing title text, author name, proper composition
- Back cover: Missing synopsis area, barcode space, author photo
- Text rendering on images not implemented
- Need best practices for children's book covers

#### Gap 1.5: Chapter-Based Illustration Generation
- No AI analysis of chapter content for scene suggestions
- No automatic illustration opportunity detection
- Scene composition not derived from narrative
- Need: AI suggests 2-3 illustration moments per chapter

### Success Criteria
- [ ] Character visual DNA actually influences generated images
- [ ] 12-pose reference sheet generates correctly
- [ ] Same character looks consistent across all illustrations
- [ ] Front/back covers render with text and proper layout
- [ ] AI suggests illustration scenes from chapter content

---

## Feature 2: PDF/EPUB Export

**Status:** 🟡 70% - Core works, needs polish

### What's Working
- jsPDF integration exists
- EPUB structure defined
- Layout artifact provides page composition
- Download mechanism works

### Remaining Gaps
- Print-ready PDF (bleed, crop marks)
- EPUB metadata completeness
- Cover integration with export
- File size optimization

---

## Feature 3: Data Persistence

**Status:** ❌ 0% - localStorage only

### Current State
- All data in localStorage
- No cloud sync
- Single device only
- Data lost on browser clear

### What's Needed
- Migrate to Supabase tables
- Sync layer for offline capability
- RLS policies for user isolation
- Migration tool for existing localStorage data

---

## Feature 4: Stripe Payments

**Status:** 🟡 10% - Foundation only

### Current State
- Billing UI skeleton exists
- Webhook endpoint stub
- No actual Stripe integration

### What's Needed
- Checkout session creation
- Webhook signature verification
- Credit provisioning on purchase
- Subscription management

---

## Execution Plan

### Phase 1: Image Generation + Consistency (Feature 1)
**Branch:** `ralph/consistent-character-generation`

```
Fix Prompts → 12-Pose Sheet → Consistency → Covers → Chapter Scenes
```

### Phase 2: Export Polish (Feature 2)
Finalize PDF/EPUB with covers integrated.

### Phase 3: Persistence (Feature 3)
Move to Supabase, enable multi-device.

### Phase 4: Payments (Feature 4)
Enable revenue before public launch.

---

## Skipped (Post-MVP)

| Feature | Reason |
|---------|--------|
| i18n | English-only MVP |
| Team Collaboration | Single-user sufficient |
| Batch Operations | Power user feature |
| Analytics Dashboard | Nice-to-have |
| Content Library | Post-launch expansion |

---

## Next Action

Execute Feature #1 with Ralph:
```bash
./scripts/ralph/ralph.sh 10
```
