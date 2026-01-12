import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 12;

// All routes require authentication
router.use(requireAuth);

// Update profile (display name)
router.put('/profile', (req, res) => {
  const { displayName } = req.body;

  if (!displayName || displayName.length < 1 || displayName.length > 64) {
    return res.status(400).json({ error: 'Display name must be 1-64 characters' });
  }

  db.prepare(`
    UPDATE users
    SET display_name = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(displayName, req.session.userId);

  res.json({ displayName });
});

// Change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current password hash
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newHash, req.session.userId);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user settings
router.get('/settings', (req, res) => {
  const settings = db.prepare(`
    SELECT english_variant, disabled_games, game_preferences
    FROM user_settings WHERE user_id = ?
  `).get(req.session.userId);

  if (!settings) {
    // Create default settings if missing
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.session.userId);
    return res.json({
      englishVariant: 'us',
      disabledGames: [],
      gamePreferences: {}
    });
  }

  res.json({
    englishVariant: settings.english_variant,
    disabledGames: JSON.parse(settings.disabled_games || '[]'),
    gamePreferences: JSON.parse(settings.game_preferences || '{}')
  });
});

// Update user settings
router.put('/settings', (req, res) => {
  const { englishVariant, disabledGames, gamePreferences } = req.body;

  // Build update query dynamically based on what's provided
  const updates = [];
  const values = [];

  if (englishVariant !== undefined) {
    if (!['us', 'uk'].includes(englishVariant)) {
      return res.status(400).json({ error: 'Invalid English variant' });
    }
    updates.push('english_variant = ?');
    values.push(englishVariant);
  }

  if (disabledGames !== undefined) {
    if (!Array.isArray(disabledGames)) {
      return res.status(400).json({ error: 'disabledGames must be an array' });
    }
    updates.push('disabled_games = ?');
    values.push(JSON.stringify(disabledGames));
  }

  if (gamePreferences !== undefined) {
    if (typeof gamePreferences !== 'object') {
      return res.status(400).json({ error: 'gamePreferences must be an object' });
    }
    updates.push('game_preferences = ?');
    values.push(JSON.stringify(gamePreferences));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No settings to update' });
  }

  values.push(req.session.userId);

  db.prepare(`
    UPDATE user_settings
    SET ${updates.join(', ')}
    WHERE user_id = ?
  `).run(...values);

  res.json({ message: 'Settings updated' });
});

export default router;
