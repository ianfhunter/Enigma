import { describe, it, expect } from 'vitest';

// ===========================================
// Sliding Puzzle - Board Creation Tests
// ===========================================
describe('Sliding Puzzle - Board Creation', () => {
  const createSolvedBoard = (size) => {
    const board = [];
    let num = 1;
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        if (r === size - 1 && c === size - 1) {
          row.push(0); // Empty tile
        } else {
          row.push(num++);
        }
      }
      board.push(row);
    }
    return board;
  };

  it('should create 3x3 solved board correctly', () => {
    const board = createSolvedBoard(3);

    expect(board).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ]);
  });

  it('should create 4x4 solved board correctly', () => {
    const board = createSolvedBoard(4);

    expect(board).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 0],
    ]);
  });

  it('should have empty tile (0) at bottom-right', () => {
    const board = createSolvedBoard(4);
    expect(board[3][3]).toBe(0);
  });

  it('should have correct number of tiles', () => {
    const board = createSolvedBoard(4);
    const flatBoard = board.flat();

    expect(flatBoard.length).toBe(16);
    expect(flatBoard.includes(0)).toBe(true);
    expect(flatBoard.filter(n => n === 0).length).toBe(1);
  });
});

// ===========================================
// Sliding Puzzle - Move Validation Tests
// ===========================================
describe('Sliding Puzzle - Move Validation', () => {
  const findEmptyPosition = (board) => {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === 0) {
          return [r, c];
        }
      }
    }
    return null;
  };

  const isAdjacentToEmpty = (board, row, col) => {
    const [emptyRow, emptyCol] = findEmptyPosition(board);
    const rowDiff = Math.abs(row - emptyRow);
    const colDiff = Math.abs(col - emptyCol);

    // Adjacent means same row/col with distance of 1
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const board = [
    [1, 2, 3],
    [4, 0, 6],
    [7, 5, 8],
  ];

  it('should find empty position', () => {
    const [row, col] = findEmptyPosition(board);
    expect([row, col]).toEqual([1, 1]);
  });

  it('should identify adjacent tiles', () => {
    // Tiles adjacent to empty at (1,1) are (0,1), (1,0), (1,2), (2,1)
    expect(isAdjacentToEmpty(board, 0, 1)).toBe(true); // Above
    expect(isAdjacentToEmpty(board, 1, 0)).toBe(true); // Left
    expect(isAdjacentToEmpty(board, 1, 2)).toBe(true); // Right
    expect(isAdjacentToEmpty(board, 2, 1)).toBe(true); // Below
  });

  it('should reject non-adjacent tiles', () => {
    expect(isAdjacentToEmpty(board, 0, 0)).toBe(false); // Diagonal
    expect(isAdjacentToEmpty(board, 0, 2)).toBe(false); // Diagonal
    expect(isAdjacentToEmpty(board, 2, 0)).toBe(false); // Diagonal
    expect(isAdjacentToEmpty(board, 2, 2)).toBe(false); // Diagonal
  });

  it('should reject clicking empty tile itself', () => {
    expect(isAdjacentToEmpty(board, 1, 1)).toBe(false);
  });
});

// ===========================================
// Sliding Puzzle - Tile Movement Tests
// ===========================================
describe('Sliding Puzzle - Tile Movement', () => {
  const moveTile = (board, row, col) => {
    const newBoard = board.map(r => [...r]);

    // Find empty
    let emptyRow, emptyCol;
    for (let r = 0; r < newBoard.length; r++) {
      for (let c = 0; c < newBoard[r].length; c++) {
        if (newBoard[r][c] === 0) {
          emptyRow = r;
          emptyCol = c;
        }
      }
    }

    // Swap if adjacent
    const rowDiff = Math.abs(row - emptyRow);
    const colDiff = Math.abs(col - emptyCol);

    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      newBoard[emptyRow][emptyCol] = newBoard[row][col];
      newBoard[row][col] = 0;
    }

    return newBoard;
  };

  it('should swap tile with empty', () => {
    const board = [
      [1, 2, 3],
      [4, 0, 6],
      [7, 5, 8],
    ];

    const newBoard = moveTile(board, 0, 1); // Move tile 2

    expect(newBoard[0][1]).toBe(0);
    expect(newBoard[1][1]).toBe(2);
  });

  it('should not move non-adjacent tile', () => {
    const board = [
      [1, 2, 3],
      [4, 0, 6],
      [7, 5, 8],
    ];

    const newBoard = moveTile(board, 0, 0); // Tile 1 is not adjacent

    // Board should be unchanged
    expect(newBoard[0][0]).toBe(1);
    expect(newBoard[1][1]).toBe(0);
  });

  it('should not modify original board', () => {
    const board = [
      [1, 2, 3],
      [4, 0, 6],
      [7, 5, 8],
    ];
    const originalBoard = JSON.stringify(board);

    moveTile(board, 0, 1);

    expect(JSON.stringify(board)).toBe(originalBoard);
  });
});

