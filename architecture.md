# ARCHITECTURE.md - NoorStudio Technical Architecture

> Generated: 2026-01-20
> Gate: 3 - ARCHITECTURE LOCK
> Status: CONFIRMED

---

## Overview

NoorStudio is an AI-powered SaaS platform enabling children (primarily young Muslims) to create and publish illustrated books. The architecture prioritizes:

1. **Speed** - Instant feedback via localStorage + async Supabase sync
2. **Safety** - Server-side API key protection, RLS, rate limiting
3. **Simplicity** - JSONB blobs over complex schemas for MVP agility
4. **Scalability** - Stateless design allows horizontal scaling

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript + Vite | Fast dev/build, type safety |
| UI | Shadcn/Radix + Tailwind CSS | Component library + styling |
| Data Fetching | TanStack Query v5 | API caching and sync |
| Routing | React Router v6 | Client-side navigation |
| Forms | React Hook Form + Zod | Validation |
| Backend | Express.js + TypeScript | API proxy server |
| Database | Supabase PostgreSQL | User data, credits, analytics |
| Auth | Supabase Auth | OAuth + JWT |
| AI Text | Anthropic Claude | Text generation |
| AI Images | NanoBanana (pixar-3d-v1) | Image generation |
| Payments | Stripe | Subscriptions/checkout |
| Export | jsPDF + JSZip | PDF/EPUB generation |
| Testing | Vitest + RTL | Unit and component tests |

---

## Directory Structure

```
/src/                    # Frontend React application
  /components/
    /ui/                 # Shadcn/Radix primitives (50+ components)
    /auth/               # AuthGuard, login flows
    /layout/             # Navigation, sidebar, headers
    /shared/             # Reusable (CharacterCard, BookCoverCard)
  /pages/
    /app/                # Protected routes (Dashboard, Workspace, etc.)
  /lib/
    /ai/                 # AI pipeline (stageRunner, prompts, providers)
    /storage/            # Data persistence (projects, characters, credits)
    /export/             # PDF/EPUB generation
    /stripe/             # Payment integration
    /models/             # Domain type definitions
    /entitlements/       # Plan-based access control
  /hooks/                # Custom React hooks

/server/                 # Express.js backend
  index.ts               # Main app with middleware
  env.ts                 # Environment validation
  /routes/
    ai.ts                # POST /api/ai/text, /api/ai/image
    checkout.ts          # Stripe checkout
    webhooks.ts          # Stripe webhooks
    share.ts             # Demo sharing
  /lib/
    creditProvisioning.ts

/supabase/               # Database migrations
  /migrations/           # SQL migration files

/scripts/                # Automation and workflow
/workflow/               # Gated workflow system
/project-context/        # Auto-generated context files
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐         ┌─────────────┐                      │
│   │ localStorage│◄───────►│   Stores    │                      │
│   │  (instant)  │         │ (React)     │                      │
│   └─────────────┘         └──────┬──────┘                      │
│                                  │                              │
│                           ┌──────▼──────┐                      │
│                           │ React Query │                      │
│                           │  (cache)    │                      │
│                           └──────┬──────┘                      │
│                                  │                              │
└──────────────────────────────────┼──────────────────────────────┘
                                   │ /api/*
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │  Helmet  │  │   CORS   │  │   Rate   │  │   Auth   │      │
│   │ Security │  │          │  │  Limiter │  │ Middleware│      │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│        └──────────────┴──────────────┴──────────────┘          │
│                              │                                  │
│                       ┌──────▼──────┐                          │
│                       │   Credit    │                          │
│                       │ Middleware  │                          │
│                       └──────┬──────┘                          │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌────────────┐     ┌────────────┐     ┌────────────┐
    │  Anthropic │     │ NanoBanana │     │   Stripe   │
    │   Claude   │     │   Images   │     │  Payments  │
    └────────────┘     └────────────┘     └────────────┘
                               │
                               ▼
                      ┌────────────────┐
                      │    Supabase    │
                      │  (PostgreSQL)  │
                      └────────────────┘
```

---

## Domain Models

### Core Entities

```typescript
// Universe - Series container
Universe {
  id: string
  name: string
  description: string
}

// Character - Reusable across books
Character {
  id: string
  name: string
  role: string
  ageRange: string
  traits: string[]
  appearance: AppearanceConfig
  visualDNA: {
    colorPalette: string[]
    modestyRules: ModestyConfig
    characterStyle: string
  }
  poseSheet: PoseSheet  // 12 standard poses
}

// BookProject - Main entity
BookProject {
  id: string
  title: string
  universeId: string
  template: TemplateType
  ageRange: AgeRange
  stage: ProjectStage
  characterIds: string[]
  artifacts: ArtifactContainer
}
```

