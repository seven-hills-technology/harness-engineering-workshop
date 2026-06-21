---
name: workshop:plan
description: Transform feature descriptions into well-structured project plans following conventions
argument-hint: "[feature description, bug report, or improvement idea] [--visual] [--skip-design]"
---

# Create a plan for a new feature or bug fix

## Introduction

**Note: The current year is 2026.** Use this when dating plans and searching for recent documentation.

Transform feature descriptions, bug reports, or improvement ideas into well-structured markdown files issues that follow project conventions and best practices. This command provides flexible detail levels to match your needs.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to plan? Please describe the feature, bug fix, or improvement you have in mind."

Do not proceed until you have a clear feature description from the user.

## Prerequisites Check

Check whether the project configuration file exists:

```bash
test -f workshop.local.md && echo "found" || echo "missing"
```

**If `workshop.local.md` is missing**, use **AskUserQuestion** to prompt the user:

> "This project doesn't have a `workshop.local.md` configuration yet. Running `/workshop:setup` first will configure the right worker agents and reviewers for your stack, which improves downstream `/workshop:work` execution."

**Options:**
1. **Run `/workshop:setup` now** → Invoke the `setup` skill, then return here and continue with planning
2. **Continue without setup** → Proceed with planning using defaults (setup can be run later)

If found, continue directly to idea refinement.

### 0. Idea Refinement

**Check for brainstorm output first:**

Before asking questions, look for recent brainstorm documents in `docs/brainstorms/` that match this feature:

```bash
ls -la docs/brainstorms/*.md 2>/dev/null | head -10
```

**Relevance criteria:** A brainstorm is relevant if:
- The topic (from filename or YAML frontmatter) semantically matches the feature description
- Created within the last 14 days
- If multiple candidates match, use the most recent one

**If a relevant brainstorm exists:**
1. Read the brainstorm document **thoroughly** — every section matters
2. Announce: "Found brainstorm from [date]: [topic]. Using as foundation for planning."
3. Extract and carry forward **ALL** of the following into the plan:
   - Key decisions and their rationale
   - Chosen approach and why alternatives were rejected
   - Constraints and requirements discovered during brainstorming
   - Open questions (flag these for resolution during planning)
   - Success criteria and scope boundaries
   - Any specific technical choices or patterns discussed
4. **Skip the idea refinement questions below** — the brainstorm already answered WHAT to build
5. Use brainstorm content as the **primary input** to research and planning phases
6. **Critical: The brainstorm is the origin document.** Throughout the plan, reference specific decisions with `(see brainstorm: docs/brainstorms/<filename>)` when carrying forward conclusions. Do not paraphrase decisions in a way that loses their original context — link back to the source.
7. **Do not omit brainstorm content** — if the brainstorm discussed it, the plan must address it (even if briefly). Scan each brainstorm section before finalizing the plan to verify nothing was dropped.

**If multiple brainstorms could match:**
Use **AskUserQuestion tool** to ask which brainstorm to use, or whether to proceed without one.

**If no brainstorm found (or not relevant), run idea refinement:**

Refine the idea through collaborative dialogue using the **AskUserQuestion tool**:

- Ask questions one at a time to understand the idea fully
- Prefer multiple choice questions when natural options exist
- Focus on understanding: purpose, constraints and success criteria
- Continue until the idea is clear OR user says "proceed"

**Enum / lookup table decision (ask for ANY potential enum-like data):**

While refining, actively scan the feature description for any data that looks like it could be represented as a fixed set of values — status fields, types, categories, states, roles, priorities, etc. For **each** one identified, ask:

> "I noticed `[FieldName]` looks like it could be a fixed set of values. Should this be implemented as:
> 1. **Database lookup table** — values stored in the DB, editable at runtime without a deploy (e.g. `StatusTypes` table with FK)
> 2. **Code enum** — values defined in source code, change requires a deploy (e.g. `enum Status { Active, Inactive }`)

Document the decision for each enum-like field in the plan under a `## Data Design Decisions` section.

**Gather signals for research decision.** During refinement, note:

- **User's familiarity**: Do they know the codebase patterns? Are they pointing to examples?
- **User's intent**: Speed vs thoroughness? Exploration vs execution?
- **Topic risk**: Security, payments, external APIs warrant more caution
- **Uncertainty level**: Is the approach clear or open-ended?

**Skip option:** If the feature description is already detailed, offer:
"Your description is clear. Should I proceed with research, or would you like to refine it further?"

