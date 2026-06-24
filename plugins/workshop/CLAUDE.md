# Workshop Plugin — Authoring Conventions

This plugin is **generated** from `workshop-harness/` by `scripts/build-harness.mjs`. Do not edit
files under `plugins/workshop/` directly — edit the source and run `npm run build:harness`.

## Skills
- One directory per skill under `workshop-harness/skills/<name>/SKILL.md`.
- Frontmatter must be the **first** thing in the file (no content above the opening `---`).
- `name:` is namespaced `workshop:<name>` and must match the directory name (e.g. dir `plan` →
  `name: workshop:plan`). Skills resolve as `/workshop:<name>` in Claude and `/<name>` in Codex.
- `description:` states **what** the skill does and **when** to use it.
- Reference files live in `references/` and are linked relatively: `[file.md](./references/file.md)`.
- Any user prompt uses **AskUserQuestion** when available, with a **numbered-list fallback** when not.

## Agents
- One markdown file per agent under `workshop-harness/agents/<category>/<name>.md`.
- Frontmatter is exactly `name`, `description` (quoted), `model: inherit`. No other fields
  (Claude-only fields like `tools`/`isolation` are dropped when generating the Codex TOML).
- Agents are addressed `workshop:<category>:<name>` in Claude and `<name>` in Codex.

## MCP
- Declare servers once in `workshop-harness/mcp.json`; the generator emits `.mcp.json` (Claude)
  and `.codex/config.toml` `[mcp_servers.*]` (Codex).

## After any change
1. `npm run build:harness` (regenerates both targets + runs the smoke check).
2. Commit the regenerated artifacts alongside the source. `npm run harness:check` fails on drift.
