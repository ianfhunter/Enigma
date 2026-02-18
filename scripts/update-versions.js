#!/usr/bin/env node

/**
 * Script to update version numbers in all manifest.js files with unix timestamps
 * This ensures that any changes to game packs will trigger updates for users
 * Each game pack gets a timestamp based on the last modification time of files in its folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the latest modification time of all files in a directory (recursively)
 * @param {string} dir - Directory path to scan
 * @returns {number} - Unix timestamp in seconds of the most recent file modification
 */
export function getLatestModificationTime(dir) {
  let latestTime = 0;

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const fileTime = Math.floor(stat.mtimeMs / 1000);
        if (fileTime > latestTime) {
          latestTime = fileTime;
        }
      }
    }
  }

  walk(dir);
  return latestTime;
}

function resolveImportPath(manifestPath, importPath) {
  const resolvedPath = path.resolve(path.dirname(manifestPath), importPath);

  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }

  const extensionCandidates = ['.js', '.jsx', '.ts', '.tsx'];
  for (const extension of extensionCandidates) {
    if (fs.existsSync(`${resolvedPath}${extension}`)) {
      return `${resolvedPath}${extension}`;
    }
  }

  return null;
}

function getGameTimestampMs(manifestPath, importPath, currentLastModified) {
  const resolvedPath = resolveImportPath(manifestPath, importPath);

  if (!resolvedPath) {
    return currentLastModified;
  }

  const stat = fs.statSync(resolvedPath);
  const latestSeconds = stat.isDirectory()
    ? getLatestModificationTime(resolvedPath)
    : Math.floor(stat.mtimeMs / 1000);

  if (!latestSeconds) {
    return currentLastModified;
  }

  return latestSeconds * 1000;
}

// Function to update version in a manifest file
export function updateManifestVersion(filePath) {
  try {
    // Get the game pack directory (parent of manifest.js)
    const packDir = path.dirname(filePath);

    // Get the latest modification time for this game pack
    const packTimestamp = getLatestModificationTime(packDir);
    const packTimestampStr = packTimestamp.toString();

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update pack version
    const packVersionRegex = /(version:\s*['"])\d+(\.\d+)*(['"])/;
    let newContent = content.replace(packVersionRegex, `$1${packTimestampStr}$3`);
    if (newContent !== content) {
      updated = true;
      console.log(`Updated pack version to ${packTimestampStr} in: ${filePath}`);
    }

    // Update individual game lastModified fields from each game's own component path
    const gameLastModifiedRegex = /(component:\s*\(\)\s*=>\s*import\((['"])([^'"]+)\2\)[\s\S]*?lastModified:\s*)(\d+)/g;
    const withGameLastModified = newContent.replace(
      gameLastModifiedRegex,
      (match, prefix, _quote, importPath, currentValue) => {
        const nextValue = getGameTimestampMs(filePath, importPath, Number(currentValue));
        return `${prefix}${nextValue}`;
      }
    );

    if (withGameLastModified !== newContent) {
      updated = true;
      console.log(`Updated game lastModified fields in: ${filePath}`);
    }
    newContent = withGameLastModified;

    // Update individual game version fields (if they exist)
    const gameVersionRegex = /(version:\s*['"])\d+(\.\d+)*(['"])/g;
    newContent = newContent.replace(gameVersionRegex, `$1${packTimestampStr}$3`);
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

export function findManifestFiles(dir) {
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

export function run() {
  console.log(`Updating all manifest.js files with individual timestamps`);

  // Update all manifest files
  const manifestFiles = findManifestFiles(packsDir);
  let updatedCount = 0;

  for (const manifestFile of manifestFiles) {
    if (updateManifestVersion(manifestFile)) {
      updatedCount++;
    }
  }

  console.log(`\nUpdated ${updatedCount} manifest files with individual timestamps`);
}

if (process.argv[1] === __filename) {
  run();
}
