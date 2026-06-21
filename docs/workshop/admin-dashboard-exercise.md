# Exercise — Build the Admin Dashboard

The running build feature for the workshop. You'll take it from idea to shipped using the full
harness loop. A complete **reference implementation already exists** (API: `apps/api/src/modules/admin/`,
React: `apps/web/src/admin/`) — use it as the answer key, but try to build it yourself first.

## Brief

Admins need an analytics view at `/admin` (admin-only). It should show, from the seeded order
history:

- **Totals** — revenue (paid + fulfilled only), order count, paid/fulfilled count.
- **Revenue over time** — last 12 weeks (a chart).
- **Orders by status** — pending / paid / fulfilled / cancelled.
- **Top products** — by revenue (units + revenue).
- **Low stock** — products at/below their `lowStockThreshold`.

Constraints: admin-only (reuse `AdminGuard` on the API and an admin route guard in React);
revenue excludes pending/cancelled; charts via Recharts; tests required (Jest + Vitest); the flow
verified with a Playwright CLI e2e.

## Suggested flow (use the harness)

1. **Module 1** — make sure `workshop.local.md` exists (`workshop:setup`); skim the orders +
   products modules so the agent is grounded.
2. **Module 4 / `--visual`** — `workshop:plan "admin dashboard" --visual`; mock up the layout,
   annotate, fold feedback into the design.
3. **Module 2 / `workshop:work`** — implement: an admin aggregation endpoint (`node-worker`) then
   the dashboard page with charts (`react-worker`). Tests come with each.
4. **Module 3** — add a Playwright CLI e2e (`e2e/admin-dashboard.sh` is the reference) and run it.
5. **Module 4 / `workshop:review`** — run the quality gate; resolve any `ask-user` findings; make
   sure tests pass.
6. **`workshop:ship`** — assess risk + suggested review depth, draft the structured PR, and open it.

## Stretch goals

- Add a date-range filter to the dashboard.
- Add an "orders by status" drill-down to a filtered orders list.
- Wire a real MCP server (Module 3) and use it from an agent.
- Run the quality gate inside a `git-worktree` (the advanced isolation demo).

## Done when

- `/admin` renders all five sections from seeded data, admin-only.
- Jest + Vitest green; an e2e flow passes; `workshop:ship` opens a PR with a risk assessment and
  suggested review depth.
