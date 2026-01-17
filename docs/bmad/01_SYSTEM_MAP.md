# 01_SYSTEM_MAP.md — NoorStudio Baseline Freeze

> Generated: 2026-01-04T13:09:55+01:00  
> Status: BMAD FREEZE PREPARATION (READ-ONLY RECON)

---

## 1. Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend Framework | React 18.3 | EXISTING |
| Build Tool | Vite 5.4 | EXISTING |
| Language | TypeScript 5.8 | EXISTING |
| Styling | TailwindCSS 3.4 + shadcn-ui | EXISTING |
| State Management | TanStack Query 5.83 | EXISTING |
| Routing | react-router-dom 6.30 | EXISTING |
| Backend | Express 4.21 (Node.js) | EXISTING |
| Database | Supabase (PostgreSQL + RLS) | EXISTING |
| Client Storage | localStorage | EXISTING |
| AI Text Provider | Claude (Anthropic SDK) / Mock | EXISTING |
| AI Image Provider | NanoBanana / Mock | EXISTING |
| Testing | Vitest + @testing-library/react | EXISTING |

---

## 2. Entry Points

### 2.1 Client Entry

| File | Purpose |
|------|---------|
| `index.html` | HTML shell |
| `src/main.tsx` | React root mount |
| `src/App.tsx` | Route definitions, providers |

### 2.2 Server Entry

| File | Purpose |
|------|---------|
| `server/index.ts` | Express app bootstrap, middleware, route registration |
| `server/env.ts` | Zod-validated environment configuration |

---

## 3. Routing

### 3.1 Client Routes (react-router-dom)

| Path | Component | Auth Required | Status |
|------|-----------|---------------|--------|
| `/` | `HomePage` | No | EXISTING |
| `/examples` | `ExamplesPage` | No | EXISTING |
| `/pricing` | `PricingPage` | No | EXISTING |
| `/product` | `HomePage` | No | EXISTING |
| `/templates` | `TemplatesPage` | No | EXISTING |
| `/faq` | `HomePage` | No | EXISTING |
| `/demo/:id` | `DemoViewerPage` | No (token required) | EXISTING |
| `/app/dashboard` | `DashboardPage` | **NONE ENFORCED** | EXISTING |
| `/app/universes` | `UniversesPage` | **NONE ENFORCED** | EXISTING |
| `/app/universes/:id` | `UniverseDetailPage` | **NONE ENFORCED** | EXISTING |
| `/app/characters` | `CharactersPage` | **NONE ENFORCED** | EXISTING |
| `/app/characters/new` | `CharacterCreatePage` | **NONE ENFORCED** | EXISTING |
| `/app/characters/:id` | `CharacterDetailPage` | **NONE ENFORCED** | EXISTING |
| `/app/knowledge-base` | `KnowledgeBasePage` | **NONE ENFORCED** | EXISTING |
| `/app/books/new` | `BookBuilderPage` | **NONE ENFORCED** | EXISTING |
| `/app/projects` | `DashboardPage` | **NONE ENFORCED** | EXISTING |
| `/app/projects/:id` | `ProjectWorkspacePage` | **NONE ENFORCED** | EXISTING |
| `/app/billing` | `BillingPage` | **NONE ENFORCED** | EXISTING |
| `/app/settings` | `DashboardPage` | **NONE ENFORCED** | EXISTING |
| `/app/help` | `DashboardPage` | **NONE ENFORCED** | EXISTING |
| `*` | `NotFound` | No | EXISTING |

### 3.2 Server Routes (Express)

| Method | Path | Purpose | Auth | Status |
|--------|------|---------|------|--------|
| GET | `/api/health` | Health check | None | EXISTING |
| POST | `/api/ai/text` | Text generation proxy | None (rate limited) | EXISTING |
| POST | `/api/ai/image` | Image generation proxy | None (rate limited) | EXISTING |
| GET | `/api/ai/status` | Provider status | None | EXISTING |
| POST | `/api/share/upsert` | Create/update shared project | None (rate limited) | EXISTING |
| POST | `/api/share/rotate` | Rotate share token | None | EXISTING |
| GET | `/api/share/status` | Sharing service status | None | EXISTING |

---

## 4. Data Layer

### 4.1 Client-Side Storage (localStorage)

| Key | Purpose | Schema Validation |
|-----|---------|-------------------|
| `noorstudio.characters.v1` | Characters array | `CharacterSchema` |
| `noorstudio.projects.v1` | Projects array | `ProjectSchema` |
| `noorstudio.kb.v1` | Knowledge base items | `KnowledgeBaseItemSchema` |
| `noorstudio.credits.balances.v1` | Credit balances | `CreditBalancesSchema` |
| `noorstudio.credits.ledger.v1` | Credit ledger entries | `CreditLedgerEntrySchema` |
| `noorstudio.plan.v1` | Current plan tier | string enum |
| `noorstudio.demo_mode.v1` | Demo mode flag | boolean |

### 4.2 Server-Side Storage (Supabase)

| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `shared_projects` | Shared project payloads for demo links | EXISTING | EXISTING |

### 4.3 Supabase RLS Policies (shared_projects)

| Policy | Role | Operation | Condition | Status |
|--------|------|-----------|-----------|--------|
| Public read with valid token | anon, authenticated | SELECT | `expires_at IS NULL OR expires_at > NOW()` | EXISTING |
| Block public insert | anon, authenticated | INSERT | `false` | EXISTING |
| Block public update | anon, authenticated | UPDATE | `false` | EXISTING |
| Block public delete | anon, authenticated | DELETE | `false` | EXISTING |
| Service role full access | service_role | ALL | `true` | EXISTING |

---

## 5. Auth Model

