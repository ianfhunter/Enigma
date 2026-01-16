import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import { communityPacks } from '../../packs/registry';
import { fuzzySearchGames } from '../../utils/fuzzySearch';
import styles from './Search.module.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Get all available games (official + community)
  const availableGames = useMemo(() => {
    const officialGames = categories.flatMap(category => category.games);
    // Community games from the registry (loaded at build time)
    const communityGames = communityPacks.flatMap(pack =>
      (pack.allGames || []).map(g => ({ ...g, packId: pack.id, isCommunity: true }))
    );
    return [...officialGames, ...communityGames];
  }, []);

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
              key={game.isCommunity ? `community-${game.packId}-${game.slug}` : game.slug}
              title={game.title}
              slug={game.slug}
              description={game.description}
              disabled={game.disabled}
              tag={game.tag}
              version={game.version}
              linkTo={game.isCommunity ? `/community/${game.packId}/${game.slug}` : null}
              customIcon={game.isCommunity ? (game.icon || game.emojiIcon || '🎮') : null}
              customColors={game.isCommunity ? (game.colors || { primary: '#8b5cf6', secondary: '#7c3aed' }) : null}
              typeBadge={game.isCommunity ? 'Community' : null}
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
