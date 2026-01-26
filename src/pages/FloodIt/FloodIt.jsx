import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './FloodIt.module.css';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const COLOR_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];

const SIZES = {
  '10×10': { size: 10, maxMoves: 22 },
  '14×14': { size: 14, maxMoves: 28 },
  '18×18': { size: 18, maxMoves: 35 },
};

function generateBoard(size, colorCount, seed) {
  const random = createSeededRandom(seed);
  return Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => Math.floor(random() * colorCount))
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
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('14×14');
  const [colorCount, setColorCount] = useState(6);
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seed, setSeed] = useState(() => stringToSeed(`floodit-${getTodayDateString()}`));
  const { gameState, checkWin: checkWinState, lose, reset: resetGameState, isPlaying } = useGameState();
  const [bestScores, setBestScores] = usePersistedState('flood-it-best', {});

  const { size, maxMoves } = SIZES[sizeKey];

  const initGame = useCallback(() => {
    setBoard(generateBoard(size, colorCount, seed));
    setMoves(0);
    resetGameState();
  }, [size, colorCount, seed, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleColorClick = (colorIndex) => {
    if (!isPlaying) return;
    if (board[0][0] === colorIndex) return;

    const newBoard = floodFill(board, colorIndex);
    setBoard(newBoard);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (checkWin(newBoard)) {
      checkWinState(true);
      const key = `${sizeKey}-${colorCount}`;
      if (!bestScores[key] || newMoves < bestScores[key]) {
        setBestScores(prev => ({ ...prev, [key]: newMoves }));
      }
    } else if (newMoves >= maxMoves) {
      lose();
    }
  };

  const floodedCount = board.length > 0 ? countFloodedCells(board) : 0;
  const totalCells = size * size;
  const percentage = Math.round((floodedCount / totalCells) * 100);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Flood It"
        instructions="Fill the board with one color! Start from the top-left corner."
      />

      <div className={styles.settings}>
        <SizeSelector
          sizes={Object.keys(SIZES)}
          selectedSize={sizeKey}
          onSizeChange={setSizeKey}
          getLabel={(key) => key}
        />
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
              <span className={styles.statLabel}>{t('common.best')}</span>
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
          <GameResult
            state="won"
            title="Board Flooded!"
            message={`You flooded the board in ${moves} moves!`}
          />
        )}
        {gameState === 'lost' && (
          <GameResult
            state="lost"
            title="Out of moves!"
            message={`You reached ${percentage}% coverage.`}
          />
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {gameState === 'playing' ? 'New Game' : 'Play Again'}
        </button>
      </div>
    </div>
  );
}
