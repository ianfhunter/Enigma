import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLatestModificationTime, updateManifestVersion, findManifestFiles } from './update-versions.js';

// Mock console.log to avoid cluttering test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('update-versions script', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getLatestModificationTime', () => {
    it('should return the most recent modification time from multiple files', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      fs.writeFileSync(file1, 'content1');
      await new Promise(resolve => setTimeout(resolve, 10));
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
      await new Promise(resolve => setTimeout(resolve, 10));
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

    it('should update game lastModified using the game component file only', async () => {
      const pagesDir = path.join(tempDir, 'src', 'pages', 'GameOne');
      const packsDir = path.join(tempDir, 'src', 'packs', 'test-pack');
      fs.mkdirSync(pagesDir, { recursive: true });
      fs.mkdirSync(packsDir, { recursive: true });

      const componentPath = path.join(pagesDir, 'index.js');
      const commonPath = path.join(packsDir, 'README.md');
      const manifestPath = path.join(packsDir, 'manifest.js');

      fs.writeFileSync(componentPath, 'export default function GameOne() {}');
      const componentTimestamp = Math.floor(fs.statSync(componentPath).mtimeMs / 1000) * 1000;

      await new Promise(resolve => setTimeout(resolve, 20));
      fs.writeFileSync(commonPath, 'changed common file after game file');

      const manifestContent = `export default {
  version: "1.0.0",
  games: [
    {
      title: "Game One",
      component: () => import('../../pages/GameOne/index.js'),
      lastModified: 1111111111111
    }
  ]
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(manifestPath, 'utf8');
      expect(updatedContent).toContain(`lastModified: ${componentTimestamp}`);
    });

    it('should leave lastModified unchanged when component import cannot be resolved', () => {
      const manifestPath = path.join(tempDir, 'manifest.js');
      const manifestContent = `export default {
  version: "1.0.0",
  games: [
    {
      title: "Game One",
      component: () => import('../../pages/MissingGame'),
      lastModified: 1234567890000
    }
  ]
};`;

      fs.writeFileSync(manifestPath, manifestContent);

      const result = updateManifestVersion(manifestPath);
      expect(result).toBe(true);

      const updatedContent = fs.readFileSync(manifestPath, 'utf8');
      expect(updatedContent).toContain('lastModified: 1234567890000');
    });

    it('should use different timestamps for different pack folders', async () => {
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

      fs.writeFileSync(manifest1, manifestContent);
      await new Promise(resolve => setTimeout(resolve, 10));
      fs.writeFileSync(manifest2, manifestContent);

      updateManifestVersion(manifest1);
      updateManifestVersion(manifest2);

      const content1 = fs.readFileSync(manifest1, 'utf8');
      const content2 = fs.readFileSync(manifest2, 'utf8');

      const version1Match = content1.match(/version: "(\d+)"/);
      const version2Match = content2.match(/version: "(\d+)"/);

      expect(version1Match).toBeTruthy();
      expect(version2Match).toBeTruthy();

      const version1 = parseInt(version1Match[1]);
      const version2 = parseInt(version2Match[1]);

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
      const pack1 = path.join(tempDir, 'pack1');
      const pack2 = path.join(tempDir, 'pack2');
      const nested = path.join(tempDir, 'nested', 'pack3');

      fs.mkdirSync(pack1);
      fs.mkdirSync(pack2);
      fs.mkdirSync(nested, { recursive: true });

      fs.writeFileSync(path.join(pack1, 'manifest.js'), 'content1');
      fs.writeFileSync(path.join(pack2, 'manifest.js'), 'content2');
      fs.writeFileSync(path.join(nested, 'manifest.js'), 'content3');

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
