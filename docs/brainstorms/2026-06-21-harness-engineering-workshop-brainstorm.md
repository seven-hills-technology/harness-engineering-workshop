# Brainstorm: Harness Engineering Workshop

**Date:** 2026-06-21
**Author:** Brad Gardner
**Status:** Captured — open questions pending

---

## What We're Building

A new, self-contained **"Harness Engineering"** workshop that teaches participants how to
engineer an AI coding agent's harness — the context files, custom agents, skills/commands,
MCP tooling, and interactive design loop that make an agent productive on a real codebase.

The workshop is **agent-agnostic**: it must run equally well in **Codex** (the delivery
audience's standard) and **Claude Code**. To guarantee parity without drift, the harness is
authored **once** in a single source directory and **generated** into both targets by a
lightweight build script.

The vehicle is a **larger e-commerce platform** (React + NestJS + SQLite), taking the previous
`ai-workshop` storefront as inspiration but rebuilt fresh in this repo with more surface area.
Participants use the harness to ship a small **feature roadmap** while learning to extend the
harness itself.

Delivery is in **a few days**, so the design favors smoothness and self-containment over
breadth.

---

## Why This Approach

- **Single source → generated targets** beats hand-mirrored configs: one place to edit, no
  Claude/Codex drift, and the build script itself becomes a teachable artifact ("your harness
  is just files you can generate"). Chosen over a curated manual mirror.
- **Continue the e-commerce domain** (vs. a brand-new SaaS/marketplace) so the audience spends
  cognitive budget on harness engineering, not domain ramp-up. The prior app explicitly left
  off at "foundation for checkout — additive, not a rewrite."
- **React + NestJS + SQLite** keeps the proven backend while moving the frontend to React,
  which is more common in the Codex crowd and maps to mature design/review tooling.
- **Hybrid pedagogy** (core provided, pillars built) lets day-one demos work immediately while
  still giving hands-on harness-authoring practice — the right balance for a short delivery.
- **Local plugin, not the official one**, so the workshop is fully self-contained and the
  skills can be renamed to the neutral `workshop:` namespace.

---

## Key Decisions

| Area | Decision |
|------|----------|
| **Agnostic strategy** | One source of truth (`workshop-harness/` markdown + manifest) → lightweight build script emits a Claude Code plugin (`.claude/`) **and** Codex config (`AGENTS.md` + `.codex/`). |
| **Harness packaging** | A **local plugin in this repo**, based on the official `sht-cc-plugin`, but renamed and stripped to be self-contained. |
| **Skill namespace** | `workshop:` prefix (e.g. `workshop:plan`, `workshop:work`, `workshop:review`) — **not** `sht:`. |
| **Curriculum pillars** | All four: (1) context & agent files, (2) custom agents & skills, (3) MCP & tools, (4) interactive design loop. |
| **Interactive design** | Include the **lavish-axi** visual-mockup feedback loop (the "lavish setup") wired into `workshop:plan`. |
| **Browser tooling** | **Playwright CLI** (`@playwright/cli`, Bash-driven, agent-native) auto-wired into the harness for both Claude and Codex — **not** Playwright MCP. Used for design review + UI testing. |
| **Telemetry** | **Strip entirely** — no `start_sht_*` / private SHT MCP calls. Zero private dependencies. |
| **Quality / human-review gate** | Workshop-native gate (inspired by `no-mistakes`, not adopted directly): assigns an **advisory risk level + suggested human-review action**, classifies findings (auto-fix vs needs-judgment), emits a **structured PR body + review checklist**. **Runs in place — no git worktree required.** |
| **Risk model** | **3-tier LOW / MEDIUM / HIGH**, inferred from change surface (auth, data/migrations, payments, public API, breadth). **Advisory only** — explains itself and suggests an action; does **not** block. |
| **Testing** | **Baseline tests ship + enforced in workflow.** API: Jest unit/integration. Web: Vitest + Testing Library. E2E: **Playwright CLI** flows. `workshop:work` must add/update tests per feature; tests are the **one objective gate** that can fail the run (red or coverage drop). |
| **Pedagogy** | **Hybrid** — ship plan/work/review backbone + Playwright + quality gate + tests working on day one; leave the design loop and a couple of agents/skills as guided build-it-yourself exercises. |
| **Length** | **Half day, ~3–4 modules.** More is provided; one feature is built live. |
| **Sample app stack** | React + NestJS/Node + SQLite (TypeORM/better-sqlite3). |
| **Sample app domain** | Bigger e-commerce platform, continuing the storefront + cart. |
| **Baseline (prebuilt) features** | Products + cart, **Checkout & Orders**, **Reviews & Ratings UI**, **Search / Filter / Recommendations** — all ship working on day one as the larger system. |
| **Workshop build feature** | **Admin Dashboard** — the new feature participants build during the workshop using the harness. |
| **Starting point** | Build fresh in this directory (`/Users/bradgardner/dev/sht/ai-workshop`), using the original repo as inspiration. |

---

## Proposed Shape (illustrative — details belong in the plan)

```
ai-workshop/
  workshop-harness/            # SINGLE SOURCE OF TRUTH (edit here)
    manifest.yaml              # which agents/skills/MCP, namespacing
    context.md                 # base project conventions (-> CLAUDE.md + AGENTS.md)
    agents/*.md                # plain-markdown subagents (worker/review/research/design)
    skills/*.md                # workshop:plan / work / review / storm ...
  scripts/build-harness.*      # generates the two targets below
  .claude/                     # GENERATED: plugin (skills/, agents/, .mcp.json)
  AGENTS.md + .codex/          # GENERATED: Codex prompts/agents/config
  apps/
    api/                       # NestJS + SQLite (products, cart, orders, reviews, search)
    web/                       # React storefront + admin
  docs/                        # brainstorms / designs / plans / specs
```

**Playwright CLI** (`npm i -g @playwright/cli`) is auto-wired via a harness skill and used by
the design/test agents through Bash — identical in Claude and Codex, no MCP dependency. The
lavish-axi loop stays self-contained (npx-based, Node ≥ 22) and is wired into `workshop:plan`,
carrying over the official `sht:plan` integration **including the `--visual` flag** (and the
graceful text-only fallback).

---

## Quality & Human-Review Gate

The audience is standardized on Codex and cares about **maintaining quality and human checks**.
The harness makes review structure a first-class, agent-agnostic concern — inspired by
[`no-mistakes`](https://github.com/kunchenguid/no-mistakes) but built workshop-native and
**without any git-worktree dependency** (it runs in place).

What the gate does on every change set (via `workshop:review` / a `workshop:ship` step):

1. **Assign a risk level — advisory, never blocking.** `LOW` / `MEDIUM` / `HIGH`, inferred from
   the change surface (auth, data/migrations, payments, public API, breadth of blast radius).
   Each level carries a **suggested human-review action** and a short **explanation of why** —
   so the human knows what to look at, but nothing is forced.
   - `LOW` — mechanical/contained; a quick skim is enough.
   - `MEDIUM` — standard review against the checklist.
   - `HIGH` — deep review suggested; reviewer sign-off + extra e2e recommended.
2. **Classify findings** as **auto-fix** (mechanical, applied) vs **needs-judgment**
   (escalated to the human with context) — the genuinely useful idea borrowed from `no-mistakes`.
3. **Emit a structured PR body + review checklist** so PRs have consistent shape and reviewers
   have a concrete list.

**Worktree isolation** (running the gate in a disposable checkout, as `no-mistakes` does) is
**deferred to an optional advanced demo** later — the Seven Hills `git-worktree` skill can back
it. Not required for the baseline workshop.

---

## Testing Strategy

The whole system ships with **real, passing tests**, and the workflow keeps them honest as
features are added — directly addressing the "valid, useful, and maintained" requirement.

- **Baseline coverage (day one):**
  - **API** — Jest unit + integration tests across products, cart, checkout/orders, reviews,
    search.
  - **Web** — Vitest + React Testing Library for components and stores.
  - **E2E** — **Playwright CLI** flows covering the core journeys (browse → cart → checkout,
    write a review, search/filter).
- **Maintained in the workflow:** `workshop:work` **must add or update unit + e2e tests** for
  every feature it implements (enforced via the work skill's quality checklist).
- **The one objective gate:** tests are the single check that can **fail the run** — a red
  suite or a coverage drop stops the ship step. (Risk-level human review stays advisory by
  contrast.) If you'd prefer tests advisory too for a half-day pace, that's a one-line change.

---

## App: Baseline vs. Workshop Build

The sample app ships as a **larger, fully-working e-commerce platform** so participants spend
their time on harness engineering, not catching the app up. The one feature built *during* the
workshop is the **Admin Dashboard**.

### Baseline features (prebuilt, day one)
1. **Products + Cart** — carried over from the original workshop (reservation-based cart).
2. **Checkout & Orders** — cart → checkout flow, `Order`/`OrderItem`, confirmation + history.
3. **Reviews & Ratings UI** — product-detail reviews section + write-a-review flow.
4. **Search, Filter & Recommendations** — faceted search, category/price filters, related
   products.

### Workshop build target: Admin Dashboard
A new admin analytics surface (sales/inventory/low-stock/order metrics with charts + tables),
built live across the harness. Chosen because it exercises **all four pillars** in one feature:
- *Context & agent files* — onboarding the agent to the existing larger codebase.
- *Custom agents & skills* — `workshop:plan → work → review` on a real feature.
- *MCP & tools / Playwright CLI* — UI testing the new dashboard.
- *Interactive design loop* — lavish-axi mockups + Playwright design review for the data-viz UI.

Facilitators can demo a slice live; participants build the rest as the hands-on exercise.

---

## Out of Scope (YAGNI)

- Multi-vendor / marketplace features, payments-processor integration, real-time inventory
  (WebSocket).
- The official plugin's full 32-agent / 18-skill catalog — include only what the four pillars
  and the Admin Dashboard need.
- The private SHT Admin telemetry MCP and `start_sht_*` calls (stripped).
- Playwright **MCP**, Figma MCP, and the `agent-browser` CLI — superseded by Playwright CLI.
- Adopting `no-mistakes` directly, and **git-worktree isolation** for the gate — both deferred
  to optional advanced demos; the baseline gate runs in place.
- **Blocking** on the risk level — risk-based human review is advisory by design.

---

## Open Questions

*(none blocking — ready for planning)*

---

## Resolved Questions

1. **Telemetry calls** → **Strip entirely.** No `start_sht_*` / private SHT MCP. Zero private
   dependencies.
2. **Browser layer** → **Playwright CLI** (`@playwright/cli`), auto-wired and Bash-driven, for
   both harnesses. Drop Playwright MCP, Figma MCP, and `agent-browser`.
3. **Design-loop parity** → lavish-axi (Node ≥ 22, npx) accepted as a prerequisite; the stack
   is Node anyway. Text-only fallback remains for offline/old-Node cases.
4. **Workshop length** → **Half day, ~3–4 modules.**
5. **Hero / build feature** → The three feature themes (Checkout, Reviews, Search) become the
   **prebuilt baseline**; the **Admin Dashboard** is the new feature built during the workshop.
6. **Seed data & auth** → Keep the DummyJSON product seed and the `admin@test.com` /
   `user@test.com` (password `password`) accounts for continuity. *(Reasonable default —
   raise in planning if you'd prefer fresh seed data.)*
7. **Quality / human-review gate** → Workshop-native, inspired by `no-mistakes`, **worktree-free**.
   Advisory 3-tier risk (LOW/MED/HIGH) with suggested action + explanation, finding
   classification (auto-fix vs needs-judgment), structured PR body + checklist. Worktree
   isolation deferred to an optional demo.
8. **Testing** → Baseline unit + e2e ship and are **enforced in the workflow** (Jest API,
   Vitest + Testing Library web, Playwright CLI e2e). `workshop:work` maintains tests per
   feature; tests are the one objective gate that can fail the run.
9. **`workshop:plan` design integration** → Carries over the `sht:plan` lavish-axi loop
   **including the `--visual` flag** and text-only fallback.
