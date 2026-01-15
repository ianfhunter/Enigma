import csrf from 'csrf';

const tokens = new csrf();

// Initialize CSRF secret in session if not present
export function initCsrf(req, res, next) {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }
  next();
}

// Generate CSRF token
export function getCsrfToken(req) {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }
  return tokens.create(req.session.csrfSecret);
}

// Verify CSRF token
export function verifyCsrfToken(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for login and register (no authenticated session to hijack)
  // However, we'll still protect them for defense in depth
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  if (!req.session.csrfSecret) {
    return res.status(403).json({ error: 'CSRF secret not found in session' });
  }

  if (!tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

