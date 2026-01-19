import { describe, it, expect } from 'vitest';

// ===========================================
// Campixu - Clue Generation Tests
// ===========================================
describe('Campixu - Clue Generation', () => {
  function generateClues(grid, size) {
    const rowClues = [];
    const colClues = [];

    // Row clues - runs of tents
    for (let r = 0; r < size; r++) {
      const clue = [];
      let run = 0;
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 'tent') {
          run++;
        } else if (run > 0) {
          clue.push(run);
          run = 0;
        }
      }
      if (run > 0) clue.push(run);
      rowClues.push(clue.length > 0 ? clue : [0]);
    }

    // Column clues
    for (let c = 0; c < size; c++) {
      const clue = [];
      let run = 0;
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 'tent') {
          run++;
        } else if (run > 0) {
          clue.push(run);
          run = 0;
        }
      }
      if (run > 0) clue.push(run);
      colClues.push(clue.length > 0 ? clue : [0]);
    }

    return { rowClues, colClues };
  }

  it('should generate correct clues for simple grid', () => {
    const grid = [
      ['tent', null, 'tent'],
      [null, null, null],
      ['tent', 'tent', null],
    ];

    const { rowClues, colClues } = generateClues(grid, 3);

    expect(rowClues[0]).toEqual([1, 1]); // Two separate tents
    expect(rowClues[1]).toEqual([0]);    // No tents
    expect(rowClues[2]).toEqual([2]);    // Two consecutive tents
  });

  it('should handle row with consecutive tents', () => {
    const grid = [
      ['tent', 'tent', 'tent', null, 'tent'],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ];

    const { rowClues } = generateClues(grid, 5);
    expect(rowClues[0]).toEqual([3, 1]);
  });

  it('should handle empty grid', () => {
    const grid = [
      [null, null],
      [null, null],
    ];

    const { rowClues, colClues } = generateClues(grid, 2);

    expect(rowClues).toEqual([[0], [0]]);
    expect(colClues).toEqual([[0], [0]]);
  });

  it('should handle column clues correctly', () => {
    const grid = [
      ['tent', null],
      ['tent', null],
      [null, 'tent'],
      ['tent', 'tent'],
    ];

    const { colClues } = generateClues(grid, 4);

    expect(colClues[0]).toEqual([2, 1]); // Two runs in first column
    expect(colClues[1]).toEqual([2]);    // One run of 2 in second column
  });
});

