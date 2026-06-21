# Facilitator Notes

## Before the session

- Have attendees clone the repo and run, ahead of time:
  ```bash
  npm install
  npm run e2e:install        # downloads chromium for Playwright CLI
  ./start-api.sh             # confirm it seeds (194 products + 120 orders), API on :8010
  ./start-web.sh             # confirm http://localhost:9010 loads, login works
  npm test                   # api + web green
  ```
- **Node ≥ 22**, single consistent architecture. `./start-api.sh` checks the Node version and
  auto-rebuilds `better-sqlite3` for the running Node, which fixes the most common snag (mixed
  arm64/x86_64 Node installs breaking the native module on Apple Silicon).
- Each attendee picks their agent: **Codex** or **Claude Code**. Both are first-class.
  - Claude: `/plugin marketplace add .` then `/plugin install workshop`.
  - Codex: open the project and trust it; skills/agents/MCP load from `.agents/` + `.codex/`.

## Timing (half day, ~3.5h)

| Block | Time | Notes |
| --- | --- | --- |
| Intro + setup check | 20m | confirm everyone's harness loads in their agent |
| M1 Context & agent files | 30m | run `workshop:setup`; edit `context.md`, rebuild |
| M2 Agents & skills | 45m | run plan→work; author a small skill or agent |
| M3 MCP & tools + generator | 30m | read `build-harness.mjs`; add an MCP entry; run an e2e |
| M4 Design loop + quality gate | 45m | `--visual` mockup; run `workshop:review` gate |
| Admin Dashboard build | 40m | guided; reference impl is the answer key |
| Wrap-up | 10m | recap; point at the reference implementation |

## Demo tips

- The single-source payoff lands best live: edit `workshop-harness/context.md`, run
  `npm run build:harness`, and show the change in **both** `CLAUDE.md` and `AGENTS.md`.
- For the quality gate, deliberately break a test and run `workshop:review` so attendees see the
  one hard gate fail while risk stays advisory.
- The lavish-axi loop needs a human in the loop — do it as a live demo, not a silent step.

## Common issues

- **`better-sqlite3` architecture error** → `./start-api.sh` auto-rebuilds it for the running
  Node; if it persists, ensure a single consistent Node ≥ 22 and re-run the script.
- **Codex doesn't see skills** → check the Codex version vs
  `workshop-harness/harness.config.json` `targets.codex.minVersion`; skills live in `.agents/skills`.
- **lavish-axi won't start** → needs Node ≥ 22 and network on first `npx`; it degrades to a
  text-only design doc otherwise.
- **Port in use** → API 8010, web 9010; free them or adjust.

## The point

By the end, attendees should see that a harness is **just files** — context, agents, skills,
tools, gates — that they can author, generate, review, and improve, and that the same harness
runs in any agent.
