/**
 * Pack Plugin Loader
 *
 * Scans pack directories for backend plugins and loads them.
 * Plugins can register routes, access their own isolated database, and integrate with auth.
 * Supports hot-reloading of plugins without server restart.
 *
 * 🔒 SECURITY: Each plugin gets its own isolated SQLite database.
 *    Plugins CANNOT access the core database (users, sessions, etc.)
 *    Read-only core data is available via explicit APIs (context.core.*)
 *
 * 🛡️ PROTECTION: Plugins are isolated with:
 *    - Error boundaries (crashes don't affect other plugins)
 *    - Rate limiting (100 requests/minute per plugin)
 *    - Database size limits (50MB max per plugin)
 */

import { readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { Router } from 'express';
import Database from 'better-sqlite3';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the packs directory (frontend packs with optional backends)
// In Docker, packs are mounted at /app/packs via docker-compose
// In development, they're at ../../../src/packs relative to this file
const DOCKER_PACKS_DIR = '/app/packs';
const DEV_PACKS_DIR = join(__dirname, '../../../src/packs');
const PACKS_DIR = existsSync(DOCKER_PACKS_DIR) ? DOCKER_PACKS_DIR : DEV_PACKS_DIR;

// Path to the plugins directory (community sources cloned from GitHub)
// In Docker, plugins are mounted at /app/.plugins via docker-compose
// In development, they're at ../../../.plugins relative to this file
const DOCKER_PLUGINS_DIR = '/app/.plugins';
const DEV_PLUGINS_DIR = join(__dirname, '../../../.plugins');
const EXTERNAL_PLUGINS_DIR = process.env.PLUGINS_DIR ||
  (existsSync(DOCKER_PLUGINS_DIR) ? DOCKER_PLUGINS_DIR : DEV_PLUGINS_DIR);

// Plugin data directory for isolated databases
const PLUGIN_DATA_DIR = process.env.PLUGIN_DATA_DIR || './data/plugins';

// Check if rate limiting should be disabled (development mode)
const isDevMode = process.env.DEV === '1' || process.env.DEV === 'true';

// Plugin limits
const MAX_PLUGIN_DB_SIZE = parseInt(process.env.MAX_PLUGIN_DB_SIZE || '52428800', 10); // 50MB default
const PLUGIN_RATE_LIMIT_WINDOW = parseInt(process.env.PLUGIN_RATE_LIMIT_WINDOW || '60000', 10); // 1 minute
const PLUGIN_RATE_LIMIT_MAX = parseInt(process.env.PLUGIN_RATE_LIMIT_MAX || '100', 10); // 100 requests per window

/**
 * Plugin Manager - handles dynamic loading/reloading of pack plugins
 */
class PluginManager {
  constructor() {
    this.app = null;
    this.coreDb = null;
    this.loadedPlugins = new Map(); // packName -> plugin info
    this.pluginDatabases = new Map(); // packName -> Database instance
    this.pluginRouter = Router(); // Dynamic router for all plugins
    this.pluginRateLimiters = new Map(); // packName -> rate limiter
    this.isInitialized = false;
  }

  /**
   * Initialize the plugin manager
   * @param {Express} app - Express application
   * @param {Database} db - SQLite database instance (core database)
   */
  initialize(app, db) {
    this.app = app;
    this.coreDb = db;

    // Ensure plugin data directory exists
    mkdirSync(PLUGIN_DATA_DIR, { recursive: true });

    // Add a special reload endpoint before the dynamic router
    // This is publicly accessible (no auth required) but rate-limited by the global limiter
    app.post('/api/packs/_reload', async (req, res) => {
      try {
        console.log('🔄 Pack reload requested via API...');
        const plugins = await this.loadPlugins();
        res.json({
          success: true,
          message: `Loaded ${plugins.length} plugin(s)`,
          plugins: plugins.map(p => ({ name: p.name, pack: p.pack, version: p.version }))
        });
      } catch (error) {
        console.error('Plugin reload failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Add endpoint to check plugin status
    app.get('/api/packs/_status', (req, res) => {
      res.json({
        loaded: this.loadedPlugins.size,
        plugins: Array.from(this.loadedPlugins.values()).map(p => ({
          name: p.name,
          pack: p.pack,
          version: p.version,
          hasIsolatedDb: p.hasIsolatedDb,
          dbSize: p.dbSize
        }))
      });
    });

    // Mount the dynamic plugin router at /api/packs
    // All plugin routes will be handled through this router
    app.use('/api/packs', (req, res, next) => {
      // Delegate to the current plugin router
      this.pluginRouter(req, res, next);
    });

    this.isInitialized = true;
  }

  /**
   * Get or create a rate limiter for a plugin
   * @param {string} packName - The pack ID
   * @returns {Function} - Express rate limiter middleware
   */
  getPluginRateLimiter(packName) {
    if (this.pluginRateLimiters.has(packName)) {
      return this.pluginRateLimiters.get(packName);
    }

    const limiter = rateLimit({
      windowMs: PLUGIN_RATE_LIMIT_WINDOW,
      max: PLUGIN_RATE_LIMIT_MAX,
      message: {
        error: `Too many requests to plugin ${packName}. Please try again later.`,
        retryAfter: Math.ceil(PLUGIN_RATE_LIMIT_WINDOW / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit per user session or IP
        return req.session?.userId || req.ip;
      },
      skip: () => isDevMode,
    });

    this.pluginRateLimiters.set(packName, limiter);
    return limiter;
  }

  /**
   * Check plugin database size and throw if over limit
   * @param {string} packName - The pack ID
   * @throws {Error} If database exceeds size limit
   */
  checkDatabaseSize(packName) {
    const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');
    const dbPath = join(PLUGIN_DATA_DIR, `${safeName}.db`);

    if (!existsSync(dbPath)) {
      return 0;
    }

    const stats = statSync(dbPath);
    if (stats.size > MAX_PLUGIN_DB_SIZE) {
      throw new Error(
        `Plugin ${packName} database exceeds size limit ` +
        `(${Math.round(stats.size / 1024 / 1024)}MB > ${Math.round(MAX_PLUGIN_DB_SIZE / 1024 / 1024)}MB)`
      );
    }
    return stats.size;
  }

  /**
   * Get the current database size for a plugin
   * @param {string} packName - The pack ID
   * @returns {number} - Size in bytes
   */
  getPluginDatabaseSize(packName) {
    const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');
    const dbPath = join(PLUGIN_DATA_DIR, `${safeName}.db`);

    if (!existsSync(dbPath)) {
      return 0;
    }

    try {
      return statSync(dbPath).size;
    } catch {
      return 0;
    }
  }

  /**
   * Get or create an isolated database for a plugin
   * @param {string} packName - The pack ID
   * @returns {Database} - Isolated SQLite database instance
   */
  getPluginDatabase(packName) {
    // Sanitize pack name for filesystem safety
    const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');

    if (this.pluginDatabases.has(packName)) {
      return this.pluginDatabases.get(packName);
    }

    const dbPath = join(PLUGIN_DATA_DIR, `${safeName}.db`);
    console.log(`      🗄️  Creating isolated database: ${dbPath}`);

    const pluginDb = new Database(dbPath);
    pluginDb.pragma('foreign_keys = ON');

    this.pluginDatabases.set(packName, pluginDb);
    return pluginDb;
  }

  /**
   * Close a plugin's database connection
   * @param {string} packName - The pack ID
   */
  closePluginDatabase(packName) {
    if (this.pluginDatabases.has(packName)) {
      const db = this.pluginDatabases.get(packName);
      try {
        db.close();
      } catch (e) {
        // Already closed or error, ignore
      }
      this.pluginDatabases.delete(packName);
    }
  }

  /**
   * Create an isolated context object for a plugin
   * @param {string} packName - The pack ID
   * @returns {Object} - Plugin context with isolated db and core APIs
   */
  createContext(packName) {
    const pluginDb = this.getPluginDatabase(packName);
    const coreDb = this.coreDb;
    const self = this;

    return {
      /**
       * Plugin's isolated database - CANNOT access core tables
       * All tables created here are isolated to this plugin
       * Includes size limit checking on write operations
       */
      db: {
        run: (sql, params = []) => {
          self.checkDatabaseSize(packName);
          return pluginDb.prepare(sql).run(...params);
        },
        get: (sql, params = []) => pluginDb.prepare(sql).get(...params),
        all: (sql, params = []) => pluginDb.prepare(sql).all(...params),
        exec: (sql) => {
          self.checkDatabaseSize(packName);
          return pluginDb.exec(sql);
        }
      },

      /**
       * Read-only access to core data via explicit APIs
       * Plugins CANNOT directly query core tables
       */
      core: {
        /**
         * Get user info by ID (limited fields for privacy)
         * @param {number} userId - User ID
         * @returns {Object|null} - { id, username, displayName } or null
         */
        getUser: (userId) => {
          const user = coreDb.prepare(
            'SELECT id, username, display_name FROM users WHERE id = ?'
          ).get(userId);
          return user ? {
            id: user.id,
            username: user.username,
            displayName: user.display_name || user.username
          } : null;
        },

        /**
         * Get multiple users by IDs (limited fields)
         * @param {number[]} userIds - Array of user IDs
         * @returns {Object[]} - Array of { id, username, displayName }
         */
        getUsers: (userIds) => {
          if (!userIds || userIds.length === 0) return [];
          const placeholders = userIds.map(() => '?').join(',');
          const users = coreDb.prepare(
            `SELECT id, username, display_name FROM users WHERE id IN (${placeholders})`
          ).all(...userIds);
          return users.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.display_name || u.username
          }));
        },

        /**
         * Get a map of user IDs to usernames for efficient lookups
         * @param {number[]} userIds - Array of user IDs
         * @returns {Map<number, string>} - Map of userId -> username
         */
        getUsernameMap: (userIds) => {
          if (!userIds || userIds.length === 0) return new Map();
          const placeholders = userIds.map(() => '?').join(',');
          const users = coreDb.prepare(
            `SELECT id, username FROM users WHERE id IN (${placeholders})`
          ).all(...userIds);
          return new Map(users.map(u => [u.id, u.username]));
        },

        /**
         * Check if a user exists
         * @param {number} userId - User ID
         * @returns {boolean}
         */
        userExists: (userId) => {
          const result = coreDb.prepare(
            'SELECT 1 FROM users WHERE id = ?'
          ).get(userId);
          return !!result;
        },

        /**
         * Search users by username prefix (for autocomplete, limited to 10)
         * @param {string} prefix - Username prefix
         * @returns {Object[]} - Array of { id, username }
         */
        searchUsers: (prefix) => {
          if (!prefix || prefix.length < 2) return [];
          const users = coreDb.prepare(
            'SELECT id, username FROM users WHERE username LIKE ? LIMIT 10'
          ).all(`${prefix}%`);
          return users.map(u => ({ id: u.id, username: u.username }));
        }
      },

      /**
       * Authentication middleware - require user to be logged in
       */
      requireAuth: (req, res, next) => {
        if (!req.session?.userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        next();
      },

      /**
       * Get current logged-in user info
       * @param {Request} req - Express request
       * @returns {Object|null} - { id } or null
       */
      getCurrentUser: (req) => {
        return req.session?.userId ? { id: req.session.userId } : null;
      },
    };
  }

  /**
   * Create error boundary middleware for a plugin
   * Catches errors and prevents them from crashing the server
   * @param {string} packName - The pack ID
   * @returns {Function} - Express error handling middleware
   */
  createErrorBoundary(packName) {
    return (err, req, res, next) => {
      console.error(`❌ Plugin ${packName} error:`, err.message);
      console.error(err.stack);

      // Don't expose internal error details to clients
      res.status(500).json({
        error: 'Plugin error',
        plugin: packName,
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
      });
    };
  }

  /**
   * Wrap a router to catch synchronous errors
   * @param {Router} router - Express router
   * @param {string} packName - The pack ID
   * @returns {Router} - Wrapped router with error catching
   */
  wrapRouterWithErrorHandling(router, packName) {
    const wrappedRouter = Router();

    // Middleware that wraps all route handlers to catch async errors
    wrappedRouter.use((req, res, next) => {
      // Store original json method to catch response errors
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        try {
          return originalJson(data);
        } catch (err) {
          console.error(`❌ Plugin ${packName} response error:`, err.message);
          if (!res.headersSent) {
            return originalJson({ error: 'Plugin response error' });
          }
        }
      };
      next();
    });

    // Mount the plugin's router
    wrappedRouter.use(router);

    // Error handler for this plugin (catches both sync and async errors)
    wrappedRouter.use(this.createErrorBoundary(packName));

    return wrappedRouter;
  }

  /**
   * Check if a pack is installed (in the database)
   * @param {string} packName - The pack directory name
   * @returns {boolean} - Whether the pack is installed
   */
  isPackInstalled(packName) {
    try {
      const result = this.coreDb.prepare(
        'SELECT pack_id FROM installed_packs WHERE pack_id = ?'
      ).get(packName);
      return !!result;
    } catch (error) {
      // Table might not exist yet during initial setup
      console.warn(`Could not check installation status for ${packName}:`, error.message);
      return false;
    }
  }

  /**
   * Get all installed pack IDs
   * @returns {Set<string>} - Set of installed pack IDs
   */
  getInstalledPackIds() {
    try {
      const results = this.coreDb.prepare('SELECT pack_id FROM installed_packs').all();
      return new Set(results.map(r => r.pack_id));
    } catch (error) {
      console.warn('Could not get installed packs:', error.message);
      return new Set();
    }
  }

  /**
   * Load or reload all plugins
   * Only loads plugins for packs that are installed in the database
   * @returns {Promise<Array>} - List of loaded plugins
   */
  async loadPlugins() {
    if (!this.isInitialized) {
      throw new Error('PluginManager not initialized. Call initialize() first.');
    }

    // Create a fresh router for plugins
    const newRouter = Router();
    const newPlugins = new Map();

    // Get list of installed packs from database BEFORE checking directory
    const installedPacks = this.getInstalledPackIds();

    // Close databases for uninstalled plugins
    for (const [packName] of this.pluginDatabases) {
      if (!installedPacks.has(packName)) {
        console.log(`   🗑️  Closing database for uninstalled pack: ${packName}`);
        this.closePluginDatabase(packName);
      }
    }

    // Clear rate limiters for uninstalled plugins
    for (const [packName] of this.pluginRateLimiters) {
      if (!installedPacks.has(packName)) {
        this.pluginRateLimiters.delete(packName);
      }
    }

    // Collect pack directories from both built-in packs and external plugins
    let packDirs = [];
    const packSources = [];

    if (existsSync(PACKS_DIR)) {
      const builtInDirs = readdirSync(PACKS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({ name: dirent.name, path: join(PACKS_DIR, dirent.name) }));
      packDirs.push(...builtInDirs);
      packSources.push(`built-in: ${PACKS_DIR}`);
    }

    if (existsSync(EXTERNAL_PLUGINS_DIR)) {
      const externalDirs = readdirSync(EXTERNAL_PLUGINS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({ name: dirent.name, path: join(EXTERNAL_PLUGINS_DIR, dirent.name) }));
      packDirs.push(...externalDirs);
      packSources.push(`external: ${EXTERNAL_PLUGINS_DIR}`);
    }

    if (packDirs.length === 0) {
      console.log('No pack directories found, skipping plugin loading');
      this.pluginRouter = newRouter;
      this.loadedPlugins = newPlugins;
      return [];
    }

    console.log(`\n🔌 Loading pack plugins...`);
    console.log(`   Sources: ${packSources.join(', ')}`);
    console.log(`   Installed packs: ${installedPacks.size > 0 ? [...installedPacks].join(', ') : '(none)'}`);
    console.log(`   🔒 Database isolation: ENABLED`);
    console.log(`   🛡️  Rate limiting: ${PLUGIN_RATE_LIMIT_MAX} req/${PLUGIN_RATE_LIMIT_WINDOW / 1000}s per plugin`);
    console.log(`   📦 Max DB size: ${Math.round(MAX_PLUGIN_DB_SIZE / 1024 / 1024)}MB per plugin`);

    for (const { name: packName, path: packPath } of packDirs) {
      const pluginPath = join(packPath, 'backend', 'plugin.js');

      if (!existsSync(pluginPath)) {
        continue; // No backend for this pack
      }

      // Only load plugins for installed packs
      if (!installedPacks.has(packName)) {
        console.log(`   ⏭️  Skipping uninstalled pack: ${packName}`);
        continue;
      }

      try {
        // Check database size before loading
        const dbSize = this.checkDatabaseSize(packName);

        // Convert to file:// URL and add cache-busting query param for hot reload
        const pluginUrl = pathToFileURL(pluginPath).href + `?t=${Date.now()}`;
        const pluginModule = await import(pluginUrl);
        const plugin = pluginModule.default;

        if (!plugin || !plugin.name) {
          console.warn(`⚠️  Invalid plugin in ${packName}: missing name`);
          continue;
        }

        console.log(`   📦 Loading plugin: ${plugin.name}`);

        // Create isolated plugin context
        const context = this.createContext(packName);

        // Run migrations on the plugin's isolated database
        if (plugin.migrations && Array.isArray(plugin.migrations)) {
          await this.runMigrations(plugin, packName);
        }

        // Register plugin routes
        if (plugin.register && typeof plugin.register === 'function') {
          const packRouter = Router();

          // Call plugin's register function with router and context
          await plugin.register(packRouter, context);

          // Wrap with error handling
          const safeRouter = this.wrapRouterWithErrorHandling(packRouter, packName);

          // Get rate limiter for this plugin
          const rateLimiter = this.getPluginRateLimiter(packName);

          // Mount with rate limiting and error boundary
          newRouter.use(`/${packName}`, rateLimiter, safeRouter);
          console.log(`   ✅ Mounted routes at /api/packs/${packName} (rate limited, error isolated)`);
        }

        newPlugins.set(packName, {
          name: plugin.name,
          pack: packName,
          version: plugin.version || '1.0.0',
          hasBackend: true,
          hasIsolatedDb: true,
          dbSize: this.getPluginDatabaseSize(packName)
        });

      } catch (error) {
        console.error(`   ❌ Failed to load plugin from ${packName}:`, error.message);
      }
    }

    // Swap the routers atomically
    this.pluginRouter = newRouter;
    this.loadedPlugins = newPlugins;

    if (newPlugins.size > 0) {
      console.log(`\n✅ Loaded ${newPlugins.size} pack plugin(s) with isolated databases\n`);
    } else {
      console.log(`   No pack plugins found\n`);
    }

    return Array.from(newPlugins.values());
  }

  /**
   * Run database migrations for a plugin on its ISOLATED database
   * @param {Object} plugin - Plugin object with migrations
   * @param {string} packName - Pack ID for getting the isolated db
   */
  async runMigrations(plugin, packName) {
    const pluginDb = this.getPluginDatabase(packName);
    const migrationsTable = '_plugin_migrations';

    // Create migrations tracking table in the plugin's isolated database
    pluginDb.exec(`
      CREATE TABLE IF NOT EXISTS ${migrationsTable} (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const applied = pluginDb.prepare(`SELECT version FROM ${migrationsTable}`).all();
    const appliedVersions = new Set(applied.map(r => r.version));

    // Run pending migrations
    for (const migration of plugin.migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      console.log(`      Running migration v${migration.version} for ${plugin.name}`);

      try {
        pluginDb.exec(migration.up);
        pluginDb.prepare(`INSERT INTO ${migrationsTable} (version) VALUES (?)`).run(migration.version);
      } catch (error) {
        console.error(`      Migration v${migration.version} failed:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Get list of currently loaded plugins
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if a specific plugin is loaded
   */
  isPluginLoaded(packName) {
    return this.loadedPlugins.has(packName);
  }

  /**
   * Delete a plugin's isolated database file
   * Used when permanently uninstalling a pack
   * @param {string} packName - Pack ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deletePluginData(packName) {
    this.closePluginDatabase(packName);
    this.pluginRateLimiters.delete(packName);

    const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');
    const dbPath = join(PLUGIN_DATA_DIR, `${safeName}.db`);

    const { unlink } = await import('fs/promises');
    try {
      await unlink(dbPath);
      console.log(`   🗑️  Deleted plugin database: ${dbPath}`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`   ⚠️  Could not delete plugin database: ${error.message}`);
      }
      return false;
    }
  }
}

// Singleton instance
const pluginManager = new PluginManager();

/**
 * Initialize and load plugins (call once at startup)
 *
 * @param {Express} app - Express application
 * @param {Database} db - SQLite database instance (core database)
 * @returns {Promise<Array>} - Loaded plugins
 */
export async function loadPackPlugins(app, db) {
  pluginManager.initialize(app, db);
  return pluginManager.loadPlugins();
}

/**
 * Reload all plugins (can be called anytime)
 * @returns {Promise<Array>} - Loaded plugins
 */
export async function reloadPackPlugins() {
  return pluginManager.loadPlugins();
}

/**
 * Get the plugin manager instance
 */
export function getPluginManager() {
  return pluginManager;
}

/**
 * Delete plugin data (for use in uninstall routes)
 * @param {string} packName - Pack ID
 * @returns {Promise<boolean>} - True if deleted
 */
export async function deletePluginData(packName) {
  return pluginManager.deletePluginData(packName);
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use createContext on pluginManager instead
 */
export function createPluginContext(app, db) {
  console.warn('createPluginContext is deprecated. Plugins now use isolated databases.');
  return pluginManager.createContext('legacy');
}

export default {
  loadPackPlugins,
  reloadPackPlugins,
  getPluginManager,
  deletePluginData,
  createPluginContext
};
