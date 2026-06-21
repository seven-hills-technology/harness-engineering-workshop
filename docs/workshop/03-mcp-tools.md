# Module 3 — MCP, Tools & the Generator

**Goal:** understand how tools reach the agent, and how one source produces both tools' config.

## The generator

`scripts/build-harness.mjs` reads `workshop-harness/` and writes both tools' native config. Open
it — it's dependency-free and small on purpose. The mapping:

| Source | Claude | Codex | Operation |
| --- | --- | --- | --- |
| `context.md` | `CLAUDE.md` | `AGENTS.md` | copy |
| `skills/<n>/SKILL.md` | `plugins/workshop/skills/` | `.agents/skills/` | copy to two dirs |
| `agents/<cat>/<n>.md` | `plugins/workshop/agents/` | `.codex/agents/<n>.toml` | **transform (MD→TOML)** |
| `mcp.json` | `plugins/workshop/.mcp.json` | `.codex/config.toml` | **transform (JSON→TOML)** |

The only real transforms are **agents** and **MCP**. Skills are a shared `SKILL.md` standard, so
they're just copied. Run `npm run build:harness` and watch the summary; `npm run harness:check`
fails on drift (this is what a CI/quality gate would run).

## The Playwright CLI

The single browser layer — a repo dev-dependency, invoked with `npx playwright-cli`. It's
vendored as the `workshop:playwright-cli` skill (generated to both tools). The pattern:

```bash
npx playwright-cli open http://localhost:7801
npx playwright-cli snapshot        # returns element refs like e21
npx playwright-cli click e21       # act on a ref (or use role/text locators)
npx playwright-cli screenshot --filename=shot.png
```

The `e2e/*.sh` flows are exactly these commands. Reviewers use them for browser testing (Module 4).

## Try it

1. Run an `e2e/` flow against the running app (`npm run e2e:install` once, then
   `bash e2e/admin-dashboard.sh`).
2. **Add an MCP server:** add an entry to `workshop-harness/mcp.json`, run `npm run build:harness`,
   and see it appear in both `plugins/workshop/.mcp.json` (JSON) and `.codex/config.toml` (TOML).
3. Add an agent (Module 2) and inspect the generated `.codex/agents/<name>.toml` — note the
   Markdown body became `developer_instructions` and `model: inherit` was dropped (no Codex
   equivalent), with a logged warning.

## Takeaway

Tools are part of the harness too. One source + a tiny generator keeps Codex and Claude in
lock-step — no drift, no per-tool copy-paste.

Next: [Module 4 — Design loop & quality gate](04-design-gate.md).
