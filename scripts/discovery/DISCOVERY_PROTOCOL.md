# Discovery Phase Protocol

## Purpose
Extract structured SCOPE from user conversation. This runs BEFORE any architecture, PRD, or implementation.

---

## Agent Instructions

When a user describes a project, product, or feature they want to build:

### 1. EXTRACT (from conversation)

Identify these elements from what the user has said:

```
PRODUCT_TYPE: What kind of thing is this?
  - SaaS (web app with accounts, recurring value)
  - Mobile (iOS/Android app)
  - Web (website, landing page, static site)
  - API (backend service, endpoints)
  - Content (documentation, course, media)

MARKET: Who pays / who benefits?
  - B2B (businesses buy it)
  - B2C (consumers buy it)
  - Internal (company internal tool)
  - Hybrid (mixed)

PERSONA: Primary user archetype
  - SME (small/medium business owner/employee)
  - Consumer (individual end user)
  - Enterprise (large company stakeholder)
  - Developer (technical integrator)
  - Creator (content producer)

OUTCOME: The ONE thing the user gets (1 sentence)
  - Format: "[Persona] can [action] in [timeframe/ease]"
  - Example: "GCC SMEs can generate ESG reports in 30 minutes"

DELIVERABLES: Concrete outputs the product produces
  - What does the user walk away with?
  - Examples: "PDF report", "Dashboard view", "API response", "Exported data"

SUCCESS_CRITERIA: How we know it works
  - Measurable, testable
  - Examples: "Report generates in < 2 min", "User completes flow without help"

CONTEXT: Why this matters (optional)
  - Market conditions, regulations, user pain

CONSTRAINTS: Hard limits (optional)
  - Budget, timeline, tech stack, compliance
```

### 2. CONFIRM (with user)

Before generating SCOPE.md, confirm understanding:

```
Based on our conversation, here's what I understand:

**Product Type:** SaaS
**Market:** B2B  
**Persona:** SME (GCC region)
**Outcome:** SMEs generate compliant ESG reports in 30 minutes

**Deliverables:**
- ESG assessment dashboard
- PDF report with Arabic/English
- Compliance score

**Success Criteria:**
- First report in < 30 min
- Passes basic SASB alignment check
- Works on mobile browser

Does this capture your intent? Any adjustments?
```

### 3. GENERATE (SCOPE.md)

Once confirmed, call the generator:

```bash
bash scripts/util/generate_scope.sh --json '{
  "product_type": "SaaS",
  "market": "B2B",
  "persona": "SME",
  "outcome": "GCC SMEs generate compliant ESG reports in 30 minutes",
  "deliverables": [
    "ESG assessment dashboard",
    "PDF report generator (Arabic/English)",
    "Compliance score calculator"
  ],
  "success_criteria": [
    "First report generated in < 30 minutes",
    "Report passes basic SASB alignment check",
    "Dashboard works on mobile browser"
  ],
  "context": "GCC regulators requiring ESG disclosure from SMEs by 2025. No affordable solutions exist.",
  "constraints": [
    "Must support Arabic RTL",
    "Halal business practices only",
    "No external data sharing without consent"
  ]
}'
```

### 4. LOCK AND PROCEED

After SCOPE.md is generated:
1. Mark STATUS.md Phase 0 complete
2. Proceed to Phase 1 (Architecture)
3. SCOPE.md is now immutable for this cycle

---

## Example Discovery Conversation

**User:** I need to build something for livestock traders in Saudi. They should be able to list animals and buyers can browse and contact sellers.

**Agent extracts:**
- Product Type: Mobile (traders on the go)
- Market: B2C (individual traders)
- Persona: Consumer (livestock traders)
- Outcome: Saudi livestock traders list and find animals in 3 taps
- Deliverables: Animal listing, Search/filter, Seller contact, Saved favorites
- Success: List animal < 2 min, Find animal < 30 sec, Contact seller in 1 tap

**Agent confirms** → **User approves** → **Agent generates SCOPE.md**

---

## Edge Cases

### User is vague
Ask: "What's the ONE thing a user should be able to do with this?"

### Multiple products
Ask: "Which one should we ship first? Let's scope that one."

### Scope creep during conversation
Say: "That sounds like a Phase 2 feature. Let's capture it but keep Phase 1 focused on [original outcome]."

### User changes mind
Regenerate SCOPE.md. Previous one is archived in memory.

---

## SCOPE.md is Sacred

Once generated:
- It drives adapter selection (SaaS/Mobile/Web validation)
- It defines success criteria for ship gate
- It prevents scope creep during implementation
- Changes require explicit new discovery cycle
