import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GameCard from '../../components/GameCard';
import SortToolbar from '../../components/SortToolbar/SortToolbar';
import { categories, allGames } from '../../data/gameRegistry';
import { useInstalledPackages } from '../../hooks/useInstalledPackages';
import { useCustomPacks } from '../../hooks/useCustomPacks';
import { communityPacks, isCommunityPack } from '../../packs/registry';
import { getFilteredCategories, officialPacks } from '../../data/packageRegistry';
import { useFavourites, useRecentlyPlayed } from '../../context/SettingsContext';
import { sortCategories, sortGames, SORT_OPTIONS } from '../../utils/sortUtils';
import styles from './Home.module.css';

export default function Home() {
  const { t } = useTranslation();
  const { installedPackages } = useInstalledPackages();
  const { customPacks } = useCustomPacks();
  const { favourites } = useFavourites();
  const { recentlyPlayed, addRecentlyPlayed } = useRecentlyPlayed();

  // State for sorting
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.DEFAULT);
  const [sortOrder, setSortOrder] = useState('normal'); // 'normal' or 'reverse'
  const [groupInPacks, setGroupInPacks] = useState(false); // Group games by pack

  // Filter categories and games based on installed packages
  // This handles includeGames/excludeGames for proper game filtering
  // Exclude community packs - they're rendered separately via communityCategories
  const filteredCategories = useMemo(() => {
    const officialPackageIds = installedPackages.filter(id => !isCommunityPack(id));
    const unsortedCategories = getFilteredCategories(officialPackageIds, categories);

    // Add recently played index to games for recently played sorting
    const categoriesWithRecentlyPlayed = unsortedCategories.map(category => ({
      ...category,
      games: category.games.map(game => {
        const index = recentlyPlayed.findIndex(entry => entry.slug === game.slug);
        return {
          ...game,
          recentlyPlayedIndex: index === -1 ? Infinity : index
        };
      })
    }));

    return sortCategories(categoriesWithRecentlyPlayed, sortOption, sortOrder);
  }, [installedPackages, sortOption, sortOrder, recentlyPlayed]);

  // Get all games flattened for ungrouped mode sorting
  const allGamesFlattened = useMemo(() => {
    const allGamesList = filteredCategories.flatMap(category => category.games);

    // Add recently played index to all games for sorting
    const gamesWithRecentlyPlayed = allGamesList.map(game => {
      const index = recentlyPlayed.findIndex(entry => entry.slug === game.slug);
      return {
        ...game,
        recentlyPlayedIndex: index === -1 ? Infinity : index
      };
    });

    return sortGames(gamesWithRecentlyPlayed, sortOption, sortOrder);
  }, [filteredCategories, sortOption, sortOrder, recentlyPlayed]);

  // Get favourite games with their full data
  const favouriteGames = useMemo(() => {
    const unsortedFavourites = favourites
      .map(slug => allGames.find(game => game.slug === slug))
      .filter(Boolean); // Filter out any games that no longer exist

    // Add recently played index to favourite games
    const favouritesWithRecentlyPlayed = unsortedFavourites.map(game => {
      const index = recentlyPlayed.findIndex(entry => entry.slug === game.slug);
      return {
        ...game,
        recentlyPlayedIndex: index === -1 ? Infinity : index
      };
    });

    return sortGames(favouritesWithRecentlyPlayed, sortOption, sortOrder);
  }, [favourites, sortOption, sortOrder, recentlyPlayed]);

  // Track recently played games when navigating to a game
  const handleGameClick = (gameSlug) => {
    addRecentlyPlayed(gameSlug);
  };

  // Get community pack categories from the registry (loaded at build time)
  const communityCategories = useMemo(() => {
    return communityPacks.flatMap(pack =>
      (pack.categories || []).map(cat => ({
        ...cat,
        packId: pack.id,
        packName: pack.name,
        packIcon: pack.icon,
      }))
    );
  }, []);

  // Check if there are more packs available to install
  const hasMorePacks = officialPacks.length > installedPackages.length;

  // Filter external packs that have at least one game
  const packsWithGames = customPacks.filter(pack => pack.games.length > 0);

  return (
    <div className={styles.home}>
      {/* Sort Toolbar */}
      <SortToolbar
        currentSort={sortOption}
        onSortChange={setSortOption}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        groupInPacks={groupInPacks}
        onGroupInPacksChange={setGroupInPacks}
      />

      {/* Favourites Section */}
      {favouriteGames.length > 0 && (
        <section className={`${styles.category} ${styles.favouritesSection}`}>
          <h2 className={styles.categoryTitle}>
            <span className={styles.categoryIcon}>⭐</span>
            {t('home.favourites')}
            <span className={styles.gameCount}>{favouriteGames.length}</span>
          </h2>
          <div className={styles.grid}>
            {favouriteGames.map((game) => (
              <GameCard
                key={game.slug}
                title={game.title}
                slug={game.slug}
                description={game.description}
                disabled={game.disabled}
                tag={game.tag}
                version={game.version}
                onClick={() => handleGameClick(game.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {groupInPacks ? (
        // Grouped mode: show categories with headers
        filteredCategories.map((category) => {
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
                    onClick={() => handleGameClick(game.slug)}
                  />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        // Ungrouped mode: show all games in one big list
        allGamesFlattened.length > 0 && (
          <section className={styles.category}>
            <h2 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>🎮</span>
              {t('home.allGames')}
              <span className={styles.gameCount}>{allGamesFlattened.length}</span>
            </h2>
            <div className={styles.grid}>
              {allGamesFlattened.map((game) => (
                <GameCard
                  key={game.slug}
                  title={game.title}
                  slug={game.slug}
                  description={game.description}
                  disabled={game.disabled}
                  tag={game.tag}
                  version={game.version}
                  onClick={() => handleGameClick(game.slug)}
                />
              ))}
            </div>
          </section>
        )
      )}

      {/* External Packs (iframe-based external games) */}
      {packsWithGames.map((pack) => (
        <section key={pack.id} className={styles.category}>
          <h2 className={styles.categoryTitle}>
            <span className={styles.categoryIcon}>{pack.icon}</span>
            {pack.name}
            <span className={styles.gameCount}>{pack.games.length}</span>
            <span className={styles.customTag}>{t('home.custom')}</span>
          </h2>
          <div className={styles.grid}>
            {pack.games.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                slug={game.id}
                description={game.description}
                linkTo={`/custom/${pack.id}/${game.id}`}
                customIcon={game.icon || '🎮'}
                customColors={{ primary: '#f59e0b', secondary: '#d97706' }}
                typeBadge={t('common.external')}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Community Packs */}
      {communityCategories.map((category) => {
        if (!category.games || category.games.length === 0) return null;

        return (
          <section key={`${category.packId}-${category.name}`} className={styles.category}>
            <h2 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>{category.icon || category.packIcon}</span>
              {category.name}
              <span className={styles.gameCount}>{category.games.length}</span>
              <span className={styles.communityTag}>{t('home.community')}</span>
            </h2>
            <div className={styles.grid}>
              {category.games.map((game) => (
                <GameCard
                  key={game.slug}
                  title={game.title}
                  slug={game.slug}
                  description={game.description}
                  linkTo={`/community/${category.packId}/${game.slug}`}
                  customIcon={game.icon || game.emojiIcon || '🎮'}
                  customColors={game.colors || { primary: '#8b5cf6', secondary: '#7c3aed' }}
                  typeBadge={t('home.community')}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Prompt to explore more packs */}
      {hasMorePacks && (
        <section className={styles.storePromo}>
          <div className={styles.promoContent}>
            <span className={styles.promoIcon}>🏪</span>
            <div className={styles.promoText}>
              <h3>{t('home.wantMorePuzzles')}</h3>
              <p>{t('home.browseStore')}</p>
            </div>
            <Link to="/store" className={styles.promoButton}>
              {t('home.visitStore')}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}