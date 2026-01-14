import { Link } from 'react-router-dom';
import { getGameIcon, getGameColors } from '../../data/gameRegistry';
import styles from './GameCard.module.css';

export default function GameCard({ title, slug, description, disabled = false, tag = null, version = null }) {
  const icon = getGameIcon(slug);
  const colors = getGameColors(slug);
  const hasTag = !!tag;

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
      className={`${styles.card} ${disabled ? styles.disabled : ''} ${hasTag ? styles.tagged : ''}`}
      style={{
        '--card-primary': colors.primary,
        '--card-secondary': colors.secondary,
      }}
    >
      {hasTag && <span className={styles.languageTag}>{tag}</span>}
      {version && <span className={styles.versionTag}>{version}</span>}
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{renderIcon()}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {disabled && (
        <span className={styles.badge}>Coming Soon</span>
      )}
      {!disabled && (
        <span className={styles.playBadge}>Play Now</span>
      )}
    </div>
  );

  if (disabled) {
    return cardContent;
  }

  return (
    <Link to={`/${slug}`} className={styles.link}>
      {cardContent}
    </Link>
  );
}
