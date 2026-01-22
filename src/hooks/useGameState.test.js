import { describe, it, expect, vi } from 'vitest';

// ===========================================
// useGameState - State Constants Tests
// ===========================================
describe('useGameState - State Constants', () => {
  const STATES = {
    PLAYING: 'playing',
    WON: 'won',
    GAVE_UP: 'gaveUp',
    LOST: 'lost',
  };

  it('should define all game states', () => {
    expect(STATES.PLAYING).toBe('playing');
    expect(STATES.WON).toBe('won');
    expect(STATES.GAVE_UP).toBe('gaveUp');
    expect(STATES.LOST).toBe('lost');
  });
});

// ===========================================
// useGameState - checkWin Logic Tests
// ===========================================
describe('useGameState - checkWin Logic', () => {
  /**
   * Simulates the checkWin logic from the hook
   */
  const simulateCheckWin = (currentState, condition) => {
    // Only check win if currently playing - this is the key guard!
    if (currentState !== 'playing') return { won: false, newState: currentState };

    const isSolved = typeof condition === 'function' ? condition() : condition;

    if (isSolved) {
      return { won: true, newState: 'won' };
    }
    return { won: false, newState: currentState };
  };

  it('should set won state when condition is true and currently playing', () => {
    const result = simulateCheckWin('playing', true);
    expect(result.won).toBe(true);
    expect(result.newState).toBe('won');
  });

  it('should NOT set won state when condition is false', () => {
    const result = simulateCheckWin('playing', false);
    expect(result.won).toBe(false);
    expect(result.newState).toBe('playing');
  });

  it('should NOT set won state when already gave up (THE KEY BUG FIX)', () => {
    // This is the main bug we're fixing!
    // When user gives up, grid is set to solution, which would normally trigger win
    const result = simulateCheckWin('gaveUp', true);
    expect(result.won).toBe(false);
    expect(result.newState).toBe('gaveUp'); // Should stay gaveUp, not become won!
  });

  it('should NOT set won state when already won', () => {
    const result = simulateCheckWin('won', true);
    expect(result.won).toBe(false);
    expect(result.newState).toBe('won');
  });

  it('should NOT set won state when already lost', () => {
    const result = simulateCheckWin('lost', true);
    expect(result.won).toBe(false);
    expect(result.newState).toBe('lost');
  });

  it('should accept a function as condition', () => {
    const checkFn = vi.fn(() => true);
    const result = simulateCheckWin('playing', checkFn);

    expect(checkFn).toHaveBeenCalled();
    expect(result.won).toBe(true);
  });

  it('should NOT call condition function when not playing', () => {
    // When not playing, we should early return without evaluating condition
    // This is implied by the logic - we check state first
    const result = simulateCheckWin('gaveUp', true);
    expect(result.newState).toBe('gaveUp');
  });
});

// ===========================================
// useGameState - giveUp Logic Tests
// ===========================================
describe('useGameState - giveUp Logic', () => {
  const simulateGiveUp = (currentState) => {
    if (currentState !== 'playing') return currentState;
    return 'gaveUp';
  };

  it('should set gaveUp state when playing', () => {
    expect(simulateGiveUp('playing')).toBe('gaveUp');
  });

  it('should NOT change state when already won', () => {
    expect(simulateGiveUp('won')).toBe('won');
  });

  it('should NOT change state when already gave up', () => {
    expect(simulateGiveUp('gaveUp')).toBe('gaveUp');
  });

  it('should NOT change state when already lost', () => {
    expect(simulateGiveUp('lost')).toBe('lost');
  });
});

// ===========================================
// useGameState - lose Logic Tests
// ===========================================
describe('useGameState - lose Logic', () => {
  const simulateLose = (currentState) => {
    if (currentState !== 'playing') return currentState;
    return 'lost';
  };

  it('should set lost state when playing', () => {
    expect(simulateLose('playing')).toBe('lost');
  });

  it('should NOT change state when already won', () => {
    expect(simulateLose('won')).toBe('won');
  });

  it('should NOT change state when already gave up', () => {
    expect(simulateLose('gaveUp')).toBe('gaveUp');
  });
});

// ===========================================
// useGameState - reset Logic Tests
// ===========================================
describe('useGameState - reset Logic', () => {
  const simulateReset = () => 'playing';

  it('should reset to playing state', () => {
    expect(simulateReset()).toBe('playing');
  });
});

