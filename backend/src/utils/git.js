/**
 * Git Utilities for Community Pack Management
 *
 * Handles:
 * - Git URL parsing (SSH and HTTPS formats)
 * - Local path sources for development
 * - Fetching manifests from GitHub without full clone
 * - Getting semantic version tags
 * - Cloning specific tags
 * - Checking for updates
 */

import { execFile as execFileCallback } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, rmSync, readFileSync, symlinkSync, lstatSync } from 'fs';
import { join, dirname, resolve, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

const execFile = promisify(execFileCallback);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Plugins directory - where community packs are cloned
const PLUGINS_DIR = process.env.PLUGINS_DIR || join(__dirname, '../../../.plugins');

/**
 * Parse a GitHub URL (SSH or HTTPS) and extract owner/repo
 *
 * Supports:
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 *
 * @param {string} url - GitHub repository URL
 * @returns {{ owner: string, repo: string, httpsUrl: string, sshUrl: string } | null}
 */
export function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Normalize the URL
  let normalized = url.trim();

  // Basic sanitization to prevent passing git options like --upload-pack as the "URL"
  // Reject any value that:
  // - starts with a dash (could be interpreted as an option)
  // - contains newline or null bytes
  // - contains the string "--upload-pack" (classic git injection vector)
  if (
    normalized.startsWith('-') ||
    normalized.includes('\n') ||
    normalized.includes('\r') ||
    normalized.includes('\0') ||
    normalized.includes('--upload-pack')
  ) {
    return null;
  }

  // SSH format: git@github.com:owner/repo.git
  const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/([^/]+?)(\.git)?$/);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return {
      owner,
      repo: repo.replace(/\.git$/, ''),
      httpsUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`,
      sshUrl: `git@github.com:${owner}/${repo.replace(/\.git$/, '')}.git`,
    };
  }

  // HTTPS format: https://github.com/owner/repo.git or https://github.com/owner/repo
  const httpsMatch = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return {
      owner,
      repo: repo.replace(/\.git$/, ''),
      httpsUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`,
      sshUrl: `git@github.com:${owner}/${repo.replace(/\.git$/, '')}.git`,
    };
  }

  // Bare format: github.com/owner/repo
  const bareMatch = normalized.match(/^github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
  if (bareMatch) {
    const [, owner, repo] = bareMatch;
    return {
      owner,
      repo: repo.replace(/\.git$/, ''),
      httpsUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`,
      sshUrl: `git@github.com:${owner}/${repo.replace(/\.git$/, '')}.git`,
    };
  }

  return null;
}

/**
 * Check if a URL/path is a local file path (for development)
 *
 * Supports:
 * - file:///path/to/pack
 * - /absolute/path
 * - ./relative/path
 * - ../parent/path
 * - C:\Windows\path (Windows)
 *
 * @param {string} url - URL or path to check
 * @returns {boolean}
 */
export function isLocalPath(url) {
  if (!url || typeof url !== 'string') return false;

  const normalized = url.trim();

  return (
    normalized.startsWith('file://') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../') ||
    /^[a-zA-Z]:[\\/]/.test(normalized) // Windows absolute path
  );
}

/**
 * Normalize a local path (remove file:// prefix, resolve relative paths)
 *
 * @param {string} url - URL or path
 * @returns {string} Normalized absolute path
 */
export function normalizeLocalPath(url) {
  let normalized = url.trim();

  // Remove file:// prefix
  if (normalized.startsWith('file://')) {
    normalized = normalized.slice(7);
  }

  // Resolve to absolute path
  if (!isAbsolute(normalized)) {
    normalized = resolve(process.cwd(), normalized);
  }

  return normalized;
}

/**
 * Fetch manifest from a local path
 *
 * @param {string} localPath - Path to pack directory
 * @returns {Promise<Object>} Parsed manifest object
 */
export async function fetchManifestFromLocal(localPath) {
  const packDir = normalizeLocalPath(localPath);

  if (!existsSync(packDir)) {
    throw new Error(`Local path does not exist: ${packDir}`);
  }

  // Try manifest.js first, then manifest.json
  const manifestJsPath = join(packDir, 'manifest.js');
  const manifestJsonPath = join(packDir, 'manifest.json');

  if (existsSync(manifestJsPath)) {
    const content = readFileSync(manifestJsPath, 'utf8');
    return parseManifestJs(content);
  }

  if (existsSync(manifestJsonPath)) {
    const content = readFileSync(manifestJsonPath, 'utf8');
    return JSON.parse(content);
  }

  throw new Error('Could not find manifest.js or manifest.json in local path');
}

/**
 * Link a local pack for development (creates symlink)
 *
 * @param {string} localPath - Path to local pack directory
 * @param {string} packId - Pack ID (used as directory name)
 * @returns {Promise<string>} Path to the linked directory
 */
export async function linkLocalPack(localPath, packId) {
  const sourcePath = normalizeLocalPath(localPath);

  if (!existsSync(sourcePath)) {
    throw new Error(`Local path does not exist: ${sourcePath}`);
  }

  // Ensure plugins directory exists
  mkdirSync(PLUGINS_DIR, { recursive: true });

  const packDir = join(PLUGINS_DIR, packId);

  // Remove existing directory/symlink if present
  if (existsSync(packDir)) {
    rmSync(packDir, { recursive: true, force: true });
  }

  // Create symlink
  try {
    symlinkSync(sourcePath, packDir, 'dir');
    console.log(`🔗 Linked local pack: ${packId} -> ${sourcePath}`);
    return packDir;
  } catch (error) {
    throw new Error(`Failed to create symlink: ${error.message}`);
  }
}

/**
 * Check if a pack directory is a symlink (local development)
 *
 * @param {string} packId - Pack ID
 * @returns {boolean}
 */
export function isPackSymlink(packId) {
  const packDir = join(PLUGINS_DIR, packId);

  if (!existsSync(packDir)) {
    return false;
  }

  try {
    return lstatSync(packDir).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid semver version
 * @param {string} version - Version string (with or without 'v' prefix)
 * @returns {boolean}
 */
export function isSemver(version) {
  // Remove leading 'v' if present
  const clean = version.replace(/^v/, '');
  // Match semver pattern: major.minor.patch with optional pre-release/build
  return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(clean);
}

/**
 * Compare two semver versions
 * @param {string} a - First version
 * @param {string} b - Second version
 * @returns {number} - -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareSemver(a, b) {
  const cleanA = a.replace(/^v/, '').split('-')[0]; // Remove 'v' prefix and pre-release
  const cleanB = b.replace(/^v/, '').split('-')[0];

  const partsA = cleanA.split('.').map(Number);
  const partsB = cleanB.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (partsA[i] > partsB[i]) return 1;
    if (partsA[i] < partsB[i]) return -1;
  }
  return 0;
}

/**
 * Fetch the manifest from a GitHub repository without cloning
 * Uses GitHub's raw content URL
 *
 * @param {string} url - GitHub repository URL
 * @param {string} [ref='main'] - Branch or tag to fetch from
 * @returns {Promise<Object>} - Parsed manifest object
 */
export async function fetchManifestFromGitHub(url, ref = 'main') {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL format');
  }

  const { owner, repo } = parsed;

  // Try manifest.js first, then manifest.json
  const manifestFiles = ['manifest.js', 'manifest.json'];
  const branches = ref ? [ref] : ['main', 'master'];

  for (const branch of branches) {
    for (const file of manifestFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;

      try {
        const response = await fetch(rawUrl);
        if (response.ok) {
          const text = await response.text();

          if (file.endsWith('.json')) {
            return JSON.parse(text);
          } else {
            // For .js files, we need to extract the object
            // This is a simplified parser for the manifest format
            return parseManifestJs(text);
          }
        }
      } catch (e) {
        // Try next file/branch
        continue;
      }
    }
  }

  throw new Error('Could not find manifest.js or manifest.json in repository');
}

/**
 * Parse a manifest.js file and extract the manifest object
 * This handles the common export patterns:
 * - export default { ... }
 * - const manifest = { ... }; export default manifest;
 * - module.exports = { ... }
 *
 * @param {string} jsContent - Content of the manifest.js file
 * @returns {Object} - Extracted manifest data (partial - only metadata)
 */
function parseManifestJs(jsContent) {
  // Extract key metadata using regex patterns
  // This is a safe approach that doesn't execute the JS
  const extractField = (field) => {
    // Match patterns like: field: 'value' or field: "value"
    const stringMatch = jsContent.match(new RegExp(`${field}:\\s*['"\`]([^'"\`]+)['"\`]`));
    if (stringMatch) return stringMatch[1];

    // Match patterns like: field: true/false
    const boolMatch = jsContent.match(new RegExp(`${field}:\\s*(true|false)`));
    if (boolMatch) return boolMatch[1] === 'true';

    return null;
  };

  return {
    id: extractField('id'),
    name: extractField('name'),
    description: extractField('description'),
    icon: extractField('icon'),
    color: extractField('color'),
    version: extractField('version'),
    author: extractField('author'),
    type: extractField('type') || 'community',
    hasBackend: extractField('hasBackend') || false,
  };
}

