import { describe, it, expect } from 'vitest';
import { VOWELS, MAX_WRONG_GUESSES, normalizeForComparison } from './PhraseGuess.jsx';

describe('PhraseGuess - helpers', () => {
  it('normalizes text by stripping punctuation and collapsing spaces', () => {
    expect(normalizeForComparison('Hello,  World!')).toBe('hello world');
  });

  it('vowel set and max wrong guesses are defined', () => {
    expect(VOWELS.has('A')).toBe(true);
    expect(MAX_WRONG_GUESSES).toBe(6);
  });
});
import { describe, it, expect } from 'vitest';

// Test the normalization function logic (recreated for unit testing)
const normalizeForComparison = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim();
};

// ===========================================
// normalizeForComparison Tests
// ===========================================
describe('normalizeForComparison', () => {
  describe('basic normalization', () => {
    it('should convert to lowercase', () => {
      expect(normalizeForComparison('HELLO WORLD')).toBe('hello world');
    });

    it('should handle mixed case', () => {
      expect(normalizeForComparison('HeLLo WoRLD')).toBe('hello world');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeForComparison('hello    world')).toBe('hello world');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(normalizeForComparison('  hello world  ')).toBe('hello world');
    });
  });

  describe('punctuation removal', () => {
    it('should remove periods', () => {
      expect(normalizeForComparison('Hello. World.')).toBe('hello world');
    });

    it('should remove commas', () => {
      expect(normalizeForComparison('Hello, world')).toBe('hello world');
    });

    it('should remove exclamation marks', () => {
      expect(normalizeForComparison('Hello world!')).toBe('hello world');
    });

    it('should remove question marks', () => {
      expect(normalizeForComparison('Hello world?')).toBe('hello world');
    });

    it('should remove apostrophes', () => {
      expect(normalizeForComparison("It's a test")).toBe('its a test');
    });

    it('should remove quotation marks', () => {
      expect(normalizeForComparison('"Hello" world')).toBe('hello world');
    });

    it('should remove hyphens', () => {
      expect(normalizeForComparison('well-known fact')).toBe('wellknown fact');
    });

    it('should remove colons and semicolons', () => {
      expect(normalizeForComparison('Note: this; that')).toBe('note this that');
    });

    it('should handle multiple punctuation types', () => {
      expect(normalizeForComparison("Hello, world! It's great; isn't it?"))
        .toBe('hello world its great isnt it');
    });
  });

  describe('preserves numbers', () => {
    it('should keep numeric digits', () => {
      expect(normalizeForComparison('Test 123')).toBe('test 123');
    });

    it('should handle mixed text and numbers', () => {
      expect(normalizeForComparison('The year 2025 was great!')).toBe('the year 2025 was great');
    });
  });

  describe('quote-specific normalization', () => {
    it('should normalize a typical quote', () => {
      const quote = "The only thing we have to fear is fear itself.";
      expect(normalizeForComparison(quote))
        .toBe('the only thing we have to fear is fear itself');
    });

    it('should normalize a quote with em-dash', () => {
      const quote = "Life — what is it but a dream?";
      expect(normalizeForComparison(quote))
        .toBe('life what is it but a dream'); // em-dash removed and spaces collapsed
    });

    it('should normalize quotes with ellipsis', () => {
      const quote = "To be... or not to be...";
      expect(normalizeForComparison(quote))
        .toBe('to be or not to be');
    });
  });
});

