---
description: Comprehensive project-wide debugging and hardening workflow.
---

# Self-Debugging Workflow

## Core Behavior
You are a self-debugging execution engine. When errors occur:
1. Diagnose before fixing (understand root cause)
2. Fix autonomously (up to 3 attempts)
3. Verify the fix works
4. Escalate only when truly blocked

## Activation Triggers
Engage this workflow when:
- Command exits non-zero
- TypeScript/lint errors appear
- Runtime exceptions thrown
- Network/API calls fail
- Database queries error
- **Tests fail or don't compile**

## Phase 1: Capture & Classify
```
🔍 ERROR CAPTURED
Type: Build|Runtime|Network|Auth|Data|Dependency|Type
File: [path:line]
Message: [exact error]
Severity: Blocking|Critical|Major|Minor
```

## Phase 2: Diagnostic Protocols

### Build/Compile
```bash
npx tsc --noEmit 2>&1 | head -30
npm run lint 2>&1 | head -20
```
Patterns:
- Missing types → `npm i -D @types/[pkg]`
- Type mismatch → Check interface definition vs actual usage
- Module not found → Verify path, check case sensitivity (Mac vs Linux)
- Implicit any → Add explicit type annotations

### Runtime
```bash
rm -rf node_modules/.cache .next .expo dist .vite
npm run dev 2>&1 | head -50
```
Patterns:
- "Cannot read property of undefined" → Add ?. or null check
- "Invalid hook call" → Hook outside component or conditional
- "Rendered more hooks" → Inconsistent hook order
- "Hydration mismatch" → Wrap client-only code in useEffect
- "Text strings must be rendered" → Wrap in Text component

### Network/API
```bash
curl -v [endpoint] -H "Authorization: Bearer $TOKEN" 2>&1
```
| Code | Diagnosis | Action |
|------|-----------|--------|
| 400 | Bad request body | Log payload, check schema |
| 401 | Auth expired | Refresh session/token |
| 403 | Permission denied | Check RLS, CORS, roles |
| 404 | Wrong endpoint | Verify URL path |
| 422 | Validation failed | Check required fields |
| 429 | Rate limited | Add backoff/retry |
| 500 | Server error | Check server/edge logs |

### Database
- "permission denied" → RLS policy missing or wrong
- "relation does not exist" → Migration not run
- "duplicate key" → Unique constraint violation
- "foreign key violation" → Referenced record missing
- "connection refused" → Check env vars, network

### Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
# If peer deps conflict:
npm install --legacy-peer-deps
# Check specific package:
npm ls [package-name]
```

### Tests
```bash
# Run with verbose output
npx vitest run --reporter=verbose 2>&1 | head -50
# Check test types compile
npx tsc --noEmit src/**/*.test.ts
```
Patterns:
- Mock type mismatch → Update mock to match refactored interface
- Missing act() → Wrap state updates in act()
- Provider missing → Add context wrapper to test render
- Timeout → Add async/await, increase timeout
- Snapshot fail → Review diff, run `npx vitest -u` if intentional

## Phase 3: Fix Protocol (3-Strike Rule)

### Structure Each Attempt
```
🔧 ATTEMPT #[1/2/3]
Hypothesis: [what I think is wrong]
Action: [specific change]
Result: [outcome]
```

### Attempt Strategies
**Attempt 1**: Direct fix - most obvious solution, minimal change
**Attempt 2**: Broader investigation - related files, git diff, alternative approach
**Attempt 3**: Deep dive - documentation, GitHub issues, environment audit

### Between Attempts
- Read full error message again
- Check if error changed (progress or regression)
- Consider if hypothesis was wrong

## Phase 4: Verification

### Clean Master Checklist
All must pass before declaring fixed:
```bash
npx tsc --noEmit          # Types OK
npm run lint              # Lint OK  
npm run build             # Build OK
npx vitest run --reporter=dot  # Tests OK
npm run dev               # Runs OK
```

### Test-Driven Verification
```bash
# Run all tests
npx vitest run

# Run specific test file
npx vitest run [file.test.ts]

# Run tests matching pattern
npx vitest run -t "pattern"

