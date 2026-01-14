import styles from './GameResult.module.css';

/**
 * Game result overlay/panel for win/lose/gave-up states
 * @param {Object} props
 * @param {'won'|'lost'|'gaveup'} props.state - The game result state
 * @param {string} [props.title] - Custom title (defaults based on state)
 * @param {string|React.ReactNode} [props.message] - Result message
 * @param {string} [props.revealedAnswer] - Answer to show (for lost/gaveup)
 * @param {Array} [props.stats] - Stats to display [{ label, value }]
 * @param {Array} props.actions - Action buttons [{ label, onClick, primary?, variant? }]
 * @param {string} [props.className] - Additional CSS class
 * @param {'overlay'|'inline'} [props.variant] - Display variant
 */
export default function GameResult({
  state,
  title,
  message,
  revealedAnswer,
  stats = [],
  actions = [],
  className = '',
  variant = 'inline',
}) {
  const defaultTitles = {
    won: '🎉 Congratulations!',
    lost: '😔 Game Over',
    gaveup: '🏳️ Solution Revealed',
  };

  const displayTitle = title || defaultTitles[state] || '';

  const stateClass = styles[state] || '';
  const variantClass = styles[variant] || '';

  return (
    <div
      className={`${styles.result} ${stateClass} ${variantClass} ${className}`}
      role="status"
      aria-live="polite"
    >
      {displayTitle && <h3 className={styles.title}>{displayTitle}</h3>}

      {message && <p className={styles.message}>{message}</p>}

      {revealedAnswer && (
        <p className={styles.answer}>
          The answer was: <strong>{revealedAnswer}</strong>
        </p>
      )}

      {stats.length > 0 && (
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={stat.label || index} className={styles.stat}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={action.label || index}
              type="button"
              className={`${styles.button} ${action.primary ? styles.primary : ''} ${action.variant ? styles[action.variant] : ''}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
