import { describe, it, expect } from 'vitest';
import {
  getRandomHangmanWord,
  getWordsInRange,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// Hangman - getRandomHangmanWord Tests
// ===========================================
describe('Hangman - getRandomHangmanWord', () => {
  it('should return a word within default length range (5-8)', () => {
    const word = getRandomHangmanWord();

    expect(word.length).toBeGreaterThanOrEqual(5);
    expect(word.length).toBeLessThanOrEqual(8);
  });

  it('should return a valid word', () => {
    const word = getRandomHangmanWord();

    expect(isValidWord(word)).toBe(true);
  });

  it('should return uppercase word', () => {
    const word = getRandomHangmanWord();

    expect(word).toBe(word.toUpperCase());
  });

  it('should respect custom length range', () => {
    const word = getRandomHangmanWord(4, 6);

    expect(word.length).toBeGreaterThanOrEqual(4);
    expect(word.length).toBeLessThanOrEqual(6);
  });

  it('should generate different words over multiple calls', () => {
    const words = new Set();

    for (let i = 0; i < 20; i++) {
      words.add(getRandomHangmanWord());
    }

    expect(words.size).toBeGreaterThan(1);
  });
});

// ===========================================
// Hangman - getWordsInRange Tests
// ===========================================
describe('Hangman - getWordsInRange', () => {
  it('should return words within specified range', () => {
    const words = getWordsInRange(5, 7);

    expect(words.length).toBeGreaterThan(0);
    words.forEach(word => {
      expect(word.length).toBeGreaterThanOrEqual(5);
      expect(word.length).toBeLessThanOrEqual(7);
    });
  });

  it('should return valid words', () => {
    const words = getWordsInRange(5, 7);

    // Check a sample
    const sample = words.slice(0, 20);
    sample.forEach(word => {
      expect(isValidWord(word)).toBe(true);
    });
  });

  it('should return empty for invalid range', () => {
    const words = getWordsInRange(100, 110);

    expect(words).toEqual([]);
  });

  it('should handle single length range', () => {
    const words = getWordsInRange(5, 5);

    expect(words.length).toBeGreaterThan(0);
    words.forEach(word => {
      expect(word.length).toBe(5);
    });
  });
});

// ===========================================
// Hangman - Game Logic Tests
// ===========================================
describe('Hangman - Game Logic', () => {
  // Simulating hangman game state
  const createGameState = (word) => ({
    word: word.toUpperCase(),
    guessedLetters: new Set(),
    wrongGuesses: 0,
    maxWrongGuesses: 6,
  });

  const guessLetter = (state, letter) => {
    const upperLetter = letter.toUpperCase();

    if (state.guessedLetters.has(upperLetter)) {
      return { ...state, result: 'already_guessed' };
    }

    const newState = {
      ...state,
      guessedLetters: new Set([...state.guessedLetters, upperLetter]),
    };

    if (state.word.includes(upperLetter)) {
      return { ...newState, result: 'correct' };
    } else {
      return {
        ...newState,
        wrongGuesses: state.wrongGuesses + 1,
        result: 'wrong',
      };
    }
  };

  const isWon = (state) => {
    return [...state.word].every(char => state.guessedLetters.has(char));
  };

  const isLost = (state) => {
    return state.wrongGuesses >= state.maxWrongGuesses;
  };

  const getDisplayWord = (state) => {
    return [...state.word].map(char =>
      state.guessedLetters.has(char) ? char : '_'
    ).join(' ');
  };

  it('should track correct guesses', () => {
    let state = createGameState('HELLO');
    state = guessLetter(state, 'H');

    expect(state.result).toBe('correct');
    expect(state.guessedLetters.has('H')).toBe(true);
    expect(state.wrongGuesses).toBe(0);
  });

  it('should track wrong guesses', () => {
    let state = createGameState('HELLO');
    state = guessLetter(state, 'Z');

    expect(state.result).toBe('wrong');
    expect(state.wrongGuesses).toBe(1);
  });

  it('should detect already guessed letters', () => {
    let state = createGameState('HELLO');
    state = guessLetter(state, 'H');
    state = guessLetter(state, 'H');

    expect(state.result).toBe('already_guessed');
  });

  it('should detect win condition', () => {
    let state = createGameState('HI');
    state = guessLetter(state, 'H');
    state = guessLetter(state, 'I');

    expect(isWon(state)).toBe(true);
  });

  it('should detect lose condition', () => {
    let state = createGameState('HELLO');

    for (const letter of 'ZXQWRP') {
      state = guessLetter(state, letter);
    }

    expect(isLost(state)).toBe(true);
    expect(state.wrongGuesses).toBe(6);
  });

  it('should generate correct display word', () => {
    let state = createGameState('HELLO');
    state = guessLetter(state, 'L');

    expect(getDisplayWord(state)).toBe('_ _ L L _');
  });

  it('should handle repeated letters in word', () => {
    let state = createGameState('HELLO');
    state = guessLetter(state, 'L');

    // Both L's should be revealed
    const display = getDisplayWord(state);
    expect((display.match(/L/g) || []).length).toBe(2);
  });
});

// ===========================================
// Hangman - Drawing State Tests
// ===========================================
describe('Hangman - Drawing State', () => {
  const HANGMAN_PARTS = [
    'head',
    'body',
    'leftArm',
    'rightArm',
    'leftLeg',
    'rightLeg',
  ];

  const getVisibleParts = (wrongGuesses) => {
    return HANGMAN_PARTS.slice(0, wrongGuesses);
  };

  it('should show no parts initially', () => {
    expect(getVisibleParts(0)).toEqual([]);
  });

  it('should show head after first wrong guess', () => {
    expect(getVisibleParts(1)).toEqual(['head']);
  });

  it('should show head and body after two wrong guesses', () => {
    expect(getVisibleParts(2)).toEqual(['head', 'body']);
  });

  it('should show all parts after 6 wrong guesses', () => {
    expect(getVisibleParts(6)).toEqual(HANGMAN_PARTS);
  });

  it('should show partial figure correctly', () => {
    expect(getVisibleParts(4)).toEqual(['head', 'body', 'leftArm', 'rightArm']);
  });
});
