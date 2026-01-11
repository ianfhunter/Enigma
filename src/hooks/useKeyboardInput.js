import { useEffect, useCallback } from 'react';

/**
 * A hook for handling keyboard input in games
 * @param {Object} options - Configuration options
 * @param {function} options.onLetter - Called when a letter key is pressed (receives uppercase letter)
 * @param {function} options.onEnter - Called when Enter is pressed
 * @param {function} options.onBackspace - Called when Backspace is pressed
 * @param {function} options.onEscape - Called when Escape is pressed
 * @param {function} options.onArrow - Called when arrow key is pressed (receives 'up', 'down', 'left', 'right')
 * @param {function} options.onNumber - Called when number key is pressed (receives number 0-9)
 * @param {boolean} options.enabled - Whether the keyboard input is active (default: true)
 * @param {boolean} options.preventDefault - Whether to prevent default browser behavior (default: true)
 */
export function useKeyboardInput({
  onLetter,
  onEnter,
  onBackspace,
  onEscape,
  onArrow,
  onNumber,
  enabled = true,
  preventDefault = true,
} = {}) {
  const handleKeyDown = useCallback((e) => {
    // Ignore if modifier keys are pressed (allow browser shortcuts)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;

    if (key === 'Enter' && onEnter) {
      if (preventDefault) e.preventDefault();
      onEnter();
    } else if (key === 'Backspace' && onBackspace) {
      if (preventDefault) e.preventDefault();
      onBackspace();
    } else if (key === 'Escape' && onEscape) {
      if (preventDefault) e.preventDefault();
      onEscape();
    } else if (/^[a-zA-Z]$/.test(key) && onLetter) {
      if (preventDefault) e.preventDefault();
      onLetter(key.toUpperCase());
    } else if (/^[0-9]$/.test(key) && onNumber) {
      if (preventDefault) e.preventDefault();
      onNumber(parseInt(key, 10));
    } else if (key.startsWith('Arrow') && onArrow) {
      if (preventDefault) e.preventDefault();
      const direction = key.replace('Arrow', '').toLowerCase();
      onArrow(direction);
    }
  }, [onLetter, onEnter, onBackspace, onEscape, onArrow, onNumber, preventDefault]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useKeyboardInput;
