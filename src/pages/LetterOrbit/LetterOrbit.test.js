import { describe, it, expect } from 'vitest';

// ===========================================
// LetterOrbit - Orbit Order Matching Tests
// ===========================================
describe('LetterOrbit - Orbit Order Matching', () => {
  const NUM_ORBITS = 4;

  function matchesOrbitOrder(word, orbits) {
    if (word.length !== NUM_ORBITS) return false;

    // Try inner to outer (0 → 1 → 2 → 3)
    let matchesInnerOuter = true;
    for (let i = 0; i < NUM_ORBITS; i++) {
      if (!orbits[i].includes(word[i])) {
        matchesInnerOuter = false;
        break;
      }
    }

    // Try outer to inner (3 → 2 → 1 → 0)
    let matchesOuterInner = true;
    for (let i = 0; i < NUM_ORBITS; i++) {
      const orbitIdx = NUM_ORBITS - 1 - i;
      if (!orbits[orbitIdx].includes(word[i])) {
        matchesOuterInner = false;
        break;
      }
    }

    return matchesInnerOuter || matchesOuterInner;
  }

  it('should match inner to outer order', () => {
    const orbits = [
      ['A', 'B', 'C'],  // Orbit 0 (inner)
      ['D', 'E', 'F'],  // Orbit 1
      ['G', 'H', 'I'],  // Orbit 2
      ['J', 'K', 'L'],  // Orbit 3 (outer)
    ];

    expect(matchesOrbitOrder('ADGJ', orbits)).toBe(true);
    expect(matchesOrbitOrder('BEHL', orbits)).toBe(true);
  });

  it('should match outer to inner order', () => {
    const orbits = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
      ['J', 'K', 'L'],
    ];

    expect(matchesOrbitOrder('JGDA', orbits)).toBe(true);
    expect(matchesOrbitOrder('KHEB', orbits)).toBe(true);
  });

  it('should reject words that skip orbits', () => {
    const orbits = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
      ['J', 'K', 'L'],
    ];

    expect(matchesOrbitOrder('AAGJ', orbits)).toBe(false); // Uses orbit 0 twice
  });

  it('should reject wrong length words', () => {
    const orbits = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
      ['J', 'K', 'L'],
    ];

    expect(matchesOrbitOrder('ADG', orbits)).toBe(false);
    expect(matchesOrbitOrder('ADGJL', orbits)).toBe(false);
  });
});

// ===========================================
// LetterOrbit - Scoring Tests
// ===========================================
describe('LetterOrbit - Scoring', () => {
  function calculateScore(foundWords) {
    return foundWords.length * 10;
  }

  it('should calculate score correctly', () => {
    expect(calculateScore([])).toBe(0);
    expect(calculateScore(['WORD'])).toBe(10);
    expect(calculateScore(['WORD', 'TEST', 'GAME'])).toBe(30);
  });
});

// ===========================================
// LetterOrbit - Found Word Tracking Tests
// ===========================================
describe('LetterOrbit - Found Word Tracking', () => {
  function addFoundWord(foundWords, word) {
    if (foundWords.includes(word)) {
      return { success: false, words: foundWords };
    }
    return {
      success: true,
      words: [...foundWords, word].sort((a, b) => a.localeCompare(b))
    };
  }

  it('should add new word', () => {
    const result = addFoundWord(['ABLE'], 'CARE');
    expect(result.success).toBe(true);
    expect(result.words).toContain('CARE');
  });

  it('should reject duplicate word', () => {
    const result = addFoundWord(['ABLE', 'CARE'], 'CARE');
    expect(result.success).toBe(false);
  });

  it('should maintain sorted order', () => {
    const result = addFoundWord(['CARE', 'ZONE'], 'ABLE');
    expect(result.words).toEqual(['ABLE', 'CARE', 'ZONE']);
  });
});

// ===========================================
// LetterOrbit - Puzzle Validation Tests
// ===========================================
describe('LetterOrbit - Puzzle Validation', () => {
  function validatePuzzle(puzzle) {
    if (!puzzle.orbits || puzzle.orbits.length !== 4) return false;
    for (const orbit of puzzle.orbits) {
      if (orbit.length !== 3) return false;
    }
    if (!puzzle.allLetters || puzzle.allLetters.length !== 12) return false;
    if (!puzzle.allWords || puzzle.allWords.length === 0) return false;
    return true;
  }

  it('should validate correct puzzle structure', () => {
    const puzzle = {
      orbits: [
        ['A', 'B', 'C'],
        ['D', 'E', 'F'],
        ['G', 'H', 'I'],
        ['J', 'K', 'L'],
      ],
      allLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
      allWords: ['WORD'],
    };

    expect(validatePuzzle(puzzle)).toBe(true);
  });

  it('should reject puzzle with wrong orbit count', () => {
    const puzzle = {
      orbits: [
        ['A', 'B', 'C'],
        ['D', 'E', 'F'],
        ['G', 'H', 'I'],
      ],
      allLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      allWords: ['WORD'],
    };

    expect(validatePuzzle(puzzle)).toBe(false);
  });

  it('should reject puzzle with no words', () => {
    const puzzle = {
      orbits: [
        ['A', 'B', 'C'],
        ['D', 'E', 'F'],
        ['G', 'H', 'I'],
        ['J', 'K', 'L'],
      ],
      allLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
      allWords: [],
    };

    expect(validatePuzzle(puzzle)).toBe(false);
  });
});

// ===========================================
// LetterOrbit - Direction Detection Tests
// ===========================================
describe('LetterOrbit - Direction Detection', () => {
  function getDirection(word, orbits) {
    const NUM_ORBITS = 4;

    // Check inner to outer
    const isInnerOuter = orbits.every((orbit, i) => orbit.includes(word[i]));
    if (isInnerOuter) return 'inner→outer';

    // Check outer to inner
    const isOuterInner = orbits.every((orbit, i) => orbit.includes(word[NUM_ORBITS - 1 - i]));
    if (isOuterInner) return 'outer→inner';

    return null;
  }

  it('should detect inner to outer direction', () => {
    const orbits = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
      ['J', 'K', 'L'],
    ];

    expect(getDirection('ADGJ', orbits)).toBe('inner→outer');
  });

  it('should detect outer to inner direction', () => {
    const orbits = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
      ['J', 'K', 'L'],
    ];

    expect(getDirection('JGDA', orbits)).toBe('outer→inner');
  });
});
