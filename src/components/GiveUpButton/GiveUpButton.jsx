import styles from './GiveUpButton.module.css';

/**
 * Standardized "Give Up" button for puzzles
 * @param {Object} props
 * @param {function} props.onGiveUp - Callback when give up is confirmed
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @param {string} [props.label] - Custom button label
 * @param {boolean} [props.requireConfirm] - Require double-click/confirmation
 * @param {string} [props.className] - Additional CSS class
 * @param {'default'|'compact'|'text'} [props.variant] - Button style variant
 */
export default function GiveUpButton({
  onGiveUp,
  disabled = false,
  label = 'Give Up',
  requireConfirm = false,
  className = '',
  variant = 'default',
}) {
  const handleClick = () => {
    if (disabled) return;

    if (requireConfirm) {
      const confirmed = window.confirm('Are you sure you want to give up? The solution will be revealed.');
      if (!confirmed) return;
    }

    onGiveUp();
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
    >
      <span className={styles.icon} aria-hidden="true">🏳️</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
