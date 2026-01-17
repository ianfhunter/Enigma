/**
 * Plugin System Integration Tests
 * 
 * Tests the plugin/community pack system including:
 * - Adding community sources
 * - Installing packs from local sources
 * - Plugin loading and initialization
 * - Plugin isolation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, createTestClient } from './helpers/setup.js';
import { existsSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join } from 'path';

// Check if bcrypt can be loaded (required for auth in plugin tests)
// This must be done before importing setup.js which imports routes that use bcrypt
let bcryptAvailable = false;
try {
  // Try to import from backend node_modules first, then root
  let bcrypt;
  try {
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const backendBcryptPath = join(__dirname, '../../backend/node_modules/bcrypt');
    bcrypt = await import(`file://${backendBcryptPath}/index.js`);
  } catch {
    // Fall back to regular import
    bcrypt = await import('bcrypt');
  }
  // Try to use it to ensure it's actually working
  await bcrypt.default.hash('test', 1);
  bcryptAvailable = true;
} catch (e) {
  if (e.message && (e.message.includes('libc.musl') || e.message.includes('shared object') || e.message.includes('Cannot find package'))) {
    console.warn('Skipping plugin integration tests: bcrypt not available');
  } else {
    // Re-throw if it's a different error
    throw e;
  }
}

// Only import setup if bcrypt is available (to avoid import errors)
const { createTestServer, createTestClient } = bcryptAvailable 
  ? await import('./helpers/setup.js')
  : { createTestServer: null, createTestClient: null };

describe.skipIf(!bcryptAvailable || !createTestServer)('Plugin System Integration Tests', () => {
  let server;
  let client;
  let baseUrl;
  let testPackDir;

  beforeEach(async () => {
    if (!createTestServer) {
      throw new Error('createTestServer not available (bcrypt not loaded)');
    }
    server = await createTestServer({ port: 0 });
    baseUrl = server.baseUrl;
    client = createTestClient(baseUrl);

    // Create a test pack directory within the local-sources root
    const localSourcesRoot = join(server.testPluginsDir, 'local-sources');
    mkdirSync(localSourcesRoot, { recursive: true });
    testPackDir = join(localSourcesRoot, 'test-pack');
    mkdirSync(testPackDir, { recursive: true });

    // Create a minimal test pack manifest
    writeFileSync(join(testPackDir, 'manifest.js'), `
      const pack = {
        id: 'test-pack',
        name: 'Test Pack',
        description: 'A test community pack',
        version: '1.0.0',
        hasBackend: false,
        categories: [
          {
            name: 'Test Games',
            games: [
              {
                slug: 'test-game',
                title: 'Test Game',
                description: 'A test game',
                icon: '🎮',
                component: () => Promise.resolve({ default: () => null }),
              },
            ],
          },
        ],
      };
      export default pack;
    `);
  });

  afterEach(async () => {
    if (server && server.cleanup) {
      await server.cleanup();
    }
  });

  describe('Community Source Management', () => {
    let userId;

    beforeEach(async () => {
      // Register and login a user
      const regResponse = await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });
      userId = regResponse.data.id;
    });

    it('should list community sources', async () => {
      const response = await client.get('/api/community-sources/');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('sources');
      expect(Array.isArray(response.data.sources)).toBe(true);
    });

    it('should add a local community source', async () => {
      const response = await client.post('/api/community-sources/', {
        url: `file://${testPackDir}`,
        name: 'Test Pack Source',
      });

      expect(response.status).toBe(201);
      expect(response.data.source).toMatchObject({
        name: 'Test Pack Source',
        is_local: 1,
        pack_id: 'test-pack',
      });
    });

    it('should not allow duplicate sources', async () => {
      // Add first source
      await client.post('/api/community-sources/', {
        url: `file://${testPackDir}`,
        name: 'Test Pack Source',
      });

      // Try to add duplicate
      const response = await client.post('/api/community-sources/', {
        url: `file://${testPackDir}`,
        name: 'Duplicate Source',
      });

      expect(response.status).toBe(409);
      expect(response.data.error).toContain('already exists');
    });

    it('should install a pack from a local source', async () => {
      // Add source
      const sourceResponse = await client.post('/api/community-sources/', {
        url: `file://${testPackDir}`,
        name: 'Test Pack Source',
      });
      const sourceId = sourceResponse.data.source.id;

      // Install pack
      const installResponse = await client.post(`/api/community-sources/${sourceId}/install`, {
        version: '1.0.0',
      });

      expect(installResponse.status).toBe(200);
      expect(installResponse.data).toHaveProperty('pack');

      // Verify pack is in installed_packs table
      const installed = server.db.prepare(
        'SELECT * FROM installed_packs WHERE pack_id = ?'
      ).get('test-pack');

      expect(installed).toBeDefined();
      expect(installed.pack_type).toBe('community');
      expect(installed.source_id).toBe(sourceId);
    });

    it('should create symlink when installing local pack', async () => {
      // Add source
      const sourceResponse = await client.post('/api/community-sources/', {
        url: `file://${testPackDir}`,
        name: 'Test Pack Source',
      });
      const sourceId = sourceResponse.data.source.id;

      // Install pack
      await client.post(`/api/community-sources/${sourceId}/install`, {
        version: '1.0.0',
      });

      // Check that symlink was created in plugins directory
      const packSymlinkPath = join(server.testPluginsDir, 'test-pack');
      // Note: On Windows, we can't easily check if it's a symlink in tests
      // But we can check if the directory exists and points to the right place
      expect(existsSync(packSymlinkPath)).toBe(true);
    });
  });

  describe('Plugin Loading', () => {
    beforeEach(async () => {
      // Register a user
      await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should load plugins on server startup', async () => {
      // Check plugin status endpoint
      const response = await client.get('/api/packs/_status');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('loaded');
      expect(response.data).toHaveProperty('plugins');
      expect(Array.isArray(response.data.plugins)).toBe(true);
    });

    it('should reload plugins via API', async () => {
      const response = await client.post('/api/packs/_reload', {});

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('plugins');
    });

    it('should return installed manifests', async () => {
      // Add and install a pack first
      const sourceResponse = await client.post('/api/community-sources/', {
        url: `file://${testPackDir}`,
        name: 'Test Pack Source',
      });
      const sourceId = sourceResponse.data.source.id;
      await client.post(`/api/community-sources/${sourceId}/install`, {
        version: '1.0.0',
      });

      // Get installed manifests
      const response = await client.get('/api/community-sources/installed-manifests');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.manifests)).toBe(true);
      
      const testPackManifest = response.data.manifests.find(m => m.id === 'test-pack');
      expect(testPackManifest).toBeDefined();
      expect(testPackManifest.name).toBe('Test Pack');
    });
  });

  describe('Plugin with Backend', () => {
    let backendPackDir;

    beforeEach(async () => {
      // Register a user
      await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });

      // Create a pack with backend
      const localSourcesRoot = join(server.testPluginsDir, 'local-sources');
      backendPackDir = join(localSourcesRoot, 'backend-pack');
      mkdirSync(backendPackDir, { recursive: true });
      mkdirSync(join(backendPackDir, 'backend'), { recursive: true });

      // Create manifest
      writeFileSync(join(backendPackDir, 'manifest.js'), `
        const pack = {
          id: 'backend-pack',
          name: 'Backend Pack',
          description: 'A pack with backend',
          version: '1.0.0',
          hasBackend: true,
          categories: [],
        };
        export default pack;
      `);

      // Create minimal backend plugin
      writeFileSync(join(backendPackDir, 'backend', 'index.js'), `
        export default function plugin(app, context) {
          app.get('/api/packs/backend-pack/test', (req, res) => {
            res.json({ message: 'Hello from plugin' });
          });
        }
      `);
    });

    it('should load and expose backend plugin routes', async () => {
      // Add source
      const sourceResponse = await client.post('/api/community-sources/', {
        url: `file://${backendPackDir}`,
        name: 'Backend Pack Source',
      });
      const sourceId = sourceResponse.data.source.id;

      // Install pack
      await client.post(`/api/community-sources/${sourceId}/install`, {
        version: '1.0.0',
      });

      // Reload plugins to pick up the new one
      await client.post('/api/packs/_reload', {});

      // Try to access plugin route
      const response = await client.get('/api/packs/backend-pack/test');

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Hello from plugin');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should handle invalid source URLs gracefully', async () => {
      const response = await client.post('/api/community-sources/', {
        url: 'file:///nonexistent/path',
        name: 'Invalid Source',
      });

      expect(response.status).toBe(400);
    });

    it('should handle installation of non-existent packs', async () => {
      // Add source with invalid pack
      const badPackDir = join(server.testPluginsDir, 'local-sources', 'bad-pack');
      mkdirSync(badPackDir, { recursive: true });
      // No manifest.js file

      const sourceResponse = await client.post('/api/community-sources/', {
        url: `file://${badPackDir}`,
        name: 'Bad Pack Source',
      });

      if (sourceResponse.status === 201) {
        const sourceId = sourceResponse.data.source.id;
        const installResponse = await client.post(`/api/community-sources/${sourceId}/install`, {});

        // Should fail gracefully
        expect(installResponse.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
