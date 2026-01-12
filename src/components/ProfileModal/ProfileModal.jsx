import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { users, games, admin } from '../../api/client';
import { allGames } from '../../data/gameRegistry';
import styles from './ProfileModal.module.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'admin', label: 'Admin', icon: '🔧', adminOnly: true },
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const modalRef = useRef(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen || !user) return null;

  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div ref={modalRef} className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.avatar}>{user.displayName?.[0]?.toUpperCase() || '?'}</span>
            {user.displayName || user.username}
            {isAdmin && <span className={styles.adminBadge}>Admin</span>}
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.tabs}>
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'games' && <GamesTab />}
          {activeTab === 'admin' && isAdmin && <AdminTab />}
        </div>

        <div className={styles.footer}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            🚪 Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, updateUser }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await users.updateProfile(displayName.trim());
      updateUser({ displayName: displayName.trim() });
      setMessage({ type: 'success', text: 'Display name updated!' });
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

  return (
    <div className={styles.tabContent}>
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Account Info</h3>
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

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Display Name</h3>
        <form onSubmit={handleUpdateProfile} className={styles.form}>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
            maxLength={64}
            disabled={loading}
          />
          <button type="submit" className={styles.button} disabled={loading || !displayName.trim()}>
            Update
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Change Password</h3>
        <form onSubmit={handleChangePassword} className={styles.formVertical}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
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
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await users.getSettings();
      setSettings(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = async (variant) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await users.updateSettings({ englishVariant: variant });
      setSettings(prev => ({ ...prev, englishVariant: variant }));
      setMessage({ type: 'success', text: 'Language preference saved!' });
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
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Language</h3>
        <p className={styles.sectionDescription}>
          Choose your preferred English variant for word games.
        </p>
        <div className={styles.variantSelector}>
          <button
            className={`${styles.variantOption} ${settings?.englishVariant === 'us' ? styles.active : ''}`}
            onClick={() => handleVariantChange('us')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🇺🇸</span>
            <span className={styles.variantLabel}>US English</span>
          </button>
          <button
            className={`${styles.variantOption} ${settings?.englishVariant === 'uk' ? styles.active : ''}`}
            onClick={() => handleVariantChange('uk')}
            disabled={saving}
          >
            <span className={styles.flagIcon}>🇬🇧</span>
            <span className={styles.variantLabel}>UK English</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function GamesTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await users.getSettings();
      setSettings(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
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

  const handleDeleteAllProgress = async () => {
    try {
      await games.deleteAllProgress();
      setMessage({ type: 'success', text: 'All game progress deleted!' });
      setConfirmDelete(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  const disabledGames = settings?.disabledGames || [];

  return (
    <div className={styles.tabContent}>
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Game Visibility</h3>
        <p className={styles.sectionDescription}>
          Hide games you&apos;re not interested in from the home page.
        </p>
        <div className={styles.gameList}>
          {allGames.slice(0, 20).map(game => (
            <label key={game.slug} className={styles.gameItem}>
              <input
                type="checkbox"
                checked={!disabledGames.includes(game.slug)}
                onChange={() => handleToggleGame(game.slug)}
              />
              <span className={styles.gameName}>{game.name}</span>
            </label>
          ))}
          {allGames.length > 20 && (
            <p className={styles.moreGames}>
              ...and {allGames.length - 20} more games
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Danger Zone</h3>
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

function AdminTab() {
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      const data = await admin.getUsers({ search, limit: 50 });
      setUsersList(data.users);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await admin.deleteUser(userId);
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className={styles.tabContent}>
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>User Management</h3>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />

        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : (
          <div className={styles.userList}>
            {usersList.map(u => (
              <div key={u.id} className={styles.userItem}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {u.displayName || u.username}
                    {u.role === 'admin' && <span className={styles.adminBadge}>Admin</span>}
                  </span>
                  <span className={styles.userMeta}>@{u.username}</span>
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
                      className={styles.smallButton}
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
                          className={styles.smallButton}
                          onClick={() => handleToggleAdmin(u.id, u.role)}
                          title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        >
                          {u.role === 'admin' ? '👤' : '👑'}
                        </button>
                        <button
                          className={styles.smallButton}
                          onClick={() => setEditingUser(u.id)}
                          title="Reset password"
                        >
                          🔑
                        </button>
                        <button
                          className={`${styles.smallButton} ${styles.danger}`}
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
