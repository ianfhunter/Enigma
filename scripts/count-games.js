/**
 * Script to count total games across all packs
 * Used by GitHub Actions workflow to generate badge.json
 * 
 * This script reads all pack manifest files and counts games by finding
 * all slug definitions, which works around Node.js ES module resolution
 * issues with the registry.js file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packsDir = path.join(__dirname, '../src/packs');

// List of official pack directories
const officialPacks = [
  'word-games',
  'shading-puzzles',
  'paths-regions',
  'spatial-tiles',
  'strategy-movement',
  'classic-logic',
  'sudoku-family',
  'trivia-knowledge',
  'international-words',
  'card-games',
];

// Count games in a manifest file by counting slug definitions
function countGamesInManifest(manifestPath) {
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    // Match slug: '...' or slug: "..." patterns
    const slugMatches = [...content.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
    return slugMatches.length;
  } catch (error) {
    console.warn(`Warning: Could not read ${manifestPath}:`, error.message);
    return 0;
  }
}

// Count games in all official packs
let totalCount = 0;
for (const packDir of officialPacks) {
  const manifestPath = path.join(packsDir, packDir, 'manifest.js');
  const count = countGamesInManifest(manifestPath);
  totalCount += count;
  console.log(`${packDir}: ${count} games`);
}

// Check for community packs (installedCommunityPacks.js)
const communityPacksPath = path.join(packsDir, 'installedCommunityPacks.js');
if (fs.existsSync(communityPacksPath)) {
  try {
    const content = fs.readFileSync(communityPacksPath, 'utf8');
    // Count games in community packs by looking for slug patterns
    const communitySlugMatches = [...content.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
    const communityCount = communitySlugMatches.length;
    if (communityCount > 0) {
      totalCount += communityCount;
      console.log(`community packs: ${communityCount} games`);
    }
  } catch (error) {
    console.warn('Warning: Could not read community packs:', error.message);
  }
}

const badge = {
  schemaVersion: 1,
  label: 'games',
  message: String(totalCount),
  color: 'blue'
};

fs.writeFileSync('badge.json', JSON.stringify(badge, null, 2) + '\n');
console.log(`\nTotal: ${totalCount} games`);