# Watch mode for iterative fixing
npx vitest --watch [file.test.ts]
```

### Test Failure Patterns
| Pattern | Cause | Fix |
|---------|-------|-----|
| Mock type error | Mock doesn't match interface | Update mock to match current types |
| Async timeout | Missing await or act() | Wrap in act(), add await |
| Cannot find module | Test imports broken | Check relative paths |
| Snapshot mismatch | UI changed | Review diff, update if intentional |
| Hook error in test | Missing provider wrapper | Add context providers to test render |

### Fixing Broken Tests
1. **Type errors in tests** → Update mocks to match refactored interfaces
2. **Syntax errors** → Check for missing brackets, commas
3. **Import errors** → Verify paths after file moves
4. **Assertion failures** → Check if logic changed intentionally

### Success Report
```
✅ FIXED
Error: [original]
Cause: [root cause found]
Fix: [what changed]
Verified: Types ✓ Lint ✓ Build ✓ Tests ✓ Runs ✓
```

## Phase 5: Escalation Protocol

### When to Escalate (After 3 Attempts)
```
🚨 BLOCKED
Error: [original error]
Attempts:
1. [action] → [result]
2. [action] → [result]  
3. [action] → [result]
Blocked because: [specific reason]
Need from user: [specific ask]
```

### Never Escalate For
- Missing node_modules → reinstall
- Cache corruption → clear caches
- Obvious type fixes → just fix them
- Missing env vars → check .env.example

### Always Escalate For
- Database schema changes needing confirmation
- API keys or credential issues
- Architectural decisions
- Destructive operations (rm -rf data, drop table)
- Production deployments

## Phase 6: Pattern Library

### ESLint/Library Conflicts
When linting errors come from library patterns (shadcn, etc):
```typescript
// For intentional exports (e.g., shadcn variants)
// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(...)
```
Use targeted disables, not blanket ignores. Preserve library functionality.

### Module Resolution
```bash
# Check if installed
npm ls [module]
# Install if missing  
npm install [module]
# Check for duplicates causing conflicts
npm ls react  # common culprit
```

### Environment Variables
```bash
# See what's set
env | grep -E "(API|URL|KEY|SECRET|DATABASE)" | cut -d= -f1
# Compare to required
cat .env.example 2>/dev/null | grep -v '^#' | cut -d= -f1
```

### Auth/Session Issues
```javascript
// Debug session state
console.log('Session:', await auth.getSession())
// Force refresh
await auth.refreshSession()
```

### React Hooks Best Practices
```typescript
// Stabilize objects in useMemo deps
const stableObj = useMemo(() => ({ ...obj }), [obj.key1, obj.key2]);

// Avoid object literals in deps
❌ useMemo(() => calc(answers), [answers]) // answers = new obj each render
✅ useMemo(() => calc(answers), [JSON.stringify(answers)]) // or specific keys
```

### Cache Issues
```bash
# JavaScript/Node
rm -rf node_modules/.cache
# Next.js
rm -rf .next
# Expo
rm -rf .expo
# Vite
rm -rf dist .vite
# npm
npm cache clean --force
```

### Browser vs Node.js
When code runs in browser but uses Node APIs:
- `Buffer` → Use `btoa()`/`atob()` or `Uint8Array`
- `fs` → Use fetch or File API
- `path` → Use string manipulation or URL API
- `process.env` → Use `import.meta.env` (Vite) or framework equivalent

## Quick Commands

### Nuclear Reset (Use When Stuck)
```bash
rm -rf node_modules .next .expo dist .vite package-lock.json
npm cache clean --force
npm install
npm run dev
```

### Gather Debug Info
```bash
node -v && npm -v
npm ls --depth=0
git log --oneline -5
git diff HEAD~1 --stat
```

### Test Specific Fix
```bash
# Quick type check
npx tsc --noEmit [file.ts]
# Quick lint
npx eslint [file.ts]
```

## Communication Style

### During Debugging
```
🔍 Error: [X]. Diagnosing...
🔧 Attempt 1: [action]. Result: [pass/fail]
🔧 Attempt 2: [action]. Result: [pass/fail]
✅ Fixed: [root cause was Y]
```

### Avoid
- "I see an error, let me try..."
- "Hmm, that didn't work..."
- "I'm not sure what's wrong..."
- Verbose explanations mid-debug

### Use
- Concise status after each action
- Root cause in success report
- Specific asks in escalation

## Execution Rules
1. **Never give up on first failure** - errors often mislead
2. **Never escalate before 3 attempts** - most issues are solvable
3. **Always verify fix works** - don't assume, confirm
4. **One-line status updates** - keep momentum
5. **Document root cause** - learn for next time
6. **Clear caches early** - eliminates phantom issues
7. **Read full error** - solutions often in the message
8. **Check recent changes** - `git diff` reveals culprits