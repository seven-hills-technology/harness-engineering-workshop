# Commit Guide (workshop:work)

`workshop:work` implements and **commits**. Opening the PR is a separate step — run
`workshop:ship` afterward.

## Conventional commits

```bash
git add <files for this logical unit>   # stage the unit, not `git add .`
git status
git diff --staged

git commit -m "$(cat <<'EOF'
feat(scope): description of what and why

Brief explanation if needed.

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Incremental commits

Commit each complete, valuable unit (model, service, component, passing test) rather than one
giant commit:

| Commit when… | Don't commit when… |
| --- | --- |
| A logical unit is complete and tests pass | It's a small part of a larger unit |
| About to switch context (backend → frontend) | Tests are failing |
| About to try something risky | The message would be "WIP" / "partial X" |

Heuristic: if you can write a clear conventional message describing a complete change, commit.

When the work is done and committed, run **`workshop:ship`** to assess risk, draft the structured
PR description, run the tests, and open the PR.
