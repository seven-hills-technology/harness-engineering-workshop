---
name: workshop:setup
description: Configure which review and worker agents run for your project. Auto-detects stack(s) and writes workshop.local.md.
disable-model-invocation: true
---

# Workshop Setup

## Phase 0: Interaction Method
If `AskUserQuestion` is available, use it for all prompts below.
If not, present each question as a numbered list and wait for a reply before proceeding.

## Phase 1: Check Existing Config
Read `workshop.local.md` in project root. If exists, display current settings and offer: Reconfigure, View current, Cancel.

## Phase 2: Detect and Ask
Auto-detect project stack(s) -- detect ALL stacks present, not just the primary one:
```bash
# Detect all stacks (a project can be multiple)
stacks=""

# React detection
(test -f package.json && grep -q '"react"' package.json 2>/dev/null) && stacks="$stacks react"

# Node/NestJS detection (package.json without react, or has @nestjs)
if test -f package.json && ! echo "$stacks" | grep -q "react"; then
  stacks="$stacks node"
elif test -f package.json && grep -q '"@nestjs' package.json 2>/dev/null; then
  stacks="$stacks node"
fi

# Fallback
test -z "$stacks" && stacks="general"
```

Offer: Auto-configure (Recommended) or Customize.

### Auto-configure defaults:

**Review agents (`review_agents`):**
- **React:** `[react-reviewer, typescript-reviewer, test-reviewer, code-simplicity-reviewer, agent-smith, performance-oracle]`
- **Node:** `[node-reviewer, typescript-reviewer, test-reviewer, code-simplicity-reviewer, agent-smith, performance-oracle]`
- **General:** `[test-reviewer, code-simplicity-reviewer, agent-smith, performance-oracle]`

**Worker agents (`worker_agents`):**
- **React:** `[react-worker]`
- **Node:** `[node-worker]`
- **React+Node (full-stack):** `[node-worker, react-worker]`
- **General:** `[]` (no workers, main agent handles directly)

## Phase 3: Customize (3 questions)

a. Stack - confirm or override:
- React: "React - Hooks, component, and state management reviewer"
- Node: "Node.js - Express/Fastify/NestJS patterns, async reviewer"
- TypeScript: "TypeScript - Type safety reviewer (added to all stacks)"

b. Focus areas (multiSelect):
- Security (agent-smith)
- Performance (performance-oracle)
- Code simplicity (code-simplicity-reviewer)

c. Depth:
- Thorough (Recommended): Stack reviewers + all selected focus agents
- Fast: Stack reviewers + code simplicity only

## Phase 4: Build Agent List and Write File

Stack-specific agents:
- React -> `react-reviewer`
- Node -> `node-reviewer`
- All stacks -> `typescript-reviewer` (always included)
- General -> (none)

Write `workshop.local.md`. For a full-stack (React + Node) project, use these defaults:
```markdown
---
worker_agents: [node-worker, react-worker]
review_agents: [node-reviewer, react-reviewer, typescript-reviewer, test-reviewer, code-simplicity-reviewer, agent-smith, performance-oracle]
plan_review_agents: [code-simplicity-reviewer, agent-smith]
research_agents: [repo-research-analyst]
---

# Review Context

Add project-specific review instructions here.
These notes are passed to all review and worker agents during /workshop:review and /workshop:work.

Examples:
- "Our API is public -- extra scrutiny on input validation"
- "Performance-critical: we serve 10k req/s on this endpoint"
- "We use React Query for all server state -- check cache invalidation"
```

For a single-stack project, trim `worker_agents` and the stack-specific `review_agents` to the detected stack, but always keep `typescript-reviewer`, `test-reviewer`, `code-simplicity-reviewer`, `agent-smith`, and `performance-oracle` in `review_agents`, `plan_review_agents: [code-simplicity-reviewer, agent-smith]`, and `research_agents: [repo-research-analyst]`.

## Phase 5: Confirm
Display saved config summary.
