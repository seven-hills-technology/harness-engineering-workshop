# Issue Creation

When creating an issue in a project tracker:

## 1. Detect Tracker

Check for `project_tracker: github` or `project_tracker: linear` in the user's CLAUDE.md (global or project). Also look for mentions of "GitHub Issues" or "Linear" in workflow sections.

## 2. Create Issue

**GitHub:**
```bash
gh issue create --title "<type>: <title>" --body-file <plan_path>
```

**Linear:**
```bash
linear issue create --title "<title>" --description "$(cat <plan_path>)"
```

## 3. No Tracker Configured

Ask: "Which project tracker do you use? (GitHub/Linear/Other)"
Suggest adding `project_tracker: github` or `project_tracker: linear` to their CLAUDE.md.

## 4. After Creation

- Display the issue URL
- Ask if they want to proceed to `/workshop:work`
