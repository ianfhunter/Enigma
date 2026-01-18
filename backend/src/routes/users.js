import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const SALT_ROUNDS = 12;

// Check if rate limiting should be disabled (development mode)
const isDevMode = process.env.DEV === '1' || process.env.DEV === 'true';

const loginHistoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 login history requests per windowMs
  skip: () => isDevMode,
});

// All routes require authentication
router.use(requireAuth);

// Update profile (display name, email)
router.put('/profile', (req, res) => {
  const { displayName, email } = req.body;

  const updates = [];
  const values = [];

  if (displayName !== undefined) {
    if (!displayName || displayName.length < 1 || displayName.length > 64) {
      return res.status(400).json({ error: 'Display name must be 1-64 characters' });
    }
    updates.push('display_name = ?');
    values.push(displayName);
  }

  if (email !== undefined) {
    if (email) {
      // Length check to prevent ReDoS attacks
      if (email.length > 254) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      // Safer regex pattern that avoids catastrophic backtracking
      // Uses more specific character classes and avoids nested quantifiers
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    updates.push('email = ?');
    values.push(email || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No profile data to update' });
  }

  updates.push("updated_at = datetime('now')");
  values.push(req.session.userId);

  db.prepare(`
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);

  // Return updated user
  const user = db.prepare(`
    SELECT display_name, email FROM users WHERE id = ?
  `).get(req.session.userId);

  res.json({ displayName: user.display_name, email: user.email });
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

// Delete own account
router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify password
    const user = db.prepare('SELECT password_hash, role FROM users WHERE id = ?')
      .get(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Check if user is the last admin
    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete account: you are the last admin' });
      }
    }

    // Delete user (cascades to settings, progress, login_history)
    db.prepare('DELETE FROM users WHERE id = ?').run(req.session.userId);

    // Destroy session
    req.session.destroy(() => {
      res.clearCookie('enigma.sid');
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get user settings
router.get('/settings', (req, res) => {
  const settings = db.prepare(`
    SELECT english_variant, theme, sound_enabled, disabled_games, game_preferences, search_engine
    FROM user_settings WHERE user_id = ?
  `).get(req.session.userId);

  if (!settings) {
    // Create default settings if missing
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.session.userId);
    return res.json({
      englishVariant: 'us',
      theme: 'dark',
      soundEnabled: true,
      disabledGames: [],
      gamePreferences: {},
      searchEngine: 'google'
    });
  }

  res.json({
    englishVariant: settings.english_variant,
    theme: settings.theme || 'dark',
    soundEnabled: Boolean(settings.sound_enabled),
    disabledGames: JSON.parse(settings.disabled_games || '[]'),
    gamePreferences: JSON.parse(settings.game_preferences || '{}'),
    searchEngine: settings.search_engine || 'google'
  });
});

// Update user settings
router.put('/settings', (req, res) => {
  const { englishVariant, theme, soundEnabled, disabledGames, gamePreferences, searchEngine } = req.body;

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

  if (theme !== undefined) {
    if (!['dark', 'light'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    updates.push('theme = ?');
    values.push(theme);
  }

  if (soundEnabled !== undefined) {
    updates.push('sound_enabled = ?');
    values.push(soundEnabled ? 1 : 0);
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

  if (searchEngine !== undefined) {
    if (!['google', 'bing', 'duckduckgo', 'yahoo', 'brave'].includes(searchEngine)) {
      return res.status(400).json({ error: 'Invalid search engine' });
    }
    updates.push('search_engine = ?');
    values.push(searchEngine);
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

// Get active sessions
router.get('/sessions', (req, res) => {
  const currentSid = req.session.id;

  // Parse sessions to find those belonging to this user
  const sessions = db.prepare(`
    SELECT sid, sess, expire FROM sessions
    WHERE expire > ?
  `).all(Date.now() / 1000);

  const userSessions = sessions.filter(s => {
    try {
      const sess = JSON.parse(s.sess);
      return sess.userId === req.session.userId;
    } catch {
      return false;
    }
  }).map(s => {
    const sess = JSON.parse(s.sess);
    return {
      id: s.sid,
      isCurrent: s.sid === currentSid,
      createdAt: sess.cookie?.expires ? new Date(sess.cookie.expires).toISOString() : null,
      expiresAt: new Date(s.expire * 1000).toISOString()
    };
  });

  res.json(userSessions);
});

// Logout all other sessions
router.delete('/sessions', (req, res) => {
  const currentSid = req.session.id;

  // Get all sessions and delete those belonging to this user except current
  const sessions = db.prepare('SELECT sid, sess FROM sessions').all();

  let deleted = 0;
  sessions.forEach(s => {
    try {
      const sess = JSON.parse(s.sess);
      if (sess.userId === req.session.userId && s.sid !== currentSid) {
        db.prepare('DELETE FROM sessions WHERE sid = ?').run(s.sid);
        deleted++;
      }
    } catch {
      // Skip invalid sessions
    }
  });

  res.json({ message: `Logged out of ${deleted} other session(s)` });
});

// Logout specific session
router.delete('/sessions/:sid', (req, res) => {
  const { sid } = req.params;

  if (sid === req.session.id) {
    return res.status(400).json({ error: 'Cannot delete current session. Use logout instead.' });
  }

  // Verify the session belongs to this user
  const session = db.prepare('SELECT sess FROM sessions WHERE sid = ?').get(sid);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    const sess = JSON.parse(session.sess);
    if (sess.userId !== req.session.userId) {
      return res.status(403).json({ error: 'Not your session' });
    }
  } catch {
    return res.status(500).json({ error: 'Invalid session data' });
  }

  db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
  res.json({ message: 'Session terminated' });
});

// Get login history
router.get('/login-history', loginHistoryLimiter, (req, res) => {
  const { limit = 20 } = req.query;

  const history = db.prepare(`
    SELECT ip_address, user_agent, success, created_at
    FROM login_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(req.session.userId, Math.min(parseInt(limit) || 20, 100));

  res.json(history.map(h => ({
    ipAddress: h.ip_address,
    userAgent: h.user_agent,
    success: Boolean(h.success),
    createdAt: h.created_at
  })));
});

export default router;
