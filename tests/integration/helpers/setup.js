/**
 * Integration Test Setup Helper
 * 
 * Provides utilities for starting/stopping the Express server
 * and managing test databases for integration tests.
 */

import { existsSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create a test server instance
 * Uses environment variables to configure isolated test environment
 * @param {Object} options - Server configuration options
 * @returns {Promise<{app: Express, server: http.Server, db: Database, cleanup: Function}>}
 */
export async function createTestServer(options = {}) {
  const {
    port = 0, // 0 = random port
  } = options;

  // Create temporary directories
  const testDir = join(tmpdir(), `enigma-integration-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const testDbPath = join(testDir, 'test.db');
  const testPluginsDir = join(testDir, '.plugins');
  const testPluginDataDir = join(testDir, 'data', 'plugins');

  mkdirSync(testDir, { recursive: true });
  mkdirSync(testPluginsDir, { recursive: true });
  mkdirSync(dirname(testDbPath), { recursive: true });
  mkdirSync(testPluginDataDir, { recursive: true });

  // Save original environment variables
  const originalEnv = {
    DB_PATH: process.env.DB_PATH,
    PLUGINS_DIR: process.env.PLUGINS_DIR,
    PLUGIN_DATA_DIR: process.env.PLUGIN_DATA_DIR,
    DEV: process.env.DEV,
    PORT: process.env.PORT,
  };

  // Set test environment variables
  process.env.DB_PATH = testDbPath;
  process.env.PLUGINS_DIR = testPluginsDir;
  process.env.PLUGIN_DATA_DIR = testPluginDataDir;
  process.env.DEV = '1'; // Disable rate limiting in tests
  if (port > 0) {
    process.env.PORT = String(port);
  }

  // Clear module cache for db.js and index.js to pick up new env vars
  // Note: In Node.js ESM, we can't easily clear cache, so we use env vars instead
  
  // Import server initialization (it will use the env vars we just set)
  // Path: tests/integration/helpers/ -> project root = ../../../
  // Then project root -> backend/src/db.js = backend/src/db.js
  // Resolve the absolute path to the backend db module
  const projectRoot = join(__dirname, '../../..');
  const dbModulePath = join(projectRoot, 'backend/src/db.js');
  const dbModuleUrl = `file://${dbModulePath}`;
  const { default: db } = await import(dbModuleUrl);
  
  // Now import and create the Express app from index.js
  // We need to manually create the app since index.js starts the server
  const express = (await import('express')).default;
  const app = express();

  // Import middleware and routes setup
  const session = (await import('express-session')).default;
  const SqliteStore = (await import('better-sqlite3-session-store')).default;
  const cors = (await import('cors')).default;

  // Session store
  const BetterSqlite3Store = SqliteStore(session);
  const sessionStore = new BetterSqlite3Store({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000
    }
  });

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, direct API calls in tests)
      if (!origin) return callback(null, true);

      // In test environment, allow localhost variants and .local domains
      // This is more restrictive than origin: true but still allows test scenarios
      if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|[\w-]+\.local)(:\d+)?$/)) {
        return callback(null, true);
      }

      // Block other origins for security
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true
  }));
  app.use(express.json());

  app.use(session({
    store: sessionStore,
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    name: 'enigma.sid',
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));

  // CSRF middleware
  const csrfModulePath = join(projectRoot, 'backend/src/middleware/csrf.js');
  const { initCsrf, getCsrfToken, verifyCsrfToken } = await import(`file://${csrfModulePath}`);
  app.use(initCsrf);
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: getCsrfToken(req) });
  });
  app.use(verifyCsrfToken);

  // Check if bcrypt can be loaded before importing routes that depend on it
  let bcryptAvailable = true;
  try {
    const bcrypt = await import('bcrypt');
    // Try to use it to ensure it's actually working
    await bcrypt.default.hash('test', 1);
  } catch (e) {
    if (e.message && (e.message.includes('libc.musl') || e.message.includes('shared object'))) {
      bcryptAvailable = false;
    } else {
      // Re-throw if it's a different error
      throw e;
    }
  }

  // Import routes (these will fail if bcrypt is not available, but we check above)
  const authRoutesModulePath = join(projectRoot, 'backend/src/routes/auth.js');
  let authRoutes;
  let communitySourcesRoutes;
  
  if (bcryptAvailable) {
    const authRoutesModule = await import(`file://${authRoutesModulePath}`);
    authRoutes = authRoutesModule.default;
    const communitySourcesRoutesModulePath = join(projectRoot, 'backend/src/routes/community-sources.js');
    const communitySourcesRoutesModule = await import(`file://${communitySourcesRoutesModulePath}`);
    communitySourcesRoutes = communitySourcesRoutesModule.default;
  } else {
    // Create mock routes that return errors
    const Router = (await import('express')).Router;
    authRoutes = Router();
    authRoutes.all('*', (req, res) => {
      res.status(503).json({ error: 'bcrypt not available (musl/glibc mismatch)' });
    });
    communitySourcesRoutes = Router();
    communitySourcesRoutes.all('*', (req, res) => {
      res.status(503).json({ error: 'bcrypt not available (musl/glibc mismatch)' });
    });
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/community-sources', communitySourcesRoutes);

  // Load plugins
  const loaderModulePath = join(projectRoot, 'backend/src/plugins/loader.js');
  const { loadPackPlugins } = await import(`file://${loaderModulePath}`);
  await loadPackPlugins(app, db).catch(err => {
    console.warn('Failed to load pack plugins in test:', err.message);
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  let server;
  await new Promise((resolve, reject) => {
    server = app.listen(port, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const serverPort = server.address().port;
  const baseUrl = `http://localhost:${serverPort}`;

  // Cleanup function
  const cleanup = async () => {
    return new Promise((resolve) => {
      server.close(() => {
        db.close();
        
        // Restore original env
        Object.entries(originalEnv).forEach(([key, value]) => {
          if (value === undefined) {
            delete process.env[key];
          } else {
            process.env[key] = value;
          }
        });

        // Clean up temporary directory
        if (existsSync(testDir)) {
          rmSync(testDir, { recursive: true, force: true });
        }

        resolve();
      });
    });
  };

  return {
    app,
    server,
    db,
    baseUrl,
    cleanup,
    testDir,
    testDbPath,
    testPluginsDir,
    testPluginDataDir,
  };
}

/**
 * Make an authenticated request with session cookies
 */
export function createTestClient(baseUrl) {
  const cookies = new Map();

  async function request(method, path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Get CSRF token if needed
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      try {
        const csrfRes = await fetch(`${baseUrl}/api/csrf-token`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Cookie: Array.from(cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; '),
          },
        });
        if (csrfRes.ok) {
          const csrfData = await csrfRes.json();
          headers['X-CSRF-Token'] = csrfData.csrfToken;
        }
      } catch (e) {
        // CSRF token fetch failed, continue anyway
      }
    }

    // Include cookies
    const cookieHeader = Array.from(cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    // Extract and store cookies
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      const cookieStrings = Array.isArray(setCookieHeaders) 
        ? setCookieHeaders 
        : setCookieHeaders.split(',');

      cookieStrings.forEach(cookieStr => {
        const [nameValue] = cookieStr.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          cookies.set(name.trim(), value.trim());
        }
      });
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    return {
      status: response.status,
      headers: response.headers,
      data,
      ok: response.ok,
    };
  }

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    put: (path, body, options) => request('PUT', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options),
    request,
    cookies: () => Array.from(cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; '),
  };
}
