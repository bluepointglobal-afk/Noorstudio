# CLAUDE.md - Project Configuration

## Workflow: Ship with Ralph

This project uses Ryan Carson's 3-file workflow + Ralph for autonomous shipping.

### The Process

```
AUDIT → PRD (questionnaire) → TASKS → RALPH (autonomous)
```

### Quick Commands

**Step 0 - Audit (brownfield projects):**
```
Analyze this codebase and create STATUS.md
```

**Step 1 - Create PRD:**
```
Use @scripts/01-create-prd.md
Feature: [describe what you want to build]
Reference: @STATUS.md
```

**Step 2 - Generate Tasks:**
```
Use @scripts/02-generate-tasks.md
PRD: @tasks/prd-[feature].md
```

**Step 3 - Convert to Ralph:**
```
Use @scripts/03-convert-to-ralph.md
Convert @tasks/prd-[feature].md to scripts/ralph/prd.json
```

**Step 4 - Run Ralph (in terminal, not Claude Code):**
```bash
./scripts/ralph/ralph.sh 10
```

### File Locations

| File | Purpose |
|------|---------|
| `STATUS.md` | Current state audit |
| `tasks/prd-[feature].md` | PRD (source of truth) |
| `tasks/tasks-[feature].md` | Detailed task breakdown |
| `scripts/ralph/prd.json` | Ralph execution format |
| `scripts/ralph/progress.txt` | Learnings between iterations |

### Rules

1. **Don't skip the questionnaire** - Answer the clarifying questions
2. **Lock scope before Ralph runs** - PRD is the contract
3. **One story per iteration** - Ralph handles one at a time
4. **Keep stories small** - Completable in one context window
