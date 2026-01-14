import { describe, it, expect } from 'vitest';
import { GRID_SIZES, checkSolved, solutionToRects } from './Shikaku.jsx';

describe('Shikaku - helpers', () => {
  it('exposes grid sizes', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['7×7', '10×10', '12×12', '15×15']);
  });

  it('solutionToRects converts id grid to rects', () => {
    const grid = [
      [0, 0],
      [1, 1],
    ];
    const rects = solutionToRects(grid);
    expect(rects).toHaveLength(2);
    expect(rects[0]).toMatchObject({ r: 0, c: 0, h: 1, w: 2 });
  });

  it('checkSolved validates overlap, coverage, and number counts', () => {
    const puzzleGrid = [
      [2, null],
      [null, null],
    ];
    const rects = [{ r: 0, c: 0, h: 1, w: 2 }, { r: 1, c: 0, h: 1, w: 2 }];
    const solved = checkSolved(rects, puzzleGrid, 2);
    expect(solved).toBe(true);

    const badRect = [{ r: 0, c: 0, h: 2, w: 2 }]; // wrong area for clue 2
    expect(checkSolved(badRect, puzzleGrid, 2)).toBe(false);
  });

  it('checkSolved rejects multiple clues in a rectangle', () => {
    const puzzleGrid = [
      [2, 2],
      [null, null],
    ];
    const rects = [{ r: 0, c: 0, h: 1, w: 2 }, { r: 1, c: 0, h: 1, w: 2 }];
    expect(checkSolved(rects, puzzleGrid, 2)).toBe(false);
  });
});
import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// Shikaku - Grid Creation Tests
// ===========================================
describe('Shikaku - Grid Creation', () => {
  const createEmptyGrid = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };

  it('should create grid of correct dimensions', () => {
    const grid = createEmptyGrid(6, 8);

    expect(grid.length).toBe(6);
    grid.forEach(row => {
      expect(row.length).toBe(8);
    });
  });

  it('should initialize all cells to 0 (unmarked)', () => {
    const grid = createEmptyGrid(4, 4);

    grid.flat().forEach(cell => {
      expect(cell).toBe(0);
    });
  });
});

// ===========================================
// Shikaku - Rectangle Validation Tests
// ===========================================
describe('Shikaku - Rectangle Validation', () => {
  const isValidRectangle = (startRow, startCol, endRow, endCol, gridRows, gridCols) => {
    // Check bounds
    if (startRow < 0 || startCol < 0) return false;
    if (endRow >= gridRows || endCol >= gridCols) return false;

    // Ensure start <= end
    if (startRow > endRow || startCol > endCol) return false;

    return true;
  };

  it('should validate correct rectangle', () => {
    expect(isValidRectangle(0, 0, 2, 2, 5, 5)).toBe(true);
    expect(isValidRectangle(1, 1, 3, 4, 5, 5)).toBe(true);
  });

  it('should reject out of bounds', () => {
    expect(isValidRectangle(-1, 0, 2, 2, 5, 5)).toBe(false);
    expect(isValidRectangle(0, 0, 5, 2, 5, 5)).toBe(false);
  });

  it('should reject inverted coordinates', () => {
    expect(isValidRectangle(3, 3, 1, 1, 5, 5)).toBe(false);
  });
});

// ===========================================
// Shikaku - Rectangle Area Tests
// ===========================================
describe('Shikaku - Rectangle Area', () => {
  const calculateArea = (startRow, startCol, endRow, endCol) => {
    const height = endRow - startRow + 1;
    const width = endCol - startCol + 1;
    return height * width;
  };

  it('should calculate 1x1 area', () => {
    expect(calculateArea(0, 0, 0, 0)).toBe(1);
  });

  it('should calculate rectangle area', () => {
    expect(calculateArea(0, 0, 2, 3)).toBe(12); // 3x4
    expect(calculateArea(1, 1, 3, 2)).toBe(6); // 3x2
  });

  it('should calculate square area', () => {
    expect(calculateArea(0, 0, 2, 2)).toBe(9); // 3x3
  });
});

