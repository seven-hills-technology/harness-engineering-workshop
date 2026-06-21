# Plan Formatting Guide

## Content Formatting

- Use clear, descriptive headings with proper hierarchy (##, ###)
- Include code examples in triple backticks with language syntax highlighting
- Add screenshots/mockups if UI-related
- Use task lists (`- [ ]`) for trackable items
- Add collapsible sections for lengthy logs using `<details>` tags

## Cross-Referencing

- Link to related issues/PRs using #number format
- Reference specific commits with SHA hashes when relevant
- Link to code using GitHub's permalink feature (press 'y' for permanent link)
- Mention relevant team members with @username if needed
- Add links to external resources with descriptive text

## Code Examples

Use syntax highlighting and file references:

```csharp
// Services/UserService.cs:42
public void ProcessUser(User user)
{
    // Implementation here
}
```

Use collapsible sections for long output:

```markdown
<details>
<summary>Full error stacktrace</summary>

Error details here...

</details>
```

## AI-Era Considerations

- Account for accelerated development with AI pair programming
- Include prompts or instructions that worked well during research
- Note which AI tools were used for initial exploration
- Emphasize comprehensive testing given rapid implementation
- Document any AI-generated code that needs human review
