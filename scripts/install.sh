#!/bin/bash
set -e

echo "Installing Claude Autonomous Hooks..."

# Detect project root (look for .git or package.json or similar)
find_project_root() {
  local current_dir="$PWD"
  while [ "$current_dir" != "/" ]; do
    if [ -d "$current_dir/.git" ] || [ -f "$current_dir/package.json" ] || [ -f "$current_dir/.claude/settings.json" ]; then
      echo "$current_dir"
      return 0
    fi
    current_dir="$(dirname "$current_dir")"
  done
  # Fallback to current directory
  echo "$PWD"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Find project root
PROJECT_ROOT="$(find_project_root)"

echo "Project root: $PROJECT_ROOT"
echo "Hook source: $REPO_ROOT/hooks"

# Create .claude/hooks directory
mkdir -p "$PROJECT_ROOT/.claude/hooks"

# Copy hook files
cp "$REPO_ROOT/hooks/PreToolUse.cjs" "$PROJECT_ROOT/.claude/hooks/"
cp "$REPO_ROOT/hooks/PostTask.cjs" "$PROJECT_ROOT/.claude/hooks/"
cp "$REPO_ROOT/hooks/PreEdit.cjs" "$PROJECT_ROOT/.claude/hooks/"
cp "$REPO_ROOT/hooks/ArtifactTracker.cjs" "$PROJECT_ROOT/.claude/hooks/"

# Make executable
chmod +x "$PROJECT_ROOT/.claude/hooks/"*.cjs

# Create state directory
mkdir -p "$PROJECT_ROOT/.claude/state"

# Merge into settings.json (if exists)
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
  echo ""
  echo "WARNING: You already have a .claude/settings.json"
  echo "  Please manually merge the hooks configuration from docs/CONFIGURATION.md"
  echo ""
  echo "  You'll need to add these hook configurations to your existing settings.json:"
  echo ""
  echo '  "PreToolUse": [{"matcher": "Task", "hooks": [{"type": "command", "command": "node .claude/hooks/PreToolUse.cjs"}]}]'
  echo '  "PostTask": [{"matcher": "Task", "hooks": [{"type": "command", "command": "node .claude/hooks/PostTask.cjs"}]}]'
  echo '  "PreEdit": [{"matcher": "Edit", "hooks": [{"type": "command", "command": "node .claude/hooks/PreEdit.cjs"}]}]'
  echo '  "PostWrite": [{"matcher": "Write", "hooks": [{"type": "command", "command": "node .claude/hooks/ArtifactTracker.cjs"}]}]'
else
  # Create new settings.json
  cat > "$SETTINGS_FILE" << 'EOF'
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
EOF
  echo "[OK] Created .claude/settings.json"
fi

echo ""
echo "[OK] Hooks installed!"
echo ""
echo "Installed hooks:"
echo "  - PreToolUse.cjs  - Quality gate enforcement"
echo "  - PostTask.cjs    - Code review + git + plan checks"
echo "  - PreEdit.cjs     - VERBATIM protection"
echo "  - ArtifactTracker.cjs - Script tracking"
echo ""
echo "Next steps:"
echo "1. Add templates/CLAUDE-execution-protocol.md to your CLAUDE.md"
echo "2. Create a delivery plan (see templates/delivery-plan-template.md)"
echo "3. Optional: Install QMD and grepai for enhanced context (see docs/CONFIGURATION.md)"
echo ""
echo "Documentation:"
echo "  - docs/INSTALLATION.md - Detailed installation guide"
echo "  - docs/CONFIGURATION.md - Configuration reference"
