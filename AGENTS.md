# Harness Engineering Workshop

This repository is the hands-on project for the **Harness Engineering Workshop** — learning how
to engineer an AI coding agent's *harness*: its context files, custom agents, skills/commands,
tooling (MCP / CLIs), quality gates, and interactive design loop. The same harness runs in both
**Codex** and **Claude Code**.

## How the harness works (read this first)

The harness is authored **once** in `workshop-harness/` and **generated** into each tool's
native config by a small build script. **Never edit the generated files directly** — edit the
source and regenerate:

```bash
npm run build:harness
```

| You edit (source) | It generates |
| --- | --- |
| `workshop-harness/context.md` | `CLAUDE.md` (Claude) + `AGENTS.md` (Codex) |
| `workshop-harness/skills/<name>/SKILL.md` | `plugins/workshop/skills/` + `.agents/skills/` |
| `workshop-harness/agents/<cat>/<name>.md` | `plugins/workshop/agents/` + `.codex/agents/*.toml` |
| `workshop-harness/mcp.json` | `plugins/workshop/.mcp.json` + `.codex/config.toml` |

The harness skills are namespaced `workshop:` — `workshop:storm`, `workshop:plan`, `workshop:work`,
`workshop:review`, `workshop:ship`, `workshop:setup`. The core loop is **plan → work → review →
ship** (`work` implements and commits; `ship` opens a risk-assessed PR).

## Project layout

- `apps/api` — NestJS + TypeORM + better-sqlite3 e-commerce API (added in later phases).
- `apps/web` — React + Vite + Tailwind storefront and admin (added in later phases).
- `e2e/` — Playwright CLI end-to-end flows.
- `workshop-harness/` — the single source of truth for the harness.
- `scripts/build-harness.mjs` — the generator.
- `docs/` — brainstorms, designs, plans, specs, and workshop module guides.

## Conventions

- **Node ≥ 22** (the visual design loop, lavish-axi, requires it).
- **Tests are not optional.** Every feature ships with unit tests; user-facing flows ship with
  end-to-end tests (Playwright CLI). The quality gate fails on a red suite or a coverage drop.
- Follow existing patterns; match naming exactly; prefer the smallest change that works.
- After changing anything under `workshop-harness/`, run `npm run build:harness` and commit the
  regenerated artifacts.

## Browser automation

Use the **Playwright CLI** (`@playwright/cli`, invoked via `npx playwright-cli`) for any browser
task — navigation, screenshots, and end-to-end checks. Take a `snapshot` to get element refs
(e.g. `e21`), then act on the refs. (Wired up in a later phase.)

---

## Codex notes

Workshop skills live in `.agents/skills/<name>/SKILL.md` and named agents in
`.codex/agents/<name>.toml`. MCP servers are configured in
`.codex/config.toml`. This file is generated from `workshop-harness/context.md` —
edit the source and run `npm run build:harness`.
