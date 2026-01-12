import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFavicon } from '../../hooks/useFavicon';
import { enabledGames, allGames } from '../../data/gameRegistry';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { setEnglishVariant } from '../../data/wordFrequency';
import AuthModal from '../AuthModal';
import logo from '../../branding/logo.svg';
import styles from './Layout.module.css';
import { useEffect } from 'react';

export default function Layout() {
  useFavicon();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  // Update English variant when settings change
  useEffect(() => {
    if (settings.englishVariant) {
      setEnglishVariant(settings.englishVariant);
    }
  }, [settings.englishVariant]);

  // Count released (non-DEV) games
  const releasedGames = allGames.filter(game => game.version !== 'DEV').length;

  // Determine if DEV games should be shown (true if any DEV game is not in disabledGames)
  const devGames = allGames.filter(game => game.version === 'DEV');
  const disabledGames = settings?.disabledGames || [];
  const showDevItems = devGames.some(game => !disabledGames.includes(game.slug));

  const handleSurpriseMe = () => {
    // Filter enabled games based on user settings
    const availableGames = enabledGames.filter(game => !disabledGames.includes(game.slug));
    if (availableGames.length > 0) {
      const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
      navigate(`/${randomGame.slug}`);
    }
  };

  // Show loading state
  if (authLoading || (isAuthenticated && settingsLoading)) {
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
                </div>

                <button className={styles.surpriseButton} onClick={handleSurpriseMe}>
                  <span className={styles.surpriseIcon}>🎲</span>
                  Surprise Me!
                </button>

                <Link to="/profile" className={styles.profileButton} aria-label="Profile">
                  <span className={styles.profileAvatar}>
                    {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                  <span className={styles.profileName}>
                    {user?.displayName || user?.username || 'User'}
                  </span>
                  <span className={styles.languageIndicator}>
                    {settings?.englishVariant === 'uk' ? '🇬🇧' : '🇺🇸'}
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.gamePageHeader}>
              <Link to="/" className={styles.logo}>
                <img src={logo} alt="Enigma" className={styles.logoIcon} />
                <span className={styles.logoText}>Enigma</span>
              </Link>

              <Link to="/profile" className={styles.profileButton} aria-label="Profile">
                <span className={styles.profileAvatar}>
                  {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
                </span>
                <span className={styles.languageIndicator}>
                  {settings?.englishVariant === 'uk' ? '🇬🇧' : '🇺🇸'}
                </span>
              </Link>
            </div>
          )}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet context={{ settings, showDevItems }} />
      </main>
      <footer className={styles.footer}>
        <p>Self-hosted games collection</p>
      </footer>

      {/* Auth modal - cannot be closed when not authenticated */}
      <AuthModal
        isOpen={!isAuthenticated}
        canClose={false}
      />
    </div>
  );
}
