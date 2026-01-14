import styles from './Timer.module.css';

/**
 * Format seconds into a time string
 * @param {number} seconds - Total seconds
 * @param {'mm:ss'|'hh:mm:ss'|'auto'} format - Format style
 * @returns {string} Formatted time string
 */
export function formatTime(seconds, format = 'auto') {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (format === 'hh:mm:ss' || (format === 'auto' && hrs > 0)) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // For mm:ss format, include hours as minutes when > 0
  const totalMins = hrs * 60 + mins;
  return `${String(totalMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Timer display component
 * @param {Object} props
 * @param {number} props.seconds - Time in seconds
 * @param {string} [props.icon] - Icon to display
 * @param {string} [props.label] - Label text
 * @param {'mm:ss'|'hh:mm:ss'|'auto'} [props.format] - Time format
 * @param {string} [props.className] - Additional CSS class
 * @param {'default'|'compact'|'large'} [props.size] - Size variant
 * @param {boolean} [props.running] - Whether timer is running (adds pulse effect)
 */
export default function Timer({
  seconds,
  icon = '⏱️',
  label,
  format = 'auto',
  className = '',
  size = 'default',
  running = false,
}) {
  const formattedTime = formatTime(seconds, format);

  return (
    <div
      className={`${styles.timer} ${styles[size]} ${running ? styles.running : ''} ${className}`}
      role="timer"
      aria-label={`${label || 'Time'}: ${formattedTime}`}
    >
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.time}>{formattedTime}</span>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
