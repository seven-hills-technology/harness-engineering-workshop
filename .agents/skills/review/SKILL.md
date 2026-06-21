---
name: workshop:review
description: Perform exhaustive code reviews using multi-agent analysis and ultra-thinking
argument-hint: "[PR number, GitHub URL, branch name, or latest] [--serial]"
---

<!-- NOTE: the worktree-free quality gate (finding classification auto-fix/ask-user, advisory LOW/MED/HIGH risk + rationale, structured PR body) is added to this skill in Phase 9 of the workshop plan. -->

# Review Command

<command_purpose> Perform exhaustive code reviews using multi-agent analysis and ultra-thinking for deep local inspection. </command_purpose>

## Introduction

<role>Senior Code Review Architect with expertise in security, performance, architecture, and quality assurance</role>

## Prerequisites

<requirements>
- Git repository with GitHub CLI (`gh`) installed and authenticated
- Proper permissions to access the repository
- For document reviews: Path to a markdown file or document
</requirements>

## Main Tasks

### 1. Determine Review Target & Setup (ALWAYS FIRST)

<review_target> #$ARGUMENTS </review_target>

<thinking>
First, I need to determine the review target type and check out the code for analysis.
</thinking>

#### Immediate Actions:

<task_list>

- [ ] Determine review type: PR number (numeric), GitHub URL, file path (.md), or empty (current branch)
- [ ] Check current git branch
- [ ] If ALREADY on the target branch (PR branch, requested branch name, or the branch already checked out for review) → proceed with analysis on the current branch
- [ ] Otherwise, check out the review target: use `gh pr checkout <number>` for a PR, or `git checkout <branch>` for a branch name
- [ ] Fetch PR metadata using `gh pr view --json` for title, body, files, linked issues
- [ ] Check if PR is part of a stacked PR chain (if `gh stack` is available, run `gh stack --help >/dev/null 2>&1` to detect). Look for stack navigation in the PR description or base branch targeting another PR branch instead of the default branch. If part of a stack, ask: "This PR is part of a stacked PR chain. Review just this PR, or review the entire stack?" If the user wants the full stack, repeat the review process for each PR in the stack sequentially.
- [ ] Set up language-specific analysis tools
- [ ] Prepare security scanning environment

Ensure that the code is checked out and ready for analysis on the current branch. ONLY then proceed to the next step.

</task_list>

#### Protected Artifacts

<protected_artifacts>
The following paths are pipeline/working artifacts and must never be flagged for deletion, removal, or gitignore by any review agent:

- `docs/plans/*.md` — Plan files that track implementation progress (checkboxes get checked off as work proceeds).
- `docs/designs/*.md` — Design documents.
- `docs/brainstorms/*.md` — Brainstorm documents.
- `docs/specs/*.md` — Specification documents.

If a review agent flags any file in these directories for cleanup or removal, discard that finding during synthesis. Do not create a todo for it.
</protected_artifacts>

#### Load Review Agents

Read `workshop.local.md` in the project root. If found, use `review_agents` from the YAML frontmatter. If the markdown body contains review context, pass it to each agent as additional instructions.

If no settings file exists, invoke the `setup` skill to create one. Then read the newly created file and continue.

The roster of review agents you may reference:

- `node-reviewer` — Node.js backend (async patterns, security, Express/Fastify/NestJS)
- `react-reviewer` — React / React Native (components, hooks, performance, accessibility)
- `typescript-reviewer` — TypeScript type safety and modern patterns
- `code-simplicity-reviewer` — YAGNI / minimalism pass
- `agent-smith` — security audit (input validation, auth/authz, secrets, OWASP)
- `performance-oracle` — performance, complexity, queries, scalability
- `repo-research-analyst` — repository structure, conventions, and implementation patterns
- `test-reviewer` — test coverage and quality (ALWAYS run last)

#### Choose Execution Mode

<execution_mode>

Before launching review agents, check for context constraints:

**If `--serial` flag is passed OR conversation is in a long session:**

Run agents ONE AT A TIME in sequence. Wait for each agent to complete before starting the next. This uses less context but takes longer.

**Default (parallel):**

Run all agents simultaneously for speed. If you hit context limits, retry with `--serial` flag.

**Auto-detect:** If more than 5 review agents are configured, automatically switch to serial mode and inform the user:
"Running review agents in serial mode (6+ agents configured). Use --parallel to override."

</execution_mode>

#### Parallel Agents to review the PR:

<parallel_tasks>

**Parallel mode (default for ≤5 agents):**

Run all configured review agents in parallel using the Task tool. For each agent in the `review_agents` list:

```
Task {agent-name}(PR content + review context from settings body)
```

**Serial mode (--serial flag, or auto for 6+ agents):**

Run configured review agents ONE AT A TIME. For each agent in the `review_agents` list, wait for it to complete before starting the next:

```
For each agent in review_agents:
  1. Task {agent-name}(PR content + review context)
  2. Wait for completion
  3. Collect findings
  4. Proceed to next agent
```

Always run this one last regardless of mode:
- Task test-reviewer(PR content) - Review whether code changes have adequate test coverage and flag missing/weak tests

</parallel_tasks>

### 2. Deep Dive Review

Run the ultra-thinking deep dive from [review-perspectives.md](./references/review-perspectives.md) — stakeholder analysis (developer, ops, end user, security, business), scenario exploration (edge cases, failures, scale), and multi-angle review (technical excellence, business value, risk, team dynamics).

### 3. Simplification and Minimalism Review

Run the Task code-simplicity-reviewer() to see if we can simplify the code.

### 4. Findings Synthesis and Todo Creation

Synthesize all agent findings and create todo files following the process in [todo-creation-guide.md](./references/todo-creation-guide.md). ALL findings go to `todos/` immediately — do NOT present for user approval first.

Key steps:
1. **Synthesize** — Collect findings, discard protected-artifact deletions, categorize (P1/P2/P3), remove duplicates
2. **Create todos** — Write files to `todos/` immediately. Use parallel sub-agents for 15+ findings. See guide for file structure, naming, and templates.
3. **Present summary** — Use the summary report template from the guide

### 5. End-to-End Testing (Optional)

After presenting the summary, offer browser testing per [browser-testing.md](./references/browser-testing.md). Detect project type from PR files, offer appropriate testing, spawn a subagent if the user accepts.

### Important: P1 Findings Block Merge

Any **P1 (CRITICAL)** findings must be addressed before merging the PR. Present these prominently and ensure they're resolved before accepting the PR.