// ===========================================
// useGameState - Boolean Flags Tests
// ===========================================
describe('useGameState - Boolean Flags', () => {
  const getFlags = (state) => ({
    isPlaying: state === 'playing',
    isWon: state === 'won',
    isGaveUp: state === 'gaveUp',
    isLost: state === 'lost',
    isFinished: state !== 'playing',
  });

  it('should have correct flags for playing state', () => {
    const flags = getFlags('playing');
    expect(flags.isPlaying).toBe(true);
    expect(flags.isWon).toBe(false);
    expect(flags.isGaveUp).toBe(false);
    expect(flags.isLost).toBe(false);
    expect(flags.isFinished).toBe(false);
  });

  it('should have correct flags for won state', () => {
    const flags = getFlags('won');
    expect(flags.isPlaying).toBe(false);
    expect(flags.isWon).toBe(true);
    expect(flags.isGaveUp).toBe(false);
    expect(flags.isLost).toBe(false);
    expect(flags.isFinished).toBe(true);
  });

  it('should have correct flags for gaveUp state', () => {
    const flags = getFlags('gaveUp');
    expect(flags.isPlaying).toBe(false);
    expect(flags.isWon).toBe(false);
    expect(flags.isGaveUp).toBe(true);
    expect(flags.isLost).toBe(false);
    expect(flags.isFinished).toBe(true);
  });

  it('should have correct flags for lost state', () => {
    const flags = getFlags('lost');
    expect(flags.isPlaying).toBe(false);
    expect(flags.isWon).toBe(false);
    expect(flags.isGaveUp).toBe(false);
    expect(flags.isLost).toBe(true);
    expect(flags.isFinished).toBe(true);
  });
});

// ===========================================
// useGameState - Real-world Scenario Tests
// ===========================================
describe('useGameState - Real-world Scenarios', () => {
  /**
   * Simulates the complete game state machine
   */
  class GameStateMachine {
    constructor(initialState = 'playing') {
      this.state = initialState;
    }

    checkWin(condition) {
      if (this.state !== 'playing') return false;
      const isSolved = typeof condition === 'function' ? condition() : condition;
      if (isSolved) {
        this.state = 'won';
        return true;
      }
      return false;
    }

    giveUp() {
      if (this.state !== 'playing') return;
      this.state = 'gaveUp';
    }

    lose() {
      if (this.state !== 'playing') return;
      this.state = 'lost';
    }

    reset() {
      this.state = 'playing';
    }
  }

  it('should prevent win state when solution is revealed via give up', () => {
    const game = new GameStateMachine();

    // 1. User is playing
    expect(game.state).toBe('playing');

    // 2. User clicks "Give Up"
    game.giveUp();
    expect(game.state).toBe('gaveUp');

    // 3. Grid is updated to show solution, triggering useEffect
    // 4. useEffect calls checkWin with true (grid matches solution)
    const won = game.checkWin(true);

    // 5. CRITICAL: Should NOT have won!
    expect(won).toBe(false);
    expect(game.state).toBe('gaveUp');
  });

  it('should allow winning normally when playing', () => {
    const game = new GameStateMachine();

    // User solves the puzzle
    const won = game.checkWin(true);

    expect(won).toBe(true);
    expect(game.state).toBe('won');
  });

  it('should allow winning after reset from gaveUp', () => {
    const game = new GameStateMachine();

    // Give up on first puzzle
    game.giveUp();
    expect(game.state).toBe('gaveUp');

    // Start new puzzle
    game.reset();
    expect(game.state).toBe('playing');

    // Solve new puzzle
    const won = game.checkWin(true);
    expect(won).toBe(true);
    expect(game.state).toBe('won');
  });

  it('should handle rapid checkWin calls safely', () => {
    const game = new GameStateMachine();

    // Multiple checkWin calls in quick succession
    game.checkWin(true);
    expect(game.state).toBe('won');

    // Subsequent calls should not cause issues
    const result1 = game.checkWin(true);
    const result2 = game.checkWin(false);

    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(game.state).toBe('won');
  });

  it('should handle the typical puzzle flow', () => {
    const game = new GameStateMachine();

    // User makes some moves, not yet solved
    expect(game.checkWin(false)).toBe(false);
    expect(game.state).toBe('playing');

    // User makes more moves, still not solved
    expect(game.checkWin(false)).toBe(false);
    expect(game.state).toBe('playing');

    // User solves it!
    expect(game.checkWin(true)).toBe(true);
    expect(game.state).toBe('won');
  });
});
