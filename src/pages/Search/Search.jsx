import { useSearchParams, Link } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import { useOutletContext } from 'react-router-dom';
import styles from './Search.module.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { showDevItems = false } = useOutletContext() || {};

  // Filter games based on DEV filter toggle
  const getFilteredGames = (games) => {
    if (showDevItems) {
      return games;
    }
    return games.filter(game => game.version !== 'DEV');
  };

  // Filter games based on search query
  const filterBySearch = (games) => {
    if (!query.trim()) return games;
    const q = query.toLowerCase().trim();
    return games.filter(game =>
      game.title.toLowerCase().includes(q) ||
      game.description.toLowerCase().includes(q)
    );
  };

  // Get all matching games across categories
  const allMatches = categories.flatMap(category => {
    const devFiltered = getFilteredGames(category.games);
    return filterBySearch(devFiltered);
  });

  return (
    <div className={styles.search}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          ← Back to all games
        </Link>
        <h1 className={styles.title}>
          Search results for "{query}"
        </h1>
        <p className={styles.count}>
          {allMatches.length} game{allMatches.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {allMatches.length > 0 ? (
        <div className={styles.grid}>
          {allMatches.map((game) => (
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
      ) : (
        <div className={styles.noResults}>
          <span className={styles.noResultsIcon}>🔍</span>
          <p>No games match your search</p>
          <Link to="/" className={styles.browseLink}>
            Browse all games
          </Link>
        </div>
      )}
    </div>
  );
}
