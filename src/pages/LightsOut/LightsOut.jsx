import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './LightsOut.module.css';

const SIZES = {
  '3×3': 3,
  '5×5': 5,
  '7×7': 7,
};

// Generate a solvable puzzle by working backwards from solved state
function generatePuzzle(size, moves = null) {
  // Start with all lights off (solved state)
  const grid = Array(size).fill(null).map(() => Array(size).fill(false));

  // Make random moves to create puzzle (this guarantees solvability)
  const numMoves = moves || Math.floor(size * size * 0.4) + 3;

  for (let i = 0; i < numMoves; i++) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    toggleCell(grid, row, col, size);
  }

  // Make sure at least some lights are on
  const litCount = grid.flat().filter(Boolean).length;
  if (litCount < 3) {
    return generatePuzzle(size, moves);
  }

  return grid;
}

function toggleCell(grid, row, col, size) {
  // Toggle the clicked cell
  grid[row][col] = !grid[row][col];

  // Toggle adjacent cells
  if (row > 0) grid[row - 1][col] = !grid[row - 1][col];
  if (row < size - 1) grid[row + 1][col] = !grid[row + 1][col];
  if (col > 0) grid[row][col - 1] = !grid[row][col - 1];
  if (col < size - 1) grid[row][col + 1] = !grid[row][col + 1];
}

function checkWin(grid) {
  return grid.every(row => row.every(cell => !cell));
}

export default function LightsOut() {
  const [size, setSize] = useState(5);
  const [grid, setGrid] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won'
  const [bestScores, setBestScores] = useState(() => {
    const saved = localStorage.getItem('lights-out-best');
    return saved ? JSON.parse(saved) : {};
  });

  const initGame = useCallback(() => {
    setGrid(generatePuzzle(size));
    setMoves(0);
    setGameState('playing');
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    localStorage.setItem('lights-out-best', JSON.stringify(bestScores));
  }, [bestScores]);

  const handleCellClick = (row, col) => {
    if (gameState === 'won') return;

    const newGrid = grid.map(r => [...r]);
    toggleCell(newGrid, row, col, size);
    setGrid(newGrid);
    setMoves(prev => prev + 1);

    if (checkWin(newGrid)) {
      setGameState('won');
      const key = `${size}x${size}`;
      const newMoves = moves + 1;
      if (!bestScores[key] || newMoves < bestScores[key]) {
        setBestScores(prev => ({ ...prev, [key]: newMoves }));
      }
    }
  };

  const litCount = grid.flat().filter(Boolean).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Lights Out</h1>
        <p className={styles.instructions}>
          Toggle lights to turn them all off. Each click affects neighboring lights!
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.entries(SIZES).map(([label, value]) => (
          <button
            key={label}
            className={`${styles.sizeBtn} ${size === value ? styles.active : ''}`}
            onClick={() => setSize(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Lights On</span>
            <span className={styles.statValue}>{litCount}</span>
          </div>
          {bestScores[`${size}x${size}`] && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Best</span>
              <span className={styles.statValue}>{bestScores[`${size}x${size}`]}</span>
            </div>
          )}
        </div>

        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 60}px`,
            height: `${size * 60}px`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((isLit, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`${styles.cell} ${isLit ? styles.lit : styles.off}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              />
            ))
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 All lights out in {moves} moves!
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {gameState === 'won' ? 'Play Again' : 'New Puzzle'}
        </button>
      </div>
    </div>
  );
}
