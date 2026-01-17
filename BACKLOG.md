# Feature Backlog

Generated from STATUS.md on 2026-01-17

**Goal:** Production with payments (full monetization)
**Timeline:** No fixed deadline (quality over speed)
**Skipping:** i18n, team collaboration (placeholders for future)

---

## Priority Order

Features ordered by dependency chain. Complete top-to-bottom.

| # | Feature | Status | Blocks | PRD | Ralph |
|---|---------|--------|--------|-----|-------|
| 1 | Image Generation (NanoBanana) | 🟡 60% | Illustrations, Cover, full pipeline | ⬜ | ⬜ |
| 2 | Layout Stage | 🟡 20% | Export (need page composition) | ⬜ | ⬜ |
| 3 | Cover Stage | 🟡 20% | Export (need cover images) | ⬜ | ⬜ |
| 4 | PDF/EPUB Export | 🟡 40% | Users downloading books | ⬜ | ⬜ |
| 5 | Stripe Payments | 🟡 10% | Production launch, monetization | ⬜ | ⬜ |
| 6 | Data Persistence (Supabase) | ❌ Missing | Scale, multi-device access | ⬜ | ⬜ |
| 7 | Compliance Guard | 🟡 50% | Automated quality assurance | ⬜ | ⬜ |
| 8 | Analytics Dashboard | ❌ Missing | Business insights | ⬜ | ⬜ |
| 9 | Content Library | ❌ Missing | Faster book creation | ⬜ | ⬜ |
| 10 | Batch Operations | ❌ Missing | Power user workflows | ⬜ | ⬜ |

---

## Feature Details

### 1. Image Generation (NanoBanana API)
**Current state:** Mock provider works, prompt builder exists, NanoBanana stub at `src/lib/ai/providers/imageProvider.ts:45+`
**What's needed:**
- Connect to NanoBanana API (pixar-3d-v1 model)
- Character reference sheet generation (12 poses)
- Illustration generation with character consistency
- Server proxy route for API key security
**Dependencies:** None (first in chain)
**Unblocks:** Illustrations stage, Cover stage, full book creation pipeline

---

### 2. Layout Stage
**Current state:** Type definitions exist in `src/lib/types/artifacts.ts`, no execution logic
**What's needed:**
- Layout generation prompts (text + image placement)
- SpreadLayout composition algorithm
- Page type handling (text-only, image-only, mixed)
- Integration with stageRunner.ts
**Dependencies:** Image Generation (needs illustrations to place)
**Unblocks:** Export (need composed pages)

---

### 3. Cover Stage
**Current state:** Type definitions only, no prompt logic
**What's needed:**
- Cover prompt generation (front cover with title, author, illustration)
- Back cover composition (synopsis, barcode area)
- Spine text formatting for print
- Integration with image generation
**Dependencies:** Image Generation
**Unblocks:** Export (need cover files)

---

### 4. PDF/EPUB Export
**Current state:** UI exists, metadata structure defined, stale detection works, no file generation
**What's needed:**
- PDF generation (pdfkit or similar)
- EPUB assembly (epub-gen or similar)
- File bundling/compression
- Supabase Storage upload
- Download URL generation
- Print-ready PDF variant (bleed, crop marks)
**Dependencies:** Layout Stage, Cover Stage
**Unblocks:** Users can actually download finished books

---

### 5. Stripe Payments
**Current state:** Billing UI skeleton at `src/pages/app/BillingPage.tsx`, no backend
**What's needed:**
- Stripe webhook endpoint (`/api/stripe/webhook`)
- Checkout session creation
- Subscription management (create, update, cancel)
- Credit purchase flow (one-time)
- Invoice history
- Webhook signature verification
- Plan upgrade/downgrade handling
**Dependencies:** None (can parallelize with 1-4)
**Unblocks:** Production launch, revenue

---

### 6. Data Persistence (localStorage → Supabase)
**Current state:** All data in localStorage, won't scale
**What's needed:**
- Migrate projectsStore to Supabase tables
- Migrate charactersStore to Supabase
- Migrate knowledgeBaseStore to Supabase
- Sync layer for offline capability (optional)
- Row-level security policies
**Dependencies:** None (can parallelize)
**Unblocks:** Multi-device access, data durability, scale

---

### 7. Compliance Guard (Auto-checking)
**Current state:** Modesty rules engine exists at `src/lib/ai/complianceGuard.ts`, no post-generation checking
**What's needed:**
- Post-generation image analysis
- Automated flagging for non-compliant images
- Compliance report per illustration
- Manual review queue UI
- Re-generation trigger for failed checks
**Dependencies:** Image Generation (need images to check)
**Unblocks:** Quality assurance at scale

---

### 8. Analytics Dashboard
**Current state:** `ai_usage` telemetry table exists, no UI
**What's needed:**
- Usage metrics visualization
- Credit consumption trends
- Popular templates/features
- User activity dashboard
- Export reports
**Dependencies:** Data Persistence (better with real data)
**Unblocks:** Business insights, optimization decisions

---

### 9. Content Library
**Current state:** 4 hardcoded book templates only
**What's needed:**
- Reusable story templates
- Character template library
- Setting/world templates
- Community sharing (future)
- Template categorization and search
**Dependencies:** None
**Unblocks:** Faster book creation, better onboarding

---

### 10. Batch Operations
**Current state:** None
**What's needed:**
- Bulk character generation
- Bulk export (multiple books)
- Batch illustration regeneration
- Queue management UI
**Dependencies:** Image Generation, Export
**Unblocks:** Power user efficiency

---

## Execution Plan

### Phase 1: Complete the Pipeline (Features 1-4)
Get a book from idea to downloadable PDF.

```
Image Gen → Layout → Cover → Export
```

### Phase 2: Monetization (Feature 5)
Enable payments before public launch.

### Phase 3: Scale & Polish (Features 6-7)
Data persistence and quality assurance.

### Phase 4: Growth (Features 8-10)
Analytics, templates, power features.

---

## Skipped (Future Placeholders)

| Feature | Reason | Future Notes |
|---------|--------|--------------|
| i18n/Multi-language | English-only MVP | Use react-i18next, extract all strings |
| Team Collaboration | Single-user sufficient | Add workspace/team tables, invite flow |

---

## Next Action

Start with Feature #1:
```
Use @scripts/01-create-prd.md
Feature: NanoBanana image generation integration
Reference: @STATUS.md @BACKLOG.md
```
