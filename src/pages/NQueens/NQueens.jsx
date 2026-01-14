import { useState, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './NQueens.module.css';

// Check if a queen placement is valid
function isValidPlacement(queens, row, col) {
  for (let i = 0; i < queens.length; i++) {
    const [qRow, qCol] = queens[i];
    // Same row or column
    if (qRow === row || qCol === col) return false;
    // Same diagonal
    if (Math.abs(qRow - row) === Math.abs(qCol - col)) return false;
  }
  return true;
}

// Check if any queens are attacking each other
function getAttackingPairs(queens) {
  const attacks = [];
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i];
      const [r2, c2] = queens[j];
      if (r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
        attacks.push([i, j]);
      }
    }
  }
  return attacks;
}

// Get all squares under attack by queens
function getAttackedSquares(queens, size) {
  const attacked = new Set();
  for (const [qRow, qCol] of queens) {
    // Row and column
    for (let i = 0; i < size; i++) {
      attacked.add(`${qRow}-${i}`);
      attacked.add(`${i}-${qCol}`);
    }
    // Diagonals
    for (let i = 1; i < size; i++) {
      if (qRow + i < size && qCol + i < size) attacked.add(`${qRow + i}-${qCol + i}`);
      if (qRow + i < size && qCol - i >= 0) attacked.add(`${qRow + i}-${qCol - i}`);
      if (qRow - i >= 0 && qCol + i < size) attacked.add(`${qRow - i}-${qCol + i}`);
      if (qRow - i >= 0 && qCol - i >= 0) attacked.add(`${qRow - i}-${qCol - i}`);
    }
  }
  return attacked;
}

// Generate a partial puzzle (some queens pre-placed)
function generatePuzzle(size, preplacedCount) {
  // Use backtracking to find a valid solution
  const solution = [];

  function solve(col) {
    if (col >= size) return true;
    const rows = [...Array(size).keys()];
    // Shuffle for randomness
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }

    for (const row of rows) {
      if (isValidPlacement(solution, row, col)) {
        solution.push([row, col]);
        if (solve(col + 1)) return true;
        solution.pop();
      }
    }
    return false;
  }

  solve(0);

  // Pick random queens to pre-place
  const indices = [...Array(size).keys()];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const preplaced = indices.slice(0, preplacedCount).map(i => solution[i]);
  return { solution, preplaced };
}

// Difficulty settings
const DIFFICULTIES = {
  easy: { size: 4, preplaced: 2, label: '4×4 Easy' },
  medium: { size: 5, preplaced: 2, label: '5×5 Medium' },
  hard: { size: 6, preplaced: 2, label: '6×6 Hard' },
  expert: { size: 8, preplaced: 2, label: '8×8 Expert' },
  master: { size: 8, preplaced: 0, label: '8×8 Master' },
};

// Export helpers for testing
export {
  isValidPlacement,
  getAttackingPairs,
  getAttackedSquares,
  generatePuzzle,
  DIFFICULTIES,
};

