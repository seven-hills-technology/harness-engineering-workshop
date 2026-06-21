---
name: workshop:work
description: Execute work plans efficiently while maintaining quality and finishing features
argument-hint: "[plan file, specification, or todo file path]"
---

# Work Plan Execution Command

Execute a work plan efficiently while maintaining quality and finishing features.

## Introduction

This command takes a work document (plan, specification, or todo file) and executes it systematically. The focus is on **shipping complete features** by understanding requirements quickly, following existing patterns, and maintaining quality throughout.

## Input Document

<input_document> #$ARGUMENTS </input_document>

## Execution Workflow

### Phase 0: Configuration Check

Before starting, verify the project configuration file exists:

```bash
test -f workshop.local.md && echo "found" || echo "missing"
```

**If `workshop.local.md` is missing**, use **AskUserQuestion** to prompt the user:

> "This project doesn't have a `workshop.local.md` configuration yet. Without it, worker agents and reviewer agents can't be auto-configured for your stack. Running `/workshop:setup` now will improve implementation quality."

**Options:**
1. **Run `/workshop:setup` first** → Invoke the `setup` skill, then return here and continue
2. **Continue without setup** → Proceed using auto-detection for worker agents (setup can be run later)

> If AskUserQuestion is unavailable, present the same options as a numbered list and ask the user to reply with a number.

If found, continue to Phase 1.

### Phase 1: Quick Start

1. **Read Plan and Clarify**

   - Read the work document completely
   - Review any references or links provided in the plan
   - If anything is unclear or ambiguous, ask clarifying questions now
   - Get user approval to proceed
   - **Do not skip this** - better to ask questions now than build the wrong thing

   **Enum / lookup table check** — Before starting implementation, scan the plan (or feature description if no plan) for any data that looks like a fixed set of values: status fields, types, categories, states, roles, priorities, etc.

   For each one found, check whether the plan already documents a decision (e.g. in a `## Data Design Decisions` section). If a decision is **missing or unclear**, use **AskUserQuestion** to ask:

   > "I noticed `[FieldName]` looks like it could be a fixed set of values. Should this be implemented as:
   > 1. **Database lookup table** — values stored in the DB, editable at runtime without a deploy
   > 2. **Code enum** — values defined in source code, change requires a deploy"

   > If AskUserQuestion is unavailable, present the same options as a numbered list and ask the user to reply with a number.

   Resolve all enum decisions **before writing any code**. If working without a plan, ask about all identified enums up front in a single question batch.

   **Vertical plan structure check** — Scan the plan's Implementation Phases. If phases are organized by horizontal layer (e.g., "Phase 1: Database migrations", "Phase 2: Service layer", "Phase 3: API endpoints", "Phase 4: Frontend"), flag it:

   > "This plan has horizontal phases (grouped by layer). Horizontal plans produce 1000+ lines of untestable code before anything works end-to-end. Should I restructure into vertical slices where each phase cuts through the full stack with a testing checkpoint?"

   Options:
   1. **Restructure into vertical slices** — rewrite the phases so each one produces a testable end-to-end path
   2. **Continue as-is** — proceed with the horizontal structure (user accepts the risk)

   Skip this check if the plan has 2 or fewer phases, or if phases already reference testing checkpoints between them.

2. **Setup Environment**

   First, check the current branch:

   ```bash
   current_branch=$(git branch --show-current)
   default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')

   # Fallback if remote HEAD isn't set
   if [ -z "$default_branch" ]; then
     default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
   fi
   ```

   **If already on a feature branch** (not the default branch):
   - Ask: "Continue working on `[current_branch]`, or create a new branch?"
   - If continuing, proceed to step 3
   - If creating new, follow Option A below

   **If on the default branch**, choose how to proceed:

   **Option A: Create a new branch**
   ```bash
   git pull origin [default_branch]
   git checkout -b feature-branch-name
   ```
   Use a meaningful name based on the work (e.g., `feat/user-authentication`, `fix/email-validation`).

   **Option B: Continue on the current branch**
   - Requires explicit user confirmation when the current branch is the default branch
   - Only proceed after the user explicitly says "yes, commit to [default_branch]"
   - Never commit directly to the default branch without explicit permission

   > If AskUserQuestion is unavailable, present these options as a numbered list and ask the user to reply with a number.

