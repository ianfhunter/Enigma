import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories } from '../../data/gameRegistry';
import { communityPacks } from '../../packs/registry';
import { fuzzySearchGames } from '../../utils/fuzzySearch';
import styles from './Search.module.css';

/**
 * CommunityGameCard - Card for community pack games in search results
 */
function CommunityGameCard({ game, packId }) {
  return (
    <Link
      to={`/community/${packId}/${game.slug}`}
      className={styles.card}
    >
      <div className={styles.cardContent}>
        <span className={styles.icon}>{game.icon || game.emojiIcon || '🎮'}</span>
        <div className={styles.info}>
          <h3 className={styles.title}>{game.title}</h3>
          <p className={styles.description}>{game.description}</p>
        </div>
        <span className={styles.communityBadge}>Community</span>
      </div>
    </Link>
  );
}

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
            game.isCommunity ? (
              <CommunityGameCard
                key={`community-${game.packId}-${game.slug}`}
                game={game}
                packId={game.packId}
              />
            ) : (
              <GameCard
                key={game.slug}
                title={game.title}
                slug={game.slug}
                description={game.description}
                disabled={game.disabled}
                tag={game.tag}
                version={game.version}
              />
            )
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
