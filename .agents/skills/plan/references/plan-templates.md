# Plan Templates

Three detail levels for plan documents. Choose based on complexity.

## MINIMAL (Quick Issue)

**Best for:** Simple bugs, small improvements, clear features

````markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
origin: docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md  # if originated from brainstorm, otherwise omit
design: docs/designs/YYYY-MM-DD-<topic>-design.md  # if design discussion was produced, otherwise omit
mockup: docs/designs/YYYY-MM-DD-<topic>-mockup.html  # if a lavish-axi visual mockup was produced, otherwise omit
---

# [Issue Title]

[Brief problem/feature description]

## Acceptance Criteria

- [ ] Core requirement 1
- [ ] Core requirement 2

## Context

[Any critical information]

## MVP

### ExampleService.cs

```csharp
public class ExampleService
{
    private readonly string _name;

    public ExampleService()
    {
        _name = "test";
    }
}
```

## Sources

- **Origin brainstorm:** [docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md](path) — include if plan originated from a brainstorm
- **Design & mockup:** [docs/designs/YYYY-MM-DD-<topic>-design.md](path), [docs/designs/YYYY-MM-DD-<topic>-mockup.html](path) — include if produced during Phase 1.7
- Related issue: #[issue_number]
- Documentation: [relevant_docs_url]
````

## MORE (Standard Issue)

**Best for:** Most features, complex bugs, team collaboration

Includes everything from MINIMAL plus: detailed background, technical considerations, success metrics, dependencies and risks.

```markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
origin: docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md  # if originated from brainstorm, otherwise omit
design: docs/designs/YYYY-MM-DD-<topic>-design.md  # if design discussion was produced, otherwise omit
mockup: docs/designs/YYYY-MM-DD-<topic>-mockup.html  # if a lavish-axi visual mockup was produced, otherwise omit
---

# [Issue Title]

## Overview

[Comprehensive description]

## Problem Statement / Motivation

[Why this matters]

## Proposed Solution

[High-level approach]

## Technical Considerations

- Architecture impacts
- Performance implications
- Security considerations

## System-Wide Impact

- **Interaction graph**: [What callbacks/middleware/observers fire when this runs?]
- **Error propagation**: [How do errors flow across layers? Do retry strategies align?]
- **State lifecycle risks**: [Can partial failure leave orphaned/inconsistent state?]
- **API surface parity**: [What other interfaces expose similar functionality and need the same change?]
- **Integration test scenarios**: [Cross-layer scenarios that unit tests won't catch]

## Acceptance Criteria

- [ ] Detailed requirement 1
- [ ] Detailed requirement 2
- [ ] Testing requirements

## Success Metrics

[How we measure success]

## Dependencies & Risks

[What could block or complicate this]

## Sources & References

- **Origin brainstorm:** [docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md](path) — include if plan originated from a brainstorm
- Similar implementations: [file_path:line_number]
- Best practices: [documentation_url]
- Related PRs: #[pr_number]
```

## A LOT (Comprehensive Issue)

**Best for:** Major features, architectural changes, complex integrations

Includes everything from MORE plus: implementation phases, alternatives considered, system-wide impact analysis, quality gates, risk mitigation.

```markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
origin: docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md  # if originated from brainstorm, otherwise omit
design: docs/designs/YYYY-MM-DD-<topic>-design.md  # if design discussion was produced, otherwise omit
mockup: docs/designs/YYYY-MM-DD-<topic>-mockup.html  # if a lavish-axi visual mockup was produced, otherwise omit
---

# [Issue Title]

## Overview

[Executive summary]

## Problem Statement

[Detailed problem analysis]

## Proposed Solution

[Comprehensive solution design]

## Technical Approach

### Architecture

[Detailed technical design]

### Implementation Phases

**IMPORTANT: Vertical slicing required.** Each phase must be a vertical slice through the stack — endpoint + service + model + test — not a horizontal layer (all DB, then all services, then all API). Phase 1 should produce a testable end-to-end path, even if minimal. Include a testing checkpoint at the end of each phase.

#### Phase 1: [Foundation — vertical slice producing a testable path]

- Tasks and deliverables
- Testing checkpoint
- Success criteria

#### Phase 2: [Core Implementation — next vertical slice]

- Tasks and deliverables
- Testing checkpoint
- Success criteria

#### Phase 3: [Polish & Optimization]

- Tasks and deliverables
- Success criteria

## Alternative Approaches Considered

[Other solutions evaluated and why rejected]

## System-Wide Impact

### Interaction Graph

[Map the chain reaction: what callbacks, middleware, observers, and event handlers fire when this code runs? Trace at least two levels deep.]

### Error & Failure Propagation

[Trace errors from lowest layer up. Identify retry conflicts, unhandled error types, silent failure swallowing.]

### State Lifecycle Risks

[Walk through each step that persists state. Can partial failure orphan rows, duplicate records, or leave caches stale?]

### API Surface Parity

[List all interfaces that expose equivalent functionality. Note which need updating.]

### Integration Test Scenarios

[3-5 cross-layer test scenarios that unit tests with mocks would never catch.]

## Acceptance Criteria

### Functional Requirements

- [ ] Detailed functional criteria

### Non-Functional Requirements

- [ ] Performance targets
- [ ] Security requirements
- [ ] Accessibility standards

### Quality Gates

- [ ] Test coverage requirements
- [ ] Documentation completeness
- [ ] Code review approval

## Success Metrics

[Detailed KPIs and measurement methods]

## Dependencies & Prerequisites

[Detailed dependency analysis]

## Risk Analysis & Mitigation

[Comprehensive risk assessment]

## Future Considerations

[Extensibility and long-term vision]

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md](path) — Key decisions carried forward: [list 2-3]

### Internal References

- Architecture decisions: [file_path:line_number]
- Similar features: [file_path:line_number]

### External References

- Framework documentation: [url]
- Best practices guide: [url]

### Related Work

- Previous PRs: #[pr_numbers]
- Related issues: #[issue_numbers]
```
