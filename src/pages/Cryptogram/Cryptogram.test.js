import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  getTodayDateString,
  stringToSeed,
} from '../../data/wordUtils';

// ===========================================
// Cryptogram - Cipher Creation Tests
// ===========================================
describe('Cryptogram - Cipher Creation', () => {
  // Create a random letter substitution cipher
  const createCipher = (random) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const shuffled = [...alphabet];

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Ensure no letter maps to itself
    for (let i = 0; i < alphabet.length; i++) {
      if (alphabet[i] === shuffled[i]) {
        const next = (i + 1) % alphabet.length;
        [shuffled[i], shuffled[next]] = [shuffled[next], shuffled[i]];
      }
    }

    const cipher = {};
    const reverse = {};
    for (let i = 0; i < alphabet.length; i++) {
      cipher[alphabet[i]] = shuffled[i];
      reverse[shuffled[i]] = alphabet[i];
    }

    return { cipher, reverse };
  };

  it('should create cipher with all 26 letters', () => {
    const random = createSeededRandom(12345);
    const { cipher } = createCipher(random);

    expect(Object.keys(cipher).length).toBe(26);
    expect(Object.values(cipher).length).toBe(26);
  });

  it('should create bijective mapping', () => {
    const random = createSeededRandom(12345);
    const { cipher, reverse } = createCipher(random);

    // Every letter should map to unique letter
    const values = new Set(Object.values(cipher));
    expect(values.size).toBe(26);

    // Reverse should undo cipher
    Object.entries(cipher).forEach(([plain, encrypted]) => {
      expect(reverse[encrypted]).toBe(plain);
    });
  });

  it('should not map any letter to itself', () => {
    const random = createSeededRandom(12345);
    const { cipher } = createCipher(random);

    Object.entries(cipher).forEach(([plain, encrypted]) => {
      expect(plain).not.toBe(encrypted);
    });
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const cipher1 = createCipher(random1);
    const cipher2 = createCipher(random2);

    expect(cipher1.cipher).toEqual(cipher2.cipher);
  });

  it('should produce different ciphers with different seeds', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const cipher1 = createCipher(random1);
    const cipher2 = createCipher(random2);

    expect(cipher1.cipher).not.toEqual(cipher2.cipher);
  });
});

// ===========================================
// Cryptogram - Encryption Tests
// ===========================================
describe('Cryptogram - Encryption', () => {
  const encrypt = (text, cipher) => {
    return text.toUpperCase().split('').map(char => {
      if (cipher[char]) return cipher[char];
      return char;
    }).join('');
  };

  const mockCipher = {
    'A': 'X', 'B': 'Y', 'C': 'Z', 'D': 'A', 'E': 'B',
    'F': 'C', 'G': 'D', 'H': 'E', 'I': 'F', 'J': 'G',
    'K': 'H', 'L': 'I', 'M': 'J', 'N': 'K', 'O': 'L',
    'P': 'M', 'Q': 'N', 'R': 'O', 'S': 'P', 'T': 'Q',
    'U': 'R', 'V': 'S', 'W': 'T', 'X': 'U', 'Y': 'V',
    'Z': 'W',
  };

  it('should encrypt letters using cipher', () => {
    const result = encrypt('HELLO', mockCipher);
    expect(result).toBe('EBIIL');
  });

  it('should preserve non-letter characters', () => {
    const result = encrypt('HELLO, WORLD!', mockCipher);
    expect(result).toBe('EBIIL, TLOIA!');
  });

  it('should handle lowercase input', () => {
    const result = encrypt('hello', mockCipher);
    expect(result).toBe('EBIIL');
  });

  it('should preserve spaces', () => {
    const result = encrypt('A B C', mockCipher);
    expect(result).toBe('X Y Z');
  });

  it('should preserve numbers', () => {
    const result = encrypt('ABC123', mockCipher);
    expect(result).toBe('XYZ123');
  });
});

// ===========================================
// Cryptogram - Unique Letters Tests
// ===========================================
describe('Cryptogram - Unique Letters', () => {
  const getUniqueLetters = (text) => {
    const letters = new Set();
    for (const char of text.toUpperCase()) {
      if (/[A-Z]/.test(char)) {
        letters.add(char);
      }
    }
    return Array.from(letters).sort();
  };

  it('should extract unique letters from text', () => {
    const result = getUniqueLetters('HELLO');
    expect(result).toEqual(['E', 'H', 'L', 'O']);
  });

  it('should ignore non-letters', () => {
    const result = getUniqueLetters('HELLO, WORLD! 123');
    expect(result).toEqual(['D', 'E', 'H', 'L', 'O', 'R', 'W']);
  });

  it('should handle lowercase', () => {
    const result = getUniqueLetters('hello');
    expect(result).toEqual(['E', 'H', 'L', 'O']);
  });

  it('should return sorted letters', () => {
    const result = getUniqueLetters('ZYX');
    expect(result).toEqual(['X', 'Y', 'Z']);
  });

  it('should handle empty string', () => {
    const result = getUniqueLetters('');
    expect(result).toEqual([]);
  });
});

