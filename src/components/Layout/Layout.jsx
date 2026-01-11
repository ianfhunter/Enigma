import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFavicon } from '../../hooks/useFavicon';
import { enabledGames, allGames } from '../../data/gameRegistry';
import logo from '../../branding/logo.svg';
import styles from './Layout.module.css';

export default function Layout() {
  useFavicon();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  
  const [showDevItems, setShowDevItems] = useState(false);
  
  // Count total games and games in development
  const totalGames = allGames.length;
  const devGames = allGames.filter(game => game.version === 'DEV').length;
  const releasedGames = totalGames - devGames;

  const handleSurpriseMe = () => {
    const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];
    navigate(`/${randomGame.slug}`);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          {isHome ? (
            <div className={styles.homeHeader}>
              <div className={styles.logoSection}>
                <Link to="/" className={styles.logo}>
                  <img src={logo} alt="Enigma" className={styles.logoIcon} />
                  <h1 className={styles.title} data-text="Enigma Catalogue">Enigma Catalogue</h1>
                </Link>
                <p className={styles.subtitle}>It's Puzzle time!</p>
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
              </div>
            </div>
          ) : (
            <Link to="/" className={styles.logo}>
              <img src={logo} alt="Enigma" className={styles.logoIcon} />
              <span className={styles.logoText}>Enigma</span>
            </Link>
          )}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet context={{ showDevItems }} />
      </main>
      <footer className={styles.footer}>
        <p>Self-hosted games collection</p>
      </footer>
    </div>
  );
}
