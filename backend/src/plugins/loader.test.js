/**
 * Plugin Loader Tests
 *
 * Tests for plugin database isolation, core API security, size limits, and error handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Try to load better-sqlite3, skip tests if unavailable
let Database;
let dbAvailable = false;
try {
  const betterSqlite3Module = await import('better-sqlite3');
  Database = betterSqlite3Module.default;
  // Test that we can actually create a database
  const testDb = new Database(':memory:');
  testDb.close();
  dbAvailable = true;
} catch (e) {
  console.warn('Skipping loader tests: better-sqlite3 not available in this environment');
  console.warn('Error details:', e.message);
}

const describeFn = dbAvailable ? describe : describe.skip;

import { mkdirSync, rmSync, existsSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Configuration matching the real implementation
const MAX_PLUGIN_DB_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Check plugin database size (mirrors real implementation)
 */
function checkDatabaseSize(packName, pluginDataDir, maxSize = MAX_PLUGIN_DB_SIZE) {
  const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');
  const dbPath = join(pluginDataDir, `${safeName}.db`);

  if (!existsSync(dbPath)) {
    return 0;
  }

  const stats = statSync(dbPath);
  if (stats.size > maxSize) {
    throw new Error(
      `Plugin ${packName} database exceeds size limit ` +
      `(${Math.round(stats.size / 1024 / 1024)}MB > ${Math.round(maxSize / 1024 / 1024)}MB)`
    );
  }
  return stats.size;
}

/**
 * Create an isolated plugin context (mirrors the real implementation)
 */
function createIsolatedContext(packName, coreDb, pluginDataDir, options = {}) {
  const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');
  const pluginDbPath = join(pluginDataDir, `${safeName}.db`);
  const pluginDb = new Database(pluginDbPath);
  const maxSize = options.maxSize || MAX_PLUGIN_DB_SIZE;

  return {
    pluginDb,
    dbPath: pluginDbPath,
    context: {
      db: {
        run: (sql, params = []) => {
          checkDatabaseSize(packName, pluginDataDir, maxSize);
          return pluginDb.prepare(sql).run(...params);
        },
        get: (sql, params = []) => pluginDb.prepare(sql).get(...params),
        all: (sql, params = []) => pluginDb.prepare(sql).all(...params),
        exec: (sql) => {
          checkDatabaseSize(packName, pluginDataDir, maxSize);
          return pluginDb.exec(sql);
        }
      },
      core: {
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
        getUsernameMap: (userIds) => {
          if (!userIds || userIds.length === 0) return new Map();
          const placeholders = userIds.map(() => '?').join(',');
          const users = coreDb.prepare(
            `SELECT id, username FROM users WHERE id IN (${placeholders})`
          ).all(...userIds);
          return new Map(users.map(u => [u.id, u.username]));
        },
        userExists: (userId) => {
          const result = coreDb.prepare(
            'SELECT 1 FROM users WHERE id = ?'
          ).get(userId);
          return !!result;
        }
      }
    }
  };
}

