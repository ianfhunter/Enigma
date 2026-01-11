import { Link, useParams } from 'react-router-dom';
import { getGameBySlug } from '../../data/gameRegistry';
import NotFound from '../NotFound';
import styles from './DevPlaceholder.module.css';

export default function DevPlaceholder() {
  const { slug } = useParams();
  const game = getGameBySlug(slug);

  if (!game) return <NotFound />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>{game.title}</h1>
        <p className={styles.subtitle}>{game.description}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>DEV</span>
          <span className={styles.slug}>/{game.slug}</span>
        </div>

        <p className={styles.body}>
          This game is listed from <strong>Simon Tatham&apos;s Portable Puzzle Collection</strong> and is currently
          under construction in our self-hosted hub.
        </p>
      </div>
    </div>
  );
}

