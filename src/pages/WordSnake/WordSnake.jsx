import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { getCommonWordsByLength } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './WordSnake.module.css';

// Get common words of good lengths for snake puzzles (6-10 letters)
function getSnakeWords() {
  const words = [];
  for (let len = 6; len <= 10; len++) {
    words.push(...getCommonWordsByLength(len));
  }
  return words;
}

// Cache the word list
let SNAKE_WORDS_CACHE = null;
function getWordPool() {
  if (!SNAKE_WORDS_CACHE) {
    SNAKE_WORDS_CACHE = getSnakeWords();
  }
  return SNAKE_WORDS_CACHE;
}

function generateSnakePath(word, gridSize) {
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
  const path = [];

  // Start position
  let r = Math.floor(Math.random() * (gridSize - 1));
  let c = Math.floor(Math.random() * (gridSize - 1));

  grid[r][c] = word[0];
  path.push([r, c]);

  // Build snake path
  for (let i = 1; i < word.length; i++) {
    const directions = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1] // Up, Down, Left, Right
    ].filter(([nr, nc]) =>
      nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === ''
    );

    if (directions.length === 0) {
      // Dead end, restart
      return generateSnakePath(word, gridSize);
    }

    // Shuffle directions
    for (let j = directions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [directions[j], directions[k]] = [directions[k], directions[j]];
    }

    [r, c] = directions[0];
    grid[r][c] = word[i];
    path.push([r, c]);
  }

  // Fill remaining cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = alphabet[Math.floor(Math.random() * 26)];
      }
    }
  }

  return { grid, path, word };
}

function generatePuzzle() {
  const wordPool = getWordPool();
  const word = wordPool[Math.floor(Math.random() * wordPool.length)];
  const gridSize = Math.max(5, Math.ceil(Math.sqrt(word.length * 2)));

  return generateSnakePath(word, gridSize);
}

// Export helpers for testing
export {
  getWordPool,
  generateSnakePath,
  generatePuzzle,
};

export default function WordSnake() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [selectedPath, setSelectedPath] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [isDragging, setIsDragging] = useState(false);

  const initGame = useCallback(() => {
    const data = generatePuzzle();
    setPuzzleData(data);
    setSelectedPath([]);
    setGameState('playing');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    // Check if selected path matches the solution
    if (selectedPath.length === puzzleData.path.length) {
      let correct = true;
      for (let i = 0; i < selectedPath.length; i++) {
        const [sr, sc] = selectedPath[i];
        const [pr, pc] = puzzleData.path[i];
        if (sr !== pr || sc !== pc) {
          correct = false;
          break;
        }
      }
      if (correct) {
        setGameState('won');
      }
    }
  }, [selectedPath, puzzleData]);

  const isAdjacent = (r1, c1, r2, c2) => {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  };

  const handleCellMouseDown = (r, c) => {
    if (gameState !== 'playing') return;
    setIsDragging(true);
    setSelectedPath([[r, c]]);
  };

  const handleCellMouseEnter = (r, c) => {
    if (!isDragging || gameState !== 'playing') return;

    // Check if this cell is adjacent to the last cell in path
    if (selectedPath.length > 0) {
      const [lastR, lastC] = selectedPath[selectedPath.length - 1];

      // Check if going back (undo)
      if (selectedPath.length > 1) {
        const [prevR, prevC] = selectedPath[selectedPath.length - 2];
        if (r === prevR && c === prevC) {
          setSelectedPath(prev => prev.slice(0, -1));
          return;
        }
      }

      // Check if already in path
      if (selectedPath.some(([pr, pc]) => pr === r && pc === c)) {
        return;
      }

      if (isAdjacent(lastR, lastC, r, c)) {
        setSelectedPath(prev => [...prev, [r, c]]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (r, c, e) => {
    e.preventDefault();
    handleCellMouseDown(r, c);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || gameState !== 'playing') return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.dataset.row !== undefined) {
      const row = parseInt(element.dataset.row);
      const col = parseInt(element.dataset.col);
      handleCellMouseEnter(row, col);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleReset = () => {
    setSelectedPath([]);
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setSelectedPath([...puzzleData.path]);
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  const gridSize = puzzleData.grid.length;
  const currentWord = selectedPath.map(([r, c]) => puzzleData.grid[r][c]).join('');

  return (
    <div className={styles.container}>
      <GameHeader
        title="Word Snake"
        instructions="Find the hidden word by tracing a continuous path through adjacent cells. Click and drag to select letters."
      />

      <div className={styles.gameArea}>
        <div className={styles.clue}>
          <span className={styles.clueLabel}>Find a {puzzleData.word.length}-letter word</span>
          <span className={styles.hint}>Hint: First letter is "{puzzleData.word[0]}"</span>
        </div>

        <div className={styles.currentWord}>
          {currentWord || '...'}
        </div>

        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const pathIndex = selectedPath.findIndex(([pr, pc]) => pr === r && pc === c);
              const isSelected = pathIndex !== -1;
              const isStart = pathIndex === 0;
              const isEnd = pathIndex === selectedPath.length - 1 && selectedPath.length > 0;

              return (
                <div
                  key={`${r}-${c}`}
                  data-row={r}
                  data-col={c}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.selected : ''}
                    ${isStart ? styles.start : ''}
                    ${isEnd ? styles.end : ''}
                  `}
                  onMouseDown={() => handleCellMouseDown(r, c)}
                  onMouseEnter={() => handleCellMouseEnter(r, c)}
                  onTouchStart={(e) => handleTouchStart(r, c, e)}
                >
                  <span className={styles.letter}>{cell}</span>
                  {isSelected && <span className={styles.pathNumber}>{pathIndex + 1}</span>}
                </div>
              );
            })
          )}
        </div>

        <GameResult
          gameState={gameState}
          onNewGame={initGame}
          winTitle="Word Found!"
          winMessage={puzzleData.word}
          gaveUpTitle="Solution Revealed"
          gaveUpMessage={`The word was: ${puzzleData.word}`}
        />

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Clear Path
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
