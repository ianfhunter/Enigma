import { Link } from 'react-router-dom';
import { getGameIcon, getGameColors } from '../../data/gameRegistry';
import styles from './GameCard.module.css';

export default function GameCard({ title, slug, description, disabled = false, tag = null, version = null }) {
  const icon = getGameIcon(slug);
  const colors = getGameColors(slug);
  const hasTag = !!tag;
  const isDev = version === 'DEV';

  const cardContent = (
    <div
      className={`${styles.card} ${disabled ? styles.disabled : ''} ${hasTag ? styles.tagged : ''} ${isDev ? styles.dev : ''}`}
      style={{
        '--card-primary': colors.primary,
        '--card-secondary': colors.secondary,
      }}
    >
      {isDev && <div className={styles.constructionBanner}>🚧 Under Construction</div>}
      {hasTag && <span className={styles.languageTag}>{tag}</span>}
      {version && !isDev && <span className={styles.versionTag}>{version}</span>}
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
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
