# End-to-end flows (Playwright CLI)

These flows exercise the running app through a real browser using the **Playwright CLI** — the
workshop's single browser layer (same tool in Claude and Codex). They are written as small,
readable shell scripts that drive `npx playwright-cli` with role/text locators.

## Prerequisites

1. Start the API and web app (in separate terminals, any OS):
   ```bash
   npm run start:api   # http://localhost:8010
   npm run start:web   # http://localhost:9010
   ```
2. Install a browser once:
   ```bash
   npx playwright-cli install-browser chromium
   ```

## Run

```bash
bash e2e/login-browse-cart.sh
```

> On **Windows**, run these flows from **Git Bash** or **WSL** (they're bash scripts). The
> Playwright CLI itself is cross-platform; only the flow wrappers assume bash.

## Flows

| Flow | Covers |
| --- | --- |
| `login-browse-cart.sh` | login → browse catalog → open product → add to cart |

More flows (checkout, write-a-review, search/filter, admin dashboard) are added alongside their
features in later phases.

## Notes

- The Playwright CLI keeps browser state per named session (`PLAYWRIGHT_CLI_SESSION`), so steps
  share one browser. Take a `snapshot` to get element refs (e.g. `e21`) or use role/text locators
  like `getByRole('button', { name: 'Add to cart' })`.
- These are the same commands an agent runs during `workshop:review` browser testing.
