import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFavicon } from '../../hooks/useFavicon';
import { enabledGames, allGames, getGameIcon } from '../../data/gameRegistry';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { setEnglishVariant } from '../../data/wordFrequency';
import { fuzzySearchGames } from '../../utils/fuzzySearch';
import AuthModal from '../AuthModal';
const logo = '/branding/logo.svg';
import styles from './Layout.module.css';

export default function Layout() {
  useFavicon();
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
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label="Search games"
                />
                {searchQuery && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
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
                            +{searchResults.total - 5} more — view all results
                          </button>
                        )}
                      </>
                    ) : (
                      <div className={styles.searchNoResults}>
                        No games found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.headerControls}>
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{totalGames}</span>
                    <span className={styles.statLabel}>Games</span>
                  </div>
                </div>

                <button
                  className={styles.surpriseButton}
                  onClick={handleSurpriseMe}
                  aria-label="Surprise me"
                >
                  <span className={styles.surpriseIcon}>🎲</span>
                  <span className={styles.surpriseText}>Surprise Me!</span>
                </button>

                <Link to="/store" className={styles.storeButton} aria-label="Game Store">
                  <span className={styles.storeIcon}>🏪</span>
                  <span className={styles.storeText}>Store</span>
                </Link>

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
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label="Search games"
                />
                {searchQuery && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
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
                            +{searchResults.total - 5} more — view all results
                          </button>
                        )}
                      </>
                    ) : (
                      <div className={styles.searchNoResults}>
                        No games found
                      </div>
                    )}
                  </div>
                )}
              </div>

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
        <Outlet context={{ settings }} />
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