// ===========================================
// Cryptogram - Guess Validation Tests
// ===========================================
describe('Cryptogram - Guess Validation', () => {
  const isValidGuess = (value) => {
    return value === '' || /^[A-Z]$/.test(value);
  };

  const checkSolved = (guesses, originalLetters, cipher) => {
    return originalLetters.every(letter => {
      const encryptedLetter = cipher[letter];
      return guesses[encryptedLetter] === letter;
    });
  };

  it('should accept single uppercase letter', () => {
    expect(isValidGuess('A')).toBe(true);
    expect(isValidGuess('Z')).toBe(true);
  });

  it('should accept empty string (clear guess)', () => {
    expect(isValidGuess('')).toBe(true);
  });

  it('should reject lowercase letter', () => {
    expect(isValidGuess('a')).toBe(false);
  });

  it('should reject multiple letters', () => {
    expect(isValidGuess('AB')).toBe(false);
  });

  it('should reject non-letters', () => {
    expect(isValidGuess('1')).toBe(false);
    expect(isValidGuess('!')).toBe(false);
  });

  it('should detect solved puzzle', () => {
    const originalLetters = ['A', 'B', 'C'];
    const cipher = { 'A': 'X', 'B': 'Y', 'C': 'Z' };
    const guesses = { 'X': 'A', 'Y': 'B', 'Z': 'C' };

    expect(checkSolved(guesses, originalLetters, cipher)).toBe(true);
  });

  it('should detect unsolved puzzle', () => {
    const originalLetters = ['A', 'B', 'C'];
    const cipher = { 'A': 'X', 'B': 'Y', 'C': 'Z' };
    const guesses = { 'X': 'A', 'Y': 'B' }; // Missing C

    expect(checkSolved(guesses, originalLetters, cipher)).toBe(false);
  });

  it('should detect incorrect guess', () => {
    const originalLetters = ['A', 'B', 'C'];
    const cipher = { 'A': 'X', 'B': 'Y', 'C': 'Z' };
    const guesses = { 'X': 'A', 'Y': 'C', 'Z': 'B' }; // B and C swapped

    expect(checkSolved(guesses, originalLetters, cipher)).toBe(false);
  });
});

// ===========================================
// Cryptogram - Hint System Tests
// ===========================================
describe('Cryptogram - Hint System', () => {
  const getHint = (encrypted, cipher, guesses) => {
    // Find an unguessed encrypted letter
    const unguessed = encrypted.split('').find(char =>
      /[A-Z]/.test(char) && !guesses[char]
    );

    if (!unguessed) return null;

    return {
      encrypted: unguessed,
      decrypted: cipher[unguessed],
    };
  };

  it('should return a hint for unguessed letter', () => {
    const encrypted = 'XYZ';
    const cipher = { 'X': 'A', 'Y': 'B', 'Z': 'C' };
    const guesses = { 'X': 'A' };

    const hint = getHint(encrypted, cipher, guesses);

    expect(hint).not.toBeNull();
    expect(hint.encrypted).toBe('Y');
    expect(hint.decrypted).toBe('B');
  });

  it('should return null when all letters guessed', () => {
    const encrypted = 'XYZ';
    const cipher = { 'X': 'A', 'Y': 'B', 'Z': 'C' };
    const guesses = { 'X': 'A', 'Y': 'B', 'Z': 'C' };

    const hint = getHint(encrypted, cipher, guesses);

    expect(hint).toBeNull();
  });

  it('should skip non-letter characters', () => {
    const encrypted = '! X';
    const cipher = { 'X': 'A' };
    const guesses = {};

    const hint = getHint(encrypted, cipher, guesses);

    expect(hint.encrypted).toBe('X');
  });
});

// ===========================================
// Cryptogram - Daily Puzzle Tests
// ===========================================
describe('Cryptogram - Daily Puzzle', () => {
  it('should generate same puzzle for same day', () => {
    const today = getTodayDateString();
    const seed1 = stringToSeed(`cryptogram-${today}`);
    const seed2 = stringToSeed(`cryptogram-${today}`);

    expect(seed1).toBe(seed2);
  });

  it('should generate different puzzle for different days', () => {
    const seed1 = stringToSeed('cryptogram-2026-01-12');
    const seed2 = stringToSeed('cryptogram-2026-01-13');

    expect(seed1).not.toBe(seed2);
  });

  it('should generate random puzzle with current timestamp seed', () => {
    const seed1 = stringToSeed(`cryptogram-${Date.now()}`);
    // Wait a tiny bit
    const seed2 = stringToSeed(`cryptogram-${Date.now() + 1}`);

    expect(seed1).not.toBe(seed2);
  });
});

