import { useTranslation } from 'react-i18next';
import { useState, useCallback, useEffect, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import { useGameState } from '../../hooks/useGameState';
import styles from './ChessMaze.module.css';

const PIECE_CHARS = {
  N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
  n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

// Movement patterns for each piece type
const PIECE_MOVES = {
  knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
  bishop: 'diagonal',
  rook: 'straight',
  queen: 'both',
  king: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
};

// Check if a square has an enemy piece on it
function hasEnemyPiece(row, col, enemies) {
  return enemies.some(e => e.row === row && e.col === col);
}

// Get valid moves for a piece
function getValidMoves(pieceType, row, col, size, enemies, _visited) {
  const moves = [];
  const pattern = PIECE_MOVES[pieceType];

  if (Array.isArray(pattern)) {
    // Fixed offset moves (knight, king)
    for (const [dr, dc] of pattern) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        // Check if square is safe (not attacked by enemy) AND doesn't have an enemy piece
        if (!isSquareAttacked(nr, nc, enemies, size) && !hasEnemyPiece(nr, nc, enemies)) {
          moves.push([nr, nc]);
        }
      }
    }
  } else {
    // Sliding pieces
    const directions = [];
    if (pattern === 'diagonal' || pattern === 'both') {
      directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (pattern === 'straight' || pattern === 'both') {
      directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of directions) {
      for (let i = 1; i < size; i++) {
        const nr = row + dr * i;
        const nc = col + dc * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;

        // Check if blocked by enemy piece
        const blocked = hasEnemyPiece(nr, nc, enemies);
        if (blocked) break;

        if (!isSquareAttacked(nr, nc, enemies, size)) {
          moves.push([nr, nc]);
        }
      }
    }
  }

  return moves;
}

// Check if a square is attacked by any enemy piece
function isSquareAttacked(row, col, enemies, size) {
  for (const enemy of enemies) {
    if (canPieceAttack(enemy.type, enemy.row, enemy.col, row, col, size)) {
      return true;
    }
  }
  return false;
}

// Check if a piece at (fromRow, fromCol) can attack (toRow, toCol)
function canPieceAttack(pieceType, fromRow, fromCol, toRow, toCol, _size) {
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
      return Math.abs(dc) === 1 && dr === 1; // Pawns attack diagonally forward (assuming black pawns going down)
    default:
      return false;
  }
}

// Get all attacked squares by enemies (for visualization)
function getAttackedSquares(enemies, size) {
  const attacked = new Set();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isSquareAttacked(r, c, enemies, size)) {
        attacked.add(`${r}-${c}`);
      }
    }
  }
  return attacked;
}

