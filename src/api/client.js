const API_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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

export { ApiError };
