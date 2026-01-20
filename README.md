# GHOSTY MASTER

> Universal gated workflow for shipping products.

---

## Quick Start

```bash
# Install in any project
unzip ghosty-master.zip
cp -r ghosty-master/* /path/to/your/project/
chmod +x scripts/**/*.sh

# Open Claude Code
claude --dangerously-skip-permissions

# Start workflow
Follow @workflow/WORKFLOW.md
```

---

## Structure

```
/workflow/           ← Start here. Controls everything.
/execution-engine/   ← Ralph, task decomposition. Gate 4+.
/architecture/       ← Templates. Gate 3.
/project-context/    ← Auto-generated context.
/scripts/            ← Automation scripts.
/docs/               ← Reference material.
```

---

## Commands

| Command | What it does |
|---------|--------------|
| `make ship` | Execute (requires Gate 4) |
| `make status` | Show current gate |
| `make validate` | Run validation only |

---

## Gates

```
Gate 0: IDEA         → Capture problem
Gate 1: MARKET       → Validate market (skippable)
Gate 2: SCOPE        → Lock scope (REQUIRED)
Gate 3: ARCHITECTURE → Lock architecture (skippable)
Gate 4: EXECUTION    → Build features
Gate 5: VALIDATION   → Verify & ship
```

---

## Prompts

**Standard:**
```
Follow @workflow/WORKFLOW.md
```

**With idea:**
```
Follow @workflow/WORKFLOW.md

IDEA: [your idea]
```

**Check status:**
```
Follow @workflow/WORKFLOW.md

STATUS
```

---

## Rules

1. SCOPE.md is mandatory
2. One question at a time
3. "AI" delegates to agent
4. CONFIRM locks gates
5. `make ship` does everything
