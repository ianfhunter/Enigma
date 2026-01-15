import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../../data/gameRegistry';
import {
  officialPacks,
  countGamesInPack,
  getPackagePreviewGames
} from '../../data/packageRegistry';
import { useInstalledPackages } from '../../hooks/useInstalledPackages';
import styles from './GameStore.module.css';

/**
 * PackCard - Displays a single package with install/uninstall functionality
 */
function PackCard({ pack, isInstalled, onToggle, gameCount, previewGames }) {
  const handleClick = () => {
    if (pack.removable) {
      onToggle(pack.id);
    }
  };

  return (
    <div
      className={`${styles.packCard} ${isInstalled ? styles.installed : ''}`}
      style={{ '--pack-color': pack.color }}
    >
      <div className={styles.packHeader}>
        <div className={styles.packIcon}>{pack.icon}</div>
        <div className={styles.packInfo}>
          <h3 className={styles.packName}>{pack.name}</h3>
          <span className={styles.packMeta}>
            {gameCount} games
            {pack.type === 'official' && (
              <span className={styles.officialBadge}>✓ Official</span>
            )}
          </span>
        </div>
      </div>

      <p className={styles.packDescription}>{pack.description}</p>

      {previewGames.length > 0 && (
        <div className={styles.previewGames}>
          {previewGames.map((game) => (
            <span key={game.slug} className={styles.previewGame} title={game.title}>
              {typeof game.icon === 'string' && !game.icon.endsWith('.svg')
                ? game.icon
                : game.emojiIcon || '🎮'}
            </span>
          ))}
          {gameCount > previewGames.length && (
            <span className={styles.moreGames}>+{gameCount - previewGames.length}</span>
          )}
        </div>
      )}

      <button
        className={`${styles.packButton} ${isInstalled ? styles.installedButton : ''}`}
        onClick={handleClick}
        disabled={!pack.removable && isInstalled}
      >
        {!pack.removable && isInstalled ? (
          <>Included</>
        ) : isInstalled ? (
          <>
            <span className={styles.checkIcon}>✓</span>
            Installed
          </>
        ) : (
          <>Install</>
        )}
      </button>
    </div>
  );
}

/**
 * GameStore - Browse and install game packs
 */
export default function GameStore() {
  const { installedPackages, isInstalled, togglePackage } = useInstalledPackages();
  const [activeTab, setActiveTab] = useState('official');

  // Calculate game counts for each pack
  const packData = useMemo(() => {
    return officialPacks.map(pack => ({
      ...pack,
      gameCount: countGamesInPack(pack.id, categories),
      previewGames: getPackagePreviewGames(pack.id, categories, 5),
    }));
  }, []);

  // Count total installed games
  const totalInstalledGames = useMemo(() => {
    return packData
      .filter(pack => isInstalled(pack.id))
      .reduce((sum, pack) => sum + pack.gameCount, 0);
  }, [packData, isInstalled]);

  return (
    <div className={styles.store}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🏪</span>
          Game Store
        </h1>
        <p className={styles.subtitle}>
          Browse and install puzzle packs to customize your collection
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{installedPackages.length}</span>
            <span className={styles.statLabel}>Packs Installed</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalInstalledGames}</span>
            <span className={styles.statLabel}>Total Games</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'official' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('official')}
        >
          <span className={styles.tabIcon}>✨</span>
          Official Packs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'community' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <span className={styles.tabIcon}>🌍</span>
          Community Packs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'custom' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <span className={styles.tabIcon}>🛠️</span>
          My Custom Packs
        </button>
      </nav>

      {/* Tab Content */}
      <main className={styles.content}>
        {activeTab === 'official' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>✨</span>
                Official Packs
              </h2>
              <p className={styles.sectionDescription}>
                Curated puzzle collections verified by the Enigma team
              </p>
            </div>
            <div className={styles.packGrid}>
              {packData.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  isInstalled={isInstalled(pack.id)}
                  onToggle={togglePackage}
                  gameCount={pack.gameCount}
                  previewGames={pack.previewGames}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'community' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🌍</span>
                Community Packs
              </h2>
              <p className={styles.sectionDescription}>
                Puzzle packs created by the community
              </p>
            </div>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🚧</div>
              <h3>Coming Soon</h3>
              <p>
                Community packs will allow puzzle creators to share their games with everyone.
                Stay tuned for updates!
              </p>
            </div>
          </section>
        )}

        {activeTab === 'custom' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🛠️</span>
                My Custom Packs
              </h2>
              <p className={styles.sectionDescription}>
                Create your own packs with external games
              </p>
            </div>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🚧</div>
              <h3>Coming Soon</h3>
              <p>
                Soon you&apos;ll be able to create custom packs with your favorite external puzzle games.
                Add games via URL and organize them into your own collections!
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