// ===========================================
// Campixu - Tent Adjacency Tests
// ===========================================
describe('Campixu - Tent Adjacency Validation', () => {
  function checkTentAdjacency(playerGrid, size) {
    const errors = new Set();

    // Check tents don't touch (8 neighbors)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (playerGrid[r][c] !== 'tent') continue;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerGrid[nr][nc] === 'tent') {
              errors.add(`${r},${c}`);
              errors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }

    return errors;
  }

  it('should detect horizontally adjacent tents', () => {
    const grid = [
      ['tent', 'tent', null],
      [null, null, null],
      [null, null, null],
    ];

    const errors = checkTentAdjacency(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('should detect vertically adjacent tents', () => {
    const grid = [
      ['tent', null, null],
      ['tent', null, null],
      [null, null, null],
    ];

    const errors = checkTentAdjacency(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,0')).toBe(true);
  });

  it('should detect diagonally adjacent tents', () => {
    const grid = [
      ['tent', null, null],
      [null, 'tent', null],
      [null, null, null],
    ];

    const errors = checkTentAdjacency(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,1')).toBe(true);
  });

  it('should allow non-adjacent tents', () => {
    const grid = [
      ['tent', null, 'tent'],
      [null, null, null],
      ['tent', null, 'tent'],
    ];

    const errors = checkTentAdjacency(grid, 3);
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// Campixu - Tree Adjacency Tests
// ===========================================
describe('Campixu - Tree Adjacency Validation', () => {
  function checkTreeAdjacency(playerGrid, puzzle, size) {
    const errors = new Set();

    // Check tents are adjacent to trees (orthogonal only)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (playerGrid[r][c] !== 'tent') continue;

        let hasAdjacentTree = false;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && puzzle[nr][nc] === 'tree') {
            hasAdjacentTree = true;
            break;
          }
        }

        if (!hasAdjacentTree) {
          errors.add(`${r},${c}`);
        }
      }
    }

    return errors;
  }

  it('should allow tent next to tree', () => {
    const puzzle = [
      ['tree', null, null],
      [null, null, null],
      [null, null, null],
    ];
    const playerGrid = [
      ['tree', 'tent', null],
      [null, null, null],
      [null, null, null],
    ];

    const errors = checkTreeAdjacency(playerGrid, puzzle, 3);
    expect(errors.size).toBe(0);
  });

  it('should reject tent not next to tree', () => {
    const puzzle = [
      ['tree', null, null],
      [null, null, null],
      [null, null, null],
    ];
    const playerGrid = [
      ['tree', null, 'tent'],  // Tent too far from tree
      [null, null, null],
      [null, null, null],
    ];

    const errors = checkTreeAdjacency(playerGrid, puzzle, 3);
    expect(errors.has('0,2')).toBe(true);
  });

  it('should not count diagonal tree as adjacent', () => {
    const puzzle = [
      ['tree', null, null],
      [null, null, null],
      [null, null, null],
    ];
    const playerGrid = [
      ['tree', null, null],
      [null, 'tent', null],  // Diagonal to tree
      [null, null, null],
    ];

    const errors = checkTreeAdjacency(playerGrid, puzzle, 3);
    expect(errors.has('1,1')).toBe(true);
  });
});

// ===========================================
// Campixu - Clue Status Tests
// ===========================================
describe('Campixu - Clue Status', () => {
  function getClueStatus(playerGrid, rowClues, colClues, size) {
    const rowStatus = [];
    const colStatus = [];

    // Check row clues
    for (let r = 0; r < size; r++) {
      const actual = [];
      let run = 0;
      for (let c = 0; c < size; c++) {
        if (playerGrid[r][c] === 'tent') {
          run++;
        } else if (run > 0) {
          actual.push(run);
          run = 0;
        }
      }
      if (run > 0) actual.push(run);
      if (actual.length === 0) actual.push(0);

      rowStatus.push(JSON.stringify(actual) === JSON.stringify(rowClues[r]) ? 'complete' : 'incomplete');
    }

    // Check column clues
    for (let c = 0; c < size; c++) {
      const actual = [];
      let run = 0;
      for (let r = 0; r < size; r++) {
        if (playerGrid[r][c] === 'tent') {
          run++;
        } else if (run > 0) {
          actual.push(run);
          run = 0;
        }
      }
      if (run > 0) actual.push(run);
      if (actual.length === 0) actual.push(0);

      colStatus.push(JSON.stringify(actual) === JSON.stringify(colClues[c]) ? 'complete' : 'incomplete');
    }

    return { rowStatus, colStatus };
  }

  it('should mark complete rows correctly', () => {
    const playerGrid = [
      ['tent', null, 'tent'],
      [null, null, null],
      [null, null, null],
    ];
    const rowClues = [[1, 1], [0], [0]];
    const colClues = [[1], [0], [1]];

    const { rowStatus } = getClueStatus(playerGrid, rowClues, colClues, 3);

    expect(rowStatus[0]).toBe('complete');
    expect(rowStatus[1]).toBe('complete');
  });

  it('should mark incomplete rows correctly', () => {
    const playerGrid = [
      ['tent', null, null],  // Only one tent, need two separate
      [null, null, null],
      [null, null, null],
    ];
    const rowClues = [[1, 1], [0], [0]];
    const colClues = [[1], [0], [0]];

    const { rowStatus } = getClueStatus(playerGrid, rowClues, colClues, 3);

    expect(rowStatus[0]).toBe('incomplete');
  });
});

// ===========================================
// Campixu - Solution Check Tests
// ===========================================
describe('Campixu - Solution Check', () => {
  function checkSolved(playerGrid, solution, size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const expected = solution[r][c] === 'tent';
        const actual = playerGrid[r][c] === 'tent';
        if (expected !== actual) return false;
      }
    }
    return true;
  }

  it('should detect correct solution', () => {
    const solution = [
      ['tree', 'tent', null],
      [null, null, null],
      ['tent', 'tree', null],
    ];
    const playerGrid = [
      ['tree', 'tent', null],
      [null, null, null],
      ['tent', 'tree', null],
    ];

    expect(checkSolved(playerGrid, solution, 3)).toBe(true);
  });

  it('should detect missing tent', () => {
    const solution = [
      ['tree', 'tent', null],
      [null, null, null],
      ['tent', 'tree', null],
    ];
    const playerGrid = [
      ['tree', null, null],  // Missing tent
      [null, null, null],
      ['tent', 'tree', null],
    ];

    expect(checkSolved(playerGrid, solution, 3)).toBe(false);
  });

  it('should detect extra tent', () => {
    const solution = [
      ['tree', 'tent', null],
      [null, null, null],
      [null, 'tree', null],
    ];
    const playerGrid = [
      ['tree', 'tent', null],
      [null, null, null],
      ['tent', 'tree', null],  // Extra tent
    ];

    expect(checkSolved(playerGrid, solution, 3)).toBe(false);
  });
});
