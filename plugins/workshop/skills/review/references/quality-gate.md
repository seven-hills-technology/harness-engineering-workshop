# Quality Gate (worktree-free)

A structured, **agent-agnostic** gate that turns review findings into action and produces a
consistent, reviewable PR — **without git worktrees**. It operates directly on the working tree
diff (`git diff HEAD`), so it runs the same in Codex and Claude with no isolation setup.

Inspired by the `no-mistakes` model: classify each finding, auto-apply the safe ones, escalate
the rest to a human, and assemble a deterministic PR body around a single LLM summary. The one
hard, objective gate is **tests** — everything else is advisory.

## Inputs

- The change set: `git diff HEAD` (staged + unstaged) plus untracked files relevant to the work.
- The synthesized findings from the review agents (Phase 4 of `workshop:review`).
- The user's intent (the plan/PR description or the task prompt).

## Step 1 — Classify every finding

Give each finding an `action`:

| action | meaning | what the gate does |
| --- | --- | --- |
| `no-op` | informational only | record it; no change |
| `auto-fix` | safe, mechanical, intent-preserving (lint, dead code, obvious typo, missing null guard with one correct fix) | apply it to the working tree |
| `ask-user` | touches intent, behavior, API shape, security, or has more than one reasonable fix | escalate to the human |

Default when unsure: **`ask-user`** (be conservative — never silently change behavior).

Apply all `auto-fix` findings in place, then re-run the relevant tests. Batch every `ask-user`
finding into **one** escalation prompt (don't ask one-by-one): for each, show file:line, the
issue, and the options **approve / fix / skip**.

## Step 2 — Assign an advisory risk level

Assess the **whole change set** and assign exactly one level. This is **advisory** — it explains
itself and recommends a human action, but it **never blocks** the merge.

| risk | when | suggested human action |
| --- | --- | --- |
| `LOW` | mechanical/contained; no auth/data/API surface; small blast radius | quick skim is enough |
| `MEDIUM` | normal feature work; touches a few modules or a public-ish surface | standard review against the checklist |
| `HIGH` | auth/authz, data migrations or destructive data ops, payments/orders, public API contract, or broad cross-cutting change | deep review recommended; reviewer sign-off + extra e2e before merge |

Infer risk from the change surface, not line count. Always emit a one-line **`risk_rationale`**
naming the specific surface that drove the level (e.g. "touches checkout stock-decrement
transaction → HIGH").

## Step 3 — The one objective gate: tests

Run the suite (`npm test` across affected workspaces; the relevant `e2e/` flow when UI/flows
changed). **A red suite or a coverage drop fails the run** — this is the only hard gate. If
tests fail, stop and fix (or escalate) before producing the PR. Record a one-line
`testing_summary` (what ran, pass/fail, any coverage delta).

## Step 4 — Hand off to `workshop:ship`

The gate produces exactly the inputs a PR needs — the advisory `risk_level` + `risk_rationale`,
the classified findings, and the `testing_summary`. It does **not** open the PR itself. Pass these
to **`workshop:ship`**, which drafts the structured, risk-aware PR description (What changed / Risk
assessment + suggested review depth / Testing / Findings / Review checklist) and creates the PR.
See the ship skill's [pr.md](../../ship/references/pr.md). Reusing the gate's risk level + findings
keeps the PR and the review in agreement.

## Output contract

Return: the applied auto-fixes, the batched `ask-user` escalation (if any), the advisory
`risk_level` + `risk_rationale`, and the `testing_summary` — ready for `workshop:ship` to assemble
into the PR. **Block only on failing tests.** Risk-based human review is always advisory.

## Optional: worktree isolation (advanced demo)

This gate runs in place by design. To demo running it in an isolated checkout (as `no-mistakes`
does), use the `git-worktree` skill to create a scratch worktree, run the gate there, and discard
it — useful when you don't want auto-fixes touching your live working tree. This is an optional
extension, not part of the baseline gate.
