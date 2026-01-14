import { useSearchParams, Link } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import { fuzzySearchGames } from '../../utils/fuzzySearch';
import styles from './Search.module.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Get all available games
  const availableGames = categories.flatMap(category => category.games);

  // Get all matching games using fuzzy search (already sorted by relevance)
  const allMatches = query.trim()
    ? fuzzySearchGames(availableGames, query)
    : availableGames;

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
