#!/usr/bin/env node

/**
 * Script to update version numbers in all manifest.js files with unix timestamps
 * This ensures that any changes to game packs will trigger updates for users
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current unix timestamp
const currentTimestamp = Math.floor(Date.now() / 1000).toString();

console.log(`Updating all manifest.js files with version: ${currentTimestamp}`);

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to update version in a manifest file
function updateManifestVersion(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update pack version
    const packVersionRegex = /(version:\s*['"])\d+(\.\d+)*(['"])/;
    let newContent = content.replace(packVersionRegex, `$1${currentTimestamp}$3`);
    if (newContent !== content) {
      updated = true;
      console.log(`Updated pack version in: ${filePath}`);
    }

    // Update individual game lastModified fields
    const lastModifiedRegex = /(lastModified:\s*)\d+/g;
    newContent = newContent.replace(lastModifiedRegex, `$1${currentTimestamp * 1000}`);
    if (newContent !== content) {
      updated = true;
      console.log(`Updated game lastModified fields in: ${filePath}`);
    }

    // Update individual game version fields (if they exist)
    const gameVersionRegex = /(version:\s*['"])\d+(\.\d+)*(['"])/g;
    newContent = newContent.replace(gameVersionRegex, `$1${currentTimestamp}$3`);
    if (newContent !== content) {
      updated = true;
      console.log(`Updated game version fields in: ${filePath}`);
    }

    if (updated) {
      fs.writeFileSync(filePath, newContent);
      return true;
    } else {
      console.log(`No version or lastModified fields found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

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

// Update all manifest files
const manifestFiles = findManifestFiles(packsDir);
let updatedCount = 0;

for (const manifestFile of manifestFiles) {
  if (updateManifestVersion(manifestFile)) {
    updatedCount++;
  }
}

console.log(`\nUpdated ${updatedCount} manifest files with version ${currentTimestamp}`);
