# Harness Engineering Workshop

A hands-on, **half-day** workshop on *harness engineering* — building the context files, custom
agents, skills/commands, tooling, quality gates, and design loop that make an AI coding agent
productive on a real codebase. The harness is **agent-agnostic**: it runs the same in **Codex**
and **Claude Code**, generated from a single source.

> **The big idea:** your harness is just files. Author them once in `workshop-harness/`, run one
> build step, and the same capabilities show up in whatever agent you use.

---

## 1. Get the app running — start here

**Do this first** and confirm the store loads in your browser before touching the harness.
Works the same on **Windows, macOS, and Linux**.

**You need:** **Node ≥ 22**, **git**, and a coding agent (**Codex CLI** or **Claude Code**).

Run these in the repo root, in order:

```bash
# 0. Use one consistent Node >= 22 (on Apple Silicon, an arm64 Node).
nvm use            # selects the pinned version from .nvmrc (22); then:
node -v            # confirm it prints v22 or newer

# 1. Install all dependencies (api + web workspaces).
npm install

# 2. Install the Playwright browser (used for UI testing and the design loop).
npm run e2e:install

# 3. Start the app — TWO terminals (leave both running):
npm run start:api  # API → http://localhost:8010   (seeds data on first boot)
npm run start:web  # UI  → http://localhost:9010

# 4. Verify everything is wired up:
npm test           # api (Jest) + web (Vitest) — expect all green
```

Then open **http://localhost:9010** and sign in (password is `password` for both):

| email | password | role |
| --- | --- | --- |
| `admin@test.com` | `password` | admin (also sees the Admin Dashboard) |
| `user@test.com` | `password` | customer |

If you can browse products, add to cart, and reach checkout — you're ready. ✅

**Notes**
- First boot seeds **194 products** (from DummyJSON) and **120 orders** across 12 weeks. Deleting
  `apps/api/db/` re-seeds.
- **Start shortcuts** (optional): macOS/Linux `./start-api.sh` · `./start-web.sh`; Windows
  `start-api.cmd` · `start-web.cmd` (double-clickable). All call the same launcher
  (`scripts/start.mjs`), which checks your Node and reconciles native binaries
  (`better-sqlite3`, `esbuild`) for it — so a mismatched arch self-heals on first run.
- **Apple Silicon:** prefer an **arm64** Node (`nvm use`) to run natively; an x64 Node works but
  runs under Rosetta (the launcher will say so).
- **Optional `gh`** (GitHub CLI) is only needed for PR-based reviews.
- **End-to-end flows** (Playwright CLI) live in `e2e/` — e.g. `bash e2e/login-browse-cart.sh`
  (also `checkout.sh`, `write-review.sh`, `search-filter.sh`, `admin-dashboard.sh`). On Windows
  run them from Git Bash or WSL.

---

## 2. Set up the harness in your agent

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

## 3. Build a feature with the workflow

With the app running and your agent set up, work the loop: **`workshop:plan` → `workshop:work`
→ `workshop:review` → `workshop:ship`** (`work` implements and commits; `ship` opens a
risk-assessed PR). Start with the module guides in [`docs/workshop/`](docs/workshop/00-overview.md)
and pick something to build (e.g. the [Admin Dashboard exercise](docs/workshop/admin-dashboard-exercise.md)).
Re-run `npm run start:api` to pick up API changes (`npm run dev:api` gives watch mode).

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
