# Visual Feedback Loop (lavish-axi)

Procedure for the **"Generate visual mockup"** option of the Design Discussion gate
(Phase 1.7 in [SKILL.md](../SKILL.md)). Use it when a plan would benefit from a visual,
interactive alignment loop instead of a prose-only design doc — UI, screens, layouts,
dashboards, redesigns, component-heavy work.

**Entry points:** the user can reach this loop two ways — by choosing option 4 at the gate, or
by invoking `workshop:plan --visual` (or asking for a visual mockup), which runs this procedure
automatically once the design doc is presented. Both paths run the same pre-flight, loop, and
fold-back below. `--visual` is ignored in pipeline mode, since the loop needs human annotation.

The markdown design doc (`docs/designs/YYYY-MM-DD-<topic>-design.md`) remains the **system of
record**. The mockup is a supporting artifact whose annotations are folded back into the design
doc before the plan is written.

`mockup.html` is a **planning artifact**, not implementation code — generating it does not
violate the skill's "NEVER CODE" rule.

## Pinned tool version

lavish-axi is pinned to a single constant. Bump it here (one place) and record the change in
`CHANGELOG.md`; every invocation below references it.

```
LAVISH_AXI_VERSION = 0.1.31
```

Requirements: **Node >= 22** and network access on first run (npx fetches and caches the
package). lavish-axi is invoked via `npx -y lavish-axi@<LAVISH_AXI_VERSION> ...`.

## Pre-flight (before offering or running the loop)

Run these checks before generating the mockup. If any fails, **do not start the loop** —
announce the specific reason and fall back to the text-only design doc + the standard 3-option
gate (see Graceful Degradation).

1. **Node >= 22:** `node --version`. If below 22 or Node is absent, degrade.
2. **Tool reachable:** confirm `npx -y lavish-axi@<LAVISH_AXI_VERSION> --version` resolves (this
   also warms the npx cache). On first run this may take a while — tell the user
   "Fetching lavish-axi, this may take a moment." If it times out or errors, degrade.

In **pipeline mode** (LFG/SLFG / `disable-model-invocation`) the visual option is never offered;
do not run any of this.

## Step 1 — Generate the mockup HTML

1. Sanitize `<topic>` to kebab-case ASCII, matching the plan-filename convention in
   [SKILL.md](../SKILL.md) (Step 2 Title & Categorization). No spaces, quotes, or non-ASCII.
2. Ensure `docs/designs/` exists (`mkdir -p docs/designs/`).
3. Write a **self-contained** HTML file to `docs/designs/YYYY-MM-DD-<topic>-mockup.html`.
   - Apply solid frontend-design aesthetics — avoid generic "AI slop"; commit to a cohesive
     visual direction with intentional spacing, type scale, and color.
   - lavish-axi is design-system aware: it matches the project's Tailwind config / CSS variables
     when present and otherwise falls back to Tailwind + DaisyUI from CDN.
   - Stamp the mockup with a version id (e.g. an HTML comment `<!-- mockup-v1 -->` or a
     `data-mockup-version` attribute on `<body>`) so feedback can be correlated to the version it
     was made against (see Step 3).

## Step 2 — Launch the annotation UI (background)

`lavish-axi <file>` starts a long-running local Express server, runs a layout audit, and opens
the browser annotation UI. It **must** run in the background so the agent is not blocked.

- Launch via background Bash, quoting the path:
  `npx -y lavish-axi@<LAVISH_AXI_VERSION> "docs/designs/YYYY-MM-DD-<topic>-mockup.html"`
- Record the process handle/PID and the URL/port it reports — you are responsible for tearing it
  down (see Teardown) and for surfacing the exact URL to the user.
- Tell the user the URL and how to annotate: select an element or text range, leave feedback,
  send it.
- Review the **layout audit** output (horizontal overflow / text clipping / overlap) and fix any
  flagged issues before inviting review.

## Step 3 — Poll, revise, repeat (bounded loop)

Loop until the user signals done or a bound is hit:

1. `npx -y lavish-axi@<LAVISH_AXI_VERSION> poll` to retrieve queued annotations.
2. If annotations arrived: apply them by editing the mockup HTML. chokidar live-reloads the
   browser. Bump the mockup version id on each revision; discard annotations whose version id is
   older than the current mockup (stale feedback against a replaced layout). Do **not** revise
   while the user is mid-annotation — finish the current round first.
3. If no annotations arrived: wait one poll interval and poll again.

Bounds (never poll unbounded):

- **Poll interval:** a few seconds between empty polls.
- **Idle timeout:** after a stretch of empty polls (no activity), prompt the user via
  **AskUserQuestion**: *keep waiting* / *finish* / *cancel*.
- **Hard ceiling:** stop after a sane maximum number of poll iterations and prompt the same way.
- **Browser closed:** if poll signals no connected client, prompt the user to reopen, finish, or
  cancel.

### Exit signals

- **Done** → go to Step 4 (fold-back), then Teardown, then return to the gate.
- **Cancel** → Teardown, keep the committed mockup (or note it was discarded per the user),
  return to the gate with the existing text-only design doc.

## Step 4 — Fold back into the design doc

Before returning to the gate:

1. Reconcile the visual decisions into the `## Design Decisions` section of
   `docs/designs/YYYY-MM-DD-<topic>-design.md`. Where a visual decision conflicts with a prior
   text decision, surface the conflict and resolve it with the user.
2. Resolve any related `## Open Questions` that the mockup answered.
3. Add a reference to the mockup file in the design doc.
4. Re-present the updated design doc and return to the standard 3-option approve loop in
   Phase 1.7 (Approve / Corrections / Answer open questions). The plan is written only after the
   design doc is approved.

## Teardown (every exit path)

Terminate the lavish-axi server/process on **every** exit: done, cancel, error, degradation,
browser-closed, or plan completion. Use the recorded PID/handle. Never leave an orphaned server
or browser tab. Re-entry (choose mockup → cancel → choose again) must start cleanly with no
stale server bound to the port.

## Concurrency

- A second concurrent `workshop:plan` session — or a leftover server from a prior run — may contend
  for the port. If launch fails with a port-in-use error, let lavish-axi pick another port if it
  supports it; otherwise degrade. Always surface *this* session's URL/port so the user annotates
  the right mockup.

## Graceful degradation

Any of the following → announce the specific reason, keep the text-only design doc, and return to
the standard 3-option gate (the plan is never aborted because of a mockup failure):

- Node < 22 or Node absent
- npx fetch failure / offline on first run
- port already in use (and no alternate port)
- browser fails to open
- lavish-axi exits non-zero
- malformed poll output, or repeated empty polls past the idle/ceiling bounds

## Artifact & commit

- Commit `mockup.html` alongside `design.md`; reference it from the design doc and from the
  plan's Sources section (see the `mockup:` frontmatter field in
  [plan-templates.md](./plan-templates.md)).
- If `docs/designs/` is git-ignored or the project is not a git repo, skip the commit and note it
  to the user.
