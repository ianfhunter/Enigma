import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { users, games, admin } from '../../api/client';
import { allGames } from '../../data/gameRegistry';
import { supportedLanguages } from '../../i18n';
import styles from './Profile.module.css';

export default function Profile() {
  const { t } = useTranslation();
  const { user, isAdmin, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const TABS = [
    { id: 'profile', label: t('profile.title'), icon: '👤' },
    { id: 'settings', label: t('profile.settings'), icon: '⚙️' },
    { id: 'games', label: t('profile.games'), icon: '🎮' },
    { id: 'security', label: t('profile.security'), icon: '🔒' },
    { id: 'admin', label: t('profile.admin'), icon: '🔧', adminOnly: true },
  ];

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.notLoggedIn}>
          <p>{t('profile.pleaseLogIn')}</p>
        </div>
      </div>
    );
  }

  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>{t('common.backToGames')}</Link>
        <div className={styles.userHeader}>
          <span className={styles.avatar}>
            {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
          </span>
          <div className={styles.userInfo}>
            <h1 className={styles.displayName}>{user.displayName || user.username}</h1>
            <span className={styles.username}>@{user.username}</span>
            {isAdmin && <span className={styles.adminBadge}>{t('profile.admin')}</span>}
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
            🚪 {t('profile.logOut')}
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
  const { t } = useTranslation();
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
      setMessage({ type: 'success', text: t('profile.profileUpdated') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('profile.passwordsDoNotMatch') });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.passwordTooShort') });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await users.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: t('profile.passwordChanged') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: t('profile.enterPasswordToConfirm') });
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
      <h2 className={styles.pageTitle}>{t('profile.title')}</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t('profile.accountInfo')}</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{t('profile.username')}</span>
            <span className={styles.infoValue}>{user.username}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{t('profile.memberSince')}</span>
            <span className={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t('profile.editProfile')}</h3>
        <form onSubmit={handleUpdateProfile} className={styles.formVertical}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('profile.displayName')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              maxLength={64}
              disabled={loading}
              placeholder={t('profile.displayNamePlaceholder')}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('profile.emailOptional')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={loading}
              placeholder={t('profile.emailPlaceholder')}
            />
            <span className={styles.formHint}>{t('profile.emailHint')}</span>
          </div>
          <button type="submit" className={styles.button} disabled={loading || !displayName.trim()}>
            {t('profile.updateProfile')}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t('profile.changePassword')}</h3>
        <form onSubmit={handleChangePassword} className={styles.formVertical}>
          <input
            type="password"
            placeholder={t('profile.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
            disabled={loading}
          />
          <input
            type="password"
            placeholder={t('profile.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
            disabled={loading}
          />
          <input
            type="password"
            placeholder={t('profile.confirmNewPassword')}
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
            {t('profile.changePassword')}
          </button>
        </form>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <h3 className={styles.cardTitle}>⚠️ {t('profile.deleteAccount')}</h3>
        <p className={styles.cardDescription}>
          {t('profile.deleteAccountWarning')}
        </p>
        {!showDeleteConfirm ? (
          <button
            className={styles.dangerButton}
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ {t('profile.deleteMyAccount')}
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <input
              type="password"
              placeholder={t('profile.enterPasswordToConfirm')}
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
                {t('profile.yesDeleteMyAccount')}
              </button>
              <button
                className={styles.button}
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting, loading } = useSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSettingChange = async (key, value) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateSetting(key, value);
      // If changing language, update i18n immediately
      if (key === 'language') {
        i18n.changeLanguage(value);
      }
      setMessage({ type: 'success', text: t('common.settingSaved') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('settings.loadingSettings')}</div>;
  }

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>{t('settings.title')}</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🎨 {t('settings.theme')}</h3>
        <p className={styles.cardDescription}>
          {t('settings.themeDescription')}
        </p>
        <div className={styles.optionSelector}>
          <button
            className={`${styles.optionButton} ${settings?.theme === 'dark' ? styles.active : ''}`}
            onClick={() => handleSettingChange('theme', 'dark')}
            disabled={saving}
          >
            <span className={styles.optionIcon}>🌙</span>
            <span className={styles.optionLabel}>{t('settings.dark')}</span>
          </button>
          <button
            className={`${styles.optionButton} ${settings?.theme === 'light' ? styles.active : ''}`}
            onClick={() => handleSettingChange('theme', 'light')}
            disabled={saving}
          >
            <span className={styles.optionIcon}>☀️</span>
            <span className={styles.optionLabel}>{t('settings.light')}</span>
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🌍 {t('settings.interfaceLanguage')}</h3>
        <p className={styles.cardDescription}>
          {t('settings.interfaceLanguageDescription')}
        </p>
        <div className={styles.variantSelector}>
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.variantOption} ${settings?.language === lang.code ? styles.active : ''}`}
              onClick={() => handleSettingChange('language', lang.code)}
              disabled={saving}
            >
              <span className={styles.flagIcon}>{lang.flag}</span>
              <span className={styles.variantLabel}>{lang.name}</span>
            </button>
          ))}
        </div>
        <p className={styles.cardHint} style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.7 }}>
          {t('settings.moreLanguagesComingSoon')}
        </p>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🔊 {t('settings.soundEffects')}</h3>
        <p className={styles.cardDescription}>
          {t('settings.soundEffectsDescription')}
        </p>
        <div className={styles.toggleRow}>
          <span>{t('settings.soundEffects')}</span>
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
        <h3 className={styles.cardTitle}>🌐 {t('settings.englishVariant')}</h3>
        <p className={styles.cardDescription}>
          {t('settings.englishVariantDescription')}
        </p>
        <div className={styles.variantSelector}>
          <button
            className={`${styles.variantOption} ${settings?.englishVariant === 'us' ? styles.active : ''}`}
            onClick={() => handleSettingChange('englishVariant', 'us')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🇺🇸</span>
            <span className={styles.variantLabel}>{t('settings.usEnglish')}</span>
            <span className={styles.variantHint}>{t('settings.usEnglishExamples')}</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.englishVariant === 'uk' ? styles.active : ''}`}
            onClick={() => handleSettingChange('englishVariant', 'uk')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🇬🇧</span>
            <span className={styles.variantLabel}>{t('settings.ukEnglish')}</span>
            <span className={styles.variantHint}>{t('settings.ukEnglishExamples')}</span>
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>🔍 {t('settings.dictionarySearch')}</h3>
        <p className={styles.cardDescription}>
          {t('settings.dictionarySearchDescription')}
        </p>
        <div className={styles.variantSelector}>
          <button
            className={`${styles.variantOption} ${settings?.searchEngine === 'google' ? styles.active : ''}`}
            onClick={() => handleSettingChange('searchEngine', 'google')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🔍</span>
            <span className={styles.variantLabel}>Google</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.searchEngine === 'bing' ? styles.active : ''}`}
            onClick={() => handleSettingChange('searchEngine', 'bing')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🔍</span>
            <span className={styles.variantLabel}>Bing</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.searchEngine === 'duckduckgo' ? styles.active : ''}`}
            onClick={() => handleSettingChange('searchEngine', 'duckduckgo')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🦆</span>
            <span className={styles.variantLabel}>DuckDuckGo</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.searchEngine === 'yahoo' ? styles.active : ''}`}
            onClick={() => handleSettingChange('searchEngine', 'yahoo')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🔍</span>
            <span className={styles.variantLabel}>Yahoo</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.searchEngine === 'brave' ? styles.active : ''}`}
            onClick={() => handleSettingChange('searchEngine', 'brave')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🦁</span>
            <span className={styles.variantLabel}>Brave Search</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function GamesTab() {
  const { t } = useTranslation();
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
      setMessage({ type: 'error', text: t('games.failedToLoad') });
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
      default:
        return;
    }

    try {
      await users.updateSettings({ disabledGames: newDisabled });
      setSettings(prev => ({ ...prev, disabledGames: newDisabled }));
      setMessage({ type: 'success', text: t('games.gamesUpdated') });
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
      setMessage({ type: 'success', text: t('games.progressExported') });
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
        throw new Error(t('games.invalidExportFormat'));
      }

      const result = await games.importProgress(data.games, true);
      setMessage({ type: 'success', text: result.message });
      loadData(); // Reload stats
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('games.failedToImport') });
    }

    e.target.value = ''; // Reset file input
  };

  const handleDeleteAllProgress = async () => {
    try {
      await games.deleteAllProgress();
      setStats({ totalPlayed: 0, totalWon: 0, gamesWithProgress: 0, games: [] });
      setMessage({ type: 'success', text: t('games.progressDeleted') });
      setConfirmDelete(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('common.loading')}</div>;
  }

  const disabledGames = settings?.disabledGames || [];
  const filteredGames = allGames.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = allGames.length - disabledGames.length;

  // Create a map of game stats for quick lookup
  const gameStatsMap = new Map(stats?.games?.map(g => [g.gameSlug, g]) || []);

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>{t('games.gameSettings')}</h2>

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
          👁️ {t('games.visibility')}
        </button>
        <button
          className={`${styles.viewModeButton} ${viewMode === 'stats' ? styles.active : ''}`}
          onClick={() => setViewMode('stats')}
        >
          📊 {t('games.myStats')}
        </button>
      </div>

      {viewMode === 'stats' && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>📊 {t('games.overallStatistics')}</h3>

          {(!stats?.games || stats.games.length === 0) ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📊</span>
              <p className={styles.emptyText}>
                {t('games.noStatsYet')}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats?.totalPlayed || 0}</span>
                  <span className={styles.statLabel}>{t('games.gamesPlayed')}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats?.totalWon || 0}</span>
                  <span className={styles.statLabel}>{t('games.gamesWon')}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {stats?.totalPlayed ? Math.round((stats.totalWon / stats.totalPlayed) * 100) : 0}%
                  </span>
                  <span className={styles.statLabel}>{t('games.winRate')}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats?.gamesWithProgress || 0}</span>
                  <span className={styles.statLabel}>{t('games.gamesTried')}</span>
                </div>
              </div>

              <div className={styles.gameStatsList}>
                <h4 className={styles.cardSubtitle}>{t('games.perGameProgress')}</h4>
                {stats.games.map(g => {
                  const gameInfo = allGames.find(ag => ag.slug === g.gameSlug);
                  return (
                    <div key={g.gameSlug} className={styles.gameStatItem}>
                      <div className={styles.gameStatName}>
                        {gameInfo?.title || g.gameSlug}
                      </div>
                      <div className={styles.gameStatDetails}>
                        <span>{t('games.played')}: {g.played}</span>
                        <span>{t('games.won')}: {g.won}</span>
                        <span>{t('games.winRate')}: {g.winRate}%</span>
                        {g.maxStreak > 0 && <span>{t('games.bestStreak')}: {g.maxStreak}</span>}
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
            {t('games.gameVisibility')}
            <span className={styles.cardTitleMeta}>
              {t('games.enabledCount', { enabled: enabledCount, total: allGames.length })}
            </span>
          </h3>
          <p className={styles.cardDescription}>
            {t('games.gameVisibilityDescription')}
          </p>

          <div className={styles.bulkActions}>
            <button className={styles.bulkButton} onClick={() => handleBulkAction('enableAll')}>
              {t('games.enableAll')}
            </button>
            <button className={styles.bulkButton} onClick={() => handleBulkAction('disableAll')}>
              {t('games.disableAll')}
            </button>
          </div>

          <input
            type="text"
            placeholder={t('games.searchGames')}
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
              <p className={styles.noResults}>{t('games.noGamesMatch')}</p>
            )}
          </div>
        </section>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>💾 {t('games.progressData')}</h3>
        <p className={styles.cardDescription}>
          {t('games.progressDataDescription')}
        </p>
        <div className={styles.buttonRow}>
          <button className={styles.button} onClick={handleExport}>
            📤 {t('games.exportProgress')}
          </button>
          <button className={styles.buttonSecondary} onClick={() => fileInputRef.current?.click()}>
            📥 {t('games.importProgress')}
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
        <h3 className={styles.cardTitle}>{t('common.dangerZone')}</h3>
        {!confirmDelete ? (
          <button
            className={styles.dangerButton}
            onClick={() => setConfirmDelete(true)}
          >
            🗑️ {t('games.deleteAllProgress')}
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <p>{t('common.areYouSure')}</p>
            <div className={styles.confirmButtons}>
              <button
                className={styles.dangerButton}
                onClick={handleDeleteAllProgress}
              >
                {t('common.yesDeleteEverything')}
              </button>
              <button
                className={styles.button}
                onClick={() => setConfirmDelete(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SecurityTab() {
  const { t } = useTranslation();
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
        setMessage({ type: 'error', text: t('security.failedToLoad') });
      }
    } catch (err) {
      console.error('Security data error:', err);
      setMessage({ type: 'error', text: t('security.failedToLoad') });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sid) => {
    try {
      await users.logoutSession(sid);
      setSessions(prev => prev.filter(s => s.id !== sid));
      setMessage({ type: 'success', text: t('security.sessionTerminated') });
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
    if (!ua || ua === 'unknown') return t('security.unknownDevice');
    // Simple parsing - extract browser and OS
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Browser';
    const os = ua.includes('Windows') ? 'Windows' :
               ua.includes('Mac') ? 'macOS' :
               ua.includes('Linux') ? 'Linux' :
               ua.includes('Android') ? 'Android' :
               ua.includes('iPhone') ? 'iOS' : t('security.unknownOS');
    return `${browser.split('/')[0]} on ${os}`;
  };

  if (loading) {
    return <div className={styles.loading}>{t('security.loadingSecurityData')}</div>;
  }

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>{t('profile.security')}</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>
          🖥️ {t('security.activeSessions')}
          <span className={styles.cardTitleMeta}>{t('security.activeCount', { count: sessions.length })}</span>
        </h3>
        <p className={styles.cardDescription}>
          {t('security.manageDevices')}
        </p>

        {sessions.length > 1 && (
          <button
            className={styles.dangerButton}
            onClick={handleLogoutAllSessions}
            style={{ marginBottom: '1rem' }}
          >
            🚪 {t('security.logOutAllOtherSessions')}
          </button>
        )}

        <div className={styles.sessionList}>
          {sessions.map(session => (
            <div key={session.id} className={styles.sessionItem}>
              <div className={styles.sessionInfo}>
                <span className={styles.sessionDevice}>
                  {session.isCurrent ? `📍 ${t('security.thisDevice')}` : `💻 ${t('security.otherDevice')}`}
                </span>
                <span className={styles.sessionExpiry}>
                  {t('security.expires')}: {new Date(session.expiresAt).toLocaleDateString()}
                </span>
              </div>
              {!session.isCurrent && (
                <button
                  className={styles.actionButtonDanger}
                  onClick={() => handleLogoutSession(session.id)}
                >
                  {t('profile.logOut')}
                </button>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🖥️</span>
              <p className={styles.emptyText}>
                {t('security.noSessionsFound')}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>📜 {t('security.loginHistory')}</h3>
        <p className={styles.cardDescription}>
          {t('security.recentLoginAttempts')}
        </p>

        <div className={styles.historyList}>
          {loginHistory.map((entry, index) => (
            <div key={index} className={`${styles.historyItem} ${!entry.success ? styles.historyFailed : ''}`}>
              <div className={styles.historyInfo}>
                <span className={styles.historyStatus}>
                  {entry.success ? '✅' : '❌'} {entry.success ? t('security.successfulLogin') : t('security.failedAttempt')}
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
                {t('security.noLoginHistory')}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AdminTab() {
  const { t } = useTranslation();
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
      setMessage({ type: 'error', text: t('admin.failedToLoad') });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await admin.getUsers({ search, limit: 50 });
      setUsersList(data.users);
    } catch (err) {
      setMessage({ type: 'error', text: t('admin.failedToLoadUsers') });
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await admin.updateUser(userId, { role: newRole });
      setUsersList(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setMessage({ type: 'success', text: t('admin.userRoleUpdated') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.passwordTooShort') });
      return;
    }
    try {
      await admin.updateUser(userId, { newPassword });
      setNewPassword('');
      setEditingUser(null);
      setMessage({ type: 'success', text: t('admin.passwordReset') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(t('admin.confirmDeleteUser', { username }))) return;
    try {
      await admin.deleteUser(userId);
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: t('admin.userDeleted') });
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
      setMessage({ type: 'success', text: !currentEnabled ? t('admin.gameEnabled') : t('admin.gameDisabled') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleDevGames = async () => {
    const devGames = allGames.filter(g => g.version === 'DEV');
    if (devGames.length === 0) {
      setMessage({ type: 'info', text: t('admin.noDevGames') });
      return;
    }

    // Check if any DEV games are currently enabled
    const anyEnabled = devGames.some(game => {
      const config = gameConfigs.find(g => g.gameSlug === game.slug);
      return config ? config.enabled : true; // default is enabled
    });

    const newEnabled = !anyEnabled;

    try {
      await Promise.all(devGames.map(game =>
        admin.updateGameConfig(game.slug, { enabled: newEnabled })
      ));

      setGameConfigs(prev => {
        const updated = [...prev];
        devGames.forEach(game => {
          const existingIdx = updated.findIndex(g => g.gameSlug === game.slug);
          if (existingIdx >= 0) {
            updated[existingIdx] = { ...updated[existingIdx], enabled: newEnabled };
          } else {
            updated.push({ gameSlug: game.slug, enabled: newEnabled, settings: {} });
          }
        });
        return updated;
      });

      setMessage({ type: 'success', text: t('admin.devGamesToggled', { action: newEnabled ? t('common.enabled') : t('common.disabled'), count: devGames.length }) });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('admin.loadingAdminData')}</div>;
  }

  // Create a map of game configs
  const configMap = new Map(gameConfigs.map(g => [g.gameSlug, g]));

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.pageTitle}>{t('admin.adminPanel')}</h2>

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
          📊 {t('admin.stats')}
        </button>
        <button
          className={`${styles.viewModeButton} ${activeSection === 'users' ? styles.active : ''}`}
          onClick={() => setActiveSection('users')}
        >
          👥 {t('admin.users')}
        </button>
        <button
          className={`${styles.viewModeButton} ${activeSection === 'games' ? styles.active : ''}`}
          onClick={() => setActiveSection('games')}
        >
          🎮 {t('profile.games')}
        </button>
      </div>

      {activeSection === 'stats' && serverStats && (
        <>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>📈 {t('admin.serverStatistics')}</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.users.total}</span>
                <span className={styles.statLabel}>{t('admin.totalUsers')}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.users.admins}</span>
                <span className={styles.statLabel}>{t('admin.admins')}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.activeSessions}</span>
                <span className={styles.statLabel}>{t('admin.activeSessions')}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.games.uniqueGamesPlayed}</span>
                <span className={styles.statLabel}>{t('games.gamesPlayed')}</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>🔐 {t('admin.loginActivity')}</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.logins.last24h}</span>
                <span className={styles.statLabel}>{t('admin.last24Hours')}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.logins.last7d}</span>
                <span className={styles.statLabel}>{t('admin.last7Days')}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{serverStats.logins.last30d}</span>
                <span className={styles.statLabel}>{t('admin.last30Days')}</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>🏆 {t('admin.popularGames')}</h3>
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
                        {t('admin.playsBy', { plays: game.totalPlays, players: game.players })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🏆</span>
                <p className={styles.emptyText}>
                  {t('admin.noStatsYet')}
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {activeSection === 'users' && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('admin.userManagement')}</h3>
          <input
            type="text"
            placeholder={t('admin.searchUsers')}
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
                      {u.role === 'admin' && <span className={styles.adminBadge}>{t('profile.admin')}</span>}
                    </span>
                    <span className={styles.userUsername}>@{u.username}</span>
                  </div>
                </div>

                {editingUser === u.id ? (
                  <div className={styles.resetPassword}>
                    <input
                      type="password"
                      placeholder={t('profile.newPassword')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.smallInput}
                    />
                    <button
                      className={styles.smallButton}
                      onClick={() => handleResetPassword(u.id)}
                    >
                      {t('common.set')}
                    </button>
                    <button
                      className={styles.smallButtonSecondary}
                      onClick={() => { setEditingUser(null); setNewPassword(''); }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className={styles.userActions}>
                    {u.id !== currentUser.id && (
                      <>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleToggleAdmin(u.id, u.role)}
                          title={u.role === 'admin' ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                        >
                          {u.role === 'admin' ? `👤 ${t('admin.demote')}` : `👑 ${t('admin.promote')}`}
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => setEditingUser(u.id)}
                          title={t('admin.resetPassword')}
                        >
                          🔑 {t('admin.reset')}
                        </button>
                        <button
                          className={styles.actionButtonDanger}
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title={t('admin.deleteUser')}
                        >
                          🗑️ {t('common.delete')}
                        </button>
                      </>
                    )}
                    {u.id === currentUser.id && (
                      <span className={styles.youBadge}>{t('admin.you')}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {usersList.length === 0 && (
              <p className={styles.noResults}>{t('admin.noUsersFound')}</p>
            )}
          </div>
        </section>
      )}

      {activeSection === 'games' && (() => {
        const devGames = allGames.filter(g => g.version === 'DEV');
        const devGamesEnabled = devGames.some(game => {
          const config = configMap.get(game.slug);
          return config ? config.enabled : true;
        });

        return (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('admin.serverGameConfig')}</h3>
          <p className={styles.cardDescription}>
            {t('admin.serverGameConfigDescription')}
          </p>
          <div className={styles.devGamesActions}>
            <button
              className={devGamesEnabled ? styles.actionButtonDanger : styles.actionButton}
              onClick={handleToggleDevGames}
            >
              {devGamesEnabled ? `🚫 ${t('admin.disableAllDevGames')}` : `✅ ${t('admin.enableAllDevGames')}`}
            </button>
          </div>
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
        );
      })()}
    </div>
  );
}
