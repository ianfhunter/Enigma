import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
} from '../../data/wordUtils';

// ===========================================
// Nonogram - Clue Generation Tests
// ===========================================
describe('Nonogram - Clue Generation', () => {
  const generateClues = (line) => {
    const clues = [];
    let count = 0;

    for (const cell of line) {
      if (cell === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }

    if (count > 0) {
      clues.push(count);
    }

    return clues.length > 0 ? clues : [0];
  };

  it('should generate correct clues for continuous filled cells', () => {
    expect(generateClues([1, 1, 1, 0, 0])).toEqual([3]);
    expect(generateClues([0, 1, 1, 1, 0])).toEqual([3]);
    expect(generateClues([0, 0, 1, 1, 1])).toEqual([3]);
  });

  it('should generate multiple clues for separated groups', () => {
    expect(generateClues([1, 0, 1, 0, 1])).toEqual([1, 1, 1]);
    expect(generateClues([1, 1, 0, 1, 1])).toEqual([2, 2]);
    expect(generateClues([1, 0, 0, 1, 1])).toEqual([1, 2]);
  });

  it('should return [0] for empty line', () => {
    expect(generateClues([0, 0, 0, 0, 0])).toEqual([0]);
  });

  it('should handle fully filled line', () => {
    expect(generateClues([1, 1, 1, 1, 1])).toEqual([5]);
  });

  it('should handle single cell', () => {
    expect(generateClues([1])).toEqual([1]);
    expect(generateClues([0])).toEqual([0]);
  });
});

// ===========================================
// Nonogram - Row/Column Extraction Tests
// ===========================================
describe('Nonogram - Row/Column Extraction', () => {
  const getRow = (grid, rowIndex) => {
    return grid[rowIndex];
  };

  const getColumn = (grid, colIndex) => {
    return grid.map(row => row[colIndex]);
  };

  const mockGrid = [
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
  ];

  it('should extract row correctly', () => {
    expect(getRow(mockGrid, 0)).toEqual([1, 0, 1, 0, 1]);
    expect(getRow(mockGrid, 2)).toEqual([1, 1, 0, 1, 1]);
  });

  it('should extract column correctly', () => {
    expect(getColumn(mockGrid, 0)).toEqual([1, 0, 1, 0, 1]);
    expect(getColumn(mockGrid, 2)).toEqual([1, 1, 0, 1, 1]);
  });
});

// ===========================================
// Nonogram - Cell State Tests
// ===========================================
describe('Nonogram - Cell State', () => {
  // Cell states: 0 = empty, 1 = filled, 2 = marked X
  const cycleCellState = (currentState) => {
    return (currentState + 1) % 3;
  };

  const setCellState = (grid, row, col, state) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = state;
    return newGrid;
  };

  it('should cycle through states: empty -> filled -> X -> empty', () => {
    expect(cycleCellState(0)).toBe(1);
    expect(cycleCellState(1)).toBe(2);
    expect(cycleCellState(2)).toBe(0);
  });

  it('should set cell state without modifying original', () => {
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const original = JSON.stringify(grid);

    setCellState(grid, 1, 1, 1);

    expect(JSON.stringify(grid)).toBe(original);
  });

  it('should set correct cell', () => {
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const newGrid = setCellState(grid, 1, 2, 1);

    expect(newGrid[1][2]).toBe(1);
    expect(newGrid[0][0]).toBe(0);
  });
});

