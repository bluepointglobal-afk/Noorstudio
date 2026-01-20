# UNIVERSAL GATED WORKFLOW

> ROLE: SYSTEM_THINKING  
> This file controls ALL flow. No execution without passing gates.  
> Paste in Claude Code: `Follow @workflow/WORKFLOW.md`

---

## GATE SYSTEM

```
GATE 0: IDEA         → Problem understood?
GATE 1: MARKET       → Market validated?
GATE 2: SCOPE        → Scope locked?
GATE 3: ARCHITECTURE → Architecture locked?
GATE 4: EXECUTION    → Ready to build?
GATE 5: VALIDATION   → Ready to ship?
```

---

## PHASE 0: AUTO-DETECT CURRENT GATE

**On startup, scan project and report:**

```bash
# Detection logic (agent runs silently):
IDEA.md exists?         → Gate 0 passed
MARKET_VALIDATION.md?   → Gate 1 passed
SCOPE.md exists?        → Gate 2 passed
ARCHITECTURE.md exists? → Gate 3 passed
prd.json exists?        → Gate 4 active
SCORE.json score > 0?   → Gate 5 active
```

**Output to user:**

```
═══════════════════════════════════════════════════════════════════
GATE STATUS
═══════════════════════════════════════════════════════════════════

Current Gate: [GATE X - NAME]
Project Type: [Greenfield / Brownfield]

[x] Gate 0: Idea         - IDEA.md
[x] Gate 1: Market       - MARKET_VALIDATION.md  
[ ] Gate 2: Scope        - SCOPE.md (MISSING)
[ ] Gate 3: Architecture - ARCHITECTURE.md
[ ] Gate 4: Execution    - prd.json
[ ] Gate 5: Validation   - SCORE.json

Next action: [What needs to happen]
═══════════════════════════════════════════════════════════════════
```

**If greenfield (no files):** Start at Gate 0
**If brownfield (has code):** Start at Gate 2 (audit existing)

---

## GATE 0: IDEA CAPTURE

**Skip if:** IDEA.md exists  
**Purpose:** Understand the problem before building

**Questions (one at a time, "AI" to auto-decide):**

```
═══════════════════════════════════════════════════════════════════
GATE 0: IDEA - Question 1 of 3
═══════════════════════════════════════════════════════════════════

What problem does this solve?

A) [Paste your idea/prompt and I'll extract it]
B) Let me describe it

Your answer:
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 0: IDEA - Question 2 of 3
═══════════════════════════════════════════════════════════════════

Who has this problem?

A) SME - Small/medium business
B) Consumer - Individual  
C) Enterprise - Large company
D) Developer - Technical
E) Creator - Content producer
F) Other (describe)

Your answer (A-F or "AI"):
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 0: IDEA - Question 3 of 3
═══════════════════════════════════════════════════════════════════

How urgent is this problem?

A) Hair on fire - they need it NOW
B) Painful - they actively seek solutions
C) Nice to have - they'd use it if easy
D) Unknown - need to validate

Your answer (A-D or "AI"):
```

**Wait.**

**Output:** Create `project-context/IDEA.md`  
**Next:** Gate 1 or skip to Gate 2 (type SKIP-MARKET)

---

## GATE 1: MARKET VALIDATION

**Skip if:** MARKET_VALIDATION.md exists OR user types SKIP-MARKET  
**Purpose:** Confirm market before building

```
═══════════════════════════════════════════════════════════════════
GATE 1: MARKET - Skip or Validate?
═══════════════════════════════════════════════════════════════════

A) SKIP - I've validated this already / internal tool
B) QUICK - 3 questions, AI-assisted
C) FULL - Detailed market analysis

Your answer (A/B/C):
```

**If QUICK:**

```
Q1: Who are 2-3 competitors? (or "none" / "AI")
Q2: What's your unfair advantage? (or "AI")
Q3: First 10 customers - who are they? (or "AI")
```

**Output:** Create `project-context/MARKET_VALIDATION.md`  
**Next:** Gate 2

---

## GATE 2: SCOPE LOCK

**Skip if:** SCOPE.md exists  
**Required for:** All execution

**Questions (one at a time):**

