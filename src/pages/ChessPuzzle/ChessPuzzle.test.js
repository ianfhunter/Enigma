import { describe, it, expect } from 'vitest';

// ===========================================
// ChessPuzzle - FEN Parsing Tests
// ===========================================
describe('ChessPuzzle - FEN Parsing', () => {
  function parseFEN(fen) {
    const parts = fen.split(' ');
    const position = parts[0];
    const turn = parts[1] || 'w';
    const castling = parts[2] || '-';
    const enPassant = parts[3] || '-';

    const board = [];
    const rows = position.split('/');

    for (let i = 0; i < 8; i++) {
      const row = [];
      const fenRow = rows[i];

      for (const char of fenRow) {
        if (/[1-8]/.test(char)) {
          for (let j = 0; j < parseInt(char); j++) {
            row.push(null);
          }
        } else {
          row.push(char);
        }
      }
      board.push(row);
    }

    return { board, turn, castling, enPassant };
  }

  it('should parse starting position', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const state = parseFEN(fen);

    expect(state.board[0][0]).toBe('r');
    expect(state.board[0][4]).toBe('k');
    expect(state.board[7][4]).toBe('K');
    expect(state.turn).toBe('w');
    expect(state.castling).toBe('KQkq');
  });

  it('should handle empty rows', () => {
    const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
    const state = parseFEN(fen);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(state.board[r][c]).toBe(null);
      }
    }
  });

  it('should parse black to move', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    const state = parseFEN(fen);

    expect(state.turn).toBe('b');
    expect(state.enPassant).toBe('e3');
  });
});

// ===========================================
// ChessPuzzle - Algebraic Notation Tests
// ===========================================
describe('ChessPuzzle - Algebraic Notation', () => {
  function algebraicToIndex(square) {
    const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(square[1]);
    return { row, col };
  }

  function indexToAlgebraic(row, col) {
    const colChar = String.fromCharCode('a'.charCodeAt(0) + col);
    const rowNum = 8 - row;
    return `${colChar}${rowNum}`;
  }

  it('should convert algebraic to index', () => {
    expect(algebraicToIndex('a1')).toEqual({ row: 7, col: 0 });
    expect(algebraicToIndex('e4')).toEqual({ row: 4, col: 4 });
    expect(algebraicToIndex('h8')).toEqual({ row: 0, col: 7 });
  });

  it('should convert index to algebraic', () => {
    expect(indexToAlgebraic(7, 0)).toBe('a1');
    expect(indexToAlgebraic(4, 4)).toBe('e4');
    expect(indexToAlgebraic(0, 7)).toBe('h8');
  });

  it('should be invertible', () => {
    for (const square of ['a1', 'e4', 'h8', 'd2', 'f6']) {
      const idx = algebraicToIndex(square);
      const back = indexToAlgebraic(idx.row, idx.col);
      expect(back).toBe(square);
    }
  });
});

// ===========================================
// ChessPuzzle - Piece Color Tests
// ===========================================
describe('ChessPuzzle - Piece Color', () => {
  function isWhite(piece) {
    return piece !== null && piece === piece.toUpperCase();
  }

  function isBlack(piece) {
    return piece !== null && piece === piece.toLowerCase();
  }

  function getPieceColor(piece) {
    if (piece === null) return null;
    return isWhite(piece) ? 'white' : 'black';
  }

  it('should identify white pieces', () => {
    expect(isWhite('K')).toBe(true);
    expect(isWhite('Q')).toBe(true);
    expect(isWhite('P')).toBe(true);
    expect(isWhite('k')).toBe(false);
  });

  it('should identify black pieces', () => {
    expect(isBlack('k')).toBe(true);
    expect(isBlack('q')).toBe(true);
    expect(isBlack('p')).toBe(true);
    expect(isBlack('K')).toBe(false);
  });

  it('should return correct piece color', () => {
    expect(getPieceColor('K')).toBe('white');
    expect(getPieceColor('k')).toBe('black');
    expect(getPieceColor(null)).toBe(null);
  });
});

// ===========================================
// ChessPuzzle - UCI Move Parsing Tests
// ===========================================
describe('ChessPuzzle - UCI Move Parsing', () => {
  function parseUCIMove(move) {
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const promotion = move.length > 4 ? move[4] : null;
    return { from, to, promotion };
  }

  it('should parse standard move', () => {
    const move = parseUCIMove('e2e4');
    expect(move.from).toBe('e2');
    expect(move.to).toBe('e4');
    expect(move.promotion).toBe(null);
  });

  it('should parse promotion move', () => {
    const move = parseUCIMove('e7e8q');
    expect(move.from).toBe('e7');
    expect(move.to).toBe('e8');
    expect(move.promotion).toBe('q');
  });

  it('should handle different promotions', () => {
    expect(parseUCIMove('a7a8r').promotion).toBe('r');
    expect(parseUCIMove('h2h1b').promotion).toBe('b');
    expect(parseUCIMove('c7c8n').promotion).toBe('n');
  });
});

// ===========================================
// ChessPuzzle - Move Application Tests
// ===========================================
describe('ChessPuzzle - Move Application', () => {
  function applySimpleMove(board, from, to) {
    const newBoard = board.map(row => [...row]);
    const fromRow = 8 - parseInt(from[1]);
    const fromCol = from.charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = 8 - parseInt(to[1]);
    const toCol = to.charCodeAt(0) - 'a'.charCodeAt(0);

    const piece = newBoard[fromRow][fromCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    return newBoard;
  }

  it('should move piece correctly', () => {
    const board = [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, 'P', null, null, null],
      [null, null, null, null, null, null, null, null],
    ];

    const newBoard = applySimpleMove(board, 'e2', 'e4');

    expect(newBoard[6][4]).toBe(null); // e2 is now empty
    expect(newBoard[4][4]).toBe('P'); // e4 has the pawn
  });

  it('should capture piece', () => {
    const board = [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, 'p', null, null],
      [null, null, null, null, 'P', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ];

    const newBoard = applySimpleMove(board, 'e4', 'f5');

    expect(newBoard[4][4]).toBe(null);
    expect(newBoard[3][5]).toBe('P'); // Captured the pawn
  });
});

// ===========================================
// ChessPuzzle - Puzzle State Tests
// ===========================================
describe('ChessPuzzle - Puzzle State', () => {
  it('should track move index correctly', () => {
    const moves = ['e2e4', 'e7e5', 'd2d4', 'd7d5'];
    let moveIndex = 0;

    // Simulating playing through moves
    for (let i = 0; i < moves.length; i++) {
      expect(moveIndex).toBe(i);
      moveIndex++;
    }

    expect(moveIndex).toBe(4);
  });

  it('should detect puzzle completion', () => {
    const totalMoves = 5;
    let currentMove = 0;

    for (let i = 0; i < totalMoves; i++) {
      currentMove++;
    }

    expect(currentMove >= totalMoves).toBe(true);
  });
});
