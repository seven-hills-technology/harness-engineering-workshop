# Pull Request Guide (workshop:ship)

Open every PR with a **risk analysis** and a **suggested review depth**, so reviewers know how
hard to look. Same risk model as the `workshop:review` quality gate
([quality-gate.md](../../review/references/quality-gate.md)).

## Risk levels

Assign one level from the **change surface** (not line count), with a one-line rationale:

| risk | when | suggested review depth |
| --- | --- | --- |
| **LOW** | mechanical / contained; no auth, data, or API surface; small blast radius | quick skim is enough |
| **MEDIUM** | normal feature work; touches a few modules or a public-ish surface | standard review against the checklist |
| **HIGH** | auth/authz, data migrations or destructive data ops, payments/orders, public API contract, or a broad cross-cutting change | deep review; reviewer sign-off + extra e2e before merge |

Example rationale: "touches the checkout stock-decrement transaction → **HIGH**".

## Screenshots for UI changes (required for any UI work)

```bash
# start the app if needed (npm run start:web / npm run start:api), then:
npx playwright-cli open http://localhost:9010/[route]
npx playwright-cli snapshot            # returns element refs like e21
npx playwright-cli screenshot --filename=after.png
```
Capture new screens; for modified screens capture **before and after**.

## Create the PR

```bash
git push -u origin feature-branch-name

gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## What changed
<one short paragraph: what was built and why>

## Risk assessment
**LOW | MEDIUM | HIGH** — <rationale: the specific surface that drove this level>.
Suggested review: <quick skim | standard review against the checklist | deep review + reviewer sign-off + extra e2e>.

## Testing
- Unit/integration tests added or updated
- Suites pass (api: `npm test`, web: `npm test`); relevant `e2e/` flow run if UI/flows changed

## Findings (from workshop:review, if run)
- ✅ auto-fixed: <one line each, or "none">
- ⚠️ needs human judgment: <one line each with file:line, or "none">

## Post-Deploy Monitoring & Validation
- **What to monitor** (logs / metrics / dashboards):
- **Validation checks** (queries/commands): `…`
- **Expected healthy signal(s)** / **Failure signal + rollback trigger**:
- **Validation window & owner**:
- If no runtime impact: `No additional operational monitoring required: <reason>`

## Before / After Screenshots
| Before | After |
|--------|-------|
| ![before](URL) | ![after](URL) |

## Review checklist
- [ ] Intent matches the change
- [ ] Risk level + suggested review depth look right (adjust if needed)
- [ ] Tests cover the new behavior
- [ ] No unresolved review findings

---

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `workshop:review` was run, reuse its risk level and findings here so the PR and the gate agree.
