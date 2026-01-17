# Step 2: Generate Tasks from PRD

## Goal

Break the PRD into a detailed, step-by-step task list. Two-phase process with user approval between phases.

## Process

1. **Receive PRD:** User points to `tasks/prd-[feature].md`
2. **Phase 1 - Parent Tasks:** Generate ~5 high-level tasks. Present to user.
3. **Wait for "Go":** User reviews and confirms
4. **Phase 2 - Sub-Tasks:** Break each parent into actionable sub-tasks
5. **Save:** `tasks/tasks-[feature-name].md`

## Output Format

```markdown
# Tasks: [Feature Name]

## Relevant Files
- `path/to/file.ts` - [Why relevant]
- `path/to/file.test.ts` - Tests for above

## Instructions

**IMPORTANT:** Check off each task as you complete it:
`- [ ]` → `- [x]`

Update after each sub-task, not just parent tasks.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create branch: `git checkout -b feature/[name]`

- [ ] 1.0 [Parent Task Title]
  - [ ] 1.1 [Sub-task description]
  - [ ] 1.2 [Sub-task description]
  - [ ] 1.3 [Sub-task description]

- [ ] 2.0 [Parent Task Title]
  - [ ] 2.1 [Sub-task description]
  - [ ] 2.2 [Sub-task description]

- [ ] 3.0 [Parent Task Title]
  - [ ] 3.1 [Sub-task description]
```

## Key Rules

1. **Always start with task 0.0: Create feature branch**
2. **~5 parent tasks** - not 15-20
3. **Sub-tasks should take ~30 minutes each**
4. **Order by dependency** - schema before backend before UI
5. **Each parent should produce visible/testable outcome**

## Two-Phase Interaction

**Phase 1 output:**
```
I've generated these high-level tasks:

0. Create feature branch
1. [Task]
2. [Task]
3. [Task]
4. [Task]
5. [Task]

Ready to generate sub-tasks? Reply "Go" to proceed.
```

**Wait for user to say "Go"**

**Phase 2:** Generate all sub-tasks and save file.

## Command

In Claude Code:
```
Use @scripts/02-generate-tasks.md
Take @tasks/prd-[feature].md and create tasks
```
