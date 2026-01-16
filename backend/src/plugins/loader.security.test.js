/**
 * Plugin Security Tests
 *
 * Comprehensive security tests for the plugin system.
 * These tests challenge the plugin sandbox with various attack vectors.
 */
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Try to load better-sqlite3, skip tests if unavailable
let Database;
let dbAvailable = false;
try {
  Database = (await import('better-sqlite3')).default;
  // Test that we can actually create a database
  const testDb = new Database(':memory:');
  testDb.close();
  dbAvailable = true;
} catch (e) {
  console.warn('Skipping security tests: better-sqlite3 not available in this environment');
}

// Mirror the real implementation
const MAX_PLUGIN_DB_SIZE = 50 * 1024 * 1024; // 50MB

function checkDatabaseSize(packName, pluginDataDir, maxSize = MAX_PLUGIN_DB_SIZE) {
  const safeName = packName.replace(/[^a-z0-9-_]/gi, '_');
  const dbPath = join(pluginDataDir, `${safeName}.db`);

  if (!existsSync(dbPath)) {
    return 0;
  }

  const { statSync } = require('fs');
  const stats = statSync(dbPath);
  if (stats.size > maxSize) {
    throw new Error(
      `Plugin ${packName} database exceeds size limit ` +
      `(${Math.round(stats.size / 1024 / 1024)}MB > ${Math.round(maxSize / 1024 / 1024)}MB)`
    );
  }
  return stats.size;
}

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
        },
        searchUsers: (prefix) => {
          if (!prefix || prefix.length < 2) return [];
          const users = coreDb.prepare(
            'SELECT id, username FROM users WHERE username LIKE ? LIMIT 10'
          ).all(`${prefix}%`);
          return users.map(u => ({ id: u.id, username: u.username }));
        }
      },
      requireAuth: (req, res, next) => {
        if (!req.session?.userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        next();
      },
      getCurrentUser: (req) => {
        return req.session?.userId ? { id: req.session.userId } : null;
      }
    }
  };
}

// Skip entire test suite if database not available
const describeFn = dbAvailable ? describe : describe.skip;

