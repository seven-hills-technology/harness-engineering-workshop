# Design Discussion: Harness Engineering Workshop

**Date:** 2026-06-21
**Feature:** A self-contained, agent-agnostic (Codex + Claude) workshop teaching harness engineering, delivered on a larger React + NestJS e-commerce app, with a single-source harness that generates both tools' config, the lavish-axi design loop, a worktree-free quality gate, and enforced unit + e2e tests.
**Origin:** `docs/brainstorms/2026-06-21-harness-engineering-workshop-brainstorm.md`

---

## Current State

This repo is **empty** (no git history yet). Two reference clones inform the build:

- `/tmp/ai-workshop-final` — the prior workshop app (NestJS 10 + TypeORM/better-sqlite3 API, Angular 18 web). We **reuse the API**, **drop the Angular web** for React.
- `/tmp/sht-cc-plugin` — the official Seven Hills Claude Code plugin/marketplace (`sht:plan/work/review/storm/setup`, 32 agents, lavish-axi loop, remote MCP). We **port a renamed, stripped, agnostic subset**.

Key facts established by research (see brainstorm + research notes):

- **Codex and Claude have converged on the Agent Skills `SKILL.md` standard.** Claude reads `.claude/skills/<n>/SKILL.md`; Codex reads `.agents/skills/<n>/SKILL.md` — *same file format, different directory.*
- The only real per-tool **transforms** are: subagents (Claude `agents/<n>.md` MD+YAML ↔ Codex `.codex/agents/<n>.toml`) and MCP (`.mcp.json` JSON ↔ `.codex/config.toml [mcp_servers.*]` TOML). Context files are a 1:1 (`CLAUDE.md` ↔ `AGENTS.md`).
- Codex `prompts/` are **deprecated** — emit skills, not prompts.
- A Claude **plugin** is what yields the `workshop:plan` namespace; bare `.claude/skills/` would give `/plan`. So we ship a **local marketplace + plugin**, mirroring the official structure.
- **Playwright CLI** (`@playwright/cli`) ships `playwright-cli install --skills` → writes `.claude/skills/playwright-cli/`; Codex needs a manual mirror to `.agents/skills/` + an AGENTS.md directive (GH issue #39317 tracks native support).
- **lavish-axi** `0.1.31` (Node ≥ 22) runs via `npx -y lavish-axi`; `lavish-axi setup hooks` even wires SessionStart hooks for Claude, Codex, and OpenCode. Its layout audit (overflow/clip/overlap) is a useful design signal.
- **no-mistakes** gives a clean **worktree-free** model to lift: findings carry `action: no-op|auto-fix|ask-user` + `risk_level`/`risk_rationale`, and PR bodies are deterministic sections wrapped around one LLM summary call.

No `seven-hills.local.md` / `workshop.local.md` exists yet. **Decision:** proceed without `/sht:setup` now (nothing to detect in an empty repo); the plan will introduce `workshop:setup` writing `workshop.local.md` once the app scaffold exists.

---

## Patterns to Follow

- **Plugin/marketplace structure** from `/tmp/sht-cc-plugin`: `.claude-plugin/marketplace.json` → `plugins/workshop/` with `.claude-plugin/plugin.json`, `skills/<n>/SKILL.md` (+ `references/`), `agents/<category>/<n>.md`, and the CLAUDE.md authoring conventions (3-file versioning rule, Skill Compliance Checklist, AskUserQuestion numbered-list fallback).
- **Skill phase structure & references** from `sht-plan/work/review/storm/setup` — port the flows, **strip** the `start_sht_*` telemetry, **remove** git-worktree dependence, **rename** `sht:` → `workshop:` and `seven-hills.local.md` → `workshop.local.md`, **swap** `agent-browser`/Figma/Playwright-MCP → **Playwright CLI**. **Keep** lavish-axi as-is (it is an npx CLI, not a browser MCP).
- **NestJS module-per-feature** + TypeORM entities + DummyJSON seed + global JWT guard/`@Public()`/`AdminGuard` from `/tmp/ai-workshop-final/apps/api`. Reuse verbatim, extend with new modules.
- **The cart reservation contract** (`reservedAt` + computed `availableStock`, `BEGIN IMMEDIATE` retry) is the contract checkout consumes.
- **frontend-design** aesthetics + Tailwind for the React UI (lavish-axi is Tailwind-aware).

---

## Desired End State

A monorepo (npm workspaces) that, on clone, gives an attendee a working harness in **either** Codex or Claude and a substantial e-commerce app to engineer against.

```
ai-workshop/
  workshop-harness/                  # SINGLE SOURCE OF TRUTH (edit here)
    harness.config.json              # namespace, skill/agent/mcp manifest, tool versions
    context.md                       # base conventions  -> CLAUDE.md + AGENTS.md
    skills/<name>/SKILL.md (+refs)   # workshop:plan|work|review|storm|setup
    agents/<category>/<name>.md      # workers, reviewers, research (MD+YAML source)
    mcp.json                         # MCP server list (source)
  scripts/build-harness.mjs          # generator: source -> both targets (teaching artifact)

  # --- GENERATED (committed so clone-and-go works; regenerate via npm run build:harness) ---
  .claude-plugin/marketplace.json    # local marketplace -> plugins/workshop
  plugins/workshop/                   # Claude plugin (skills/, agents/, .mcp.json, plugin.json)
  CLAUDE.md                           # = context.md
  AGENTS.md                           # = context.md + Codex tool directives (Playwright CLI, etc.)
  .agents/skills/<name>/              # Codex skills (copied from source) + playwright-cli mirror
  .codex/agents/<name>.toml           # Codex subagents (transformed from MD+YAML)
  .codex/config.toml                  # Codex MCP servers (transformed from mcp.json)
  workshop.local.md                   # written by workshop:setup (agent dispatch config)

  apps/
    api/                              # NestJS (ported) + orders, reviews-write, search/reco
    web/                              # NEW React + Vite + Tailwind storefront + admin
  e2e/                                # Playwright CLI end-to-end flows
  docs/                               # brainstorms / designs / plans / specs / workshop modules
  README.md                           # setup for BOTH Codex and Claude attendees
```

**Harness commands (both tools):** `workshop:plan` (with `--visual`/`--skip-design`, lavish-axi loop), `workshop:work` (worker dispatch + enforced tests), `workshop:review` (worktree-free quality gate: advisory risk + finding classification + structured PR body), `workshop:storm`, `workshop:setup`.

**App, baseline (prebuilt by us via this plan):** auth, product catalog + admin inventory, cart w/ reservation, **Checkout & Orders**, **Reviews write-flow + UI**, **Search/filter/recommendations** — all working, all tested.

**App, the workshop build feature:** **Admin Dashboard** (sales / inventory / low-stock / order metrics, charts) — built live across modules 2–4 using the harness, lavish-axi, Playwright CLI, and the quality gate.

---

## Design Decisions

1. **Single-source generator, thin by design.** Author once in `workshop-harness/`; `build-harness.mjs` (a) copies `context.md`→`CLAUDE.md`/`AGENTS.md`, (b) copies each `SKILL.md` tree to both `plugins/workshop/skills/` and `.agents/skills/`, (c) copies agent MD into the plugin and **transforms** it to `.codex/agents/*.toml`, (d) emits MCP as `.mcp.json` + `config.toml`. The script is itself a Module-3 teaching artifact.
2. **Ship as a local Claude plugin + marketplace** to get the `workshop:` namespace (matches the official plugin). One-time `/plugin marketplace add .` + install, documented in README. Codex works with no install (reads `.agents/`/`.codex/`/`AGENTS.md`).
3. **Commit generated artifacts.** Attendees get working tooling immediately; `npm run build:harness` regenerates. Avoids a mandatory build step on day one.
4. **Strip telemetry & private MCP entirely** (no `start_sht_*`, no SHT Admin server) — zero private dependencies.
5. **Worktree-free quality gate.** `workshop:review` operates on `git diff HEAD`, classifies findings (`auto-fix` applied in place; `ask-user` batched into one escalation), assigns **advisory** `LOW|MED|HIGH` risk + rationale + suggested human action (never blocks), and emits a structured PR body (deterministic `## Intent`/`## Risk`/`## Testing`/`## Findings` + one LLM `## What Changed`). **Tests are the one objective gate** that can fail a run. Worktree isolation is ported as the `git-worktree` skill but **optional** (advanced demo only).
6. **Playwright CLI is the single browser layer**, added as a **repo dev-dependency** (`@playwright/cli`) and invoked via `npx playwright-cli` — nothing global to install, works on clone. The setup step runs `playwright-cli install --skills` and mirrors the generated skill to `.agents/skills/` + an AGENTS.md directive. Used by `workshop:review` e2e/design checks and the e2e suite. Drop Playwright MCP, Figma MCP, `agent-browser`.
7. **lavish-axi carried over verbatim** into `workshop:plan` Phase 1.7 (incl. `--visual`, pre-flight, poll loop, graceful degradation, teardown), pinned to `0.1.31`, renamed namespace only.
8. **React stack:** Vite + React + TypeScript + React Router + TanStack Query + Tailwind (Tailwind chosen for lavish-axi/frontend-design synergy). Charts via Recharts.
9. **Reuse NestJS API verbatim**, extend with `orders`, reviews-write on `products`, and search/reco. The `Order` entity carries a **`status`** field (`pending|paid|fulfilled|cancelled`) and `createdAt`. Fix the spec/impl drift (2-min `reservedAt` vs 5-min `expiresAt`) as a documented decision, not silently. Change CORS origin + web base URL to the React dev port.
9b. **Seed a history of orders.** Extend the seeder to generate synthetic orders for the seeded users across the past N weeks, with varied statuses, products, and quantities, so the Admin Dashboard has real data to chart on day one. Idempotent (gated on `order count > 0`, like the product seed). Deleting the sqlite re-seeds products **and** order history.
10. **Testing:** API → Jest (port existing specs + add orders/reviews/search/admin + a real in-memory concurrency spec pattern). Web → Vitest + React Testing Library. E2E → Playwright CLI flows in `e2e/`. `workshop:work` must add/update tests per feature (enforced via `test-requirements.md`).
11. **Agent roster (focused subset):** workers `node-worker`, `react-worker`; reviewers `node-reviewer`, `react-reviewer`, `typescript-reviewer`, `test-reviewer`, `code-simplicity-reviewer`, `agent-smith` (security), `performance-oracle`; research `repo-research-analyst`. Plus the design loop. (Drop .NET/Bruno/Angular/Figma-specific agents.)
12. **Drop stacked-PR / Graphite** machinery from `workshop:work` for simplicity.
13. **Curriculum (half day, 4 modules)**, Admin Dashboard threaded through:
    - **M1 — Context & agent files:** `CLAUDE.md`/`AGENTS.md`, `workshop.local.md`, onboarding the agent to the larger codebase.
    - **M2 — Agents & skills:** the `workshop:plan → work → review` loop; author/extend one agent or skill (build-it-yourself pillar).
    - **M3 — MCP & tools + the generator:** Playwright CLI wiring, the single-source build script, optional MCP add.
    - **M4 — Interactive design + quality gate:** lavish-axi mockup for the dashboard, worktree-free review + advisory risk, enforced tests; ship the Admin Dashboard.

---

## Resolved Questions

1. **Scope** → **Build the full baseline** — all three features (Checkout/Orders, Reviews-write, Search/reco) fully implemented + tested, full React UI.
2. **Sequencing** → **Harness-first**: A Harness + generator + plugin → B API extensions + tests → C React app + tests → D Quality gate + Playwright + lavish → E Module docs + Admin Dashboard.
3. **Distribution (Claude)** → Local **marketplace + plugin** (yields `workshop:` namespace); one-time `/plugin marketplace add .` documented in README. Codex needs no install.
4. **Codex version** → README pins a **minimum Codex version** and documents the `.agents/skills` convention; the build smoke-check verifies the path against the installed version.
5. **Playwright CLI** → **Repo dev-dependency + npx** (no global install).
6. **lavish-axi hooks** → Keep lavish **inside `workshop:plan`**; `lavish-axi setup hooks` is offered as an *optional* step in `workshop:setup`, not run by default (avoids touching global config).
7. **Admin Dashboard** → **All four metrics**: revenue over time, top products, low-stock table, orders by status. Requires `Order.status` + **seeded order history** (Decision 9b).

---

## Testing Strategy

- **Unit (API):** Jest. Port `auth`, `carts` specs (incl. the real in-memory better-sqlite3 concurrency spec); add specs for `orders` (cart→order conversion, stock decrement, idempotency), reviews-write (auth, rating aggregation), search/filter, and admin aggregations.
- **Unit (Web):** Vitest + React Testing Library for components/hooks (product grid, cart drawer, checkout form, reviews form, dashboard widgets).
- **E2E:** Playwright CLI flows in `e2e/` — browse→cart→checkout→order history, write-a-review, search/filter, admin dashboard render. Snapshot→ref→act pattern; named session via `PLAYWRIGHT_CLI_SESSION`.
- **Enforced in workflow:** `workshop:work`'s `test-requirements.md` mandates tests per change type; `workshop:review` runs the suite as the **one objective gate** (red suite or coverage drop fails the run); risk-level human review stays advisory.
- **Verification of the harness itself:** the generator has a smoke check (generated `.codex/*.toml` parses; `.claude/` plugin loads; skill names resolve in both tools).
