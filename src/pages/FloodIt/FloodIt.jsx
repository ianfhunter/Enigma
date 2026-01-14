import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './FloodIt.module.css';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const COLOR_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];

const SIZES = {
  '10×10': { size: 10, maxMoves: 22 },
  '14×14': { size: 14, maxMoves: 28 },
  '18×18': { size: 18, maxMoves: 35 },
};

function generateBoard(size, colorCount) {
  return Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => Math.floor(Math.random() * colorCount))
  );
}

function floodFill(board, newColor) {
  const size = board.length;
  const oldColor = board[0][0];

  if (oldColor === newColor) return board;

  const newBoard = board.map(row => [...row]);
  const stack = [[0, 0]];
  const visited = new Set();

  while (stack.length > 0) {
    const [row, col] = stack.pop();
    const key = `${row},${col}`;

    if (visited.has(key)) continue;
    if (row < 0 || row >= size || col < 0 || col >= size) continue;
    if (newBoard[row][col] !== oldColor) continue;

    visited.add(key);
    newBoard[row][col] = newColor;

    stack.push([row - 1, col]);
    stack.push([row + 1, col]);
    stack.push([row, col - 1]);
    stack.push([row, col + 1]);
  }

  return newBoard;
}

function checkWin(board) {
  const firstColor = board[0][0];
  return board.every(row => row.every(cell => cell === firstColor));
}

function countFloodedCells(board) {
  const size = board.length;
  const targetColor = board[0][0];
  let count = 0;

  const visited = new Set();
  const stack = [[0, 0]];

  while (stack.length > 0) {
    const [row, col] = stack.pop();
    const key = `${row},${col}`;

    if (visited.has(key)) continue;
    if (row < 0 || row >= size || col < 0 || col >= size) continue;
    if (board[row][col] !== targetColor) continue;

    visited.add(key);
    count++;

    stack.push([row - 1, col]);
    stack.push([row + 1, col]);
    stack.push([row, col - 1]);
    stack.push([row, col + 1]);
  }

  return count;
}

// Export helpers for testing
export {
  COLORS,
  COLOR_NAMES,
  SIZES,
  generateBoard,
  floodFill,
  checkWin,
  countFloodedCells,
};

export default function FloodIt() {
  const [sizeKey, setSizeKey] = useState('14×14');
  const [colorCount, setColorCount] = useState(6);
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [bestScores, setBestScores] = useState(() => {
    const saved = localStorage.getItem('flood-it-best');
    return saved ? JSON.parse(saved) : {};
  });

  const { size, maxMoves } = SIZES[sizeKey];

  const initGame = useCallback(() => {
    setBoard(generateBoard(size, colorCount));
    setMoves(0);
    setGameState('playing');
  }, [size, colorCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    localStorage.setItem('flood-it-best', JSON.stringify(bestScores));
  }, [bestScores]);

  const handleColorClick = (colorIndex) => {
    if (gameState !== 'playing') return;
    if (board[0][0] === colorIndex) return;

    const newBoard = floodFill(board, colorIndex);
    setBoard(newBoard);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (checkWin(newBoard)) {
      setGameState('won');
      const key = `${sizeKey}-${colorCount}`;
      if (!bestScores[key] || newMoves < bestScores[key]) {
        setBestScores(prev => ({ ...prev, [key]: newMoves }));
      }
    } else if (newMoves >= maxMoves) {
      setGameState('lost');
    }
  };

  const floodedCount = board.length > 0 ? countFloodedCells(board) : 0;
  const totalCells = size * size;
  const percentage = Math.round((floodedCount / totalCells) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Flood It</h1>
        <p className={styles.instructions}>
          Fill the board with one color! Start from the top-left corner.
        </p>
      </div>

      <div className={styles.settings}>
        <div className={styles.settingGroup}>
          <span className={styles.settingLabel}>Size:</span>
          {Object.keys(SIZES).map((key) => (
            <button
              key={key}
              className={`${styles.settingBtn} ${sizeKey === key ? styles.active : ''}`}
              onClick={() => setSizeKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <div className={styles.settingGroup}>
          <span className={styles.settingLabel}>Colors:</span>
          {[4, 5, 6].map((count) => (
            <button
              key={count}
              className={`${styles.settingBtn} ${colorCount === count ? styles.active : ''}`}
              onClick={() => setColorCount(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves} / {maxMoves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Flooded</span>
            <span className={styles.statValue}>{percentage}%</span>
          </div>
          {bestScores[`${sizeKey}-${colorCount}`] && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Best</span>
              <span className={styles.statValue}>{bestScores[`${sizeKey}-${colorCount}`]}</span>
            </div>
          )}
        </div>

        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${Math.min(size * 24, 400)}px`,
            height: `${Math.min(size * 24, 400)}px`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((colorIndex, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={styles.cell}
                style={{ backgroundColor: COLORS[colorIndex] }}
              />
            ))
          )}
        </div>

        <div className={styles.colorPicker}>
          {COLORS.slice(0, colorCount).map((color, index) => (
            <button
              key={index}
              className={`${styles.colorBtn} ${board[0]?.[0] === index ? styles.current : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(index)}
              title={COLOR_NAMES[index]}
              disabled={gameState !== 'playing'}
            />
          ))}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 You flooded the board in {moves} moves!
          </div>
        )}

        {gameState === 'lost' && (
          <div className={styles.loseMessage}>
            Out of moves! You reached {percentage}% coverage.
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {gameState === 'playing' ? 'New Game' : 'Play Again'}
        </button>
      </div>
    </div>
  );
}
