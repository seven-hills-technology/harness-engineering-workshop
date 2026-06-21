# Commit and PR Guide

## Commit Format

```bash
git add .
git status  # Review what's being committed
git diff --staged  # Check the changes

# Commit with conventional format
git commit -m "$(cat <<'EOF'
feat(scope): description of what and why

Brief explanation if needed.

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Screenshots for UI Changes (REQUIRED for any UI work)

**Step 1: Start dev server** (if not running)
```bash
# React: npm run dev
# NestJS API: npm start
```

**Step 2: Capture screenshots with the Playwright CLI**
```bash
npx playwright-cli open http://localhost:[port]/[route]
npx playwright-cli snapshot            # returns element refs like e21
npx playwright-cli screenshot --filename=out.png
```
Use the element refs from `snapshot` (e.g. `e21`) to target interactions before capturing the final screenshot.

**What to capture:**
- New screens: Screenshot of the new UI
- Modified screens: Before AND after screenshots

## Pull Request

```bash
git push -u origin feature-branch-name

gh pr create --title "Feature: [Description]" --body "$(cat <<'EOF'
## Summary
- What was built
- Why it was needed
- Key decisions made

## Testing
- Tests added/modified
- Manual testing performed

## Post-Deploy Monitoring & Validation
- **What to monitor/search**
  - Logs:
  - Metrics/Dashboards:
- **Validation checks (queries/commands)**
  - `command or query here`
- **Expected healthy behavior**
  - Expected signal(s)
- **Failure signal(s) / rollback trigger**
  - Trigger + immediate action
- **Validation window & owner**
  - Window:
  - Owner:
- **If no operational impact**
  - `No additional operational monitoring required: <reason>`

## Before / After Screenshots
| Before | After |
|--------|-------|
| ![before](URL) | ![after](URL) |

---

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
