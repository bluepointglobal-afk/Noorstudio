# 02_RISKS.md — NoorStudio Risk Assessment

> Generated: 2026-01-04T13:09:55+01:00  
> Status: BMAD FREEZE PREPARATION (READ-ONLY RECON)

---

## Risk Ranking Legend

| Priority | Meaning |
|----------|---------|
| **P1** | Critical — must address before production use with real users |
| **P2** | High — significant security or reliability gap |
| **P3** | Medium — technical debt or operational risk |

---

## P1 — Critical Risks

### P1-001: No Authentication Exists

| Aspect | Detail |
|--------|--------|
| **Location** | All `/app/*` routes, all `/api/*` endpoints |
| **Description** | No user authentication or session management is implemented. Any browser can access any `/app/*` route. Any client can call any `/api/*` endpoint. |
| **Attack Surface** | Full system access for any actor. No user identity. No access control. |
| **Evidence** | `src/App.tsx` routes lack guards; `server/routes/*.ts` lack auth middleware; `src/lib/supabase/client.ts:31` explicitly states "No auth needed" |

---

### P1-002: No Data Isolation Between Users

| Aspect | Detail |
|--------|--------|
| **Location** | Client localStorage; all storage modules under `src/lib/storage/` |
| **Description** | All user data (characters, projects, KBs, credits) is stored in browser localStorage. There is no server-side persistence of user data. Multi-device access requires sharing via demo links. |
| **Attack Surface** | Data loss on browser clear; no multi-device sync; no backup/recovery; cross-browser data not synchronized. |
| **Evidence** | `src/lib/storage/projectsStore.ts`, `charactersStore.ts`, `creditsStore.ts`, `knowledgeBaseStore.ts` all use localStorage only |

---

### P1-003: Server Endpoints Lack Authentication

| Aspect | Detail |
|--------|--------|
| **Location** | `server/index.ts`, `server/routes/ai.ts`, `server/routes/share.ts` |
| **Description** | All API endpoints (`/api/ai/*`, `/api/share/*`) accept requests without authentication. Rate limiting by IP is the only protection. |
| **Attack Surface** | API abuse; credit exhaustion attacks; unauthorized AI usage consuming Claude/NanoBanana quota; unauthorized project sharing. |
| **Evidence** | No auth middleware in `server/index.ts`; routes directly process requests |

---

### P1-004: Credit System Not Server-Enforced

| Aspect | Detail |
|--------|--------|
| **Location** | `src/lib/storage/creditsStore.ts`, `src/lib/entitlements/entitlements.ts` |
| **Description** | Credit balances and plan entitlements are stored in localStorage and validated client-side only. A malicious user can trivially modify localStorage to bypass limits. |
| **Attack Surface** | Unlimited AI generation by editing localStorage; plan spoofing; export bypass. |
| **Evidence** | `creditsStore.ts` uses only localStorage; `entitlements.ts:169` checks `isDemoMode()` which defaults true in DEV; all enforcement is client-side |

---

### P1-005: Demo Mode Bypasses All Limits

| Aspect | Detail |
|--------|--------|
| **Location** | `src/lib/entitlements/entitlements.ts` |
| **Description** | Demo mode (`isDemoMode()`) returns `true` by default in development and can be toggled via localStorage. When enabled, all entitlement checks return `{ allowed: true }`. |
| **Attack Surface** | Any user can enable demo mode to bypass all limits (characters, projects, exports). |
| **Evidence** | `entitlements.ts:10-24` shows demo mode logic; all `can*` functions check `isDemoMode()` first (lines 169, 187, 205, 223) |

---

## P2 — High Risks

### P2-001: Rate Limiting Is In-Memory Only

| Aspect | Detail |
|--------|--------|
| **Location** | `server/index.ts:21-123` |
| **Description** | Rate limiting uses an in-memory Map. On server restart, all rate limit data is lost. In a multi-instance deployment, rate limits are not shared. |
| **Attack Surface** | Rate limit bypass by timing attacks around restarts; distributed attacks across instances. |
| **Evidence** | `rateLimitStore: Map<string, Map<string, RateLimitEntry>>` defined at line 26 |

---

### P2-002: Share Token Validation Incomplete

| Aspect | Detail |
|--------|--------|
| **Location** | `src/lib/supabase/client.ts:69-98`, `server/routes/share.ts:140-142` |
| **Description** | Share tokens are validated by checking if the row exists with matching token. However, the RLS policy only checks expiration, not token match — token matching relies on the WHERE clause in client query. Old tokens (< 32 chars) are silently replaced. |
| **Attack Surface** | If client query omits token filter, expired-but-not-deleted projects could be enumerated. Token length check (`>= 32`) may allow legacy short tokens. |
| **Evidence** | RLS policy at `001_shared_projects.sql:56-62` only checks expiration; token check is in application layer |

---

### P2-003: API Keys in Server Environment

| Aspect | Detail |
|--------|--------|
| **Location** | `server/env.ts`, `server/.env` |
| **Description** | API keys for Claude and NanoBanana are stored as environment variables. The `.env` file is present in `server/` directory. If committed or exposed, keys are compromised. |
| **Attack Surface** | API key leakage; unauthorized billing to key owner. |
| **Evidence** | `server/.env` exists (listed in directory); `.gitignore` should exclude but not verified |

