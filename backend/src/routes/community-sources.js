/**
 * Community Sources API Routes
 *
 * Manages GitHub repository sources for community packs.
 * Users can add repository URLs, and the system will:
 * - Fetch manifest metadata without full clone
 * - Check for available semver tags
 * - Clone/update packs at specific versions
 */

import { Router } from 'express';
import db from '../db.js';
import { reloadPackPlugins, deletePluginData } from '../plugins/loader.js';
import {
  parseGitHubUrl,
  isLocalPath,
  normalizeLocalPath,
  fetchManifestFromLocal,
  linkLocalPack,
  isPackSymlink,
  fetchManifestFromGitHub,
  getLatestSemverTag,
  getSemverTags,
  clonePackAtTag,
  updatePackToTag,
  removePack,
  isPackCloned,
  isGitAvailable,
  compareSemver,
  getPluginsDir,
} from '../utils/git.js';
import { existsSync, readFileSync, lstatSync } from 'fs';
import { join } from 'path';

const router = Router();

/**
 * Check if git is available (useful for diagnostics)
 */
router.get('/git-status', async (req, res) => {
  const available = await isGitAvailable();
  res.json({
    gitAvailable: available,
    message: available
      ? 'Git is available for cloning community packs'
      : 'Git is not available. Install git to enable community pack installation.',
  });
});

/**
 * List all community sources
 */
router.get('/', (req, res) => {
  const sources = db.prepare(`
    SELECT
      cs.*,
      ip.pack_id IS NOT NULL as is_installed,
      ip.installed_version,
      ip.available_version
    FROM community_sources cs
    LEFT JOIN installed_packs ip ON ip.source_id = cs.id
    ORDER BY cs.added_at DESC
  `).all();

  res.json({ sources });
});

/**
 * Get manifest data for all installed community packs
 * This endpoint returns the full manifest (including games) for frontend use
 * NOTE: This route MUST be before /:id to avoid being matched as an ID
 */
router.get('/installed-manifests', (req, res) => {
  try {
    // Get all installed community packs
    const installedPacks = db.prepare(`
      SELECT cs.*, ip.installed_version
      FROM community_sources cs
      INNER JOIN installed_packs ip ON ip.source_id = cs.id
    `).all();

    const pluginsDir = getPluginsDir();
    const manifests = [];

    for (const pack of installedPacks) {
      const packDir = join(pluginsDir, pack.pack_id);

      // Try to read manifest.js or manifest.json
      let manifest = null;
      const manifestJsPath = join(packDir, 'manifest.js');
      const manifestJsonPath = join(packDir, 'manifest.json');

      if (existsSync(manifestJsPath)) {
        try {
          // Read manifest.js and extract the object
          // Since it's an ES module export, we need to parse it carefully
          const content = readFileSync(manifestJsPath, 'utf8');
          manifest = parseManifestJs(content, pack);
        } catch (e) {
          console.warn(`Failed to parse manifest.js for ${pack.pack_id}:`, e.message);
        }
      } else if (existsSync(manifestJsonPath)) {
        try {
          manifest = JSON.parse(readFileSync(manifestJsonPath, 'utf8'));
        } catch (e) {
          console.warn(`Failed to parse manifest.json for ${pack.pack_id}:`, e.message);
        }
      }

      if (manifest) {
        // Enhance manifest with installation info
        manifests.push({
          ...manifest,
          id: manifest.id || pack.pack_id,
          installedVersion: pack.installed_version,
          sourceId: pack.id,
          sourceUrl: pack.url,
          // Mark as community type for frontend handling
          type: 'community',
          hasBackend: manifest.hasBackend ?? pack.has_backend,
        });
      } else {
        // Fallback to basic info from database
        manifests.push({
          id: pack.pack_id,
          name: pack.name || pack.pack_id,
          description: pack.description,
          icon: pack.icon || '📦',
          color: pack.color || '#6366f1',
          version: pack.installed_version,
          installedVersion: pack.installed_version,
          sourceId: pack.id,
          sourceUrl: pack.url,
          type: 'community',
          hasBackend: pack.has_backend,
          categories: [],
          allGames: [],
        });
      }
    }

    res.json({ manifests });
  } catch (error) {
    console.error('Failed to get installed manifests:', error);
    res.status(500).json({
      error: 'Failed to get installed manifests',
      details: error.message,
    });
  }
});

