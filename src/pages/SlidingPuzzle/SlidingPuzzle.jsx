import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GameResult from '../../components/GameResult';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './SlidingPuzzle.module.css';
import sampleImage from '../../assets/sample_image.png';

export const SIZES = {
  '3x3': 3,
  '4x4': 4,
  '5x5': 5,
};

export function getKeyboardTargetIndex(emptyIndex, size, key) {
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;

  switch (key) {
    case 'ArrowUp':
      return emptyRow > 0 ? emptyIndex - size : -1;
    case 'ArrowDown':
      return emptyRow < size - 1 ? emptyIndex + size : -1;
    case 'ArrowLeft':
      return emptyCol > 0 ? emptyIndex - 1 : -1;
    case 'ArrowRight':
      return emptyCol < size - 1 ? emptyIndex + 1 : -1;
    default:
      return -1;
  }
}

export default function SlidingPuzzle() {
  const [size, setSize] = useState(4);
  const [tiles, setTiles] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'won'
  const [showPreview, setShowPreview] = useState(false);
  const [bestTimes, setBestTimes] = usePersistedState('sliding-puzzle-best', {});
  const timerRef = useRef(null);

  const createSolvedPuzzle = useCallback(() => {
    const total = size * size;
    return Array.from({ length: total }, (_, i) => (i + 1) % total);
  }, [size]);

  const isSolvable = (puzzle) => {
    // Count inversions
    let inversions = 0;
    const filtered = puzzle.filter(x => x !== 0);

    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (filtered[i] > filtered[j]) {
          inversions++;
        }
      }
    }

    const emptyRow = Math.floor(puzzle.indexOf(0) / size);

    if (size % 2 === 1) {
      // Odd grid: solvable if inversions is even
      return inversions % 2 === 0;
    } else {
      // Even grid: solvable if (inversions + empty row from bottom) is odd
      const emptyRowFromBottom = size - emptyRow;
      return (inversions + emptyRowFromBottom) % 2 === 1;
    }
  };

  const shufflePuzzle = useCallback(() => {
    const solved = createSolvedPuzzle();
    let shuffled;

    do {
      shuffled = [...solved].sort(() => Math.random() - 0.5);
    } while (!isSolvable(shuffled) || JSON.stringify(shuffled) === JSON.stringify(solved));

    return shuffled;
  }, [size, createSolvedPuzzle]);

  const initGame = useCallback(() => {
    const shuffled = shufflePuzzle();
    setTiles(shuffled);
    setEmptyIndex(shuffled.indexOf(0));
    setMoves(0);
    setTime(0);
    setGameState('ready');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [shufflePuzzle]);

  useEffect(() => {
    initGame();
  }, [initGame, size]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const isSolved = useCallback(() => {
    const solved = createSolvedPuzzle();
    return JSON.stringify(tiles) === JSON.stringify(solved);
  }, [tiles, createSolvedPuzzle]);

  const canMove = (index) => {
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    const tileRow = Math.floor(index / size);
    const tileCol = index % size;

    // Can move if adjacent (not diagonal)
    return (
      (Math.abs(emptyRow - tileRow) === 1 && emptyCol === tileCol) ||
      (Math.abs(emptyCol - tileCol) === 1 && emptyRow === tileRow)
    );
  };

  const moveTile = (index) => {
    if (!canMove(index)) return;
    if (gameState === 'won') return;

    if (gameState === 'ready') {
      setGameState('playing');
    }

    const newTiles = [...tiles];
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];

    setTiles(newTiles);
    setEmptyIndex(index);
    setMoves(prev => prev + 1);

    // Check win after state updates
    setTimeout(() => {
      const solved = createSolvedPuzzle();
      if (JSON.stringify(newTiles) === JSON.stringify(solved)) {
        setGameState('won');
        const key = `${size}x${size}`;
        if (!bestTimes[key] || time < bestTimes[key]) {
          setBestTimes(prev => ({ ...prev, [key]: time }));
        }
      }
    }, 0);
  };

  const handleKeyDown = useCallback((e) => {
    if (gameState === 'won') return;

    const targetIndex = getKeyboardTargetIndex(emptyIndex, size, e.key);

    if (targetIndex !== -1) {
      e.preventDefault();
      moveTile(targetIndex);
    }
  }, [emptyIndex, size, gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Sliding Puzzle"
        instructions="Slide tiles to complete the image. Use clicks or arrow keys!"
      />

      <SizeSelector
        sizes={Object.keys(SIZES)}
        selectedSize={Object.keys(SIZES).find(k => SIZES[k] === size)}
        onSelectSize={(key) => setSize(SIZES[key])}
      />

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Time</span>
            <span className={styles.statValue}>{formatTime(time)}</span>
          </div>
          {bestTimes[`${size}x${size}`] && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Best</span>
              <span className={styles.statValue}>{formatTime(bestTimes[`${size}x${size}`])}</span>
            </div>
          )}
          <button
            className={styles.previewBtn}
            onMouseDown={() => setShowPreview(true)}
            onMouseUp={() => setShowPreview(false)}
            onMouseLeave={() => setShowPreview(false)}
            onTouchStart={() => setShowPreview(true)}
            onTouchEnd={() => setShowPreview(false)}
          >
            👁️ Preview
          </button>
        </div>

        <div className={styles.boardContainer}>
          {showPreview && (
            <div className={styles.previewOverlay}>
              <img src={sampleImage} alt="Solution preview" />
            </div>
          )}
          <div
            className={styles.board}
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              width: `${size * 80}px`,
              height: `${size * 80}px`,
            }}
          >
            {tiles.map((tile, index) => {
              // Tile value represents where this piece belongs (1-based, 0 is empty)
              // Convert to row/col for background position
              const tileRow = tile === 0 ? 0 : Math.floor((tile - 1) / size);
              const tileCol = tile === 0 ? 0 : (tile - 1) % size;
              const tileSize = 80;

              return (
                <button
                  key={index}
                  className={`${styles.tile} ${tile === 0 ? styles.empty : ''} ${canMove(index) && tile !== 0 ? styles.movable : ''}`}
                  onClick={() => moveTile(index)}
                  disabled={tile === 0}
                  style={tile !== 0 ? {
                    backgroundImage: `url(${sampleImage})`,
                    backgroundPosition: `-${tileCol * tileSize}px -${tileRow * tileSize}px`,
                    backgroundSize: `${size * tileSize}px ${size * tileSize}px`,
                  } : {}}
                />
              );
            })}
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Puzzle Solved!"
            message={`🎉 Solved in ${moves} moves and ${formatTime(time)}!`}
          />
        )}

        <button className={styles.shuffleBtn} onClick={initGame}>
          {gameState === 'won' ? 'Play Again' : 'Shuffle'}
        </button>
      </div>
    </div>
  );
}
