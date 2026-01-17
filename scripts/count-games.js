/**
 * Script to count total games across all packs
 * Used by GitHub Actions workflow to generate badge.json
 */

import { getAllGames } from '../src/packs/registry.js';
import fs from 'fs';

const allGames = getAllGames();
const count = allGames.length;

const badge = {
  schemaVersion: 1,
  label: 'games',
  message: String(count),
  color: 'blue'
};

fs.writeFileSync('badge.json', JSON.stringify(badge, null, 2) + '\n');
console.log(`Found ${count} games`);