/**
 * Get a single community source by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const source = db.prepare(`
    SELECT
      cs.*,
      ip.pack_id IS NOT NULL as is_installed,
      ip.installed_version,
      ip.available_version
    FROM community_sources cs
    LEFT JOIN installed_packs ip ON ip.source_id = cs.id
    WHERE cs.id = ?
  `).get(id);

  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  res.json({ source });
});

/**
 * Add a new community source
 * Supports both GitHub URLs and local paths (for development)
 *
 * Local paths:
 * - file:///path/to/pack
 * - /absolute/path
 * - ./relative/path
 */
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Check for duplicates
  const existing = db.prepare('SELECT id FROM community_sources WHERE url = ?').get(url);
  if (existing) {
    return res.status(409).json({
      error: 'This source is already added',
      sourceId: existing.id,
    });
  }

  // Handle local paths (for development)
  if (isLocalPath(url)) {
    return handleLocalSource(req, res, url);
  }

  // Handle GitHub URLs
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid source format',
      hint: 'Use format: git@github.com:owner/repo.git, https://github.com/owner/repo, or a local path like /path/to/pack',
    });
  }

  try {
    // First, get the latest semver tag - we need this to fetch the correct manifest
    console.log(`📦 Checking for semver tags in ${url}...`);
    let latestVersion = null;
    try {
      latestVersion = await getLatestSemverTag(url);
    } catch (e) {
      console.warn('Could not fetch tags:', e.message);
      return res.status(400).json({
        error: 'Could not fetch repository tags',
        details: e.message,
        hint: 'Make sure the repository exists and is public',
      });
    }

    if (!latestVersion) {
      return res.status(400).json({
        error: 'No semver tags found in repository',
        hint: 'The repository needs at least one semantic version tag (e.g., v1.0.0). Create a tag with: git tag v1.0.0 && git push origin v1.0.0',
      });
    }

    console.log(`📦 Found latest version: ${latestVersion}, fetching manifest...`);

    // Fetch manifest from the tagged version (not main/master)
    const manifest = await fetchManifestFromGitHub(url, latestVersion);

    if (!manifest || !manifest.id) {
      return res.status(400).json({
        error: 'Invalid manifest: missing pack id',
        hint: `The repository must have a manifest.js or manifest.json with an "id" field at tag ${latestVersion}`,
      });
    }

    // Check if pack ID conflicts with existing source
    const existingPack = db.prepare('SELECT id, url FROM community_sources WHERE pack_id = ?').get(manifest.id);
    if (existingPack) {
      return res.status(409).json({
        error: `A source with pack ID "${manifest.id}" already exists`,
        existingUrl: existingPack.url,
      });
    }

    // Insert the source
    const userId = req.session?.userId || null;
    const result = db.prepare(`
      INSERT INTO community_sources (
        url, name, description, icon, color, pack_id, has_backend,
        latest_version, last_checked_at, added_by, is_local
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 0)
    `).run(
      url,
      manifest.name || manifest.id,
      manifest.description || null,
      manifest.icon || '📦',
      manifest.color || '#6366f1',
      manifest.id,
      manifest.hasBackend ? 1 : 0,
      latestVersion,
      userId
    );

    const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(result.lastInsertRowid);

    console.log(`✅ Added community source: ${manifest.name} (${manifest.id})`);

    res.status(201).json({
      success: true,
      message: `Added ${manifest.name}`,
      source,
      latestVersion,
    });
  } catch (error) {
    console.error('Failed to add community source:', error);
    res.status(400).json({
      error: 'Failed to fetch manifest from repository',
      details: error.message,
    });
  }
});

/**
 * Handle adding a local path as a source (for development)
 */
