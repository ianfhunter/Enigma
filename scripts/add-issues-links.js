#!/usr/bin/env node
/**
 * Add GitHub Issues links section to existing README files
 * Run with: node scripts/add-issues-links.js
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pagesDir = join(__dirname, '../src/pages');

const REPO_URL = 'https://github.com/ianfhunter/Enigma';

// Get all game folders
const gameFolders = readdirSync(pagesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .filter(d => !['Home', 'Profile', 'Search', 'NotFound'].includes(d.name))
  .map(d => d.name);

let updated = 0;
let skipped = 0;

for (const folder of gameFolders) {
  const readmePath = join(pagesDir, folder, 'README.md');

  if (!existsSync(readmePath)) {
    skipped++;
    continue;
  }

  let content = readFileSync(readmePath, 'utf-8');

  // Check if already has issues section
  if (content.includes('## Issues & Bugs')) {
    console.log(`⏭️  Already has issues section: ${folder}/README.md`);
    skipped++;
    continue;
  }

  // URL-encode the game name for search
  const encodedName = encodeURIComponent(folder);

  // Create the issues section
  const issuesSection = `## Issues & Bugs

🔍 [Search existing issues for "${folder}"](${REPO_URL}/issues?q=is%3Aissue+${encodedName})

📝 [Report a new bug](${REPO_URL}/issues/new?labels=bug&title=%5B${encodedName}%5D+)

`;

  // Insert before the footer (--- line)
  if (content.includes('\n---\n')) {
    content = content.replace('\n---\n', '\n' + issuesSection + '---\n');
  } else {
    // Append at the end
    content = content.trimEnd() + '\n\n' + issuesSection;
  }

  writeFileSync(readmePath, content);
  console.log(`✅ Updated: ${folder}/README.md`);
  updated++;
}

console.log(`\n📝 Summary: ${updated} updated, ${skipped} skipped`);
