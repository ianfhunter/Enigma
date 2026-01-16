import { Router } from 'express';
import db from '../db.js';
import { reloadPackPlugins, getPluginManager, deletePluginData } from '../plugins/loader.js';

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

export default router;