async function handleLocalSource(req, res, url) {
  try {
    const localPath = normalizeLocalPath(url);
    console.log(`📁 Adding local source: ${localPath}`);

    if (!existsSync(localPath)) {
      return res.status(400).json({
        error: 'Local path does not exist',
        details: localPath,
      });
    }

    const stat = lstatSync(localPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({
        error: 'Local path must be a directory',
        details: localPath,
      });
    }

    // Fetch manifest from local path
    const manifest = await fetchManifestFromLocal(localPath);

    if (!manifest || !manifest.id) {
      return res.status(400).json({
        error: 'Invalid manifest: missing pack id',
        hint: 'The directory must have a manifest.js or manifest.json with an "id" field',
      });
    }

    // Check if pack ID conflicts with existing source
    const existingPack = db.prepare('SELECT id, url FROM community_sources WHERE pack_id = ?').get(manifest.id);
    if (existingPack) {
      return res.status(409).json({
        error: `A source with pack ID "${manifest.id}" already exists`,
        existingUrl: existingPack.url,
      });
    }

    // Insert the source (marked as local, version is 'dev')
    const userId = req.session?.userId || null;
    const result = db.prepare(`
      INSERT INTO community_sources (
        url, name, description, icon, color, pack_id, has_backend,
        latest_version, last_checked_at, added_by, is_local
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'dev', datetime('now'), ?, 1)
    `).run(
      url,
      manifest.name || manifest.id,
      manifest.description || null,
      manifest.icon || '🛠️',  // Different icon for local/dev
      manifest.color || '#f59e0b',  // Orange for dev
      manifest.id,
      manifest.hasBackend ? 1 : 0,
      userId
    );

    const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(result.lastInsertRowid);

    console.log(`✅ Added local source: ${manifest.name} (${manifest.id}) from ${localPath}`);

    res.status(201).json({
      success: true,
      message: `Added local pack "${manifest.name}" (development mode)`,
      source,
      isLocal: true,
      localPath,
    });
  } catch (error) {
    console.error('Failed to add local source:', error);
    res.status(400).json({
      error: 'Failed to read manifest from local path',
      details: error.message,
    });
  }
}

/**
 * Delete a community source
 * Also uninstalls the pack if installed
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  try {
    // Check if pack is installed
    const installed = db.prepare('SELECT pack_id FROM installed_packs WHERE source_id = ?').get(id);

    if (installed) {
      // Uninstall the pack first
      db.prepare('DELETE FROM installed_packs WHERE source_id = ?').run(id);

      // Remove cloned files
      if (source.pack_id) {
        removePack(source.pack_id);
        await deletePluginData(source.pack_id);
      }

      // Reload plugins
      await reloadPackPlugins();
    }

    // Delete the source
    db.prepare('DELETE FROM community_sources WHERE id = ?').run(id);

    console.log(`🗑️ Removed community source: ${source.name}`);

    res.json({
      success: true,
      message: `Removed ${source.name}`,
      wasInstalled: !!installed,
    });
  } catch (error) {
    console.error('Failed to delete community source:', error);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

/**
 * Check a source for updates
 * Compares installed version with latest available
 */
router.post('/:id/check-update', async (req, res) => {
  const { id } = req.params;

  const source = db.prepare(`
    SELECT cs.*, ip.installed_version
    FROM community_sources cs
    LEFT JOIN installed_packs ip ON ip.source_id = cs.id
    WHERE cs.id = ?
  `).get(id);

  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  try {
    const latestVersion = await getLatestSemverTag(source.url);

    // Update cached latest version
    db.prepare(`
      UPDATE community_sources
      SET latest_version = ?, last_checked_at = datetime('now'), error_message = NULL
      WHERE id = ?
    `).run(latestVersion, id);

    let updateAvailable = false;
    if (source.installed_version && latestVersion) {
      updateAvailable = compareSemver(latestVersion, source.installed_version) > 0;

      // Update available_version in installed_packs if update is available
      if (updateAvailable) {
        db.prepare(`
          UPDATE installed_packs SET available_version = ? WHERE source_id = ?
        `).run(latestVersion, id);
      } else {
        db.prepare(`
          UPDATE installed_packs SET available_version = NULL WHERE source_id = ?
        `).run(id);
      }
    }

    res.json({
      success: true,
      latestVersion,
      installedVersion: source.installed_version,
      updateAvailable,
    });
  } catch (error) {
    // Store error message for display
    db.prepare(`
      UPDATE community_sources
      SET error_message = ?, last_checked_at = datetime('now')
      WHERE id = ?
    `).run(error.message, id);

    console.error('Failed to check for updates:', error);
    res.status(500).json({
      error: 'Failed to check for updates',
      details: error.message,
    });
  }
});

