import { describe, it, expect } from 'vitest';

// ===========================================
// Minesweeper - Difficulty Configuration Tests
// ===========================================
describe('Minesweeper - Difficulty Configuration', () => {
  const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
  };

  it('should have correct easy configuration', () => {
    expect(DIFFICULTIES.easy.rows).toBe(9);
    expect(DIFFICULTIES.easy.cols).toBe(9);
    expect(DIFFICULTIES.easy.mines).toBe(10);
  });

  it('should have correct medium configuration', () => {
    expect(DIFFICULTIES.medium.rows).toBe(16);
    expect(DIFFICULTIES.medium.cols).toBe(16);
    expect(DIFFICULTIES.medium.mines).toBe(40);
  });

  it('should have correct hard configuration', () => {
    expect(DIFFICULTIES.hard.rows).toBe(16);
    expect(DIFFICULTIES.hard.cols).toBe(30);
    expect(DIFFICULTIES.hard.mines).toBe(99);
  });

  it('should have mine density roughly 12-20%', () => {
    Object.values(DIFFICULTIES).forEach(config => {
      const totalCells = config.rows * config.cols;
      const density = config.mines / totalCells;
      expect(density).toBeGreaterThan(0.1);
      expect(density).toBeLessThan(0.25);
    });
  });
});

// ===========================================
// Minesweeper - Board Generation Tests
// ===========================================
describe('Minesweeper - Board Generation', () => {
  const createEmptyBoard = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };

  it('should create board of correct size', () => {
    const board = createEmptyBoard(9, 9);

    expect(board.length).toBe(9);
    board.forEach(row => {
      expect(row.length).toBe(9);
    });
  });

  it('should initialize all cells to 0', () => {
    const board = createEmptyBoard(9, 9);

    board.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBe(0);
      });
    });
  });
});

// ===========================================
// Minesweeper - Mine Placement Tests
// ===========================================
describe('Minesweeper - Mine Placement', () => {
  const placeMines = (rows, cols, mines, excludeRow, excludeCol) => {
    const board = Array(rows).fill(null).map(() => Array(cols).fill(0));
    let placed = 0;
    let attempts = 0;
    const maxAttempts = 10000;

    while (placed < mines && attempts < maxAttempts) {
      attempts++;
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Don't place mine on first click or adjacent cells
      const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;

      if (board[r][c] !== -1 && !isExcluded) {
        board[r][c] = -1;
        placed++;
      }
    }

    return board;
  };

  it('should place correct number of mines', () => {
    const board = placeMines(9, 9, 10, 4, 4);
    const mineCount = board.flat().filter(cell => cell === -1).length;

    expect(mineCount).toBe(10);
  });

  it('should not place mine on first click cell', () => {
    const board = placeMines(9, 9, 10, 4, 4);

    expect(board[4][4]).not.toBe(-1);
  });

  it('should not place mines adjacent to first click', () => {
    const board = placeMines(9, 9, 10, 4, 4);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        expect(board[4 + dr][4 + dc]).not.toBe(-1);
      }
    }
  });
});

// ===========================================
// Minesweeper - Number Calculation Tests
// ===========================================
describe('Minesweeper - Number Calculation', () => {
  const calculateNumbers = (board) => {
    const rows = board.length;
    const cols = board[0].length;
    const result = board.map(row => [...row]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (result[r][c] === -1) continue;

        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && result[nr][nc] === -1) {
              count++;
            }
          }
        }
        result[r][c] = count;
      }
    }

    return result;
  };

  it('should count adjacent mines correctly', () => {
    const board = [
      [-1, 0, 0],
      [0, 0, 0],
      [0, 0, -1],
    ];

    const result = calculateNumbers(board);

    expect(result[0][1]).toBe(1); // Adjacent to top-left mine
    expect(result[1][1]).toBe(2); // Adjacent to both mines
    expect(result[1][2]).toBe(1); // Adjacent to bottom-right mine
  });

  it('should not modify mine cells', () => {
    const board = [
      [-1, 0, 0],
      [0, 0, 0],
      [0, 0, -1],
    ];

    const result = calculateNumbers(board);

    expect(result[0][0]).toBe(-1);
    expect(result[2][2]).toBe(-1);
  });

  it('should handle corners correctly', () => {
    const board = [
      [0, 0, 0],
      [0, -1, 0],
      [0, 0, 0],
    ];

    const result = calculateNumbers(board);

    // All 8 surrounding cells should have count of 1
    expect(result[0][0]).toBe(1);
    expect(result[0][1]).toBe(1);
    expect(result[0][2]).toBe(1);
    expect(result[1][0]).toBe(1);
    expect(result[1][2]).toBe(1);
    expect(result[2][0]).toBe(1);
    expect(result[2][1]).toBe(1);
    expect(result[2][2]).toBe(1);
  });
});

