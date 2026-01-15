#!/usr/bin/env node
/**
 * Add puzzle source section to existing README files
 * Run with: node scripts/add-puzzle-sources.js
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { puzzleSources } from './puzzle-sources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pagesDir = join(__dirname, '../src/pages');

const typeLabels = {
  'generator': '🔧 Generator',
  'dataset': '📊 Dataset',
  'backend': '🌐 Backend API',
  'hybrid': '🔧 Generator + 📊 Dataset',
  'n/a': '➖ N/A'
};

const typeDescriptions = {
  'generator': 'Puzzles are algorithmically generated on-the-fly.',
  'dataset': 'Puzzles are loaded from a curated dataset.',
  'backend': 'Puzzles are fetched from the backend puzzle API.',
  'hybrid': 'Puzzles combine algorithmic generation with curated data.',
  'n/a': 'This is a sandbox/classic puzzle without generated content.'
};

let updated = 0;
let skipped = 0;

for (const [folder, info] of Object.entries(puzzleSources)) {
  const readmePath = join(pagesDir, folder, 'README.md');

  if (!existsSync(readmePath)) {
    console.warn(`⚠️  README not found: ${folder}/README.md`);
    skipped++;
    continue;
  }

  let content = readFileSync(readmePath, 'utf-8');

  // Check if already has puzzle source section
  if (content.includes('## Puzzle Source')) {
    console.log(`⏭️  Already has source: ${folder}/README.md`);
    skipped++;
    continue;
  }

  // Create the puzzle source section
  const sourceSection = `## Puzzle Source

**${typeLabels[info.type]}**

${typeDescriptions[info.type]}

**Source:** ${info.source}

`;

  // Insert before "## Tips & Strategy" or at the end before the footer
  if (content.includes('## Tips & Strategy')) {
    content = content.replace('## Tips & Strategy', sourceSection + '## Tips & Strategy');
  } else if (content.includes('---\n\n*Part of')) {
    content = content.replace('---\n\n*Part of', sourceSection + '---\n\n*Part of');
  } else {
    // Append before the end
    content = content.trimEnd() + '\n\n' + sourceSection;
  }

  writeFileSync(readmePath, content);
  console.log(`✅ Updated: ${folder}/README.md`);
  updated++;
}

console.log(`\n📝 Summary: ${updated} updated, ${skipped} skipped`);
