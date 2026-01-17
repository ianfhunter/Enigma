const API_URL = import.meta.env.VITE_API_URL || '';

// CSRF token cache
let csrfToken = null;
let csrfTokenPromise = null;

// Fetch CSRF token from server
async function getCsrfToken() {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }

  // If a request is already in flight, wait for it
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Fetch new token
  csrfTokenPromise = fetch(`${API_URL}/api/csrf-token`, {
    credentials: 'include',
  })
    .then(res => res.json())
    .then(data => {
      csrfToken = data.csrfToken;
      csrfTokenPromise = null;
      return csrfToken;
    })
    .catch(err => {
      csrfTokenPromise = null;
      console.error('Failed to fetch CSRF token:', err);
      throw err;
    });

  return csrfTokenPromise;
}

// Clear CSRF token (e.g., after logout)
export function clearCsrfToken() {
  csrfToken = null;
  csrfTokenPromise = null;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isRateLimit = status === 429 || data?.isRateLimit === true;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';

  // State-changing methods need CSRF token
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // Get CSRF token if needed
  let token = null;
  if (needsCsrf) {
    try {
      token = await getCsrfToken();
    } catch (err) {
      // If CSRF token fetch fails, still try the request
      // The server will reject it with a proper error
      console.warn('CSRF token fetch failed, proceeding anyway:', err);
    }
  }

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'X-CSRF-Token': token }),
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  // Handle no content response
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If CSRF token error, clear cache so we fetch a new one next time
    if (response.status === 403 && data?.error?.includes('CSRF')) {
      clearCsrfToken();
    }

    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

// Auth API
export const auth = {
  register: (username, password, displayName, email) =>
    request('/api/auth/register', {
      method: 'POST',
      body: { username, password, displayName, email }
    }),

  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    }),

  logout: () =>
    request('/api/auth/logout', { method: 'POST' }),

  me: () =>
    request('/api/auth/me'),
};

// User API
export const users = {
  updateProfile: (data) =>
    request('/api/users/profile', {
      method: 'PUT',
      body: data
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/users/password', {
      method: 'PUT',
      body: { currentPassword, newPassword }
    }),

  deleteAccount: (password) =>
    request('/api/users/account', {
      method: 'DELETE',
      body: { password }
    }),

  getSettings: () =>
    request('/api/users/settings'),

  updateSettings: (settings) =>
    request('/api/users/settings', {
      method: 'PUT',
      body: settings
    }),

  getSessions: () =>
    request('/api/users/sessions'),

  logoutAllSessions: () =>
    request('/api/users/sessions', { method: 'DELETE' }),

  logoutSession: (sid) =>
    request(`/api/users/sessions/${encodeURIComponent(sid)}`, { method: 'DELETE' }),

  getLoginHistory: (limit = 20) =>
    request(`/api/users/login-history?limit=${limit}`),
};

// Games API
export const games = {
  getProgress: (slug) =>
    request(`/api/games/${slug}/progress`),

  updateProgress: (slug, progress) =>
    request(`/api/games/${slug}/progress`, {
      method: 'PUT',
      body: progress
    }),

  getAllStats: () =>
    request('/api/games/stats'),

  exportProgress: () =>
    request('/api/games/export'),

  importProgress: (data, merge = true) =>
    request('/api/games/import', {
      method: 'POST',
      body: { games: data, merge }
    }),

  deleteAllProgress: () =>
    request('/api/games/progress', { method: 'DELETE' }),

  getLeaderboard: (slug, { sortBy = 'won', limit = 10 } = {}) =>
    request(`/api/games/${slug}/leaderboard?sortBy=${sortBy}&limit=${limit}`),
};

// Admin API
export const admin = {
  getStats: () =>
    request('/api/admin/stats'),

  getUsers: ({ search, limit = 50, offset = 0 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('limit', limit);
    params.set('offset', offset);
    return request(`/api/admin/users?${params}`);
  },

  getUser: (id) =>
    request(`/api/admin/users/${id}`),

  updateUser: (id, updates) =>
    request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: updates
    }),

  deleteUser: (id) =>
    request(`/api/admin/users/${id}`, { method: 'DELETE' }),

  getGameConfigs: () =>
    request('/api/admin/games'),

  updateGameConfig: (slug, config) =>
    request(`/api/admin/games/${slug}`, {
      method: 'PUT',
      body: config
    }),
};

// Packs API
export const packs = {
  /**
   * Get list of installed packs from backend
   */
  getInstalled: () =>
    request('/api/packs/installed'),

  /**
   * Check if a specific pack is installed
   */
  isInstalled: (packId) =>
    request(`/api/packs/installed/${encodeURIComponent(packId)}`),

  /**
   * Install a pack (enables backend plugin for community packs)
   */
  install: (packId, packType = 'community') =>
    request('/api/packs/install', {
      method: 'POST',
      body: { packId, packType }
    }),

  /**
   * Uninstall a pack (disables backend plugin for community packs)
   */
  uninstall: (packId) =>
    request('/api/packs/uninstall', {
      method: 'POST',
      body: { packId }
    }),

  /**
   * Get status of loaded plugins
   */
  getPluginStatus: () =>
    request('/api/packs/plugins/status'),

  /**
   * Manually trigger plugin reload
   */
  reloadPlugins: () =>
    request('/api/packs/plugins/reload', { method: 'POST' }),
};

// Community Sources API
export const communitySources = {
  /**
   * Get all community sources
   */
  getAll: () =>
    request('/api/community-sources'),

  /**
   * Get a single community source
   */
  get: (id) =>
    request(`/api/community-sources/${id}`),

  /**
   * Add a new community source (GitHub repository URL)
   */
  add: (url) =>
    request('/api/community-sources', {
      method: 'POST',
      body: { url }
    }),

  /**
   * Remove a community source (also uninstalls if installed)
   */
  remove: (id) =>
    request(`/api/community-sources/${id}`, { method: 'DELETE' }),

  /**
   * Check a source for updates
   */
  checkUpdate: (id) =>
    request(`/api/community-sources/${id}/check-update`, { method: 'POST' }),

  /**
   * Check all sources for updates
   */
  checkAllUpdates: () =>
    request('/api/community-sources/check-all-updates', { method: 'POST' }),

  /**
   * Get available versions for a source
   */
  getVersions: (id) =>
    request(`/api/community-sources/${id}/versions`),

  /**
   * Install a pack from a community source
   */
  install: (id, version = null) =>
    request(`/api/community-sources/${id}/install`, {
      method: 'POST',
      body: version ? { version } : {}
    }),

  /**
   * Uninstall a pack from a community source
   */
  uninstall: (id, deleteData = true) =>
    request(`/api/community-sources/${id}/uninstall`, {
      method: 'POST',
      body: { deleteData }
    }),

  /**
   * Update an installed pack to a newer version
   */
  update: (id, version = null) =>
    request(`/api/community-sources/${id}/update`, {
      method: 'POST',
      body: version ? { version } : {}
    }),

  /**
   * Refresh manifest metadata for a source
   */
  refreshManifest: (id) =>
    request(`/api/community-sources/${id}/refresh-manifest`, { method: 'POST' }),

  /**
   * Check if git is available on the server
   */
  checkGitStatus: () =>
    request('/api/community-sources/git-status'),

  /**
   * Get full manifests for all installed community packs
   * This includes game data for displaying in the main interface
   */
  getInstalledManifests: () =>
    request('/api/community-sources/installed-manifests'),
};

export { ApiError };
