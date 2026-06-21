#!/usr/bin/env node
/**
 * Cross-platform launcher for the API and web app (Windows, macOS, Linux).
 *
 *   node scripts/start.mjs api   -> NestJS API on http://localhost:8010
 *   node scripts/start.mjs web   -> React app  on http://localhost:9010
 *
 * Usually invoked via `npm run start:api` / `npm run start:web` (or the
 * ./start-api.sh / start-api.cmd shortcuts). It:
 *   - verifies Node >= 22
 *   - installs dependencies on first run
 *   - (api) rebuilds the better-sqlite3 native addon if it doesn't load
 *   - starts the dev server **with the exact same Node** that is running this
 *     script, so the better-sqlite3 native binary always matches the runtime.
 *
 * The last point is the important one: on machines with both an arm64 and an
 * x86_64 Node installed, a child process resolved via PATH can be a different
 * architecture than the one that built the native addon ("incompatible
 * architecture" dlopen error). We avoid that by spawning the dev server with
 * `process.execPath` and by prepending this Node's directory to PATH for every
 * child (npm install / rebuild and the grandchild app process).
 */

import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = process.argv[2];
if (target !== 'api' && target !== 'web') {
  console.error('Usage: node scripts/start.mjs <api|web>');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const PORT = target === 'api' ? 8010 : 9010;
const NAME = target === 'api' ? 'NestJS API' : 'React web app';

// Pin every child process to THIS Node (its directory wins on PATH), so the
// app and any rebuild use the same architecture as this launcher.
const nodeDir = dirname(process.execPath);
const childEnv = { ...process.env, PATH: nodeDir + delimiter + (process.env.PATH ?? '') };
const run = (args) => spawnSync(npm, args, { cwd: ROOT, stdio: 'inherit', shell: isWin, env: childEnv });

// 1. Node >= 22
const major = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(major) || major < 22) {
  console.error(`✗ Node >= 22 required (found ${process.version}). Please install/switch Node and retry.`);
  process.exit(1);
}
console.log(`▸ Using Node ${process.version} (${process.arch}) — ${process.execPath}`);

// On Apple Silicon, nudge toward a native arm64 Node — an x64 Node runs under
// Rosetta and forces slower x64 native binaries. `hw.optional.arm64` reports the
// real hardware even from a translated (x64) process. Non-blocking.
if (process.platform === 'darwin' && process.arch === 'x64') {
  const hw = spawnSync('sysctl', ['-n', 'hw.optional.arm64'], { encoding: 'utf8' });
  if ((hw.stdout ?? '').trim() === '1') {
    console.log('  note: x64 Node on Apple Silicon (Rosetta). For native speed use an arm64 Node — `nvm use` (this repo pins 22) or `nvm use 22`.');
  }
}

// 2. dependencies present?
if (!existsSync(join(ROOT, 'node_modules'))) {
  console.log('▸ Installing dependencies (first run, this may take a minute)…');
  const r = run(['install']);
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// 3. Native deps must match THIS Node's arch/ABI. npm only installs the
//    platform-specific binaries (better-sqlite3, esbuild's @esbuild/*) for the
//    arch that ran `npm install`; switching Node arch breaks them. The addons
//    load lazily, so we probe in a fresh child process and reconcile with a
//    plain `npm install`, which fetches the right binaries for this arch.
const nativeProbe = target === 'api'
  ? "new (require('better-sqlite3'))(':memory:').close()"
  : "require('esbuild').transformSync('1')";
const nativeOk = () =>
  spawnSync(process.execPath, ['-e', nativeProbe], { cwd: ROOT, stdio: 'ignore', env: childEnv }).status === 0;

if (!nativeOk()) {
  console.log(`▸ Reconciling native dependencies for ${process.arch} (npm install)…`);
  run(['install']);
  if (target === 'api' && !nativeOk()) {
    run(['rebuild', 'better-sqlite3']);
    if (!nativeOk()) run(['rebuild', 'better-sqlite3', '--build-from-source']);
  }
  if (!nativeOk()) {
    console.error('✗ Native dependencies still won’t load. Use one consistent Node >= 22 (arm64 on Apple Silicon) and run `npm install`.');
    process.exit(1);
  }
}

// 4. launch with the SAME Node (process.execPath) — never a PATH-resolved one.
//    For the API we BUILD then run the compiled dist/main.js directly, because
//    `nest start` re-spawns the app through a shell and resolves `node` from
//    PATH, which on mixed arm64/x86_64 machines can pick the wrong architecture
//    (the "incompatible architecture" dlopen error). Running dist/main.js with
//    process.execPath removes that second, ambiguous Node entirely.
let cmd, args, cwd;
if (target === 'api') {
  const apiDir = join(ROOT, 'apps', 'api');
  console.log('▸ Building API…');
  const nestCli = join(ROOT, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
  const b = spawnSync(process.execPath, [nestCli, 'build'], { cwd: apiDir, stdio: 'inherit', env: childEnv });
  if (b.status !== 0) process.exit(b.status ?? 1);
  cmd = process.execPath;
  args = [join(apiDir, 'dist', 'main.js')];
  cwd = apiDir;
} else {
  // Vite's dev server runs in-process under this Node (no child app process).
  cmd = process.execPath;
  args = [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'apps/web', '--port', String(PORT), '--strictPort'];
  cwd = ROOT;
}

console.log(`▸ Starting ${NAME} on http://localhost:${PORT}  (Ctrl-C to stop)`);
if (target === 'api') console.log('  (re-run to pick up API code changes; `npm run dev:api` gives watch mode)');
const child = spawn(cmd, args, { cwd, stdio: 'inherit', env: childEnv });
child.on('exit', (code) => process.exit(code ?? 0));
