import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import { useInstalledPackages } from '../../hooks/useInstalledPackages';
import { useCustomPacks } from '../../hooks/useCustomPacks';
import { getFilteredCategories, officialPacks } from '../../data/packageRegistry';
import styles from './Home.module.css';

/**
 * CustomGameCard - Card for iframe-based custom games
 */
function CustomGameCard({ game, packId }) {
  return (
    <Link
      to={`/custom/${packId}/${game.id}`}
      className={styles.customGameCard}
    >
      <div className={styles.customGameIcon}>{game.icon || '🎮'}</div>
      <div className={styles.customGameInfo}>
        <h3 className={styles.customGameTitle}>{game.title}</h3>
        {game.description && (
          <p className={styles.customGameDesc}>{game.description}</p>
        )}
      </div>
      <span className={styles.customGameBadge}>External</span>
    </Link>
  );
}

export default function Home() {
  const { installedPackages } = useInstalledPackages();
  const { customPacks } = useCustomPacks();

  // Filter categories and games based on installed packages
  // This handles includeGames/excludeGames for proper game filtering
  const filteredCategories = useMemo(() => {
    return getFilteredCategories(installedPackages, categories);
  }, [installedPackages]);

  // Check if there are more packs available to install
  const hasMorePacks = officialPacks.length > installedPackages.length;

  // Filter custom packs that have at least one game
  const packsWithGames = customPacks.filter(pack => pack.games.length > 0);

  return (
    <div className={styles.home}>
      {filteredCategories.map((category) => {
        if (category.games.length === 0) return null;

        return (
          <section key={category.name} className={styles.category}>
            <h2 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>{category.icon}</span>
              {category.name}
              <span className={styles.gameCount}>{category.games.length}</span>
            </h2>
            <div className={styles.grid}>
              {category.games.map((game) => (
                <GameCard
                  key={game.slug}
                  title={game.title}
                  slug={game.slug}
                  description={game.description}
                  disabled={game.disabled}
                  tag={game.tag}
                  version={game.version}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Custom Packs */}
      {packsWithGames.map((pack) => (
        <section key={pack.id} className={styles.category}>
          <h2 className={styles.categoryTitle}>
            <span className={styles.categoryIcon}>{pack.icon}</span>
            {pack.name}
            <span className={styles.gameCount}>{pack.games.length}</span>
            <span className={styles.customTag}>Custom</span>
          </h2>
          <div className={styles.grid}>
            {pack.games.map((game) => (
              <CustomGameCard key={game.id} game={game} packId={pack.id} />
            ))}
          </div>
        </section>
      ))}

      {/* Prompt to explore more packs */}
      {hasMorePacks && (
        <section className={styles.storePromo}>
          <div className={styles.promoContent}>
            <span className={styles.promoIcon}>🏪</span>
            <div className={styles.promoText}>
              <h3>Want more puzzles?</h3>
              <p>Browse the Game Store to install additional puzzle packs!</p>
            </div>
            <Link to="/store" className={styles.promoButton}>
              Visit Store
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
