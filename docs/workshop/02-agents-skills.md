# Module 2 — Agents & Skills

**Goal:** use the `plan → work → review` loop, and author your own agent and skill.

## The workflow skills

- **`workshop:storm`** — explore *what* to build (brainstorm → `docs/brainstorms/`).
- **`workshop:plan`** — turn an idea into a plan (`docs/plans/`), with a design gate.
- **`workshop:work`** — execute a plan: dispatches **worker agents** by stack, writes tests, **commits** (stops at the commit).
- **`workshop:review`** — multi-agent review + the quality gate (Module 4): classifies findings, assigns advisory risk, runs tests.
- **`workshop:ship`** — opens the PR: assesses **risk + suggested review depth**, runs tests, and drafts a structured PR description.

The loop is **plan → work → review → ship**.

## The agent roster

Workers implement, reviewers self-check. See `workshop-harness/agents/`:

- workers: `node-worker`, `react-worker` (each self-checks with its paired reviewer)
- reviewers: `node-reviewer`, `react-reviewer`, `typescript-reviewer`, `test-reviewer`,
  `code-simplicity-reviewer`, `agent-smith` (security), `performance-oracle`
- research: `repo-research-analyst`

Which ones run is set in `workshop.local.md` (Module 1).

## Try it

1. Run **`workshop:plan`** for the Admin Dashboard (`docs/workshop/admin-dashboard-exercise.md`
   has the brief). Watch it research, propose a design, and write a plan.
2. Run **`workshop:work`** on the plan. Notice it routes frontend tasks to `react-worker` and
   API tasks to `node-worker`, and that each worker self-reviews before returning.

## Author your own

**A skill:** create `workshop-harness/skills/<name>/SKILL.md` with frontmatter:

```markdown
---
name: workshop:<name>
description: <what it does and when to use it>
---
```

**An agent:** create `workshop-harness/agents/<category>/<name>.md` with:

```markdown
---
name: <name>
description: "<what it does, when to trigger>"
model: inherit
---
<the agent's instructions / output contract>
```

Then `npm run build:harness` and use it in **both** tools. The smoke check enforces that skills
start with frontmatter and are `workshop:`-namespaced.

## Takeaway

Skills encode *how you work*; agents encode *who does the work*. Both are just markdown — version
them, review them, improve them like any other code.

Next: [Module 3 — MCP & tools](03-mcp-tools.md).
