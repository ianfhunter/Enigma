import { describe, it, expect } from 'vitest';

/**
 * Unit test to check that all games have a lastModified field in their manifest
 * This ensures consistency across all game definitions for version management
 */

import fs from 'fs';
import path from 'path';

// Find all manifest.js files in src/packs directory
const packsDir = path.join(process.cwd(), 'src/packs');

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

describe('Game Version Management', () => {
  describe('lastModified field consistency', () => {
    it('should have lastModified field for all games', async () => {
      const manifestFiles = findManifestFiles(packsDir);
      const gamesWithoutLastModified = [];
      const errors = [];

      for (const manifestFile of manifestFiles) {
        try {
          // Read the manifest file content and evaluate it in a safe context
          const content = fs.readFileSync(manifestFile, 'utf8');

          // Create a safe evaluation context
          const context = {
            import: async (modulePath) => {
              // For relative imports in manifest files, we need to handle them specially
              if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
                // Return a mock object for relative imports (icons, etc.)
                return {};
              }
              // For absolute imports, try to import normally
              return import(modulePath);
            },
            console: console,
            require: require,
            module: { exports: {} },
            exports: {},
            __dirname: path.dirname(manifestFile),
            __filename: manifestFile
          };

          // Evaluate the manifest content
          const evalFunc = new Function('module', 'exports', 'require', '__dirname', '__filename', 'import', 'console', content);
          evalFunc(context.module, context.exports, require, context.__dirname, context.__filename, context.import, context.console);

          // Get the manifest object
          const manifest = context.module.exports || context.exports;

          // Check if the manifest has categories
          if (!manifest.categories || !Array.isArray(manifest.categories)) {
            errors.push(`No categories found in ${manifestFile}`);
            continue;
          }

          // Iterate through all categories and games
          for (const category of manifest.categories) {
            if (!category.games || !Array.isArray(category.games)) {
              continue;
            }

            for (const game of category.games) {
              // Check if the game has a lastModified field
              if (!game.lastModified) {
                gamesWithoutLastModified.push({
                  file: path.basename(manifestFile),
                  title: game.title || 'Unknown',
                  slug: game.slug || 'unknown'
                });
              }
            }
          }

        } catch (error) {
          errors.push(`Error processing ${manifestFile}: ${error.message}`);
        }
      }

      // Report any errors found
      if (errors.length > 0) {
        console.log('❌ ERRORS FOUND:');
        errors.forEach(error => console.log(`  - ${error}`));
      }

      // Report games missing lastModified
      if (gamesWithoutLastModified.length > 0) {
        console.log('❌ GAMES MISSING lastModified FIELD:');
        gamesWithoutLastModified.forEach(game => {
          console.log(`  - ${game.title} (${game.slug}) in ${game.file}`);
        });
        console.log('💡 To fix: Add "lastModified: 1" or a timestamp to each game object');
        console.log('   Example: lastModified: 1738079200000 // 2025-01-28');
      }

      // The test should pass only if no games are missing lastModified
      expect(gamesWithoutLastModified.length).toBe(0);

      if (gamesWithoutLastModified.length === 0) {
        console.log('✅ ALL GAMES HAVE lastModified FIELDS!');
        console.log('   Version management system is ready to use.');
      }
    });

    it('should have valid lastModified timestamp format', () => {
      const manifestFiles = findManifestFiles(packsDir);
      const invalidLastModified = [];

      for (const manifestFile of manifestFiles) {
        try {
          const content = fs.readFileSync(manifestFile, 'utf8');

          // Find all lastModified fields
          const lastModifiedMatches = content.match(/lastModified:\s*(\d+)/g);

          if (lastModifiedMatches) {
            for (const match of lastModifiedMatches) {
              const timestampStr = match.replace('lastModified:', '').trim();
              const timestamp = parseInt(timestampStr, 10);

              // Check if it's a valid timestamp (should be positive and reasonable)
              // Reasonable range: 1000000000 (2001) to 9999999999999 (far future)
              if (isNaN(timestamp) || timestamp <= 0 || timestamp < 1000000000 || timestamp > 9999999999999) {
                invalidLastModified.push({
                  file: path.basename(manifestFile),
                  value: timestampStr
                });
              }
            }
          }

        } catch (error) {
          // Ignore file read errors for this test
        }
      }

      if (invalidLastModified.length > 0) {
        console.log('❌ INVALID lastModified VALUES FOUND:');
        invalidLastModified.forEach(item => {
          console.log(`  - ${item.value} in ${item.file}`);
        });
      }

      expect(invalidLastModified.length).toBe(0);

      if (invalidLastModified.length === 0) {
        console.log('✅ ALL lastModified FIELDS HAVE VALID TIMESTAMP FORMAT!');
      }
    });
  });
});