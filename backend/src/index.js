import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import SqliteStore from 'better-sqlite3-session-store';
import rateLimit from 'express-rate-limit';
import db from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import gamesRoutes from './routes/games.js';
import adminRoutes from './routes/admin.js';
import { initCsrf, getCsrfToken, verifyCsrfToken } from './middleware/csrf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiter for static SPA fallback
const spaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 SPA index requests per windowMs
});

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Determine if we should use secure cookies (only for HTTPS)
const useSecureCookies = FRONTEND_URL.startsWith('https://');

// Session store using better-sqlite3
const BetterSqlite3Store = SqliteStore(session);
const sessionStore = new BetterSqlite3Store({
  client: db,
  expired: {
    clear: true,
    intervalMs: 900000 // 15 minutes
  }
});

// Middleware
// Parse allowed origins (comma-separated for multiple)
const allowedOrigins = FRONTEND_URL.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, also allow localhost variants and .local domains
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|[\w-]+\.local)(:\d+)?$/)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(express.json());

app.use(session({
  store: sessionStore,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'enigma.sid',
  cookie: {
    secure: useSecureCookies,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax'
  }
}));

console.log(`Cookie secure mode: ${useSecureCookies} (FRONTEND_URL: ${FRONTEND_URL})`);

// Initialize CSRF for all requests (creates secret in session if needed)
app.use(initCsrf);

// Rate limiting for API routes to mitigate brute-force and DoS attacks.
// Apply this before CSRF verification so that authorization logic is also rate-limited.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter);

// CSRF token endpoint (must be before verifyCsrfToken middleware)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: getCsrfToken(req) });
});

// Apply CSRF protection to all state-changing routes
app.use(verifyCsrfToken);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file serving for production Docker image
// When SERVE_STATIC is enabled, serve the built frontend from STATIC_PATH
const SERVE_STATIC = process.env.SERVE_STATIC === 'true';
const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname, '../../public');

if (SERVE_STATIC && existsSync(STATIC_PATH)) {
  console.log(`Serving static files from: ${STATIC_PATH}`);

  // Serve static files
  app.use(express.static(STATIC_PATH));

  // SPA fallback: serve index.html for any non-API routes
  app.get('*', spaLimiter, (req, res, next) => {
    // Don't intercept API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(STATIC_PATH, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Enigma backend running on port ${PORT}`);
  if (SERVE_STATIC) {
    console.log(`Frontend available at http://localhost:${PORT}`);
  }
});
