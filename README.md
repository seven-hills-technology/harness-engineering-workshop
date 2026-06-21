# Harness Engineering Workshop

A hands-on, **half-day** workshop on *harness engineering* — building the context files, custom
agents, skills/commands, tooling, quality gates, and design loop that make an AI coding agent
productive on a real codebase. The harness is **agent-agnostic**: it runs the same in **Codex**
and **Claude Code**, generated from a single source.

The teaching vehicle is a larger e-commerce app (React + NestJS + SQLite) with a working
storefront, cart, checkout/orders, reviews, and search. The feature you build *during* the
workshop is the **Admin Dashboard**.

> **The big idea:** your harness is just files. Author them once in `workshop-harness/`, run one
> build step, and the same capabilities show up in whatever agent you use.

---

## Prerequisites

- **Node ≥ 22** (the visual design loop, lavish-axi, requires it). Use one consistent Node — the
  start scripts auto-rebuild `better-sqlite3` for your Node, so mixed arm64/x86_64 installs are
  handled for you.
- **git**, and optionally the **GitHub CLI** (`gh`) for PR reviews.
- A coding agent: **Codex CLI** or **Claude Code**.

> **Works on Windows, macOS, and Linux.** The cross-platform commands below (`npm run start:*`)
> are the same everywhere; there are also `./start-*.sh` (macOS/Linux) and `start-*.cmd` (Windows)
> shortcuts.

## Quick start

```bash
npm install                 # installs all workspaces (api + web)

# run the app — two terminals. Cross-platform (Windows / macOS / Linux):
npm run start:api           # NestJS API on http://localhost:8010  (seeds on first boot)
npm run start:web           # React app on  http://localhost:9010

# tests
npm test                    # api (Jest) + web (Vitest)
```

**Shortcuts** (optional): macOS/Linux `./start-api.sh` · `./start-web.sh` — Windows
`start-api.cmd` · `start-web.cmd` (or double-click them). All call the same Node launcher
(`scripts/start.mjs`), which checks Node, installs deps, and fixes the `better-sqlite3` native
build if needed.

**End-to-end** (Playwright CLI; the flow scripts are bash — on Windows use Git Bash or WSL):

```bash
npm run e2e:install         # once: install a browser (cross-platform)
bash e2e/login-browse-cart.sh   # and checkout.sh / write-review.sh / search-filter.sh / admin-dashboard.sh
```

First boot seeds **194 products** (from DummyJSON) and **120 synthetic orders** across 12 weeks.
Deleting `apps/api/db/` (or a root `db/`) re-seeds. Test accounts (password `password`):

| email | role |
| --- | --- |
| `admin@test.com` | admin (sees Admin Dashboard) |
| `user@test.com` | customer |

---

## Set up the harness in your agent

The harness is authored once in `workshop-harness/` and **generated** into each tool's native
config (already committed, so it works on clone). Skills are namespaced `workshop:` —
`workshop:plan`, `workshop:work`, `workshop:review`, `workshop:storm`, `workshop:setup`, plus
`workshop:playwright-cli`.

### Claude Code

```text
/plugin marketplace add .
/plugin install workshop
```

Then the skills are available as `/workshop:plan`, `/workshop:work`, `/workshop:review`, … and
the agents as `workshop:<category>:<name>`. (Context lives in `CLAUDE.md`; MCP in
`plugins/workshop/.mcp.json`.)

### Codex

No install step — Codex reads the generated files on open (trust the project when prompted):

- skills → `.agents/skills/<name>/SKILL.md` (invoke as `/<name>`)
- agents → `.codex/agents/<name>.toml`
- MCP → `.codex/config.toml`
- context → `AGENTS.md`

Use a recent Codex (the `.agents/skills` convention; see `workshop-harness/harness.config.json`
`targets.codex.minVersion`).

### Editing the harness

Never edit the generated files. Edit the source under `workshop-harness/` and regenerate:

```bash
npm run build:harness     # regenerates both targets + smoke check
npm run harness:check     # fails if generated output is out of date (drift check)
```

---

## The workshop

Four modules, building the **Admin Dashboard** as the running example. See [`docs/workshop/`](docs/workshop/):

1. [Context & agent files](docs/workshop/01-context.md) — `CLAUDE.md` / `AGENTS.md`, `workshop.local.md`.
2. [Agents & skills](docs/workshop/02-agents-skills.md) — the `plan → work → review` loop; author your own.
3. [MCP & tools + the generator](docs/workshop/03-mcp-tools.md) — Playwright CLI, the single-source build.
4. [Interactive design + quality gate](docs/workshop/04-design-gate.md) — lavish-axi mockups, the worktree-free review gate.

Then: the [Admin Dashboard exercise](docs/workshop/admin-dashboard-exercise.md). Facilitators: see [facilitator-notes.md](docs/workshop/facilitator-notes.md).

---

## Repo layout

```
workshop-harness/   single source of truth for the harness (edit here)
scripts/            build-harness.mjs (the generator)
apps/api/           NestJS + TypeORM + better-sqlite3 e-commerce API
apps/web/           React + Vite + Tailwind storefront + admin
e2e/                Playwright CLI end-to-end flows
docs/               brainstorms / designs / plans / specs / workshop modules
# generated (committed): CLAUDE.md, AGENTS.md, plugins/workshop/, .agents/, .codex/, .claude-plugin/
```
