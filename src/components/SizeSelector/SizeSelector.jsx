import styles from './SizeSelector.module.css';

/**
 * Grid size selector for puzzles
 * @param {Object} props
 * @param {Array} props.options - Array of size values (e.g., [3, 5, 7] or ['3×3', '5×5'])
 * @param {string|number} props.value - Currently selected size
 * @param {function} props.onChange - Callback when size changes
 * @param {Object} [props.labels] - Custom labels for sizes (e.g., { 3: 'Small' })
 * @param {string} [props.className] - Additional CSS class
 */
export default function SizeSelector({
  options = [],
  value,
  onChange,
  labels = {},
  className = '',
}) {
  if (options.length === 0) return null;

  const getLabel = (option) => {
    if (labels[option]) return labels[option];
    // If it's a number, format as NxN
    if (typeof option === 'number') return `${option}×${option}`;
    return String(option);
  };

  return (
    <div
      className={`${styles.selector} ${className}`}
      role="group"
      aria-label="Size selector"
    >
      {options.map((option) => {
        const isActive = value === option || String(value) === String(option);

        return (
          <button
            key={option}
            type="button"
            className={`${styles.option} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            aria-label={`Size ${getLabel(option)}`}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
