#!/usr/bin/env node

/**
 * PostTask Hook — Brutal Code Review Prompt
 *
 * After Task completes, prompt for thorough code review before accepting.
 * Helps catch quality gate failures and process deviations.
 * Also checks for uncommitted changes and delivery plan updates.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Read stdin for hook input
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Only process Task tool
    if (input.tool_name === 'Task') {
      console.error(`
╔═══════════════════════════════════════════════════════════════════╗
║                  BRUTAL CODE REVIEW CHECKPOINT                      ║
╚═══════════════════════════════════════════════════════════════════╝

Before accepting this Task as complete, review the changes:

🔍 MINIMAL CHANGES CHECK:
   [ ] Does this change ONLY what was requested?
   [ ] Are there "helpful" additions not in the spec?
   [ ] Can any lines be removed while still satisfying requirements?

🔍 BEST PRACTICES CHECK:
   [ ] Does code follow project patterns?
   [ ] Are naming conventions consistent?
   [ ] Is error handling appropriate?

🔍 QUALITY GATE CHECK:
   [ ] Are ALL quality gates satisfied?
   [ ] Tests written and passing?
   [ ] No breaking changes to existing code?

Use grepai_trace to verify no unexpected callers were affected.
Use git diff to see exact changes.

If ANY check fails: Request fixes before marking complete.
`);

      // Check for uncommitted changes
      try {
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const hasUncommittedChanges = gitStatus.trim().length > 0;

        if (hasUncommittedChanges) {
          console.error(`
⚠️  WARNING: There are uncommitted changes after Task completion.

After verification passes, remember to:
  1. Review changes with: git diff
  2. Stage relevant files: git add <files>
  3. Create a commit: git commit

Uncommitted work may be lost. Commit before proceeding to next task.
`);
        }
      } catch (error) {
        // Not in a git repo or git not available - silently ignore
      }

      // Check delivery plan for incomplete task updates
      checkDeliveryPlan();
    }

    // Pass through the input
    console.log(inputData);

  } catch (error) {
    // On error, log and pass through
    console.error('[PostTask Hook Error]:', error.message);
    console.log(inputData);
  }
});

/**
 * Check if delivery plan has tasks still marked as in progress
 */
function checkDeliveryPlan() {
  const path = require('path');

  // Read the delivery plan path stored by PreToolUse hook
  const stateFile = path.join('.claude/state', 'current-delivery-plan.txt');

  try {
    if (!fs.existsSync(stateFile)) {
      // No stored path - this means PreToolUse wasn't triggered or failed
      // Fall back to searching
      searchForDeliveryPlan();
      return;
    }

    const planPath = fs.readFileSync(stateFile, 'utf8').trim();
    checkPlanFile(planPath);

  } catch (error) {
    // Can't read state file, fall back to search
    searchForDeliveryPlan();
  }
}

/**
 * Fallback: Search for delivery plan if no path was stored
 */
function searchForDeliveryPlan() {
  const os = require('os');
  const path = require('path');

  // Standard delivery plan files
  const standardPaths = [
    'docs/delivery-plan.md',
    'docs/delivery_plan.md',
    'DELIVERY_PLAN.md',
    'delivery-plan.md',
    'delivery_plan.md'
  ];

  // Directories to search for delivery plans (feature-named or random)
  const searchDirectories = [
    'docs/plans',           // Superpowers
    path.join(os.homedir(), '.claude/plans'),  // Claude Code default
    '.omc',                 // oh-my-claude
    '.omc/plans'
  ];

  // Check standard paths first
  for (const planPath of standardPaths) {
    if (checkPlanFile(planPath)) {
      return; // Found and checked, done
    }
  }

  // Search directories for plan-like .md files
  for (const dir of searchDirectories) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f,
            path: path.join(dir, f),
            mtime: fs.statSync(path.join(dir, f)).mtime
          }))
          .sort((a, b) => b.mtime - a.mtime); // Most recent first

        for (const file of files) {
          if (checkPlanFile(file.path)) {
            return; // Found and checked, done
          }
        }
      }
    } catch (error) {
      // Can't read directory, continue to next
    }
  }
}

/**
 * Check a single plan file for in-progress tasks
 * @param {string} planPath - Path to the delivery plan
 * @returns {boolean} - True if file exists and was checked
 */
function checkPlanFile(planPath) {
  try {
    if (!fs.existsSync(planPath)) {
      return false;
    }

    const content = fs.readFileSync(planPath, 'utf8');
    const hasInProgressTasks = content.includes('- [ ]') || content.includes('- [~]');

    if (hasInProgressTasks) {
      console.error(`
⚠️  DELIVERY PLAN REMINDER:
   You have incomplete tasks in your delivery plan (${planPath}).

   After verifying code quality, update the delivery plan:
   - Mark completed tasks as [x]
   - Update current task pointer if needed
   - Note any blockers or deviations
`);
    }

    return true;
  } catch (error) {
    return false;
  }
}