/**
 * Check all sources for updates
 */
router.post('/check-all-updates', async (req, res) => {
  const sources = db.prepare(`
    SELECT cs.*, ip.installed_version
    FROM community_sources cs
    LEFT JOIN installed_packs ip ON ip.source_id = cs.id
  `).all();

  const results = [];

  for (const source of sources) {
    try {
      const latestVersion = await getLatestSemverTag(source.url);

      db.prepare(`
        UPDATE community_sources
        SET latest_version = ?, last_checked_at = datetime('now'), error_message = NULL
        WHERE id = ?
      `).run(latestVersion, source.id);

      let updateAvailable = false;
      if (source.installed_version && latestVersion) {
        updateAvailable = compareSemver(latestVersion, source.installed_version) > 0;

        if (updateAvailable) {
          db.prepare(`
            UPDATE installed_packs SET available_version = ? WHERE source_id = ?
          `).run(latestVersion, source.id);
        }
      }

      results.push({
        id: source.id,
        name: source.name,
        latestVersion,
        installedVersion: source.installed_version,
        updateAvailable,
        error: null,
      });
    } catch (error) {
      db.prepare(`
        UPDATE community_sources
        SET error_message = ?, last_checked_at = datetime('now')
        WHERE id = ?
      `).run(error.message, source.id);

      results.push({
        id: source.id,
        name: source.name,
        error: error.message,
      });
    }
  }

  const updatesAvailable = results.filter(r => r.updateAvailable).length;

  res.json({
    success: true,
    checked: results.length,
    updatesAvailable,
    results,
  });
});

/**
 * Get available versions (tags) for a source
 */
