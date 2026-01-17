import styles from './GameDetails.module.css';

/**
 * GameDetails component for displaying game-specific announcements and details
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.children - Content to display (text or JSX)
 * @param {string} props.type - Type of announcement: 'info', 'warning', 'notice' (default: 'info')
 * @param {string} props.className - Additional CSS classes
 */
export default function GameDetails({
  children,
  type = 'info',
  className = '',
}) {
  if (!children) return null;

  const typeClass = styles[type] || styles.info;

  return (
    <div className={`${styles.gameDetails} ${typeClass} ${className}`} role="status">
      {children}
    </div>
  );
}