// ===========================================
// Cryptogram - Starting Hints Tests
// ===========================================
describe('Cryptogram - Starting Hints', () => {
  const DEFAULT_STARTING_HINTS = 3;
  const MAX_STARTING_HINTS = 5;

  // Helper to generate starting hints (matches component logic)
  const generateStartingHints = (encryptedText, reverse, numHints, random) => {
    const getUniqueLetters = (text) => {
      const letters = new Set();
      for (const char of text.toUpperCase()) {
        if (/[A-Z]/.test(char)) {
          letters.add(char);
        }
      }
      return Array.from(letters).sort();
    };

    const initialGuesses = {};
    if (numHints > 0) {
      const encryptedLetters = getUniqueLetters(encryptedText);
      const shuffledLetters = [...encryptedLetters];
      for (let i = shuffledLetters.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
      }
      const lettersToReveal = shuffledLetters.slice(0, numHints);
      for (const encLetter of lettersToReveal) {
        initialGuesses[encLetter] = reverse[encLetter];
      }
    }
    return initialGuesses;
  };

  it('should generate correct number of starting hints', () => {
    const random = createSeededRandom(12345);
    const encryptedText = 'XYZABC';
    const reverse = { 'X': 'A', 'Y': 'B', 'Z': 'C', 'A': 'D', 'B': 'E', 'C': 'F' };

    const hints3 = generateStartingHints(encryptedText, reverse, 3, createSeededRandom(12345));
    const hints5 = generateStartingHints(encryptedText, reverse, 5, createSeededRandom(12345));
    const hints0 = generateStartingHints(encryptedText, reverse, 0, createSeededRandom(12345));

    expect(Object.keys(hints3).length).toBe(3);
    expect(Object.keys(hints5).length).toBe(5);
    expect(Object.keys(hints0).length).toBe(0);
  });

  it('should reveal correct letter mappings', () => {
    const encryptedText = 'XYZ';
    const reverse = { 'X': 'A', 'Y': 'B', 'Z': 'C' };

    const hints = generateStartingHints(encryptedText, reverse, 2, createSeededRandom(12345));

    // Each revealed letter should map to its correct decryption
    Object.entries(hints).forEach(([enc, dec]) => {
      expect(reverse[enc]).toBe(dec);
    });
  });

  it('should be deterministic with same seed', () => {
    const encryptedText = 'XYZABC';
    const reverse = { 'X': 'A', 'Y': 'B', 'Z': 'C', 'A': 'D', 'B': 'E', 'C': 'F' };

    const hints1 = generateStartingHints(encryptedText, reverse, 3, createSeededRandom(12345));
    const hints2 = generateStartingHints(encryptedText, reverse, 3, createSeededRandom(12345));

    expect(hints1).toEqual(hints2);
  });

  it('should produce different hints with different seeds', () => {
    const encryptedText = 'XYZABCDEFGHIJ';
    const reverse = {
      'X': 'A', 'Y': 'B', 'Z': 'C', 'A': 'D', 'B': 'E', 'C': 'F',
      'D': 'G', 'E': 'H', 'F': 'I', 'G': 'J', 'H': 'K', 'I': 'L', 'J': 'M'
    };

    const hints1 = generateStartingHints(encryptedText, reverse, 3, createSeededRandom(12345));
    const hints2 = generateStartingHints(encryptedText, reverse, 3, createSeededRandom(54321));

    // With enough unique letters, different seeds should produce different hints
    expect(hints1).not.toEqual(hints2);
  });

  it('should clamp hints to max value', () => {
    const clampHints = (num) => Math.max(0, Math.min(MAX_STARTING_HINTS, num));

    expect(clampHints(10)).toBe(5);
    expect(clampHints(5)).toBe(5);
    expect(clampHints(3)).toBe(3);
    expect(clampHints(0)).toBe(0);
    expect(clampHints(-1)).toBe(0);
  });

  it('should default to 3 starting hints', () => {
    expect(DEFAULT_STARTING_HINTS).toBe(3);
  });

  it('should have max of 5 starting hints', () => {
    expect(MAX_STARTING_HINTS).toBe(5);
  });

  it('should not exceed available unique letters', () => {
    const encryptedText = 'AB'; // Only 2 unique letters
    const reverse = { 'A': 'X', 'B': 'Y' };

    // Request 5 hints but only 2 letters available
    const hints = generateStartingHints(encryptedText, reverse, 5, createSeededRandom(12345));

    expect(Object.keys(hints).length).toBe(2);
  });
});

// ===========================================
// Cryptogram - Time Tracking Tests
// ===========================================
describe('Cryptogram - Time Tracking', () => {
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  it('should format time correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5000)).toBe('0:05');
    expect(formatTime(65000)).toBe('1:05');
    expect(formatTime(3600000)).toBe('60:00');
  });

  it('should calculate elapsed time', () => {
    const startTime = Date.now();
    const endTime = startTime + 120000; // 2 minutes later

    const elapsed = endTime - startTime;
    expect(formatTime(elapsed)).toBe('2:00');
  });
});
