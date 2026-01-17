import { Router } from 'express';
import { existsSync, statSync } from 'fs';
import { join, resolve, extname, normalize } from 'path';
import db from '../db.js';
import { reloadPackPlugins, getPluginManager, deletePluginData } from '../plugins/loader.js';
import { getPluginsDir } from '../utils/git.js';

const router = Router();

/**
 * Get list of installed packs
 */
router.get('/installed', (req, res) => {
  const packs = db.prepare(`
    SELECT pack_id, pack_type, installed_at
    FROM installed_packs
    ORDER BY installed_at DESC
  `).all();

  res.json({ packs });
});

/**
 * Check if a specific pack is installed
 */
router.get('/installed/:packId', (req, res) => {
  const { packId } = req.params;

  const pack = db.prepare(`
    SELECT pack_id, pack_type, installed_at
    FROM installed_packs
    WHERE pack_id = ?
  `).get(packId);

  res.json({
    installed: !!pack,
    pack: pack || null
  });
});

/**
 * Install a pack
 * For community packs, this enables their backend plugin
 */
router.post('/install', async (req, res) => {
  const { packId, packType = 'community' } = req.body;

  if (!packId) {
    return res.status(400).json({ error: 'packId is required' });
  }

  // Check if already installed
  const existing = db.prepare('SELECT pack_id FROM installed_packs WHERE pack_id = ?').get(packId);
  if (existing) {
    return res.json({ success: true, message: 'Pack already installed', alreadyInstalled: true });
  }

  try {
    // Insert into installed_packs
    const userId = req.session?.userId || null;
    db.prepare(`
      INSERT INTO installed_packs (pack_id, pack_type, installed_by)
      VALUES (?, ?, ?)
    `).run(packId, packType, userId);

    // Reload plugins to mount the new pack's routes
    if (packType === 'community') {
      console.log(`📦 Installing pack: ${packId}`);
      await reloadPackPlugins();
    }

    res.json({
      success: true,
      message: `Pack ${packId} installed successfully`
    });
  } catch (error) {
    console.error('Failed to install pack:', error);
    res.status(500).json({ error: 'Failed to install pack' });
  }
});

/**
 * Uninstall a pack
 * For community packs, this disables their backend plugin and deletes plugin data
 */
router.post('/uninstall', async (req, res) => {
  const { packId, deleteData = true } = req.body;

  if (!packId) {
    return res.status(400).json({ error: 'packId is required' });
  }

  // Validate packId format to avoid unexpected filesystem names
  if (!/^[a-zA-Z0-9_-]+$/.test(packId)) {
    return res.status(400).json({ error: 'Invalid packId format' });
  }

  // Check if pack exists and is removable
  const pack = db.prepare('SELECT pack_id, pack_type FROM installed_packs WHERE pack_id = ?').get(packId);

  if (!pack) {
    return res.status(404).json({ error: 'Pack not found or not installed' });
  }

  // Don't allow uninstalling official packs
  if (pack.pack_type === 'official') {
    return res.status(400).json({ error: 'Cannot uninstall official packs' });
  }

  try {
    // Remove from installed_packs
    db.prepare('DELETE FROM installed_packs WHERE pack_id = ?').run(packId);

    // Reload plugins to unmount the pack's routes
    if (pack.pack_type === 'community') {
      console.log(`📦 Uninstalling pack: ${packId}`);
      await reloadPackPlugins();

      // Delete the plugin's isolated database if requested (default: true)
      if (deleteData) {
        const deleted = await deletePluginData(packId);
        if (deleted) {
          console.log(`   🗑️  Plugin data deleted for: ${packId}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Pack ${packId} uninstalled successfully`,
      dataDeleted: deleteData
    });
  } catch (error) {
    console.error('Failed to uninstall pack:', error);
    res.status(500).json({ error: 'Failed to uninstall pack' });
  }
});

/**
 * Get plugin status (which plugins are loaded)
 */
router.get('/plugins/status', (req, res) => {
  const manager = getPluginManager();
  const plugins = manager.getLoadedPlugins();

  res.json({
    loaded: plugins.length,
    plugins
  });
});

/**
 * Manually trigger plugin reload (for debugging)
 */
router.post('/plugins/reload', async (req, res) => {
  try {
    console.log('🔄 Manual plugin reload requested...');
    const plugins = await reloadPackPlugins();

    res.json({
      success: true,
      message: `Loaded ${plugins.length} plugin(s)`,
      plugins
    });
  } catch (error) {
    console.error('Plugin reload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Serve static files from installed community packs
 * Example: /api/packs/my-pack/logo.svg
 * NOTE: This route must be last to avoid catching other routes like /plugins/status
 */
router.get('/:packId/*', (req, res) => {
  const { packId } = req.params;
  const filePath = req.params[0]; // Everything after /:packId/

  // Exclude reserved paths
  const reservedPaths = ['plugins', 'installed'];
  if (reservedPaths.includes(packId)) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Validate packId format (prevent path traversal)
  if (!/^[a-zA-Z0-9_-]+$/.test(packId)) {
    return res.status(400).json({ error: 'Invalid packId format' });
  }

  // Check if pack is installed
  const pack = db.prepare('SELECT pack_id FROM installed_packs WHERE pack_id = ?').get(packId);
  if (!pack) {
    return res.status(404).json({ error: 'Pack not found or not installed' });
  }

  // Validate file extension (only allow safe static file types)
  const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.json', '.css', '.js'];
  const ext = extname(filePath).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }

  // Build the full path to the file
  const pluginsDir = getPluginsDir();
  const packDir = join(pluginsDir, packId);
  const requestedPath = join(packDir, filePath);
  
  // Normalize the path to prevent directory traversal
  const normalizedPath = normalize(requestedPath);
  
  // Ensure the resolved path is within the pack directory
  const resolvedPath = resolve(normalizedPath);
  const resolvedPackDir = resolve(packDir);
  
  if (!resolvedPath.startsWith(resolvedPackDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists
  if (!existsSync(resolvedPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check if it's a file (not a directory)
  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    return res.status(400).json({ error: 'Not a file' });
  }

  // Set appropriate content type
  const contentTypes = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.css': 'text/css',
    '.js': 'application/javascript',
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Send the file with explicit content type
  return res.sendFile(resolvedPath, {
    headers: {
      'Content-Type': contentType
    }
  }, (err) => {
    if (err) {
      console.error('Error serving pack file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve file' });
      }
    }
  });
});

export default router;
