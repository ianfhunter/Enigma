// Authentication middleware
import db from '../db.js';

const NO_AUTH_USERNAME = 'noauth';
const NO_AUTH_DISPLAY_NAME = 'No Auth User';

function isNoAuthEnabled() {
  return process.env.NO_AUTH === '1' || process.env.NO_AUTH === 'true';
}

function ensureNoAuthUser() {
  const user = db.prepare('SELECT id, role FROM users WHERE username = ?').get(NO_AUTH_USERNAME);
  if (user) {
    return user;
  }

  const result = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, role)
    VALUES (?, ?, ?, ?)
  `).run(NO_AUTH_USERNAME, 'no-auth', NO_AUTH_DISPLAY_NAME, 'admin');

  const userId = result.lastInsertRowid;

  db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);

  return { id: userId, role: 'admin' };
}

function applyNoAuthSession(req) {
  const user = ensureNoAuthUser();
  if (!req.session) {
    req.session = {};
  }
  req.session.userId = user.id;
  req.session.role = user.role;
}

export function requireAuth(req, res, next) {
  if (isNoAuthEnabled()) {
    applyNoAuthSession(req);
    return next();
  }

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (isNoAuthEnabled()) {
    applyNoAuthSession(req);
    return next();
  }

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
