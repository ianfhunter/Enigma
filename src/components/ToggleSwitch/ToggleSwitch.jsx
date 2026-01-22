import { useTranslation } from 'react-i18next';
import styles from './ToggleSwitch.module.css';

/**
 * Standardized toggle switch for settings
 * @param {Object} props
 * @param {boolean} props.checked - Whether the toggle is checked
 * @param {function} props.onChange - Callback when toggle state changes
 * @param {string} [props.label] - Label text (or translation key if labelIsKey is true)
 * @param {boolean} [props.labelIsKey] - If true, treat label as a translation key
 * @param {string} [props.className] - Additional CSS class for the container
 * @param {boolean} [props.disabled] - Whether the toggle is disabled
 * @param {'default'|'compact'} [props.variant] - Toggle style variant
 */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  labelIsKey = false,
  className = '',
  disabled = false,
  variant = 'default',
}) {
  const { t } = useTranslation();
  const displayLabel = labelIsKey && label ? t(label) : label;

  const handleChange = (e) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`${styles.toggle} ${styles[variant]} ${disabled ? styles.disabled : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className={styles.slider}></span>
      {displayLabel && <span className={styles.label}>{displayLabel}</span>}
    </label>
  );
}