```
═══════════════════════════════════════════════════════════════════
GATE 2: SCOPE - Question 1 of 6
═══════════════════════════════════════════════════════════════════

What type of product is this?

A) SaaS - Web app with accounts, recurring value
B) Mobile - iOS/Android app  
C) Web - Website, landing page, static site
D) API - Backend service, endpoints
E) Content - Documentation, course, media

Your answer (A-E or "AI"):
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 2: SCOPE - Question 2 of 6
═══════════════════════════════════════════════════════════════════

Who is the primary user?

A) SME - Small/medium business owner
B) Consumer - Individual end user
C) Enterprise - Large company
D) Developer - Technical integrator
E) Creator - Content producer

Your answer (A-E or "AI"):
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 2: SCOPE - Question 3 of 6
═══════════════════════════════════════════════════════════════════

What market?

A) B2B - Businesses buy it
B) B2C - Consumers buy it
C) Internal - Company tool
D) Hybrid

Your answer (A-D or "AI"):
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 2: SCOPE - Question 4 of 6
═══════════════════════════════════════════════════════════════════

What is the ONE outcome? 
(Complete: "User can _____ in _____")

A) [AI-suggested based on codebase/idea]
B) Write your own

Your answer:
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 2: SCOPE - Question 5 of 6
═══════════════════════════════════════════════════════════════════

What feature ships FIRST?

A) [AI-detected #1 priority]
B) [AI-detected #2 priority]
C) [AI-detected #3 priority]
D) Other (describe)
E) AI decides

Your answer:
```

**Wait.**

```
═══════════════════════════════════════════════════════════════════
GATE 2: SCOPE - Question 6 of 6
═══════════════════════════════════════════════════════════════════

Constraints?

A) None
B) Timeline (describe)
C) Tech (describe)
D) Compliance (describe)
E) Budget (describe)

Your answer:
```

**Wait.**

**Summary + CONFIRM required:**

```
═══════════════════════════════════════════════════════════════════
SCOPE SUMMARY
═══════════════════════════════════════════════════════════════════

Product:     [type]
Persona:     [who]
Market:      [what]
Outcome:     [one sentence]
First Ship:  [feature]
Constraints: [any]

═══════════════════════════════════════════════════════════════════
Type CONFIRM to lock, RESTART to redo.
```

**Output:** Create `SCOPE.md` and `project-context/SCOPE_LOCK.md`  
**Next:** Gate 3

---

## GATE 3: ARCHITECTURE LOCK

**Skip if:** ARCHITECTURE.md exists OR simple feature (AI decides)  
**Required for:** Complex features, new projects

```
═══════════════════════════════════════════════════════════════════
GATE 3: ARCHITECTURE - Required?
═══════════════════════════════════════════════════════════════════

A) SKIP - Simple feature, no architecture needed
B) QUICK - Key decisions only (3 questions)
C) FULL - Complete architecture document

Your answer (A/B/C or "AI"):
```

**If QUICK:**

```
Q1: Tech stack? (or "AI" to detect/recommend)
Q2: Key data models? (or "AI")
Q3: External integrations? (or "none")
```

**Output:** Create `ARCHITECTURE.md`  
**Next:** Gate 4

---

## GATE 4: EXECUTION

**Requires:** SCOPE.md exists (hard block)  
**Activates:** execution-engine/ workflows

```
═══════════════════════════════════════════════════════════════════
GATE 4: EXECUTION
═══════════════════════════════════════════════════════════════════

✓ Scope locked
✓ Architecture: [exists/skipped]

Generating:
- BACKLOG.md (all features)
- tasks/tasks-[feature].md (selected feature)
- scripts/ralph/prd.json (execution format)

═══════════════════════════════════════════════════════════════════
```

**Output:** 
- `BACKLOG.md`
- `tasks/tasks-<feature>.md`
- `scripts/ralph/prd.json`

**Tell user:**

```
═══════════════════════════════════════════════════════════════════
READY FOR EXECUTION
═══════════════════════════════════════════════════════════════════

Feature: [name]
Stories: [count]

Run: make ship

═══════════════════════════════════════════════════════════════════
```

---

## GATE 5: VALIDATION

**Activates after:** `make ship` completes all stories  
**Purpose:** Verify before deploy

- Run validation against SCOPE.md criteria
- Fill `reports/SCORE.json`
- Gate: score >= threshold = SHIP
- Below threshold = `GAP_REPORT.md`, loop back

---

## RULES (NON-NEGOTIABLE)

1. **Auto-detect gate** - Always show current state first
2. **One question at a time** - Never dump questions
3. **Wait for answers** - Do not proceed without response
4. **"AI" is valid** - User can delegate any question
5. **CONFIRM required** - Never auto-lock scope
6. **SCOPE.md required** - No execution without it
7. **make ship only** - One command for everything
8. **No skipping Gate 2** - Scope is mandatory

---

## QUICK COMMANDS

| User says | Action |
|-----------|--------|
| `Follow @workflow/WORKFLOW.md` | Start from auto-detect |
| `SKIP-MARKET` | Skip Gate 1 |
| `AI` | Let agent decide current question |
| `CONFIRM` | Lock current gate |
| `RESTART` | Redo current gate |
| `STATUS` | Show gate status |
| `make ship` | Execute (Gate 4+) |
