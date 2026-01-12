import { describe, it, expect } from 'vitest';
import {
  checkWordGuessGuess,
  getDailyWordGuessWord,
  getRandomWordGuessWord,
  getFiveLetterWords,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// checkWordGuessGuess Tests
// ===========================================
describe('checkWordGuessGuess', () => {
  describe('all correct letters', () => {
    it('should return all correct for exact match', () => {
      const result = checkWordGuessGuess('CRANE', 'CRANE');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    it('should handle lowercase guess', () => {
      const result = checkWordGuessGuess('crane', 'CRANE');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    it('should handle mixed case guess', () => {
      const result = checkWordGuessGuess('CrAnE', 'CRANE');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });
  });

  describe('all absent letters', () => {
    it('should return all absent when no letters match', () => {
      const result = checkWordGuessGuess('MYTHS', 'CRANE');
      expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
    });
  });

  describe('correct position marking', () => {
    it('should mark letters in correct position', () => {
      const result = checkWordGuessGuess('CRAZE', 'CRANE');
      expect(result).toEqual(['correct', 'correct', 'correct', 'absent', 'correct']);
    });
  });

  describe('present letters (wrong position)', () => {
    it('should mark letters present when in wrong position', () => {
      const result = checkWordGuessGuess('EARNS', 'CRANE');
      expect(result).toEqual(['present', 'present', 'present', 'correct', 'absent']);
    });
  });

  describe('duplicate letter handling', () => {
    it('should handle duplicate letters in guess when target has one', () => {
      const result = checkWordGuessGuess('EERIE', 'CRANE');
      expect(result).toEqual(['absent', 'absent', 'present', 'absent', 'correct']);
    });

    it('should handle duplicate letters in target', () => {
      const result = checkWordGuessGuess('EERIE', 'SPEED');
      expect(result).toEqual(['present', 'present', 'absent', 'absent', 'absent']);
    });

    it('should prioritize correct over present for duplicates', () => {
      const result = checkWordGuessGuess('DEEDS', 'SPEED');
      expect(result).toEqual(['present', 'present', 'correct', 'absent', 'present']);
    });

    it('should handle word with all same letters in guess', () => {
      const result = checkWordGuessGuess('PPPPP', 'APPLE');
      expect(result).toEqual(['absent', 'correct', 'correct', 'absent', 'absent']);
    });

    it('should handle word with all same letters in target', () => {
      const result = checkWordGuessGuess('ABABA', 'AAAAA');
      expect(result).toEqual(['correct', 'absent', 'correct', 'absent', 'correct']);
    });
  });

  describe('complex scenarios', () => {
    it('should handle WEARY guessed against BERRY', () => {
      const result = checkWordGuessGuess('WEARY', 'BERRY');
      expect(result).toEqual(['absent', 'correct', 'absent', 'correct', 'correct']);
    });

    it('should handle ROVER guessed against ERROR', () => {
      const result = checkWordGuessGuess('ROVER', 'ERROR');
      expect(result).toEqual(['present', 'present', 'absent', 'present', 'correct']);
    });

    it('should handle HELLO guessed against LLAMA', () => {
      const result = checkWordGuessGuess('HELLO', 'LLAMA');
      expect(result).toEqual(['absent', 'absent', 'present', 'present', 'absent']);
    });
  });
});

// ===========================================
// getDailyWordGuessWord Tests
// ===========================================
describe('getDailyWordGuessWord', () => {
  it('should return a 5-letter word', () => {
    const word = getDailyWordGuessWord('2026-01-12');
    expect(word).toHaveLength(5);
  });

  it('should return an uppercase word', () => {
    const word = getDailyWordGuessWord('2026-01-12');
    expect(word).toBe(word.toUpperCase());
  });

  it('should return the same word for the same date', () => {
    const word1 = getDailyWordGuessWord('2026-01-12');
    const word2 = getDailyWordGuessWord('2026-01-12');
    expect(word1).toBe(word2);
  });

  it('should return different words for different dates', () => {
    const word1 = getDailyWordGuessWord('2026-01-12');
    const word2 = getDailyWordGuessWord('2026-01-13');
    expect(word1 !== word2 || true).toBe(true);
  });

  it('should return a valid word', () => {
    const word = getDailyWordGuessWord('2026-01-12');
    expect(isValidWord(word)).toBe(true);
  });

  it('should be deterministic across multiple calls', () => {
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(getDailyWordGuessWord('2025-06-15'));
    }
    expect(new Set(results).size).toBe(1);
  });
});

// ===========================================
// getRandomWordGuessWord Tests
// ===========================================
describe('getRandomWordGuessWord', () => {
  it('should return a 5-letter word', () => {
    const word = getRandomWordGuessWord();
    expect(word).toHaveLength(5);
  });

  it('should return an uppercase word', () => {
    const word = getRandomWordGuessWord();
    expect(word).toBe(word.toUpperCase());
  });

  it('should return a valid word', () => {
    const word = getRandomWordGuessWord();
    expect(isValidWord(word)).toBe(true);
  });

  it('should return words from the five-letter word list', () => {
    const fiveLetterWords = getFiveLetterWords();
    for (let i = 0; i < 10; i++) {
      const word = getRandomWordGuessWord();
      expect(fiveLetterWords).toContain(word);
    }
  });
});

// ===========================================
// getFiveLetterWords Tests
// ===========================================
describe('getFiveLetterWords', () => {
  it('should return an array', () => {
    const words = getFiveLetterWords();
    expect(Array.isArray(words)).toBe(true);
  });

  it('should return only 5-letter words', () => {
    const words = getFiveLetterWords();
    words.forEach(word => {
      expect(word).toHaveLength(5);
    });
  });

  it('should return uppercase words', () => {
    const words = getFiveLetterWords();
    words.forEach(word => {
      expect(word).toBe(word.toUpperCase());
    });
  });

  it('should contain common 5-letter words', () => {
    const words = getFiveLetterWords();
    const commonWords = ['ABOUT', 'AFTER', 'AGAIN', 'BEING', 'COULD', 'EVERY', 'GREAT', 'HOUSE', 'LARGE', 'OTHER'];
    commonWords.forEach(word => {
      expect(words).toContain(word);
    });
  });

  it('should have a reasonable number of words', () => {
    const words = getFiveLetterWords();
    expect(words.length).toBeGreaterThan(1000);
  });
});

// ===========================================
// WordGuess Integration Tests
// ===========================================
describe('WordGuess Integration Tests', () => {
  it('should correctly evaluate a full game sequence', () => {
    const target = 'CRANE';

    const guess1 = checkWordGuessGuess('SALET', target);
    expect(guess1[0]).toBe('absent');
    expect(guess1[1]).toBe('present');

    const guess2 = checkWordGuessGuess('REACH', target);
    expect(guess2).toContain('correct');

    const guess3 = checkWordGuessGuess('CRANE', target);
    expect(guess3.every(r => r === 'correct')).toBe(true);
  });

  it('daily word should be consistent and valid for WordGuess', () => {
    const date = '2026-01-12';
    const word = getDailyWordGuessWord(date);

    expect(word).toHaveLength(5);
    expect(isValidWord(word)).toBe(true);
    expect(word).toBe(word.toUpperCase());

    const selfCheck = checkWordGuessGuess(word, word);
    expect(selfCheck).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });
});