## Main Tasks

### 1. Local Research (Always Runs)

#### 1.0. Generate Objective Research Questions

Before dispatching research agents, generate **3-5 objective, fact-seeking questions** from the feature description. Questions should seek facts about the codebase, not opinions about implementation.

- Good: "How does the User entity relate to the Preferences table?", "What middleware chain do API endpoints pass through?"
- Bad: "How should we implement user preferences?", "What's the best way to add this endpoint?"

This step exists because good research is all facts — if you tell the model what you're building, you get opinions. The research agent should not see the feature description.

#### 1.1. Dispatch Research Agents (Parallel)

Run repo research:

- Task repo-research-analyst(**research_questions_only** — do NOT pass the feature description. The agent explores the codebase guided only by the objective questions from 1.0.)

**What to look for:**
- **Repo research:** existing patterns, CLAUDE.md guidance, technology familiarity, pattern consistency — all as objective facts
- **Past solutions:** while consolidating, also scan `docs/solutions/` directly for documented solutions that might apply (gotchas, patterns, lessons learned)

These findings inform the next step.

### 1.5. Research Decision

Based on signals from Step 0 and findings from Step 1, decide on external research.

**High-risk topics → always research.** Security, payments, external APIs, data privacy. The cost of missing something is too high. This takes precedence over speed signals.

**Strong local context → skip external research.** Codebase has good patterns, CLAUDE.md has guidance, user knows what they want. External research adds little value.

**Uncertainty or unfamiliar territory → research.** User is exploring, codebase has no examples, new technology. External perspective is valuable.

**Announce the decision and proceed.** Brief explanation, then continue. User can redirect if needed.

Examples:
- "Your codebase has solid patterns for this. Proceeding without external research."
- "This involves payment processing, so I'll research current best practices first."

### 1.5b. External Research (Conditional)

**Only run if Step 1.5 indicates external research is valuable.**

External research is optional prose-gathering: consult framework documentation and community best practices for the technology in play (current conventions, version constraints, known pitfalls). Capture relevant documentation URLs and key takeaways for the consolidation step. If external research is not valuable, skip this step.

If a research step stalls, returns an error, or cannot complete (for example, web access is unavailable), **do not retry indefinitely** — treat it as unavailable and continue with whatever local research you have, noting the gap in Phase 1.6.

### 1.6. Consolidate Research

After all research steps complete, consolidate findings:

- Document relevant file paths from repo research (e.g., `services/example-service.ts:42`)
- **Include relevant institutional learnings** from `docs/solutions/` (key insights, gotchas to avoid)
- Note external documentation URLs and best practices (if external research was done)
- List related issues or PRs discovered
- Capture CLAUDE.md conventions
- If external research could not be completed, note: "External research partial — proceeding with available findings."

**Optional validation:** Briefly summarize findings and ask if anything looks off or missing before proceeding to planning.

### 1.7. Design Discussion

After consolidating research, generate a **design discussion document** before writing the plan. This is the highest-leverage alignment point — a ~200-line doc where the user can verify the agent's understanding and steer before committing to a full plan.

**Generate `docs/designs/YYYY-MM-DD-<topic>-design.md` with these sections:**

```markdown
# Design Discussion: <topic>

**Date:** YYYY-MM-DD
**Feature:** <one-line description>

## Current State
What the codebase looks like today in the area being changed.
Reference specific files and patterns found during research.
Use repo-relative paths.

## Patterns to Follow
Which existing patterns the agent found and intends to reuse.
Include file paths. This is the user's chance to say
"that's the wrong pattern — follow this one instead."

## Desired End State
What the code should look like after implementation.
High-level architectural description, not line-by-line pseudo-code.

## Design Decisions
Choices the agent has made or recommends, with one-line rationale each.

## Open Questions
Things the agent doesn't know and needs the user to answer.
Be specific: "Should the new endpoint require admin auth or user auth?"
not "Are there any questions?"

## Testing Strategy
How correctness will be verified: unit tests, integration tests,
manual verification, browser tests. High level only.
```

Ensure `docs/designs/` directory exists before writing.

**Present the design to the user.** Display the full content in the conversation, not just a file path. Then use **AskUserQuestion** to ask:

> "Does this design capture the right approach? Review the patterns, decisions, and open questions. I won't write the plan until we're aligned."

