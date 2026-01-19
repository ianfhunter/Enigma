import { describe, it, expect } from 'vitest';

// ===========================================
// ChessMaze - Piece Attack Tests
// ===========================================
describe('ChessMaze - Piece Attack Patterns', () => {
  function canPieceAttack(pieceType, fromRow, fromCol, toRow, toCol) {
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    switch (pieceType) {
      case 'knight':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
               (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'bishop':
        return Math.abs(dr) === Math.abs(dc) && dr !== 0;
      case 'rook':
        return (dr === 0 || dc === 0) && (dr !== 0 || dc !== 0);
      case 'queen':
        return (Math.abs(dr) === Math.abs(dc) && dr !== 0) ||
               ((dr === 0 || dc === 0) && (dr !== 0 || dc !== 0));
      case 'king':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0);
      case 'pawn':
        return Math.abs(dc) === 1 && dr === 1;
      default:
        return false;
    }
  }

  describe('Knight', () => {
    it('should attack in L-shape', () => {
      expect(canPieceAttack('knight', 4, 4, 2, 3)).toBe(true);
      expect(canPieceAttack('knight', 4, 4, 2, 5)).toBe(true);
      expect(canPieceAttack('knight', 4, 4, 3, 2)).toBe(true);
      expect(canPieceAttack('knight', 4, 4, 6, 5)).toBe(true);
    });

    it('should not attack non-L-shape', () => {
      expect(canPieceAttack('knight', 4, 4, 4, 5)).toBe(false);
      expect(canPieceAttack('knight', 4, 4, 5, 5)).toBe(false);
      expect(canPieceAttack('knight', 4, 4, 6, 6)).toBe(false);
    });
  });

  describe('Bishop', () => {
    it('should attack diagonally', () => {
      expect(canPieceAttack('bishop', 4, 4, 2, 2)).toBe(true);
      expect(canPieceAttack('bishop', 4, 4, 7, 7)).toBe(true);
      expect(canPieceAttack('bishop', 4, 4, 1, 7)).toBe(true);
    });

    it('should not attack straight lines', () => {
      expect(canPieceAttack('bishop', 4, 4, 4, 7)).toBe(false);
      expect(canPieceAttack('bishop', 4, 4, 0, 4)).toBe(false);
    });

    it('should not attack same square', () => {
      expect(canPieceAttack('bishop', 4, 4, 4, 4)).toBe(false);
    });
  });

  describe('Rook', () => {
    it('should attack straight lines', () => {
      expect(canPieceAttack('rook', 4, 4, 4, 7)).toBe(true);
      expect(canPieceAttack('rook', 4, 4, 0, 4)).toBe(true);
    });

    it('should not attack diagonally', () => {
      expect(canPieceAttack('rook', 4, 4, 6, 6)).toBe(false);
      expect(canPieceAttack('rook', 4, 4, 2, 2)).toBe(false);
    });
  });

  describe('Queen', () => {
    it('should attack diagonally', () => {
      expect(canPieceAttack('queen', 4, 4, 2, 2)).toBe(true);
      expect(canPieceAttack('queen', 4, 4, 7, 7)).toBe(true);
    });

    it('should attack straight lines', () => {
      expect(canPieceAttack('queen', 4, 4, 4, 7)).toBe(true);
      expect(canPieceAttack('queen', 4, 4, 0, 4)).toBe(true);
    });
  });

  describe('King', () => {
    it('should attack adjacent squares', () => {
      expect(canPieceAttack('king', 4, 4, 3, 3)).toBe(true);
      expect(canPieceAttack('king', 4, 4, 3, 4)).toBe(true);
      expect(canPieceAttack('king', 4, 4, 4, 5)).toBe(true);
    });

    it('should not attack distant squares', () => {
      expect(canPieceAttack('king', 4, 4, 2, 4)).toBe(false);
      expect(canPieceAttack('king', 4, 4, 6, 6)).toBe(false);
    });
  });
});