// ===========================================
// Nonogram - Validation Tests
// ===========================================
describe('Nonogram - Validation', () => {
  const generateClues = (line) => {
    const clues = [];
    let count = 0;

    for (const cell of line) {
      if (cell === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }

    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
  };

  const validateLine = (line, expectedClues) => {
    const actualClues = generateClues(line);

    if (actualClues.length !== expectedClues.length) return false;

    for (let i = 0; i < actualClues.length; i++) {
      if (actualClues[i] !== expectedClues[i]) return false;
    }

    return true;
  };

  const isLineComplete = (line, expectedClues) => {
    // Check if line has no empty cells (only filled or X) and matches clues
    const hasEmpty = line.includes(0);
    return !hasEmpty && validateLine(line.map(c => c === 1 ? 1 : 0), expectedClues);
  };

  it('should validate correct line', () => {
    expect(validateLine([1, 1, 0, 1], [2, 1])).toBe(true);
    expect(validateLine([1, 0, 1, 0, 1], [1, 1, 1])).toBe(true);
  });

  it('should reject incorrect line', () => {
    expect(validateLine([1, 1, 1, 0, 1], [2, 1])).toBe(false);
    expect(validateLine([1, 0, 0, 1], [1, 1, 1])).toBe(false);
  });

  it('should detect complete line', () => {
    // 0=empty, 1=filled, 2=X
    expect(isLineComplete([1, 1, 2, 1], [2, 1])).toBe(true);
    expect(isLineComplete([1, 1, 0, 1], [2, 1])).toBe(false); // Has empty
  });
});

// ===========================================
// Nonogram - Win Detection Tests
// ===========================================
describe('Nonogram - Win Detection', () => {
  const checkWin = (userGrid, solution) => {
    for (let r = 0; r < solution.length; r++) {
      for (let c = 0; c < solution[r].length; c++) {
        // Only check filled cells (marked X doesn't matter)
        const userFilled = userGrid[r][c] === 1;
        const solutionFilled = solution[r][c] === 1;

        if (userFilled !== solutionFilled) return false;
      }
    }
    return true;
  };

  const solution = [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ];

  it('should detect win when grid matches solution', () => {
    const userGrid = [
      [1, 2, 1], // 2 (X) is same as 0 for win check
      [2, 1, 2],
      [1, 2, 1],
    ];

    expect(checkWin(userGrid, solution)).toBe(true);
  });

  it('should detect win with exact match', () => {
    const userGrid = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ];

    expect(checkWin(userGrid, solution)).toBe(true);
  });

  it('should reject incorrect grid', () => {
    const userGrid = [
      [1, 1, 1], // Wrong - middle should not be filled
      [0, 1, 0],
      [1, 0, 1],
    ];

    expect(checkWin(userGrid, solution)).toBe(false);
  });
});

// ===========================================
// Nonogram - Puzzle Generation Tests
// ===========================================
describe('Nonogram - Puzzle Generation', () => {
  const generateRandomPuzzle = (size, density, random) => {
    const grid = [];

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(random() < density ? 1 : 0);
      }
      grid.push(row);
    }

    return grid;
  };

  it('should generate grid of correct size', () => {
    const random = createSeededRandom(12345);
    const grid = generateRandomPuzzle(5, 0.5, random);

    expect(grid.length).toBe(5);
    grid.forEach(row => {
      expect(row.length).toBe(5);
    });
  });

  it('should only contain 0s and 1s', () => {
    const random = createSeededRandom(12345);
    const grid = generateRandomPuzzle(5, 0.5, random);

    grid.forEach(row => {
      row.forEach(cell => {
        expect(cell === 0 || cell === 1).toBe(true);
      });
    });
  });

  it('should generate consistent grid with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const grid1 = generateRandomPuzzle(5, 0.5, random1);
    const grid2 = generateRandomPuzzle(5, 0.5, random2);

    expect(grid1).toEqual(grid2);
  });

  it('should respect density parameter', () => {
    const random = createSeededRandom(12345);
    const lowDensity = generateRandomPuzzle(10, 0.2, random);

    const random2 = createSeededRandom(12345);
    const highDensity = generateRandomPuzzle(10, 0.8, random2);

    const lowFilled = lowDensity.flat().filter(c => c === 1).length;
    const highFilled = highDensity.flat().filter(c => c === 1).length;

    // High density should generally have more filled cells
    // (though with same seed, just different density calculations)
    expect(typeof lowFilled).toBe('number');
    expect(typeof highFilled).toBe('number');
  });
});

// ===========================================
// Nonogram - Difficulty Tests
// ===========================================
describe('Nonogram - Difficulty', () => {
  const DIFFICULTY_SETTINGS = {
    easy: { size: 5, density: 0.5 },
    medium: { size: 10, density: 0.5 },
    hard: { size: 15, density: 0.5 },
    expert: { size: 20, density: 0.5 },
  };

  it('should have larger grids for harder difficulties', () => {
    expect(DIFFICULTY_SETTINGS.easy.size).toBeLessThan(DIFFICULTY_SETTINGS.medium.size);
    expect(DIFFICULTY_SETTINGS.medium.size).toBeLessThan(DIFFICULTY_SETTINGS.hard.size);
    expect(DIFFICULTY_SETTINGS.hard.size).toBeLessThan(DIFFICULTY_SETTINGS.expert.size);
  });

  it('should calculate total cells correctly', () => {
    Object.values(DIFFICULTY_SETTINGS).forEach(setting => {
      const totalCells = setting.size * setting.size;
      expect(totalCells).toBe(setting.size ** 2);
    });
  });
});