/**
 * Get all semver tags from a GitHub repository
 * Uses git ls-remote to avoid GitHub API rate limits and bot detection
 *
 * @param {string} url - GitHub repository URL
 * @returns {Promise<string[]>} - Array of semver tags, sorted descending
 */
export async function getSemverTags(url) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL format');
  }

  try {
    // Use git ls-remote to get tags without cloning
    // This avoids GitHub API rate limits and bot detection
    const { stdout } = await execFile('git', ['ls-remote', '--tags', parsed.httpsUrl], {
      timeout: 30000,
    });

    // Parse output: each line is "sha\trefs/tags/tagname" or "sha\trefs/tags/tagname^{}"
    const tags = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Extract tag name from refs/tags/tagname or refs/tags/tagname^{}
        const match = line.match(/refs\/tags\/([^\^]+)/);
        return match ? match[1] : null;
      })
      .filter((tag, index, arr) => {
        // Remove duplicates (tags appear twice: once for the tag, once for the commit it points to)
        return tag && arr.indexOf(tag) === index && isSemver(tag);
      })
      .sort((a, b) => compareSemver(b, a)); // Descending order

    return tags;
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Could not read')) {
      throw new Error('Repository not found or is private');
    }
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }
}

/**
 * Get the latest semver tag from a GitHub repository
 *
 * @param {string} url - GitHub repository URL
 * @returns {Promise<string | null>} - Latest semver tag or null if none
 */