// ===========================================
// ChessMaze - Square Attack Detection Tests
// ===========================================
describe('ChessMaze - Square Attack Detection', () => {
  function canPieceAttack(pieceType, fromRow, fromCol, toRow, toCol) {
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    switch (pieceType) {
      case 'knight':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
               (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'bishop':
        return Math.abs(dr) === Math.abs(dc) && dr !== 0;
      case 'rook':
        return (dr === 0 || dc === 0) && (dr !== 0 || dc !== 0);
      case 'queen':
        return (Math.abs(dr) === Math.abs(dc) && dr !== 0) ||
               ((dr === 0 || dc === 0) && (dr !== 0 || dc !== 0));
      case 'king':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0);
      default:
        return false;
    }
  }

  function isSquareAttacked(row, col, enemies, size) {
    for (const enemy of enemies) {
      if (canPieceAttack(enemy.type, enemy.row, enemy.col, row, col)) {
        return true;
      }
    }
    return false;
  }

  it('should detect knight attack', () => {
    const enemies = [{ type: 'knight', row: 4, col: 4 }];
    expect(isSquareAttacked(2, 3, enemies, 8)).toBe(true);
    expect(isSquareAttacked(0, 0, enemies, 8)).toBe(false);
  });

  it('should detect multiple attackers', () => {
    const enemies = [
      { type: 'rook', row: 0, col: 0 },
      { type: 'bishop', row: 7, col: 7 },
    ];
    expect(isSquareAttacked(0, 5, enemies, 8)).toBe(true); // Attacked by rook
    expect(isSquareAttacked(5, 5, enemies, 8)).toBe(true); // Attacked by bishop
    expect(isSquareAttacked(3, 5, enemies, 8)).toBe(false); // Safe
  });
});

// ===========================================
// ChessMaze - Pathfinding Tests
// ===========================================
describe('ChessMaze - Pathfinding', () => {
  const PIECE_MOVES = {
    knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    king: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
  };

  function getValidMoves(pieceType, row, col, size, enemies) {
    const moves = [];
    const pattern = PIECE_MOVES[pieceType];

    if (!pattern) return moves;

    for (const [dr, dc] of pattern) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        // Check if square has enemy
        const hasEnemy = enemies.some(e => e.row === nr && e.col === nc);
        if (!hasEnemy) {
          moves.push([nr, nc]);
        }
      }
    }

    return moves;
  }

  it('should find knight moves on empty board', () => {
    const moves = getValidMoves('knight', 4, 4, 8, []);
    expect(moves.length).toBe(8); // All 8 L-moves
  });

  it('should find king moves on empty board', () => {
    const moves = getValidMoves('king', 4, 4, 8, []);
    expect(moves.length).toBe(8); // All 8 adjacent squares
  });

  it('should not allow moves to enemy squares', () => {
    const enemies = [{ type: 'rook', row: 2, col: 3 }];
    const moves = getValidMoves('knight', 4, 4, 8, enemies);
    expect(moves.some(([r, c]) => r === 2 && c === 3)).toBe(false);
  });

  it('should handle edge positions', () => {
    const moves = getValidMoves('knight', 0, 0, 8, []);
    expect(moves.length).toBe(2); // Only 2 valid L-moves from corner
  });
});

// ===========================================
// ChessMaze - BFS Shortest Path Tests
// ===========================================
describe('ChessMaze - BFS Shortest Path', () => {
  function findShortestPath(start, goal, size) {
    // Simplified knight pathfinding on empty board
    const moves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    const queue = [[start.row, start.col, 0]];
    const visited = new Set();
    visited.add(`${start.row}-${start.col}`);

    while (queue.length > 0) {
      const [row, col, dist] = queue.shift();

      if (row === goal.row && col === goal.col) {
        return dist;
      }

      for (const [dr, dc] of moves) {
        const nr = row + dr;
        const nc = col + dc;
        const key = `${nr}-${nc}`;

        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(key)) {
          visited.add(key);
          queue.push([nr, nc, dist + 1]);
        }
      }
    }

    return -1;
  }

  it('should find shortest knight path', () => {
    const dist = findShortestPath({ row: 0, col: 0 }, { row: 1, col: 2 }, 8);
    expect(dist).toBe(1); // Knight can reach in 1 move
  });

  it('should handle unreachable goal', () => {
    const dist = findShortestPath({ row: 0, col: 0 }, { row: 0, col: 1 }, 2);
    expect(dist).toBe(-1); // 2x2 board - knight can't reach adjacent square
  });

  it('should return 0 for same start and goal', () => {
    const dist = findShortestPath({ row: 4, col: 4 }, { row: 4, col: 4 }, 8);
    expect(dist).toBe(0);
  });
});
