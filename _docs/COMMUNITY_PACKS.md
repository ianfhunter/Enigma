# Community Packs & Plugins

Enigma supports community-created puzzle packs that can include custom games, components, and even backend APIs. This guide covers how to install, manage, and create community packs.

## Table of Contents

- [Installing Community Packs](#installing-community-packs)
- [Managing Sources](#managing-sources)
- [Local Development](#local-development)
- [Creating Your Own Pack](#creating-your-own-pack)
- [Enigma SDK](#enigma-sdk)
- [Pack Structure](#pack-structure)
- [Manifest Reference](#manifest-reference)
- [Backend Plugins](#backend-plugins)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## Installing Community Packs

### Via the Game Store UI

The easiest way to install community packs is through the Game Store:

1. Navigate to **Game Store** → **Community Packs** tab
2. In the "Community Sources" section, enter a GitHub repository URL:
   - SSH format: `git@github.com:username/repo.git`
   - HTTPS format: `https://github.com/username/repo`
3. Click **Add Source**
4. The pack's metadata will be fetched and displayed
5. Click **Install** to download and activate the pack

### Version Management

- Packs are installed at their **latest semantic version tag** (e.g., `v1.2.0`)
- Use **Check for Updates** to see if newer versions are available
- Click **Update** to upgrade to the latest version
- You can also use **Check All for Updates** to batch-check all sources

### Example Repository

Try the sample community pack:
```
git@github.com:ianfhunter/EnigmaSampleCommunityPack.git
```

---

## Managing Sources

### Adding Sources

When you add a GitHub repository URL, Enigma will:
1. Check for available semantic version tags (e.g., `v1.0.0`)
2. Fetch the `manifest.js` from the **latest tagged version** (not main/master)
3. Cache the pack's metadata (name, description, icon, etc.)
4. Display the pack in your Community Sources list

> **Note**: Repositories without any semver tags cannot be added. This ensures the metadata shown matches what will actually be installed.

### Removing Sources

Click the **✕** button on any source card to remove it. If the pack was installed, it will be uninstalled first.

### Updating Packs

When an update is available, the source card shows an orange "Update" badge:
- Click **Update to vX.X.X** to upgrade
- This performs a fresh clone of the new version
- Your plugin data is preserved during updates

---

## Local Development

For pack developers, Enigma supports local paths as sources for rapid iteration with hot-reload.

### Adding a Local Source

In the Game Store, you can add local paths instead of GitHub URLs:

```
file:///home/user/my-pack
/absolute/path/to/my-pack
./relative/path/to/my-pack
```

When you install a local source:
- A **symlink** is created instead of cloning
- Changes to your pack files trigger **hot-reload**
- Version is marked as `dev`

### Symlink Method (Alternative)

You can also manually create a symlink:

```bash
# Create symlink to your development pack
ln -s /path/to/my-pack-dev /path/to/Enigma/.plugins/my-pack-id

# The Vite watcher will auto-detect changes!
```

### Development Workflow

1. Create your pack directory with `manifest.js`
2. Add as local source or create symlink
3. Install via the Game Store
4. Edit files → changes auto-reload
5. When ready, push to GitHub and create a semver tag

---

## Enigma SDK

Community packs can import shared components, hooks, and utilities from the `@enigma` SDK alias.

### Available Exports

```javascript
import {
  // Components
  GameHeader,       // Standard game header with back button
  Timer,            // Time display component
  GiveUpButton,     // Give up button with optional confirmation
  StatsPanel,       // Statistics display panel
  GameResult,       // Win/lose/gave-up result display
  DifficultySelector,
  SizeSelector,
  ModeSelector,

  // Hooks
  useTimer,         // Timer logic with start/stop/reset
  useGameStats,     // Game stats with localStorage persistence
  usePersistedState,// useState with localStorage
  useKeyboardInput, // Keyboard event handling

  // Utilities
  renderIcon,       // Render emoji or SVG icon
  fuzzySearch,      // Fuzzy string matching
  createPackApi,    // API client for pack backend

  // Seeding (for reproducible puzzles)
  createSeededRNG,  // Seeded random number generator
  seededShuffle,    // Shuffle array with seed
  seededChoice,     // Pick random element with seed
  seededInt,        // Random integer with seed
  getTodaysSeed,    // Get seed for today's date
  getSeedForDate,   // Get seed for any date
  parseSeedFromUrl, // Parse seed from URL params
  hashString,       // Hash string to seed value
  generateRandomSeed,
} from '@enigma';
```

### API Helper

Use `createPackApi()` for easy backend communication with automatic CSRF handling:

```javascript
import { createPackApi } from '@enigma';

const api = createPackApi('my-pack-id');

// GET request
const data = await api.get('/leaderboard');

// POST request (handles CSRF automatically)
await api.post('/submit-score', { score: 100, time: 42 });

// Other methods
await api.put('/update', { ... });
await api.delete('/item/123');
```

### Seeding for Reproducible Puzzles

Games should be reproducible given a seed number:

```javascript
import { createSeededRNG, seededShuffle, getTodaysSeed } from '@enigma';

// Daily puzzle: same seed for everyone today
const seed = getTodaysSeed('my-game');
const rng = createSeededRNG(seed);

// Use rng for all randomness
const shuffled = seededShuffle(items, rng);
const randomNum = Math.floor(rng() * 100);

// Display seed so users can share specific puzzles
console.log(`Puzzle #${seed}`);
```

---

## Creating Your Own Pack

### Quick Start

1. Create a new GitHub repository with this structure:
   ```
   my-puzzle-pack/
   ├── manifest.js           # Required: Pack metadata
   ├── games/                 # Your game components
   │   └── MyGame/
   │       ├── index.jsx
   │       └── MyGame.module.css
   ├── components/            # Shared components (optional)
   └── backend/               # Backend plugin (optional)
       └── plugin.js
   ```

2. Create a `manifest.js` with your pack info (see [Manifest Reference](#manifest-reference))

3. Tag a release with a semantic version:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. Share your repository URL with users!

### Versioning

Enigma uses **semantic versioning** to manage pack versions:
- Tags must follow semver format: `v1.0.0`, `1.0.0`, `v2.1.0-beta`, etc.
- Only tagged releases can be installed (not `main`/`master`)
- Users can check for and install updates through the UI

---

## Pack Structure

```
my-pack/
├── manifest.js              # Pack metadata and game registry
├── README.md                # Documentation (optional but recommended)
│
├── games/                   # Game components
│   ├── GameOne/
│   │   ├── index.jsx        # Main component (lazy-loaded)
│   │   └── GameOne.module.css
│   └── GameTwo/
│       └── index.jsx
│
├── components/              # Shared UI components
│   └── SharedComponent/
│       ├── index.js
│       ├── SharedComponent.jsx
│       └── SharedComponent.module.css
│
├── backend/                 # Backend plugin (optional)
│   └── plugin.js            # API routes and database migrations
│
└── assets/                  # Static assets (optional)
    └── images/
```

### Key Files

| File | Required | Purpose |
|------|----------|---------|
| `manifest.js` | ✅ Yes | Pack metadata, game definitions, configuration |
| `backend/plugin.js` | ❌ No | Server-side API routes and database |
| `games/*/index.jsx` | ✅ Yes | React components for each game |
| `README.md` | ❌ No | Documentation for your pack |

---

## Manifest Reference

The `manifest.js` file defines your pack's metadata and games:

```javascript
const myPack = {
  // Required fields
  id: 'my-pack-id',           // Unique identifier (alphanumeric, hyphens)
  name: 'My Puzzle Pack',     // Display name
  description: 'A collection of fun puzzles',

  // Optional metadata
  type: 'community',          // 'official' | 'community' | 'custom'
  version: '1.0.0',           // Semantic version
  author: 'Your Name',
  icon: '🧩',                 // Emoji or path to icon
  color: '#8b5cf6',           // Theme color (hex)

  // Pack behavior
  default: false,             // Auto-install? (usually false for community)
  removable: true,            // Can users uninstall?
  hasBackend: false,          // Has backend/plugin.js?

  // Game definitions
  categories: [
    {
      name: 'Category Name',
      icon: '🎮',
      description: 'Games in this category',
      games: [
        {
          slug: 'my-game',              // URL-safe identifier
          title: 'My Game',             // Display title
          description: 'Game description',
          icon: '🎯',
          emojiIcon: '🎯',
          colors: {
            primary: '#8b5cf6',
            secondary: '#7c3aed'
          },
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          version: 'v1.0',
          component: () => import('./games/MyGame'),  // Lazy load
        },
      ],
    },
  ],

  // Helper methods (recommended)
  get allGames() {
    return this.categories.flatMap(cat =>
      cat.games.map(game => ({ ...game, categoryName: cat.name }))
    );
  },

  getGameBySlug(slug) {
    return this.allGames.find(g => g.slug === slug);
  },

  get gameCount() {
    return this.allGames.length;
  },

  getPreviewGames() {
    return this.allGames.slice(0, 4);
  },
};

export default myPack;
```

---

## Backend Plugins

If your pack needs server-side functionality (APIs, databases, authentication), create a `backend/plugin.js`:

### Plugin Structure

```javascript
export default {
  name: 'my-pack-id',         // Must match manifest.id
  version: '1.0.0',

  // Database migrations (run automatically)
  migrations: [
    {
      version: 1,
      up: `
        CREATE TABLE IF NOT EXISTS my_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          data TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      version: 2,
      up: `ALTER TABLE my_table ADD COLUMN extra TEXT;`
    }
  ],

  // Register API routes
  register(router, context) {
    // Public endpoint
    router.get('/data', (req, res) => {
      const rows = context.db.all('SELECT * FROM my_table');
      res.json({ data: rows });
    });

    // Authenticated endpoint
    router.post('/save', context.requireAuth, (req, res) => {
      const user = context.getCurrentUser(req);
      context.db.run(
        'INSERT INTO my_table (user_id, data) VALUES (?, ?)',
        [user.id, req.body.data]
      );
      res.json({ success: true });
    });
  }
};
```

### API Routes

Routes are mounted at `/api/packs/{pack-id}/`:
- `GET /api/packs/my-pack-id/data`
- `POST /api/packs/my-pack-id/save`

### Context Object

The `context` parameter provides:

| Property | Description |
|----------|-------------|
| `context.db` | Plugin's **isolated** SQLite database |
| `context.db.run(sql, params)` | Execute INSERT/UPDATE/DELETE |
| `context.db.get(sql, params)` | Get single row |
| `context.db.all(sql, params)` | Get all rows |
| `context.db.exec(sql)` | Execute raw SQL |
| `context.requireAuth` | Middleware requiring authentication |
| `context.getCurrentUser(req)` | Get `{ id }` of logged-in user |
| `context.core.getUser(id)` | Get user info (read-only) |
| `context.core.getUsers(ids)` | Get multiple users |
| `context.core.getUsernameMap(ids)` | Map of user IDs to usernames |

### Database Isolation

🔒 **Security**: Each plugin has its own isolated SQLite database. Plugins **cannot** access:
- User passwords or sessions
- Other plugins' data
- Core Enigma tables

Read-only access to user info is available through `context.core.*` APIs.

### Calling Your API from Frontend

Use the `createPackApi` helper from the SDK (recommended):

```javascript
import { createPackApi } from '@enigma';

const api = createPackApi('my-pack-id');

// GET request
const data = await api.get('/data');

// POST request (handles CSRF automatically)
await api.post('/save', { data: 'value' });
```

Or manually:

```javascript
// In your game component
const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchData() {
  const response = await fetch(`${API_URL}/api/packs/my-pack-id/data`, {
    credentials: 'include',
  });
  return response.json();
}

async function saveData(data) {
  // Get CSRF token first
  const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: 'include' });
  const { csrfToken } = await csrfRes.json();

  const response = await fetch(`${API_URL}/api/packs/my-pack-id/save`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ data }),
  });
  return response.json();
}
```

---

## Security Considerations

### ⚠️ Warning for Users

Community packs with backends run server-side code on your Enigma installation:
- Only install packs from **trusted sources**
- Review the repository code before installing
- Backend plugins have access to their own database
- Malicious plugins could potentially affect server performance

### For Pack Authors

- Never store sensitive user data unnecessarily
- Use `context.requireAuth` for user-specific endpoints
- Validate all user input
- Follow the principle of least privilege
- Document what data your pack collects

### Plugin Protections

Enigma applies these protections to all plugins:
- **Database isolation**: Separate SQLite file per plugin
- **Rate limiting**: 100 requests/minute per plugin
- **Database size limits**: 50MB max per plugin
- **Error boundaries**: Plugin crashes don't affect other plugins

---

## Troubleshooting

### "Git is not available on the server"

The Docker container needs git installed. Ensure your `docker-compose.yml` includes:
```yaml
command: >
  sh -c "apk add --no-cache git && npm install && npm start"
```
Then recreate the container: `docker-compose up -d --force-recreate enigma-backend`

### "Could not find manifest.js"

Ensure your repository has a `manifest.js` file in the root directory (not in a subdirectory).

### "No semver tags found"

Create a semantic version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Plugin not loading after install

1. Check Docker logs: `docker-compose logs enigma-backend`
2. Ensure the pack is in the installed packs database
3. Try reloading plugins: `POST /api/packs/plugins/reload`

### API routes returning 404

- Verify `backend/plugin.js` exists and exports correctly
- Check that `name` in plugin matches `id` in manifest
- Ensure the pack is installed (not just added as a source)

---

## Example Pack

See the [EnigmaSampleCommunityPack](https://github.com/ianfhunter/EnigmaSampleCommunityPack) repository for a complete working example with:
- Frontend game component
- Backend API with authentication
- Database migrations
- Leaderboard system
- User statistics

---

## API Reference

### Community Sources Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/community-sources` | List all sources |
| POST | `/api/community-sources` | Add a new source |
| DELETE | `/api/community-sources/:id` | Remove a source |
| POST | `/api/community-sources/:id/install` | Install pack |
| POST | `/api/community-sources/:id/uninstall` | Uninstall pack |
| POST | `/api/community-sources/:id/update` | Update to new version |
| POST | `/api/community-sources/:id/check-update` | Check for updates |
| POST | `/api/community-sources/check-all-updates` | Check all sources |
| GET | `/api/community-sources/git-status` | Check git availability |

### Plugin Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packs/installed` | List installed packs |
| POST | `/api/packs/install` | Install a pack |
| POST | `/api/packs/uninstall` | Uninstall a pack |
| GET | `/api/packs/plugins/status` | Get loaded plugins |
| POST | `/api/packs/plugins/reload` | Reload all plugins |