**Options (if AskUserQuestion is unavailable, present this numbered list and accept a number):**
1. **Approve and continue** — proceed to structure outline and plan writing
2. **I have corrections** — user provides feedback, agent updates the design doc and re-presents
3. **Answer open questions** — user answers the open questions, agent incorporates and re-presents
4. **Generate visual mockup (lavish-axi)** — for UI/layout plans: generate an interactive HTML mockup, gather annotated human feedback, then fold the resolved decisions back into the design doc. See [visual-feedback.md](./references/visual-feedback.md). Skip this option in pipeline mode.

**Loop until approved.** This gate is not optional — the plan must not be written until the design is approved.

**Explicit visual flag:** If the user invoked workshop:plan with `--visual` (or explicitly asks for a visual mockup), treat the visual mockup loop (option 4) as already chosen: after presenting the design doc, run the lavish-axi pre-flight from [visual-feedback.md](./references/visual-feedback.md) and, if it passes, launch the visual feedback loop immediately instead of waiting for the user to select it. Honor the same pre-flight checks and graceful degradation — if pre-flight fails, announce the specific reason and fall back to the standard approve loop. After the loop folds back into the design doc, return to the standard approve gate. **Never** auto-run `--visual` in pipeline mode (it requires human annotation).

**Skip condition:** If the user invoked workshop:plan with `--skip-design` or explicitly says "skip the design, just write the plan", skip this phase. Document in the plan that design review was skipped. If both `--visual` and `--skip-design` are passed, `--skip-design` wins (no design gate means no mockup loop) — note the conflict to the user.

**Brainstorm integration:** If a brainstorm exists, the design doc should carry forward brainstorm decisions and note them as "decided during brainstorming." The design adds technical grounding (patterns, current state) that brainstorming doesn't capture.

**Pipeline mode:** If running in pipeline mode (LFG/SLFG or `disable-model-invocation`), auto-approve the design and proceed without user interaction. Do **not** offer the visual mockup option (option 4) in pipeline mode — it requires human annotation.

### 2. Issue Planning & Structure

<thinking>
Think like a product manager - what would make this issue clear and actionable? Consider multiple perspectives
</thinking>

**Structure Outline Approval** — Before writing the full plan, present the **Implementation Phases** as a structure outline for approval:

- List each phase with a 1-2 sentence scope description
- Note which files/modules each phase touches
- Include testing checkpoints between phases
- **Enforce vertical slicing:** each phase should cut through the full stack (endpoint + service + model + test), not group by layer (all DB, then all services, then all API)

Present to the user using **AskUserQuestion**:

> "Here's the proposed structure. Each phase is a vertical slice with its own testing checkpoint. Should I adjust the ordering or scope before writing the full plan?"

**Options:**
1. **Approve** — proceed to write the full plan
2. **Adjust** — user provides reordering or scope changes

This is a quick alignment (<30 seconds for the user) that prevents horizontal plans and catches ordering issues early. Skip in pipeline mode.

**Title & Categorization:**

- [ ] Draft clear, searchable issue title using conventional format (e.g., `feat: Add user authentication`, `fix: Cart total calculation`)
- [ ] Determine issue type: enhancement, bug, refactor
- [ ] Convert title to filename: add today's date prefix, determine daily sequence number, strip prefix colon, kebab-case, add `-plan` suffix
  - Scan `docs/plans/` for files matching today's date pattern `YYYY-MM-DD-\d{3}-`
  - Find the highest existing sequence number for today
  - Increment by 1, zero-padded to 3 digits (001, 002, etc.)
  - Example: `feat: Add User Authentication` → `2026-01-21-001-feat-add-user-authentication-plan.md`
  - Keep it descriptive (3-5 words after prefix) so plans are findable by context

**Stakeholder Analysis:**

- [ ] Identify who will be affected by this issue (end users, developers, operations)
- [ ] Consider implementation complexity and required expertise

**Content Planning:**

- [ ] Choose appropriate detail level based on issue complexity and audience
- [ ] List all necessary sections for the chosen template
- [ ] Gather supporting materials (error logs, screenshots, design mockups)
- [ ] Prepare code examples or reproduction steps if applicable, name the mock filenames in the lists

### 3. Flow & Edge-Case Analysis

After planning the issue structure, validate and refine the feature specification for flow completeness:

- Walk the primary user flow end to end and confirm every step is covered by the plan
- Surface edge cases, error paths, and boundary conditions the description glosses over
- Identify any gaps between the stated requirements and what the implementation will actually need

**Output:**

