import { useTranslation } from 'react-i18next';
import styles from './GiveUpButton.module.css';

/**
 * Standardized "Give Up" button for puzzles
 * @param {Object} props
 * @param {function} props.onGiveUp - Callback when give up is confirmed
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @param {string} [props.label] - Custom button label (overrides translation)
 * @param {boolean} [props.requireConfirm] - Require double-click/confirmation
 * @param {string} [props.className] - Additional CSS class
 * @param {'default'|'compact'|'text'} [props.variant] - Button style variant
 */
export default function GiveUpButton({
  onGiveUp,
  disabled = false,
  label,
  requireConfirm = false,
  className = '',
  variant = 'default',
}) {
  const { t } = useTranslation();
  const displayLabel = label || t('common.giveUp');

  const handleClick = () => {
    if (disabled) return;

    if (requireConfirm) {
      const confirmed = window.confirm(t('common.giveUpConfirm'));
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
      aria-label={displayLabel}
    >
      <span className={styles.icon} aria-hidden="true">🏳️</span>
      <span className={styles.label}>{displayLabel}</span>
    </button>
  );
}
