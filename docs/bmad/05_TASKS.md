# NoorStudio - Foundation Hardening Tasks

Tracking tasks for the P1 Hardening Slice (BMAD-METHOD™).

## Tasks

| ID | Task | Risk ID | Status | Description |
|---|---|---|---|---|
| **T-001** | [Hardening: Disable Demo Mode outside DEV](file:///Users/taoufiq/Documents/GitHub/Noorstudio/src/lib/entitlements/entitlements.ts) | §P1-005 | **DONE** | Restricted `isDemoMode` to `import.meta.env.DEV`. |
| **T-002** | [Hardening: Supabase Auth Gate for /app/*](file:///Users/taoufiq/Documents/GitHub/Noorstudio/src/App.tsx) | §P1-001 | **DONE** | Implemented AuthGuard and protected `/app/*` and `/api/*`. |
| **T-003** | [Hardening: User-based Data Isolation](file:///Users/taoufiq/Documents/GitHub/Noorstudio/src/lib/storage/keys.ts) | §P1-002 | **DONE** | Keyed localStorage data to authenticated user ID. |
| **T-004** | [Hardening: Server-side Credit Enforcement](file:///Users/taoufiq/Documents/GitHub/Noorstudio/server/index.ts) | §P1-004 | **DONE** | Moved credit check and deduction to server-side middleware. |

## Execution Rules
- [x] One task at a time.
- [x] No refactors outside task scope.
- [x] Stop at "good enough to block trivial abuse".
- [x] Record diffs for each task in `walkthrough.md`.

## Metadata
- **Slice:** Foundation Hardening
- **Target:** P1 Risks only
- **Status:** COMPLETED
