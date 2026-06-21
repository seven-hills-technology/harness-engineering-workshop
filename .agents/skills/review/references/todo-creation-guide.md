# Todo Creation Guide

## Process

ALL findings MUST be stored in the `todos/` directory using the file-todos concept (one markdown file per finding). Create todo files immediately after synthesis — do NOT present findings for user approval first.

### Step 1: Synthesize Findings

- Collect findings from all agents
- Discard findings recommending deletion of protected artifacts (docs/plans/, docs/designs/, docs/brainstorms/, docs/specs/)
- Categorize by type: security, performance, architecture, quality
- Assign severity: P1 CRITICAL, P2 IMPORTANT, P3 NICE-TO-HAVE
- Remove duplicates; estimate effort (Small/Medium/Large)

### Step 2: Create Todo Files

**Option A: Direct File Creation (Fast)** — Create todo files directly using the Write tool, all findings in parallel.

**Option B: Sub-Agents in Parallel (Recommended for 15+ findings)** — Launch severity-grouped sub-agents:
1. Synthesize all findings into P1/P2/P3 groups
2. Launch 3 parallel sub-agents (one per severity)
3. Each creates its batch of todos
4. Consolidate results

### Todo File Structure

Each todo includes:
- **YAML frontmatter**: status, priority, issue_id, tags, dependencies
- **Problem Statement**: What's broken/missing, why it matters
- **Findings**: Discoveries from agents with evidence/location
- **Proposed Solutions**: 2-3 options with pros/cons/effort/risk
- **Recommended Action**: (Filled during triage, leave blank initially)
- **Technical Details**: Affected files, components, database changes
- **Acceptance Criteria**: Testable checklist items
- **Work Log**: Dated record with actions and learnings
- **Resources**: Links to PR, issues, documentation

### File Naming Convention

```
{issue_id}-{status}-{priority}-{description}.md

Examples:
- 001-pending-p1-security-vulnerability.md
- 002-pending-p2-performance-optimization.md
- 003-pending-p3-code-cleanup.md
```

### Status Values

- `pending` — New findings, needs triage
- `ready` — Approved, ready to work
- `complete` — Work finished

### Priority Values

- `p1` — Critical (blocks merge, security/data issues)
- `p2` — Important (should fix, architectural/performance)
- `p3` — Nice-to-have (enhancements, cleanup)

### Tagging

Always add `code-review` tag, plus: `security`, `performance`, `architecture`, `node`, `react`, `typescript`, `quality`, etc.

## Summary Report Template

After creating all todo files, present:

```markdown
## Code Review Complete

**Review Target:** PR #XXXX - [PR Title]
**Branch:** [branch-name]

### Findings Summary:
- **Total Findings:** [X]
- **CRITICAL (P1):** [count] - BLOCKS MERGE
- **IMPORTANT (P2):** [count] - Should Fix
- **NICE-TO-HAVE (P3):** [count] - Enhancements

### Created Todo Files:
**P1 - Critical (BLOCKS MERGE):**
- `001-pending-p1-{finding}.md` - {description}

**P2 - Important:**
- `002-pending-p2-{finding}.md` - {description}

**P3 - Nice-to-Have:**
- `003-pending-p3-{finding}.md` - {description}

### Review Agents Used:
- [list agents]

### Next Steps:
1. Address P1 findings (must fix before merge)
2. Triage all todos: `ls todos/*-pending-*.md`
3. Work on approved todos
4. Track progress (rename files as status changes)
```
