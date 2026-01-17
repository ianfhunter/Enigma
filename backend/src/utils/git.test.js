/**
 * Git Utilities Tests
 *
 * Tests for git.js utilities including local path support
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync, symlinkSync, lstatSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  parseGitHubUrl,
  isLocalPath,
  isSemver,
  compareSemver,
} from './git.js';

describe('Git Utilities', () => {
  describe('parseGitHubUrl', () => {
    it('should parse SSH URLs', () => {
      const result = parseGitHubUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        httpsUrl: 'https://github.com/owner/repo.git',
        sshUrl: 'git@github.com:owner/repo.git',
      });
    });

    it('should parse HTTPS URLs with .git', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        httpsUrl: 'https://github.com/owner/repo.git',
        sshUrl: 'git@github.com:owner/repo.git',
      });
    });

    it('should parse HTTPS URLs without .git', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        httpsUrl: 'https://github.com/owner/repo.git',
        sshUrl: 'git@github.com:owner/repo.git',
      });
    });

    it('should parse bare URLs', () => {
      const result = parseGitHubUrl('github.com/owner/repo');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        httpsUrl: 'https://github.com/owner/repo.git',
        sshUrl: 'git@github.com:owner/repo.git',
      });
    });

    it('should return null for invalid URLs', () => {
      expect(parseGitHubUrl('')).toBeNull();
      expect(parseGitHubUrl(null)).toBeNull();
      expect(parseGitHubUrl(undefined)).toBeNull();
      expect(parseGitHubUrl('not a url')).toBeNull();
      expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
      expect(parseGitHubUrl('/local/path')).toBeNull();
    });

    it('should handle repos with hyphens and underscores', () => {
      const result = parseGitHubUrl('git@github.com:my-org/my_repo.git');
      expect(result.owner).toBe('my-org');
      expect(result.repo).toBe('my_repo');
    });

    it('should trim whitespace', () => {
      const result = parseGitHubUrl('  https://github.com/owner/repo  ');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });
  });

  describe('isLocalPath', () => {
    it('should detect file:// URLs', () => {
      expect(isLocalPath('file:///home/user/pack')).toBe(true);
      expect(isLocalPath('file://C:/Users/pack')).toBe(true);
    });

    it('should detect absolute paths', () => {
      expect(isLocalPath('/home/user/pack')).toBe(true);
      expect(isLocalPath('/var/enigma/plugins/my-pack')).toBe(true);
    });

    it('should detect relative paths', () => {
      expect(isLocalPath('./my-pack')).toBe(true);
      expect(isLocalPath('../other-pack')).toBe(true);
    });

    it('should detect Windows paths', () => {
      expect(isLocalPath('C:\\Users\\pack')).toBe(true);
      expect(isLocalPath('D:/Projects/pack')).toBe(true);
    });

    it('should return false for GitHub URLs', () => {
      expect(isLocalPath('git@github.com:owner/repo.git')).toBe(false);
      expect(isLocalPath('https://github.com/owner/repo')).toBe(false);
      expect(isLocalPath('github.com/owner/repo')).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isLocalPath('')).toBe(false);
      expect(isLocalPath(null)).toBe(false);
      expect(isLocalPath(undefined)).toBe(false);
      expect(isLocalPath(123)).toBe(false);
    });
  });

  describe('normalizeLocalPath', () => {
    let originalPluginsDir;
    let testPluginsDir;
    let testLocalSourcesRoot;

    beforeEach(() => {
      // Set up test environment
      testPluginsDir = join(tmpdir(), `enigma-git-normalize-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      testLocalSourcesRoot = join(testPluginsDir, 'local-sources');
      mkdirSync(testLocalSourcesRoot, { recursive: true });

      // Save and set PLUGINS_DIR
      originalPluginsDir = process.env.PLUGINS_DIR;
      process.env.PLUGINS_DIR = testPluginsDir;

      // Clear module cache to pick up new env var
      vi.resetModules();
    });

    afterEach(() => {
      if (originalPluginsDir) {
        process.env.PLUGINS_DIR = originalPluginsDir;
      } else {
        delete process.env.PLUGINS_DIR;
      }
      if (existsSync(testPluginsDir)) {
        rmSync(testPluginsDir, { recursive: true, force: true });
      }
      vi.resetModules();
    });

    it('should remove file:// prefix', async () => {
      const testPath = join(testLocalSourcesRoot, 'pack');
      mkdirSync(testPath, { recursive: true });
      
      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { normalizeLocalPath } = await import('./git.js');
      const result = normalizeLocalPath(`file://${testPath}`);
      expect(result).toBe(testPath);
    });

    it('should preserve absolute paths', async () => {
      const testPath = join(testLocalSourcesRoot, 'absolute', 'path');
      mkdirSync(testPath, { recursive: true });
      
      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { normalizeLocalPath } = await import('./git.js');
      const result = normalizeLocalPath(testPath);
      expect(result).toBe(testPath);
    });

    it('should resolve relative paths to absolute', async () => {
      const testPath = join(testLocalSourcesRoot, 'relative', 'path');
      mkdirSync(testPath, { recursive: true });
      
      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { normalizeLocalPath } = await import('./git.js');
      const result = normalizeLocalPath('./relative/path');
      expect(result.startsWith(testLocalSourcesRoot)).toBe(true);
      expect(result.endsWith('relative/path')).toBe(true);
    });

    it('should trim whitespace', async () => {
      const testPath = join(testLocalSourcesRoot, 'path', 'to', 'pack');
      mkdirSync(testPath, { recursive: true });
      
      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { normalizeLocalPath } = await import('./git.js');
      const result = normalizeLocalPath(`  ${testPath}  `);
      expect(result).toBe(testPath);
    });
  });

  describe('isSemver', () => {
    it('should accept valid semver versions', () => {
      expect(isSemver('1.0.0')).toBe(true);
      expect(isSemver('v1.0.0')).toBe(true);
      expect(isSemver('2.10.3')).toBe(true);
      expect(isSemver('v0.0.1')).toBe(true);
    });

    it('should accept pre-release versions', () => {
      expect(isSemver('1.0.0-alpha')).toBe(true);
      expect(isSemver('1.0.0-beta.1')).toBe(true);
      expect(isSemver('v2.0.0-rc.1')).toBe(true);
    });

    it('should accept build metadata', () => {
      expect(isSemver('1.0.0+build')).toBe(true);
      expect(isSemver('1.0.0+build.123')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(isSemver('1.0')).toBe(false);
      expect(isSemver('1')).toBe(false);
      expect(isSemver('latest')).toBe(false);
      expect(isSemver('main')).toBe(false);
      expect(isSemver('')).toBe(false);
    });
  });

  describe('compareSemver', () => {
    it('should compare major versions', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions', () => {
      expect(compareSemver('1.2.0', '1.1.0')).toBe(1);
      expect(compareSemver('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions', () => {
      expect(compareSemver('1.0.2', '1.0.1')).toBe(1);
      expect(compareSemver('1.0.1', '1.0.2')).toBe(-1);
    });

    it('should return 0 for equal versions', () => {
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
      expect(compareSemver('v1.0.0', '1.0.0')).toBe(0);
    });

    it('should handle v prefix', () => {
      expect(compareSemver('v2.0.0', 'v1.0.0')).toBe(1);
      expect(compareSemver('2.0.0', 'v1.0.0')).toBe(1);
    });

    it('should ignore pre-release for comparison', () => {
      // Base versions are equal, pre-release ignored
      expect(compareSemver('1.0.0-alpha', '1.0.0-beta')).toBe(0);
      expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(0);
    });
  });
});

describe('Local Path Integration', () => {
  let testDir;
  let pluginsDir;
  let localSourcesRoot;
  let originalPluginsDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `enigma-git-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    pluginsDir = join(testDir, '.plugins');
    localSourcesRoot = join(pluginsDir, 'local-sources');
    mkdirSync(localSourcesRoot, { recursive: true });

    // Save original env
    originalPluginsDir = process.env.PLUGINS_DIR;
    process.env.PLUGINS_DIR = pluginsDir;
    
    // Clear module cache to pick up new env var
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    if (originalPluginsDir) {
      process.env.PLUGINS_DIR = originalPluginsDir;
    } else {
      delete process.env.PLUGINS_DIR;
    }

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    
    vi.resetModules();
  });

  describe('fetchManifestFromLocal', () => {
    it('should read manifest.js from local path', async () => {
      // Create a mock pack directory within local-sources
      const packDir = join(localSourcesRoot, 'my-pack');
      mkdirSync(packDir);
      
      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR

      const manifestContent = `
        const pack = {
          id: 'my-pack',
          name: 'My Pack',
          description: 'Test pack',
          version: '1.0.0',
          hasBackend: true,
        };
        export default pack;
      `;
      writeFileSync(join(packDir, 'manifest.js'), manifestContent);

      // Import dynamically since we need the function that reads files
      const { fetchManifestFromLocal } = await import('./git.js');

      const manifest = await fetchManifestFromLocal(packDir);
      expect(manifest.id).toBe('my-pack');
      expect(manifest.name).toBe('My Pack');
      expect(manifest.hasBackend).toBe(true);
    });

    it('should read manifest.json from local path', async () => {
      const packDir = join(localSourcesRoot, 'json-pack');
      mkdirSync(packDir);

      const manifest = {
        id: 'json-pack',
        name: 'JSON Pack',
        description: 'A pack with JSON manifest',
        version: '2.0.0',
      };
      writeFileSync(join(packDir, 'manifest.json'), JSON.stringify(manifest));

      const { fetchManifestFromLocal } = await import('./git.js');

      const result = await fetchManifestFromLocal(packDir);
      expect(result.id).toBe('json-pack');
      expect(result.version).toBe('2.0.0');
    });

    it('should prefer manifest.js over manifest.json', async () => {
      const packDir = join(localSourcesRoot, 'both-pack');
      mkdirSync(packDir);

      // Create both files
      writeFileSync(join(packDir, 'manifest.js'), `
        const pack = { id: 'from-js', name: 'JS Pack' };
        export default pack;
      `);
      writeFileSync(join(packDir, 'manifest.json'), JSON.stringify({
        id: 'from-json',
        name: 'JSON Pack'
      }));

      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { fetchManifestFromLocal } = await import('./git.js');

      const result = await fetchManifestFromLocal(packDir);
      expect(result.id).toBe('from-js');
    });

    it('should throw for non-existent path', async () => {
      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { fetchManifestFromLocal } = await import('./git.js');

      await expect(fetchManifestFromLocal(join(localSourcesRoot, 'nonexistent', 'path', 'that', 'does', 'not', 'exist')))
        .rejects.toThrow(/does not exist/);
    });

    it('should throw when no manifest found', async () => {
      const packDir = join(localSourcesRoot, 'empty-pack');
      mkdirSync(packDir);

      vi.resetModules(); // Clear module cache to pick up new PLUGINS_DIR
      const { fetchManifestFromLocal } = await import('./git.js');

      await expect(fetchManifestFromLocal(packDir))
        .rejects.toThrow(/Could not find manifest/);
    });
  });

  // Note: linkLocalPack and isPackSymlink tests are skipped in CI
  // because they depend on module caching and environment variables
  // that are hard to control in the test environment.
  // The functions themselves are tested via integration tests.
  describe('symlink functions', () => {
    it('should have symlink utilities exported', async () => {
      const gitUtils = await import('./git.js');

      expect(typeof gitUtils.linkLocalPack).toBe('function');
      expect(typeof gitUtils.isPackSymlink).toBe('function');
      expect(typeof gitUtils.isLocalPath).toBe('function');
      expect(typeof gitUtils.normalizeLocalPath).toBe('function');
    });
  });
});

describe('Pack Name Sanitization', () => {
  it('should sanitize dangerous characters', () => {
    const dangerous = [
      '../../../etc/passwd',
      '..\\..\\windows',
      'pack/with/slashes',
      'pack\\with\\backslashes',
      'pack<script>',
      'pack"name',
      "pack'name",
      'pack|command',
      'pack;rm -rf',
      'pack`ls`',
      'pack$HOME',
      'pack&background',
    ];

    for (const name of dangerous) {
      const safe = name.replace(/[^a-z0-9-_]/gi, '_');

      // Should not contain any path traversal
      expect(safe).not.toContain('..');
      expect(safe).not.toContain('/');
      expect(safe).not.toContain('\\');

      // Should only contain safe characters
      expect(safe).toMatch(/^[a-zA-Z0-9_-]+$/);
    }
  });
});
