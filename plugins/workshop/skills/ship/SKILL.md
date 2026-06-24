---
name: workshop:ship
description: Open a reviewed pull request — assess risk, draft a structured description with a suggested review depth, run the tests, and create the PR. Use after workshop:work has committed (and optionally after workshop:review).
argument-hint: "[base branch] (defaults to the repo's default branch)"
---

# workshop:ship — open a risk-assessed PR

Turn committed work into a clean, reviewable pull request. Inspired by the `no-mistakes` model:
a **deterministic, risk-aware PR** so a reviewer knows exactly what changed and **how hard to
look**. Runs on the current branch — **no git worktree required**.

`workshop:work` owns implementing and committing; `workshop:ship` owns the PR. If you ran
`workshop:review`, reuse its risk level and findings here so the PR and the review agree.

## Flow

### 1. Determine the change set and base
- Base = the repo's default branch, or the branch passed in `$ARGUMENTS`.
- Inspect the diff: `git diff <base>...HEAD --stat` and the full diff.
- Confirm everything intended is committed (this skill does not commit code — `workshop:work` does).

### 2. Run the tests — the one objective gate
- Run the suites for what changed: API `npm test`, web `npm test`, and the relevant `e2e/` flow
  if UI/flows changed.
- A red suite or a coverage drop **blocks shipping** — fix or escalate before opening the PR.
  (This is the only hard gate; the risk level below is advisory.)

### 3. Assess risk + suggested review depth (advisory)
Assign exactly **one** risk level from the **change surface** (not line count), with a one-line
rationale and a suggested review depth:

| risk | when | suggested review depth |
| --- | --- | --- |
| **LOW** | mechanical / contained; no auth, data, or API surface; small blast radius | quick skim is enough |
| **MEDIUM** | normal feature work; touches a few modules or a public-ish surface | standard review against the checklist |
| **HIGH** | auth/authz, data migrations or destructive data ops, payments/orders, public API contract, or a broad cross-cutting change | deep review; reviewer sign-off + extra e2e before merge |

This is advisory — it tells the reviewer how hard to look; it never blocks the merge.

### 4. Capture screenshots for UI changes
Use the Playwright CLI for any visible UI change (before/after) — see [pr.md](./references/pr.md).

### 5. Draft and open the PR
Assemble the structured description from [pr.md](./references/pr.md) — **What changed / Risk
assessment / Testing / Findings / Monitoring / Screenshots / Review checklist** — then
`git push` and `gh pr create`. Only the "What changed" summary is written fresh; the rest is
assembled from the risk assessment, test results, and any `workshop:review` findings.

### 6. Wrap up
- Update the plan's frontmatter `status:` to `completed`.
- Tell the user what shipped, the **risk level + suggested review depth**, and the PR link.

> If `AskUserQuestion` is available, use it for any choice; otherwise present a numbered list and
> accept a number.
