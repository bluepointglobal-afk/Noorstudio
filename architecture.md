# NoorStudio Architecture

NoorStudio is a full-stack platform designed to assist authors in creating high-quality Islamic children's literature using AI-driven pipelines. The system emphasizes cultural accuracy, religious adherence (Knowledge Base rules), and an engaging user experience.

## 🏗️ System Overview

The application follows a modern cloud-native architecture centered around a **Vite/React** frontend, a **Supabase** backend-as-a-service, and a specialized **AI Stage Runner** for deterministic content generation.

---

## 💻 Frontend Architecture

### Tech Stack
- **Framework**: React 18 with Vite (TypeScript)
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI primitives)
- **Data Fetching**: TanStack Query (React Query) v5
- **Routing**: React Router DOM v6
- **State Management**: Specialized Stores (Credits, KnowledgeBase, Project) using local patterns and Supabase synchronization.

### Key Components
- **Workspace Engine**: `ProjectWorkspacePage.tsx` manages the high-level project state and AI pipeline execution.
- **Book Builder**: `BookBuilderPage.tsx` provides the interface for chapter-by-chapter generation and review.
- **Character/Universe Management**: CRUD interfaces for building the context that feeds into the AI prompts.
- **AI Pipeline Feedback**: Real-time progress tracking, token budget monitoring, and JSON parse error recovery banners.

---

## ⚙️ Backend Architecture

### Supabase Integration
- **PostgreSQL**: Stores relational data for:
  - `projects`: Metadata, synopsis, and age ranges.
  - `chapters`: Generated text, vocabulary notes, and edits.
  - `characters`: Descriptions, traits, and roles.
  - `universes`: World-building context.
  - `knowledge_bases`: Faith rules, vocabulary guidelines, and illustration rules.
- **Auth**: Managed user sessions and access control levels.
- **Edge Functions**: (Likely) Handles secure tasks like Stripe webhook processing and direct AI provider communication (Claude).

### Proxy/Dev Server (`server/`)
- **Express / TSX**: A custom backend layer that acts as a secure proxy for AI providers and Supabase.
- **Middleware Chain**:
    - **Security**: Baseline HTTP hardening via `helmet` with custom CSP for Supabase and known AI providers.
    - **Rate Limiting**: Path-based in-memory rate limiting to prevent abuse.
    - **Auth Enforcement**: Validates Supabase JWTs before allowing access to sensitive routes.
    - **Credit Gatekeeper**: A critical `creditMiddleware` that:
        - Checks user balances (Character/Book credits) before executing AI tasks.
        - Enforces global project-level token budgets (e.g., `totalBookMaxTokens`).
        - Deducts credits via server-side RPCs to ensure integrity.
- **Environment Management**: Robust `.env` validation to ensure secrets (Supabase Keys, AI Keys) are never leaked to the client.

---

## 🧠 AI Engine & Pipeline

The core value proposition of NoorStudio is its **deterministic AI pipeline**.

### Multi-Stage Workflow
1.  **Outline Generation**: Converts synopsis and characters into a structured 4-chapter narrative arc.
2.  **Chapter Drafting**: Executes detailed generation for each chapter using character context and Knowledge Base (KB) rules.
3.  **Humanization/Editing**: A dedicated stage to refine AI-typical phrasing into natural, age-appropriate prose while preserving Islamic *adab* (manners).

### Robustness Features
- **JSON Schema Enforcement**: Strict requirements for structured outputs to prevent parsing failures.
- **JSON Repair Logic**: Automatic fallback mechanism using a secondary "Repair Prompt" if the initial output is malformed.
- **Stage Runner**: Orchestrates stages, handles retry logic, and manages token budgets to prevent cost overruns.
- **Context Injection**: Dynamically assembles prompts by injecting character summaries and KB rules proportionally to stay within context window limits.

---

## 💳 Entitlements & Credits

- **Stripe Integration**: Handles subscriptions and one-time credit top-ups.
- **Credit Store**: Tracks usage across the platform. AI operations (Stage Runners) consume credits upon successful completion or successful recovery.
- **Plan Enforcement**: Limits access to features (e.g., Knowledge Bases, high-tier models) based on the user's current subscription level.

---

## 🧪 Testing & Quality Assurance

- **Vitest**: Unit and integration testing for core logic (Credit stores, AI prompt builders).
- **React Testing Library**: Component-level testing for critical UI flows (AuthGuard, Project Workspace).
- **Pre-Launch SOP**: A rigorous verification process covering:
    - Environment & Build safety.
    - User isolation & Route protection.
    - AI Pipeline integrity & Token discipline.
    - Abuse prevention & Rate limiting.

---

## 📂 Deployment

- **Frontend**: Deployed as a static SPA (likely on Vercel or Netlify).
- **Backend services**: Fully managed by Supabase.
- **CI/CD**: Git-based deployments with automated linting and test runs.
