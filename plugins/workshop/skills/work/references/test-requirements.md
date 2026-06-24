# Test Requirements

Tests are not optional. Every behavior-adding change ships with tests.

## Test Tooling by Stack

| Stack | Test tooling |
|-------|--------------|
| NestJS API (Node) | Jest |
| React | Vitest + React Testing Library |
| End-to-end | Playwright CLI |

## Required Tests by Change Type

| Change Type | Required Tests |
|-------------|---------------|
| New service/business logic | Unit tests covering success, failure, and edge cases (Jest for the NestJS API) |
| New API endpoint | Integration test verifying request/response contract (Jest against the NestJS app), plus a Playwright CLI e2e check for user-facing flows |
| New UI component with logic | Component test with user interaction scenarios (Vitest + React Testing Library) |
| Bug fix | Regression test that reproduces the bug before the fix |
| Refactor (behavior-preserving) | Verify existing tests still pass — no new tests needed |
| Config/infra only | No tests required |

If the project has no test infrastructure yet, flag this to the user and suggest setting it up before proceeding. Do not silently skip test writing.

## Running Tests

After writing tests or making changes, run the project's test command:

```bash
npm test
```

Fix any failures immediately before moving to the next task.

## System-Wide Test Check

Before marking a task done, pause and ask:

| Question | What to do |
|----------|------------|
| **What fires when this runs?** Callbacks, middleware, observers, event handlers — trace two levels out from your change. | Read the actual code (not docs) for callbacks on models you touch, middleware in the request chain, lifecycle hooks, event handlers. |
| **Do my tests exercise the real chain?** If every dependency is mocked, the test proves your logic works *in isolation* — it says nothing about the interaction. | Write at least one integration test that uses real objects through the full callback/middleware chain. No mocks for the layers that interact. |
| **Can failure leave orphaned state?** If your code persists state (DB row, cache, file) before calling an external service, what happens when the service fails? Does retry create duplicates? | Trace the failure path with real objects. If state is created before the risky call, test that failure cleans up or that retry is idempotent. |
| **What other interfaces expose this?** Interfaces, base classes, alternative entry points. | Grep for the method/behavior in related classes. If parity is needed, add it now — not as a follow-up. |
| **Do error strategies align across layers?** Retry middleware + application fallback + framework error handling — do they conflict or create double execution? | List the specific error classes at each layer. Verify your catch/handle list matches what the lower layer actually throws. |

**When to skip:** Leaf-node changes with no callbacks, no state persistence, no parallel interfaces. If the change is purely additive, the check takes 10 seconds and the answer is "nothing fires, skip."

**When this matters most:** Any change that touches models with callbacks, error handling with fallback/retry, or functionality exposed through multiple interfaces.
