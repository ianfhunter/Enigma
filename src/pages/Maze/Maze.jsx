import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useGameState } from '../../hooks/useGameState';
import { generateMaze, findShortestPath, cellKey } from '../../utils/generatorUtils';
import styles from './Maze.module.css';

const GRID_SIZES = {
  'Small': { width: 31, height: 23 },
  'Medium': { width: 51, height: 37 },
  'Large': { width: 81, height: 55 },
};

// Wrapper to convert findShortestPath result to {x, y} format for backward compatibility
function findPath(maze, start, end) {
  const path = findShortestPath(
    maze,
    [start.y, start.x],
    [end.y, end.x],
    v => v === 0
  );
  if (!path) return null;
  return path.map(([y, x]) => ({ x, y }));
}

export default function Maze() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('Medium');
  const [mazeData, setMazeData] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [path, setPath] = useState(new Set(['1,1']));
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { gameState, checkWin, reset: resetGameState, isPlaying, isWon } = useGameState();
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState([]);
  const [bestTimes, setBestTimes] = usePersistedState('maze-best-times', {});

  const timerRef = useRef(null);
  const gameAreaRef = useRef(null);

  const { width, height } = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generateMaze(width, height);
    setMazeData(data);
    setPlayerPos(data.start);
    setPath(new Set([cellKey(data.start.x, data.start.y)]));
    setMoves(0);
    setTimer(0);
    setIsRunning(false);
    resetGameState();
    setShowSolution(false);
    setSolution(findPath(data.maze, data.start, data.end) || []);
  }, [width, height, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const movePlayer = useCallback((dx, dy) => {
    if (!isPlaying || !mazeData) return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    // Check bounds and walls
    if (newX < 0 || newX >= width || newY < 0 || newY >= height) return;
    if (mazeData.maze[newY][newX] === 1) return;

    // Start timer on first move
    if (!isRunning) {
      setIsRunning(true);
    }

    setPlayerPos({ x: newX, y: newY });
    setPath(prev => new Set([...prev, cellKey(newX, newY)]));
    setMoves(prev => prev + 1);

    // Check win
    if (newX === mazeData.end.x && newY === mazeData.end.y) {
      checkWin(true);
      setIsRunning(false);

      const key = sizeKey;
      if (!bestTimes[key] || timer < bestTimes[key]) {
        setBestTimes(prev => ({ ...prev, [key]: timer }));
      }
    }
  }, [playerPos, mazeData, width, height, isRunning, isPlaying, checkWin, timer, sizeKey, bestTimes]);

  // Keyboard controls with key hold for faster movement
  const movePlayerRef = useRef(movePlayer);
  const keysHeldRef = useRef(new Set());
  const moveIntervalRef = useRef(null);
  const MOVE_INTERVAL = 60; // milliseconds between moves when key is held

  // Keep movePlayer ref up to date
  useEffect(() => {
    movePlayerRef.current = movePlayer;
  }, [movePlayer]);

  useEffect(() => {
    const getDirection = (key) => {
      const normalizedKey = key.toLowerCase();
      switch (normalizedKey) {
        case 'arrowup':
        case 'w':
          return { dx: 0, dy: -1, key: normalizedKey };
        case 'arrowright':
        case 'd':
          return { dx: 1, dy: 0, key: normalizedKey };
        case 'arrowdown':
        case 's':
          return { dx: 0, dy: 1, key: normalizedKey };
        case 'arrowleft':
        case 'a':
          return { dx: -1, dy: 0, key: normalizedKey };
        default:
          return null;
      }
    };

    const startMoving = () => {
      if (moveIntervalRef.current) return;

      moveIntervalRef.current = setInterval(() => {
        // Get the most recent direction from held keys
        const heldKeys = Array.from(keysHeldRef.current);
        if (heldKeys.length > 0) {
          const lastKey = heldKeys[heldKeys.length - 1];
          const dir = getDirection(lastKey);
          if (dir) {
            movePlayerRef.current(dir.dx, dir.dy);
          }
        }
      }, MOVE_INTERVAL);
    };

    const stopMoving = () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
    };

    const handleKeyDown = (e) => {
      // Ignore browser key repeat
      if (e.repeat) return;

      const dir = getDirection(e.key);
      if (!dir) return;

      e.preventDefault();

      const wasEmpty = keysHeldRef.current.size === 0;
      keysHeldRef.current.add(dir.key);

      // Move immediately on first press
      if (wasEmpty) {
        movePlayerRef.current(dir.dx, dir.dy);
        startMoving();
      } else {
        // Switching direction - move immediately in new direction
        movePlayerRef.current(dir.dx, dir.dy);
      }
    };

    const handleKeyUp = (e) => {
      const dir = getDirection(e.key);
      if (!dir) return;

      keysHeldRef.current.delete(dir.key);

      if (keysHeldRef.current.size === 0) {
        stopMoving();
      }
    };

    // Stop moving if window loses focus
    const handleBlur = () => {
      keysHeldRef.current.clear();
      stopMoving();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      stopMoving();
    };
  }, []);

  // Focus game area on mount
  useEffect(() => {
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, [mazeData]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mazeData) return null;

  const cellSize = Math.min(16, Math.floor(500 / width));

  return (
    <div className={styles.container}>
      <GameHeader
        title="Maze"
        instructions="Navigate from start to finish! Use arrow keys or WASD to move."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selectedSize={sizeKey}
        onSelectSize={setSizeKey}
      />

      <div className={styles.gameArea} ref={gameAreaRef} tabIndex={0}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Time</span>
            <span className={styles.statValue}>{formatTime(timer)}</span>
          </div>
          {solution.length > 0 && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Optimal</span>
              <span className={styles.statValue}>{solution.length - 1}</span>
            </div>
          )}
          {bestTimes[sizeKey] && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('common.best')}</span>
              <span className={styles.statValue}>{formatTime(bestTimes[sizeKey])}</span>
            </div>
          )}
        </div>

        <div
          className={styles.maze}
          style={{
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          }}
        >
          {mazeData.maze.map((row, y) =>
            row.map((cell, x) => {
              const isStart = x === mazeData.start.x && y === mazeData.start.y;
              const isEnd = x === mazeData.end.x && y === mazeData.end.y;
              const isPlayer = x === playerPos.x && y === playerPos.y;
              const isPath = path.has(cellKey(x, y));
              const isSolution = showSolution && solution.some(p => p.x === x && p.y === y);

              return (
                <div
                  key={`${x}-${y}`}
                  className={`
                    ${styles.cell}
                    ${cell === 1 ? styles.wall : styles.passage}
                    ${isStart ? styles.start : ''}
                    ${isEnd ? styles.end : ''}
                    ${isPlayer ? styles.player : ''}
                    ${isPath && !isPlayer ? styles.visited : ''}
                    ${isSolution ? styles.solution : ''}
                  `}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {isPlayer && <span className={styles.playerIcon}>●</span>}
                  {isEnd && !isPlayer && <span className={styles.endIcon}>⭐</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Mobile controls */}
        <div className={styles.mobileControls}>
          <button className={styles.controlBtn} onClick={() => movePlayer(0, -1)}>↑</button>
          <div className={styles.controlRow}>
            <button className={styles.controlBtn} onClick={() => movePlayer(-1, 0)}>←</button>
            <button className={styles.controlBtn} onClick={() => movePlayer(1, 0)}>→</button>
          </div>
          <button className={styles.controlBtn} onClick={() => movePlayer(0, 1)}>↓</button>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Maze Complete!"
            message={`Time: ${formatTime(timer)} • Moves: ${moves}${moves === solution.length - 1 ? ' • 🏆 Perfect Path!' : ''}`}
          />
        )}

        <div className={styles.buttons}>
          <GiveUpButton
            onGiveUp={() => setShowSolution(!showSolution)}
            disabled={isWon}
            buttonText={showSolution ? 'Hide Solution' : 'Show Solution'}
            requireConfirmation={false}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            {gameState === 'won' ? 'Play Again' : 'New Maze'}
          </button>
        </div>
      </div>
    </div>
  );
}