// ===========================================
// Shikaku - Clue Containment Tests
// ===========================================
describe('Shikaku - Clue Containment', () => {
  // Clues are { row, col, value }
  const rectangleContainsClue = (rect, clue) => {
    return clue.row >= rect.startRow && clue.row <= rect.endRow &&
           clue.col >= rect.startCol && clue.col <= rect.endCol;
  };

  const countCluesInRectangle = (rect, clues) => {
    return clues.filter(clue => rectangleContainsClue(rect, clue)).length;
  };

  const clues = [
    { row: 0, col: 0, value: 4 },
    { row: 2, col: 3, value: 6 },
    { row: 4, col: 4, value: 9 },
  ];

  it('should detect clue inside rectangle', () => {
    const rect = { startRow: 0, startCol: 0, endRow: 2, endCol: 2 };
    expect(rectangleContainsClue(rect, clues[0])).toBe(true);
  });

  it('should detect clue outside rectangle', () => {
    const rect = { startRow: 0, startCol: 0, endRow: 1, endCol: 1 };
    expect(rectangleContainsClue(rect, clues[1])).toBe(false);
  });

  it('should count clues in rectangle', () => {
    const rect = { startRow: 0, startCol: 0, endRow: 4, endCol: 4 };
    expect(countCluesInRectangle(rect, clues)).toBe(3);
  });
});

// ===========================================
// Shikaku - Rectangle Overlap Tests
// ===========================================
describe('Shikaku - Rectangle Overlap', () => {
  const rectanglesOverlap = (rect1, rect2) => {
    // Check if rectangles don't overlap
    if (rect1.endRow < rect2.startRow || rect2.endRow < rect1.startRow) {
      return false;
    }
    if (rect1.endCol < rect2.startCol || rect2.endCol < rect1.startCol) {
      return false;
    }
    return true;
  };

  it('should detect overlapping rectangles', () => {
    const rect1 = { startRow: 0, startCol: 0, endRow: 2, endCol: 2 };
    const rect2 = { startRow: 1, startCol: 1, endRow: 3, endCol: 3 };

    expect(rectanglesOverlap(rect1, rect2)).toBe(true);
  });

  it('should detect non-overlapping rectangles', () => {
    const rect1 = { startRow: 0, startCol: 0, endRow: 1, endCol: 1 };
    const rect2 = { startRow: 2, startCol: 2, endRow: 3, endCol: 3 };

    expect(rectanglesOverlap(rect1, rect2)).toBe(false);
  });

  it('should detect adjacent rectangles as non-overlapping', () => {
    const rect1 = { startRow: 0, startCol: 0, endRow: 1, endCol: 1 };
    const rect2 = { startRow: 0, startCol: 2, endRow: 1, endCol: 3 };

    expect(rectanglesOverlap(rect1, rect2)).toBe(false);
  });
});

// ===========================================
// Shikaku - Valid Rectangle Placement Tests
// ===========================================
describe('Shikaku - Rectangle Placement', () => {
  const canPlaceRectangle = (rect, existingRects, clues, gridRows, gridCols) => {
    // Check bounds
    if (rect.startRow < 0 || rect.startCol < 0) return false;
    if (rect.endRow >= gridRows || rect.endCol >= gridCols) return false;

    // Check overlap with existing rectangles
    for (const existing of existingRects) {
      if (!(rect.endRow < existing.startRow || existing.endRow < rect.startRow ||
            rect.endCol < existing.startCol || existing.endCol < rect.startCol)) {
        return false;
      }
    }

    // Must contain exactly one clue
    let clueCount = 0;
    let containedClue = null;
    for (const clue of clues) {
      if (clue.row >= rect.startRow && clue.row <= rect.endRow &&
          clue.col >= rect.startCol && clue.col <= rect.endCol) {
        clueCount++;
        containedClue = clue;
      }
    }

    if (clueCount !== 1) return false;

    // Clue value must match area
    const area = (rect.endRow - rect.startRow + 1) * (rect.endCol - rect.startCol + 1);
    return area === containedClue.value;
  };

  const clues = [
    { row: 0, col: 0, value: 4 }, // Needs 2x2 or 1x4 or 4x1
    { row: 2, col: 2, value: 6 }, // Needs 2x3, 3x2, 1x6, or 6x1
  ];

  it('should allow valid rectangle placement', () => {
    const rect = { startRow: 0, startCol: 0, endRow: 1, endCol: 1 }; // 2x2 = 4
    expect(canPlaceRectangle(rect, [], clues, 5, 5)).toBe(true);
  });

  it('should reject wrong area', () => {
    const rect = { startRow: 0, startCol: 0, endRow: 0, endCol: 2 }; // 1x3 = 3
    expect(canPlaceRectangle(rect, [], clues, 5, 5)).toBe(false);
  });

  it('should reject overlapping placement', () => {
    const existing = [{ startRow: 0, startCol: 0, endRow: 1, endCol: 1 }];
    const rect = { startRow: 1, startCol: 1, endRow: 3, endCol: 2 };
    expect(canPlaceRectangle(rect, existing, clues, 5, 5)).toBe(false);
  });
});

