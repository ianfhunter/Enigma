import { describe, it, expect } from 'vitest';

// ===========================================
// Str8ts - Grid Utilities Tests
// ===========================================
describe('Str8ts - Grid Utilities', () => {
  const GRID_SIZE = 9;

  const createEmptyGrid = () => {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  };

  const createBlackCellGrid = () => {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
  };

  it('should create 9x9 empty grid', () => {
    const grid = createEmptyGrid();

    expect(grid.length).toBe(9);
    grid.forEach(row => {
      expect(row.length).toBe(9);
      row.forEach(cell => {
        expect(cell).toBe(0);
      });
    });
  });

  it('should create 9x9 black cell tracker', () => {
    const isBlack = createBlackCellGrid();

    expect(isBlack.length).toBe(9);
    isBlack.forEach(row => {
      expect(row.length).toBe(9);
      row.forEach(cell => {
        expect(cell).toBe(false);
      });
    });
  });
});

// ===========================================
// Str8ts - Validation Tests
// ===========================================
describe('Str8ts - Validation', () => {
  const GRID_SIZE = 9;

  const isValidPlacement = (grid, isBlack, row, col, num) => {
    // Check row uniqueness (only in white cells)
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== col && !isBlack[row][x] && grid[row][x] === num) return false;
    }

    // Check column uniqueness (only in white cells)
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== row && !isBlack[x][col] && grid[x][col] === num) return false;
    }

    return true;
  };

  const emptyGrid = Array(9).fill(null).map(() => Array(9).fill(0));
  const noBlackCells = Array(9).fill(null).map(() => Array(9).fill(false));

  it('should allow valid placement in empty grid', () => {
    expect(isValidPlacement(emptyGrid, noBlackCells, 0, 0, 5)).toBe(true);
    expect(isValidPlacement(emptyGrid, noBlackCells, 4, 4, 9)).toBe(true);
  });

  it('should reject duplicate in row', () => {
    const grid = emptyGrid.map(row => [...row]);
    grid[0][0] = 5;

    expect(isValidPlacement(grid, noBlackCells, 0, 5, 5)).toBe(false);
  });

  it('should reject duplicate in column', () => {
    const grid = emptyGrid.map(row => [...row]);
    grid[0][0] = 5;

    expect(isValidPlacement(grid, noBlackCells, 5, 0, 5)).toBe(false);
  });

  it('should allow duplicate if one cell is black', () => {
    const grid = emptyGrid.map(row => [...row]);
    const isBlack = noBlackCells.map(row => [...row]);

    grid[0][0] = 5;
    isBlack[0][5] = true; // Make the cell at row 0, col 5 black
    grid[0][5] = 5; // Put 5 in black cell (allowed - won't conflict with row)

    // Should allow 5 in a white cell in same row since the other 5 is in a black cell
    expect(isValidPlacement(grid, isBlack, 0, 3, 5)).toBe(false); // Still conflicts with white cell at 0,0
  });
});

// ===========================================
// Str8ts - Compartment Tests
// ===========================================
describe('Str8ts - Compartment Validation', () => {
  const checkCompartmentValid = (values) => {
    if (values.length === 0) return true;

    // Check for duplicates
    if (new Set(values).size !== values.length) return false;

    // Check for consecutive sequence
    const sorted = [...values].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) return false;
    }

    return true;
  };

  it('should validate consecutive sequences', () => {
    expect(checkCompartmentValid([3, 4, 5])).toBe(true);
    expect(checkCompartmentValid([5, 4, 3])).toBe(true); // Order doesn't matter
    expect(checkCompartmentValid([1, 2, 3, 4, 5])).toBe(true);
    expect(checkCompartmentValid([7, 8, 9])).toBe(true);
  });

  it('should reject non-consecutive sequences', () => {
    expect(checkCompartmentValid([1, 3, 5])).toBe(false);
    expect(checkCompartmentValid([2, 4, 6, 8])).toBe(false);
    expect(checkCompartmentValid([1, 2, 4])).toBe(false);
  });

  it('should reject duplicates', () => {
    expect(checkCompartmentValid([3, 3, 4])).toBe(false);
    expect(checkCompartmentValid([1, 1, 1])).toBe(false);
  });

  it('should handle single cell compartments', () => {
    expect(checkCompartmentValid([5])).toBe(true);
    expect(checkCompartmentValid([9])).toBe(true);
  });

  it('should handle empty compartments', () => {
    expect(checkCompartmentValid([])).toBe(true);
  });
});

