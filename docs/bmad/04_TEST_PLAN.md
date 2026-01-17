# 04_TEST_PLAN.md — NoorStudio Test Coverage Baseline

> Generated: 2026-01-04T13:09:55+01:00  
> Status: BMAD FREEZE PREPARATION (READ-ONLY RECON)

---

## 1. Current Test Infrastructure

### 1.1 Testing Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Test Runner | Vitest 4.0 | EXISTING |
| DOM Environment | jsdom 27.4 | EXISTING |
| React Testing | @testing-library/react 16.3 | EXISTING |
| Assertions | @testing-library/jest-dom 6.9 | EXISTING |
| UI Testing | @vitest/ui 4.0 | EXISTING |

### 1.2 Test Commands

| Command | Purpose | Status |
|---------|---------|--------|
| `npm run test` | Run all tests (vitest run) | EXISTING |
| `npm run test:watch` | Watch mode (vitest) | EXISTING |

### 1.3 Test Configuration

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration |
| `src/test/setup.ts` | Test setup (localStorage mock, import.meta mock) |

---

## 2. Existing Tests

### 2.1 Test File Inventory

| File | Lines | Purpose | Coverage Area |
|------|-------|---------|---------------|
| `src/test/credits.test.ts` | 55 | Credit store operations | `creditsStore.ts` |
| `src/test/entitlements.test.ts` | ~50 | Plan entitlements | `entitlements.ts` |
| `src/test/stage-failure.test.ts` | ~60 | AI stage failure handling | `stageRunner.ts` |
| `src/test/ai-parse-recovery.test.ts` | ~100 | AI JSON parse recovery | `stageRunner.ts` |
| `src/test/project-workspace-crash.test.tsx` | ~150 | ProjectWorkspacePage stability | `ProjectWorkspacePage.tsx` |
| `src/lib/storage/validation.test.ts` | ~90 | Schema validation | `validation.ts` |

**Total test files: 6**

### 2.2 Test Coverage Summary

| Area | Tested | Not Tested |
|------|--------|------------|
| Credit deduction logic | ✅ Yes | — |
| Insufficient credits handling | ✅ Yes | — |
| Credit addition | ✅ Yes | — |
| Plan entitlements | ✅ Yes | — |
| AI stage failures | ✅ Yes | — |
| JSON parse recovery | ✅ Yes | — |
| Schema validation | ✅ Yes | — |
| Page crash prevention | ✅ Yes | — |
| **Authentication** | ❌ None | No auth exists |
| **Route protection** | ❌ None | No protection exists |
| **Server endpoints** | ❌ None | No API tests |
| **Rate limiting** | ❌ None | Not tested |
| **RLS policies** | ❌ None | No Supabase tests |
| **Character CRUD** | ❌ None | Not tested |
| **Project CRUD** | ❌ None | Not tested |
| **Knowledge Base CRUD** | ❌ None | Not tested |
| **AI prompt generation** | ❌ None | Not tested |
| **Share token flow** | ❌ None | Not tested |
| **Demo viewer** | ❌ None | Not tested |
| **Component rendering** | ❌ Limited | Only crash test |

---

## 3. Test Details

### 3.1 credits.test.ts

```
Describes: 'Credits Store'
  - deducts credits correctly when successful
  - fails and does not deduct when insufficient credits
  - records negative amount in ledger for added credits
```

**Coverage**: Core credit consumption and addition logic. Does not test plan tier changes or ledger filtering.

---

### 3.2 entitlements.test.ts

**Location**: `src/test/entitlements.test.ts`

**Coverage**: Plan limit enforcement for character creation, project creation, KB items, and export. Tests demo mode bypass.

---

### 3.3 stage-failure.test.ts

**Location**: `src/test/stage-failure.test.ts`

**Coverage**: Tests that stage runners correctly report failures and do not corrupt state on error.

---

### 3.4 ai-parse-recovery.test.ts

**Location**: `src/test/ai-parse-recovery.test.ts`

**Coverage**: Tests JSON repair prompt generation and recovery flow when AI returns malformed JSON.

---

### 3.5 project-workspace-crash.test.tsx

**Location**: `src/test/project-workspace-crash.test.tsx`

**Coverage**: React rendering crash prevention for ProjectWorkspacePage with various edge-case project states.

---

### 3.6 validation.test.ts

**Location**: `src/lib/storage/validation.test.ts`

**Coverage**: Schema validation and repair functions for localStorage data integrity.

---

## 4. What Is NOT Tested

### 4.1 Server-Side (Critical Gaps)