router.get('/:id/versions', async (req, res) => {
  const { id } = req.params;

  const source = db.prepare('SELECT url FROM community_sources WHERE id = ?').get(id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  try {
    const versions = await getSemverTags(source.url);
    res.json({ versions });
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    res.status(500).json({
      error: 'Failed to fetch versions',
      details: error.message,
    });
  }
});

/**
 * Install a community pack from a source
 * - For GitHub sources: Clones the repository at the specified version
 * - For local sources: Creates a symlink for hot-reload development
 */
router.post('/:id/install', async (req, res) => {
  const { id } = req.params;
  const { version } = req.body; // Optional specific version

  const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  // Check if already installed
  const existing = db.prepare('SELECT pack_id FROM installed_packs WHERE source_id = ?').get(id);
  if (existing) {
    return res.status(409).json({
      error: 'Pack is already installed',
      installedPackId: existing.pack_id,
    });
  }

  // Handle local sources (symlink for development)
  if (source.is_local || isLocalPath(source.url)) {
    return handleLocalInstall(req, res, source, id);
  }

  // Check if git is available for GitHub sources
  const gitAvailable = await isGitAvailable();
  if (!gitAvailable) {
    return res.status(500).json({
      error: 'Git is not available on this server',
      hint: 'Install git to enable community pack installation',
    });
  }

  try {
    // Get version to install
    let targetVersion = version;
    if (!targetVersion) {
      targetVersion = source.latest_version || await getLatestSemverTag(source.url);
    }

    if (!targetVersion) {
      return res.status(400).json({
        error: 'No semver tags found in repository',
        hint: 'The repository needs at least one tag like v1.0.0',
      });
    }

    console.log(`📦 Installing ${source.name} at version ${targetVersion}...`);

    // Clone the repository
    await clonePackAtTag(source.url, targetVersion, source.pack_id);

    // Add to installed_packs
    const userId = req.session?.userId || null;
    db.prepare(`
      INSERT INTO installed_packs (pack_id, pack_type, source_id, installed_version, installed_by)
      VALUES (?, 'community', ?, ?, ?)
    `).run(source.pack_id, id, targetVersion, userId);

    // Reload plugins to load the new pack's backend (if any)
    if (source.has_backend) {
      await reloadPackPlugins();
    }

    console.log(`✅ Installed ${source.name} v${targetVersion}`);

    res.json({
      success: true,
      message: `Installed ${source.name} v${targetVersion}`,
      packId: source.pack_id,
      version: targetVersion,
    });
  } catch (error) {
    console.error('Failed to install pack:', error);
    res.status(500).json({
      error: 'Failed to install pack',
      details: error.message,
    });
  }
});

/**
 * Handle installing a local source (creates symlink for hot-reload)
 */
async function handleLocalInstall(req, res, source, sourceId) {
  try {
    const localPath = normalizeLocalPath(source.url);
    console.log(`🔗 Linking local pack: ${source.name} from ${localPath}`);

    // Create symlink
    await linkLocalPack(source.url, source.pack_id);

    // Add to installed_packs
    const userId = req.session?.userId || null;
    db.prepare(`
      INSERT INTO installed_packs (pack_id, pack_type, source_id, installed_version, installed_by)
      VALUES (?, 'community', ?, 'dev', ?)
    `).run(source.pack_id, sourceId, userId);

    // Reload plugins to load the new pack's backend (if any)
    if (source.has_backend) {
      await reloadPackPlugins();
    }

    console.log(`✅ Linked local pack: ${source.name} (development mode)`);

    res.json({
      success: true,
      message: `Linked ${source.name} (development mode - changes auto-reload!)`,
      packId: source.pack_id,
      version: 'dev',
      isLocal: true,
      localPath,
    });
  } catch (error) {
    console.error('Failed to link local pack:', error);
    res.status(500).json({
      error: 'Failed to link local pack',
      details: error.message,
    });
  }
}

/**
 * Uninstall a community pack
 */
router.post('/:id/uninstall', async (req, res) => {
  const { id } = req.params;
  const { deleteData = true } = req.body;

  const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  const installed = db.prepare('SELECT * FROM installed_packs WHERE source_id = ?').get(id);
  if (!installed) {
    return res.status(400).json({ error: 'Pack is not installed' });
  }

  try {
    // Remove from installed_packs
    db.prepare('DELETE FROM installed_packs WHERE source_id = ?').run(id);

    // Remove cloned files
    removePack(source.pack_id);

    // Delete plugin data if requested
    if (deleteData && source.has_backend) {
      await deletePluginData(source.pack_id);
    }

    // Reload plugins
    if (source.has_backend) {
      await reloadPackPlugins();
    }

    console.log(`🗑️ Uninstalled ${source.name}`);

    res.json({
      success: true,
      message: `Uninstalled ${source.name}`,
      dataDeleted: deleteData,
    });
  } catch (error) {
    console.error('Failed to uninstall pack:', error);
    res.status(500).json({ error: 'Failed to uninstall pack' });
  }
});

/**
 * Update an installed pack to a newer version
 */
router.post('/:id/update', async (req, res) => {
  const { id } = req.params;
  const { version } = req.body; // Optional specific version

  const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  const installed = db.prepare('SELECT * FROM installed_packs WHERE source_id = ?').get(id);
  if (!installed) {
    return res.status(400).json({ error: 'Pack is not installed' });
  }

  try {
    // Get target version
    let targetVersion = version;
    if (!targetVersion) {
      targetVersion = await getLatestSemverTag(source.url);
    }

    if (!targetVersion) {
      return res.status(400).json({ error: 'No version available to update to' });
    }

    // Check if already at this version
    if (installed.installed_version === targetVersion) {
      return res.json({
        success: true,
        message: 'Already at this version',
        version: targetVersion,
      });
    }

    console.log(`📦 Updating ${source.name} from ${installed.installed_version} to ${targetVersion}...`);

    // Update the pack (fresh clone)
    await updatePackToTag(source.url, targetVersion, source.pack_id);

    // Update installed_packs record
    db.prepare(`
      UPDATE installed_packs
      SET installed_version = ?, available_version = NULL
      WHERE source_id = ?
    `).run(targetVersion, id);

    // Reload plugins
    if (source.has_backend) {
      await reloadPackPlugins();
    }

    console.log(`✅ Updated ${source.name} to v${targetVersion}`);

    res.json({
      success: true,
      message: `Updated ${source.name} to v${targetVersion}`,
      previousVersion: installed.installed_version,
      newVersion: targetVersion,
    });
  } catch (error) {
    console.error('Failed to update pack:', error);
    res.status(500).json({
      error: 'Failed to update pack',
      details: error.message,
    });
  }
});

/**
 * Refresh manifest metadata for a source
 */
router.post('/:id/refresh-manifest', async (req, res) => {
  const { id } = req.params;

  const source = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  try {
    // Get latest tag first, then fetch manifest from that tag
    const latestVersion = await getLatestSemverTag(source.url);

    if (!latestVersion) {
      return res.status(400).json({
        error: 'No semver tags found in repository',
        hint: 'The repository needs at least one semantic version tag (e.g., v1.0.0)',
      });
    }

    const manifest = await fetchManifestFromGitHub(source.url, latestVersion);

    // Update cached metadata
    db.prepare(`
      UPDATE community_sources
      SET name = ?, description = ?, icon = ?, color = ?, has_backend = ?,
          latest_version = ?, last_checked_at = datetime('now'), error_message = NULL
      WHERE id = ?
    `).run(
      manifest.name || source.name,
      manifest.description || source.description,
      manifest.icon || source.icon,
      manifest.color || source.color,
      manifest.hasBackend ? 1 : 0,
      latestVersion,
      id
    );

    const updated = db.prepare('SELECT * FROM community_sources WHERE id = ?').get(id);

    res.json({
      success: true,
      source: updated,
    });
  } catch (error) {
    db.prepare(`
      UPDATE community_sources
      SET error_message = ?, last_checked_at = datetime('now')
      WHERE id = ?
    `).run(error.message, id);

    console.error('Failed to refresh manifest:', error);
    res.status(500).json({
      error: 'Failed to refresh manifest',
      details: error.message,
    });
  }
});

/**
 * Parse a manifest.js file content and extract manifest data
 * This handles the ES module export format used by community packs
 */
function parseManifestJs(content, packInfo) {
  // Extract the object literal from the manifest
  // Look for patterns like: const packName = { ... } or export default { ... }

  // Remove dynamic imports (component: () => import('./games/...'))
  // These can't be used on the frontend anyway
  const cleanedContent = content
    .replace(/component:\s*\(\)\s*=>\s*import\([^)]+\)/g, 'component: null')
    .replace(/component:\s*import\([^)]+\)/g, 'component: null');

  // Try to extract JSON-like structure
  // Find the main object (after = or export default)
  const objectMatch = cleanedContent.match(/(?:const\s+\w+\s*=|export\s+default)\s*(\{[\s\S]*\});?\s*(?:export|$)/);

  if (!objectMatch) {
    // Fallback: try to find any large object
    const fallbackMatch = cleanedContent.match(/\{[\s\S]*categories[\s\S]*\}/);
    if (!fallbackMatch) {
      return null;
    }
  }

  // Parse the key fields we care about from the manifest
  const manifest = {
    id: extractField(content, 'id'),
    name: extractField(content, 'name') || packInfo.name,
    description: extractField(content, 'description') || packInfo.description,
    icon: extractField(content, 'icon') || packInfo.icon,
    color: extractField(content, 'color') || packInfo.color,
    version: extractField(content, 'version') || packInfo.installed_version,
    author: extractField(content, 'author'),
    hasBackend: content.includes('hasBackend: true') || content.includes('hasBackend:true'),
    type: 'community',
    categories: extractCategories(content),
  };

  // Build allGames from categories
  manifest.allGames = manifest.categories.flatMap(cat =>
    cat.games.map(game => ({ ...game, categoryName: cat.name, packId: manifest.id }))
  );

  return manifest;
}

