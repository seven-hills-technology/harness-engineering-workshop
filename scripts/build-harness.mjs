#!/usr/bin/env node
/**
 * build-harness.mjs — the single-source harness generator.
 *
 * Reads the tool-agnostic source in `workshop-harness/` and generates the native
 * configuration for BOTH Claude Code and Codex, so the same context, skills, agents,
 * and MCP servers work in either tool.
 *
 *   workshop-harness/                  ->  Claude Code                 |  Codex
 *   ---------------------------------------------------------------------------------------------
 *   context.md                         ->  CLAUDE.md                   |  AGENTS.md (+ Codex notes)
 *   skills/<name>/SKILL.md (+files)    ->  plugins/workshop/skills/    |  .agents/skills/
 *   agents/<cat>/<name>.md (MD+YAML)   ->  plugins/workshop/agents/    |  .codex/agents/<name>.toml
 *   mcp.json (JSON)                    ->  plugins/workshop/.mcp.json  |  .codex/config.toml [mcp_servers]
 *   harness.config.json                ->  plugin.json + marketplace.json (Claude)
 *
 * Why this works: Claude and Codex have converged on the Agent Skills SKILL.md standard, so
 * skills are just copied to two locations. The only real *transforms* are agents (Markdown+YAML
 * -> TOML) and MCP servers (JSON -> TOML). Run with `--check` to fail if generated output would
 * change (drift check for CI / the quality gate).
 *
 * Dependency-free on purpose: it's a teaching artifact for the workshop's "MCP & tools" module.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, cpSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'workshop-harness');
const CHECK_MODE = process.argv.includes('--check');

const log = (msg) => console.log(`  ${msg}`);
const rel = (p) => relative(ROOT, p) || '.';

// --- tiny helpers ------------------------------------------------------------

/** Parse YAML-ish frontmatter (`key: value`, optionally quoted) + body from a markdown string. */
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: md };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    data[kv[1]] = v;
  }
  return { data, body: m[2].trim() };
}

/** Escape a string for a TOML basic (single-line) string. */
const tomlStr = (s) =>
  '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"';

/** Escape a string for a TOML multiline basic string ("""..."""). */
const tomlMultiline = (s) =>
  '"""\n' + String(s).replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"') + '\n"""';

/** Emit a TOML array of strings, e.g. ["-y", "pkg"]. */
const tomlArray = (arr) => '[' + arr.map(tomlStr).join(', ') + ']';

function write(absPath, content) {
  mkdirSync(dirname(absPath), { recursive: true });
  if (CHECK_MODE && existsSync(absPath) && readFileSync(absPath, 'utf8') === content) return false;
  if (CHECK_MODE) {
    throw new Error(`drift: ${rel(absPath)} is out of date — run \`npm run build:harness\``);
  }
  writeFileSync(absPath, content);
  return true;
}

function cleanGenerated(paths) {
  if (CHECK_MODE) return;
  for (const p of paths) rmSync(join(ROOT, p), { recursive: true, force: true });
}

function listDirs(p) {
  if (!existsSync(p)) return [];
  return readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory());
}

// --- load source -------------------------------------------------------------

const config = JSON.parse(readFileSync(join(SRC, 'harness.config.json'), 'utf8'));
const ns = config.namespace;
const claudePluginDir = join(ROOT, config.targets.claude.pluginDir);
const codexSkillsDir = join(ROOT, config.targets.codex.skillsDir);
const codexAgentsDir = join(ROOT, config.targets.codex.agentsDir);

console.log(`\n▸ build-harness ${CHECK_MODE ? '(check mode)' : ''} — namespace "${ns}"\n`);

// Start clean so renamed/removed source files don't leave stale generated output.
cleanGenerated([
  config.targets.claude.pluginDir,
  config.targets.claude.marketplaceFile,
  config.targets.codex.skillsDir,
  config.targets.codex.agentsDir,
  config.targets.codex.configToml,
  'CLAUDE.md',
  'AGENTS.md',
]);

const generated = { skills: [], agents: [], mcp: 0, files: [] };
const track = (abs) => generated.files.push(rel(abs));

// --- 1. context.md -> CLAUDE.md + AGENTS.md ----------------------------------

const context = readFileSync(join(SRC, 'context.md'), 'utf8').trimEnd() + '\n';
write(join(ROOT, config.targets.claude.contextFile), context);
track(join(ROOT, config.targets.claude.contextFile));

