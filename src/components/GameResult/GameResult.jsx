import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEnabled } from '../../context/SettingsContext';
import styles from './GameResult.module.css';
import winSound from '../../assets/sound_effects/marimba-win-b-3-209679.mp3';

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
  // New interface
  state,
  title,
  message,
  revealedAnswer,
  stats = [],
  actions = [],
  className = '',
  variant = 'inline',
  // Legacy interfaces - normalize to state
  show,
  type,
  gameState,
  winTitle,
  winMessage,
}) {
  const { t } = useTranslation();
  const { soundEnabled } = useSoundEnabled();
  const hasPlayedSound = useRef(false);

  // Normalize different prop patterns to a single 'normalizedState'
  // Priority: state > (show && type) > gameState
  let normalizedState = state;
  if (!normalizedState && show !== undefined && type) {
    normalizedState = show ? type : 'playing';
  }
  if (!normalizedState && gameState) {
    normalizedState = gameState;
  }

  // Also normalize title and message from legacy props
  const normalizedTitle = title || winTitle;
  const normalizedMessage = message || winMessage;

  // Play win sound effect when state becomes 'won'
  // Note: This must be called before any conditional returns to satisfy React's rules of hooks
  useEffect(() => {
    if (normalizedState === 'won' && !hasPlayedSound.current && soundEnabled) {
      hasPlayedSound.current = true;
      const audio = new Audio(winSound);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
    // Reset when state changes away from 'won'
    if (normalizedState !== 'won') {
      hasPlayedSound.current = false;
    }
  }, [normalizedState, soundEnabled]);

  // Don't render if show is explicitly false (legacy behavior)
  if (show === false) {
    return null;
  }

  // Don't render if game is still in progress
  if (normalizedState === 'playing' || !normalizedState) {
    return null;
  }

  const defaultTitles = {
    won: t('gameResult.congratulations'),
    lost: t('gameResult.gameOver'),
    gaveup: t('gameResult.solutionRevealed'),
  };

  const displayTitle = normalizedTitle || defaultTitles[normalizedState] || '';

  const stateClass = styles[normalizedState] || '';
  const variantClass = styles[variant] || '';

  return (
    <div
      className={`${styles.result} ${stateClass} ${variantClass} ${className}`}
      role="status"
      aria-live="polite"
    >
      {displayTitle && <h3 className={styles.title}>{displayTitle}</h3>}

      {normalizedMessage && <p className={styles.message}>{normalizedMessage}</p>}

      {revealedAnswer && (
        <p className={styles.answer}>
          {t('gameResult.theAnswerWas').replace('<strong>{{answer}}</strong>', '')}<strong>{revealedAnswer}</strong>
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
