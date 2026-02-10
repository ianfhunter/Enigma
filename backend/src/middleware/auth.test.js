import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db.js', () => ({
  default: { prepare: vi.fn() }
}));

import db from '../db.js';

const createRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

describe('auth middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NO_AUTH;
  });

  it('rejects unauthenticated requests when NO_AUTH is disabled', async () => {
    const { requireAuth } = await import('./auth.js');
    const req = { session: {} };
    const res = createRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests when NO_AUTH is disabled', async () => {
    const { requireAdmin } = await import('./auth.js');
    const req = { session: { userId: 1, role: 'user' } };
    const res = createRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('injects a no-auth session user when NO_AUTH is enabled', async () => {
    process.env.NO_AUTH = '1';
    const selectGet = vi.fn(() => null);
    const insertRun = vi.fn(() => ({ lastInsertRowid: 42 }));
    const settingsRun = vi.fn();

    db.prepare = vi.fn((sql) => {
      if (sql.includes('SELECT id, role FROM users')) {
        return { get: selectGet };
      }
      if (sql.includes('INSERT INTO users')) {
        return { run: insertRun };
      }
      if (sql.includes('INSERT INTO user_settings')) {
        return { run: settingsRun };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const { requireAuth } = await import('./auth.js');
    const req = { session: {} };
    const res = createRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(selectGet).toHaveBeenCalled();
    expect(insertRun).toHaveBeenCalled();
    expect(settingsRun).toHaveBeenCalled();
    expect(req.session).toEqual({ userId: 42, role: 'admin' });
    expect(next).toHaveBeenCalled();
  });

  it('creates a session object when NO_AUTH is enabled and session is missing', async () => {
    process.env.NO_AUTH = 'true';
    const selectGet = vi.fn(() => ({ id: 7, role: 'admin' }));

    db.prepare = vi.fn((sql) => {
      if (sql.includes('SELECT id, role FROM users')) {
        return { get: selectGet };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const { requireAdmin } = await import('./auth.js');
    const req = {};
    const res = createRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(selectGet).toHaveBeenCalled();
    expect(req.session).toEqual({ userId: 7, role: 'admin' });
    expect(next).toHaveBeenCalled();
  });
});