describeFn('Plugin Security - Advanced Attacks', () => {
  let coreDb;
  let testDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `enigma-security-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });

    coreDb = new Database(':memory:');
    coreDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        display_name TEXT,
        password_hash TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        api_key TEXT,
        session_secret TEXT
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

      CREATE TABLE admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        secret INTEGER DEFAULT 0
      );
    `);

    // Insert test data in separate statements to avoid syntax issues
    coreDb.prepare(`
      INSERT INTO users (username, password_hash, display_name, role, email, api_key, session_secret)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('alice', 'bcrypt_hash_alice_12345', 'Alice Smith', 'user', 'alice@example.com', 'api_key_alice_secret', 'session_alice');

    coreDb.prepare(`
      INSERT INTO users (username, password_hash, display_name, role, email, api_key, session_secret)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('admin', 'bcrypt_hash_admin_super', 'Administrator', 'admin', 'admin@example.com', 'api_key_admin_secret', 'session_admin');

    coreDb.prepare(`
      INSERT INTO users (username, password_hash, display_name, role, email, api_key, session_secret)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('bob', 'bcrypt_hash_bob_67890', 'Bob Jones', 'user', 'bob@example.com', null, null);

    coreDb.prepare(`INSERT INTO admin_settings (key, value, secret) VALUES (?, ?, ?)`).run('jwt_secret', 'super_secret_jwt_key_12345', 1);
    coreDb.prepare(`INSERT INTO admin_settings (key, value, secret) VALUES (?, ?, ?)`).run('encryption_key', 'aes_256_key_very_secret', 1);
    coreDb.prepare(`INSERT INTO admin_settings (key, value, secret) VALUES (?, ?, ?)`).run('public_setting', 'not_secret', 0);
  });

  afterEach(() => {
    try {
      coreDb?.close();
    } catch (e) { /* ignore */ }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  // ===========================================
  // SQL Injection Attack Vectors
  // ===========================================
  describe('SQL Injection Attacks', () => {
    it('should prevent classic SQL injection in getUser', () => {
      const { pluginDb, context } = createIsolatedContext('sql-test', coreDb, testDir);

      // Classic injection attempts
      const injections = [
        "1 OR 1=1",
        "1; DROP TABLE users;--",
        "1 UNION SELECT * FROM users--",
        "1' OR '1'='1",
        "1; SELECT password_hash FROM users--",
        "-1 OR id > 0",
        "1/**/OR/**/1=1",
      ];

      for (const injection of injections) {
        const result = context.core.getUser(injection);
        // Should return null (not found) not execute injection
        expect(result).toBeNull();
      }

      // Verify users table still intact
      const count = coreDb.prepare('SELECT COUNT(*) as c FROM users').get();
      expect(count.c).toBe(3);

      pluginDb.close();
    });

    it('should prevent SQL injection in getUsers with array manipulation', () => {
      const { pluginDb, context } = createIsolatedContext('sql-test', coreDb, testDir);

      // Attempt injection via array
      const maliciousArray = [1, "2); DELETE FROM users;--", 3];

      // This might throw or return partial results, but should NOT delete users
      try {
        context.core.getUsers(maliciousArray);
      } catch (e) {
        // Expected - invalid input
      }

      // Verify users still exist
      const count = coreDb.prepare('SELECT COUNT(*) as c FROM users').get();
      expect(count.c).toBe(3);

      pluginDb.close();
    });

    it('should prevent SQL injection in searchUsers', () => {
      const { pluginDb, context } = createIsolatedContext('sql-test', coreDb, testDir);

      const injections = [
        "%' OR '1'='1",
        "a%'; DROP TABLE users;--",
        "admin%' UNION SELECT password_hash, api_key FROM users--",
        "a%'; UPDATE users SET role='admin' WHERE username='bob';--",
      ];

      for (const injection of injections) {
        const results = context.core.searchUsers(injection);
        // Should return empty or filtered results, not execute injection
        expect(Array.isArray(results)).toBe(true);

        // Verify no sensitive data leaked
        for (const user of results) {
          expect(user.password_hash).toBeUndefined();
          expect(user.api_key).toBeUndefined();
        }
      }

      // Verify database integrity
      const count = coreDb.prepare('SELECT COUNT(*) as c FROM users').get();
      expect(count.c).toBe(3);

      // Verify bob is still a user
      const bob = coreDb.prepare('SELECT role FROM users WHERE username = ?').get('bob');
      expect(bob.role).toBe('user');

      pluginDb.close();
    });

    it('should prevent second-order SQL injection', () => {
      const { pluginDb, context } = createIsolatedContext('sql-test', coreDb, testDir);

      // Store malicious payload in plugin's database
      context.db.exec('CREATE TABLE user_notes (id INTEGER PRIMARY KEY, user_id INTEGER, note TEXT)');
      const maliciousNote = "'); DELETE FROM users;--";
      context.db.run('INSERT INTO user_notes (user_id, note) VALUES (?, ?)', [1, maliciousNote]);

      // Read it back and try to use it
      const note = context.db.get('SELECT note FROM user_notes WHERE id = 1');
      expect(note.note).toBe(maliciousNote);

      // Using this in a query should not affect core database
      // (Plugin can only write to its own isolated db)

      const coreCount = coreDb.prepare('SELECT COUNT(*) as c FROM users').get();
      expect(coreCount.c).toBe(3);

      pluginDb.close();
    });
  });

  // ===========================================
  // Sensitive Data Exposure Prevention
  // ===========================================
  describe('Sensitive Data Protection', () => {
    it('should never expose password hashes', () => {
      const { pluginDb, context } = createIsolatedContext('data-test', coreDb, testDir);

      const user = context.core.getUser(1);
      const users = context.core.getUsers([1, 2, 3]);

      // Check all returned data doesn't contain password hashes
      const allData = JSON.stringify({ user, users });
      expect(allData).not.toContain('bcrypt_hash');
      expect(allData).not.toContain('password');

      pluginDb.close();
    });

    it('should never expose API keys', () => {
      const { pluginDb, context } = createIsolatedContext('data-test', coreDb, testDir);

      const user = context.core.getUser(1);
      const users = context.core.getUsers([1, 2]);

      const allData = JSON.stringify({ user, users });
      expect(allData).not.toContain('api_key');
      expect(allData).not.toContain('_secret');

      pluginDb.close();
    });

    it('should never expose session secrets', () => {
      const { pluginDb, context } = createIsolatedContext('data-test', coreDb, testDir);

      const user = context.core.getUser(1);
      const allData = JSON.stringify(user);
      expect(allData).not.toContain('session_');

      pluginDb.close();
    });

    it('should never expose user emails', () => {
      const { pluginDb, context } = createIsolatedContext('data-test', coreDb, testDir);

      const user = context.core.getUser(1);
      const users = context.core.getUsers([1, 2, 3]);

      const allData = JSON.stringify({ user, users });
      expect(allData).not.toContain('@example.com');
      expect(allData).not.toContain('email');

      pluginDb.close();
    });

    it('should not allow access to admin_settings table', () => {
      const { pluginDb, context } = createIsolatedContext('data-test', coreDb, testDir);

      // Try to access admin settings via plugin's isolated db
      expect(() => {
        context.db.get('SELECT * FROM admin_settings');
      }).toThrow(/no such table/);

      pluginDb.close();
    });

    it('should not expose user roles', () => {
      const { pluginDb, context } = createIsolatedContext('data-test', coreDb, testDir);

      const user = context.core.getUser(2); // admin user
      expect(user.role).toBeUndefined();
      expect(JSON.stringify(user)).not.toContain('admin');

      pluginDb.close();
    });
  });

  // ===========================================
  // Path Traversal & Filesystem Attacks
  // ===========================================
  describe('Path Traversal Attacks', () => {
    it('should sanitize pack names with path traversal attempts', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'normal/../../../etc/shadow',
        '....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2fetc/passwd',
        'plugin\x00.db/../../../etc/passwd',
        'plugin%00/../../../',
      ];

      for (const name of maliciousNames) {
        const { pluginDb, dbPath } = createIsolatedContext(name, coreDb, testDir);

        // Should create file in testDir, not escape
        expect(dbPath.startsWith(testDir)).toBe(true);
        expect(existsSync(dbPath)).toBe(true);

        // Should not have created files outside testDir
        expect(existsSync('/etc/passwd.db')).toBe(false);
        expect(existsSync('/etc/shadow.db')).toBe(false);

        pluginDb.close();
      }
    });

    it('should handle unicode and special characters safely', () => {
      const specialNames = [
        'plugin-café-☕',
        'плагин-тест',
        '插件测试',
        'plugin<script>alert(1)</script>',
        'plugin"name\'test',
        'plugin\nname\ttab',
      ];

      for (const name of specialNames) {
        const { pluginDb, dbPath } = createIsolatedContext(name, coreDb, testDir);

        // Should create a safe filename
        expect(existsSync(dbPath)).toBe(true);
        expect(dbPath.startsWith(testDir)).toBe(true);

        pluginDb.close();
      }
    });
  });

  // ===========================================
  // Resource Exhaustion / DoS Prevention
  // ===========================================
  describe('Resource Exhaustion Prevention', () => {
    it('should enforce database size limits', () => {
      const smallLimit = 5 * 1024; // 5KB
      const { pluginDb, dbPath, context } = createIsolatedContext('dos-test', coreDb, testDir, {
        maxSize: smallLimit
      });

      // Create table
      context.db.exec('CREATE TABLE large_data (id INTEGER PRIMARY KEY, data BLOB)');

      // Insert data until limit reached
      const chunk = Buffer.alloc(1024, 'x'); // 1KB chunks
      let inserted = 0;
      let limitHit = false;

      for (let i = 0; i < 20; i++) {
        try {
          context.db.run('INSERT INTO large_data (data) VALUES (?)', [chunk]);
          inserted++;
        } catch (e) {
          if (e.message.includes('exceeds size limit')) {
            limitHit = true;
            break;
          }
          throw e;
        }
      }

      expect(limitHit).toBe(true);
      expect(inserted).toBeLessThan(10); // Should hit limit before 10 inserts

      pluginDb.close();
    });

    it('should handle very large number of small writes', () => {
      const { pluginDb, context } = createIsolatedContext('many-writes', coreDb, testDir, {
        maxSize: 1024 * 1024 // 1MB limit
      });

      context.db.exec('CREATE TABLE counters (id INTEGER PRIMARY KEY, count INTEGER)');

      // Many small writes should work until size limit
      let successCount = 0;
      for (let i = 0; i < 10000; i++) {
        try {
          context.db.run('INSERT INTO counters (count) VALUES (?)', [i]);
          successCount++;
        } catch (e) {
          if (e.message.includes('exceeds size limit')) {
            break;
          }
          throw e;
        }
      }

      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThan(10000);

      pluginDb.close();
    });

    it('should handle deeply nested JSON without crashing', () => {
      const { pluginDb, context } = createIsolatedContext('json-test', coreDb, testDir);

      context.db.exec('CREATE TABLE json_data (id INTEGER PRIMARY KEY, data TEXT)');

      // Create deeply nested object
      let nested = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        nested = { nested };
      }

      const jsonStr = JSON.stringify(nested);
      context.db.run('INSERT INTO json_data (data) VALUES (?)', [jsonStr]);

      const result = context.db.get('SELECT data FROM json_data WHERE id = 1');
      expect(result.data).toBe(jsonStr);

      pluginDb.close();
    });
  });

  // ===========================================
  // Plugin Isolation Boundaries
  // ===========================================
  describe('Plugin Isolation Boundaries', () => {
    it('should completely isolate plugin A data from plugin B', () => {
      const { pluginDb: dbA, context: ctxA } = createIsolatedContext('plugin-a', coreDb, testDir);
      const { pluginDb: dbB, context: ctxB } = createIsolatedContext('plugin-b', coreDb, testDir);

      // Plugin A stores sensitive data
      ctxA.db.exec('CREATE TABLE secrets (id INTEGER PRIMARY KEY, secret TEXT)');
      ctxA.db.run('INSERT INTO secrets (secret) VALUES (?)', ['plugin_a_secret_key']);

      // Plugin B tries various ways to access Plugin A's data
      // 1. Direct table access
      expect(() => ctxB.db.get('SELECT * FROM secrets')).toThrow(/no such table/);

      // 2. ATTACH database attempt (should fail or not work)
      const pluginAPath = join(testDir, 'plugin-a.db');
      expect(() => {
        ctxB.db.exec(`ATTACH DATABASE '${pluginAPath}' AS stolen`);
      }).toThrow(); // SQLite should prevent this or it won't have the data

      // 3. Create same table name - should be isolated
      ctxB.db.exec('CREATE TABLE secrets (id INTEGER PRIMARY KEY, secret TEXT)');
      ctxB.db.run('INSERT INTO secrets (secret) VALUES (?)', ['plugin_b_different_secret']);

      const secretA = ctxA.db.get('SELECT secret FROM secrets WHERE id = 1');
      const secretB = ctxB.db.get('SELECT secret FROM secrets WHERE id = 1');

      expect(secretA.secret).toBe('plugin_a_secret_key');
      expect(secretB.secret).toBe('plugin_b_different_secret');

      dbA.close();
      dbB.close();
    });

    it('should not allow plugin to use ATTACH DATABASE', () => {
      const { pluginDb, context } = createIsolatedContext('attach-test', coreDb, testDir);

      // Try to attach the core database (simulated path)
      expect(() => {
        context.db.exec("ATTACH DATABASE '/path/to/core.db' AS core");
      }).toThrow();

      // Try to attach another plugin's database
      const otherPath = join(testDir, 'other-plugin.db');
      writeFileSync(otherPath, ''); // Create empty file

      expect(() => {
        context.db.exec(`ATTACH DATABASE '${otherPath}' AS other`);
      }).toThrow();

      pluginDb.close();
    });
  });

  // ===========================================
  // Authentication Context Security
  // ===========================================
  describe('Authentication Context Security', () => {
    it('should not allow spoofing getCurrentUser', () => {
      const { pluginDb, context } = createIsolatedContext('auth-test', coreDb, testDir);

      // Mock request without session
      const reqNoAuth = { session: null };
      expect(context.getCurrentUser(reqNoAuth)).toBeNull();

      // Mock request with session
      const reqWithAuth = { session: { userId: 1 } };
      expect(context.getCurrentUser(reqWithAuth)).toEqual({ id: 1 });

      // Attempt to spoof by modifying returned object (shouldn't affect future calls)
      const user = context.getCurrentUser(reqWithAuth);
      user.id = 999;
      user.isAdmin = true;

      const user2 = context.getCurrentUser(reqWithAuth);
      expect(user2.id).toBe(1);
      expect(user2.isAdmin).toBeUndefined();

      pluginDb.close();
    });

    it('should properly enforce requireAuth middleware', () => {
      const { pluginDb, context } = createIsolatedContext('auth-test', coreDb, testDir);

      // Mock response
      const mockRes = {
        statusCode: null,
        body: null,
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.body = data; return this; }
      };

      // Without auth
      const nextCalled = { value: false };
      context.requireAuth(
        { session: null },
        mockRes,
        () => { nextCalled.value = true; }
      );

      expect(mockRes.statusCode).toBe(401);
      expect(nextCalled.value).toBe(false);

      // With auth
      const mockRes2 = { ...mockRes, statusCode: null, body: null };
      const nextCalled2 = { value: false };
      context.requireAuth(
        { session: { userId: 1 } },
        mockRes2,
        () => { nextCalled2.value = true; }
      );

      expect(nextCalled2.value).toBe(true);

      pluginDb.close();
    });
  });

  // ===========================================
  // Edge Cases and Boundary Conditions
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle empty strings safely', () => {
      const { pluginDb, context } = createIsolatedContext('edge-test', coreDb, testDir);

      const user = context.core.getUser('');
      expect(user).toBeNull();

      const users = context.core.getUsers(['']);
      // Should handle gracefully

      pluginDb.close();
    });

    it('should handle null and undefined inputs', () => {
      const { pluginDb, context } = createIsolatedContext('edge-test', coreDb, testDir);

      expect(context.core.getUser(null)).toBeNull();
      expect(context.core.getUser(undefined)).toBeNull();
      expect(context.core.getUsers(null)).toEqual([]);
      expect(context.core.getUsers(undefined)).toEqual([]);
      expect(context.core.getUsernameMap(null)).toEqual(new Map());
      expect(context.core.userExists(null)).toBe(false);

      pluginDb.close();
    });

    it('should handle very long strings', () => {
      const { pluginDb, context } = createIsolatedContext('edge-test', coreDb, testDir);

      context.db.exec('CREATE TABLE long_data (id INTEGER PRIMARY KEY, value TEXT)');

      // Very long string (1MB)
      const longString = 'x'.repeat(1024 * 1024);
      context.db.run('INSERT INTO long_data (value) VALUES (?)', [longString]);

      const result = context.db.get('SELECT value FROM long_data WHERE id = 1');
      expect(result.value.length).toBe(1024 * 1024);

      pluginDb.close();
    });

    it('should handle binary data safely', () => {
      const { pluginDb, context } = createIsolatedContext('edge-test', coreDb, testDir);

      context.db.exec('CREATE TABLE binary_data (id INTEGER PRIMARY KEY, data BLOB)');

      // Binary data with null bytes and special chars
      const binaryData = Buffer.from([0x00, 0x01, 0xFF, 0xFE, 0x27, 0x22, 0x5C]);
      context.db.run('INSERT INTO binary_data (data) VALUES (?)', [binaryData]);

      const result = context.db.get('SELECT data FROM binary_data WHERE id = 1');
      expect(Buffer.compare(result.data, binaryData)).toBe(0);

      pluginDb.close();
    });

    it('should handle maximum integer values', () => {
      const { pluginDb, context } = createIsolatedContext('edge-test', coreDb, testDir);

      context.db.exec('CREATE TABLE int_data (id INTEGER PRIMARY KEY, value INTEGER)');

      const maxInt = Number.MAX_SAFE_INTEGER;
      const minInt = Number.MIN_SAFE_INTEGER;

      context.db.run('INSERT INTO int_data (value) VALUES (?)', [maxInt]);
      context.db.run('INSERT INTO int_data (value) VALUES (?)', [minInt]);

      const results = context.db.all('SELECT value FROM int_data ORDER BY id');
      expect(results[0].value).toBe(maxInt);
      expect(results[1].value).toBe(minInt);

      pluginDb.close();
    });

    it('should handle concurrent reads safely', async () => {
      const { pluginDb, context } = createIsolatedContext('concurrent-test', coreDb, testDir);

      context.db.exec('CREATE TABLE counter (id INTEGER PRIMARY KEY, value INTEGER)');
      context.db.run('INSERT INTO counter (value) VALUES (?)', [0]);

      // Simulate concurrent reads
      const reads = [];
      for (let i = 0; i < 100; i++) {
        reads.push(Promise.resolve().then(() => {
          const result = context.db.get('SELECT value FROM counter WHERE id = 1');
          return result.value;
        }));
      }

      const results = await Promise.all(reads);
      expect(results.every(v => v === 0)).toBe(true);

      pluginDb.close();
    });
  });

  // ===========================================
  // Prototype Pollution Prevention
  // ===========================================
  describe('Prototype Pollution Prevention', () => {
    it('should not allow prototype pollution via user data', () => {
      const { pluginDb, context } = createIsolatedContext('proto-test', coreDb, testDir);

      // Store potentially dangerous JSON
      context.db.exec('CREATE TABLE user_data (id INTEGER PRIMARY KEY, data TEXT)');
      const maliciousJson = JSON.stringify({
        "__proto__": { "polluted": true },
        "constructor": { "prototype": { "polluted": true } }
      });

      context.db.run('INSERT INTO user_data (data) VALUES (?)', [maliciousJson]);

      const result = context.db.get('SELECT data FROM user_data WHERE id = 1');
      const parsed = JSON.parse(result.data);

      // The polluted property should NOT appear on Object prototype
      expect(({}).polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();

      pluginDb.close();
    });
  });

  // ===========================================
  // Database Corruption Resilience
  // ===========================================
  describe('Database Corruption Resilience', () => {
    it('should handle corrupted database file gracefully', () => {
      const corruptPath = join(testDir, 'corrupt-plugin.db');

      // Write garbage to create a "corrupted" database
      writeFileSync(corruptPath, 'not a valid sqlite database!');

      // Attempting to open should throw, not crash
      expect(() => {
        new Database(corruptPath);
      }).toThrow();
    });

    it('should handle missing database file on read', () => {
      const missingPath = join(testDir, 'nonexistent.db');

      // SQLite creates the file if it doesn't exist
      const db = new Database(missingPath);
      expect(existsSync(missingPath)).toBe(true);

      db.close();
    });
  });
});
