/**
 * Pack Plugin Loader
 *
 * Scans pack directories for backend plugins and loads them.
 * Plugins can register routes, access the database, and integrate with auth.
 *
 * ⚠️ SECURITY WARNING: Community plugins run with backend access.
 * Only install plugins from trusted sources!
 */

import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the packs directory (frontend packs with optional backends)
const PACKS_DIR = join(__dirname, '../../../src/packs');

/**
 * Context passed to plugins for integration with Enigma
 */
export function createPluginContext(app, db) {
  return {
    // Express router for adding routes
    // Plugins should use router.get(), router.post(), etc.
    createRouter: () => {
      const { Router } = require('express');
      return Router();
    },

    // Database access (limited to plugin's own tables)
    db: {
      /**
       * Run a SQL query
       * @param {string} sql - SQL query (table names will be prefixed)
       * @param {Array} params - Query parameters
       */
      run: (sql, params = []) => {
        return db.prepare(sql).run(...params);
      },

      /**
       * Get a single row
       */
      get: (sql, params = []) => {
        return db.prepare(sql).get(...params);
      },

      /**
       * Get all matching rows
       */
      all: (sql, params = []) => {
        return db.prepare(sql).all(...params);
      },

      /**
       * Execute raw SQL (for migrations)
       */
      exec: (sql) => {
        return db.exec(sql);
      }
    },

    // Authentication helper
    requireAuth: (req, res, next) => {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    },

    // Get current user from session
    getCurrentUser: (req) => {
      return req.session?.userId ? { id: req.session.userId } : null;
    },
  };
}

/**
 * Load all pack plugins
 *
 * @param {Express} app - Express application
 * @param {Database} db - SQLite database instance
 * @returns {Promise<Array>} - Loaded plugins
 */
export async function loadPackPlugins(app, db) {
  const loadedPlugins = [];

  if (!existsSync(PACKS_DIR)) {
    console.log('No packs directory found, skipping plugin loading');
    return loadedPlugins;
  }

  const packDirs = readdirSync(PACKS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`\n🔌 Loading pack plugins...`);

  for (const packName of packDirs) {
    const pluginPath = join(PACKS_DIR, packName, 'backend', 'plugin.js');

    if (!existsSync(pluginPath)) {
      continue; // No backend for this pack
    }

    try {
      // Convert to file:// URL for Windows compatibility
      const pluginUrl = pathToFileURL(pluginPath).href;
      const pluginModule = await import(pluginUrl);
      const plugin = pluginModule.default;

      if (!plugin || !plugin.name) {
        console.warn(`⚠️  Invalid plugin in ${packName}: missing name`);
        continue;
      }

      console.log(`   📦 Loading plugin: ${plugin.name}`);

      // Create plugin context
      const context = createPluginContext(app, db);

      // Run migrations if defined
      if (plugin.migrations && Array.isArray(plugin.migrations)) {
        await runPluginMigrations(plugin, db);
      }

      // Register plugin routes
      if (plugin.register && typeof plugin.register === 'function') {
        const router = (await import('express')).Router();

        // Call plugin's register function with router and context
        await plugin.register(router, context);

        // Mount plugin routes under /api/packs/{packName}
        const mountPath = `/api/packs/${packName}`;
        app.use(mountPath, router);
        console.log(`   ✅ Mounted routes at ${mountPath}`);
      }

      loadedPlugins.push({
        name: plugin.name,
        pack: packName,
        version: plugin.version || '1.0.0'
      });

    } catch (error) {
      console.error(`   ❌ Failed to load plugin from ${packName}:`, error.message);
    }
  }

  if (loadedPlugins.length > 0) {
    console.log(`\n✅ Loaded ${loadedPlugins.length} pack plugin(s)\n`);
  } else {
    console.log(`   No pack plugins found\n`);
  }

  return loadedPlugins;
}

/**
 * Run database migrations for a plugin
 */
async function runPluginMigrations(plugin, db) {
  const migrationsTable = `_plugin_migrations_${plugin.name.replace(/[^a-z0-9]/gi, '_')}`;

  // Create migrations tracking table for this plugin
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get applied migrations
  const applied = db.prepare(`SELECT version FROM ${migrationsTable}`).all();
  const appliedVersions = new Set(applied.map(r => r.version));

  // Run pending migrations
  for (const migration of plugin.migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    console.log(`      Running migration v${migration.version} for ${plugin.name}`);

    try {
      db.exec(migration.up);
      db.prepare(`INSERT INTO ${migrationsTable} (version) VALUES (?)`).run(migration.version);
    } catch (error) {
      console.error(`      Migration v${migration.version} failed:`, error.message);
      throw error;
    }
  }
}

export default { loadPackPlugins, createPluginContext };
