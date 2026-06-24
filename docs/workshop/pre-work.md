# Workshop Pre-Work — Set Up Your Machine

**Please do this before the session (~20–30 min).** It gets your laptop ready so we can start on
time. You only need the toolchain below — **we'll share the project repo at the start of the
workshop**, not here.

Works on **macOS, Windows, and Linux**.

## Checklist (TL;DR)

- [ ] **Node.js 22 or newer** installed (on Apple Silicon Macs, an **arm64** build)
- [ ] **npm** works (comes with Node)
- [ ] **git** installed
- [ ] **At least one coding agent** installed and signed in: **Codex CLI** and/or **Claude Code**
- [ ] You can **download packages** (npm registry reachable; no proxy/VPN blocking it) and a
      ~150 MB browser download
- [ ] *(optional)* **GitHub CLI** (`gh`) if you want to do PR-based reviews

---

## 1. Node.js 22+

We recommend a version manager so you can match the workshop's Node easily.

**macOS / Linux — [nvm](https://github.com/nvm-sh/nvm):**
```bash
# install nvm (see its README), then:
nvm install 22
nvm use 22
node -v            # should print v22.x or newer
node -p process.arch
```

**Windows — [nvm-windows](https://github.com/coreybutler/nvm-windows) or [fnm](https://github.com/Schniz/fnm)** (or the official installer from nodejs.org):
```powershell
nvm install 22
nvm use 22
node -v            # v22.x or newer
```

> **Apple Silicon (M1/M2/M3/M4):** make sure your Node is **arm64**, not x86_64. Run
> `node -p process.arch` — it should say `arm64`. A mismatched/Rosetta Node is the #1 setup snag
> (it breaks native modules). If it says `x64`, reinstall Node 22 from a native (non-Rosetta)
> terminal and use that one consistently.

## 2. A coding agent (bring at least one)

The workshop runs identically in both — bring whichever you use day to day. Install it, launch it
once, and confirm you can sign in.

**Codex CLI** (OpenAI):
```bash
npm install -g @openai/codex
codex --version          # use a recent version (needs skills support)
codex                    # launch once and sign in
```

**Claude Code** (Anthropic):
```bash
npm install -g @anthropic-ai/claude-code
claude --version
claude                   # launch once and sign in
```
*(Claude Code is also available as a desktop app and VS Code / JetBrains extension — any of those
is fine.)*

> You'll need a working account/login for whichever agent you choose (the agent's own sign-in
> flow). Please confirm you can start a session **before** the workshop.

## 3. git (and optional GitHub CLI)

```bash
git --version            # any recent git
# optional, only for PR reviews:
gh --version
```
Install git from [git-scm.com](https://git-scm.com) if you don't have it.

## 4. Network & disk

On the day, the project will: install npm packages, download a **Chromium browser (~150 MB)** for
UI testing, and fetch some sample data on first run. Please make sure:
- the **npm registry is reachable** (corporate proxy/VPN can block it),
- you can run **`npx`** (downloads small tools on demand),
- you have **~2 GB free disk**.

## 5. Verify your setup (copy/paste)

Run these — no project needed:
```bash
node -v                  # v22.x or newer
npm -v
git --version
node -p process.arch     # 'arm64' on Apple Silicon, else 'x64'
npm ping                 # confirms the npm registry is reachable
```
Then confirm your agent launches and you can sign in (`codex` and/or `claude`).

If all of those work, you're ready. 🎉

---

## Platform notes

- **Apple Silicon:** use **one consistent arm64 Node 22**. Don't mix arm64 and x86_64 Node
  installs — switching between them breaks native modules. `node -p process.arch` should say
  `arm64`.
- **Windows:** everything runs natively via npm. A couple of optional end-to-end test scripts are
  bash; if you want to run those, have **Git Bash** (ships with Git for Windows) or **WSL**. Not
  required to participate.
- **Linux:** no special steps beyond Node 22 + git.

## What we'll do on the day

After we share the repo, it's roughly: clone → `npm install` → install the test browser → start
the app (two commands) → log in → then build features using the agent. The repo includes a short
"start here" guide. Having the above installed is all you need in advance.

## Trouble?

If `node -p process.arch` is wrong, `npm ping` fails, or your agent won't sign in, sort it out
before the session (or reach out to the organizer) — those are the things that are hard to fix
live. Everything else we'll handle together.
