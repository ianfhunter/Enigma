import { describe, it, expect } from 'vitest';

// ===========================================
// ABCEndView - Clue Derivation Tests
// ===========================================
describe('ABCEndView - Clue Derivation', () => {
  // Derive full edge clues from solution
  function deriveClues(solution, size) {
    const topClues = [];
    const bottomClues = [];
    const leftClues = [];
    const rightClues = [];

    // Top clues (looking down)
    for (let c = 0; c < size; c++) {
      let found = '';
      for (let r = 0; r < size; r++) {
        if (solution[r][c]) {
          found = solution[r][c].toUpperCase();
          break;
        }
      }
      topClues.push(found);
    }

    // Bottom clues (looking up)
    for (let c = 0; c < size; c++) {
      let found = '';
      for (let r = size - 1; r >= 0; r--) {
        if (solution[r][c]) {
          found = solution[r][c].toUpperCase();
          break;
        }
      }
      bottomClues.push(found);
    }

    // Left clues (looking right)
    for (let r = 0; r < size; r++) {
      let found = '';
      for (let c = 0; c < size; c++) {
        if (solution[r][c]) {
          found = solution[r][c].toUpperCase();
          break;
        }
      }
      leftClues.push(found);
    }

    // Right clues (looking left)
    for (let r = 0; r < size; r++) {
      let found = '';
      for (let c = size - 1; c >= 0; c--) {
        if (solution[r][c]) {
          found = solution[r][c].toUpperCase();
          break;
        }
      }
      rightClues.push(found);
    }

    return { topClues, bottomClues, leftClues, rightClues };
  }

  it('should derive correct clues from a simple 4x4 solution', () => {
    // Sample 4x4 grid with letters A, B, C (3 letters for 4x4)
    const solution = [
      ['A', '',  'B', 'C'],
      ['B', 'C', '',  'A'],
      ['',  'A', 'C', 'B'],
      ['C', 'B', 'A', '' ],
    ];

    const clues = deriveClues(solution, 4);

    // Top clues: first non-empty looking down each column
    expect(clues.topClues).toEqual(['A', 'C', 'B', 'C']);
    // Bottom clues: first non-empty looking up each column
    expect(clues.bottomClues).toEqual(['C', 'B', 'A', 'B']);
    // Left clues: first non-empty looking right each row
    expect(clues.leftClues).toEqual(['A', 'B', 'A', 'C']);
    // Right clues: first non-empty looking left each row
    expect(clues.rightClues).toEqual(['C', 'A', 'B', 'A']);
  });

  it('should handle empty cells correctly', () => {
    const solution = [
      ['', 'A', ''],
      ['A', '', 'B'],
      ['', 'B', ''],
    ];

    const clues = deriveClues(solution, 3);

    expect(clues.topClues).toEqual(['A', 'A', 'B']);
    expect(clues.bottomClues).toEqual(['A', 'B', 'B']);
  });

  it('should handle all-empty columns', () => {
    const solution = [
      ['', '', 'A'],
      ['', '', 'B'],
      ['', '', ''],
    ];

    const clues = deriveClues(solution, 3);

    expect(clues.topClues[0]).toBe('');
    expect(clues.topClues[1]).toBe('');
    expect(clues.topClues[2]).toBe('A');
  });
});

