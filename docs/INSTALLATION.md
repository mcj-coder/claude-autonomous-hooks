# Installation Guide

This guide covers installing Claude Autonomous Hooks in your project.

## Prerequisites

- Node.js installed (hooks run as Node scripts)
- A project where you want to use autonomous development with Claude Code

## Method 1: Clone and Run Install Script (Recommended)

This is the easiest method for most users.

### 1. Clone the Repository

```bash
# From your project directory
cd /path/to/your/project

# Clone the hooks repository
git clone https://github.com/mcj-coder/claude-autonomous-hooks.git

# Navigate into the cloned directory
cd claude-autonomous-hooks
```

### 2. Run the Install Script

```bash
./scripts/install.sh
```

The install script will:
- Copy all 4 hook files to `.claude/hooks/`
- Set executable permissions on hooks
- Create `.claude/state/` directory
- Create or merge `.claude/settings.json`

### 3. Clean Up (Optional)

After installation, you can remove the cloned repository:

```bash
cd ..
rm -rf claude-autonomous-hooks
```

## Method 2: Manual Installation

If you prefer manual installation or want to integrate into an existing setup:

### 1. Download Hooks

```bash
# Create hooks directory
mkdir -p .claude/hooks

# Download each hook
curl -O https://raw.githubusercontent.com/mcj-coder/claude-autonomous-hooks/main/hooks/PreToolUse.cjs
curl -O https://raw.githubusercontent.com/mcj-coder/claude-autonomous-hooks/main/hooks/PostTask.cjs
curl -O https://raw.githubusercontent.com/mcj-coder/claude-autonomous-hooks/main/hooks/PreEdit.cjs
curl -O https://raw.githubusercontent.com/mcj-coder/claude-autonomous-hooks/main/hooks/ArtifactTracker.cjs

# Move to hooks directory
mv *.cjs .claude/hooks/

# Make executable
chmod +x .claude/hooks/*.cjs
```

### 2. Create State Directory

```bash
mkdir -p .claude/state
```

### 3. Configure Settings

Create or update `.claude/settings.json`:

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

**Note:** If you already have a `settings.json` with hooks, you'll need to merge these configurations manually.

## Verification

After installation, verify everything is working:

### 1. Check Hook Files

```bash
ls -la .claude/hooks/
```

You should see:
- `PreToolUse.cjs`
- `PostTask.cjs`
- `PreEdit.cjs`
- `ArtifactTracker.cjs`

### 2. Check Settings

```bash
cat .claude/settings.json
```

Verify all 4 hooks are configured.

### 3. Test with a Task

Try delegating a task to Claude Code:

```
Create a simple hello world script in Python.

Delivery Plan: docs/delivery-plan.md

Quality Gates (from delivery plan):
1. Minimal changes only
2. Follow Python best practices
```

You should see the hooks in action:
- **PreToolUse** will verify you included quality gates, spec, and delivery plan
- **PostTask** will prompt for code review
- **ArtifactTracker** will track the created script

## Next Steps

1. **Add Execution Protocol to CLAUDE.md**

   Copy `templates/CLAUDE-execution-protocol.md` into your project's `CLAUDE.md` file.

2. **Create a Delivery Plan**

   Use `templates/delivery-plan-template.md` as a starting point.

3. **Optional: Install Enhanced Context Tools**

   See [CONFIGURATION.md](CONFIGURATION.md) for QMD and grepai setup.

## Troubleshooting

### Hooks Not Running

- Verify Node.js is installed: `node --version`
- Check hook permissions: `ls -la .claude/hooks/` (should show `x` for executable)
- Check settings.json syntax: `cat .claude/settings.json | jq` (if jq is installed)

### PreToolUse Blocking Valid Delegations

The PreToolUse hook requires:
1. Quality gates mentioned in prompt
2. Spec reference (use `qmd_search` if you have QMD installed)
3. Delivery plan path explicitly stated

Make sure all three are present in your Task delegation.

### Settings.json Merge Issues

If you already have hooks configured, you'll need to manually merge. See [CONFIGURATION.md](CONFIGURATION.md) for details.

## Upgrading

To upgrade to a newer version:

```bash
# Clone the latest version
git clone https://github.com/mcj-coder/claude-autonomous-hooks.git
cd claude-autonomous-hooks

# Run install (will overwrite existing hooks)
./scripts/install.sh
```

Your settings.json will be preserved (you'll be prompted to merge if needed).