| Component | File | Gap |
|-----------|------|-----|
| Express routes | `server/routes/ai.ts` | No tests |
| Express routes | `server/routes/share.ts` | No tests |
| Rate limiting | `server/index.ts` | No tests |
| Environment validation | `server/env.ts` | No tests |
| Error handling | `server/errors.ts` | No tests |
| Helmet/security headers | `server/index.ts` | No tests |

### 4.2 Client-Side Storage (Partial Gaps)

| Store | File | Gap |
|-------|------|-----|
| Characters | `src/lib/storage/charactersStore.ts` | No CRUD tests |
| Projects | `src/lib/storage/projectsStore.ts` | No CRUD tests |
| Knowledge Base | `src/lib/storage/knowledgeBaseStore.ts` | No CRUD tests |
| Pose generation | `src/lib/storage/charactersStore.ts` | No AI image tests |

### 4.3 AI Pipeline (Partial Gaps)

| Component | File | Gap |
|-----------|------|-----|
| Text provider | `src/lib/ai/providers/textProvider.ts` | No mock/real switching tests |
| Image provider | `src/lib/ai/providers/imageProvider.ts` | No tests |
| Prompt building | `src/lib/ai/prompts.ts` | No tests |
| Budget planning | `src/lib/ai/budget.ts` | No tests |
| Image prompts | `src/lib/ai/imagePrompts.ts` | No tests |

### 4.4 Supabase Integration (No Tests)

| Component | Gap |
|-----------|-----|
| RLS policies | No tests verifying policies block unauthorized access |
| Shared project read | No integration tests |
| Token validation | No tests |

### 4.5 UI Components (Minimal Tests)

| Component | Gap |
|-----------|-----|
| All 49 UI components | No rendering tests |
| Layout components | No tests |
| Page components | Only crash test for ProjectWorkspacePage |
| Navigation | No tests |
| Forms | No tests |

---

## 5. Correctness Verification Methods

### 5.1 Current Methods

| Method | Description | Reliability |
|--------|-------------|-------------|
| Unit tests | Vitest test suite | Low coverage |
| Manual testing | Developer runs app locally | Undocumented |
| Demo mode | Bypasses limits for testing | Allows invalid states |
| Console logs | Debug logging in DEV | Ephemeral |

### 5.2 Missing Methods

| Method | Gap |
|--------|-----|
| Integration tests | None |
| E2E tests | None |
| API contract tests | None |
| Database migration tests | None |
| Load/stress tests | None |
| Security tests | None |
| Visual regression tests | None |
| Accessibility tests | None |

---

## 6. Test Environment Setup

### 6.1 Test Setup File

**File**: `src/test/setup.ts`

**Capabilities**:
- Proxy-based localStorage mock supporting `Object.keys(localStorage)`
- `import.meta.env` mock with `DEV: false, PROD: true, MODE: 'test'`
- `@testing-library/jest-dom` matchers

### 6.2 Vitest Configuration

**File**: `vitest.config.ts`

```typescript
{
  globals: true,
  environment: "jsdom",
  setupFiles: "./src/test/setup.ts"
}
```

---

## 7. Coverage Metrics

### 7.1 Estimated Coverage

| Area | Files | Tested Files | Coverage Estimate |
|------|-------|--------------|-------------------|
| Client Storage | 7 | 2 (credits, validation) | ~28% |
| Client AI | 8 | 2 (stageRunner-related) | ~25% |
| Client Pages | 16 | 1 (crash test) | ~6% |
| Client Components | 64+ | 0 | 0% |
| Server | 6 | 0 | 0% |
| **Overall** | ~100+ | 6 | **<10%** |

### 7.2 Critical Path Coverage

| Critical Path | Covered |
|---------------|---------|
| User registration → Project creation | ❌ No (no auth) |
| Project pipeline execution | ⚠️ Partial (stage failures) |
| Credit enforcement | ✅ Yes |
| Demo link sharing | ❌ No |
| Export generation | ❌ No |

---

## 8. Recommendations for Execution Agent

### 8.1 Before Adding Features

1. **Do not assume untested code works correctly**
2. **Treat localStorage as unreliable** — validation exists but coverage is minimal
3. **Treat server endpoints as untested** — no API test coverage

### 8.2 Before Modifying Existing Code

1. Read existing tests to understand expected behavior
2. Run `npm run test` to verify baseline passes
3. Add tests for any behavior changes

### 8.3 Test Commands Reference

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run src/test/credits.test.ts

# Run with coverage (if configured)
npx vitest run --coverage
```

---

## 9. Test Execution Status

### 9.1 Last Known Status

**Status**: NOT VERIFIED IN THIS FREEZE

To verify:
```bash
cd /Users/taoufiq/Documents/GitHub/Noorstudio
npm run test
```

Expected: All 6 test files pass.

---

*End of TEST_PLAN.md*
