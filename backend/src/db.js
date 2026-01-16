import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.DB_PATH || './data/enigma.db';

// Ensure data directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Migration: Fix sessions table if it has wrong column name
try {
  const tableInfo = db.prepare("PRAGMA table_info(sessions)").all();
  const hasExpiredColumn = tableInfo.some(col => col.name === 'expired');
  const hasExpireColumn = tableInfo.some(col => col.name === 'expire');

  if (hasExpiredColumn && !hasExpireColumn) {
    console.log('Migrating sessions table: renaming "expired" to "expire"');
    db.exec('DROP TABLE IF EXISTS sessions');
    db.exec('DROP INDEX IF EXISTS idx_sessions_expired');
  }
} catch (e) {
  // Table might not exist yet, that's fine
}

// Initialize schema
db.exec(`
  -- Users: core account data
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- User settings (language, preferences)
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    english_variant TEXT DEFAULT 'us',
    theme TEXT DEFAULT 'dark' CHECK(theme IN ('dark', 'light')),
    sound_enabled INTEGER DEFAULT 1,
    disabled_games TEXT DEFAULT '[]',
    game_preferences TEXT DEFAULT '{}'
  );

  -- Game progress: per-user, per-game stats
  CREATE TABLE IF NOT EXISTS game_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_slug TEXT NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    best_score INTEGER,
    best_time INTEGER,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    extra_data TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, game_slug)
  );

  -- Server-wide game config (admin-controlled)
  CREATE TABLE IF NOT EXISTS server_game_config (
    game_slug TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    settings TEXT DEFAULT '{}'
  );

  -- Sessions table for express-session (better-sqlite3-session-store expects 'expire' column)
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );

  -- Login history for security tracking
  CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Create index for session expiry cleanup
  CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

  -- Create index for game progress lookups
  CREATE INDEX IF NOT EXISTS idx_game_progress_user ON game_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_game_progress_game ON game_progress(game_slug);

  -- Create index for login history
  CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);

  -- Installed packs: tracks which community packs are installed
  -- Official packs (type='official') are always available
  -- Community packs must be explicitly installed
  CREATE TABLE IF NOT EXISTS installed_packs (
    pack_id TEXT PRIMARY KEY,
    pack_type TEXT NOT NULL CHECK(pack_type IN ('official', 'community', 'custom')),
    installed_at TEXT DEFAULT (datetime('now')),
    installed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
  );
`);

// Migrations for existing databases
function runMigrations() {
  // Add email column to users if missing
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('email')) {
    console.log('Migration: Adding email column to users');
    db.exec('ALTER TABLE users ADD COLUMN email TEXT');
  }

  // Add theme and sound_enabled to user_settings if missing
  const settingsCols = db.prepare("PRAGMA table_info(user_settings)").all().map(c => c.name);
  if (!settingsCols.includes('theme')) {
    console.log('Migration: Adding theme column to user_settings');
    db.exec("ALTER TABLE user_settings ADD COLUMN theme TEXT DEFAULT 'dark'");
  }
  if (!settingsCols.includes('sound_enabled')) {
    console.log('Migration: Adding sound_enabled column to user_settings');
    db.exec('ALTER TABLE user_settings ADD COLUMN sound_enabled INTEGER DEFAULT 1');
  }
}

runMigrations();

export default db;
