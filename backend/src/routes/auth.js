import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const SALT_ROUNDS = 12;

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 registration requests per windowMs
  message: { error: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Check if this is the first user (will become admin)
function isFirstUser() {
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return result.count === 0;
}

// Log login attempt
function logLogin(userId, req, success = true) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  db.prepare(`
    INSERT INTO login_history (user_id, ip_address, user_agent, success)
    VALUES (?, ?, ?, ?)
  `).run(userId, ip, userAgent, success ? 1 : 0);
}

// Register new user
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, password, displayName, email } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be 3-32 characters' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // First user becomes admin
    const role = isFirstUser() ? 'admin' : 'user';

    // Create user
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, passwordHash, displayName || username, email || null, role);

    const userId = result.lastInsertRowid;

    // Create default settings
    db.prepare(`
      INSERT INTO user_settings (user_id)
      VALUES (?)
    `).run(userId);

    // Create session
    req.session.userId = userId;
    req.session.role = role;

    // Log successful registration as a login
    logLogin(userId, req, true);

    res.status(201).json({
      id: userId,
      username,
      displayName: displayName || username,
      email: email || null,
      role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = db.prepare(`
      SELECT id, username, password_hash, display_name, email, role, created_at
      FROM users WHERE username = ?
    `).get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Log failed login attempt
      logLogin(user.id, req, false);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create session
    req.session.userId = user.id;
    req.session.role = user.role;

    // Log successful login
    logLogin(user.id, req, true);

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('enigma.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, display_name, email, role, created_at
    FROM users WHERE id = ?
  `).get(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  });
});

export default router;
