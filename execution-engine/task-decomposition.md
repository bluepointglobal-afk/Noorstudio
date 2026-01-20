# TASK DECOMPOSITION

> ROLE: EXECUTION  
> ⛔ REQUIRES: Gate 4 passed, SCOPE.md exists

---

## Purpose

Break a feature into executable stories for Ralph.

---

## Process

1. **Read SCOPE.md** - Understand the outcome
2. **Read feature description** - From BACKLOG.md or user
3. **Decompose** - Into 3-7 stories
4. **Order** - Dependencies first
5. **Add verifiers** - Test commands for each
6. **Output** - tasks/tasks-<feature>.md + prd.json

---

## Story Size Rules

| Too Big | Right Size | Too Small |
|---------|------------|-----------|
| "Build the dashboard" | "Create dashboard layout component" | "Add a div" |
| "Implement auth" | "Add login form with validation" | "Import a library" |
| Multiple days | 1-4 hours | Minutes |

---

## Story Template

```markdown
## [FEAT-001] Story Title

**As a** [persona]  
**I want** [action]  
**So that** [outcome]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Verifier:** `npm test -- --grep "story title"`
```

---

## Output Format

### tasks/tasks-<feature>.md
```markdown
# Feature: [Name]

## Stories

- [ ] FEAT-001: First story
- [ ] FEAT-002: Second story
- [ ] FEAT-003: Third story
```

### scripts/ralph/prd.json
```json
{
  "feature": "Feature Name",
  "verifiers": ["npm run lint", "npm test"],
  "stories": [...]
}
```
