#!/usr/bin/env node

/**
 * PreEdit Hook — VERBATIM Section Protection
 *
 * Warns before editing VERBATIM sections to prevent accidental
 * summarization or rewording of critical content.
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

    // Only process Edit tool
    if (input.tool_name === 'Edit' && input.tool_input) {
      const filePath = input.tool_input.file_path;

      if (filePath && fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const verbatimSections = findVerbatimSections(content);

        if (verbatimSections.length > 0) {
          console.error(`
╔═══════════════════════════════════════════════════════════════════╗
║              VERBATIM SECTION EDIT WARNING                         ║
╚═══════════════════════════════════════════════════════════════════╝

This file contains ${verbatimSections.length} VERBATIM section(s):
${verbatimSections.map(s => `  • ${s.name} (lines ${s.startLine}-${s.endLine})`).join('\n')}

Remember:
  - Make MINIMAL changes only
  - Add new content, don't rewrite existing
  - Preserve exact wording where possible
  - VERBATIM sections must NOT be summarized or reworded

If user didn't explicitly approve this edit, cancel and ask first.

`);
        }
      }
    }

    // Always allow the edit to proceed (warning only)
    console.log(JSON.stringify(input));

  } catch (error) {
    // On error, log and pass through
    console.error('[PreEdit Hook Error]:', error.message);
    console.log(inputData);
  }
});

/**
 * Find all VERBATIM sections in content
 * @param {string} content - File content
 * @returns {Array<{name: string, startLine: number, endLine: number}>}
 */
function findVerbatimSections(content) {
  const sections = [];
  const lines = content.split('\n');
  const verbatimRegex = /<!--\s*VERBATIM:\s*(.+?)\s*-->/;
  const endRegex = /<!--\s*END\s*VERBATIM\s*-->/;

  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const verbatimMatch = line.match(verbatimRegex);
    const endMatch = line.match(endRegex);

    if (verbatimMatch) {
      currentSection = {
        name: verbatimMatch[1].trim(),
        startLine: i + 1, // 1-indexed
        endLine: null
      };
    } else if (endMatch && currentSection) {
      currentSection.endLine = i + 1;
      sections.push(currentSection);
      currentSection = null;
    }
  }

  // Handle unclosed VERBATIM sections (extends to end of file)
  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }

  return sections;
}
