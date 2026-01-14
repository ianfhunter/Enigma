/**
 * Chess utility functions for FEN parsing, move validation, etc.
 */

// Piece symbols for display
export const PIECE_SYMBOLS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

// Unicode pieces for cleaner display
export const PIECE_CHARS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

// Parse FEN string into board state
export function parseFEN(fen) {
  const parts = fen.split(' ');
  const position = parts[0];
  const turn = parts[1] || 'w';
  const castling = parts[2] || '-';
  const enPassant = parts[3] || '-';
  const halfMove = parseInt(parts[4]) || 0;
  const fullMove = parseInt(parts[5]) || 1;

  const board = [];
  const rows = position.split('/');

  for (let i = 0; i < 8; i++) {
    const row = [];
    const fenRow = rows[i];

    for (const char of fenRow) {
      if (/[1-8]/.test(char)) {
        // Empty squares
        for (let j = 0; j < parseInt(char); j++) {
          row.push(null);
        }
      } else {
        row.push(char);
      }
    }
    board.push(row);
  }

  return { board, turn, castling, enPassant, halfMove, fullMove };
}

// Convert board state to FEN string
export function toFEN(boardState) {
  const { board, turn, castling, enPassant, halfMove, fullMove } = boardState;

  let fen = '';

  for (let i = 0; i < 8; i++) {
    let emptyCount = 0;
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        fen += piece;
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    if (i < 7) fen += '/';
  }

  return `${fen} ${turn} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
}

// Convert algebraic notation (e.g., "e2") to board indices
export function algebraicToIndex(square) {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(square[1]);
  return { row, col };
}

// Convert board indices to algebraic notation
export function indexToAlgebraic(row, col) {
  const colChar = String.fromCharCode('a'.charCodeAt(0) + col);
  const rowNum = 8 - row;
  return `${colChar}${rowNum}`;
}

// Parse UCI move (e.g., "e2e4") into from/to squares
export function parseUCIMove(move) {
  const from = move.substring(0, 2);
  const to = move.substring(2, 4);
  const promotion = move.length > 4 ? move[4] : null;
  return { from, to, promotion };
}

// Check if a piece is white
export function isWhite(piece) {
  return piece !== null && piece === piece.toUpperCase();
}

// Check if a piece is black
export function isBlack(piece) {
  return piece !== null && piece === piece.toLowerCase();
}

// Get the color of a piece
export function getPieceColor(piece) {
  if (piece === null) return null;
  return isWhite(piece) ? 'white' : 'black';
}

// Simple move validation (does not check for check/checkmate)
export function isValidMove(boardState, from, to) {
  const { board, turn } = boardState;
  const fromIdx = algebraicToIndex(from);
  const toIdx = algebraicToIndex(to);

  const piece = board[fromIdx.row][fromIdx.col];
  const target = board[toIdx.row][toIdx.col];

  // Must have a piece to move
  if (piece === null) return false;

  // Must be the right color's turn
  const pieceColor = getPieceColor(piece);
  if ((turn === 'w' && pieceColor !== 'white') ||
      (turn === 'b' && pieceColor !== 'black')) {
    return false;
  }

  // Can't capture own piece
  if (target !== null && getPieceColor(target) === pieceColor) {
    return false;
  }

  return true;
}

// Apply a move to the board
export function applyMove(boardState, move) {
  const { from, to, promotion } = parseUCIMove(move);
  const fromIdx = algebraicToIndex(from);
  const toIdx = algebraicToIndex(to);

  // Deep copy the board
  const newBoard = boardState.board.map(row => [...row]);
  const piece = newBoard[fromIdx.row][fromIdx.col];

  // Handle promotion
  let movedPiece = piece;
  if (promotion) {
    movedPiece = boardState.turn === 'w' ? promotion.toUpperCase() : promotion.toLowerCase();
  }

  // Handle castling
  if (piece && piece.toLowerCase() === 'k') {
    const colDiff = toIdx.col - fromIdx.col;
    if (Math.abs(colDiff) === 2) {
      // Castling
      if (colDiff > 0) {
        // Kingside
        newBoard[fromIdx.row][5] = newBoard[fromIdx.row][7];
        newBoard[fromIdx.row][7] = null;
      } else {
        // Queenside
        newBoard[fromIdx.row][3] = newBoard[fromIdx.row][0];
        newBoard[fromIdx.row][0] = null;
      }
    }
  }

  // Handle en passant
  if (piece && piece.toLowerCase() === 'p' && boardState.enPassant === to) {
    const captureRow = boardState.turn === 'w' ? toIdx.row + 1 : toIdx.row - 1;
    newBoard[captureRow][toIdx.col] = null;
  }

  // Move the piece
  newBoard[toIdx.row][toIdx.col] = movedPiece;
  newBoard[fromIdx.row][fromIdx.col] = null;

  // Calculate new en passant square
  let newEnPassant = '-';
  if (piece && piece.toLowerCase() === 'p' && Math.abs(fromIdx.row - toIdx.row) === 2) {
    const epRow = boardState.turn === 'w' ? fromIdx.row - 1 : fromIdx.row + 1;
    newEnPassant = indexToAlgebraic(epRow, fromIdx.col);
  }

  // Update castling rights
  let newCastling = boardState.castling;
  if (piece === 'K') newCastling = newCastling.replace(/[KQ]/g, '');
  if (piece === 'k') newCastling = newCastling.replace(/[kq]/g, '');
  if (from === 'h1' || to === 'h1') newCastling = newCastling.replace('K', '');
  if (from === 'a1' || to === 'a1') newCastling = newCastling.replace('Q', '');
  if (from === 'h8' || to === 'h8') newCastling = newCastling.replace('k', '');
  if (from === 'a8' || to === 'a8') newCastling = newCastling.replace('q', '');
  if (newCastling === '') newCastling = '-';

  return {
    board: newBoard,
    turn: boardState.turn === 'w' ? 'b' : 'w',
    castling: newCastling,
    enPassant: newEnPassant,
    halfMove: boardState.halfMove + 1,
    fullMove: boardState.turn === 'b' ? boardState.fullMove + 1 : boardState.fullMove,
  };
}

// Check if the king of the given color is in check
export function isInCheck(board, color) {
  // Find the king
  let kingRow = -1, kingCol = -1;
  const kingPiece = color === 'white' ? 'K' : 'k';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingPiece) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== -1) break;
  }

  if (kingRow === -1) return false;

  // Check if any enemy piece attacks the king
  return isSquareAttacked(board, kingRow, kingCol, color === 'white' ? 'black' : 'white');
}

// Check if a square is attacked by pieces of the given color
export function isSquareAttacked(board, row, col, attackerColor) {
  const isAttackerWhite = attackerColor === 'white';

  // Check knight attacks
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightMoves) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c];
      if (piece && piece.toLowerCase() === 'n' && isWhite(piece) === isAttackerWhite) {
        return true;
      }
    }
  }

  // Check pawn attacks
  const pawnDir = isAttackerWhite ? 1 : -1;
  for (const dc of [-1, 1]) {
    const r = row + pawnDir, c = col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c];
      if (piece && piece.toLowerCase() === 'p' && isWhite(piece) === isAttackerWhite) {
        return true;
      }
    }
  }

  // Check king attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const piece = board[r][c];
        if (piece && piece.toLowerCase() === 'k' && isWhite(piece) === isAttackerWhite) {
          return true;
        }
      }
    }
  }

  // Check sliding pieces (rook, bishop, queen)
  const directions = {
    rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  };

  for (const [dr, dc] of directions.rook) {
    for (let i = 1; i < 8; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      const piece = board[r][c];
      if (piece) {
        if (isWhite(piece) === isAttackerWhite &&
            (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q')) {
          return true;
        }
        break;
      }
    }
  }

  for (const [dr, dc] of directions.bishop) {
    for (let i = 1; i < 8; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      const piece = board[r][c];
      if (piece) {
        if (isWhite(piece) === isAttackerWhite &&
            (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q')) {
          return true;
        }
        break;
      }
    }
  }

  return false;
}

