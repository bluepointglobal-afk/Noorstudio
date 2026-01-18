# SCOPE.md - NoorStudio Project Scope

**Generated:** 2026-01-18
**Goal:** Production-ready Islamic children's book builder with payments

---

## Product Definition

| Attribute | Value |
|-----------|-------|
| Product Type | SaaS Web Application |
| Market | B2C (Creators, Parents, Educators) |
| Target Persona | Muslim content creators, homeschool parents, Islamic educators |
| Primary Outcome | Enable anyone to create professional Islamic children's books with AI |

---

## Executive Summary

NoorStudio is an AI-powered platform for creating Islamic children's literature. The core AI pipeline (text → illustrations → layout → cover) is **95% complete**. The critical gap is **export functionality** - users can generate beautiful books but cannot download them.

---

## Feature Status Matrix

| # | Feature | Status | Completion | Blocks |
|---|---------|--------|------------|--------|
| 1 | Image Generation (NanoBanana) | ✅ DONE | 100% | — |
| 2 | Layout Stage | ✅ DONE | 100% | — |
| 3 | Cover Stage | ✅ DONE | 100% | — |
| 4 | **PDF/EPUB Export** | 🔴 CRITICAL | 40% | Users downloading books |
| 5 | Stripe Payments | 🟡 PARTIAL | 10% | Production launch |
| 6 | Data Persistence | ❌ MISSING | 0% | Multi-device, scale |
| 7 | Compliance Guard | 🟡 PARTIAL | 50% | Quality assurance |
| 8 | Analytics Dashboard | ❌ MISSING | 0% | Business insights |
| 9 | Content Library | ❌ MISSING | 0% | Faster creation |
| 10 | Batch Operations | ❌ MISSING | 0% | Power users |

---

## What's Working

### AI Pipeline (Complete)
```
Outline → Chapters → Humanize → Illustrations → Cover → Layout
   ✅         ✅          ✅           ✅          ✅       ✅
```

### Core Systems
- **Authentication**: Supabase JWT + demo mode
- **Project Management**: CRUD, 4 templates, autosave (localStorage)
- **Character Studio**: Visual DNA, 12 poses, modesty rules
- **Knowledge Base**: Faith rules, vocabulary, illustration guidelines
- **Credit System**: Server-side enforcement, 3 tiers
- **Rate Limiting**: 30 req/10min text, 15 req/10min images

### AI Providers
- **Text**: Claude claude-sonnet-4-20250514 via server proxy
- **Images**: NanoBanana pixar-3d-v1 with retry + fallback

---

## Critical Gap: Export

**Current State:**
- UI exists with format selection and metadata display
- Export artifact types defined
- Stale detection works (knows when regeneration needed)
- **NO file generation** - pdfkit/epub-gen not integrated
- **NO storage** - Supabase Storage bucket unused

**What Users Experience:**
1. Create amazing book with AI ✅
2. Generate beautiful illustrations ✅
3. See layout preview ✅
4. Click "Export" → Nothing happens ❌

---

## Highest-Value Feature: PDF/EPUB Export

**Why This Feature:**
1. **Unblocks entire value chain** - Pipeline is useless without download
2. **Dependencies satisfied** - Layout, Cover, Illustrations all ready
3. **User expectation** - This is THE deliverable
4. **Revenue enabler** - Can't charge for books users can't have

**Implementation Requirements:**
1. PDF generation with jsPDF (browser) or pdfkit (server)
2. EPUB assembly with epub-gen
3. Supabase Storage upload
4. Download URL generation
5. Print-ready variant (bleed, crop marks)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | Express.js + Node.js |
| Database | Supabase PostgreSQL (RLS defined, localStorage used) |
| AI Text | Claude (Anthropic SDK) |
| AI Images | NanoBanana (pixar-3d-v1) |
| Testing | Vitest + RTL |

---

## Core Deliverables

1. **Book Creation Pipeline** - AI-powered outline, chapters, humanization ✅
2. **Visual Generation** - Character poses, illustrations, covers ✅
3. **Layout Composition** - Spread-based page layouts ✅
4. **Export System** - PDF + EPUB download ← BLOCKING
5. **Payment Integration** - Stripe subscriptions + credits ← Next

---

## Success Criteria

MVP is complete when:
1. ✅ User can create a book with AI
2. ✅ User can generate illustrations
3. ✅ User can preview layout
4. ❌ **User can download PDF/EPUB** ← BLOCKING
5. ❌ User can pay for credits ← Next priority

---

## Skipped (Post-MVP)

| Feature | Reason |
|---------|--------|
| i18n | English-only MVP |
| Team Collaboration | Single-user sufficient |
| Batch Operations | Power user feature |
| Analytics | Nice-to-have |
