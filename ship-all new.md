# Ship All: Automated Pipeline

## Goal

One command. Claude executes the entire workflow with questionnaires at each phase to align your intent with what gets built.

## The Command

```
Use @scripts/ship-all.md
Reference: @STATUS.md
```

## Pipeline with Checkpoints

```
PHASE 1: BACKLOG CREATION
├── Read STATUS.md
├── Ask backlog priority questions (3-5 questions, A/B/C/D format)
├── WAIT for user answers
├── Generate BACKLOG.md with prioritized features
└── Confirm backlog before proceeding

PHASE 2: FOR EACH FEATURE IN BACKLOG
│
├── STEP 1: PRD WITH QUESTIONNAIRE
│   ├── Present feature context from BACKLOG.md
│   ├── Ask 3-5 clarifying questions (A/B/C/D format)
│   ├── WAIT for user answers
│   ├── Generate tasks/prd-[feature].md
│   └── Confirm PRD before proceeding
│
├── STEP 2: GENERATE TASKS
│   ├── Read PRD
│   ├── Generate ~5 parent tasks
│   ├── Present to user: "Ready to generate sub-tasks? Reply Go"
│   ├── WAIT for "Go"
│   ├── Generate sub-tasks
│   └── Save tasks/tasks-[feature].md
│
├── STEP 3: CONVERT TO RALPH
│   ├── Convert PRD to prd.json format
│   ├── Save to scripts/ralph/prd.json
│   └── Confirm: "Ready to execute? Reply Go"
│
├── STEP 4: RALPH EXECUTION
│   ├── For each story where passes: false
│   │   ├── Implement the story
│   │   ├── Run typecheck/lint/test
│   │   ├── If pass: commit, mark passes: true
│   │   ├── If fail: fix (max 3 attempts)
│   │   └── Report progress
│   └── All stories pass → Feature complete
│
├── Mark feature ✅ in BACKLOG.md
└── Ask: "Continue to next feature? Reply Go or Stop"

PHASE 3: COMPLETE
└── Report summary of all shipped features
```

## Phase 1: Backlog Questions

Ask these before creating the backlog:

```
Looking at STATUS.md, I'll create a prioritized feature backlog.

1. What's the immediate goal?
   A. Demo/investor presentation
   B. Beta launch to early users
   C. Production launch with payments
   D. Other: [specify]

2. What's the timeline?
   A. This week (aggressive)
   B. This month (normal)
   C. This quarter (relaxed)
   D. No fixed deadline

3. Any features to SKIP for now?
   A. Skip i18n/translations
   B. Skip analytics/dashboard
   C. Skip team collaboration
   D. Include everything

4. Technical preference for unknowns?
   A. Use simplest solution
   B. Use most scalable solution
   C. Ask me for each decision
   D. Your best judgment

Reply like: "1B, 2B, 3A, 4D"
```

## Phase 2: PRD Questions (Per Feature)

For each feature, ask 3-5 specific questions:

```
## Feature: [Name]

From STATUS.md: [current state]

Before I create the PRD:

1. [Specific question about scope]
   A. [Option]
   B. [Option]
   C. [Option]
   D. Other

2. [Specific question about implementation]
   A. [Option]
   B. [Option]
   C. [Option]

3. [Specific question about acceptance criteria]
   A. [Option]
   B. [Option]
   C. [Option]

Reply like: "1A, 2B, 3C"
```

## Checkpoints (Pipeline Pauses Here)

1. **After backlog questions** → Wait for answers
2. **After PRD questions (each feature)** → Wait for answers  
3. **After parent tasks** → Wait for "Go"
4. **After prd.json created** → Wait for "Go" to execute
5. **After feature complete** → Wait for "Go" or "Stop"

## Progress Tracking

Update BACKLOG.md after each phase:

```markdown
| # | Feature | PRD | Tasks | Ralph | Status |
|---|---------|-----|-------|-------|--------|
| 1 | Image Generation | ✅ | ✅ | 🔄 | IN PROGRESS |
| 2 | PDF Export | ⬜ | ⬜ | ⬜ | PENDING |
| 3 | Payments | ⬜ | ⬜ | ⬜ | PENDING |
```

## Error Handling

- **Story fails 3 times:** Skip, log reason, ask user whether to continue
- **Critical blocker:** Stop, report, wait for guidance
- **Unclear requirement:** Ask ONE clarifying question, then proceed

## Final Report

```
## Ship All Complete

Features Shipped: 4/5
─────────────────────────
✅ Image Generation
   PRD: tasks/prd-image-generation.md
   Commits: 12
   
✅ PDF Export  
   PRD: tasks/prd-pdf-export.md
   Commits: 8

✅ Stripe Payments
   PRD: tasks/prd-payments.md
   Commits: 6

⚠️ Team Collaboration
   Status: Skipped (user chose to defer)

─────────────────────────
Total commits: 26
Branch: feature/mvp-completion

Next: git push origin feature/mvp-completion
```

## Start

```
Use @scripts/ship-all.md
Reference: @STATUS.md
```

Claude begins with backlog priority questions.
