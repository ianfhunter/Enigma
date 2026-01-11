import { Link } from 'react-router-dom';
import styles from './GameHeader.module.css';

/**
 * Shared header component for all games
 * @param {Object} props
 * @param {string} props.title - The game title
 * @param {string|React.ReactNode} props.instructions - Instructions text or JSX
 * @param {string} props.backTo - Link destination (default: '/')
 * @param {string} props.backText - Back link text (default: '← Back to Games')
 * @param {function} props.onBack - Optional callback for back button (uses button instead of Link)
 * @param {string} props.gradient - CSS gradient for title (default uses CSS variable)
 * @param {React.ReactNode} props.children - Optional additional content in header
 */
export default function GameHeader({
  title,
  instructions,
  backTo = '/',
  backText = '← Back to Games',
  onBack,
  gradient,
  children,
}) {
  const titleStyle = gradient ? { background: gradient } : undefined;

  return (
    <div className={styles.header}>
      {onBack ? (
        <button className={styles.backLink} onClick={onBack}>
          {backText}
        </button>
      ) : (
        <Link to={backTo} className={styles.backLink}>
          {backText}
        </Link>
      )}
      <h1 className={styles.title} style={titleStyle}>
        {title}
      </h1>
      {instructions && (
        <p className={styles.instructions}>{instructions}</p>
      )}
      {children}
    </div>
  );
}
