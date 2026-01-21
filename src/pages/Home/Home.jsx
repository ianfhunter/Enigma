import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GameCard from '../../components/GameCard';
import { categories, allGames } from '../../data/gameRegistry';
import { useInstalledPackages } from '../../hooks/useInstalledPackages';
import { useCustomPacks } from '../../hooks/useCustomPacks';
import { communityPacks, isCommunityPack } from '../../packs/registry';
import { getFilteredCategories, officialPacks } from '../../data/packageRegistry';
import { useFavourites } from '../../context/SettingsContext';
import styles from './Home.module.css';

export default function Home() {
  const { t } = useTranslation();
  const { installedPackages } = useInstalledPackages();
  const { customPacks } = useCustomPacks();
  const { favourites } = useFavourites();

  // Filter categories and games based on installed packages
  // This handles includeGames/excludeGames for proper game filtering
  // Exclude community packs - they're rendered separately via communityCategories
  const filteredCategories = useMemo(() => {
    const officialPackageIds = installedPackages.filter(id => !isCommunityPack(id));
    return getFilteredCategories(officialPackageIds, categories);
  }, [installedPackages]);

  // Get favourite games with their full data
  const favouriteGames = useMemo(() => {
    return favourites
      .map(slug => allGames.find(game => game.slug === slug))
      .filter(Boolean); // Filter out any games that no longer exist
  }, [favourites]);

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
              />
            ))}
          </div>
        </section>
      )}

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
