# Module 4 — Interactive Design & the Quality Gate

**Goal:** get human feedback on UI *before* building, and ship through a structured, worktree-free
quality gate.

## The interactive design loop (lavish-axi)

`workshop:plan` can generate an interactive HTML mockup and collect annotated human feedback
before any real code is written. Trigger it with the `--visual` flag (or choose the visual option
at the design gate):

```text
/workshop:plan Build the admin dashboard --visual
```

What happens (see `workshop-harness/skills/plan/references/visual-feedback.md`):

1. The agent writes a self-contained `docs/designs/<date>-<topic>-mockup.html` (there's already an
   example: `docs/designs/2026-06-21-admin-dashboard-mockup.html`).
2. It launches the mockup with `npx -y lavish-axi@0.1.31 <file>` (needs **Node ≥ 22**) — a local
   annotation UI with a layout audit (overflow/clipping/overlap).
3. You annotate elements/text; the agent polls, revises, and live-reloads.
4. Resolved decisions fold back into the design doc; then the plan is written.

If Node < 22 or offline, it degrades gracefully to a text-only design doc.

## The quality gate (worktree-free)

`workshop:review` ends with a structured gate (see
`workshop-harness/skills/review/references/quality-gate.md`). It runs on `git diff HEAD` — **no
worktree required**:

1. **Classify** each finding: `no-op` / `auto-fix` (applied) / `ask-user` (escalated as one batch).
2. **Advisory risk:** `LOW` / `MEDIUM` / `HIGH` with a rationale + suggested human action — it
   explains and recommends, **never blocks**.
3. **Tests are the one hard gate:** a red suite or coverage drop fails the run.
4. **Hands off to `workshop:ship`:** the gate's risk level + findings + test summary feed
   `workshop:ship`, which drafts the structured, risk-aware PR (with a suggested review depth) and
   opens it — so the PR and the review always agree.

(Optional advanced demo: run the gate inside a throwaway `git-worktree` so auto-fixes don't touch
your live tree.)

## Try it

1. Use `--visual` to mock up a dashboard tweak; annotate it; let the agent fold feedback in.
2. After implementing, run **`workshop:review`** and read the gate output: the risk level +
   rationale, the classified findings, and the test result. Break a test on purpose and watch the
   gate fail the run. Then run **`workshop:ship`** to open the risk-assessed PR.

## Takeaway

Design feedback is cheapest before code exists; review is most useful when it's structured,
risk-aware, and test-gated. Both are part of the harness — portable across agents.

Next: the [Admin Dashboard exercise](admin-dashboard-exercise.md).
