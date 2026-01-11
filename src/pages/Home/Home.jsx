import { useOutletContext } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import styles from './Home.module.css';

export default function Home() {
  const { showDevItems = false } = useOutletContext() || {};

  // Filter games based on DEV filter toggle
  const getFilteredGames = (games) => {
    if (showDevItems) {
      return games;
    }
    return games.filter(game => game.version !== 'DEV');
  };

  return (
    <div className={styles.home}>
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
