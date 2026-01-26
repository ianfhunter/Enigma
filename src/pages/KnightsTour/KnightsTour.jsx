import { useTranslation } from 'react-i18next';
import { useState, useCallback, useEffect, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './KnightsTour.module.css';

const KNIGHT_MOVES = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];

// Generate valid knight moves using Warnsdorff's heuristic for solvability check
function getValidMoves(row, col, visited, size) {
  const moves = [];
  for (const [dr, dc] of KNIGHT_MOVES) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
      moves.push([nr, nc]);
    }
  }
  return moves;
}

// Count onward moves (Warnsdorff's heuristic)
function countOnwardMoves(row, col, visited, size) {
  return getValidMoves(row, col, visited, size).length;
}

// Check if a tour is possible from starting position using Warnsdorff's algorithm
function canCompleteTour(startRow, startCol, size) {
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  visited[startRow][startCol] = true;
  let row = startRow, col = startCol;
  let moves = 1;

  while (moves < size * size) {
    const validMoves = getValidMoves(row, col, visited, size);
    if (validMoves.length === 0) return false;

    // Sort by Warnsdorff's heuristic (fewest onward moves first)
    validMoves.sort((a, b) => {
      const countA = countOnwardMoves(a[0], a[1], visited, size);
      const countB = countOnwardMoves(b[0], b[1], visited, size);
      return countA - countB;
    });

    [row, col] = validMoves[0];
    visited[row][col] = true;
    moves++;
  }

  return true;
}

// Generate a random starting position that can complete a tour
function generateStartPosition(size, seed = Date.now()) {
  const random = createSeededRandom(seed);
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const row = Math.floor(random() * size);
    const col = Math.floor(random() * size);
    if (canCompleteTour(row, col, size)) {
      return { row, col };
    }
  }
  // Fallback: corner usually works well
  return { row: 0, col: 0 };
}

