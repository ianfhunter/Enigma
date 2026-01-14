import styles from './DifficultySelector.module.css';

/**
 * Reusable difficulty selector component
 * @param {Object} props
 * @param {string[]} props.options - Array of difficulty levels (e.g., ['easy', 'medium', 'hard'])
 * @param {string} props.value - Currently selected difficulty
 * @param {function} props.onChange - Callback when difficulty changes
 * @param {Object} [props.completedStates] - Map of difficulty to completion status (shows checkmark)
 * @param {Object} [props.labels] - Custom labels for difficulties (e.g., { easy: 'Beginner' })
 * @param {string} [props.className] - Additional CSS class
 */
export default function DifficultySelector({
  options = ['easy', 'medium', 'hard'],
  value,
  onChange,
  completedStates = {},
  labels = {},
  className = '',
}) {
  const getLabel = (option) => {
    if (labels[option]) return labels[option];
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  return (
    <div className={`${styles.selector} ${className}`} role="group" aria-label="Difficulty selector">
      {options.map((option) => {
        const isActive = value === option;
        const isCompleted = completedStates[option];

        return (
          <button
            key={option}
            type="button"
            className={`${styles.option} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            aria-label={`${getLabel(option)}${isCompleted ? ', completed' : ''}`}
          >
            {getLabel(option)}
            {isCompleted && <span className={styles.checkmark} aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
