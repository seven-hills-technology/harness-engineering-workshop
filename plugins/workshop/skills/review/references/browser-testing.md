# End-to-End Browser Testing

Browser tests are driven through the Playwright CLI (`npx playwright-cli ...`) from a spawned subagent so the main review context stays clean.

## Detect Project Type

| Indicator | Project Type |
|-----------|--------------|
| `*.csproj`, `*.sln`, `appsettings.json` | .NET |
| `package.json` with `react` dependency | React |
| `package.json` without `react` | Node.js |
| Both .NET and React/Node files | Full-stack (test both) |

## Offer Testing

After presenting the Summary Report, offer appropriate testing:

**For Web Projects:** "Want to run browser tests on the affected pages?" (Yes / No)

**For Full-stack Projects:** "Want to run end-to-end tests?" (Web only / Both frontend and backend / No)

## If User Accepts

Spawn a general-purpose subagent to run the browser tests (this preserves the main context):

```
Task general-purpose("Run Playwright CLI browser tests for PR #[number]. Test all affected pages,
check for console errors, pause for human verification on auth/payment flows, and create P1 todos
for any failures.")
```

The subagent drives the browser entirely through the Playwright CLI:

1. **Identify affected pages** — from the PR's changed files, determine which routes/pages to exercise.
2. **Open the page** — `npx playwright-cli open <url>`
3. **Snapshot to get element refs** — `npx playwright-cli snapshot` returns the accessibility tree with element refs (e.g. `e21`, `e34`) used to target interactions.
4. **Check the console** — `npx playwright-cli console` and flag any errors or warnings.
5. **Interact** — use the refs from the snapshot:
   - `npx playwright-cli click <ref>`
   - `npx playwright-cli fill <ref> <text>`
   - Re-run `npx playwright-cli snapshot` after navigation/state changes to get fresh refs.
6. **Capture evidence** — `npx playwright-cli screenshot --filename=<path>` for each tested page or failure.
7. **Pause for human verification** — for OAuth / email / payment / other auth flows, stop and ask the human to complete or confirm the step before continuing.
8. **Create P1 todos for failures** — any console errors, broken interactions, or visual regressions become P1 todos (see the todo creation guide).
9. **Retry** — fix and re-run until the affected pages pass.
