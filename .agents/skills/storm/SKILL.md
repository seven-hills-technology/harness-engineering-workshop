---
name: workshop:storm
description: Explore requirements and approaches through collaborative dialogue before planning. Use when a feature idea is fuzzy and you want to settle WHAT to build before HOW.
argument-hint: "[feature idea or problem to explore]"
---

# workshop:storm — Brainstorm a feature before planning

Brainstorming answers **WHAT** to build through collaborative dialogue. It precedes
`workshop:plan`, which answers **HOW**.

> This is the minimal MVP version of the skill, used to prove the harness pipeline end-to-end in
> both Codex and Claude. It is expanded in a later workshop phase.

## Process

1. **Understand the idea.** Restate the request in your own words. If the goal, users, or
   success criteria are unclear, ask the user — one question at a time. Prefer concrete multiple
   choice over open-ended questions.

2. **Explore approaches.** Propose 2–3 concrete approaches with brief pros/cons. Lead with a
   recommendation and apply YAGNI — prefer the simplest option that meets the need.

3. **Capture the design.** Write a short brainstorm document to
   `docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md` capturing: What We're Building, Why This
   Approach, Key Decisions, and Open Questions.

4. **Resolve open questions** with the user, then hand off: suggest running `workshop:plan` to
   turn the brainstorm into an implementation plan.

**Never write implementation code in this skill** — explore and document decisions only.