### Pipeline Stages

```
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│ outline │──►│ chapters │──►│ humanize │──►│ illustrations│
└─────────┘   └──────────┘   └──────────┘   └──────────────┘
                                                    │
┌─────────┐   ┌──────────┐   ┌──────────┐          │
│completed│◄──│  export  │◄──│  cover   │◄──┬──────┘
└─────────┘   └──────────┘   └──────────┘   │
                                            │
                             ┌──────────┐   │
                             │  layout  │◄──┘
                             └──────────┘
```

### Artifact Types

| Stage | Artifact | Content |
|-------|----------|---------|
| outline | OutlineArtifact | chapters[], synopsis, generatedAt |
| chapters | ChapterArtifact[] | chapterNumber, title, content, wordCount |
| illustrations | IllustrationArtifact[] | chapterNumber, scene, imageUrl, variants[] |
| layout | LayoutArtifact | pageCount, spreads[], settings |
| cover | CoverArtifact | frontCoverUrl, backCoverUrl |
| export | ExportArtifact[] | format, fileUrl, fileSize |

---

## AI Integration

### Text Generation (Claude)

**Flow:**
1. Client calls `stageRunner.runStage(projectId, stage)`
2. Server validates auth + credits at `/api/ai/text`
3. Server calls Anthropic SDK `messages.create()`
4. Response parsed, artifacts stored in project JSONB
5. Credits deducted, usage logged

**Prompt Strategy:**
- System prompts set Islamic/cultural context
- Character + knowledge base injected into user prompt
- Token budget enforced per stage
- JSON schema enforcement for structured outputs

**Token Limits:**
```typescript
GLOBAL_LIMITS = {
  totalBookMaxTokens: 100_000,
  chapterMaxTokens: 4_000,
  outlineMaxTokens: 1_500
}
```

### Image Generation (NanoBanana)

**Flow:**
1. Scene description extracted from chapter text
2. Character visual DNA referenced in prompt
3. NanoBanana API returns image URL
4. 3 variants generated per scene (user selects)

**Model:** `pixar-3d-v1` (3D character rendering)

**Consistent Character Challenge:**
- Character visual DNA must persist across all illustrations
- Pose sheet provides reference for different angles
- Style consistency enforced via prompt engineering

---

## Data Persistence

### Three-Layer Strategy

| Layer | Purpose | Speed | Reliability |
|-------|---------|-------|-------------|
| localStorage | Instant access, offline | Fastest | Device-only |
| Supabase | Cross-device persistence | Fast | Durable |
| Demo Mode | Public sharing | Fast | Read-only |

### Storage Pattern

```typescript
// All stores follow this pattern
class ProjectsStore {
  // Layer 1: localStorage (immediate)
  getLocal(id: string): Project
  saveLocal(project: Project): void

  // Layer 2: Supabase (persistent)
  async syncToServer(project: Project): Promise<void>
  async fetchFromServer(id: string): Promise<Project>

  // Fallback logic
  async get(id: string): Promise<Project> {
    const local = this.getLocal(id)
    if (local) return local
    return this.fetchFromServer(id)
  }
}
```

### Database Schema

```sql
-- Core tables (all have RLS)

projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT,
  data JSONB,  -- Full project blob
  created_at, updated_at
)

characters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  data JSONB,  -- Full character blob
  created_at, updated_at
)

profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  character_credits INTEGER,
  book_credits INTEGER,
  plan TEXT,
  created_at, updated_at
)

ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  provider TEXT,
  stage TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  credits_charged INTEGER,
  success BOOLEAN
)
```

---

## Credit System

### Three-Tier Enforcement

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: Client UI                                               │
│ - Check balance before showing "Generate" button                │
│ - Display warnings when low                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ TIER 2: Server Middleware                                       │
│ - Validate credits before AI call                               │
│ - Return 402 Payment Required if insufficient                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ TIER 3: Supabase RPC                                            │
│ - Atomic deduction after successful generation                  │
│ - Ledger entry for audit trail                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Credit Costs

| Operation | Credits |
|-----------|---------|
| Outline | 3 |
| Chapters (all) | 10 |
| Illustration (per chapter) | 2 |
| Cover (front + back) | 5 |
| Humanize | 2 |
| Layout | 3 |
| Export | 2 |

