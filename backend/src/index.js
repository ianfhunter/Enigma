import express from 'express';
import session from 'express-session';
import cors from 'cors';
import SqliteStore from 'better-sqlite3-session-store';
import db from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import gamesRoutes from './routes/games.js';
import adminRoutes from './routes/admin.js';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Enigma backend running on port ${PORT}`);
});
