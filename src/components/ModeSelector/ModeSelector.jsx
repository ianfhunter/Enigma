import { useTranslation } from 'react-i18next';
import styles from './ModeSelector.module.css';

/**
 * Game mode selector (Daily, Practice, Endless, Challenge, etc.)
 * @param {Object} props
 * @param {Array} props.modes - Array of mode objects { id, label, icon?, description?, disabled?, completed? }
 * @param {string} props.value - Currently selected mode id
 * @param {function} props.onChange - Callback when mode changes
 * @param {string} [props.className] - Additional CSS class
 * @param {'cards'|'tabs'|'buttons'} [props.variant] - Display variant
 */
export default function ModeSelector({
  modes = [],
  value,
  onChange,
  className = '',
  variant = 'buttons',
}) {
  const { t } = useTranslation();

  if (modes.length === 0) return null;

  return (
    <div
      className={`${styles.selector} ${styles[variant]} ${className}`}
      role="group"
      aria-label={t('common.gameModeSelector')}
    >
      {modes.map((mode) => {
        const isActive = value === mode.id;
        const isDisabled = mode.disabled;
        const isCompleted = mode.completed;

        return (
          <button
            key={mode.id}
            type="button"
            className={`
              ${styles.mode}
              ${isActive ? styles.active : ''}
              ${isDisabled ? styles.disabled : ''}
              ${isCompleted ? styles.completed : ''}
            `}
            onClick={() => !isDisabled && onChange(mode.id)}
            disabled={isDisabled}
            aria-pressed={isActive}
            aria-label={`${mode.label}${isCompleted ? `, ${t('common.completed')}` : ''}${isDisabled ? `, ${t('common.unavailable')}` : ''}`}
          >
            {mode.icon && <span className={styles.icon} aria-hidden="true">{mode.icon}</span>}
            <span className={styles.label}>{mode.label}</span>
            {mode.description && variant === 'cards' && (
              <span className={styles.description}>{mode.description}</span>
            )}
            {isCompleted && <span className={styles.checkmark} aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