export default function NQueens() {
  const [difficulty, setDifficulty] = useState('medium');
  const [queens, setQueens] = useState([]);
  const [preplacedQueens, setPreplacedQueens] = useState([]);
  const [solution, setSolution] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'checking'
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [showAttacks, setShowAttacks] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { size, preplaced: _preplaced } = DIFFICULTIES[difficulty];

  // Initialize a new puzzle
  const initializePuzzle = useCallback((diff = difficulty) => {
    const { size: newSize, preplaced: preCount } = DIFFICULTIES[diff];
    const { solution: sol, preplaced: pre } = generatePuzzle(newSize, preCount);
    setSolution(sol);
    setPreplacedQueens(pre);
    setQueens([...pre]);
    setGameStatus('playing');
    setShowHint(false);
  }, [difficulty]);

  // Initialize on mount and difficulty change
  useState(() => {
    initializePuzzle();
  });

  // Handle square click
  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;

    // Check if this is a preplaced queen (can't remove)
    const isPreplaced = preplacedQueens.some(([r, c]) => r === row && c === col);
    if (isPreplaced) return;

    // Check if there's already a queen here
    const existingIndex = queens.findIndex(([r, c]) => r === row && c === col);

    if (existingIndex >= 0) {
      // Remove the queen
      const newQueens = queens.filter((_, i) => i !== existingIndex);
      setQueens(newQueens);
    } else {
      // Add a queen (if we haven't reached the limit)
      if (queens.length >= size) return;
      const newQueens = [...queens, [row, col]];
      setQueens(newQueens);

      // Check for win condition
      if (newQueens.length === size) {
        const attacks = getAttackingPairs(newQueens);
        if (attacks.length === 0) {
          setGameStatus('won');
          setPuzzlesSolved(prev => prev + 1);
        }
      }
    }
  }, [gameStatus, queens, preplacedQueens, size]);

  // Check current placement
  const _checkPlacement = useCallback(() => {
    const attacks = getAttackingPairs(queens);
    return attacks.length === 0 && queens.length === size;
  }, [queens, size]);

  // Get hint - show one correct position
  const getHint = useCallback(() => {
    // Find a solution queen that's not placed yet
    for (const [sRow, sCol] of solution) {
      const isPlaced = queens.some(([r, c]) => r === sRow && c === sCol);
      if (!isPlaced) {
        setShowHint({ row: sRow, col: sCol });
        return;
      }
    }
  }, [solution, queens]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDiff) => {
    setDifficulty(newDiff);
    initializePuzzle(newDiff);
  }, [initializePuzzle]);

  // Computed values
  const attackingPairs = useMemo(() => getAttackingPairs(queens), [queens]);
  const attackedSquares = useMemo(() => getAttackedSquares(queens, size), [queens, size]);
  const queensNeeded = size - queens.length;

  // Render the board
  const renderBoard = useMemo(() => {
    const squares = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isLight = (row + col) % 2 === 0;
        const hasQueen = queens.some(([r, c]) => r === row && c === col);
        const isPreplaced = preplacedQueens.some(([r, c]) => r === row && c === col);
        const isAttacked = showAttacks && attackedSquares.has(`${row}-${col}`) && !hasQueen;
        const isHint = showHint && showHint.row === row && showHint.col === col;

        // Check if this queen is in an attacking pair
        const queenIndex = queens.findIndex(([r, c]) => r === row && c === col);
        const isAttacking = queenIndex >= 0 && attackingPairs.some(([i, j]) => i === queenIndex || j === queenIndex);

        const squareClasses = [
          styles.square,
          isLight ? styles.light : styles.dark,
          isAttacked && styles.attacked,
          isHint && styles.hint,
          isAttacking && styles.attacking,
        ].filter(Boolean).join(' ');

        squares.push(
          <div
            key={`${row}-${col}`}
            className={squareClasses}
            onClick={() => handleSquareClick(row, col)}
          >
            {hasQueen && (
              <span className={`${styles.queen} ${isPreplaced ? styles.preplaced : ''} ${isAttacking ? styles.attackingQueen : ''}`}>
                ♛
              </span>
            )}
          </div>
        );
      }
    }

    return squares;
  }, [size, queens, preplacedQueens, showAttacks, attackedSquares, showHint, attackingPairs, handleSquareClick]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="N-Queens"
        instructions={`Place ${size} queens so that none can attack each other!`}
      />

      <div className={styles.gameArea}>
        {/* Difficulty selector */}
        <div className={styles.difficultySelector}>
          {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
            <button
              key={key}
              className={`${styles.difficultyBtn} ${difficulty === key ? styles.active : ''}`}
              onClick={() => handleDifficultyChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>👑</span>
            <span className={styles.statValue}>{queens.length}/{size}</span>
            <span className={styles.statLabel}>Queens</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>⚔️</span>
            <span className={styles.statValue}>{attackingPairs.length}</span>
            <span className={styles.statLabel}>Conflicts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏆</span>
            <span className={styles.statValue}>{puzzlesSolved}</span>
            <span className={styles.statLabel}>Solved</span>
          </div>
        </div>

        {/* Info badge */}
        {gameStatus === 'playing' && queensNeeded > 0 && (
          <div className={styles.infoBadge}>
            Place {queensNeeded} more queen{queensNeeded !== 1 ? 's' : ''}
          </div>
        )}

        {/* Chess board */}
        <div className={styles.boardWrapper} style={{ '--board-size': size }}>
          <div
            className={styles.board}
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {renderBoard}
          </div>
        </div>

        {/* Game status */}
        {gameStatus === 'won' && (
          <div className={`${styles.statusMessage} ${styles.success}`}>
            <span className={styles.statusIcon}>🎉</span>
            Perfect! All {size} queens placed safely!
          </div>
        )}

        {attackingPairs.length > 0 && gameStatus === 'playing' && (
          <div className={`${styles.statusMessage} ${styles.warning}`}>
            <span className={styles.statusIcon}>⚠️</span>
            {attackingPairs.length} queen{attackingPairs.length !== 1 ? 's are' : ' is'} under attack!
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.showAttacksBtn} ${showAttacks ? styles.active : ''}`}
            onClick={() => setShowAttacks(!showAttacks)}
          >
            👁️ {showAttacks ? 'Hide' : 'Show'} Attacks
          </button>

          <button
            className={styles.hintBtn}
            onClick={getHint}
            disabled={gameStatus === 'won'}
          >
            💡 Hint
          </button>

          <button
            className={styles.newPuzzleBtn}
            onClick={() => initializePuzzle(difficulty)}
          >
            🔄 New Puzzle
          </button>
        </div>

        {/* Rules */}
        <div className={styles.rules}>
          <div className={styles.rulesTitle}>📜 Rules</div>
          <ul className={styles.rulesList}>
            <li>Queens attack horizontally, vertically, and diagonally</li>
            <li>No two queens can be on the same row, column, or diagonal</li>
            <li>Click to place a queen, click again to remove</li>
            <li><span className={styles.preplacedIndicator}>♛</span> Pre-placed queens cannot be moved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