- [ ] Review the flow/edge-case analysis results
- [ ] Incorporate any identified gaps or edge cases into the issue
- [ ] Update acceptance criteria based on the findings

### 4. Choose Implementation Detail Level

Select how comprehensive you want the issue to be, simpler is mostly better. Use the appropriate template from [plan-templates.md](./references/plan-templates.md):

- **MINIMAL** — Simple bugs, small improvements. Problem + acceptance criteria + context.
- **MORE** — Most features. Adds technical considerations, success metrics, dependencies.
- **A LOT** — Major features, architecture changes. Adds implementation phases (vertical slices), system-wide impact, quality gates.

### 5. Issue Creation & Formatting

Apply the formatting guidelines from [formatting-guide.md](./references/formatting-guide.md) — headings, code examples, cross-references, task lists.

### 6. Final Review & Submission

**Brainstorm cross-check (if plan originated from a brainstorm):**

Before finalizing, re-read the brainstorm document and verify:
- [ ] Every key decision from the brainstorm is reflected in the plan
- [ ] The chosen approach matches what was decided in the brainstorm
- [ ] Constraints and requirements from the brainstorm are captured in acceptance criteria
- [ ] Open questions from the brainstorm are either resolved or flagged
- [ ] The `origin:` frontmatter field points to the brainstorm file
- [ ] The Sources section includes the brainstorm with a summary of carried-forward decisions

**Pre-submission Checklist:**

- [ ] Title is searchable and descriptive
- [ ] Labels accurately categorize the issue
- [ ] All template sections are complete
- [ ] Links and references are working
- [ ] Acceptance criteria are measurable
- [ ] Add names of files in pseudo code examples and todo lists
- [ ] Add an ERD mermaid diagram if applicable for new model changes

## Write Plan File

**REQUIRED: Write the plan file to disk before presenting any options.**

```bash
mkdir -p docs/plans/
# Determine daily sequence number
today=$(date +%Y-%m-%d)
last_seq=$(ls docs/plans/${today}-*-plan.md 2>/dev/null | grep -oP "${today}-\K\d{3}" | sort -n | tail -1)
next_seq=$(printf "%03d" $(( ${last_seq:-0} + 1 )))
```

Use the Write tool to save the complete plan to `docs/plans/YYYY-MM-DD-NNN-<type>-<descriptive-name>-plan.md` (where NNN is `$next_seq` from the bash command above). This step is mandatory and cannot be skipped — even when running as part of LFG/SLFG or other automated pipelines.

Confirm: "Plan written to docs/plans/[filename]"

**Pipeline mode:** If invoked from an automated workflow (LFG, SLFG, or any `disable-model-invocation` context), skip all AskUserQuestion calls. Make decisions automatically and proceed to writing the plan without interactive prompts.

## Output Format

**Filename:** Use the date, daily sequence number, and kebab-case filename from Step 2 Title & Categorization.

```
docs/plans/YYYY-MM-DD-NNN-<type>-<descriptive-name>-plan.md
```

Examples:
- `docs/plans/2026-01-15-001-feat-user-authentication-flow-plan.md`
- `docs/plans/2026-02-03-001-fix-checkout-race-condition-plan.md`
- `docs/plans/2026-03-10-002-refactor-api-client-extraction-plan.md`

## Post-Generation Options

After writing the plan file, use the **AskUserQuestion tool** to present these options:

**Question:** "Plan ready at `docs/plans/YYYY-MM-DD-NNN-<type>-<name>-plan.md`. What would you like to do next?"

**Options:**
1. **Open plan in editor** - Open the plan file for review
2. **Review and refine** - Improve the document through structured self-review
3. **Start `/workshop:work`** - Begin implementing this plan locally
4. **Create Issue** - Create issue in project tracker (GitHub/Linear)

Based on selection:
- **Open plan in editor** → Run `open docs/plans/<plan_filename>.md` to open the file in the user's default editor
- **Review and refine** → Load `document-review` skill.
- **`/workshop:work`** → Call the /workshop:work command with the plan file path
- **Create Issue** → See "Issue Creation" section below
- **Other** (automatically provided) → Accept free text for rework or specific changes

Loop back to options after refine or Other changes until user selects `/workshop:work`.

## Issue Creation

When user selects "Create Issue", follow the workflow in [issue-creation.md](./references/issue-creation.md).

NEVER CODE! Just research and write the plan. (Exception: the Phase 1.7 visual mockup is a planning artifact — generating `mockup.html` for design feedback is allowed and is not implementation.)
