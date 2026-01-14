import { describe, it, expect } from 'vitest';
import { makeSecret, scoreGuess, DEFAULT_COLORS } from './Guess.jsx';

describe('Guess (Mastermind) - secret generation', () => {
  it('respects length and duplicate setting', () => {
    const colors = DEFAULT_COLORS.slice(0, 4);
    const secretNoDupes = makeSecret({ colors, pegs: 4, allowDuplicates: false });
    expect(secretNoDupes.length).toBe(4);
    expect(new Set(secretNoDupes).size).toBe(4);

    const secretWithDupes = makeSecret({ colors, pegs: 6, allowDuplicates: true });
    expect(secretWithDupes.length).toBe(6);
    // With duplicates allowed, uniqueness is not guaranteed; just ensure in range
    secretWithDupes.forEach(id => {
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(colors.length);
    });
  });
});

describe('Guess (Mastermind) - scoring', () => {
  it('awards black pegs for correct position/color and white for color-only', () => {
    const secret = [0, 1, 2, 3];
    expect(scoreGuess(secret, [0, 1, 2, 3])).toEqual({ black: 4, white: 0 });
    expect(scoreGuess(secret, [3, 2, 1, 0])).toEqual({ black: 0, white: 4 });
    expect(scoreGuess(secret, [0, 2, 4, 4])).toEqual({ black: 1, white: 1 });
  });

  it('ignores extras of a color beyond secret counts for white pegs', () => {
    const secret = [0, 0, 1, 2];
    expect(scoreGuess(secret, [0, 0, 0, 0])).toEqual({ black: 2, white: 0 }); // two blacks, no extra whites
    expect(scoreGuess(secret, [0, 1, 0, 2])).toEqual({ black: 2, white: 2 }); // positions 0,3 correct; 1 and 2 swapped -> two whites
  });
});
