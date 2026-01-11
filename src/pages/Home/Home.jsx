import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories, enabledGames, allGames } from '../../data/gameRegistry';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const [showDevItems, setShowDevItems] = useState(false);

  const handleSurpriseMe = () => {
    const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];
    navigate(`/${randomGame.slug}`);
  };

  // Count total games and games in development
  const totalGames = allGames.length;
  const devGames = allGames.filter(game => game.version === 'DEV').length;
  const releasedGames = totalGames - devGames;

  // Filter games based on DEV filter toggle
  const getFilteredGames = (games) => {
    if (showDevItems) {
      return games;
    }
    return games.filter(game => game.version !== 'DEV');
  };

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <h1 className={styles.title} data-text="Enigma Catalogue">Enigma Catalogue</h1>
        <p className={styles.subtitle}>
          It's Puzzle time!
        </p>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{releasedGames}</span>
            <span className={styles.statLabel}>Games</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{devGames}</span>
            <span className={styles.statLabel}>In Development</span>
          </div>
        </div>
        <div className={styles.filters}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showDevItems}
              onChange={(e) => setShowDevItems(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>Show DEV Items</span>
          </label>
        </div>
        <button className={styles.surpriseButton} onClick={handleSurpriseMe}>
          <span className={styles.surpriseIcon}>🎲</span>
          Surprise Me!
        </button>
      </div>

      {categories.map((category) => {
        const filteredGames = getFilteredGames(category.games);
        if (filteredGames.length === 0) return null;
        
        return (
          <section key={category.name} className={styles.category}>
            <h2 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>{category.icon}</span>
              {category.name}
              <span className={styles.gameCount}>{filteredGames.length}</span>
            </h2>
            <div className={styles.grid}>
              {filteredGames.map((game) => (
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
    </div>
  );
}
