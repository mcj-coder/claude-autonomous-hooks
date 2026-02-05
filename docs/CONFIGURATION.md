# Configuration Guide

This guide covers configuring Claude Autonomous Hooks and optional tools.

## Settings.json

The hooks require configuration in `.claude/settings.json`.

### Full Configuration

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Task",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PreToolUse.cjs"}]
    }],
    "PostTask": [{
      "matcher": "Task",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PostTask.cjs"}]
    }],
    "PreEdit": [{
      "matcher": "Edit",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PreEdit.cjs"}]
    }],
    "PostWrite": [{
      "matcher": "Write",
      "hooks": [{"type": "command", "command": "node .claude/hooks/ArtifactTracker.cjs"}]
    }]
  }
}
```

### Merging with Existing Settings

If you already have a `settings.json` with hooks, merge the configurations:

**Before:**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit",
      "hooks": [{"type": "command", "command": "node .claude/hooks/my-hook.cjs"}]
    }]
  }
}
```

**After:**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit",
      "hooks": [{"type": "command", "command": "node .claude/hooks/my-hook.cjs"}]
    }, {
      "matcher": "Task",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PreToolUse.cjs"}]
    }],
    "PostTask": [{
      "matcher": "Task",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PostTask.cjs"}]
    }],
    "PreEdit": [{
      "matcher": "Edit",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PreEdit.cjs"}]
    }],
    "PostWrite": [{
      "matcher": "Write",
      "hooks": [{"type": "command", "command": "node .claude/hooks/ArtifactTracker.cjs"}]
    }]
  }
}
```

## Optional Tools

These tools enhance the hooks but are not required.

### QMD (Semantic Documentation Search)

QMD provides semantic search for specs, requirements, and decisions.

**Install:**
```bash
bun install -g https://github.com/tobi/qmd
```

**Usage in Task Delegations:**
```
## Spec Reference

[qmd_search query="authentication requirements"]

Copy the relevant section VERBATIM here.
```

**Why It Helps:**
- Finds exact spec sections quickly
- Prevents summarization errors
- Ensures requirements are copied verbatim

### grepai (Semantic Code Search)

grepai provides semantic code search and call graph analysis.

**Install:**
```bash
go install github.com/yoanbernabeu/grepai@latest
```

**Usage:**
```bash
# Semantic code search
grepai -q "user authentication" --json

# Call graph analysis
grepai_trace function_name
```

**Why It Helps:**
- Finds code by intent, not just keywords
- Verifies no unexpected callers affected (grepai_trace)
- Reduces context window usage

## lint-staged Configuration

If you use lint-staged, exclude `.claude/` from auto-formatting:

**.lintstagedrc.json:**
```json
{
  "*.js": ["eslint --fix", "git add"],
  "*.ts": ["eslint --fix", "git add"],
  ".claude/**/*": []
}
```

Or in package.json:
```json
{
  "lint-staged": {
    "*.js": ["eslint --fix"],
    ".claude/**/*": false
  }
}
```

## Hook Behavior

### PreToolUse.cjs

**Blocks:** Task delegation without quality gates, spec reference, or delivery plan path

**Warns:** Task delegation doesn't mention context tools (QMD, grepai, CodeContext)

**Required Format:**
```
Task description here...

Delivery Plan: docs/delivery-plan.md

Quality Gates (VERBATIM):
1. Minimal changes only
2. [etc]

## Spec Reference

[qmd_search results or full spec]
```

### PostTask.cjs

**Displays:** Brutal code review checklist

**Checks:** Uncommitted git changes, incomplete delivery plan tasks

**Timing:** After every Task completion, before accepting results

### PreEdit.cjs

**Warns:** Before editing files with VERBATIM sections

**Behavior:** Warning only, doesn't block the edit

**VERBATIM Format:**
```html
<!-- VERBATIM: Section Name -->
Content that must be preserved exactly
<!-- END VERBATIM -->
```

### ArtifactTracker.cjs

**Tracks:** Created script files (.sh, .py, .js, .cjs, .mjs, .ps1, .bat)

**Manifest:** `.claude/transient-artifacts.json`

**Timing:** After every Write tool invocation

**Usage:** Review during wrap-up to identify transient vs. permanent scripts

## State Files

The hooks create/manage these state files:

- `.claude/state/current-delivery-plan.txt` - Current delivery plan path (set by PreToolUse)
- `.claude/transient-artifacts.json` - Tracked scripts (managed by ArtifactTracker)

These should be committed to git if you want to track them across sessions, or added to `.gitignore` if you prefer session-only tracking.

## Customization

### Adjusting PreToolUse Strictness

If you find PreToolUse too strict, you can modify the blocking checks in `PreToolUse.cjs`:

**Lines 28-39:** Modify the quality gate, spec reference, and delivery plan checks

**To make it warning-only:** Change `process.exit(1)` to a `console.warn()`

### Adjusting PostTask Verbosity

If you find PostTask too verbose, you can modify the output in `PostTask.cjs`:

**Lines 26-52:** Simplify the code review checklist

**Lines 59-69:** Disable git status check

**Lines 75-169:** Disable delivery plan check

### Disabling Individual Hooks

To disable a specific hook, remove it from `settings.json`:

**Example: Disable PreEdit**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Task",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PreToolUse.cjs"}]
    }],
    "PostTask": [{
      "matcher": "Task",
      "hooks": [{"type": "command", "command": "node .claude/hooks/PostTask.cjs"}]
    }],
    "PostWrite": [{
      "matcher": "Write",
      "hooks": [{"type": "command", "command": "node .claude/hooks/ArtifactTracker.cjs"}]
    }]
    // PreEdit removed
  }
}
```

## Integration with Other Tools

### Superpowers

The hooks work seamlessly with Superpowers workflows. No special configuration needed.

### oh-my-claude

The hooks work with oh-my-claude extensions. PostTask will search `.omc/` and `.omc/plans/` for delivery plans.

### Git Hooks

The hooks don't interfere with git hooks (pre-commit, etc.). They operate at the Claude Code tool level, not the git level.

## Troubleshooting

### Hook Not Firing

1. Check settings.json syntax
2. Verify hook file is executable: `chmod +x .claude/hooks/*.cjs`
3. Check hook runs manually: `echo '{"tool_name":"Task","tool_input":{"prompt":"test"}}' | node .claude/hooks/PreToolUse.cjs`

### Strange Errors

1. Check Node.js version: `node --version` (should be 14+)
2. Check hook file permissions: `ls -la .claude/hooks/`
3. Review state files for corruption: `cat .claude/state/current-delivery-plan.txt`

### Performance Issues

The hooks are lightweight (~5-10ms per invocation). If you notice slowdowns:

1. Check disk I/O (networked drives can be slow)
2. Disable git status check in PostTask (comment out lines 55-73)
3. Disable delivery plan search in PostTask (comment out lines 75-169)
