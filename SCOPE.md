# SCOPE.md - NoorStudio Project Scope

> Generated: 2026-01-20
> Gate: 2 - SCOPE LOCK
> Status: CONFIRMED

---

## Product Definition

| Attribute | Value |
|-----------|-------|
| Product Type | SaaS Web Application |
| Product Name | NoorStudio |
| Market Model | Hybrid B2C → B2B |
| MVP Market | Families (individual subscriptions) |
| Growth Market | Schools, Islamic centers, homeschool co-ops |

---

## Users

| Persona | Role | Priority |
|---------|------|----------|
| Children | Young Muslims creating their own books | Primary |
| Parents/Adults | Creating books OR supporting children | Secondary |
| Educators | Guiding creativity & entrepreneurship | Support |

---

## One Outcome

> **"Child can create and publish their own illustrated book in under an hour"**

---

## Market Gap

No single platform offers the end-to-end process:

```
Characters → Universes → Knowledge Base → Stories → Multi-channel Publishable Books
```

---

## Ship Order (Priority)

| Order | Feature | Purpose | Status |
|-------|---------|---------|--------|
| 1st | Image Generation + Consistent Character | Core creative experience | 🔴 IN PROGRESS |
| 2nd | PDF/EPUB Export | Deliverable (download books) | 🔴 40% |
| 3rd | Data Persistence | Cloud save, multi-device | ❌ 0% |
| 4th | Stripe Payments | Revenue enablement | 🟡 10% |

---

## What's Working (Preserve)

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

## Tech Stack (Maintain)

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | Express.js + Node.js |
| Database | Supabase PostgreSQL (RLS defined) |
| Storage | Supabase Storage |
| AI Text | Claude (Anthropic SDK) |
| AI Images | NanoBanana (pixar-3d-v1) |
| Testing | Vitest + RTL |

---

## Constraints

### Timeline
- Ship ASAP (urgency, no hard deadline)

### Tech
- Preserve existing stack
- No major rewrites
- Build on what works

### Compliance
- Islamic content guidelines (existing knowledge base)
- Child safety (age-appropriate content)
- COPPA considerations (children as users)
- Good etiquette in AI outputs
- Content moderation for inappropriate inputs

### Already In Place
- Rate limiting (30/15 req limits)
- Server-side credit enforcement

### Consider for MVP
- Parental controls (child accounts)
- Content flagging

---

## Success Criteria

MVP is complete when:

1. ✅ User can create a book with AI
2. ❌ **Consistent character across illustrations** ← 1st priority
3. ❌ **User can download PDF/EPUB** ← 2nd priority
4. ❌ **User data persists to cloud** ← 3rd priority
5. ❌ User can pay for credits ← 4th priority

---

## Skipped (Post-MVP)

| Feature | Reason |
|---------|--------|
| i18n | English-only MVP |
| Team Collaboration | Single-user sufficient |
| Batch Operations | Power user feature |
| Analytics Dashboard | Nice-to-have |
| Multi-channel Publishing | Post-MVP expansion |