3. **Create Todo List**
   - Use TodoWrite to break plan into actionable tasks
   - Include dependencies between tasks
   - Prioritize based on what needs to be done first
   - Include testing and quality check tasks
   - Keep tasks specific and completable

### Phase 2: Execute

1. **Task Execution Loop**

   For each task in priority order:

   ```
   while (tasks remain):
     - Mark task as in_progress in TodoWrite
     - Read any referenced files from the plan
     - Determine target stack and dispatch (see Worker Agent Dispatch below)
     - Write tests for new functionality (see Test Requirements below)
     - Run System-Wide Test Check (see below)
     - Run the project's test command after changes (npm test)
     - Mark task as completed in TodoWrite
     - Mark off the corresponding checkbox in the plan file ([ ] → [x])
     - Evaluate for incremental commit (see below)
   ```

   **Worker Agent Dispatch** — For each task, determine which worker agent should implement it. The workshop roster has two workers: `node-worker` and `react-worker`.

   **Step 1: Read config**
   Read `worker_agents` from `workshop.local.md` frontmatter. If no config exists, proceed to auto-detection.

   **Step 2: Determine target stack**

   a. Scan task description for stack keywords:
      - **React**: "component", "page", "hook", "UI", "frontend", "feature", "JSX", "styled"
      - **Node**: "route", "service", "api", "module", "controller", "handler", "endpoint", "NestJS"

   b. If keywords are ambiguous, scan file paths referenced in the task:
      - `.tsx`, `.jsx`, `.css`, `.scss` -> react-worker
      - Server-side `.ts`/`.js` -> node-worker

   c. For `.ts` file ambiguity, use directory heuristics:
      - `src/components/`, `src/pages/`, `src/hooks/`, `src/features/`, `app/` -> react-worker
      - `src/routes/`, `src/services/`, `src/api/`, `src/modules/`, `src/controllers/`, `server/` -> node-worker
      - `src/shared/`, `src/utils/`, `src/lib/` -> project's primary stack or main agent handles directly

   **Step 3: Dispatch or fallback**

   - If a matching worker agent is configured (or auto-detected), dispatch the task:
     ```
     Agent {worker-name}("Implement: {task description}. Read CLAUDE.md and workshop.local.md for project conventions. After implementation, invoke {reviewer-name} to self-check. Max 2 fix cycles.")
     ```
     Reviewers must come from the workshop roster: `node-reviewer`, `react-reviewer`, `typescript-reviewer`, `test-reviewer`, `code-simplicity-reviewer`, `agent-smith`, `performance-oracle`.
   - If no matching worker exists, implement directly (current behavior: look for similar patterns, implement following conventions)
   - Workers write code only. Main agent handles all git operations after the worker returns.

   **Multi-stack task splitting** — If a task spans multiple stacks (e.g., backend API + frontend component):
   1. Decompose into ordered sub-tasks
   2. **Backend worker runs first** — produces the API contract/types
   3. **Frontend worker runs second** — receives backend output as context
   4. Main agent verifies integration after all phases complete

   After a worker returns, the main agent:
   - Reviews the worker's self-check summary
   - Runs the project's test command (`npm test`) to verify tests pass
   - If tests fail, re-dispatches to the same worker with failure context
   - Proceeds with incremental commit evaluation

   **Test Requirements** — Write tests for each task per the table in [test-requirements.md](./references/test-requirements.md). Run the project's test command (`npm test`) after changes. Before marking a task done, run the System-Wide Test Check from the same reference (skip for leaf-node/additive changes).

   **IMPORTANT**: Always update the original plan document by checking off completed items. Use the Edit tool to change `- [ ]` to `- [x]` for each task you finish. This keeps the plan as a living document showing progress and ensures no checkboxes are left unchecked.

