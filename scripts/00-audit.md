# Step 0: Codebase Audit

Analyze this codebase and create a comprehensive STATUS.md file.

## Instructions

1. Explore the entire codebase structure
2. Identify the tech stack (frameworks, libraries, database)
3. Document what features are working
4. Document what's partially built
5. Document what's missing or incomplete
6. Note any technical debt or code quality issues

## Output Format

Create `STATUS.md` in the project root with:

```markdown
# [Project Name] - Status Report

## 1. What This Project Does
[Brief description]

## 2. Tech Stack
[List technologies]

## 3. Working Features ✅
[What's complete]

## 4. Partially Built 🟡
[What's incomplete]

## 5. Missing Features ❌
[What's not implemented]

## 6. Architecture Overview
[High-level structure]

## 7. Technical Debt
[Code quality issues]
```

## Usage

In Claude Code:
```
Analyze this codebase and create STATUS.md
```

Or reference this file:
```
Use @scripts/00-audit.md
```
