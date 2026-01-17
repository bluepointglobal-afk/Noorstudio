# Step 3: Convert PRD to Ralph JSON

## Goal

Convert the PRD into `prd.json` format that Ralph uses for autonomous execution.

## Process

1. **Read PRD:** `tasks/prd-[feature].md`
2. **Convert each user story** to JSON format
3. **Save:** `scripts/ralph/prd.json`

## Output Format

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-name-kebab-case]",
  "description": "[Feature description]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

## Critical Rules

### Story Size
Each story must complete in ONE Ralph iteration (one context window).

**Right-sized:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic

**Too big (split these):**
- "Build the entire dashboard"
- "Add authentication"
- "Refactor the API"

### Story Order
Priority = dependency order. Earlier stories cannot depend on later ones.

1. Schema/database changes
2. Backend logic
3. UI components
4. Dashboard/summary views

### Acceptance Criteria
Must be verifiable, not vague.

**Good:** "Button shows confirmation dialog before deleting"
**Bad:** "Works correctly"

**Always include:**
- "Typecheck passes" (every story)
- "Verify in browser using dev-browser skill" (UI stories)

## Conversion Rules

1. Each user story → one JSON entry
2. IDs: Sequential (US-001, US-002, etc.)
3. Priority: Based on dependency order
4. All stories: `passes: false` and empty `notes`
5. branchName: `ralph/[feature-name]` kebab-case

## Command

In Claude Code:
```
Use @scripts/03-convert-to-ralph.md
Convert @tasks/prd-[feature].md to scripts/ralph/prd.json
```
