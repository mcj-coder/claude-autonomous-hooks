#!/usr/bin/env node

/**
 * PreToolUse Hook — Quality Gate Enforcement
 *
 * Blocks Task delegation unless prompt includes quality gates, spec reference,
 * and delivery plan path. Prevents context rot from causing quality gate skipping.
 */

const fs = require('fs');
const path = require('path');

// Read stdin for hook input
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Only process Task tool
    if (input.tool_name === 'Task' && input.tool_input) {
      const prompt = input.tool_input.prompt || "";

      // BLOCKING checks
      const hasQualityGates =
        prompt.toLowerCase().includes("quality gate") ||
        prompt.toLowerCase().includes("must satisfy") ||
        prompt.includes("VERBATIM");

      const hasSpecReference =
        prompt.toLowerCase().includes("spec") ||
        prompt.includes("## Spec Reference");

      // Extract delivery plan path from prompt
      const planPathMatch = prompt.match(/Delivery\s+Plan:\s*(\S+)/i);
      const deliveryPlanPath = planPathMatch ? planPathMatch[1] : null;

      if (!hasQualityGates || !hasSpecReference || !deliveryPlanPath) {
        console.error(`
🚨 PRETOOLUSE BLOCKED: Task delegation missing required elements

Missing:
${!hasQualityGates ? "  ❌ Quality gates (copy verbatim from delivery plan)" : ""}
${!hasSpecReference ? "  ❌ Spec reference (use qmd_search to find relevant section)" : ""}
${!deliveryPlanPath ? "  ❌ Delivery plan path (add \"Delivery Plan: <path>\")" : ""}

The subagent CANNOT access your context. It only knows what you include.
Quality gates not included WILL be skipped.

Required format:
  Delivery Plan: docs/delivery-plan.md

Cancel this delegation and include these elements first.
`);
        process.exit(1); // BLOCK the delegation
      }

      // Store delivery plan path for PostTask hook
      try {
        const stateDir = '.claude/state';
        if (!fs.existsSync(stateDir)) {
          fs.mkdirSync(stateDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(stateDir, 'current-delivery-plan.txt'),
          deliveryPlanPath,
          'utf8'
        );
      } catch (error) {
        console.error('[PreToolUse Hook Warning]: Failed to store delivery plan path:', error.message);
      }

      // WARNING check (doesn't block)
      const hasContextTools =
        prompt.includes("qmd_search") ||
        prompt.includes("grepai") ||
        prompt.includes("GetCodeContext") ||
        prompt.includes("GetProjectStructure");

      if (!hasContextTools) {
        console.warn(`
⚠️  WARNING: Task delegation doesn't mention using context tools

Consider using:
  - QMD (qmd_search) for specs, requirements, decisions
  - grepai for semantic code search and call graphs
  - CodeContext (GetCodeContext) for token-optimized file selection

The subagent won't have access to these tools. Ensure it has sufficient context.
`);
      }

      // Allow with reminder
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          additionalContext: `
<execution-protocol-reminder>
✅ Quality gates, spec reference, and delivery plan detected.

Remember:
  - Quality gates should be copied VERBATIM from delivery plan
  - Spec sections should include full requirements, not summaries
  - The subagent only knows what you include in this prompt
  - Delivery plan: ${deliveryPlanPath}
</execution-protocol-reminder>
`
        }
      }));
    } else {
      // Pass through all other tools unchanged
      console.log(inputData);
    }

  } catch (error) {
    // On error, log and pass through
    console.error('[PreToolUse Hook Error]:', error.message);
    console.log(inputData);
  }
});
