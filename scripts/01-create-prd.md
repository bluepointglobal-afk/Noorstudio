# Step 1: Create PRD (with Questionnaire)

## Goal

Generate a detailed Product Requirements Document through clarifying questions. The PRD becomes the source of truth for what to build.

## Process

1. **Receive Initial Prompt:** User describes what they want to build
2. **Ask Clarifying Questions:** 3-5 critical questions with A/B/C/D options
3. **Generate PRD:** Based on answers, create structured PRD
4. **Save:** `tasks/prd-[feature-name].md`

**Important:** Do NOT start implementing. Just create the PRD.

## Clarifying Questions Format

Number all questions. Provide letter options for easy response.

```
1. What is the primary goal of this feature?
   A. [Option]
   B. [Option]
   C. [Option]
   D. Other: [please specify]

2. Who is the target user?
   A. [Option]
   B. [Option]
   C. [Option]
   D. [Option]

3. What is the scope?
   A. Minimal viable version
   B. Full-featured implementation
   C. Just the backend/API
   D. Just the UI
```

User responds: "1A, 2C, 3B"

## PRD Structure

```markdown
# PRD: [Feature Name]

## Introduction
[Brief description of feature and problem it solves]

## Goals
- [Specific measurable objective]
- [Specific measurable objective]

## User Stories

### US-001: [Title]
**Description:** As a [user], I want [feature] so that [benefit].

**Acceptance Criteria:**
- [ ] [Specific verifiable criterion]
- [ ] [Specific verifiable criterion]
- [ ] Typecheck passes
- [ ] [UI stories] Verify in browser

### US-002: [Title]
...

## Functional Requirements
- FR-1: [Specific functionality]
- FR-2: [Specific functionality]

## Non-Goals (Out of Scope)
- [What this will NOT include]
- [What this will NOT include]

## Technical Considerations
- [Constraints, dependencies, integrations]

## Success Metrics
- [How success is measured]

## Open Questions
- [Remaining unknowns]
```

## Key Rules

1. **User stories must be small** - completable in one focused session
2. **Acceptance criteria must be verifiable** - not vague like "works correctly"
3. **Always include "Typecheck passes"** as a criterion
4. **UI stories must include "Verify in browser"**

## Command

In Claude Code:
```
Use @scripts/01-create-prd.md
Here's the feature I want to build: [describe feature]
Reference: @STATUS.md
```