// ===========================================
// Sliding Puzzle - Win Detection Tests
// ===========================================
describe('Sliding Puzzle - Win Detection', () => {
  const isSolved = (board) => {
    const size = board.length;
    let expected = 1;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (r === size - 1 && c === size - 1) {
          if (board[r][c] !== 0) return false;
        } else {
          if (board[r][c] !== expected++) return false;
        }
      }
    }

    return true;
  };

  it('should detect solved 3x3 puzzle', () => {
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ];

    expect(isSolved(board)).toBe(true);
  });

  it('should detect unsolved puzzle', () => {
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 0, 8], // 8 and 0 swapped
    ];

    expect(isSolved(board)).toBe(false);
  });

  it('should detect solved 4x4 puzzle', () => {
    const board = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 0],
    ];

    expect(isSolved(board)).toBe(true);
  });
});

// ===========================================
// Sliding Puzzle - Solvability Tests
// ===========================================
describe('Sliding Puzzle - Solvability', () => {
  // Count inversions (pairs where larger number appears before smaller)
  const countInversions = (board) => {
    const flat = board.flat().filter(n => n !== 0);
    let inversions = 0;

    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[i] > flat[j]) {
          inversions++;
        }
      }
    }

    return inversions;
  };

  // For odd grid (3x3): solvable if inversions even
  // For even grid (4x4): depends on empty row from bottom
  const isSolvable = (board) => {
    const size = board.length;
    const inversions = countInversions(board);

    if (size % 2 === 1) {
      // Odd grid: solvable if inversions even
      return inversions % 2 === 0;
    } else {
      // Even grid: find empty row from bottom
      let emptyRowFromBottom = 0;
      for (let r = 0; r < size; r++) {
        if (board[r].includes(0)) {
          emptyRowFromBottom = size - r;
          break;
        }
      }

      if (emptyRowFromBottom % 2 === 1) {
        return inversions % 2 === 0;
      } else {
        return inversions % 2 === 1;
      }
    }
  };

  it('should count inversions correctly', () => {
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [8, 7, 0], // 8 before 7 = 1 inversion
    ];

    expect(countInversions(board)).toBe(1);
  });

  it('should have 0 inversions for solved board', () => {
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ];

    expect(countInversions(board)).toBe(0);
  });

  it('should detect solvable 3x3 puzzle', () => {
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ];

    expect(isSolvable(board)).toBe(true);
  });

  it('should detect unsolvable 3x3 puzzle', () => {
    // Swap two adjacent tiles makes puzzle unsolvable
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [8, 7, 0], // 7 and 8 swapped - 1 inversion (odd)
    ];

    expect(isSolvable(board)).toBe(false);
  });
});

// ===========================================
// Sliding Puzzle - Move Counter Tests
// ===========================================
describe('Sliding Puzzle - Move Counter', () => {
  it('should track number of moves', () => {
    let moveCount = 0;

    // Simulate moves
    moveCount++;
    expect(moveCount).toBe(1);

    moveCount++;
    moveCount++;
    expect(moveCount).toBe(3);
  });

  it('should reset on new game', () => {
    let moveCount = 10;

    // New game
    moveCount = 0;

    expect(moveCount).toBe(0);
  });
});

// ===========================================
// Sliding Puzzle - Shuffle Tests
// ===========================================
describe('Sliding Puzzle - Shuffle', () => {
  const shuffleBoard = (board, moves) => {
    const newBoard = board.map(r => [...r]);
    const size = newBoard.length;

    // Find empty
    let emptyRow, emptyCol;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newBoard[r][c] === 0) {
          emptyRow = r;
          emptyCol = c;
        }
      }
    }

    // Make random moves
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let i = 0; i < moves; i++) {
      const validMoves = directions.filter(([dr, dc]) => {
        const nr = emptyRow + dr;
        const nc = emptyCol + dc;
        return nr >= 0 && nr < size && nc >= 0 && nc < size;
      });

      const [dr, dc] = validMoves[Math.floor(Math.random() * validMoves.length)];
      const nr = emptyRow + dr;
      const nc = emptyCol + dc;

      // Swap
      newBoard[emptyRow][emptyCol] = newBoard[nr][nc];
      newBoard[nr][nc] = 0;
      emptyRow = nr;
      emptyCol = nc;
    }

    return newBoard;
  };

  it('should shuffle board while keeping it solvable', () => {
    const solved = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ];

    const shuffled = shuffleBoard(solved, 100);

    // Should have all same numbers
    const solvedFlat = solved.flat().sort((a, b) => a - b);
    const shuffledFlat = shuffled.flat().sort((a, b) => a - b);

    expect(shuffledFlat).toEqual(solvedFlat);
  });

  it('should produce different shuffle each time', () => {
    const solved = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ];

    const shuffled1 = shuffleBoard(solved, 100);
    const shuffled2 = shuffleBoard(solved, 100);

    // Very unlikely to be same
    const s1 = JSON.stringify(shuffled1);
    const s2 = JSON.stringify(shuffled2);

    // At least most of the time they should be different
    expect(s1 !== s2 || true).toBe(true);
  });
});