/**
 * Extract a string field from manifest content
 */
function extractField(content, fieldName) {
  // Match both quoted and unquoted values
  const patterns = [
    new RegExp(`${fieldName}:\\s*['"\`]([^'"\`]+)['"\`]`),
    new RegExp(`${fieldName}:\\s*([^,\\n}]+)`),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim().replace(/['"]/g, '');
    }
  }
  return null;
}

/**
 * Extract categories array from manifest content
 */
function extractCategories(content) {
  const categories = [];

  // Find categories array - look for categories: [ ... ]
  // Stop at the getter methods or end of object
  const categoriesMatch = content.match(/categories:\s*\[([\s\S]*?)\]\s*,?\s*(?:\/\*\*|get\s+allGames|getGameBySlug|\n\s*\n)/);
  if (!categoriesMatch) {
    console.log('Could not find categories array in manifest');
    return categories;
  }

  const categoriesContent = categoriesMatch[1];

  // Find each category by looking for { name: ... games: [...] } pattern
  // Using a bracket-matching approach for robustness
  let depth = 0;
  let catStart = -1;

  for (let i = 0; i < categoriesContent.length; i++) {
    const char = categoriesContent[i];
    if (char === '{') {
      if (depth === 0) catStart = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && catStart >= 0) {
        const catContent = categoriesContent.slice(catStart, i + 1);
        const category = parseCategory(catContent);
        if (category) {
          categories.push(category);
        }
        catStart = -1;
      }
    }
  }

  return categories;
}

