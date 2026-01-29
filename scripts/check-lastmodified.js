#!/usr/bin/env node

/**
 * Script to check that all games have a lastModified field in their manifest
 * This ensures consistency across all game definitions for version management
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all manifest.js files in src/packs directory
const packsDir = path.join(__dirname, '../src/packs');

function findManifestFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item === 'manifest.js') {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function checkLastModifiedFields() {
  const manifestFiles = findManifestFiles(packsDir);
  let totalGames = 0;
  let gamesWithLastModified = 0;
  let gamesWithoutLastModified = [];
  let errors = [];

  console.log('Checking lastModified fields in all game manifests...\n');

  for (const manifestFile of manifestFiles) {
    try {
      // Read the manifest file content
      const content = fs.readFileSync(manifestFile, 'utf8');

      // Extract game objects using a more flexible regex pattern
      // Look for objects that contain title, slug, and description properties
      const gamesRegex = /{\s*title\s*:\s*['"][^'"]*['"]\s*,[\s\S]*?slug\s*:\s*['"][^'"]*['"]\s*,[\s\S]*?description\s*:\s*['"][^'"]*['"]\s*,[\s\S]*?}/g;
      const gameMatches = content.match(gamesRegex);

      if (!gameMatches) {
        errors.push(`No games found in ${manifestFile}`);
        continue;
      }

      for (const gameMatch of gameMatches) {
        totalGames++;

        // Check if lastModified field exists
        if (gameMatch.includes('lastModified:')) {
          gamesWithLastModified++;
        } else {
          // Extract game title for reporting
          const titleMatch = gameMatch.match(/title:\s*['"]([^'"]+)['"]/);
          const title = titleMatch ? titleMatch[1] : 'Unknown';

          // Extract slug for more specific identification
          const slugMatch = gameMatch.match(/slug:\s*['"]([^'"]+)['"]/);
          const slug = slugMatch ? slugMatch[1] : 'unknown';

          gamesWithoutLastModified.push({
            file: manifestFile,
            title: title,
            slug: slug
          });
        }
      }

    } catch (error) {
      errors.push(`Error processing ${manifestFile}: ${error.message}`);
    }
  }

  // Report results
  console.log('=== LASTMODIFIED FIELD CHECK RESULTS ===\n');

  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(error => console.log(`  - ${error}`));
    console.log();
  }

  console.log(`📊 SUMMARY:`);
  console.log(`  - Total games checked: ${totalGames}`);
  console.log(`  - Games with lastModified: ${gamesWithLastModified}`);
  console.log(`  - Games without lastModified: ${gamesWithoutLastModified.length}`);
  console.log();

  if (gamesWithoutLastModified.length > 0) {
    console.log('❌ GAMES MISSING lastModified FIELD:');
    gamesWithoutLastModified.forEach(game => {
      console.log(`  - ${game.title} (${game.slug}) in ${path.basename(game.file)}`);
    });
    console.log();
    console.log('💡 To fix: Add "lastModified: 1" or a timestamp to each game object');
    console.log('   Example: lastModified: 1738079200000 // 2025-01-28');
    return false;
  } else {
    console.log('✅ ALL GAMES HAVE lastModified FIELDS!');
    console.log('   Version management system is ready to use.');
    return true;
  }
}

// Run the check
const success = checkLastModifiedFields();
process.exit(success ? 0 : 1);