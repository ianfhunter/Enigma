/**
 * Authentication Integration Tests
 * 
 * Tests the complete authentication flow including:
 * - User registration
 * - User login
 * - Failed login attempts
 * - Session management
 * - Logout
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, createTestClient } from './helpers/setup.js';

describe('Authentication Integration Tests', () => {
  let server;
  let client;
  let baseUrl;

  beforeEach(async () => {
    server = await createTestServer({ port: 0 });
    baseUrl = server.baseUrl;
    client = createTestClient(baseUrl);
  });

  afterEach(async () => {
    if (server && server.cleanup) {
      await server.cleanup();
    }
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const response = await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
        email: 'test@example.com',
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'admin', // First user should be admin
      });
      expect(response.data.id).toBeDefined();
    });

    it('should reject registration with invalid username', async () => {
      const response = await client.post('/api/auth/register', {
        username: 'ab', // Too short
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Username must be 3-32 characters');
    });

    it('should reject registration with invalid password', async () => {
      const response = await client.post('/api/auth/register', {
        username: 'testuser',
        password: '12345', // Too short
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Password must be at least 6 characters');
    });

    it('should reject duplicate username', async () => {
      // Register first user
      await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });

      // Try to register again with same username
      const response = await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password456',
      });

      expect(response.status).toBe(409);
      expect(response.data.error).toContain('Username already taken');
    });

    it('should create user settings on registration', async () => {
      const regResponse = await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });

      expect(regResponse.status).toBe(201);

      // Check that user settings were created
      const settings = server.db.prepare(
        'SELECT * FROM user_settings WHERE user_id = ?'
      ).get(regResponse.data.id);

      expect(settings).toBeDefined();
      expect(settings.user_id).toBe(regResponse.data.id);
    });
  });

  describe('Login Flow', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should successfully login with correct credentials', async () => {
      const response = await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        username: 'testuser',
      });
      expect(response.data.id).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.data.error).toContain('Invalid username or password');
    });

    it('should reject login with non-existent username', async () => {
      const response = await client.post('/api/auth/login', {
        username: 'nonexistent',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.data.error).toContain('Invalid username or password');
    });

    it('should create session on successful login', async () => {
      const response = await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(200);

      // Check session exists
      const sessionCount = server.db.prepare(
        'SELECT COUNT(*) as count FROM sessions'
      ).get();

      expect(sessionCount.count).toBeGreaterThan(0);
    });

    it('should log login attempts in login_history', async () => {
      await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });

      // Check login history
      const history = server.db.prepare(
        'SELECT * FROM login_history WHERE user_id = (SELECT id FROM users WHERE username = ?)'
      ).all('testuser');

      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].success).toBe(1);
    });

    it('should log failed login attempts', async () => {
      await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'wrongpassword',
      });

      // Check login history
      const history = server.db.prepare(
        'SELECT * FROM login_history WHERE user_id = (SELECT id FROM users WHERE username = ?) ORDER BY id DESC LIMIT 1'
      ).get('testuser');

      expect(history).toBeDefined();
      expect(history.success).toBe(0);
    });
  });

  describe('Session Management', () => {
    let userId;

    beforeEach(async () => {
      const regResponse = await client.post('/api/auth/register', {
        username: 'testuser',
        password: 'password123',
      });
      userId = regResponse.data.id;
    });

    it('should return current user when authenticated', async () => {
      // Login first
      await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });

      // Get current user
      const response = await client.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(userId);
      expect(response.data.username).toBe('testuser');
    });

    it('should reject /me request when not authenticated', async () => {
      // Don't login, just try to access /me
      const response = await client.get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should successfully logout and destroy session', async () => {
      // Login first
      await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });

      // Logout
      const logoutResponse = await client.post('/api/auth/logout', {});

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.data.message).toContain('Logged out');

      // Try to access /me after logout (should fail)
      const meResponse = await client.get('/api/auth/me');
      expect(meResponse.status).toBe(401);
    });
  });

  describe('Registration + Login Flow', () => {
    it('should allow user to register and immediately login', async () => {
      // Register
      const regResponse = await client.post('/api/auth/register', {
        username: 'newuser',
        password: 'password123',
      });

      expect(regResponse.status).toBe(201);
      const userId = regResponse.data.id;

      // Should be able to access /me immediately after registration
      const meResponse = await client.get('/api/auth/me');
      expect(meResponse.status).toBe(200);
      expect(meResponse.data.id).toBe(userId);

      // Logout
      await client.post('/api/auth/logout', {});

      // Login again
      const loginResponse = await client.post('/api/auth/login', {
        username: 'newuser',
        password: 'password123',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data.id).toBe(userId);
    });

    it('should not allow login before registration', async () => {
      const response = await client.post('/api/auth/login', {
        username: 'notregistered',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.data.error).toContain('Invalid username or password');
    });
  });
});