/**
 * Parse a single category object
 */
function parseCategory(catContent) {
  const name = extractQuotedValue(catContent, 'name');
  const icon = extractQuotedValue(catContent, 'icon');
  const description = extractQuotedValue(catContent, 'description') || '';

  if (!name) return null;

  // Extract games array
  const gamesMatch = catContent.match(/games:\s*\[([\s\S]*)\]/);
  const games = gamesMatch ? extractGames(gamesMatch[1]) : [];

  return {
    name,
    icon: icon || '🎮',
    description,
    games,
  };
}

/**
 * Extract a quoted value for a field
 */
function extractQuotedValue(content, fieldName) {
  const pattern = new RegExp(`${fieldName}:\\s*['"\`]([^'"\`]+)['"\`]`);
  const match = content.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract games array from category content
 */
function extractGames(gamesContent) {
  const games = [];

  // Find each game object by bracket matching
  let depth = 0;
  let gameStart = -1;

  for (let i = 0; i < gamesContent.length; i++) {
    const char = gamesContent[i];
    if (char === '{') {
      if (depth === 0) gameStart = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && gameStart >= 0) {
        const gameContent = gamesContent.slice(gameStart, i + 1);
        const game = parseGame(gameContent);
        if (game) {
          games.push(game);
        }
        gameStart = -1;
      }
    }
  }

  return games;
}

/**
 * Parse a single game object
 */
function parseGame(gameContent) {
  const slug = extractQuotedValue(gameContent, 'slug');
  const title = extractQuotedValue(gameContent, 'title');

  if (!slug || !title) return null;

  const game = {
    slug,
    title,
    description: extractQuotedValue(gameContent, 'description') || '',
    icon: extractQuotedValue(gameContent, 'icon') || extractQuotedValue(gameContent, 'emojiIcon') || '🎮',
    emojiIcon: extractQuotedValue(gameContent, 'emojiIcon') || extractQuotedValue(gameContent, 'icon') || '🎮',
    // Don't include component - these need special handling for community packs
    component: null,
  };

  // Try to extract colors
  const colorsMatch = gameContent.match(/colors:\s*\{\s*primary:\s*['"]([^'"]+)['"][^}]*secondary:\s*['"]([^'"]+)['"]/);
  if (colorsMatch) {
    game.colors = { primary: colorsMatch[1], secondary: colorsMatch[2] };
  }

  // Try to extract gradient
  const gradientMatch = gameContent.match(/gradient:\s*['"]([^'"]+)['"]/);
  if (gradientMatch) {
    game.gradient = gradientMatch[1];
  }

  return game;
}

export default router;