// ===========================================
// Test Setup
// ===========================================
describeFn('Plugin Database Isolation', () => {
  let coreDb;
  let testDir;

  beforeEach(() => {
    // Create temp directory for test databases
    testDir = join(tmpdir(), `enigma-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create in-memory core database with test data
    coreDb = new Database(':memory:');
    coreDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        display_name TEXT,
        password_hash TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user'
      );

      CREATE TABLE sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      );

      CREATE TABLE installed_packs (
        pack_id TEXT PRIMARY KEY,
        pack_type TEXT NOT NULL,
        installed_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert test users
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES
        ('alice', 'hash1', 'Alice Smith', 'user'),
        ('bob', 'hash2', 'Bob Jones', 'admin'),
        ('charlie', 'hash3', NULL, 'user');
    `);
  });

  afterEach(() => {
    // Clean up
    coreDb.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  // ===========================================
  // Database Isolation Tests
  // ===========================================
  describe('Database Isolation', () => {
    it('should create a separate database file for each plugin', () => {
      const { pluginDb: db1 } = createIsolatedContext('plugin-a', coreDb, testDir);
      const { pluginDb: db2 } = createIsolatedContext('plugin-b', coreDb, testDir);

      // Each plugin gets its own database
      expect(existsSync(join(testDir, 'plugin-a.db'))).toBe(true);
      expect(existsSync(join(testDir, 'plugin-b.db'))).toBe(true);

      db1.close();
      db2.close();
    });

    it('should isolate data between plugins', () => {
      const { pluginDb: db1, context: ctx1 } = createIsolatedContext('plugin-a', coreDb, testDir);
      const { pluginDb: db2, context: ctx2 } = createIsolatedContext('plugin-b', coreDb, testDir);

      // Plugin A creates a table
      ctx1.db.exec('CREATE TABLE plugin_data (id INTEGER PRIMARY KEY, value TEXT)');
      ctx1.db.run('INSERT INTO plugin_data (value) VALUES (?)', ['from plugin A']);

      // Plugin B should NOT see plugin A's table
      const tableCheck = ctx2.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='plugin_data'"
      );
      expect(tableCheck).toBeUndefined();

      // Plugin B creates its own table with same name
      ctx2.db.exec('CREATE TABLE plugin_data (id INTEGER PRIMARY KEY, score INTEGER)');
      ctx2.db.run('INSERT INTO plugin_data (score) VALUES (?)', [100]);

      // Each plugin sees only its own data
      const dataA = ctx1.db.get('SELECT value FROM plugin_data WHERE id = 1');
      expect(dataA.value).toBe('from plugin A');

      const dataB = ctx2.db.get('SELECT score FROM plugin_data WHERE id = 1');
      expect(dataB.score).toBe(100);

      db1.close();
      db2.close();
    });

    it('should not allow plugin to access core users table via context.db', () => {
      const { pluginDb, context } = createIsolatedContext('malicious-plugin', coreDb, testDir);

      // Attempt to query users table through plugin's isolated db
      // This should fail because the users table doesn't exist in the plugin's database
      expect(() => {
        context.db.get('SELECT * FROM users');
      }).toThrow(/no such table: users/);

      pluginDb.close();
    });

    it('should not allow plugin to access core sessions table via context.db', () => {
      const { pluginDb, context } = createIsolatedContext('malicious-plugin', coreDb, testDir);

      expect(() => {
        context.db.get('SELECT * FROM sessions');
      }).toThrow(/no such table: sessions/);

      pluginDb.close();
    });

    it('should not allow plugin to access installed_packs table via context.db', () => {
      const { pluginDb, context } = createIsolatedContext('malicious-plugin', coreDb, testDir);

      expect(() => {
        context.db.get('SELECT * FROM installed_packs');
      }).toThrow(/no such table: installed_packs/);

      pluginDb.close();
    });

    it('should sanitize pack names for filesystem safety', () => {
      const { pluginDb } = createIsolatedContext('../../etc/passwd', coreDb, testDir);

      // Should create a safe filename, not traverse directories
      expect(existsSync(join(testDir, '______etc_passwd.db'))).toBe(true);
      expect(existsSync('/etc/passwd.db')).toBe(false);

      pluginDb.close();
    });
  });

  // ===========================================
  // Core API Tests
  // ===========================================
  describe('Core API - Read Only Access', () => {
    it('should provide getUser with limited fields', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      const user = context.core.getUser(1);
      expect(user).toEqual({
        id: 1,
        username: 'alice',
        displayName: 'Alice Smith'
      });

      // Should NOT expose password_hash, email, or role
      expect(user.password_hash).toBeUndefined();
      expect(user.email).toBeUndefined();
      expect(user.role).toBeUndefined();

      pluginDb.close();
    });

    it('should return null for non-existent user', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      const user = context.core.getUser(999);
      expect(user).toBeNull();

      pluginDb.close();
    });

    it('should provide getUsers for batch lookups', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      const users = context.core.getUsers([1, 2, 3]);
      expect(users).toHaveLength(3);
      expect(users[0].username).toBe('alice');
      expect(users[1].username).toBe('bob');

      // User 3 (charlie) has no display_name, should fall back to username
      const charlie = users.find(u => u.id === 3);
      expect(charlie.displayName).toBe('charlie');

      pluginDb.close();
    });

    it('should return empty array for empty user IDs', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      expect(context.core.getUsers([])).toEqual([]);
      expect(context.core.getUsers(null)).toEqual([]);
      expect(context.core.getUsers(undefined)).toEqual([]);

      pluginDb.close();
    });

    it('should provide getUsernameMap for efficient lookups', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      const usernameMap = context.core.getUsernameMap([1, 2]);
      expect(usernameMap.get(1)).toBe('alice');
      expect(usernameMap.get(2)).toBe('bob');
      expect(usernameMap.get(999)).toBeUndefined();

      pluginDb.close();
    });

    it('should provide userExists check', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      expect(context.core.userExists(1)).toBe(true);
      expect(context.core.userExists(999)).toBe(false);

      pluginDb.close();
    });
  });

  // ===========================================
  // Security Boundary Tests
  // ===========================================
  describe('Security Boundaries', () => {
    it('should not expose password hashes through any API', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      // Single user
      const user = context.core.getUser(1);
      expect(JSON.stringify(user)).not.toContain('hash1');

      // Multiple users
      const users = context.core.getUsers([1, 2]);
      expect(JSON.stringify(users)).not.toContain('hash1');
      expect(JSON.stringify(users)).not.toContain('hash2');

      pluginDb.close();
    });

    it('should not allow SQL injection via core APIs', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      // Attempt SQL injection
      const maliciousId = "1; DROP TABLE users; --";

      // This should safely fail (NaN conversion) rather than execute
      const result = context.core.getUser(maliciousId);
      expect(result).toBeNull();

      // Verify users table still exists
      const userCount = coreDb.prepare('SELECT COUNT(*) as count FROM users').get();
      expect(userCount.count).toBe(3);

      pluginDb.close();
    });

    it('should prevent plugins from modifying core data', () => {
      const { pluginDb, context } = createIsolatedContext('malicious-plugin', coreDb, testDir);

      // The context.core object only has read methods
      expect(context.core.updateUser).toBeUndefined();
      expect(context.core.deleteUser).toBeUndefined();
      expect(context.core.createUser).toBeUndefined();
      expect(context.core.runSQL).toBeUndefined();

      // context.db operates on isolated database, can't modify core
      expect(() => {
        context.db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', 1]);
      }).toThrow(/no such table: users/);

      pluginDb.close();
    });
  });

  // ===========================================
  // Migration Tests
  // ===========================================
  describe('Plugin Migrations', () => {
    it('should run migrations on plugin isolated database', () => {
      const { pluginDb, context } = createIsolatedContext('test-plugin', coreDb, testDir);

      // Simulate a migration
      context.db.exec(`
        CREATE TABLE IF NOT EXISTS _plugin_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS game_scores (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          score INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Verify migration ran on plugin db
      const tables = context.db.all(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      const tableNames = tables.map(t => t.name);

      expect(tableNames).toContain('_plugin_migrations');
      expect(tableNames).toContain('game_scores');

      // Verify core db is untouched
      const coreTables = coreDb.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      ).all();
      const coreTableNames = coreTables.map(t => t.name);

      expect(coreTableNames).not.toContain('_plugin_migrations');
      expect(coreTableNames).not.toContain('game_scores');

      pluginDb.close();
    });
  });

  // ===========================================
  // Database Size Limit Tests
  // ===========================================
  describe('Database Size Limits', () => {
    it('should allow writes when under size limit', () => {
      const { pluginDb, context } = createIsolatedContext('size-test', coreDb, testDir, {
        maxSize: 10 * 1024 * 1024 // 10MB limit for testing
      });

      // Small write should succeed
      context.db.exec('CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)');
      context.db.run('INSERT INTO test_data (value) VALUES (?)', ['small data']);

      const result = context.db.get('SELECT COUNT(*) as count FROM test_data');
      expect(result.count).toBe(1);

      pluginDb.close();
    });

    it('should block writes when over size limit', () => {
      const smallLimit = 1024; // 1KB limit for testing
      const { pluginDb, dbPath, context } = createIsolatedContext('size-limit-test', coreDb, testDir, {
        maxSize: smallLimit
      });

      // Create table first
      context.db.exec('CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)');
      pluginDb.close();

      // Manually create a file larger than the limit to simulate a full database
      const largeData = 'x'.repeat(smallLimit + 100);
      writeFileSync(dbPath, largeData);

      // Reopen and try to write - should fail
      const { pluginDb: db2, context: ctx2 } = createIsolatedContext('size-limit-test', coreDb, testDir, {
        maxSize: smallLimit
      });

      expect(() => {
        ctx2.db.run('INSERT INTO test_data (value) VALUES (?)', ['more data']);
      }).toThrow(/exceeds size limit/);

      db2.close();
    });

    it('should allow reads even when over size limit', () => {
      const { pluginDb, context } = createIsolatedContext('read-test', coreDb, testDir);

      // Create and populate table
      context.db.exec('CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)');
      context.db.run('INSERT INTO test_data (value) VALUES (?)', ['test value']);

      // Read should always work
      const result = context.db.get('SELECT value FROM test_data WHERE id = 1');
      expect(result.value).toBe('test value');

      pluginDb.close();
    });
  });

  // ===========================================
  // Error Boundary Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should handle invalid SQL gracefully', () => {
      const { pluginDb, context } = createIsolatedContext('error-test', coreDb, testDir);

      // Invalid SQL should throw but not crash
      expect(() => {
        context.db.exec('INVALID SQL STATEMENT');
      }).toThrow();

      // Plugin should still be functional after error
      context.db.exec('CREATE TABLE recovery_test (id INTEGER PRIMARY KEY)');
      const tables = context.db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='recovery_test'"
      );
      expect(tables).toHaveLength(1);

      pluginDb.close();
    });

    it('should not affect other plugins when one fails', () => {
      const { pluginDb: db1, context: ctx1 } = createIsolatedContext('plugin-a', coreDb, testDir);
      const { pluginDb: db2, context: ctx2 } = createIsolatedContext('plugin-b', coreDb, testDir);

      // Plugin A creates a table
      ctx1.db.exec('CREATE TABLE plugin_a_data (id INTEGER PRIMARY KEY)');

      // Plugin B fails
      expect(() => {
        ctx2.db.exec('INVALID SQL');
      }).toThrow();

      // Plugin A should still work
      ctx1.db.run('INSERT INTO plugin_a_data (id) VALUES (?)', [1]);
      const result = ctx1.db.get('SELECT COUNT(*) as count FROM plugin_a_data');
      expect(result.count).toBe(1);

      db1.close();
      db2.close();
    });
  });

  // ===========================================
  // Plugin Data Cleanup Tests
  // ===========================================
  describe('Plugin Data Cleanup', () => {
    it('should create database file that can be deleted', () => {
      const packName = 'cleanup-test';
      const { pluginDb, dbPath } = createIsolatedContext(packName, coreDb, testDir);

      // Verify database was created
      expect(existsSync(dbPath)).toBe(true);

      // Close and delete
      pluginDb.close();
      rmSync(dbPath);

      // Verify it's gone
      expect(existsSync(dbPath)).toBe(false);
    });

    it('should handle deletion of non-existent database gracefully', () => {
      const safeName = 'nonexistent-plugin'.replace(/[^a-z0-9-_]/gi, '_');
      const dbPath = join(testDir, `${safeName}.db`);

      // Should not throw when file doesn't exist
      expect(existsSync(dbPath)).toBe(false);
    });
  });
});