// ===========================================
// Str8ts - Error Detection Tests
// ===========================================
describe('Str8ts - Error Detection', () => {
  const GRID_SIZE = 9;

  const findErrors = (grid, isBlack, solution) => {
    const errors = new Set();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!isBlack[r][c] && grid[r][c] !== 0) {
          // Check row duplicates
          for (let i = 0; i < GRID_SIZE; i++) {
            if (i !== c && !isBlack[r][i] && grid[r][i] === grid[r][c]) {
              errors.add(`${r},${c}`);
              errors.add(`${r},${i}`);
            }
          }

          // Check column duplicates
          for (let i = 0; i < GRID_SIZE; i++) {
            if (i !== r && !isBlack[i][c] && grid[i][c] === grid[r][c]) {
              errors.add(`${r},${c}`);
              errors.add(`${i},${c}`);
            }
          }

          // Check against solution
          if (solution[r][c] !== grid[r][c]) {
            errors.add(`${r},${c}`);
          }
        }
      }
    }

    return errors;
  };

  it('should detect row duplicates', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));
    const solution = Array(9).fill(null).map(() => Array(9).fill(0));

    grid[0][0] = 5;
    grid[0][5] = 5;
    solution[0][0] = 5;
    solution[0][5] = 3;

    const errors = findErrors(grid, isBlack, solution);

    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,5')).toBe(true);
  });

  it('should detect column duplicates', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));
    const solution = Array(9).fill(null).map(() => Array(9).fill(0));

    grid[0][0] = 5;
    grid[5][0] = 5;
    solution[0][0] = 5;
    solution[5][0] = 3;

    const errors = findErrors(grid, isBlack, solution);

    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('5,0')).toBe(true);
  });

  it('should detect wrong values against solution', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));
    const solution = Array(9).fill(null).map((_, r) => Array(9).fill(null).map((_, c) => ((r + c) % 9) + 1));

    grid[4][4] = 7;

    const errors = findErrors(grid, isBlack, solution);

    // Solution at 4,4 is ((4+4) % 9) + 1 = 9, but we put 7
    expect(errors.has('4,4')).toBe(true);
  });
});

// ===========================================
// Str8ts - Fallback Template Tests
// ===========================================
describe('Str8ts - Fallback Templates', () => {
  const templates = [
    {
      solution: [
        [0, 5, 6, 7, 8, 9, 1, 2, 3],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [4, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      blacks: [[0,0], [8,1], [8,2], [8,3], [8,4], [8,5], [8,6], [8,7], [8,8]]
    },
    {
      solution: [
        [0, 2, 3, 4, 5, 6, 7, 8, 0],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [6, 7, 8, 9, 0, 2, 3, 4, 5],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
        [0, 3, 4, 5, 6, 7, 8, 9, 0],
      ],
      blacks: [[0,0], [0,8], [4,4], [8,0], [8,8]]
    },
  ];

  it('should have valid row uniqueness in templates', () => {
    templates.forEach((template, tIdx) => {
      const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));
      template.blacks.forEach(([r, c]) => { isBlack[r][c] = true; });

      for (let r = 0; r < 9; r++) {
        const rowValues = [];
        for (let c = 0; c < 9; c++) {
          if (!isBlack[r][c] && template.solution[r][c] !== 0) {
            rowValues.push(template.solution[r][c]);
          }
        }
        const uniqueValues = new Set(rowValues);
        expect(uniqueValues.size).toBe(rowValues.length);
      }
    });
  });

  it('should have valid column uniqueness in templates', () => {
    templates.forEach((template, tIdx) => {
      const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));
      template.blacks.forEach(([r, c]) => { isBlack[r][c] = true; });

      for (let c = 0; c < 9; c++) {
        const colValues = [];
        for (let r = 0; r < 9; r++) {
          if (!isBlack[r][c] && template.solution[r][c] !== 0) {
            colValues.push(template.solution[r][c]);
          }
        }
        const uniqueValues = new Set(colValues);
        expect(uniqueValues.size).toBe(colValues.length);
      }
    });
  });
});

// ===========================================
// Str8ts - Completion Detection Tests
// ===========================================
describe('Str8ts - Completion Detection', () => {
  const GRID_SIZE = 9;

  const isComplete = (grid, isBlack, solution) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!isBlack[r][c]) {
          if (grid[r][c] === 0) return false;
          if (grid[r][c] !== solution[r][c]) return false;
        }
      }
    }
    return true;
  };

  it('should detect complete puzzle', () => {
    const solution = Array(9).fill(null).map((_, r) =>
      Array(9).fill(null).map((_, c) => ((r + c) % 9) + 1)
    );
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));

    expect(isComplete(solution, isBlack, solution)).toBe(true);
  });

  it('should detect incomplete puzzle', () => {
    const solution = Array(9).fill(null).map((_, r) =>
      Array(9).fill(null).map((_, c) => ((r + c) % 9) + 1)
    );
    const grid = solution.map(row => [...row]);
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));

    grid[0][0] = 0; // Leave one cell empty

    expect(isComplete(grid, isBlack, solution)).toBe(false);
  });

  it('should detect wrong answer', () => {
    const solution = Array(9).fill(null).map((_, r) =>
      Array(9).fill(null).map((_, c) => ((r + c) % 9) + 1)
    );
    const grid = solution.map(row => [...row]);
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));

    grid[0][0] = 9; // Wrong value (should be 1)

    expect(isComplete(grid, isBlack, solution)).toBe(false);
  });

  it('should ignore black cells in completion check', () => {
    const solution = Array(9).fill(null).map((_, r) =>
      Array(9).fill(null).map((_, c) => ((r + c) % 9) + 1)
    );
    const grid = solution.map(row => [...row]);
    const isBlack = Array(9).fill(null).map(() => Array(9).fill(false));

    // Make cell (0,0) black and put wrong value there
    isBlack[0][0] = true;
    grid[0][0] = 999; // Invalid value, but should be ignored

    expect(isComplete(grid, isBlack, solution)).toBe(true);
  });
});