const codexNotes = [
  '',
  '---',
  '',
  '## Codex notes',
  '',
  `Workshop skills live in \`${config.targets.codex.skillsDir}/<name>/SKILL.md\` and named agents in`,
  `\`${config.targets.codex.agentsDir}/<name>.toml\`. MCP servers are configured in`,
  `\`${config.targets.codex.configToml}\`. This file is generated from \`workshop-harness/context.md\` —`,
  'edit the source and run `npm run build:harness`.',
  '',
].join('\n');
write(join(ROOT, config.targets.codex.contextFile), context + codexNotes);
track(join(ROOT, config.targets.codex.contextFile));

// --- 2. skills/ -> plugin skills + codex skills (copy to two locations) ------

for (const name of listDirs(join(SRC, 'skills'))) {
  const from = join(SRC, 'skills', name);
  const toClaude = join(claudePluginDir, 'skills', name);
  const toCodex = join(codexSkillsDir, name);
  if (!CHECK_MODE) {
    cpSync(from, toClaude, { recursive: true });
    cpSync(from, toCodex, { recursive: true });
  } else {
    // In check mode, compare the SKILL.md as a representative drift signal.
    const skill = readFileSync(join(from, 'SKILL.md'), 'utf8');
    write(join(toClaude, 'SKILL.md'), skill);
    write(join(toCodex, 'SKILL.md'), skill);
  }
  const { data } = parseFrontmatter(readFileSync(join(from, 'SKILL.md'), 'utf8'));
  generated.skills.push({ dir: name, name: data.name || name });
  track(toClaude);
  track(toCodex);
}

// --- 3. agents/ -> plugin agents (copy) + codex agents (transform to TOML) ---