// ===========================================
// ABCEndView - Validation Tests
// ===========================================
describe('ABCEndView - Validation', () => {
  function checkValidity(grid, puzzleData) {
    const { size, numLetters, fullClues } = puzzleData;
    const errors = new Set();
    const letters = 'ABCDEFG'.slice(0, numLetters).split('');

    // Check row duplicates
    for (let r = 0; r < size; r++) {
      if (!grid[r]) continue;
      const seen = {};
      for (let c = 0; c < size; c++) {
        const val = grid[r][c]?.toUpperCase();
        if (val && val !== '' && letters.includes(val)) {
          if (seen[val]) {
            errors.add(`${r},${c}`);
            errors.add(seen[val]);
          }
          seen[val] = `${r},${c}`;
        }
      }
    }

    // Check column duplicates
    for (let c = 0; c < size; c++) {
      const seen = {};
      for (let r = 0; r < size; r++) {
        if (!grid[r]) continue;
        const val = grid[r][c]?.toUpperCase();
        if (val && val !== '' && letters.includes(val)) {
          if (seen[val]) {
            errors.add(`${r},${c}`);
            errors.add(seen[val]);
          }
          seen[val] = `${r},${c}`;
        }
      }
    }

    return errors;
  }

  it('should detect duplicate letters in row', () => {
    const grid = [
      ['A', 'A', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ];
    const puzzleData = {
      size: 4,
      numLetters: 3,
      fullClues: { topClues: [], bottomClues: [], leftClues: [], rightClues: [] }
    };

    const errors = checkValidity(grid, puzzleData);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('should detect duplicate letters in column', () => {
    const grid = [
      ['A', '', '', ''],
      ['A', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ];
    const puzzleData = {
      size: 4,
      numLetters: 3,
      fullClues: { topClues: [], bottomClues: [], leftClues: [], rightClues: [] }
    };

    const errors = checkValidity(grid, puzzleData);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,0')).toBe(true);
  });

  it('should allow valid placement', () => {
    const grid = [
      ['A', 'B', '', 'C'],
      ['B', '', 'C', 'A'],
      ['C', 'A', 'B', ''],
      ['', 'C', 'A', 'B'],
    ];
    const puzzleData = {
      size: 4,
      numLetters: 3,
      fullClues: { topClues: [], bottomClues: [], leftClues: [], rightClues: [] }
    };

    const errors = checkValidity(grid, puzzleData);
    expect(errors.size).toBe(0);
  });

  it('should ignore X markers when checking duplicates', () => {
    const grid = [
      ['A', 'X', 'X', ''],
      ['X', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ];
    const puzzleData = {
      size: 4,
      numLetters: 3,
      fullClues: { topClues: [], bottomClues: [], leftClues: [], rightClues: [] }
    };

    const errors = checkValidity(grid, puzzleData);
    // X is not in ['A', 'B', 'C'], so should be ignored
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// ABCEndView - Solution Check Tests
// ===========================================
describe('ABCEndView - Solution Check', () => {
  function checkSolved(grid, solution, size) {
    for (let r = 0; r < size; r++) {
      if (!grid[r] || !solution[r]) return false;
      for (let c = 0; c < size; c++) {
        const gridVal = (grid[r][c] || '').toUpperCase();
        const solVal = (solution[r][c] || '').toUpperCase();
        if (gridVal !== solVal) return false;
      }
    }
    return true;
  }

  const solution = [
    ['A', '',  'B', 'C'],
    ['B', 'C', '',  'A'],
    ['',  'A', 'C', 'B'],
    ['C', 'B', 'A', '' ],
  ];

  it('should detect complete solution', () => {
    expect(checkSolved(solution, solution, 4)).toBe(true);
  });

  it('should detect incorrect grid', () => {
    const wrong = [
      ['B', '',  'B', 'C'],  // First cell should be A
      ['B', 'C', '',  'A'],
      ['',  'A', 'C', 'B'],
      ['C', 'B', 'A', '' ],
    ];
    expect(checkSolved(wrong, solution, 4)).toBe(false);
  });

  it('should detect incomplete grid', () => {
    const incomplete = [
      ['A', '',  '', 'C'],  // Missing B in position [0][2]
      ['B', 'C', '',  'A'],
      ['',  'A', 'C', 'B'],
      ['C', 'B', 'A', '' ],
    ];
    expect(checkSolved(incomplete, solution, 4)).toBe(false);
  });

  it('should be case insensitive', () => {
    const lowercaseGrid = [
      ['a', '',  'b', 'c'],
      ['b', 'c', '',  'a'],
      ['',  'a', 'c', 'b'],
      ['c', 'b', 'a', '' ],
    ];
    expect(checkSolved(lowercaseGrid, solution, 4)).toBe(true);
  });
});
