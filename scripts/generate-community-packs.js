#!/usr/bin/env node
/**
 * Generate Community Packs Registry
 *
 * This script scans the .plugins/ directory and generates a JS file
 * that imports all installed community pack manifests. This allows
 * Vite to bundle community packs dynamically.
 *
 * Usage: node scripts/generate-community-packs.js
 *
 * Run this after:
 * - Installing a new community pack
 * - Uninstalling a community pack
 * - Updating a community pack
 */

import { readdirSync, existsSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const ROOT_DIR = join(__dirname, '..');
const PLUGINS_DIR = join(ROOT_DIR, '.plugins');
const OUTPUT_FILE = join(ROOT_DIR, 'src', 'packs', 'installedCommunityPacks.js');

/**
 * Scan .plugins/ directory for installed community packs
 */
function discoverInstalledPacks() {
  if (!existsSync(PLUGINS_DIR)) {
    console.log('📦 No .plugins/ directory found, creating empty registry');
    return [];
  }

  const entries = readdirSync(PLUGINS_DIR, { withFileTypes: true });
  const packs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const packDir = join(PLUGINS_DIR, entry.name);
    const manifestJsPath = join(packDir, 'manifest.js');
    const manifestJsonPath = join(packDir, 'manifest.json');

    // Check for manifest file
    if (existsSync(manifestJsPath)) {
      packs.push({
        id: entry.name,
        path: manifestJsPath,
        relativePath: `../../.plugins/${entry.name}/manifest.js`,
        type: 'js',
      });
    } else if (existsSync(manifestJsonPath)) {
      packs.push({
        id: entry.name,
        path: manifestJsonPath,
        relativePath: `../../.plugins/${entry.name}/manifest.json`,
        type: 'json',
      });
    } else {
      console.warn(`⚠️  Pack "${entry.name}" has no manifest file, skipping`);
    }
  }

  return packs;
}

/**
 * Generate the imports file content
 */
function generateImportsFile(packs) {
  const timestamp = new Date().toISOString();

  if (packs.length === 0) {
    return `/**
 * Installed Community Packs Registry
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated: ${timestamp}
 *
 * This file is regenerated when community packs are installed/uninstalled.
 * Run: node scripts/generate-community-packs.js
 */

// No community packs installed
export const installedCommunityPacks = [];

export default installedCommunityPacks;
`;
  }

  // Generate import statements
  const imports = packs.map((pack, index) => {
    const varName = `pack${index}`;
    return `import ${varName} from '${pack.relativePath}';`;
  }).join('\n');

  // Generate array entries
  const arrayEntries = packs.map((pack, index) => {
    return `  pack${index},`;
  }).join('\n');

  return `/**
 * Installed Community Packs Registry
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated: ${timestamp}
 *
 * This file is regenerated when community packs are installed/uninstalled.
 * Run: node scripts/generate-community-packs.js
 *
 * Installed packs:
${packs.map(p => ` *   - ${p.id}`).join('\n')}
 */

${imports}

/**
 * Array of all installed community pack manifests
 */
export const installedCommunityPacks = [
${arrayEntries}
];

export default installedCommunityPacks;
`;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning for installed community packs...');

  const packs = discoverInstalledPacks();

  console.log(`📦 Found ${packs.length} installed pack(s)`);
  packs.forEach(p => console.log(`   - ${p.id}`));

  const content = generateImportsFile(packs);

  writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`✅ Generated: ${OUTPUT_FILE}`);

  return packs.length;
}

// Run
try {
  const count = main();
  process.exit(0);
} catch (error) {
  console.error('❌ Error generating community packs registry:', error);
  process.exit(1);
}
