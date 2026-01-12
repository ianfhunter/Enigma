import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFavicon } from '../../hooks/useFavicon';
import { enabledGames, allGames } from '../../data/gameRegistry';
import { useAuth } from '../../context/AuthContext';
import { setEnglishVariant } from '../../data/wordFrequency';
import { users } from '../../api/client';
import ProfileModal from '../ProfileModal';
import AuthModal from '../AuthModal';
import logo from '../../branding/logo.svg';
import styles from './Layout.module.css';

export default function Layout() {
  useFavicon();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { user, isAuthenticated, loading } = useAuth();

  const [showDevItems, setShowDevItems] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  // Load user settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      users.getSettings().then(settings => {
        setUserSettings(settings);
        setEnglishVariant(settings.englishVariant);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  // Count total games and games in development
  const totalGames = allGames.length;
  const devGames = allGames.filter(game => game.version === 'DEV').length;
  const releasedGames = totalGames - devGames;

  const handleSurpriseMe = () => {
    const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];
    navigate(`/${randomGame.slug}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.loadingContainer}>
          <img src={logo} alt="Loading" className={styles.loadingLogo} />
          <p className={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          {isHome ? (
            <div className={styles.homeHeader}>
              <div className={styles.logoSection}>
                <Link to="/" className={styles.logo}>
                  <img src={logo} alt="Enigma" className={styles.logoIcon} />
                  <span className={styles.logoText} data-text="Enigma">Enigma</span>
                </Link>
              </div>

              <div className={styles.headerControls}>
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{releasedGames}</span>
                    <span className={styles.statLabel}>Games</span>
                  </div>
                  <div className={styles.statDivider}></div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{devGames}</span>
                    <span className={styles.statLabel}>In Dev</span>
                  </div>
                </div>

                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={showDevItems}
                    onChange={(e) => setShowDevItems(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span className={styles.toggleLabel}>DEV</span>
                </label>

                <button className={styles.surpriseButton} onClick={handleSurpriseMe}>
                  <span className={styles.surpriseIcon}>🎲</span>
                  Surprise Me!
                </button>

                <button
                  className={styles.profileButton}
                  onClick={() => setShowProfile(true)}
                  aria-label="Profile"
                >
                  <span className={styles.profileAvatar}>
                    {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                  <span className={styles.profileName}>
                    {user?.displayName || user?.username || 'User'}
                  </span>
                  <span className={styles.languageIndicator}>
                    {userSettings?.englishVariant === 'uk' ? '🇬🇧' : '🇺🇸'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.gamePageHeader}>
              <Link to="/" className={styles.logo}>
                <img src={logo} alt="Enigma" className={styles.logoIcon} />
                <span className={styles.logoText}>Enigma</span>
              </Link>

              <button
                className={styles.profileButton}
                onClick={() => setShowProfile(true)}
                aria-label="Profile"
              >
                <span className={styles.profileAvatar}>
                  {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
                </span>
                <span className={styles.languageIndicator}>
                  {userSettings?.englishVariant === 'uk' ? '🇬🇧' : '🇺🇸'}
                </span>
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet context={{ showDevItems }} />
      </main>
      <footer className={styles.footer}>
        <p>Self-hosted games collection</p>
      </footer>

      {/* Auth modal - cannot be closed when not authenticated */}
      <AuthModal
        isOpen={!isAuthenticated}
        canClose={false}
      />

      {/* Profile modal - only when authenticated */}
      <ProfileModal
        isOpen={showProfile && isAuthenticated}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
