# Quality Checklist and Guidelines

## Pre-PR Checklist

Before creating PR, verify:

- [ ] All clarifying questions asked and answered
- [ ] All TodoWrite tasks marked completed
- [ ] New/modified behavior has corresponding tests (unit and/or integration)
- [ ] Tests pass (run `npm test`)
- [ ] Linting passes (e.g. `npm run lint`)
- [ ] Code follows existing patterns
- [ ] UI verified against design (if applicable)
- [ ] Before/after screenshots captured (for UI changes)
- [ ] Commit messages follow conventional format
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale)
- [ ] PR description includes summary, testing notes, and screenshots

## When to Use Reviewer Agents

**Don't use by default.** Use reviewer agents only when:

- Large refactor affecting many files (10+)
- Security-sensitive changes (authentication, permissions, data access)
- Performance-critical code paths
- Complex algorithms or business logic
- User explicitly requests thorough review

Available reviewers in the workshop roster: `node-reviewer`, `react-reviewer`, `typescript-reviewer`, `test-reviewer`, `code-simplicity-reviewer`, `agent-smith`, `performance-oracle`.

For most features: tests + linting + following patterns is sufficient.

## Common Pitfalls to Avoid

- **Analysis paralysis** — Don't overthink, read the plan and execute
- **Skipping clarifying questions** — Ask now, not after building wrong thing
- **Ignoring plan references** — The plan has links for a reason
- **Testing at the end** — Test continuously or suffer later
- **Forgetting TodoWrite** — Track progress or lose track of what's done
- **80% done syndrome** — Finish the feature, don't move on early
- **Over-reviewing simple changes** — Save reviewer agents for complex work

## Key Principles

- **Start fast, execute faster** — Get clarification once, then execute. The goal is to finish the feature, not create perfect process.
- **The plan is your guide** — Load references, follow existing patterns. Don't reinvent.
- **Test as you go** — Run tests after each change, not at the end. Fix failures immediately.
- **Quality is built in** — Follow patterns, write tests, run linting. Use reviewer agents for complex/risky changes only.
- **Ship complete features** — Mark all tasks completed. Don't leave features 80% done. A finished feature that ships beats a perfect one that doesn't.
