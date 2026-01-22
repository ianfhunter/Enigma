import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing puzzle game state with built-in protection against
 * triggering win state when not in playing mode.
 *
 * This hook solves the common bug where giving up (revealing the solution)
 * would trigger the win state because the grid matches the solution.
 *
 * @param {Object} [options]
 * @param {'playing'|'won'|'lost'|'gaveUp'} [options.initialState] - Initial game state (default: 'playing')
 * @param {function} [options.onWin] - Callback when game is won
 * @param {function} [options.onGiveUp] - Callback when player gives up
 * @param {function} [options.onLose] - Callback when game is lost
 * @returns {Object} Game state and control functions
 *
 * @example
 * const { gameState, checkWin, giveUp, reset, isPlaying } = useGameState();
 *
 * // In a useEffect - no manual guard needed!
 * useEffect(() => {
 *   if (!puzzleData) return;
 *   checkWin(isSolved(grid, puzzleData.solution));
 * }, [grid, puzzleData, checkWin]);
 *
 * // Give up handler - safe because checkWin won't trigger after giveUp
 * const handleGiveUp = () => {
 *   setGrid(puzzleData.solution);
 *   giveUp();
 * };
 */
export function useGameState({ initialState = 'playing', onWin, onGiveUp, onLose } = {}) {
  const [gameState, setGameState] = useState(initialState);
  const callbacksRef = useRef({ onWin, onGiveUp, onLose });

  // Keep callbacks up to date without causing re-renders
  callbacksRef.current = { onWin, onGiveUp, onLose };

  /**
   * Check if puzzle is solved and set won state if currently playing.
   * This is the key function that prevents the "give up triggers win" bug.
   *
   * @param {boolean|function} condition - Win condition (boolean or function returning boolean)
   * @returns {boolean} - True if the game was won (state transitioned to 'won'), false otherwise
   */
  const checkWin = useCallback((condition) => {
    // Only check win if currently playing - this is the key guard!
    if (gameState !== 'playing') return false;

    const isSolved = typeof condition === 'function' ? condition() : condition;

    if (isSolved) {
      setGameState('won');
      callbacksRef.current.onWin?.();
      return true;
    }
    return false;
  }, [gameState]);

  /**
   * Give up - reveal solution without triggering win.
   * After calling this, checkWin will no longer trigger win state.
   */
  const giveUp = useCallback(() => {
    if (gameState !== 'playing') return;
    setGameState('gaveUp');
    callbacksRef.current.onGiveUp?.();
  }, [gameState]);

  /**
   * Mark the game as lost
   */
  const lose = useCallback(() => {
    if (gameState !== 'playing') return;
    setGameState('lost');
    callbacksRef.current.onLose?.();
  }, [gameState]);

  /**
   * Reset to playing state (for new game)
   */
  const reset = useCallback(() => {
    setGameState('playing');
  }, []);

  // Convenience boolean flags
  const isPlaying = gameState === 'playing';
  const isWon = gameState === 'won';
  const isGaveUp = gameState === 'gaveUp';
  const isLost = gameState === 'lost';
  const isFinished = !isPlaying;

  return {
    gameState,
    setGameState, // Escape hatch for edge cases
    checkWin,
    giveUp,
    lose,
    reset,
    isPlaying,
    isWon,
    isGaveUp,
    isLost,
    isFinished,
  };
}

export default useGameState;
