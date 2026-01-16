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
  fetchManifestFromGitHub,
  getLatestSemverTag,
  getSemverTags,
  clonePackAtTag,
  updatePackToTag,
  removePack,
  isPackCloned,
  isGitAvailable,
  compareSemver,
} from '../utils/git.js';

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
 * Fetches the manifest to validate and cache metadata
 */
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid GitHub URL format',
      hint: 'Use format: git@github.com:owner/repo.git or https://github.com/owner/repo',
    });
  }

  // Check for duplicates
  const existing = db.prepare('SELECT id FROM community_sources WHERE url = ?').get(url);
  if (existing) {
    return res.status(409).json({
      error: 'This repository is already added',
      sourceId: existing.id,
    });
  }

  try {
    // Fetch manifest metadata
    console.log(`📦 Fetching manifest from ${url}...`);
    const manifest = await fetchManifestFromGitHub(url);

    if (!manifest || !manifest.id) {
      return res.status(400).json({
        error: 'Invalid manifest: missing pack id',
        hint: 'The repository must have a manifest.js or manifest.json with an "id" field',
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

    // Get latest semver tag
    let latestVersion = null;
    try {
      latestVersion = await getLatestSemverTag(url);
    } catch (e) {
      console.warn('Could not fetch tags:', e.message);
    }

    // Insert the source
    const userId = req.session?.userId || null;
    const result = db.prepare(`
      INSERT INTO community_sources (
        url, name, description, icon, color, pack_id, has_backend,
        latest_version, last_checked_at, added_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
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
 * Clones the repository at the specified (or latest) version
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

  // Check if git is available
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
    const manifest = await fetchManifestFromGitHub(source.url);
    const latestVersion = await getLatestSemverTag(source.url);

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

export default router;
