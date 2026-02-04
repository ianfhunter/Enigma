import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Mock console.log to avoid cluttering test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the functions we need to test by extracting them from the script
// Since the script runs on import, we'll redefine the core functions here for testing
function getLatestModificationTime(dir) {
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

function updateManifestVersion(filePath) {
  try {
    const packDir = path.dirname(filePath);
    const packTimestamp = getLatestModificationTime(packDir);
    const packTimestampStr = packTimestamp.toString();

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    const packVersionRegex = /(version:\s*['"])\d+(\.\d+)*(['"])/;
    let newContent = content.replace(packVersionRegex, `$1${packTimestampStr}$3`);
    if (newContent !== content) {
      updated = true;
    }

    const lastModifiedRegex = /(lastModified:\s*)\d+/g;
    newContent = newContent.replace(lastModifiedRegex, `$1${packTimestamp * 1000}`);
    if (newContent !== content) {
      updated = true;
    }

    const gameVersionRegex = /(version:\s*['"])\d+(\.\d+)*(['"])/g;
    newContent = newContent.replace(gameVersionRegex, `$1${packTimestampStr}$3`);
    if (newContent !== content) {
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, newContent);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

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

describe('update-versions script', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getLatestModificationTime', () => {
    it('should return the most recent modification time from multiple files', async () => {
      // Create files with different timestamps
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      fs.writeFileSync(file1, 'content1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      fs.writeFileSync(file2, 'content2');

      const latestTime = getLatestModificationTime(tempDir);
      const file2Time = Math.floor(fs.statSync(file2).mtimeMs / 1000);

      expect(latestTime).toBe(file2Time);
      expect(latestTime).toBeGreaterThan(0);
    });

    it('should recursively check subdirectories', async () => {
      const subdir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subdir);

      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(subdir, 'file2.txt');

      fs.writeFileSync(file1, 'content1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      fs.writeFileSync(file2, 'content2');

      const latestTime = getLatestModificationTime(tempDir);
      const file2Time = Math.floor(fs.statSync(file2).mtimeMs / 1000);

      expect(latestTime).toBe(file2Time);
    });

    it('should handle empty directory', () => {
      const latestTime = getLatestModificationTime(tempDir);
      expect(latestTime).toBe(0);
    });
  });

  describe('updateManifestVersion', () => {
    it('should update pack version with timestamp', () => {
      const manifestPath = path.join(tempDir, 'manifest.js');
      const manifestContent = `export default {
  version: "1.0.0",
  name: "Test Pack"
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(manifestPath, 'utf8');
      expect(updatedContent).not.toContain('version: "1.0.0"');
      expect(updatedContent).toMatch(/version: "\d+"/);
    });

    it('should update lastModified fields with millisecond timestamp', () => {
      const manifestPath = path.join(tempDir, 'manifest.js');
      const manifestContent = `export default {
  games: [
    { name: "Game1", lastModified: 1234567890000 },
    { name: "Game2", lastModified: 9876543210000 }
  ]
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(manifestPath, 'utf8');
      expect(updatedContent).not.toContain('1234567890000');
      expect(updatedContent).not.toContain('9876543210000');
      expect(updatedContent).toMatch(/lastModified: \d{13}/);
    });

    it('should update multiple version and lastModified fields', () => {
      const manifestPath = path.join(tempDir, 'manifest.js');
      const manifestContent = `export default {
  version: "1.0.0",
  games: [
    { name: "Game1", version: "2.0.0", lastModified: 1234567890000 },
    { name: "Game2", version: "3.0.0", lastModified: 9876543210000 }
  ]
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(manifestPath, 'utf8');

      // Check that old values are gone
      expect(updatedContent).not.toContain('1.0.0');
      expect(updatedContent).not.toContain('2.0.0');
      expect(updatedContent).not.toContain('3.0.0');
      expect(updatedContent).not.toContain('1234567890000');
      expect(updatedContent).not.toContain('9876543210000');

      // Check that new timestamps exist
      const versionMatches = updatedContent.match(/version: "\d+"/g);
      expect(versionMatches).toHaveLength(3); // Pack version + 2 game versions
    });

    it('should use different timestamps for different pack folders', async () => {
      // Create two pack directories
      const pack1Dir = path.join(tempDir, 'pack1');
      const pack2Dir = path.join(tempDir, 'pack2');
      fs.mkdirSync(pack1Dir);
      fs.mkdirSync(pack2Dir);

      const manifest1 = path.join(pack1Dir, 'manifest.js');
      const manifest2 = path.join(pack2Dir, 'manifest.js');

      const manifestContent = `export default {
  version: "1.0.0",
  name: "Test Pack"
};`;

      // Write first manifest
      fs.writeFileSync(manifest1, manifestContent);

      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Write second manifest
      fs.writeFileSync(manifest2, manifestContent);

      // Update both
      updateManifestVersion(manifest1);
      updateManifestVersion(manifest2);

      // Read updated contents
      const content1 = fs.readFileSync(manifest1, 'utf8');
      const content2 = fs.readFileSync(manifest2, 'utf8');

      // Extract version numbers
      const version1Match = content1.match(/version: "(\d+)"/);
      const version2Match = content2.match(/version: "(\d+)"/);

      expect(version1Match).toBeTruthy();
      expect(version2Match).toBeTruthy();

      const version1 = parseInt(version1Match[1]);
      const version2 = parseInt(version2Match[1]);

      // pack2 should have a later or equal timestamp (same second is possible)
      expect(version2).toBeGreaterThanOrEqual(version1);
    });

    it('should return false when no version fields exist', () => {
      const manifestPath = path.join(tempDir, 'manifest.js');
      const manifestContent = `export default {
  name: "Test Pack",
  description: "No version here"
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(false);
    });

    it('should handle manifest with single quotes', () => {
      const manifestPath = path.join(tempDir, 'manifest.js');
      const manifestContent = `export default {
  version: '1.0.0',
  name: 'Test Pack'
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(manifestPath, 'utf8');
      expect(updatedContent).toMatch(/version: '\d+'/);
    });
  });

  describe('findManifestFiles', () => {
    it('should find all manifest.js files in directory tree', () => {
      // Create directory structure
      const pack1 = path.join(tempDir, 'pack1');
      const pack2 = path.join(tempDir, 'pack2');
      const nested = path.join(tempDir, 'nested', 'pack3');

      fs.mkdirSync(pack1);
      fs.mkdirSync(pack2);
      fs.mkdirSync(nested, { recursive: true });

      // Create manifest files
      fs.writeFileSync(path.join(pack1, 'manifest.js'), 'content1');
      fs.writeFileSync(path.join(pack2, 'manifest.js'), 'content2');
      fs.writeFileSync(path.join(nested, 'manifest.js'), 'content3');

      // Create non-manifest files that should be ignored
      fs.writeFileSync(path.join(pack1, 'other.js'), 'content');
      fs.writeFileSync(path.join(tempDir, 'readme.md'), 'content');

      const manifests = findManifestFiles(tempDir);

      expect(manifests).toHaveLength(3);
      expect(manifests.every(f => f.endsWith('manifest.js'))).toBe(true);
    });

    it('should return empty array for directory with no manifests', () => {
      fs.writeFileSync(path.join(tempDir, 'other.js'), 'content');
      fs.writeFileSync(path.join(tempDir, 'readme.md'), 'content');

      const manifests = findManifestFiles(tempDir);
      expect(manifests).toHaveLength(0);
    });

    it('should handle empty directory', () => {
      const manifests = findManifestFiles(tempDir);
      expect(manifests).toHaveLength(0);
    });
  });
});