function walkAgents(catDir, category) {
  for (const entry of readdirSync(catDir)) {
    const abs = join(catDir, entry);
    if (statSync(abs).isDirectory()) { walkAgents(abs, category); continue; }
    if (!entry.endsWith('.md')) continue;

    const raw = readFileSync(abs, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const agentName = data.name || entry.replace(/\.md$/, '');

    // Claude: copy the Markdown agent verbatim into the plugin.
    write(join(claudePluginDir, 'agents', category, entry), raw);

    // Codex: transform Markdown+YAML -> TOML. Body becomes developer_instructions.
    const lines = [`name = ${tomlStr(agentName)}`];
    if (data.description) lines.push(`description = ${tomlStr(data.description)}`);
    const dropped = [];
    if (data.model && data.model !== 'inherit') lines.push(`model = ${tomlStr(data.model)}`);
    else if (data.model === 'inherit') dropped.push('model=inherit (no Codex equivalent; uses default)');
    for (const k of ['tools', 'isolation', 'maxTurns', 'background', 'memory']) {
      if (data[k] !== undefined) dropped.push(`${k} (Claude-only)`);
    }
    lines.push(`developer_instructions = ${tomlMultiline(body)}`);
    if (dropped.length) log(`agent "${agentName}": dropped non-portable fields -> ${dropped.join(', ')}`);

    write(join(codexAgentsDir, `${agentName}.toml`), lines.join('\n') + '\n');
    generated.agents.push({ name: agentName, category });
    track(join(codexAgentsDir, `${agentName}.toml`));
  }
}
for (const category of listDirs(join(SRC, 'agents'))) {
  walkAgents(join(SRC, 'agents', category), category);
}

// --- 4. mcp.json -> plugin .mcp.json (JSON) + .codex/config.toml (TOML) ------

const mcp = JSON.parse(readFileSync(join(SRC, 'mcp.json'), 'utf8'));
const servers = mcp.mcpServers || {};
generated.mcp = Object.keys(servers).length;

write(join(claudePluginDir, '.mcp.json'), JSON.stringify({ mcpServers: servers }, null, 2) + '\n');
track(join(claudePluginDir, '.mcp.json'));

const tomlParts = [
  '# Generated by scripts/build-harness.mjs from workshop-harness/mcp.json — do not edit by hand.',
  '',
];
for (const [serverName, def] of Object.entries(servers)) {
  tomlParts.push(`[mcp_servers.${serverName}]`);
  if (def.url) tomlParts.push(`url = ${tomlStr(def.url)}`);
  if (def.command) tomlParts.push(`command = ${tomlStr(def.command)}`);
  if (Array.isArray(def.args)) tomlParts.push(`args = ${tomlArray(def.args)}`);
  if (def.env && Object.keys(def.env).length) {
    tomlParts.push('', `[mcp_servers.${serverName}.env]`);
    for (const [k, v] of Object.entries(def.env)) tomlParts.push(`${k} = ${tomlStr(v)}`);
  }
  tomlParts.push('');
}
write(join(ROOT, config.targets.codex.configToml), tomlParts.join('\n').trimEnd() + '\n');
track(join(ROOT, config.targets.codex.configToml));

// --- 5. harness.config.json -> plugin.json + marketplace.json ----------------

const pluginJson = {
  name: config.plugin.name,
  version: config.plugin.version,
  description: config.plugin.description,
  author: config.plugin.author,
  license: config.plugin.license,
};
write(join(claudePluginDir, '.claude-plugin', 'plugin.json'), JSON.stringify(pluginJson, null, 2) + '\n');
track(join(claudePluginDir, '.claude-plugin', 'plugin.json'));

const marketplaceJson = {
  name: config.marketplace.name,
  owner: config.marketplace.owner,
  metadata: { description: config.marketplace.description, version: config.plugin.version },
  plugins: [
    {
      name: config.plugin.name,
      description: config.plugin.description,
      version: config.plugin.version,
      source: './' + config.targets.claude.pluginDir,
    },
  ],
};
write(join(ROOT, config.targets.claude.marketplaceFile), JSON.stringify(marketplaceJson, null, 2) + '\n');
track(join(ROOT, config.targets.claude.marketplaceFile));

// Carry the plugin authoring conventions into the generated plugin (Claude reads this).
const pluginClaudeMd = join(SRC, 'plugin.CLAUDE.md');
if (existsSync(pluginClaudeMd)) {
  write(join(claudePluginDir, 'CLAUDE.md'), readFileSync(pluginClaudeMd, 'utf8'));
  track(join(claudePluginDir, 'CLAUDE.md'));
}

// --- 6. smoke check ----------------------------------------------------------

function smokeCheck() {
  const problems = [];
  // JSON outputs must parse.
  for (const f of [
    join(claudePluginDir, '.claude-plugin', 'plugin.json'),
    join(ROOT, config.targets.claude.marketplaceFile),
    join(claudePluginDir, '.mcp.json'),
  ]) {
    try { JSON.parse(readFileSync(f, 'utf8')); } catch (e) { problems.push(`invalid JSON: ${rel(f)} (${e.message})`); }
  }
  // Each skill exists in BOTH tool locations.
  for (const s of generated.skills) {
    if (!existsSync(join(claudePluginDir, 'skills', s.dir, 'SKILL.md'))) problems.push(`missing Claude skill: ${s.dir}`);
    if (!existsSync(join(codexSkillsDir, s.dir, 'SKILL.md'))) problems.push(`missing Codex skill: ${s.dir}`);
  }
  // Each Codex agent TOML has the required keys.
  for (const a of generated.agents) {
    const f = join(codexAgentsDir, `${a.name}.toml`);
    const t = existsSync(f) ? readFileSync(f, 'utf8') : '';
    if (!/^name = /m.test(t) || !/developer_instructions = /.test(t)) problems.push(`malformed agent TOML: ${a.name}`);
  }
  // config.toml exists.
  if (!existsSync(join(ROOT, config.targets.codex.configToml))) problems.push('missing .codex/config.toml');
  return problems;
}

const problems = smokeCheck();

// --- summary -----------------------------------------------------------------

console.log('');
log(`context  -> CLAUDE.md, AGENTS.md`);
log(`skills   -> ${generated.skills.length}  (${generated.skills.map((s) => s.name).join(', ') || 'none'})`);
log(`agents   -> ${generated.agents.length}  (${generated.agents.map((a) => a.name).join(', ') || 'none'})`);
log(`mcp      -> ${generated.mcp} server(s)`);
console.log('');
if (generated.skills.length) {
  const ex = generated.skills[0];
  log(`skill resolves: Claude "/${ns}:${ex.dir}"  |  Codex "/${ex.dir}" (from ${config.targets.codex.skillsDir})`);
}

if (problems.length) {
  console.error('\n✗ smoke check FAILED:');
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}
console.log(`\n✓ harness generated and smoke-checked${CHECK_MODE ? ' (no drift)' : ''}.\n`);