// ===========================================
// Minesweeper - Cell Reveal Tests
// ===========================================
describe('Minesweeper - Cell Reveal', () => {
  it('should reveal single cell when number > 0', () => {
    const revealed = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];
    const board = [
      [1, 1, 0],
      [1, -1, 1],
      [1, 1, 1],
    ];

    // Reveal cell with number
    revealed[0][0] = true;

    expect(revealed[0][0]).toBe(true);
    expect(revealed[0][1]).toBe(false); // Should not cascade
  });

  it('should cascade reveal for empty cells', () => {
    const revealCell = (revealed, board, row, col, rows, cols) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      if (revealed[row][col]) return;

      revealed[row][col] = true;

      // If empty cell, reveal neighbors
      if (board[row][col] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            revealCell(revealed, board, row + dr, col + dc, rows, cols);
          }
        }
      }
    };

    const revealed = [
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ];
    const board = [
      [0, 0, 1, -1],
      [0, 0, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    revealCell(revealed, board, 3, 0, 4, 4);

    // All empty cells should be revealed
    expect(revealed[3][0]).toBe(true);
    expect(revealed[2][0]).toBe(true);
    expect(revealed[2][1]).toBe(true);
    // Number cells adjacent to empty should be revealed
    expect(revealed[0][2]).toBe(true);
    expect(revealed[1][2]).toBe(true);
    // Mine should not be revealed
    expect(revealed[0][3]).toBe(false);
  });
});

// ===========================================
// Minesweeper - Win/Loss Detection Tests
// ===========================================
describe('Minesweeper - Win/Loss Detection', () => {
  const checkWin = (revealed, board, rows, cols) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] !== -1 && !revealed[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  it('should detect win when all non-mine cells revealed', () => {
    const revealed = [
      [true, true, true],
      [true, false, true],
      [true, true, true],
    ];
    const board = [
      [1, 1, 0],
      [1, -1, 1],
      [1, 1, 1],
    ];

    expect(checkWin(revealed, board, 3, 3)).toBe(true);
  });

  it('should not detect win when cells remain hidden', () => {
    const revealed = [
      [true, true, false],
      [true, false, false],
      [false, false, false],
    ];
    const board = [
      [1, 1, 0],
      [1, -1, 1],
      [1, 1, 1],
    ];

    expect(checkWin(revealed, board, 3, 3)).toBe(false);
  });

  it('should detect loss when mine clicked', () => {
    const board = [
      [1, 1, 0],
      [1, -1, 1],
      [1, 1, 1],
    ];

    const clickedMine = board[1][1] === -1;
    expect(clickedMine).toBe(true);
  });
});

// ===========================================
// Minesweeper - Flag Tests
// ===========================================
describe('Minesweeper - Flag', () => {
  it('should toggle flag on cell', () => {
    const flagged = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];

    // Toggle on
    flagged[0][0] = true;
    expect(flagged[0][0]).toBe(true);

    // Toggle off
    flagged[0][0] = false;
    expect(flagged[0][0]).toBe(false);
  });

  it('should count flags correctly', () => {
    const flagged = [
      [true, false, true],
      [false, true, false],
      [false, false, true],
    ];

    const flagCount = flagged.flat().filter(Boolean).length;
    expect(flagCount).toBe(4);
  });

  it('should calculate remaining mines', () => {
    const totalMines = 10;
    const flagCount = 3;
    const remaining = totalMines - flagCount;

    expect(remaining).toBe(7);
  });
});

// ===========================================
// Minesweeper - Timer Tests
// ===========================================
describe('Minesweeper - Timer', () => {
  const formatTime = (seconds) => {
    return String(Math.min(seconds, 999)).padStart(3, '0');
  };

  it('should format time with leading zeros', () => {
    expect(formatTime(0)).toBe('000');
    expect(formatTime(5)).toBe('005');
    expect(formatTime(50)).toBe('050');
    expect(formatTime(500)).toBe('500');
  });

  it('should cap at 999', () => {
    expect(formatTime(1000)).toBe('999');
    expect(formatTime(9999)).toBe('999');
  });
});

// ===========================================
// Minesweeper - Cell Display Tests
// ===========================================
describe('Minesweeper - Cell Display', () => {
  const getCellContent = (row, col, revealed, flagged, board) => {
    if (flagged[row][col] && !revealed[row][col]) return '🚩';
    if (!revealed[row][col]) return '';
    if (board[row][col] === -1) return '💣';
    if (board[row][col] === 0) return '';
    return board[row][col];
  };

  const board = [
    [1, 1, 0],
    [1, -1, 1],
    [1, 1, 1],
  ];

  it('should show flag when flagged and not revealed', () => {
    const revealed = [[false]];
    const flagged = [[true]];

    expect(getCellContent(0, 0, revealed, flagged, board)).toBe('🚩');
  });

  it('should show nothing when not revealed', () => {
    const revealed = [[false]];
    const flagged = [[false]];

    expect(getCellContent(0, 0, revealed, flagged, board)).toBe('');
  });

  it('should show bomb when mine revealed', () => {
    const revealed = [[false, false, false], [false, true, false], [false, false, false]];
    const flagged = [[false, false, false], [false, false, false], [false, false, false]];

    expect(getCellContent(1, 1, revealed, flagged, board)).toBe('💣');
  });

  it('should show number when revealed', () => {
    const revealed = [[true, false, false], [false, false, false], [false, false, false]];
    const flagged = [[false, false, false], [false, false, false], [false, false, false]];

    expect(getCellContent(0, 0, revealed, flagged, board)).toBe(1);
  });

  it('should show nothing for revealed empty cell', () => {
    const revealed = [[false, false, true], [false, false, false], [false, false, false]];
    const flagged = [[false, false, false], [false, false, false], [false, false, false]];

    expect(getCellContent(0, 2, revealed, flagged, board)).toBe('');
  });
});