// BFS to check if puzzle is solvable and get minimum moves
function findShortestPath(pieceType, start, goal, enemies, size) {
  const queue = [[start.row, start.col, 0]];
  const visited = new Set();
  visited.add(`${start.row}-${start.col}`);

  while (queue.length > 0) {
    const [row, col, moves] = queue.shift();

    if (row === goal.row && col === goal.col) {
      return moves;
    }

    const validMoves = getValidMoves(pieceType, row, col, size, enemies, visited);
    for (const [nr, nc] of validMoves) {
      const key = `${nr}-${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }

  return -1; // No path found
}

// Generate a solvable puzzle - keeps trying until it finds one
function generatePuzzle(pieceType, size, difficulty) {
  const maxAttempts = 500;
  let bestPuzzle = null;
  let bestScore = -Infinity;

  // Target enemy count based on difficulty
  const targetEnemies = Math.floor(difficulty / 2) + 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Random start and goal positions
    const start = {
      row: Math.floor(Math.random() * size),
      col: Math.floor(Math.random() * 2), // Start on left side
    };
    const goal = {
      row: Math.floor(Math.random() * size),
      col: size - 1 - Math.floor(Math.random() * 2), // Goal on right side
    };

    // Start with no enemies and add them one by one, checking solvability each time
    const enemyTypes = ['rook', 'bishop', 'knight'];
    if (difficulty >= 5) enemyTypes.push('queen');

    const enemies = [];
    const maxEnemies = targetEnemies + Math.floor(Math.random() * 3);

    // Build up enemies incrementally, ensuring puzzle stays solvable
    for (let i = 0; i < maxEnemies; i++) {
      let placed = false;

      for (let tries = 0; tries < 30 && !placed; tries++) {
        const er = Math.floor(Math.random() * size);
        const ec = Math.floor(Math.random() * size);

        // Skip if position is taken or too close to start/goal
        if ((er === start.row && ec === start.col) ||
            (er === goal.row && ec === goal.col) ||
            enemies.some(e => e.row === er && e.col === ec) ||
            (Math.abs(er - start.row) <= 1 && Math.abs(ec - start.col) <= 1)) {
          continue;
        }

        const newEnemy = {
          type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
          row: er,
          col: ec,
        };

        // Test if puzzle is still solvable with this enemy
        const testEnemies = [...enemies, newEnemy];
        const testPath = findShortestPath(pieceType, start, goal, testEnemies, size);

        if (testPath > 0) {
          enemies.push(newEnemy);
          placed = true;
        }
      }
    }

    // Calculate final path length
    const minMoves = findShortestPath(pieceType, start, goal, enemies, size);

    if (minMoves > 0 && enemies.length >= 2) {
      // Score based on how interesting the puzzle is
      const score = enemies.length * 10 + minMoves * 5;

      if (score > bestScore) {
        bestScore = score;
        bestPuzzle = { start, goal, enemies, minMoves };
      }

      // Good enough - return early if we found a solid puzzle
      if (minMoves >= 4 && enemies.length >= targetEnemies) {
        return { start, goal, enemies, minMoves };
      }
    }
  }

  // Return best puzzle found (guaranteed to be solvable since we built it incrementally)
  if (bestPuzzle) {
    return bestPuzzle;
  }

  // Ultimate fallback: empty puzzle (always solvable)
  const start = { row: 0, col: 0 };
  const goal = { row: size - 1, col: size - 1 };
  return {
    start,
    goal,
    enemies: [],
    minMoves: findShortestPath(pieceType, start, goal, [], size) || size,
  };
}

const PIECE_TYPES = [
  { id: 'knight', label: 'Knight', icon: '♘' },
  { id: 'bishop', label: 'Bishop', icon: '♗' },
  { id: 'rook', label: 'Rook', icon: '♖' },
  { id: 'queen', label: 'Queen', icon: '♕' },
  { id: 'king', label: 'King', icon: '♔' },
];

const DIFFICULTIES = {
  easy: { size: 6, difficulty: 3, label: 'Easy' },
  medium: { size: 7, difficulty: 5, label: 'Medium' },
  hard: { size: 8, difficulty: 7, label: 'Hard' },
};

export default function ChessMaze() {
  const [pieceType, setPieceType] = useState('knight');
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [puzzle, setPuzzle] = useState(null);
  const [playerPos, setPlayerPos] = useState(null);
  const [path, setPath] = useState([]);
  const { gameState: gameStatus, checkWin, reset: resetGameState, isPlaying, isWon } = useGameState();
  const [moveCount, setMoveCount] = useState(0);
  const [validMoves, setValidMoves] = useState([]);
  const [showDanger, setShowDanger] = useState(false);
  const [showMoves, setShowMoves] = useState(true);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);

  const { size, difficulty: _difficulty } = DIFFICULTIES[difficultyLevel];

  // Initialize puzzle
  const initializePuzzle = useCallback((piece = pieceType, diff = difficultyLevel) => {
    const { size: newSize, difficulty: newDiff } = DIFFICULTIES[diff];
    const newPuzzle = generatePuzzle(piece, newSize, newDiff);
    setPuzzle(newPuzzle);
    setPlayerPos(newPuzzle.start);
    setPath([newPuzzle.start]);
    setMoveCount(0);
    resetGameState();
    setValidMoves(getValidMoves(piece, newPuzzle.start.row, newPuzzle.start.col, newSize, newPuzzle.enemies, new Set()));
  }, [pieceType, difficultyLevel, resetGameState]);

  useEffect(() => {
    initializePuzzle();
  }, []);

  // Handle square click
  const handleSquareClick = useCallback((row, col) => {
    if (!isPlaying || !puzzle) return;

    // Check if it's a valid move
    const isValid = validMoves.some(([r, c]) => r === row && c === col);
    if (!isValid) return;

    const newPos = { row, col };
    const newPath = [...path, newPos];
    const newMoveCount = moveCount + 1;

    setPlayerPos(newPos);
    setPath(newPath);
    setMoveCount(newMoveCount);

    // Check win condition
    if (row === puzzle.goal.row && col === puzzle.goal.col) {
      checkWin(true);
      setPuzzlesSolved(prev => prev + 1);
      setValidMoves([]);
    } else {
      setValidMoves(getValidMoves(pieceType, row, col, size, puzzle.enemies, new Set()));
    }
  }, [isPlaying, puzzle, validMoves, path, moveCount, pieceType, size, checkWin]);

  // Undo last move
  const undoMove = useCallback(() => {
    if (path.length <= 1) return;

    const newPath = path.slice(0, -1);
    const lastPos = newPath[newPath.length - 1];

    setPath(newPath);
    setPlayerPos(lastPos);
    setMoveCount(newPath.length - 1);
    resetGameState();
    setValidMoves(getValidMoves(pieceType, lastPos.row, lastPos.col, size, puzzle.enemies, new Set()));
  }, [path, pieceType, size, puzzle, resetGameState]);

  // Handle piece type change
  const handlePieceChange = useCallback((newPiece) => {
    setPieceType(newPiece);
    initializePuzzle(newPiece, difficultyLevel);
  }, [initializePuzzle, difficultyLevel]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDiff) => {
    setDifficultyLevel(newDiff);
    initializePuzzle(pieceType, newDiff);
  }, [initializePuzzle, pieceType]);

  // Computed values
  const attackedSquares = useMemo(() => {
    if (!puzzle) return new Set();
    return getAttackedSquares(puzzle.enemies, size);
  }, [puzzle, size]);

  // Render the board
  const renderBoard = useMemo(() => {
    if (!puzzle) return null;
    const squares = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isLight = (row + col) % 2 === 0;
        const isPlayer = playerPos?.row === row && playerPos?.col === col;
        const isGoal = puzzle.goal.row === row && puzzle.goal.col === col;
        const isStart = puzzle.start.row === row && puzzle.start.col === col;
        const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
        const isAttacked = showDanger && attackedSquares.has(`${row}-${col}`);
        const enemy = puzzle.enemies.find(e => e.row === row && e.col === col);
        const isOnPath = path.some((p, i) => i < path.length - 1 && p.row === row && p.col === col);

        const squareClasses = [
          styles.square,
          isLight ? styles.light : styles.dark,
          isAttacked && !isPlayer && !enemy && styles.danger,
          isValidMove && showMoves && styles.validMove,
          isGoal && !isPlayer && styles.goal,
          isOnPath && styles.pathSquare,
        ].filter(Boolean).join(' ');

        squares.push(
          <div
            key={`${row}-${col}`}
            className={squareClasses}
            onClick={() => handleSquareClick(row, col)}
          >
            {isPlayer && (
              <span className={styles.playerPiece}>
                {PIECE_CHARS[pieceType === 'knight' ? 'N' : pieceType === 'bishop' ? 'B' : pieceType === 'rook' ? 'R' : pieceType === 'queen' ? 'Q' : 'K']}
              </span>
            )}
            {enemy && !isPlayer && (
              <span className={styles.enemyPiece}>
                {PIECE_CHARS[enemy.type === 'knight' ? 'n' : enemy.type === 'bishop' ? 'b' : enemy.type === 'rook' ? 'r' : enemy.type === 'queen' ? 'q' : 'k']}
              </span>
            )}
            {isGoal && !isPlayer && !enemy && (
              <span className={styles.goalMarker}>⭐</span>
            )}
            {isStart && !isPlayer && (
              <span className={styles.startMarker}>○</span>
            )}
          </div>
        );
      }
    }

    return squares;
  }, [puzzle, size, playerPos, validMoves, attackedSquares, path, showDanger, showMoves, pieceType, handleSquareClick]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Chess Maze"
        instructions="Navigate your piece to the star without being captured!"
      />

      <div className={styles.gameArea}>
        {/* Piece selector */}
        <div className={styles.pieceSelector}>
          {PIECE_TYPES.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`${styles.pieceBtn} ${pieceType === id ? styles.active : ''}`}
              onClick={() => handlePieceChange(id)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Difficulty selector */}
        <div className={styles.difficultySelector}>
          {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
            <button
              key={key}
              className={`${styles.difficultyBtn} ${difficultyLevel === key ? styles.active : ''}`}
              onClick={() => handleDifficultyChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏃</span>
            <span className={styles.statValue}>{moveCount}</span>
            <span className={styles.statLabel}>Moves</span>
          </div>
          {puzzle && (
            <div className={styles.stat}>
              <span className={styles.statIcon}>🎯</span>
              <span className={styles.statValue}>{puzzle.minMoves}</span>
              <span className={styles.statLabel}>Par</span>
            </div>
          )}
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏆</span>
            <span className={styles.statValue}>{puzzlesSolved}</span>
            <span className={styles.statLabel}>Solved</span>
          </div>
        </div>

        {/* Board */}
        <div className={styles.boardWrapper} style={{ '--board-size': size }}>
          <div
            className={styles.board}
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {renderBoard}
          </div>
        </div>

        {/* Game status */}
        {isWon && (
          <div className={`${styles.statusMessage} ${styles.success}`}>
            <span className={styles.statusIcon}>🎉</span>
            {moveCount === puzzle?.minMoves
              ? `Perfect! Completed in ${moveCount} moves!`
              : `Escaped in ${moveCount} moves! (Par: ${puzzle?.minMoves})`}
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={styles.undoBtn}
            onClick={undoMove}
            disabled={path.length <= 1 || isWon}
          >
            ↩️ Undo
          </button>

          <button
            className={`${styles.movesBtn} ${showMoves ? styles.active : ''}`}
            onClick={() => setShowMoves(!showMoves)}
          >
            🎯 {showMoves ? 'Hide' : 'Show'} Moves
          </button>

          <button
            className={`${styles.dangerBtn} ${showDanger ? styles.active : ''}`}
            onClick={() => setShowDanger(!showDanger)}
          >
            ⚠️ {showDanger ? 'Hide' : 'Show'} Danger
          </button>

          <button
            className={styles.newPuzzleBtn}
            onClick={() => initializePuzzle()}
          >
            🔄 New Maze
          </button>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>♘</span>
            <span>{t('common.yourPiece')}</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>♞</span>
            <span>Enemy pieces</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>⭐</span>
            <span>Goal</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.dangerColor}`}></span>
            <span>Danger zones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
