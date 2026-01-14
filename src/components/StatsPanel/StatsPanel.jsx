import styles from './StatsPanel.module.css';

/**
 * Flexible stats panel component for displaying game statistics
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects { label, value, icon? }
 * @param {string} [props.className] - Additional CSS class
 * @param {'horizontal'|'vertical'|'grid'} [props.layout] - Layout style
 * @param {'default'|'compact'|'large'} [props.size] - Size variant
 */
export default function StatsPanel({
  stats = [],
  className = '',
  layout = 'horizontal',
  size = 'default',
}) {
  if (stats.length === 0) return null;

  return (
    <div
      className={`${styles.panel} ${styles[layout]} ${styles[size]} ${className}`}
      role="region"
      aria-label="Game statistics"
    >
      {stats.map((stat, index) => (
        <div key={stat.label || index} className={styles.stat}>
          {stat.icon && <span className={styles.icon} aria-hidden="true">{stat.icon}</span>}
          <span className={styles.value}>{stat.value}</span>
          <span className={styles.label}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