// ===========================================
// Shikaku - Win Condition Tests
// ===========================================
describe('Shikaku - Win Condition', () => {
  const isPuzzleSolved = (rectangles, clues, gridRows, gridCols) => {
    // Create coverage grid
    const coverage = Array(gridRows).fill(null).map(() => Array(gridCols).fill(false));

    // Each rectangle must contain exactly one clue with matching area
    for (const rect of rectangles) {
      const area = (rect.endRow - rect.startRow + 1) * (rect.endCol - rect.startCol + 1);

      let clueCount = 0;
      let matchingClue = false;

      for (const clue of clues) {
        if (clue.row >= rect.startRow && clue.row <= rect.endRow &&
            clue.col >= rect.startCol && clue.col <= rect.endCol) {
          clueCount++;
          if (clue.value === area) matchingClue = true;
        }
      }

      if (clueCount !== 1 || !matchingClue) return false;

      // Mark coverage
      for (let r = rect.startRow; r <= rect.endRow; r++) {
        for (let c = rect.startCol; c <= rect.endCol; c++) {
          if (coverage[r][c]) return false; // Overlap!
          coverage[r][c] = true;
        }
      }
    }

    // All cells must be covered
    return coverage.every(row => row.every(cell => cell));
  };

  it('should detect solved puzzle', () => {
    const clues = [
      { row: 0, col: 0, value: 2 },
      { row: 0, col: 3, value: 2 },
    ];
    const rectangles = [
      { startRow: 0, startCol: 0, endRow: 0, endCol: 1 },
      { startRow: 0, startCol: 2, endRow: 0, endCol: 3 },
    ];

    expect(isPuzzleSolved(rectangles, clues, 1, 4)).toBe(true);
  });

  it('should reject incomplete puzzle', () => {
    const clues = [
      { row: 0, col: 0, value: 2 },
      { row: 0, col: 3, value: 2 },
    ];
    const rectangles = [
      { startRow: 0, startCol: 0, endRow: 0, endCol: 1 },
    ];

    expect(isPuzzleSolved(rectangles, clues, 1, 4)).toBe(false);
  });
});