export default function KnightsTour() {
  const { t } = useTranslation();
  const [boardSize, setBoardSize] = useState(6);
  const [visited, setVisited] = useState([]);
  const [path, setPath] = useState([]);
  const [knightPos, setKnightPos] = useState(null);
  const [gameStatus, setGameStatus] = useState('setup'); // 'setup', 'playing', 'won', 'stuck'
  const [validMoves, setValidMoves] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [_bestMoves, setBestMoves] = useState({});

  // Initialize a new puzzle
  const initializePuzzle = useCallback((size = boardSize) => {
    const startPos = generateStartPosition(size);
    const newVisited = Array(size).fill(null).map(() => Array(size).fill(false));
    newVisited[startPos.row][startPos.col] = true;

    setVisited(newVisited);
    setPath([{ row: startPos.row, col: startPos.col }]);
    setKnightPos(startPos);
    setGameStatus('playing');
    setMoveCount(1);
    setValidMoves(getValidMoves(startPos.row, startPos.col, newVisited, size));
  }, [boardSize]);

  // Start new puzzle when board size changes
  useEffect(() => {
    initializePuzzle(boardSize);
  }, [boardSize]);

  // Handle square click
  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;
    if (!knightPos) return;

    // Check if it's a valid knight move to an unvisited square
    const isValid = validMoves.some(([r, c]) => r === row && c === col);
    if (!isValid) return;

    // Make the move
    const newVisited = visited.map(r => [...r]);
    newVisited[row][col] = true;

    const newPath = [...path, { row, col }];
    const newPos = { row, col };
    const newMoveCount = moveCount + 1;
    const newValidMoves = getValidMoves(row, col, newVisited, boardSize);

    setVisited(newVisited);
    setPath(newPath);
    setKnightPos(newPos);
    setMoveCount(newMoveCount);
    setValidMoves(newValidMoves);

    // Check win/lose conditions
    const totalSquares = boardSize * boardSize;
    if (newMoveCount === totalSquares) {
      setGameStatus('won');
      setPuzzlesSolved(prev => prev + 1);
      // Track best score
      const key = `size${boardSize}`;
      setBestMoves(prev => ({
        ...prev,
        [key]: Math.max(prev[key] || 0, newMoveCount)
      }));
    } else if (newValidMoves.length === 0) {
      setGameStatus('stuck');
      // Track best score even on failure
      const key = `size${boardSize}`;
      setBestMoves(prev => ({
        ...prev,
        [key]: Math.max(prev[key] || 0, newMoveCount)
      }));
    }
  }, [gameStatus, knightPos, validMoves, visited, path, moveCount, boardSize]);

  // Undo last move
  const undoMove = useCallback(() => {
    if (path.length <= 1) return;

    const newPath = path.slice(0, -1);
    const newVisited = Array(boardSize).fill(null).map(() => Array(boardSize).fill(false));
    newPath.forEach(({ row, col }) => {
      newVisited[row][col] = true;
    });

    const lastPos = newPath[newPath.length - 1];
    setPath(newPath);
    setVisited(newVisited);
    setKnightPos(lastPos);
    setMoveCount(newPath.length);
    setValidMoves(getValidMoves(lastPos.row, lastPos.col, newVisited, boardSize));
    setGameStatus('playing');
  }, [path, boardSize]);

  // Render the board
  const renderBoard = useMemo(() => {
    const squares = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isLight = (row + col) % 2 === 0;
        const isVisited = visited[row]?.[col];
        const isKnight = knightPos?.row === row && knightPos?.col === col;
        const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
        const visitOrder = path.findIndex(p => p.row === row && p.col === col);

        const squareClasses = [
          styles.square,
          isLight ? styles.light : styles.dark,
          isVisited && styles.visited,
          isValidMove && showHints && styles.validMove,
          isKnight && styles.knightSquare,
        ].filter(Boolean).join(' ');

        squares.push(
          <div
            key={`${row}-${col}`}
            className={squareClasses}
            onClick={() => handleSquareClick(row, col)}
          >
            {isKnight && <span className={styles.knight}>♞</span>}
            {isVisited && !isKnight && visitOrder >= 0 && (
              <span className={styles.visitNumber}>{visitOrder + 1}</span>
            )}
          </div>
        );
      }
    }

    return squares;
  }, [boardSize, visited, knightPos, validMoves, path, showHints, handleSquareClick]);

  const totalSquares = boardSize * boardSize;
  const percentComplete = Math.round((moveCount / totalSquares) * 100);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Knight's Tour"
        instructions="Move the knight to visit every square exactly once. The knight moves in an L-shape!"
      />

      <div className={styles.gameArea}>
        {/* Board size selector */}
        <div className={styles.sizeSelector}>
          {[5, 6, 7, 8].map(size => (
            <button
              key={size}
              className={`${styles.sizeBtn} ${boardSize === size ? styles.active : ''}`}
              onClick={() => setBoardSize(size)}
            >
              {size}×{size}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏃</span>
            <span className={styles.statValue}>{moveCount}/{totalSquares}</span>
            <span className={styles.statLabel}>Squares</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>📊</span>
            <span className={styles.statValue}>{percentComplete}%</span>
            <span className={styles.statLabel}>{t('common.complete')}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏆</span>
            <span className={styles.statValue}>{puzzlesSolved}</span>
            <span className={styles.statLabel}>Solved</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Chess board */}
        <div
          className={styles.boardWrapper}
          style={{ '--board-size': boardSize }}
        >
          <div
            className={styles.board}
            style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}
          >
            {renderBoard}
          </div>
        </div>

        {/* Game status */}
        {gameStatus === 'won' && (
          <div className={`${styles.statusMessage} ${styles.success}`}>
            <span className={styles.statusIcon}>🎉</span>
            Perfect! You completed the Knight's Tour!
          </div>
        )}

        {gameStatus === 'stuck' && (
          <div className={`${styles.statusMessage} ${styles.error}`}>
            <span className={styles.statusIcon}>😔</span>
            No more moves! Visited {moveCount} of {totalSquares} squares.
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={styles.undoBtn}
            onClick={undoMove}
            disabled={path.length <= 1 || gameStatus === 'won'}
          >
            ↩️ Undo
          </button>

          <button
            className={`${styles.hintBtn} ${showHints ? styles.active : ''}`}
            onClick={() => setShowHints(!showHints)}
          >
            💡 {showHints ? 'Hide' : 'Show'} Hints
          </button>

          <button
            className={styles.newPuzzleBtn}
            onClick={() => initializePuzzle(boardSize)}
          >
            🔄 New Puzzle
          </button>
        </div>

        {/* Tips */}
        <div className={styles.tips}>
          <div className={styles.tipTitle}>💡 {t('common.tips')}</div>
          <ul className={styles.tipList}>
            <li>{t('knightsTour.tip1')}</li>
            <li>{t('knightsTour.tip2')}</li>
            <li>{t('knightsTour.tip3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
