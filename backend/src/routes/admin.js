import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { reloadPackPlugins, getPluginManager } from '../plugins/loader.js';

const router = Router();
const SALT_ROUNDS = 12;

// All routes require admin
router.use(requireAdmin);

// Get server statistics
router.get('/stats', (req, res) => {
  const stats = {};

  // User stats
  const userStats = db.prepare(`
    SELECT
      COUNT(*) as totalUsers,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminCount,
      MIN(created_at) as firstUserAt,
      MAX(created_at) as lastUserAt
    FROM users
  `).get();

  stats.users = {
    total: userStats.totalUsers,
    admins: userStats.adminCount,
    firstUserAt: userStats.firstUserAt,
    lastUserAt: userStats.lastUserAt
  };

  // Game progress stats
  const gameStats = db.prepare(`
    SELECT
      COUNT(DISTINCT user_id) as usersWithProgress,
      COUNT(DISTINCT game_slug) as gamesPlayed,
      SUM(played) as totalGamesPlayed,
      SUM(won) as totalWins
    FROM game_progress
  `).get();

  stats.games = {
    usersWithProgress: gameStats.usersWithProgress,
    uniqueGamesPlayed: gameStats.gamesPlayed,
    totalGamesPlayed: gameStats.totalGamesPlayed,
    totalWins: gameStats.totalWins
  };

  // Most popular games
  const popularGames = db.prepare(`
    SELECT game_slug, COUNT(*) as players, SUM(played) as totalPlays
    FROM game_progress
    GROUP BY game_slug
    ORDER BY totalPlays DESC
    LIMIT 10
  `).all();

  stats.popularGames = popularGames.map(g => ({
    gameSlug: g.game_slug,
    players: g.players,
    totalPlays: g.totalPlays
  }));

  // Recent activity (logins in last 24h, 7d, 30d)
  const loginStats = db.prepare(`
    SELECT
      SUM(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 ELSE 0 END) as last24h,
      SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as last7d,
      SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) as last30d
    FROM login_history
    WHERE success = 1
  `).get();

  stats.logins = {
    last24h: loginStats.last24h || 0,
    last7d: loginStats.last7d || 0,
    last30d: loginStats.last30d || 0
  };

  // Active sessions count
  const activeSessions = db.prepare(`
    SELECT COUNT(*) as count FROM sessions WHERE expire > ?
  `).get(Date.now() / 1000);

  stats.activeSessions = activeSessions.count;

  res.json(stats);
});

// List all users
router.get('/users', (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.role,
      u.created_at,
      u.updated_at,
      (SELECT COUNT(*) FROM game_progress WHERE user_id = u.id) as games_played
    FROM users u
  `;
  const params = [];

  if (search) {
    query += ` WHERE u.username LIKE ? OR u.display_name LIKE ?`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Math.min(parseInt(limit) || 50, 100), parseInt(offset) || 0);

  const users = db.prepare(query).all(...params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const countParams = [];
  if (search) {
    countQuery += ` WHERE username LIKE ? OR display_name LIKE ?`;
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      gamesPlayed: u.games_played
    })),
    total,
    limit: Math.min(parseInt(limit) || 50, 100),
    offset: parseInt(offset) || 0
  });
});

// Get single user details (for admin view)
router.get('/users/:id', (req, res) => {
  const { id } = req.params;

  const user = db.prepare(`
    SELECT id, username, display_name, role, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get user's settings
  const settings = db.prepare(`
    SELECT language, disabled_games, game_preferences
    FROM user_settings WHERE user_id = ?
  `).get(id);

  // Get user's game progress summary
  const progress = db.prepare(`
    SELECT game_slug, played, won, best_score, best_time, max_streak, updated_at
    FROM game_progress WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(id);

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    settings: settings ? {
      language: settings.language || 'en-US',
      disabledGames: JSON.parse(settings.disabled_games || '[]'),
      gamePreferences: JSON.parse(settings.game_preferences || '{}')
    } : null,
    gameProgress: progress.map(p => ({
      gameSlug: p.game_slug,
      played: p.played,
      won: p.won,
      bestScore: p.best_score,
      bestTime: p.best_time,
      maxStreak: p.max_streak,
      updatedAt: p.updated_at
    }))
  });
});

// Update user (change role, reset password)
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role, newPassword, displayName } = req.body;

  // Prevent self-demotion from admin
  if (parseInt(id) === req.session.userId && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot demote yourself from admin' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates = [];
  const values = [];

  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    updates.push('role = ?');
    values.push(role);
  }

  if (newPassword !== undefined) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    updates.push('password_hash = ?');
    values.push(hash);
  }

  if (displayName !== undefined) {
    if (displayName.length < 1 || displayName.length > 64) {
      return res.status(400).json({ error: 'Display name must be 1-64 characters' });
    }
    updates.push('display_name = ?');
    values.push(displayName);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);

  // Return updated user
  const updated = db.prepare(`
    SELECT id, username, display_name, role, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id);

  res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.display_name,
    role: updated.role,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at
  });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Delete user (cascades to settings and progress)
  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  res.json({ message: 'User deleted' });
});

// Get server game config
router.get('/games', (req, res) => {
  const configs = db.prepare('SELECT game_slug, enabled, settings FROM server_game_config').all();

  res.json(configs.map(c => ({
    gameSlug: c.game_slug,
    enabled: Boolean(c.enabled),
    settings: JSON.parse(c.settings || '{}')
  })));
});

// Update server game config
router.put('/games/:slug', (req, res) => {
  const { slug } = req.params;
  const { enabled, settings } = req.body;

  // Check if config exists
  const existing = db.prepare('SELECT game_slug FROM server_game_config WHERE game_slug = ?').get(slug);

  if (existing) {
    const updates = [];
    const values = [];

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled ? 1 : 0);
    }

    if (settings !== undefined) {
      updates.push('settings = ?');
      values.push(JSON.stringify(settings));
    }

    if (updates.length > 0) {
      values.push(slug);
      db.prepare(`UPDATE server_game_config SET ${updates.join(', ')} WHERE game_slug = ?`).run(...values);
    }
  } else {
    db.prepare(`
      INSERT INTO server_game_config (game_slug, enabled, settings)
      VALUES (?, ?, ?)
    `).run(slug, enabled !== undefined ? (enabled ? 1 : 0) : 1, JSON.stringify(settings || {}));
  }

  const updated = db.prepare('SELECT game_slug, enabled, settings FROM server_game_config WHERE game_slug = ?').get(slug);

  res.json({
    gameSlug: updated.game_slug,
    enabled: Boolean(updated.enabled),
    settings: JSON.parse(updated.settings || '{}')
  });
});

// Get loaded plugins
router.get('/plugins', (req, res) => {
  const manager = getPluginManager();
  const plugins = manager.getLoadedPlugins();

  res.json({
    plugins,
    packsDir: process.env.NODE_ENV === 'development' ? 'development' : 'docker'
  });
});

// Reload all plugins (hot reload without server restart)
router.post('/plugins/reload', async (req, res) => {
  try {
    console.log('🔄 Admin requested plugin reload...');
    const plugins = await reloadPackPlugins();

    res.json({
      success: true,
      message: `Reloaded ${plugins.length} plugin(s)`,
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
