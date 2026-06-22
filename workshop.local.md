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