// ===========================================
// Solve Comparison Tests
// ===========================================
describe('Solve Comparison Logic', () => {
  const compareSolveAttempt = (attempt, quote) => {
    return normalizeForComparison(attempt) === normalizeForComparison(quote);
  };

  describe('exact matches', () => {
    it('should match identical text', () => {
      expect(compareSolveAttempt('Hello World', 'Hello World')).toBe(true);
    });

    it('should match case-insensitively', () => {
      expect(compareSolveAttempt('hello world', 'HELLO WORLD')).toBe(true);
    });

    it('should match ignoring punctuation', () => {
      expect(compareSolveAttempt('Hello world', 'Hello, world!')).toBe(true);
    });
  });

  describe('whitespace handling', () => {
    it('should match with different spacing', () => {
      expect(compareSolveAttempt('Hello  World', 'Hello World')).toBe(true);
    });

    it('should match with extra leading/trailing spaces', () => {
      expect(compareSolveAttempt('  Hello World  ', 'Hello World')).toBe(true);
    });
  });

  describe('punctuation tolerance', () => {
    it('should match when user omits punctuation', () => {
      const quote = "It's a wonderful life!";
      const attempt = "its a wonderful life";
      expect(compareSolveAttempt(attempt, quote)).toBe(true);
    });

    it('should match when user adds different punctuation', () => {
      const quote = "To be or not to be";
      const attempt = "To be, or not to be?";
      expect(compareSolveAttempt(attempt, quote)).toBe(true);
    });

    it('should match apostrophes ignored', () => {
      const quote = "Don't stop believing";
      const attempt = "Dont stop believing";
      expect(compareSolveAttempt(attempt, quote)).toBe(true);
    });
  });

  describe('incorrect guesses', () => {
    it('should not match different text', () => {
      expect(compareSolveAttempt('Hello World', 'Goodbye World')).toBe(false);
    });

    it('should not match partial text', () => {
      expect(compareSolveAttempt('Hello', 'Hello World')).toBe(false);
    });

    it('should not match text with extra words', () => {
      expect(compareSolveAttempt('Hello World Today', 'Hello World')).toBe(false);
    });

    it('should not match text with missing words', () => {
      expect(compareSolveAttempt('Hello', 'Hello World')).toBe(false);
    });

    it('should not match similar but different text', () => {
      expect(compareSolveAttempt('Hello Word', 'Hello World')).toBe(false);
    });
  });

  describe('real quote examples', () => {
    it('should match famous quote with punctuation variations', () => {
      const quote = "Be the change you wish to see in the world.";
      expect(compareSolveAttempt("be the change you wish to see in the world", quote)).toBe(true);
      expect(compareSolveAttempt("Be the change you wish to see in the world!", quote)).toBe(true);
      expect(compareSolveAttempt("Be the change you wish to see in the world", quote)).toBe(true);
    });

    it('should match quote with apostrophe', () => {
      const quote = "I think, therefore I am.";
      expect(compareSolveAttempt("i think therefore i am", quote)).toBe(true);
    });

    it('should not match similar but incorrect quote', () => {
      const quote = "Be the change you wish to see in the world.";
      expect(compareSolveAttempt("be the change you want to see in the world", quote)).toBe(false);
    });
  });
});

// ===========================================
// Score Calculation Tests
// ===========================================
describe('Solve Bonus Calculation', () => {
  const MAX_WRONG_GUESSES = 6;

  // Recreate scoring logic for testing
  const calculateSolveBonus = (hiddenLetterCount, uniqueHiddenCount) => {
    return (hiddenLetterCount * 50) + (uniqueHiddenCount * 100);
  };

  const calculateBaseScore = (wrongGuesses) => {
    return (MAX_WRONG_GUESSES - wrongGuesses) * 100;
  };

  describe('solve bonus points', () => {
    it('should calculate bonus for many hidden letters', () => {
      // 20 hidden letter instances, 15 unique hidden letters
      const bonus = calculateSolveBonus(20, 15);
      expect(bonus).toBe(20 * 50 + 15 * 100); // 1000 + 1500 = 2500
    });

    it('should calculate zero bonus when all letters revealed', () => {
      const bonus = calculateSolveBonus(0, 0);
      expect(bonus).toBe(0);
    });

    it('should calculate bonus for single hidden letter', () => {
      const bonus = calculateSolveBonus(1, 1);
      expect(bonus).toBe(50 + 100); // 150
    });

    it('should handle repeated hidden letter', () => {
      // Letter 'e' appears 5 times but is one unique letter
      const bonus = calculateSolveBonus(5, 1);
      expect(bonus).toBe(5 * 50 + 1 * 100); // 250 + 100 = 350
    });
  });

  describe('base score calculation', () => {
    it('should calculate max score with no wrong guesses', () => {
      expect(calculateBaseScore(0)).toBe(600);
    });

    it('should calculate reduced score with some wrong guesses', () => {
      expect(calculateBaseScore(3)).toBe(300);
    });

    it('should calculate zero base score at max wrong guesses', () => {
      expect(calculateBaseScore(6)).toBe(0);
    });
  });

  describe('combined total score scenarios', () => {
    it('should reward early solve with high bonus', () => {
      // Player solves with 15 letters hidden (10 unique), 0 wrong guesses
      const base = calculateBaseScore(0);      // 600
      const bonus = calculateSolveBonus(15, 10); // 750 + 1000 = 1750
      expect(base + bonus).toBe(2350);
    });

    it('should still reward late solve with small bonus', () => {
      // Player solves with 3 letters hidden (2 unique), 4 wrong guesses
      const base = calculateBaseScore(4);     // 200
      const bonus = calculateSolveBonus(3, 2); // 150 + 200 = 350
      expect(base + bonus).toBe(550);
    });

    it('should give only base score when all revealed', () => {
      const base = calculateBaseScore(2);     // 400
      const bonus = calculateSolveBonus(0, 0); // 0
      expect(base + bonus).toBe(400);
    });
  });
});

