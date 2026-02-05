# Autonomous Development Execution Protocol

This section defines the execution protocol for autonomous development tasks.

## Quality Gates

Every task must satisfy these quality gates before being marked complete:

1. **Minimal Changes**: Code changes ONLY what was explicitly requested. No "helpful" additions or premature abstractions.

2. **Best Practices**: Code follows existing project patterns, naming conventions, and error handling.

3. **Testing**: Tests are written and passing for all new functionality.

4. **No Breaking Changes**: Existing functionality remains intact. Use grepai_trace to verify no unexpected callers affected.

## Task Delegation Requirements

When delegating to a subagent via the Task tool, you MUST include:

### 1. Quality Gates (VERBATIM)

Copy the quality gates above VERBATIM into your task prompt:

```
Quality Gates (VERBATIM from delivery plan):
1. Minimal Changes: [verbatim requirements]
2. Best Practices: [verbatim requirements]
3. Testing: [verbatim requirements]
4. No Breaking Changes: [verbatim requirements]
```

### 2. Spec Reference

Use `qmd_search` to find the relevant spec section. Include the FULL requirements, not a summary:

```
## Spec Reference

[qmd_search results or full spec section]
```

### 3. Delivery Plan Path

Always include the delivery plan path so the subagent can reference it:

```
Delivery Plan: docs/delivery-plan.md
```

## Context Tools

For best results, use these context tools in your delegations:

- **QMD** (`qmd_search`): Semantic search for specs, requirements, decisions
- **grepai**: Semantic code search and call graphs
- **CodeContext** (`GetCodeContext`): Token-optimized file selection

## Post-Task Checklist

After each Task completes, review before accepting:

- [ ] Does this change ONLY what was requested?
- [ ] Are there "helpful" additions not in the spec?
- [ ] Can any lines be removed while still satisfying requirements?
- [ ] Does code follow project patterns?
- [ ] Are ALL quality gates satisfied?
- [ ] Tests written and passing?
- [ ] No breaking changes to existing code?

Use `git diff` to see exact changes and `grepai_trace` to verify no unexpected callers were affected.

## VERBATIM Sections

When editing documentation files, sections marked with `<!-- VERBATIM: ... -->` must be preserved exactly:

- Make MINIMAL changes only
- Add new content, don't rewrite existing
- Preserve exact wording where possible
- VERBATIM sections must NOT be summarized or reworded

## Git Workflow

After verifying code quality:

1. Review changes: `git diff`
2. Stage relevant files: `git add <files>`
3. Create a commit: `git commit`

Uncommitted work may be lost. Commit before proceeding to next task.

## Delivery Plan Updates

After completing tasks, update your delivery plan:

- Mark completed tasks as `[x]`
- Update current task pointer if needed
- Note any blockers or deviations
