import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './GameHeader.module.css';

/**
 * Shared header component for all games
 * @param {Object} props
 * @param {string} props.title - The game title
 * @param {string|React.ReactNode} props.instructions - Instructions text or JSX
 * @param {string} props.backTo - Link destination (default: '/')
 * @param {string} props.backText - Back link text (uses translation if not provided)
 * @param {function} props.onBack - Optional callback for back button (uses button instead of Link)
 * @param {string} props.gradient - CSS gradient for title (default uses CSS variable)
 * @param {React.ReactNode} props.children - Optional additional content in header
 */
export default function GameHeader({
  title,
  instructions,
  backTo = '/',
  backText,
  onBack,
  gradient,
  children,
}) {
  const { t } = useTranslation();
  const displayBackText = backText !== undefined ? backText : t('common.backToGames');

  const titleStyle = gradient ? {
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } : undefined;

  return (
    <div className={styles.header}>
      {onBack ? (
        <button className={styles.backLink} onClick={onBack}>
          {displayBackText}
        </button>
      ) : (
        <Link to={backTo} className={styles.backLink}>
          {displayBackText}
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