### Plan Tiers

| Plan | Character Credits | Book Credits |
|------|-------------------|--------------|
| Creator (free) | 10 | 15 |
| Author | 30 | 50 |
| Studio | 100 | 200 |

---

## Security Architecture

### Server-Side Protection

```typescript
// Middleware stack order
app.use(helmet())           // HTTP security headers
app.use(cors({ origin }))   // CORS restriction
app.use(rateLimiter)        // IP-based rate limiting
app.use(authMiddleware)     // JWT validation
app.use(creditMiddleware)   // Credit enforcement
```

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/ai/text | 30 requests | 10 minutes |
| /api/ai/image | 15 requests | 10 minutes |
| /api/share/upsert | 20 requests | 10 minutes |

### Row-Level Security (RLS)

```sql
-- Example: Users can only access own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### API Key Protection

- All provider keys (Claude, NanoBanana, Stripe) stored server-side only
- Client calls `/api/*` endpoints, never direct to providers
- Service role key never exposed to frontend

---

## Export System

### Supported Formats

| Format | Library | Use Case |
|--------|---------|----------|
| PDF (Standard) | jsPDF | Digital reading |
| PDF (Print) | jsPDF | Print-ready with bleed |
| EPUB | JSZip | E-readers |

### Export Pipeline

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Layout  │──►│  Compose │──►│ Generate │──►│ Download │
│ Artifact │   │  Pages   │   │   File   │   │   Blob   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### Trim Sizes

- 6x9 (standard)
- 7x10 (premium)
- 8.5x11 (large)

---

## API Endpoints

### Public

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/health | Health check |
| GET | /demo/:id | View shared project |

### Protected (Auth Required)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/ai/text | Generate text via Claude |
| POST | /api/ai/image | Generate image via NanoBanana |
| POST | /api/checkout | Create Stripe checkout |
| POST | /api/share/upsert | Save project for sharing |

### Webhooks

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/webhooks | Stripe event handler |

---

## Environment Variables

### Client (VITE_ prefix)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_TEXT_PROVIDER=claude
VITE_AI_IMAGE_PROVIDER=nanobanana
```

### Server

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI Providers
CLAUDE_API_KEY=
NANOBANANA_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Server
CLIENT_ORIGIN=http://localhost:3005
NODE_ENV=development
PORT=3005
```

---

## Deployment

### Frontend
- SPA built via `npm run build`
- Deploy to Vercel, Netlify, or S3 + CloudFront
- Environment variables via VITE_ prefix

### Backend
- Express server on configurable port
- Deploy to Railway, Heroku, or AWS Lambda
- Requires all server env vars

### Database
- Run Supabase migrations in order:
  1. `001_shared_projects.sql`
  2. `002_user_profiles.sql`
  3. `003_ai_usage.sql`
  4. `003_projects_table.sql`
  5. `004_characters_table.sql`
  6. `005_knowledge_base_table.sql`
  7. `006_rls_policies.sql`
  8. `007_analytics_table.sql`

---

## Key Architectural Decisions

### 1. JSONB Over Normalized Schema
**Decision:** Store projects/characters as JSONB blobs
**Rationale:** MVP agility, avoid migration overhead
**Trade-off:** Less queryable, but simpler iteration

### 2. Dual Storage (localStorage + Supabase)
**Decision:** Write to localStorage first, sync to Supabase async
**Rationale:** Instant UX, offline capability
**Trade-off:** Potential sync conflicts (last-write-wins)

### 3. Server-Side AI Proxy
**Decision:** All AI calls routed through Express server
**Rationale:** Protect API keys, enforce rate limits, credit checks
**Trade-off:** Added latency (~50ms)

### 4. Stateless Stage Runner
**Decision:** Each pipeline stage runs independently
**Rationale:** Failed stages don't block others, easy retry
**Trade-off:** No cross-stage optimization

### 5. Credit System at Multiple Layers
**Decision:** Validate credits at UI, server, and database
**Rationale:** Defense in depth against abuse
**Trade-off:** More complexity, but necessary for SaaS

---

## Future Considerations (Post-MVP)

| Area | Consideration |
|------|---------------|
| Scaling | Move rate limiting to Redis |
| Caching | Add CDN for generated images |
| Analytics | Migrate to dedicated analytics service |
| Multi-tenant | Add organization/team support |
| i18n | Add RTL support for Arabic |
| Mobile | React Native or PWA |
