import { useOutletContext } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import styles from './Home.module.css';

export default function Home() {
  const { showDevItems = false, searchQuery = '' } = useOutletContext() || {};

  // Filter games based on DEV filter toggle
  const getFilteredGames = (games) => {
    if (showDevItems) {
      return games;
    }
    return games.filter(game => game.version !== 'DEV');
  };

  // Filter games based on search query
  const filterBySearch = (games) => {
    if (!searchQuery.trim()) return games;
    const query = searchQuery.toLowerCase().trim();
    return games.filter(game =>
      game.title.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query)
    );
  };

  // Get total matching games count
  const getTotalMatches = () => {
    if (!searchQuery.trim()) return null;
    return categories.reduce((count, category) => {
      const filtered = filterBySearch(getFilteredGames(category.games));
      return count + filtered.length;
    }, 0);
  };

  const totalMatches = getTotalMatches();

  return (
    <div className={styles.home}>
      {categories.map((category) => {
        const devFiltered = getFilteredGames(category.games);
        const filteredGames = filterBySearch(devFiltered);
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

      {searchQuery && totalMatches === 0 && (
        <div className={styles.noResults}>
          <span className={styles.noResultsIcon}>🎮</span>
          <p>No games match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