2. **Incremental Commits**

   After completing each task, evaluate whether to create an incremental commit:

   | Commit when... | Don't commit when... |
   |----------------|---------------------|
   | Logical unit complete (model, service, component) | Small part of a larger unit |
   | Tests pass + meaningful progress | Tests failing |
   | About to switch contexts (backend → frontend) | Purely scaffolding with no behavior |
   | About to attempt risky/uncertain changes | Would need a "WIP" commit message |

   **Heuristic:** "Can I write a commit message that describes a complete, valuable change? If yes, commit. If the message would be 'WIP' or 'partial X', wait."

   **Commit workflow:**
   ```bash
   # 1. Verify tests pass
   npm test

   # 2. Stage only files related to this logical unit (not `git add .`)
   git add <files related to this logical unit>

   # 3. Commit with conventional message
   git commit -m "feat(scope): description of this unit"
   ```

   **Handling merge conflicts:** If conflicts arise during rebasing or merging, resolve them immediately. Incremental commits make conflict resolution easier since each commit is small and focused.

   **Note:** Incremental commits use clean conventional messages without attribution footers. The final Phase 4 commit/PR includes the full attribution.

3. **Follow Existing Patterns**

   - The plan should reference similar code - read those files first
   - Match naming conventions exactly
   - Reuse existing components where possible
   - Follow project coding standards (see CLAUDE.md)
   - When in doubt, grep for similar implementations

4. **Test Continuously**

   - Run relevant tests after each significant change (`npm test`)
   - Don't wait until the end to test
   - Fix failures immediately
   - Add new tests for new functionality — this is NOT optional
   - **Unit tests with mocks prove logic in isolation. Integration tests with real objects prove the layers work together.** If your change touches callbacks, middleware, or error handling — you need both.
   - If a task adds behavior but no tests, the task is NOT complete

5. **UI Verification** (if applicable)

   For UI work:

   - Implement components following design specs
   - Run the app and verify rendered output with the Playwright CLI (see [commit-and-pr.md](./references/commit-and-pr.md))
   - Fix visual differences identified
   - Repeat until the implementation looks correct

6. **Track Progress**
   - Keep TodoWrite updated as you complete tasks
   - Note any blockers or unexpected discoveries
   - Create new tasks if scope expands
   - Keep user informed of major milestones

### Phase 3: Quality Check

1. **Run Core Quality Checks**

   Always run before submitting:

   ```bash
   # Run full test suite
   npm test

   # Run linting (per CLAUDE.md), e.g.
   # npm run lint
   ```

2. **Consider Reviewer Agents** (Optional)

   Use for complex, risky, or large changes. Read agents from `workshop.local.md` frontmatter (`review_agents`). If no settings file, invoke the `setup` skill to create one.

   Available reviewers in the workshop roster: `node-reviewer`, `react-reviewer`, `typescript-reviewer`, `test-reviewer`, `code-simplicity-reviewer`, `agent-smith`, `performance-oracle`.

   Run configured agents in parallel with the Agent tool. Present findings and address critical issues.

3. **Final Validation**
   - All TodoWrite tasks marked completed
   - All tests pass
   - Linting passes
   - Code follows existing patterns
   - UI verified (if applicable)
   - No console errors or warnings

4. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change.
   - Include concrete:
     - Log queries/search terms
     - Metrics or dashboards to watch
     - Expected healthy signals
     - Failure signals and rollback/mitigation trigger
     - Validation window and owner
   - If there is truly no production/runtime impact, still include the section with: `No additional operational monitoring required` and a one-line reason.

### Phase 4: Ship It

Follow the commit, screenshot, and PR workflow in [commit-and-pr.md](./references/commit-and-pr.md).

1. **Create commit** using the conventional format from the reference
2. **Capture screenshots** for UI changes (REQUIRED — see reference for Playwright CLI commands)
3. **Create PR** using the template from the reference
4. **Update plan status** — change frontmatter `status: active` → `status: completed`
5. **Notify user** — summarize what was completed, link to PR, note follow-up work

---

## Quality Guidelines

See [quality-checklist.md](./references/quality-checklist.md) for: pre-PR checklist, when to use reviewer agents, common pitfalls, and key principles.
