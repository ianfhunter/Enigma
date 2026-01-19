import { describe, it, expect } from 'vitest';

// ===========================================
// FlipQuotes - Letter Generation Tests
// ===========================================
describe('FlipQuotes - Letter Generation', () => {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function getRandomLetter(random) {
    return ALPHABET[Math.floor(random() * 26)];
  }

  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  it('should generate letters in A-Z range', () => {
    const random = createSeededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const letter = getRandomLetter(random);
      expect(ALPHABET.includes(letter)).toBe(true);
    }
  });

  it('should be deterministic with same seed', () => {
    const letters1 = [];
    const letters2 = [];
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    for (let i = 0; i < 10; i++) {
      letters1.push(getRandomLetter(random1));
      letters2.push(getRandomLetter(random2));
    }

    expect(letters1).toEqual(letters2);
  });
});

// ===========================================
// FlipQuotes - Initial State Generation Tests
// ===========================================
describe('FlipQuotes - Initial State Generation', () => {
  function generateWrongLetters(text, random) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return text.split('').map(char => {
      if (/[A-Z]/.test(char)) {
        let randomLetter = ALPHABET[Math.floor(random() * 26)];
        while (randomLetter === char) {
          randomLetter = ALPHABET[Math.floor(random() * 26)];
        }
        return randomLetter;
      }
      return char;
    });
  }

  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  it('should generate different letter for each position', () => {
    const text = 'HELLO';
    const random = createSeededRandom(12345);
    const wrongLetters = generateWrongLetters(text, random);

    for (let i = 0; i < text.length; i++) {
      expect(wrongLetters[i]).not.toBe(text[i]);
    }
  });

  it('should preserve non-letter characters', () => {
    const text = 'HELLO, WORLD!';
    const random = createSeededRandom(12345);
    const wrongLetters = generateWrongLetters(text, random);

    expect(wrongLetters[5]).toBe(',');
    expect(wrongLetters[6]).toBe(' ');
    expect(wrongLetters[12]).toBe('!');
  });
});

// ===========================================
// FlipQuotes - Win Condition Tests
// ===========================================
describe('FlipQuotes - Win Condition', () => {
  function checkWin(currentLetters, targetText) {
    return currentLetters.every((letter, idx) => letter === targetText[idx]);
  }

  it('should detect win when all letters match', () => {
    const target = 'HELLO';
    const current = ['H', 'E', 'L', 'L', 'O'];
    expect(checkWin(current, target)).toBe(true);
  });

  it('should detect non-win when letters differ', () => {
    const target = 'HELLO';
    const current = ['H', 'A', 'L', 'L', 'O'];
    expect(checkWin(current, target)).toBe(false);
  });

  it('should handle punctuation', () => {
    const target = 'HELLO!';
    const current = ['H', 'E', 'L', 'L', 'O', '!'];
    expect(checkWin(current, target)).toBe(true);
  });
});

// ===========================================
// FlipQuotes - Letter Toggle Tests
// ===========================================
describe('FlipQuotes - Letter Toggle', () => {
  function toggleLetter(currentLetter, wrongLetter, correctLetter) {
    return currentLetter === wrongLetter ? correctLetter : wrongLetter;
  }

  it('should toggle from wrong to correct', () => {
    const result = toggleLetter('X', 'X', 'H');
    expect(result).toBe('H');
  });

  it('should toggle from correct to wrong', () => {
    const result = toggleLetter('H', 'X', 'H');
    expect(result).toBe('X');
  });

  it('should be reversible', () => {
    let current = 'X';
    const wrong = 'X';
    const correct = 'H';

    current = toggleLetter(current, wrong, correct);
    expect(current).toBe('H');

    current = toggleLetter(current, wrong, correct);
    expect(current).toBe('X');
  });
});

// ===========================================
// FlipQuotes - Time Formatting Tests
// ===========================================
describe('FlipQuotes - Time Formatting', () => {
  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  it('should format seconds correctly', () => {
    expect(formatTime(5000)).toBe('0:05');
    expect(formatTime(45000)).toBe('0:45');
  });

  it('should format minutes correctly', () => {
    expect(formatTime(60000)).toBe('1:00');
    expect(formatTime(125000)).toBe('2:05');
  });

  it('should handle zero', () => {
    expect(formatTime(0)).toBe('0:00');
  });
});

// ===========================================
// FlipQuotes - Hint System Tests
// ===========================================
describe('FlipQuotes - Hint System', () => {
  function findWrongPositions(currentLetters, targetText) {
    return currentLetters
      .map((letter, idx) => ({ letter, idx, target: targetText[idx] }))
      .filter(({ letter, target }) => /[A-Z]/.test(target) && letter !== target);
  }

  it('should find wrong positions', () => {
    const current = ['H', 'X', 'L', 'Y', 'O'];
    const target = 'HELLO';

    const wrong = findWrongPositions(current, target);

    expect(wrong.length).toBe(2);
    expect(wrong.some(w => w.idx === 1)).toBe(true);
    expect(wrong.some(w => w.idx === 3)).toBe(true);
  });

  it('should return empty when all correct', () => {
    const current = ['H', 'E', 'L', 'L', 'O'];
    const target = 'HELLO';

    const wrong = findWrongPositions(current, target);

    expect(wrong.length).toBe(0);
  });

  it('should skip non-letter characters', () => {
    const current = ['H', 'I', '!'];
    const target = 'HI!';

    const wrong = findWrongPositions(current, target);

    expect(wrong.length).toBe(0);
  });
});

// ===========================================
// FlipQuotes - Word Completion Tests
// ===========================================
describe('FlipQuotes - Word Completion', () => {
  function isWordComplete(wordChars, currentLetters, targetText) {
    return wordChars.every(({ char, idx }) => {
      if (!/[A-Z]/.test(char)) return true;
      return currentLetters[idx] === char;
    });
  }

  it('should detect complete word', () => {
    const wordChars = [
      { char: 'H', idx: 0 },
      { char: 'I', idx: 1 },
    ];
    const current = ['H', 'I', '!'];
    const target = 'HI!';

    expect(isWordComplete(wordChars, current, target)).toBe(true);
  });

  it('should detect incomplete word', () => {
    const wordChars = [
      { char: 'H', idx: 0 },
      { char: 'I', idx: 1 },
    ];
    const current = ['H', 'X', '!'];
    const target = 'HI!';

    expect(isWordComplete(wordChars, current, target)).toBe(false);
  });
});
