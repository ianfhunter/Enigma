import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavicon } from '../../hooks/useFavicon';
import { useLanguageSync } from '../../hooks/useLanguageSync';
import { enabledGames, allGames, getGameIcon } from '../../data/gameRegistry';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { setEnglishVariant } from '../../data/wordFrequency';
import { fuzzySearchGames } from '../../utils/fuzzySearch';
import AuthModal from '../AuthModal';
const logo = '/branding/logo-static-e.svg';
import styles from './Layout.module.css';

export default function Layout() {
  useFavicon();
  useLanguageSync(); // Sync user's language preference with i18n
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef(null);

  // Update English variant when settings change
  useEffect(() => {
    if (settings.englishVariant) {
      setEnglishVariant(settings.englishVariant);
    }
  }, [settings.englishVariant]);

  // Count all games
  const totalGames = allGames.length;
  const disabledGames = settings?.disabledGames || [];

  const handleSurpriseMe = () => {
    // Filter enabled games based on user settings
    const availableGames = enabledGames.filter(game => !disabledGames.includes(game.slug));
    if (availableGames.length > 0) {
      const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
      navigate(`/${randomGame.slug}`);
    }
  };

  // Render icon - supports emoji strings, SVG URLs, or React components
  const renderIcon = (icon) => {
    if (typeof icon === 'string') {
      // Check if it's an SVG URL/path (Vite adds hashes like /assets/icon.svg?t=123)
      if (icon.includes('.svg') || icon.startsWith('/assets/') || icon.startsWith('data:image')) {
        return <img src={icon} alt="" className={styles.searchResultSvgIcon} />;
      }
      // Otherwise treat as emoji
      return icon;
    }
    // React component
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className={styles.searchResultSvgIcon} />;
    }
    // Already a React element
    return icon;
  };

  // Search results for dropdown (with fuzzy matching)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { matches: [], total: 0 };

    const matches = fuzzySearchGames(allGames, searchQuery);

    return {
      matches: matches.slice(0, 5),
      total: matches.length
    };
  }, [searchQuery]);

  const handleGameClick = (slug) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    navigate(`/${slug}`);
  };

  const handleViewAllResults = () => {
    setIsSearchFocused(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.matches.length > 0) {
      e.preventDefault();
      handleGameClick(searchResults.matches[0].slug);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show loading state
  if (authLoading || (isAuthenticated && settingsLoading)) {
    return (
      <div className={styles.layout}>
        <div className={styles.loadingContainer}>
          <img src={logo} alt="Loading" className={styles.loadingLogo} />
          <p className={styles.loadingText}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          {isHome ? (
            <div className={`${styles.homeHeader} ${isSearchFocused ? styles.searchActive : ''}`}>
              <div className={styles.logoSection}>
                <Link to="/" className={styles.logo}>
                  <img src={logo} alt="Enigma" className={styles.logoIcon} />
                  <span className={styles.logoText} data-text="Enigma">Enigma</span>
                </Link>
              </div>

              <div className={`${styles.searchWrapper} ${isSearchFocused ? styles.searchFocused : ''}`} ref={searchWrapperRef}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t('common.searchGames')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label={t('common.searchGames')}
                />
                {searchQuery && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                    aria-label={t('common.clearSearch')}
                  >
                    ✕
                  </button>
                )}

                {/* Search Dropdown */}
                {isSearchFocused && searchQuery.trim() && (
                  <div className={styles.searchDropdown}>
                    {searchResults.matches.length > 0 ? (
                      <>
                        {searchResults.matches.map((game) => (
                          <button
                            key={game.slug}
                            className={styles.searchResultItem}
                            onClick={() => handleGameClick(game.slug)}
                          >
                            <span className={styles.searchResultIcon}>{renderIcon(getGameIcon(game.slug))}</span>
                            <div className={styles.searchResultText}>
                              <span className={styles.searchResultTitle}>{game.title}</span>
                              <span className={styles.searchResultDesc}>{game.description}</span>
                            </div>
                          </button>
                        ))}
                        {searchResults.total > 5 && (
                          <button
                            className={styles.searchResultsMore}
                            onClick={handleViewAllResults}
                          >
                            {t('common.viewAllResults', { count: searchResults.total - 5 })}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className={styles.searchNoResults}>
                        {t('common.noGamesFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.headerControls}>
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{totalGames}</span>
                    <span className={styles.statLabel}>{t('common.games')}</span>
                  </div>
                </div>

                <button
                  className={styles.surpriseButton}
                  onClick={handleSurpriseMe}
                  aria-label={t('header.surpriseMe')}
                >
                  <span className={styles.surpriseIcon}>🎲</span>
                  <span className={styles.surpriseText}>{t('header.surpriseMe')}</span>
                </button>

                <Link to="/store" className={styles.storeButton} aria-label={t('header.store')}>
                  <span className={styles.storeIcon}>🏪</span>
                  <span className={styles.storeText}>{t('header.store')}</span>
                </Link>

                <Link to="/profile" className={styles.profileButton} aria-label={t('header.profile')}>
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
            <div className={`${styles.gamePageHeader} ${isSearchFocused ? styles.searchActive : ''}`}>
              <Link to="/" className={styles.logo}>
                <img src={logo} alt="Enigma" className={styles.logoIcon} />
                <span className={styles.logoText}>Enigma</span>
              </Link>

              <div className={`${styles.searchWrapper} ${isSearchFocused ? styles.searchFocused : ''}`} ref={searchWrapperRef}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t('common.searchGames')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label={t('common.searchGames')}
                />
                {searchQuery && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                    aria-label={t('common.clearSearch')}
                  >
                    ✕
                  </button>
                )}

                {/* Search Dropdown */}
                {isSearchFocused && searchQuery.trim() && (
                  <div className={styles.searchDropdown}>
                    {searchResults.matches.length > 0 ? (
                      <>
                        {searchResults.matches.map((game) => (
                          <button
                            key={game.slug}
                            className={styles.searchResultItem}
                            onClick={() => handleGameClick(game.slug)}
                          >
                            <span className={styles.searchResultIcon}>{renderIcon(getGameIcon(game.slug))}</span>
                            <div className={styles.searchResultText}>
                              <span className={styles.searchResultTitle}>{game.title}</span>
                              <span className={styles.searchResultDesc}>{game.description}</span>
                            </div>
                          </button>
                        ))}
                        {searchResults.total > 5 && (
                          <button
                            className={styles.searchResultsMore}
                            onClick={handleViewAllResults}
                          >
                            {t('common.viewAllResults', { count: searchResults.total - 5 })}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className={styles.searchNoResults}>
                        {t('common.noGamesFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link to="/profile" className={styles.profileButton} aria-label={t('header.profile')}>
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
        <Outlet context={{ settings }} />
      </main>
      <footer className={styles.footer}>
        <p>{t('footer.selfHosted')}</p>
        <a
          href="https://github.com/ianfhunter/enigma"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          <svg
            className={styles.githubIcon}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>{t('footer.viewOnGithub')}</span>
        </a>
      </footer>

      {/* Auth modal - cannot be closed when not authenticated */}
      <AuthModal
        isOpen={!isAuthenticated}
        canClose={false}
      />
    </div>
  );
}