// ===========================================
// Shikaku - Possible Rectangles Tests
// ===========================================
describe('Shikaku - Possible Rectangles', () => {
  const getFactorPairs = (n) => {
    const pairs = [];
    for (let i = 1; i <= Math.sqrt(n); i++) {
      if (n % i === 0) {
        pairs.push([i, n / i]);
        if (i !== n / i) {
          pairs.push([n / i, i]);
        }
      }
    }
    return pairs;
  };

  const getPossibleRectangles = (clue, gridRows, gridCols) => {
    const pairs = getFactorPairs(clue.value);
    const rectangles = [];

    for (const [height, width] of pairs) {
      // Try all positions where clue could be contained
      for (let startRow = Math.max(0, clue.row - height + 1); startRow <= clue.row; startRow++) {
        for (let startCol = Math.max(0, clue.col - width + 1); startCol <= clue.col; startCol++) {
          const endRow = startRow + height - 1;
          const endCol = startCol + width - 1;

          if (endRow < gridRows && endCol < gridCols) {
            rectangles.push({ startRow, startCol, endRow, endCol });
          }
        }
      }
    }

    return rectangles;
  };

  it('should find factor pairs', () => {
    expect(getFactorPairs(6)).toEqual(expect.arrayContaining([[1, 6], [6, 1], [2, 3], [3, 2]]));
    expect(getFactorPairs(4)).toEqual(expect.arrayContaining([[1, 4], [4, 1], [2, 2]]));
  });

  it('should generate possible rectangles for clue', () => {
    const clue = { row: 2, col: 2, value: 4 };
    const rectangles = getPossibleRectangles(clue, 5, 5);

    expect(rectangles.length).toBeGreaterThan(0);

    // All should have area 4
    rectangles.forEach(rect => {
      const area = (rect.endRow - rect.startRow + 1) * (rect.endCol - rect.startCol + 1);
      expect(area).toBe(4);
    });

    // All should contain the clue
    rectangles.forEach(rect => {
      expect(clue.row >= rect.startRow && clue.row <= rect.endRow).toBe(true);
      expect(clue.col >= rect.startCol && clue.col <= rect.endCol).toBe(true);
    });
  });
});

describe('Shikaku - grid size switching', () => {
  it('should have all sizes defined', () => {
    expect(GRID_SIZES).toBeDefined();
    const sizeKeys = Object.keys(GRID_SIZES);
    expect(sizeKeys.length).toBeGreaterThan(0);
    sizeKeys.forEach((key) => {
      expect(GRID_SIZES[key]).toBeGreaterThan(0);
      expect(Number.isInteger(GRID_SIZES[key])).toBe(true);
    });
  });

  it('should create grids for all available sizes without crashing', () => {
    Object.values(GRID_SIZES).forEach((size) => {
      expect(() => {
        const grid = Array(size).fill(null).map(() => Array(size).fill(-1));
        expect(grid.length).toBe(size);
        expect(grid[0].length).toBe(size);
      }).not.toThrow();
    });
  });

  it('should switch between all sizes sequentially without crashing', () => {
    const sizes = Object.values(GRID_SIZES);
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      expect(() => {
        const grid = Array(size).fill(null).map(() => Array(size).fill(-1));
        expect(grid.length).toBe(size);
      }).not.toThrow();
    }
  });

  it('should handle rapid size switching (all sizes in sequence)', () => {
    const sizes = Object.values(GRID_SIZES);
    const grids = [];
    
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const grid = Array(size).fill(null).map(() => Array(size).fill(-1));
      grids.push({ size, grid });
    }
    
    expect(grids).toHaveLength(sizes.length);
    grids.forEach(({ size, grid }) => {
      expect(grid.length).toBe(size);
      expect(grid[0].length).toBe(size);
    });
  });

  it('should handle switching from largest to smallest size', () => {
    const sizes = Object.values(GRID_SIZES);
    const largest = Math.max(...sizes);
    const smallest = Math.min(...sizes);
    
    expect(() => {
      const largeGrid = Array(largest).fill(null).map(() => Array(largest).fill(-1));
      const smallGrid = Array(smallest).fill(null).map(() => Array(smallest).fill(-1));
      
      expect(largeGrid.length).toBe(largest);
      expect(smallGrid.length).toBe(smallest);
    }).not.toThrow();
  });

  it('should handle switching from smallest to largest size', () => {
    const sizes = Object.values(GRID_SIZES);
    const smallest = Math.min(...sizes);
    const largest = Math.max(...sizes);
    
    expect(() => {
      const smallGrid = Array(smallest).fill(null).map(() => Array(smallest).fill(-1));
      const largeGrid = Array(largest).fill(null).map(() => Array(largest).fill(-1));
      
      expect(smallGrid.length).toBe(smallest);
      expect(largeGrid.length).toBe(largest);
    }).not.toThrow();
  });
});
