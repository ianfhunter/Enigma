import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGameIcon, getGameColors } from '../../data/gameRegistry';
import { useFavourites } from '../../context/SettingsContext';
import styles from './GameCard.module.css';

/**
 * GameCard - Unified card component for all game types
 *
 * @param {string} title - Game title
 * @param {string} slug - Game slug (used for routing and icon lookup)
 * @param {string} description - Game description
 * @param {boolean} disabled - Whether the game is disabled
 * @param {string} tag - Optional tag (e.g., "EN-GB")
 * @param {string} version - Optional version tag
 * @param {string} linkTo - Custom link path (overrides default /${slug})
 * @param {string|function} customIcon - Custom icon (emoji string or component)
 * @param {object} customColors - Custom colors { primary, secondary }
 * @param {string} typeBadge - Optional type badge (e.g., "Community", "External")
 * @param {boolean} showFavouriteButton - Whether to show the favourite toggle button
 */
export default function GameCard({
  title,
  slug,
  description,
  disabled = false,
  tag = null,
  version = null,
  linkTo = null,
  customIcon = null,
  customColors = null,
  typeBadge = null,
  showFavouriteButton = true,
  onClick = null,
}) {
  const { t } = useTranslation();
  const icon = customIcon || getGameIcon(slug);
  const colors = customColors || getGameColors(slug);
  const hasTag = !!tag;
  const { isFavourite, toggleFavourite } = useFavourites();
  const isFav = isFavourite(slug);

  const handleFavouriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavourite(slug);
  };

  // Render icon - supports emoji strings, SVG URLs, or React components
  const renderIcon = () => {
    if (typeof icon === 'string') {
      // Check if it's an SVG URL/path (Vite adds hashes like /assets/icon.svg?t=123)
      if (icon.includes('.svg') || icon.startsWith('/assets/') || icon.startsWith('data:image')) {
        return <img src={icon} alt="" className={styles.svgIcon} />;
      }
      // Otherwise treat as emoji
      return icon;
    }
    // React component
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className={styles.svgIcon} />;
    }
    // Already a React element
    return icon;
  };

  const cardContent = (
    <div
      className={`${styles.card} ${disabled ? styles.disabled : ''} ${hasTag ? styles.tagged : ''} ${typeBadge ? styles.hasTypeBadge : ''}`}
      style={{
        '--card-primary': colors.primary,
        '--card-secondary': colors.secondary,
      }}
      onClick={onClick}
    >
      {showFavouriteButton && !disabled && (
        <button
          className={`${styles.favouriteButton} ${isFav ? styles.favourited : ''}`}
          onClick={handleFavouriteClick}
          aria-label={isFav ? t('common.removeFromFavourites') : t('common.addToFavourites')}
          title={isFav ? t('common.removeFromFavourites') : t('common.addToFavourites')}
        >
          {isFav ? '★' : '☆'}
        </button>
      )}
      {hasTag && <span className={styles.languageTag}>{tag}</span>}
      {typeBadge && <span className={styles.typeBadge}>{typeBadge}</span>}
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{renderIcon()}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {disabled && (
        <span className={styles.badge}>{t('common.comingSoon')}</span>
      )}
      {!disabled && (
        <span className={styles.playBadge}>{t('common.playNow')}</span>
      )}
    </div>
  );

  if (disabled) {
    return cardContent;
  }

  const href = linkTo || `/${slug}`;

  return (
    <Link to={href} className={styles.link}>
      {cardContent}
    </Link>
  );
}