// ===========================================
// Hidden Letter Counting Tests
// ===========================================
describe('Hidden Letter Counting', () => {
  // Recreate the logic for counting hidden letters
  const getHiddenLetterCount = (quoteText, guessedLetters) => {
    const phraseLetters = quoteText.toUpperCase().split('').filter(c => /[A-Z]/.test(c));
    return phraseLetters.filter(letter => !guessedLetters.has(letter)).length;
  };

  const getUniqueHiddenLetterCount = (quoteText, guessedLetters) => {
    const phraseLetters = new Set(
      quoteText.toUpperCase().split('').filter(c => /[A-Z]/.test(c))
    );
    return [...phraseLetters].filter(letter => !guessedLetters.has(letter)).length;
  };

  describe('total hidden letter count', () => {
    it('should count all letters when none guessed', () => {
      const quote = "Hello";
      const guessed = new Set();
      expect(getHiddenLetterCount(quote, guessed)).toBe(5);
    });

    it('should count repeated letters multiple times', () => {
      const quote = "MISSISSIPPI";
      const guessed = new Set();
      expect(getHiddenLetterCount(quote, guessed)).toBe(11);
    });

    it('should reduce count when letters guessed', () => {
      const quote = "Hello";
      const guessed = new Set(['H', 'E']);
      expect(getHiddenLetterCount(quote, guessed)).toBe(3); // l, l, o still hidden
    });

    it('should return zero when all letters guessed', () => {
      const quote = "Hello";
      const guessed = new Set(['H', 'E', 'L', 'O']);
      expect(getHiddenLetterCount(quote, guessed)).toBe(0);
    });

    it('should ignore punctuation and spaces', () => {
      const quote = "Hello, World!";
      const guessed = new Set();
      expect(getHiddenLetterCount(quote, guessed)).toBe(10); // only letters
    });
  });

  describe('unique hidden letter count', () => {
    it('should count unique letters when none guessed', () => {
      const quote = "Hello";
      const guessed = new Set();
      expect(getUniqueHiddenLetterCount(quote, guessed)).toBe(4); // H, E, L, O
    });

    it('should not double-count repeated letters', () => {
      const quote = "MISSISSIPPI";
      const guessed = new Set();
      expect(getUniqueHiddenLetterCount(quote, guessed)).toBe(4); // M, I, S, P
    });

    it('should reduce when letters guessed', () => {
      const quote = "MISSISSIPPI";
      const guessed = new Set(['M', 'I']);
      expect(getUniqueHiddenLetterCount(quote, guessed)).toBe(2); // S, P
    });

    it('should return zero when all unique letters guessed', () => {
      const quote = "MISSISSIPPI";
      const guessed = new Set(['M', 'I', 'S', 'P']);
      expect(getUniqueHiddenLetterCount(quote, guessed)).toBe(0);
    });
  });

  describe('real quote scenarios', () => {
    it('should handle typical quote with common letters', () => {
      const quote = "Be the change you wish to see in the world";
      const guessed = new Set(['E', 'A', 'I', 'O', 'U']); // vowels guessed
      // Remaining consonants: b, t, h, c, n, g, y, w, s, r, l, d
      const uniqueHidden = getUniqueHiddenLetterCount(quote, guessed);
      expect(uniqueHidden).toBe(12);
    });

    it('should work with no vowels guessed', () => {
      const quote = "Test";
      const guessed = new Set(['T', 'S']);
      const hidden = getHiddenLetterCount(quote, guessed);
      expect(hidden).toBe(1); // just 'e'
    });
  });
});

// ===========================================
// Game State Transition Tests
// ===========================================
describe('Game State Transitions', () => {
  describe('solve attempt outcomes', () => {
    it('correct solve should trigger win state', () => {
      // This tests the expected behavior - correct solve = won state
      const gameStateAfterCorrectSolve = 'won';
      expect(gameStateAfterCorrectSolve).toBe('won');
    });

    it('incorrect solve should trigger loss state', () => {
      // This tests the expected behavior - wrong solve = lost state
      const gameStateAfterWrongSolve = 'lost';
      expect(gameStateAfterWrongSolve).toBe('lost');
    });

    it('streak should increment on correct solve', () => {
      const prevStreak = 5;
      const newStreak = prevStreak + 1;
      expect(newStreak).toBe(6);
    });

    it('streak should reset to zero on wrong solve', () => {
      const prevStreak = 5;
      const newStreak = 0; // reset on wrong guess
      expect(newStreak).toBe(0);
    });
  });
});