---

### P2-004: Helmet CSP Misconfiguration

| Aspect | Detail |
|--------|--------|
| **Location** | `server/index.ts:130-161` |
| **Description** | CSP includes `'unsafe-inline'` and `'unsafe-eval'` for scripts. This significantly weakens XSS protection. Additionally, helmet is called twice (lines 130 and 159), with conflicting configurations. |
| **Attack Surface** | XSS attacks possible; inline script injection. |
| **Evidence** | Lines 137-138 show unsafe directives; duplicate `helmet` import at lines 8 and 12 |

---

### P2-005: Duplicate Helmet Import

| Aspect | Detail |
|--------|--------|
| **Location** | `server/index.ts:8` and `server/index.ts:12` |
| **Description** | Helmet is imported twice, which will cause a runtime error or shadowing behavior. |
| **Attack Surface** | Potential runtime crash if Node resolves imports differently; security headers may not apply correctly. |
| **Evidence** | Lines 8 and 12 both import helmet |

---

## P3 — Medium Risks

### P3-001: No Input Sanitization for AI Prompts

| Aspect | Detail |
|--------|--------|
| **Location** | `server/routes/ai.ts`, `src/lib/ai/prompts.ts` |
| **Description** | User-provided content (project synopsis, character names, KB content) is directly interpolated into AI prompts without sanitization. Prompt injection possible. |
| **Attack Surface** | Prompt injection could cause AI to output unintended content or leak system prompts. |
| **Evidence** | `prompts.ts` uses template literals with user data; no sanitization visible |

---

### P3-002: No CSRF Protection

| Aspect | Detail |
|--------|--------|
| **Location** | `server/index.ts` |
| **Description** | No CSRF tokens are implemented. POST endpoints accept requests from any origin matching CORS policy. |
| **Attack Surface** | Cross-site request forgery if authenticated sessions are added later. |
| **Evidence** | No csrf middleware; CORS allows `env.CLIENT_ORIGIN` only |

---

### P3-003: localStorage Schema Corruption Handling

| Aspect | Detail |
|--------|--------|
| **Location** | `src/lib/storage/validation.ts` |
| **Description** | Schema validation with "repair" exists, but the repair behavior may silently drop data that doesn't match the schema. |
| **Attack Surface** | Data loss on schema changes; silent corruption. |
| **Evidence** | `validateAndRepair` and `validateArrayAndRepair` functions in validation.ts |

---

### P3-004: No Audit Logging

| Aspect | Detail |
|--------|--------|
| **Location** | System-wide |
| **Description** | No audit logging for API calls, AI usage, or data changes. Incident investigation would be impossible. |
| **Attack Surface** | No forensic capability; compliance issues. |
| **Evidence** | No logging infrastructure found beyond console.log/console.error |

---

### P3-005: Error Stack Traces in Development Mode

| Aspect | Detail |
|--------|--------|
| **Location** | `server/index.ts:214`, `server/routes/ai.ts:352`, `server/routes/share.ts:219` |
| **Description** | Stack traces are included in error responses when `NODE_ENV === "development"`. If production accidentally runs with wrong NODE_ENV, stack traces leak. |
| **Attack Surface** | Information disclosure; path disclosure; internal architecture exposure. |
| **Evidence** | Multiple locations check `env.NODE_ENV === "development"` before including stack |

---

### P3-006: No Input Length Validation on AI Requests

| Aspect | Detail |
|--------|--------|
| **Location** | `server/routes/ai.ts:313-356` |
| **Description** | The `/api/ai/text` endpoint accepts any prompt length. Express JSON limit is 1mb, but no per-field validation. |
| **Attack Surface** | Denial of service via large prompts; excessive token consumption. |
| **Evidence** | Only `body.prompt` existence is checked, not length |

---

### P3-007: Supabase RLS Token Check Gap

| Aspect | Detail |
|--------|--------|
| **Location** | `supabase/migrations/001_shared_projects.sql:56-62` |
| **Description** | The RLS SELECT policy only checks expiration, relying on the application to filter by `share_token`. If a query omits the token filter, all non-expired projects are readable. |
| **Attack Surface** | Project enumeration if client-side code is modified or bypassed. |
| **Evidence** | Policy USING clause: `expires_at IS NULL OR expires_at > NOW()` — no token check in RLS |

---

### P3-008: No Production Deployment Config

| Aspect | Detail |
|--------|--------|
| **Location** | Repository root |
| **Description** | No Dockerfile, docker-compose, Kubernetes manifests, or cloud deployment configurations found. Deployment process is undocumented. |
| **Attack Surface** | Deployment misconfiguration; inconsistent environments. |
| **Evidence** | No deployment-related files in root directory listing |

---

## Risk Summary

| Priority | Count | Action Required |
|----------|-------|-----------------|
| **P1** | 5 | Must address before production with real users |
| **P2** | 5 | Should address for reliable operation |
| **P3** | 8 | Technical debt to track |

---

*End of RISKS.md*
