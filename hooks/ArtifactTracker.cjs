#!/usr/bin/env node

/**
 * Artifact Tracker Hook — Transient Script Lifecycle Management
 *
 * Tracks created scripts for wrap-up review and documentation.
 * Helps identify which scripts are transient (test helpers, one-off scripts)
 * vs. permanent (deployment scripts, build tools).
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = '.claude/transient-artifacts.json';
const SCRIPT_EXTENSIONS = ['.sh', '.ps1', '.bat', '.py', '.js', '.cjs', '.mjs'];

// Read stdin for hook input
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Only process Write tool
    if (input.tool_name === 'Write' && input.tool_input) {
      const filePath = input.tool_input.file_path;

      if (filePath) {
        const ext = path.extname(filePath).toLowerCase();

        // Track script files
        if (SCRIPT_EXTENSIONS.includes(ext)) {
          const manifest = loadManifest(MANIFEST_PATH);

          manifest[filePath] = {
            created: new Date().toISOString(),
            task: inferTaskFromContext(filePath),
            planned: false // Will be updated during wrap-up review
          };

          saveManifest(MANIFEST_PATH, manifest);

          console.error(`[ArtifactTracker] Tracked script: ${filePath}`);
        }
      }
    }

    // Pass through the input
    console.log(inputData);

  } catch (error) {
    // On error, log and pass through
    console.error('[ArtifactTracker Hook Error]:', error.message);
    console.log(inputData);
  }
});

/**
 * Load or create manifest
 * @param {string} manifestPath
 * @returns {Object}
 */
function loadManifest(manifestPath) {
  try {
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  } catch (error) {
    console.error('[ArtifactTracker] Failed to load manifest, creating new:', error.message);
  }

  return {};
}

/**
 * Save manifest to disk
 * @param {string} manifestPath
 * @param {Object} manifest
 */
function saveManifest(manifestPath, manifest) {
  try {
    const dir = path.dirname(manifestPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[ArtifactTracker] Failed to save manifest:', error.message);
  }
}

/**
 * Infer task from file path or context
 * @param {string} filePath
 * @returns {string}
 */
function inferTaskFromContext(filePath) {
  // Try to infer from path patterns like scripts/task-2.3-helper.sh
  const taskMatch = filePath.match(/(\d+\.\d+)/);
  if (taskMatch) {
    return taskMatch[1];
  }

  // Check if there's a delivery plan we could reference
  try {
    const deliveryPlanPath = 'docs/delivery-plan.md';
    if (fs.existsSync(deliveryPlanPath)) {
      const content = fs.readFileSync(deliveryPlanPath, 'utf8');
      const currentTaskMatch = content.match(/\*\*Current Task:\*\*\s*(\d+\.\d+)/);
      if (currentTaskMatch) {
        return currentTaskMatch[1];
      }
    }
  } catch (error) {
    // Ignore errors reading delivery plan
  }

  return 'unknown';
}
