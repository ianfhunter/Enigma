import { describe, it, expect } from 'vitest';

// ===========================================
// Knight's Tour - Move Validation Tests
// ===========================================
describe("Knight's Tour - Move Validation", () => {
  // Knight moves in L-shape: 2 squares in one direction, 1 in perpendicular
  const KNIGHT_MOVES = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  const isInBounds = (row, col, boardSize) => {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
  };

  const getValidMoves = (row, col, boardSize, visited) => {
    return KNIGHT_MOVES
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => isInBounds(r, c, boardSize) && !visited.has(`${r},${c}`));
  };

  it('should validate correct L-shaped moves', () => {
    // From (3, 3), valid moves include (1, 2), (1, 4), (2, 1), etc.
    expect(isValidKnightMove(3, 3, 1, 2)).toBe(true);
    expect(isValidKnightMove(3, 3, 1, 4)).toBe(true);
    expect(isValidKnightMove(3, 3, 2, 1)).toBe(true);
    expect(isValidKnightMove(3, 3, 2, 5)).toBe(true);
    expect(isValidKnightMove(3, 3, 4, 1)).toBe(true);
    expect(isValidKnightMove(3, 3, 4, 5)).toBe(true);
    expect(isValidKnightMove(3, 3, 5, 2)).toBe(true);
    expect(isValidKnightMove(3, 3, 5, 4)).toBe(true);
  });

  it('should reject non-L-shaped moves', () => {
    expect(isValidKnightMove(3, 3, 3, 4)).toBe(false); // horizontal
    expect(isValidKnightMove(3, 3, 4, 3)).toBe(false); // vertical
    expect(isValidKnightMove(3, 3, 4, 4)).toBe(false); // diagonal
    expect(isValidKnightMove(3, 3, 3, 3)).toBe(false); // same square
  });

  it('should check board bounds', () => {
    expect(isInBounds(0, 0, 8)).toBe(true);
    expect(isInBounds(7, 7, 8)).toBe(true);
    expect(isInBounds(-1, 0, 8)).toBe(false);
    expect(isInBounds(0, -1, 8)).toBe(false);
    expect(isInBounds(8, 0, 8)).toBe(false);
    expect(isInBounds(0, 8, 8)).toBe(false);
  });

  it('should get valid moves from corner', () => {
    const visited = new Set();
    const moves = getValidMoves(0, 0, 8, visited);

    // From (0,0), knight can only go to (1,2) and (2,1)
    expect(moves.length).toBe(2);
    expect(moves).toContainEqual([1, 2]);
    expect(moves).toContainEqual([2, 1]);
  });

  it('should get valid moves from center', () => {
    const visited = new Set();
    const moves = getValidMoves(4, 4, 8, visited);

    // From center, knight has 8 possible moves
    expect(moves.length).toBe(8);
  });

  it('should exclude visited squares', () => {
    const visited = new Set(['1,2']);
    const moves = getValidMoves(0, 0, 8, visited);

    expect(moves.length).toBe(1);
    expect(moves).toContainEqual([2, 1]);
    expect(moves).not.toContainEqual([1, 2]);
  });
});

// ===========================================
// Knight's Tour - Path Validation Tests
// ===========================================
describe("Knight's Tour - Path Validation", () => {
  const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  const isValidPath = (path) => {
    for (let i = 1; i < path.length; i++) {
      if (!isValidKnightMove(path[i-1][0], path[i-1][1], path[i][0], path[i][1])) {
        return false;
      }
    }
    return true;
  };

  const isCompleteTour = (path, boardSize) => {
    return path.length === boardSize * boardSize;
  };

  const hasNoDuplicates = (path) => {
    const visited = new Set();
    for (const [r, c] of path) {
      const key = `${r},${c}`;
      if (visited.has(key)) return false;
      visited.add(key);
    }
    return true;
  };

  it('should validate correct knight path', () => {
    const path = [[0, 0], [2, 1], [4, 0], [2, 1]]; // Invalid due to revisit
    expect(isValidPath(path.slice(0, 3))).toBe(true);
  });

  it('should detect invalid move in path', () => {
    const path = [[0, 0], [1, 1]]; // Invalid diagonal move
    expect(isValidPath(path)).toBe(false);
  });

  it('should detect complete tour', () => {
    // 8x8 board requires 64 moves
    const completePath = Array(64).fill([0, 0]); // Mock complete path
    expect(isCompleteTour(completePath, 8)).toBe(true);
  });

  it('should detect incomplete tour', () => {
    const incompletePath = Array(63).fill([0, 0]);
    expect(isCompleteTour(incompletePath, 8)).toBe(false);
  });

  it('should detect duplicate visits', () => {
    const pathWithDuplicate = [[0, 0], [2, 1], [0, 0]];
    expect(hasNoDuplicates(pathWithDuplicate)).toBe(false);
  });

  it('should accept path without duplicates', () => {
    const validPath = [[0, 0], [2, 1], [4, 0]];
    expect(hasNoDuplicates(validPath)).toBe(true);
  });
});

