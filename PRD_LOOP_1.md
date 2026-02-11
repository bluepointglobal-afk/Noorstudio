# PRD: NoorStudio — Loop 1 Fixes

## Source
- Walker Report: ~/m2m_reports/noorstudio_phase4_loop1_docker.md
- Walker Score: 5.6/10
- Repo: ~/.openclaw/workspace/03_REPOS/Noorstudio/
- Tech: React + TypeScript (Vite) + Supabase
- Date: 2026-02-11

## P0 Fixes (must ship this loop)

### P0-1: ALL CHAPTERS IDENTICAL

- **What's broken:** After generating chapters (3 credits), all 4 chapters contained exact same text ("Amira woke up early that morning..."). Critical content generation bug.
- **Evidence:** Walker tested book generation with chapter flow. All 4 chapters returned identical content instead of unique narrative progression.
- **Expected behavior:** Each chapter should have unique story progression. Chapter 1 introduces protagonist, Chapter 2 develops conflict, Chapter 3 escalates, Chapter 4 resolves.
- **Affected files (from repo):** 
  - `src/services/` (AI generation API calls)
  - `src/pages/app/DashboardPage.tsx` (chapter generation UI)
  - Likely: chapter generation prompt template not varying by chapter index
- **Acceptance criteria:**
  - [ ] Generate 4-chapter book and verify each chapter has different text
  - [ ] Chapter 2+ reference events from Chapter 1 (narrative continuity)
  - [ ] No duplicate sentences across chapters
  - [ ] Staged/deployed to https://noorstudio-staging.vercel.app/ with test book visible

### P0-2: STORY IGNORES USER INPUT

- **What's broken:** Book titled "Yusuf Learns to Share" but story about Amira. Setting "Jeddah during Ramadan" but generated "village beyond the hills." AI not using synopsis, title, or setting.
- **Evidence:** Walker provided specific inputs (title, character name, setting) but story ignored them entirely. Appeared to use default/cached template instead of user input.
- **Expected behavior:** Story must incorporate:
  - Character name (Yusuf, Maryam, Ibrahim, etc.) in opening and throughout
  - Setting (Jeddah, school, home, mosque, etc.) in descriptions
  - Synopsis/theme (Learns to Share, Prophet Stories, etc.) in core narrative
- **Affected files:**
  - `src/services/` (AI prompt construction)
  - `src/pages/app/DashboardPage.tsx` (input collection)
  - Likely: user inputs not being passed to AI model or prompt template not using placeholders
- **Acceptance criteria:**
  - [ ] Create book with title "Maryam's Honesty Adventure" → story includes Maryam by name in Chapter 1
  - [ ] Create book with setting "Mosque in Riyadh" → story mentions Riyadh and mosque scenes
  - [ ] Create book with theme "Learning Salah" → core story about salah/prayer practice
  - [ ] Deployed to staging with test books confirming input usage

### P0-3: NO FREE TIER VISIBLE

- **What's broken:** Pricing shows $29/$79/$199. No free trial. Demo auto-logged as "Author Demo" is confusing. New users cannot try product before paying.
- **Evidence:** Walker looking for free trial or demo mode found none. Only paid tiers displayed. No "Try for Free" button or freemium option.
- **Expected behavior:** Provide one of:
  - Option A: Free tier (1 book/month, limited illustrations)
  - Option B: Free trial (7 days, full access, then paywall)
  - Option C: Demo mode (pre-made sample books with real children's names injected)
- **Affected files:**
  - `src/pages/PricingPage.tsx` (pricing display)
  - Auth/entitlements system (free tier logic)
  - Likely: pricing page only shows paid tiers, no free option configured
- **Acceptance criteria:**
  - [ ] Pricing page shows clear free option (tier, limitations, or trial)
  - [ ] New user can generate 1 free sample book without payment
  - [ ] Paid tiers clearly shown with SAR pricing (not USD)
  - [ ] Deployed to staging with free trial flow working

## P1 Fixes (if time permits after P0s)

From walker report:
- 7-stage manual pipeline (each chapter: generate → review → approve → repeat)
- No SAR pricing (USD only, target market is Saudi)
- "Universe & Knowledge Base" jargon confusing for new users
- No WhatsApp sharing (GCC default sharing channel)
- Mobile sidebar overlays entire screen
- No custom character creation (only templates)
- Disabled buttons give no feedback (no tooltip, no loading)
- No Arabic UI / RTL support

(Detail only if P0s ship with time remaining)

## Out of Scope This Loop

- P2s (character library, collaborative editing, versioning, EPUB export, progress indicators)
- Major refactors (framework changes, architecture redesign)
- New features not required by walker report

## Tech Context

- **Framework:** React + TypeScript
- **Hosting:** Vercel (staging: https://noorstudio-staging.vercel.app/)
- **Backend:** Supabase (database + auth)
- **AI:** Anthropic (chapter generation API calls)
- **Build:** `npm run build` / `npm run dev`
- **Likely locations:**
  - AI generation: `src/services/` (look for API calls)
  - Chapter UI: `src/pages/app/DashboardPage.tsx`
  - Pricing: `src/pages/PricingPage.tsx`

## Loop Tracking

- **Loop:** 1
- **Start Date:** 2026-02-11
- **Target Score:** 7.0/10
- **Current Score:** 5.6/10
- **P0s to fix:** 3
- **Exit Criteria:** All 3 P0s fixed + deployed to staging + verified working