| Aspect | Status | Notes |
|--------|--------|-------|
| User accounts | **NOT IMPLEMENTED** | No user table |
| Session management | **NOT IMPLEMENTED** | No auth tokens |
| Route protection | **NOT IMPLEMENTED** | `/app/*` routes unguarded |
| API authentication | **NOT IMPLEMENTED** | Server endpoints accept all requests |
| Supabase Auth | **NOT USED** | Client uses `persistSession: false` |

> **CRITICAL**: All `/app/*` routes and server endpoints lack authentication. Data isolation relies solely on localStorage per-browser.

---

## 6. External Services

| Service | Purpose | Configuration | Status |
|---------|---------|---------------|--------|
| Claude (Anthropic) | AI text generation | `CLAUDE_API_KEY` (server-only) | EXISTING |
| NanoBanana | AI image generation | `NANOBANANA_API_KEY` (server-only) | EXISTING |
| Supabase | Shared project storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client) | EXISTING |

---

## 7. Build & Run Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server + Express server (concurrent) |
| `npm run dev:client` | Start Vite dev server only |
| `npm run server:dev` | Start Express server with hot reload |
| `npm run server:start` | Start Express server (production) |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run preview` | Vite preview |

---

## 8. Component Boundaries

### 8.1 Directory Structure

```
src/
├── App.tsx                    # Route definitions
├── main.tsx                   # React entry
├── components/
│   ├── ui/                    # shadcn-ui components (49 files)
│   ├── layout/                # AppLayout, AppSidebar, Navbar
│   └── shared/                # Reusable business components
├── pages/
│   ├── HomePage.tsx           # Public landing
│   ├── ExamplesPage.tsx       # Public examples
│   ├── PricingPage.tsx        # Public pricing
│   ├── TemplatesPage.tsx      # Public templates
│   ├── DemoViewerPage.tsx     # Public demo viewer
│   ├── NotFound.tsx           # 404
│   └── app/                   # Protected pages (10 files)
├── lib/
│   ├── ai/                    # AI stage runners, prompts, providers
│   ├── storage/               # localStorage CRUD stores
│   ├── supabase/              # Supabase client
│   ├── entitlements/          # Plan limits, feature flags
│   ├── validation/            # Zod schemas
│   ├── models/                # TypeScript types
│   └── utils.ts               # Utilities
├── hooks/                     # Custom hooks (3 files)
└── test/                      # Test files (6 files)

server/
├── index.ts                   # Express app
├── env.ts                     # Environment validation
├── errors.ts                  # Error classes
└── routes/
    ├── ai.ts                  # AI proxy routes
    └── share.ts               # Share routes
```

### 8.2 Major Components

| Component | Responsibility | Lines | Status |
|-----------|---------------|-------|--------|
| `ProjectWorkspacePage` | Book creation pipeline UI | ~1936 | EXISTING |
| `BookBuilderPage` | New project wizard | ~1000+ | EXISTING |
| `CharacterDetailPage` | Character editor | ~1000+ | EXISTING |
| `KnowledgeBasePage` | KB management | ~700+ | EXISTING |
| `DemoViewerPage` | Public demo viewer | ~900+ | EXISTING |
| `stageRunner.ts` | AI pipeline execution | 526 | EXISTING |
| `projectsStore.ts` | Project CRUD | 689 | EXISTING |
| `charactersStore.ts` | Character CRUD | 979 | EXISTING |

---

## 9. Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT                                        │
│                                                                              │
│  ┌────────────┐     ┌──────────────┐     ┌───────────────────┐              │
│  │   Pages    │────►│  lib/storage │────►│   localStorage    │              │
│  │ (React)    │     │   *Store.ts  │     │ (per-browser)     │              │
│  └────────────┘     └──────────────┘     └───────────────────┘              │
│        │                                                                     │
│        │ AI requests                                                         │
│        ▼                                                                     │
│  ┌──────────────────┐                                                        │
│  │ lib/ai/providers │                                                        │
│  │ textProvider.ts  │                                                        │
│  │ imageProvider.ts │                                                        │
│  └────────┬─────────┘                                                        │
│           │ HTTP /api/*                                                      │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                 SERVER                                         │
│                                                                               │
│  ┌────────────────┐     ┌─────────────────┐     ┌─────────────────────┐      │
│  │ routes/ai.ts   │────►│ Claude API      │     │                     │      │
│  │ routes/share.ts│     │ NanoBanana API  │     │                     │      │
│  └────────────────┘     └─────────────────┘     │                     │      │
│           │                                      │      Supabase       │      │
│           │ service_role writes                 │   (shared_projects) │      │
│           └────────────────────────────────────►│                     │      │
│                                                  └─────────────────────┘      │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Out of Scope

The following are **NOT** part of the current system and are **OUT OF SCOPE** for this freeze:

| Item | Reason |
|------|--------|
| User authentication | Not implemented |
| User registration/login | Not implemented |
| Multi-tenant data isolation | Not implemented |
| Payment/Stripe integration | Not implemented |
| Email notifications | Not implemented |
| Real-time collaboration | Not implemented |
| Mobile apps | Not implemented |
| CI/CD pipelines | Not documented/found |
| Production deployment configuration | Not found |
| Backend database (beyond shared_projects) | Not implemented |

---

## 11. Uncertainty Log

| Item | Uncertainty |
|------|-------------|
| Production deployment | No deployment config found; unclear how app is deployed |
| Demo mode behavior | `isDemoMode()` defaults to `true` in DEV, unclear production behavior |
| Rate limiting | In-memory only; resets on server restart |
| Credit system persistence | localStorage only; no server-side enforcement |
| Plan/entitlement enforcement | Client-side only; trivial to bypass |

---

*End of SYSTEM_MAP.md*