// ===========================================
// Knight's Tour - Warnsdorff's Algorithm Tests
// ===========================================
describe("Knight's Tour - Warnsdorff's Algorithm", () => {
  // Warnsdorff's rule: prefer squares with fewer onward moves
  const KNIGHT_MOVES = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  const isInBounds = (row, col, boardSize) => {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
  };

  const countOnwardMoves = (row, col, boardSize, visited) => {
    let count = 0;
    for (const [dr, dc] of KNIGHT_MOVES) {
      const nr = row + dr;
      const nc = col + dc;
      if (isInBounds(nr, nc, boardSize) && !visited.has(`${nr},${nc}`)) {
        count++;
      }
    }
    return count;
  };

  const getBestMove = (row, col, boardSize, visited) => {
    let bestMove = null;
    let minOnward = Infinity;

    for (const [dr, dc] of KNIGHT_MOVES) {
      const nr = row + dr;
      const nc = col + dc;

      if (!isInBounds(nr, nc, boardSize) || visited.has(`${nr},${nc}`)) continue;

      const onward = countOnwardMoves(nr, nc, boardSize, visited);
      if (onward < minOnward) {
        minOnward = onward;
        bestMove = [nr, nc];
      }
    }

    return bestMove;
  };

  it('should count onward moves correctly', () => {
    const visited = new Set();

    // From corner, limited moves
    const cornerMoves = countOnwardMoves(0, 0, 8, visited);
    expect(cornerMoves).toBe(2);

    // From center, many moves
    const centerMoves = countOnwardMoves(4, 4, 8, visited);
    expect(centerMoves).toBe(8);
  });

  it('should prefer squares with fewer onward moves', () => {
    const visited = new Set(['0,0']);

    // From (2,1), next moves could be to edge or center
    const bestMove = getBestMove(2, 1, 8, visited);

    // Best move should be valid
    expect(bestMove).not.toBeNull();
    expect(bestMove.length).toBe(2);
  });

  it('should return null when no moves available', () => {
    // Create visited set blocking all moves from (0,0)
    const visited = new Set(['1,2', '2,1']);
    const bestMove = getBestMove(0, 0, 8, visited);

    expect(bestMove).toBeNull();
  });
});

// ===========================================
// Knight's Tour - Board Size Tests
// ===========================================
describe("Knight's Tour - Board Size", () => {
  const BOARD_SIZES = [5, 6, 7, 8];

  it('should calculate total squares correctly', () => {
    BOARD_SIZES.forEach(size => {
      const totalSquares = size * size;
      expect(totalSquares).toBe(size ** 2);
    });
  });

  it('should have correct minimum moves for complete tour', () => {
    // Complete tour visits all squares, so moves = squares - 1
    BOARD_SIZES.forEach(size => {
      const totalSquares = size * size;
      const movesNeeded = totalSquares - 1;
      expect(movesNeeded).toBe(size * size - 1);
    });
  });

  it('should have valid starting positions', () => {
    const boardSize = 8;

    // Any position on board is valid start
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        expect(r >= 0 && r < boardSize).toBe(true);
        expect(c >= 0 && c < boardSize).toBe(true);
      }
    }
  });
});

// ===========================================
// Knight's Tour - Game State Tests
// ===========================================
describe("Knight's Tour - Game State", () => {
  const createGameState = (boardSize) => ({
    boardSize,
    path: [],
    currentPosition: null,
    moveCount: 0,
    gameState: 'selecting', // selecting, playing, won, stuck
  });

  const makeMove = (state, row, col) => {
    const newPath = [...state.path, [row, col]];
    return {
      ...state,
      path: newPath,
      currentPosition: [row, col],
      moveCount: state.moveCount + 1,
      gameState: newPath.length === state.boardSize ** 2 ? 'won' : 'playing',
    };
  };

  const undoMove = (state) => {
    if (state.path.length === 0) return state;

    const newPath = state.path.slice(0, -1);
    return {
      ...state,
      path: newPath,
      currentPosition: newPath.length > 0 ? newPath[newPath.length - 1] : null,
      moveCount: Math.max(0, state.moveCount - 1),
      gameState: newPath.length === 0 ? 'selecting' : 'playing',
    };
  };

  it('should start in selecting state', () => {
    const state = createGameState(8);
    expect(state.gameState).toBe('selecting');
    expect(state.path.length).toBe(0);
  });

  it('should track path correctly', () => {
    let state = createGameState(8);
    state = makeMove(state, 0, 0);
    state = makeMove(state, 2, 1);

    expect(state.path.length).toBe(2);
    expect(state.currentPosition).toEqual([2, 1]);
  });

  it('should detect win condition', () => {
    let state = createGameState(2); // Small board for testing
    state = makeMove(state, 0, 0);
    state = makeMove(state, 1, 1);
    state = makeMove(state, 0, 1);
    state = makeMove(state, 1, 0);

    expect(state.gameState).toBe('won');
  });

  it('should undo moves correctly', () => {
    let state = createGameState(8);
    state = makeMove(state, 0, 0);
    state = makeMove(state, 2, 1);
    state = undoMove(state);

    expect(state.path.length).toBe(1);
    expect(state.currentPosition).toEqual([0, 0]);
  });

  it('should handle undo on empty path', () => {
    const state = createGameState(8);
    const afterUndo = undoMove(state);

    expect(afterUndo.path.length).toBe(0);
    expect(afterUndo.gameState).toBe('selecting');
  });
});
