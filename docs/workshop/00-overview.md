# Workshop Overview — Harness Engineering

**Format:** half day, 4 modules. **You'll build:** the Admin Dashboard, end-to-end, using the
harness — in whichever agent you use (Codex or Claude Code).

## What is "harness engineering"?

The model is only half the system. The other half is the **harness** you build around it:

- **Context** — what the agent always knows (`CLAUDE.md` / `AGENTS.md`, project conventions).
- **Agents** — specialized sub-agents (workers, reviewers, researchers) you dispatch.
- **Skills / commands** — repeatable workflows (`workshop:plan → work → review → ship`).
- **Tools** — MCP servers and CLIs (here, the Playwright CLI) the agent can drive.
- **Quality gates** — how changes get classified, risk-rated, tested, and shaped into PRs.
- **Design loop** — getting human feedback on UI before building it.

This repo is a working harness plus a real app to practice on. Everything is generated from
`workshop-harness/` so the same harness runs in any agent.

## The arc

| Module | You learn | Applied to |
| --- | --- | --- |
| 1. Context & agent files | onboarding the agent to a codebase | reading the app |
| 2. Agents & skills | the plan→work→review loop; authoring your own | scaffolding the dashboard |
| 3. MCP & tools + the generator | wiring tools; single-source generation | Playwright CLI checks |
| 4. Design loop + quality gate | lavish-axi mockups; worktree-free review | shipping the dashboard |

## Ground rules

- Tests are not optional — every change ships with them; the gate fails on red.
- Edit the harness **source** (`workshop-harness/`), then `npm run build:harness`.
- Prefer the smallest change that works; follow existing patterns.

Start with [Module 1](01-context.md).
