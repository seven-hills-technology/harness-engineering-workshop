# Module 1 — Context & Agent Files

**Goal:** make the agent understand this codebase before it writes a line, using the portable
context layer.

## Concepts

- **`CLAUDE.md` / `AGENTS.md`** — always-on instructions. Both are generated from
  `workshop-harness/context.md`; Claude reads `CLAUDE.md`, Codex reads `AGENTS.md`. Same content,
  one source.
- **`workshop.local.md`** — per-project config that tells `workshop:work` and `workshop:review`
  which worker/reviewer agents to dispatch. Created by `workshop:setup`.

## Try it

1. Open the repo in your agent. Ask it to summarize the stack and where the cart reservation
   logic lives. Notice it leans on the context file + `repo-research-analyst`.
2. Run **`workshop:setup`** (Claude: `/workshop:setup`; Codex: `/setup`). It detects the React +
   Node stack and writes `workshop.local.md` with a sensible agent roster. Open the file and read
   the `review_agents` / `worker_agents` lists.
3. Add a project-specific note to the **Review Context** section of `workshop.local.md` (e.g.
   "checkout stock-decrement is concurrency-sensitive — scrutinize transactions"). This is passed
   to review/worker agents.

## Edit the source, not the output

Add a one-line convention to `workshop-harness/context.md`, then:

```bash
npm run build:harness
```

Confirm it appears in **both** `CLAUDE.md` and `AGENTS.md`. That's the single-source idea in
miniature — you'll see it again in Module 3.

## Takeaway

Good context is the cheapest, highest-leverage part of the harness. Everything downstream
(planning, implementation, review) is better when the agent starts grounded.

Next: [Module 2 — Agents & skills](02-agents-skills.md).