export async function getLatestSemverTag(url) {
  const tags = await getSemverTags(url);
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Clone a repository at a specific tag into the plugins directory
 *
 * @param {string} url - GitHub repository URL
 * @param {string} tag - Tag to clone
 * @param {string} packId - Pack ID (used as directory name)
 * @returns {Promise<string>} - Path to the cloned directory
 */
export async function clonePackAtTag(url, tag, packId) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL format');
  }

  // Ensure plugins directory exists
  mkdirSync(PLUGINS_DIR, { recursive: true });

  const packDir = join(PLUGINS_DIR, packId);

  // Remove existing directory if present
  if (existsSync(packDir)) {
    rmSync(packDir, { recursive: true, force: true });
  }

  // Clone with depth 1 for efficiency
  // Use HTTPS URL for reliability (SSH requires key setup)
  const cloneCmd = `git clone --depth 1 --branch "${tag}" "${parsed.httpsUrl}" "${packDir}"`;

  try {
    await exec(cloneCmd, { timeout: 60000 }); // 60 second timeout
    console.log(`✅ Cloned ${packId} at tag ${tag}`);
    return packDir;
  } catch (error) {
    // Clean up on failure
    if (existsSync(packDir)) {
      rmSync(packDir, { recursive: true, force: true });
    }
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

/**
 * Update an existing pack to a new tag
 * This does a fresh clone rather than git pull to ensure clean state
 *
 * @param {string} url - GitHub repository URL
 * @param {string} newTag - New tag to update to
 * @param {string} packId - Pack ID
 * @returns {Promise<string>} - Path to the updated directory
 */
export async function updatePackToTag(url, newTag, packId) {
  // For simplicity and safety, just do a fresh clone
  return clonePackAtTag(url, newTag, packId);
}

/**
 * Remove a cloned pack from the plugins directory
 *
 * @param {string} packId - Pack ID
 * @returns {boolean} - True if removed, false if didn't exist
 */
export function removePack(packId) {
  const packDir = join(PLUGINS_DIR, packId);

  if (existsSync(packDir)) {
    rmSync(packDir, { recursive: true, force: true });
    console.log(`🗑️ Removed pack: ${packId}`);
    return true;
  }

  return false;
}

/**
 * Check if a pack is installed (has a directory in plugins)
 *
 * @param {string} packId - Pack ID
 * @returns {boolean}
 */
export function isPackCloned(packId) {
  const packDir = join(PLUGINS_DIR, packId);
  return existsSync(packDir);
}

/**
 * Get the plugins directory path
 * @returns {string}
 */
export function getPluginsDir() {
  return PLUGINS_DIR;
}

/**
 * Validate that git is available on the system
 * @returns {Promise<boolean>}
 */
export async function isGitAvailable() {
  try {
    await exec('git --version');
    return true;
  } catch {
    return false;
  }
}

export default {
  parseGitHubUrl,
  isLocalPath,
  normalizeLocalPath,
  fetchManifestFromLocal,
  linkLocalPack,
  isPackSymlink,
  isSemver,
  compareSemver,
  fetchManifestFromGitHub,
  getSemverTags,
  getLatestSemverTag,
  clonePackAtTag,
  updatePackToTag,
  removePack,
  isPackCloned,
  getPluginsDir,
  isGitAvailable,
};
