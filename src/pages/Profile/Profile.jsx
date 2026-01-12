import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { users, games, admin } from '../../api/client';
import { allGames } from '../../data/gameRegistry';
import styles from './Profile.module.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'admin', label: 'Admin', icon: '🔧', adminOnly: true },
];

export default function Profile() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.notLoggedIn}>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <div className={styles.userHeader}>
          <span className={styles.avatar}>
            {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
          </span>
          <div className={styles.userInfo}>
            <h1 className={styles.displayName}>{user.displayName || user.username}</h1>
            <span className={styles.username}>@{user.username}</span>
            {isAdmin && <span className={styles.adminBadge}>Admin</span>}
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navLabel}>{tab.label}</span>
            </button>
          ))}
          <div className={styles.navDivider} />
          <button className={styles.logoutButton} onClick={logout}>
            🚪 Log Out
          </button>
        </nav>

        <main className={styles.content}>
          {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'games' && <GamesTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'admin' && isAdmin && <AdminTab />}
        </main>
      </div>
    </div>
  );
}

function ProfileTab({ user, updateUser }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { logout } = useAuth();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await users.updateProfile({
        displayName: displayName.trim(),
        email: email.trim() || null
      });
      updateUser({ displayName: result.displayName, email: result.email });
      setMessage({ type: 'success', text: 'Profile updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await users.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password changed!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await users.deleteAccount(deletePassword);
      logout();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>Profile</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Account Info</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Username</span>
            <span className={styles.infoValue}>{user.username}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Member Since</span>
            <span className={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Edit Profile</h3>
        <form onSubmit={handleUpdateProfile} className={styles.formVertical}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              maxLength={64}
              disabled={loading}
              placeholder="How others see you"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={loading}
              placeholder="your@email.com"
            />
            <span className={styles.formHint}>For account recovery (not required)</span>
          </div>
          <button type="submit" className={styles.button} disabled={loading || !displayName.trim()}>
            Update Profile
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Change Password</h3>
        <form onSubmit={handleChangePassword} className={styles.formVertical}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            Change Password
          </button>
        </form>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <h3 className={styles.cardTitle}>⚠️ Delete Account</h3>
        <p className={styles.cardDescription}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            className={styles.dangerButton}
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Delete My Account
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={styles.input}
              autoComplete="current-password"
            />
            <div className={styles.confirmButtons}>
              <button
                className={styles.dangerButton}
                onClick={handleDeleteAccount}
                disabled={loading || !deletePassword}
              >
                Yes, Delete My Account
              </button>
              <button
                className={styles.button}
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsTab() {
  const { settings, updateSetting, loading } = useSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSettingChange = async (key, value) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateSetting(key, value);
      setMessage({ type: 'success', text: 'Setting saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>Settings</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🎨 Theme</h3>
        <p className={styles.cardDescription}>
          Choose your preferred visual theme.
        </p>
        <div className={styles.optionSelector}>
          <button
            className={`${styles.optionButton} ${settings?.theme === 'dark' ? styles.active : ''}`}
            onClick={() => handleSettingChange('theme', 'dark')}
            disabled={saving}
          >
            <span className={styles.optionIcon}>🌙</span>
            <span className={styles.optionLabel}>Dark</span>
          </button>
          <button
            className={`${styles.optionButton} ${settings?.theme === 'light' ? styles.active : ''}`}
            onClick={() => handleSettingChange('theme', 'light')}
            disabled={saving}
          >
            <span className={styles.optionIcon}>☀️</span>
            <span className={styles.optionLabel}>Light</span>
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🔊 Sound Effects</h3>
        <p className={styles.cardDescription}>
          Enable or disable game sound effects.
        </p>
        <div className={styles.toggleRow}>
          <span>Sound effects</span>
          <button
            className={`${styles.toggle} ${settings?.soundEnabled ? styles.active : ''}`}
            onClick={() => handleSettingChange('soundEnabled', !settings?.soundEnabled)}
            disabled={saving}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🌐 Language</h3>
        <p className={styles.cardDescription}>
          Choose your preferred English variant for word games.
        </p>
        <div className={styles.variantSelector}>
          <button
            className={`${styles.variantOption} ${settings?.englishVariant === 'us' ? styles.active : ''}`}
            onClick={() => handleSettingChange('englishVariant', 'us')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🇺🇸</span>
            <span className={styles.variantLabel}>US English</span>
            <span className={styles.variantHint}>color, organize</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.englishVariant === 'uk' ? styles.active : ''}`}
            onClick={() => handleSettingChange('englishVariant', 'uk')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🇬🇧</span>
            <span className={styles.variantLabel}>UK English</span>
            <span className={styles.variantHint}>colour, organise</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function GamesTab() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('visibility'); // 'visibility' | 'stats'
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, statsData] = await Promise.all([
        users.getSettings(),
        games.getAllStats()
      ]);
      setSettings(settingsData);
      setStats(statsData);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGame = async (slug) => {
    const disabledGames = settings?.disabledGames || [];
    const isDisabled = disabledGames.includes(slug);
    const newDisabled = isDisabled
      ? disabledGames.filter(s => s !== slug)
      : [...disabledGames, slug];

    try {
      await users.updateSettings({ disabledGames: newDisabled });
      setSettings(prev => ({ ...prev, disabledGames: newDisabled }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleBulkAction = async (action) => {
    let newDisabled = [];

    switch (action) {
      case 'enableAll':
        newDisabled = [];
        break;
      case 'disableAll':
        newDisabled = allGames.map(g => g.slug);
        break;
      case 'enableDev':
        newDisabled = (settings?.disabledGames || []).filter(slug => {
          const game = allGames.find(g => g.slug === slug);
          return game && game.version !== 'DEV';
        });
        break;
      case 'disableDev':
        const devSlugs = allGames.filter(g => g.version === 'DEV').map(g => g.slug);
        const currentDisabled = settings?.disabledGames || [];
        newDisabled = [...new Set([...currentDisabled, ...devSlugs])];
        break;
      default:
        return;
    }

    try {
      await users.updateSettings({ disabledGames: newDisabled });
      setSettings(prev => ({ ...prev, disabledGames: newDisabled }));
      setMessage({ type: 'success', text: 'Games updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleExport = async () => {
    try {
      const data = await games.exportProgress();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enigma-progress-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Progress exported!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.games || !Array.isArray(data.games)) {
        throw new Error('Invalid export file format');
      }

      const result = await games.importProgress(data.games, true);
      setMessage({ type: 'success', text: result.message });
      loadData(); // Reload stats
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to import' });
    }

    e.target.value = ''; // Reset file input
  };

  const handleDeleteAllProgress = async () => {
    try {
      await games.deleteAllProgress();
      setStats({ totalPlayed: 0, totalWon: 0, gamesWithProgress: 0, games: [] });
      setMessage({ type: 'success', text: 'All game progress deleted!' });
      setConfirmDelete(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const disabledGames = settings?.disabledGames || [];
  const filteredGames = allGames.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const devGamesCount = allGames.filter(g => g.version === 'DEV').length;
  const enabledCount = allGames.length - disabledGames.length;

  // Create a map of game stats for quick lookup
  const gameStatsMap = new Map(stats?.games?.map(g => [g.gameSlug, g]) || []);

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>Game Settings</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className={styles.viewModeToggle}>
        <button
          className={`${styles.viewModeButton} ${viewMode === 'visibility' ? styles.active : ''}`}
          onClick={() => setViewMode('visibility')}
        >
          👁️ Visibility
        </button>
        <button
          className={`${styles.viewModeButton} ${viewMode === 'stats' ? styles.active : ''}`}
          onClick={() => setViewMode('stats')}
        >
          📊 My Stats
        </button>
      </div>

      {viewMode === 'stats' && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>📊 Overall Statistics</h3>

          {(!stats?.games || stats.games.length === 0) ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📊</span>
              <p className={styles.emptyText}>
                No stats available yet. Stats may be under development for some games,
                or maybe you just need to play some games!
              </p>
            </div>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats?.totalPlayed || 0}</span>
                  <span className={styles.statLabel}>Games Played</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats?.totalWon || 0}</span>
                  <span className={styles.statLabel}>Games Won</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {stats?.totalPlayed ? Math.round((stats.totalWon / stats.totalPlayed) * 100) : 0}%
                  </span>
                  <span className={styles.statLabel}>Win Rate</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats?.gamesWithProgress || 0}</span>
                  <span className={styles.statLabel}>Games Tried</span>
                </div>
              </div>

              <div className={styles.gameStatsList}>
                <h4 className={styles.cardSubtitle}>Per-Game Progress</h4>
                {stats.games.map(g => {
                  const gameInfo = allGames.find(ag => ag.slug === g.gameSlug);
                  return (
                    <div key={g.gameSlug} className={styles.gameStatItem}>
                      <div className={styles.gameStatName}>
                        {gameInfo?.title || g.gameSlug}
                      </div>
                      <div className={styles.gameStatDetails}>
                        <span>Played: {g.played}</span>
                        <span>Won: {g.won}</span>
                        <span>Win Rate: {g.winRate}%</span>
                        {g.maxStreak > 0 && <span>Best Streak: {g.maxStreak}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {viewMode === 'visibility' && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            Game Visibility
            <span className={styles.cardTitleMeta}>
              {enabledCount} of {allGames.length} enabled
            </span>
          </h3>
          <p className={styles.cardDescription}>
            Control which games appear on the home page. DEV games are in development and may be incomplete.
          </p>

          <div className={styles.bulkActions}>
            <button className={styles.bulkButton} onClick={() => handleBulkAction('enableAll')}>
              Enable All
            </button>
            <button className={styles.bulkButton} onClick={() => handleBulkAction('disableAll')}>
              Disable All
            </button>
            <span className={styles.bulkDivider}>|</span>
            <button className={styles.bulkButton} onClick={() => handleBulkAction('enableDev')}>
              Enable DEV ({devGamesCount})
            </button>
            <button className={styles.bulkButton} onClick={() => handleBulkAction('disableDev')}>
              Disable DEV
            </button>
          </div>

          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
          />
          <div className={styles.gameList}>
            {filteredGames.map(game => (
              <label key={game.slug} className={styles.gameItem}>
                <input
                  type="checkbox"
                  checked={!disabledGames.includes(game.slug)}
                  onChange={() => handleToggleGame(game.slug)}
                />
                <span className={styles.gameName}>{game.title}</span>
                <span className={`${styles.versionBadge} ${game.version === 'DEV' ? styles.devBadge : ''}`}>
                  {game.version || 'v1.0'}
                </span>
              </label>
            ))}
            {filteredGames.length === 0 && (
              <p className={styles.noResults}>No games match your search</p>
            )}
          </div>
        </section>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>💾 Progress Data</h3>
        <p className={styles.cardDescription}>
          Export your game progress to a file or import from a previous export.
        </p>
        <div className={styles.buttonRow}>
          <button className={styles.button} onClick={handleExport}>
            📤 Export Progress
          </button>
          <button className={styles.buttonSecondary} onClick={() => fileInputRef.current?.click()}>
            📥 Import Progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <h3 className={styles.cardTitle}>Danger Zone</h3>
        {!confirmDelete ? (
          <button
            className={styles.dangerButton}
            onClick={() => setConfirmDelete(true)}
          >
            🗑️ Delete All Game Progress
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <p>Are you sure? This cannot be undone.</p>
            <div className={styles.confirmButtons}>
              <button
                className={styles.dangerButton}
                onClick={handleDeleteAllProgress}
              >
                Yes, Delete Everything
              </button>
              <button
                className={styles.button}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SecurityTab() {
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load sessions and login history in parallel, but handle errors individually
      const [sessionsResult, historyResult] = await Promise.allSettled([
        users.getSessions(),
        users.getLoginHistory(20)
      ]);

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value || []);
      } else {
        console.error('Failed to load sessions:', sessionsResult.reason);
      }

      if (historyResult.status === 'fulfilled') {
        setLoginHistory(historyResult.value || []);
      } else {
        console.error('Failed to load login history:', historyResult.reason);
      }

      // Show error only if both failed
      if (sessionsResult.status === 'rejected' && historyResult.status === 'rejected') {
        setMessage({ type: 'error', text: 'Failed to load security data' });
      }
    } catch (err) {
      console.error('Security data error:', err);
      setMessage({ type: 'error', text: 'Failed to load security data' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sid) => {
    try {
      await users.logoutSession(sid);
      setSessions(prev => prev.filter(s => s.id !== sid));
      setMessage({ type: 'success', text: 'Session terminated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      const result = await users.logoutAllSessions();
      setSessions(prev => prev.filter(s => s.isCurrent));
      setMessage({ type: 'success', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatUserAgent = (ua) => {
    if (!ua || ua === 'unknown') return 'Unknown device';
    // Simple parsing - extract browser and OS
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Browser';
    const os = ua.includes('Windows') ? 'Windows' :
               ua.includes('Mac') ? 'macOS' :
               ua.includes('Linux') ? 'Linux' :
               ua.includes('Android') ? 'Android' :
               ua.includes('iPhone') ? 'iOS' : 'Unknown OS';
    return `${browser.split('/')[0]} on ${os}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading security data...</div>;
  }

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>Security</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>
          🖥️ Active Sessions
          <span className={styles.cardTitleMeta}>{sessions.length} active</span>
        </h3>
        <p className={styles.cardDescription}>
          Manage devices where you&apos;re currently logged in.
        </p>

        {sessions.length > 1 && (
          <button
            className={styles.dangerButton}
            onClick={handleLogoutAllSessions}
            style={{ marginBottom: '1rem' }}
          >
            🚪 Log Out All Other Sessions
          </button>
        )}

        <div className={styles.sessionList}>
          {sessions.map(session => (
            <div key={session.id} className={styles.sessionItem}>
              <div className={styles.sessionInfo}>
                <span className={styles.sessionDevice}>
                  {session.isCurrent ? '📍 This device' : '💻 Other device'}
                </span>
                <span className={styles.sessionExpiry}>
                  Expires: {new Date(session.expiresAt).toLocaleDateString()}
                </span>
              </div>
              {!session.isCurrent && (
                <button
                  className={styles.actionButtonDanger}
                  onClick={() => handleLogoutSession(session.id)}
                >
                  Log Out
                </button>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🖥️</span>
              <p className={styles.emptyText}>
                No active sessions found. This may happen if sessions are stored differently
                or your current session hasn&apos;t been recorded yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>📜 Login History</h3>
        <p className={styles.cardDescription}>
          Recent login attempts to your account.
        </p>

        <div className={styles.historyList}>
          {loginHistory.map((entry, index) => (
            <div key={index} className={`${styles.historyItem} ${!entry.success ? styles.historyFailed : ''}`}>
              <div className={styles.historyInfo}>
                <span className={styles.historyStatus}>
                  {entry.success ? '✅' : '❌'} {entry.success ? 'Successful login' : 'Failed attempt'}
                </span>
                <span className={styles.historyDevice}>{formatUserAgent(entry.userAgent)}</span>
              </div>
              <div className={styles.historyMeta}>
                <span className={styles.historyIp}>{entry.ipAddress}</span>
                <span className={styles.historyTime}>
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {loginHistory.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📜</span>
              <p className={styles.emptyText}>
                No login history recorded yet. Your future login attempts will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AdminTab() {
  const [serverStats, setServerStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [gameConfigs, setGameConfigs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [activeSection, setActiveSection] = useState('stats'); // 'stats' | 'users' | 'games'
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
    }
  }, [search, activeSection]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, configsData] = await Promise.all([
        admin.getStats(),
        admin.getGameConfigs()
      ]);
      setServerStats(statsData);
      setGameConfigs(configsData);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load admin data' });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await admin.getUsers({ search, limit: 50 });
      setUsersList(data.users);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await admin.updateUser(userId, { role: newRole });
      setUsersList(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setMessage({ type: 'success', text: 'User role updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    try {
      await admin.updateUser(userId, { newPassword });
      setNewPassword('');
      setEditingUser(null);
      setMessage({ type: 'success', text: 'Password reset!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) return;
    try {
      await admin.deleteUser(userId);
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleGameConfig = async (slug, currentEnabled) => {
    try {
      await admin.updateGameConfig(slug, { enabled: !currentEnabled });
      setGameConfigs(prev => {
        const existing = prev.find(g => g.gameSlug === slug);
        if (existing) {
          return prev.map(g => g.gameSlug === slug ? { ...g, enabled: !currentEnabled } : g);
        }
        return [...prev, { gameSlug: slug, enabled: !currentEnabled, settings: {} }];
      });
      setMessage({ type: 'success', text: `Game ${!currentEnabled ? 'enabled' : 'disabled'} server-wide!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading admin data...</div>;
  }

  // Create a map of game configs
  const configMap = new Map(gameConfigs.map(g => [g.gameSlug, g]));

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>Admin Panel</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Section Toggle */}
      <div className={styles.viewModeToggle}>
        <button
          className={`${styles.viewModeButton} ${activeSection === 'stats' ? styles.active : ''}`}
          onClick={() => setActiveSection('stats')}
        >
          📊 Stats
        </button>
        <button
          className={`${styles.viewModeButton} ${activeSection === 'users' ? styles.active : ''}`}
          onClick={() => setActiveSection('users')}
        >
          👥 Users
        </button>
        <button
          className={`${styles.viewModeButton} ${activeSection === 'games' ? styles.active : ''}`}
          onClick={() => setActiveSection('games')}
        >
          🎮 Games
        </button>
      </div>

      {activeSection === 'stats' && serverStats && (
        <>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>📈 Server Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.users.total}</span>
                <span className={styles.statLabel}>Total Users</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.users.admins}</span>
                <span className={styles.statLabel}>Admins</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.activeSessions}</span>
                <span className={styles.statLabel}>Active Sessions</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.games.uniqueGamesPlayed}</span>
                <span className={styles.statLabel}>Games Played</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>🔐 Login Activity</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.logins.last24h}</span>
                <span className={styles.statLabel}>Last 24 Hours</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.logins.last7d}</span>
                <span className={styles.statLabel}>Last 7 Days</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.logins.last30d}</span>
                <span className={styles.statLabel}>Last 30 Days</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>🏆 Popular Games</h3>
            {serverStats.popularGames?.length > 0 ? (
              <div className={styles.popularGamesList}>
                {serverStats.popularGames.map((game, index) => {
                  const gameInfo = allGames.find(g => g.slug === game.gameSlug);
                  return (
                    <div key={game.gameSlug} className={styles.popularGameItem}>
                      <span className={styles.popularGameRank}>#{index + 1}</span>
                      <span className={styles.popularGameName}>
                        {gameInfo?.title || game.gameSlug}
                      </span>
                      <span className={styles.popularGamePlays}>
                        {game.totalPlays} plays by {game.players} players
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🏆</span>
                <p className={styles.emptyText}>
                  No stats available yet. Stats may be under development for some games,
                  or maybe users just need to play some games!
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {activeSection === 'users' && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>User Management</h3>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.input}
          />

          <div className={styles.userList}>
            {usersList.map(u => (
              <div key={u.id} className={styles.userItem}>
                <div className={styles.userItemInfo}>
                  <span className={styles.userAvatar}>
                    {(u.displayName || u.username)[0].toUpperCase()}
                  </span>
                  <div className={styles.userDetails}>
                    <span className={styles.userDisplayName}>
                      {u.displayName || u.username}
                      {u.role === 'admin' && <span className={styles.adminBadge}>Admin</span>}
                    </span>
                    <span className={styles.userUsername}>@{u.username}</span>
                  </div>
                </div>

                {editingUser === u.id ? (
                  <div className={styles.resetPassword}>
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.smallInput}
                    />
                    <button
                      className={styles.smallButton}
                      onClick={() => handleResetPassword(u.id)}
                    >
                      Set
                    </button>
                    <button
                      className={styles.smallButtonSecondary}
                      onClick={() => { setEditingUser(null); setNewPassword(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className={styles.userActions}>
                    {u.id !== currentUser.id && (
                      <>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleToggleAdmin(u.id, u.role)}
                          title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        >
                          {u.role === 'admin' ? '👤 Demote' : '👑 Promote'}
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => setEditingUser(u.id)}
                          title="Reset password"
                        >
                          🔑 Reset
                        </button>
                        <button
                          className={styles.actionButtonDanger}
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title="Delete user"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                    {u.id === currentUser.id && (
                      <span className={styles.youBadge}>You</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {usersList.length === 0 && (
              <p className={styles.noResults}>No users found</p>
            )}
          </div>
        </section>
      )}

      {activeSection === 'games' && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Server Game Configuration</h3>
          <p className={styles.cardDescription}>
            Enable or disable games server-wide. Disabled games won&apos;t appear for any user.
          </p>
          <div className={styles.gameConfigList}>
            {allGames.map(game => {
              const config = configMap.get(game.slug);
              const isEnabled = config ? config.enabled : true;
              return (
                <div key={game.slug} className={styles.gameConfigItem}>
                  <div className={styles.gameConfigInfo}>
                    <span className={styles.gameConfigName}>{game.title}</span>
                    <span className={`${styles.versionBadge} ${game.version === 'DEV' ? styles.devBadge : ''}`}>
                      {game.version || 'v1.0'}
                    </span>
                  </div>
                  <button
                    className={`${styles.toggle} ${isEnabled ? styles.active : ''}`}
                    onClick={() => handleToggleGameConfig(game.slug, isEnabled)}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
