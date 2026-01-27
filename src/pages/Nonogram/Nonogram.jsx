import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './Nonogram.module.css';

// Import all images from each folder
const imageModules = import.meta.glob('/src/assets/nonogram_images/**/*.png', { eager: true, query: '?url', import: 'default' });

// Credits data
const CREDITS = {
  Nikoichu: {
    title: '1-bit Pixel Icons',
    author: 'Nikoichu',
    license: 'CC0',
    link: 'https://nikoichu.itch.io/pixel-icons'
  },
  Hexanys: {
    title: 'Roguelike Tiles',
    author: 'Hexany Ives',
    license: 'CC 1.0',
    link: 'https://hexany-ives.itch.io/hexanys-roguelike-tiles'
  },
  items: {
    title: 'Item Sprites',
    author: 'Unknown',
    license: 'Unknown',
    link: null
  }
};

// Parse folder from path to get credit info
function getCreditFromPath(path) {
  const parts = path.split('/');
  const nonogramIdx = parts.indexOf('nonogram_images');
  if (nonogramIdx >= 0 && parts[nonogramIdx + 1]) {
    const folder = parts[nonogramIdx + 1];
    return CREDITS[folder] || CREDITS.items;
  }
  return CREDITS.items;
}

// Get all available images
function getAvailableImages() {
  return Object.entries(imageModules).map(([path, url]) => ({
    path,
    url,
    credit: getCreditFromPath(path),
    name: path.split('/').pop().replace('.png', '').replace(/_/g, ' ')
  }));
}

// Convert image to binary grid
async function imageToBinaryGrid(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const grid = [];

      for (let y = 0; y < img.height; y++) {
        const row = [];
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];

          // Consider filled if dark (or transparent = empty)
          // For 1-bit images: black = filled, white = empty
          const brightness = (r + g + b) / 3;
          const isFilled = a > 128 && brightness < 128;
          row.push(isFilled);
        }
        grid.push(row);
      }

      resolve(grid);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

// Generate clues from a binary grid
function generateClues(grid) {
  const height = grid.length;
  const width = grid[0]?.length || 0;

  const rowClues = [];
  const colClues = [];

  // Row clues
  for (let y = 0; y < height; y++) {
    const clues = [];
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (grid[y][x]) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    rowClues.push(clues.length > 0 ? clues : [0]);
  }

  // Column clues
  for (let x = 0; x < width; x++) {
    const clues = [];
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (grid[y][x]) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    colClues.push(clues.length > 0 ? clues : [0]);
  }

  return { rowClues, colClues };
}

// Check if puzzle is solved
function checkSolved(userGrid, solution) {
  for (let y = 0; y < solution.length; y++) {
    for (let x = 0; x < solution[0].length; x++) {
      // Only check that filled cells match - marked X cells don't matter
      if (solution[y][x] !== (userGrid[y][x] === 1)) {
        return false;
      }
    }
  }
  return true;
}

// Export helpers for testing
export {
  CREDITS,
  getCreditFromPath,
  generateClues,
  checkSolved,
};

export default function Nonogram() {
  const { t } = useTranslation();
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [gameState, setGameState] = useState('loading');
  const [currentImage, setCurrentImage] = useState(null);
  const [showCredits, setShowCredits] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(null);
  const [markMode, setMarkMode] = useState(false); // Mobile mark mode
  const touchHandledRef = useRef(false); // Track if touch handled this interaction (prevents synthetic mouse events from touch)

  const availableImages = useMemo(() => getAvailableImages(), []);

  const loadRandomPuzzle = useCallback(async () => {
    setGameState('loading');

    // Pick a random image
    const random = createSeededRandom(Date.now());
    const randomIdx = Math.floor(random() * availableImages.length);
    const image = availableImages[randomIdx];
    setCurrentImage(image);

    try {
      const solution = await imageToBinaryGrid(image.url);
      const { rowClues, colClues } = generateClues(solution);

      setPuzzle({ solution, rowClues, colClues });
      setUserGrid(solution.map(row => row.map(() => 0))); // 0 = empty, 1 = filled, 2 = marked X
      setGameState('playing');
    } catch (err) {
      console.error('Failed to load puzzle:', err);
      setGameState('error');
    }
  }, [availableImages]);

  useEffect(() => {
    loadRandomPuzzle();
  }, [loadRandomPuzzle]);

  useEffect(() => {
    if (gameState === 'playing' && puzzle) {
      if (checkSolved(userGrid, puzzle.solution)) {
        setGameState('won');
      }
    }
  }, [userGrid, puzzle, gameState]);

  const handleCellClick = (y, x, isRightClick = false) => {
    if (gameState !== 'playing') return;

    setUserGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const currentValue = newGrid[y][x];

      if (isRightClick) {
        // Right click: toggle X mark
        newGrid[y][x] = currentValue === 2 ? 0 : 2;
      } else {
        // Left click: cycle through empty -> filled -> empty
        newGrid[y][x] = currentValue === 1 ? 0 : 1;
      }

      return newGrid;
    });
  };

  const handleMouseDown = (y, x, e) => {
    if (gameState !== 'playing') return;

    // Skip synthetic mouse events from touch (prevents double-toggle)
    if (touchHandledRef.current) return;

    const isRightClick = e.button === 2 || markMode;
    setIsDragging(true);

    // Determine what value we're painting
    const currentValue = userGrid[y][x];
    if (isRightClick) {
      setDragValue(currentValue === 2 ? 0 : 2);
    } else {
      setDragValue(currentValue === 1 ? 0 : 1);
    }

    // Apply to first cell immediately (handles both click and drag start)
    handleCellClick(y, x, isRightClick);
  };

  const handleMouseEnter = (y, x) => {
    if (!isDragging || dragValue === null || gameState !== 'playing') return;

    setUserGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[y][x] = dragValue;
      return newGrid;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  // Touch handlers for mobile drag painting
  const handleTouchStart = (y, x, e) => {
    if (gameState !== 'playing') return;
    e.preventDefault(); // Prevent default touch behavior to ensure tap works
    touchHandledRef.current = true; // Mark that touch handled this interaction

    const isMarkMode = markMode;
    setIsDragging(true);

    // Determine what value we're painting
    const currentValue = userGrid[y][x];
    if (isMarkMode) {
      setDragValue(currentValue === 2 ? 0 : 2);
    } else {
      setDragValue(currentValue === 1 ? 0 : 1);
    }

    // Apply to first cell
    handleCellClick(y, x, isMarkMode);
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || dragValue === null || gameState !== 'playing') return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.dataset.cellY !== undefined && element.dataset.cellX !== undefined) {
      const y = parseInt(element.dataset.cellY, 10);
      const x = parseInt(element.dataset.cellX, 10);

      setUserGrid(prev => {
        // Only update if the value is different
        if (prev[y][x] === dragValue) return prev;
        const newGrid = prev.map(row => [...row]);
        newGrid[y][x] = dragValue;
        return newGrid;
      });
    }
  }, [isDragging, dragValue, gameState]);

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragValue(null);
    // Reset touch flag after a brief delay to allow synthetic click to be blocked
    setTimeout(() => {
      touchHandledRef.current = false;
    }, 300);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchMove]);

  const handleReset = () => {
    if (!puzzle) return;
    setUserGrid(puzzle.solution.map(row => row.map(() => 0)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzle) return;
    setUserGrid(puzzle.solution.map(row => row.map(cell => cell ? 1 : 0)));
    setGameState('gave_up');
  };

  if (gameState === 'loading' || !puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  const gridSize = puzzle.solution.length;
  const maxRowClues = Math.max(...puzzle.rowClues.map(c => c.length));
  const maxColClues = Math.max(...puzzle.colClues.map(c => c.length));

  return (
    <div className={styles.container}>
      <GameHeader
        title="Nonogram"
        instructions="Fill in cells to reveal the hidden picture! Numbers show consecutive filled cells. Tap to fill, use mark mode to mark X."
      />

      <div className={styles.gameArea}>
        {/* Mobile Mark Toggle */}
        <button
          className={`${styles.markToggle} ${markMode ? styles.markModeActive : ''}`}
          onClick={() => setMarkMode(!markMode)}
        >
          ✕ {markMode ? 'Mark Mode ON' : 'Mark Mode'}
        </button>

        <div
          className={styles.gridWrapper}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Column clues */}
          <div
            className={styles.colCluesRow}
            style={{
              marginLeft: `${maxRowClues * 18 + 8}px`,
              gridTemplateColumns: `repeat(${gridSize}, 24px)`
            }}
          >
            {puzzle.colClues.map((clues, x) => (
              <div key={x} className={styles.colClue}>
                {clues.map((clue, i) => (
                  <span key={i}>{clue}</span>
                ))}
              </div>
            ))}
          </div>

          {/* Main grid with row clues */}
          <div className={styles.mainGrid}>
            {/* Row clues */}
            <div className={styles.rowClues}>
              {puzzle.rowClues.map((clues, y) => (
                <div
                  key={y}
                  className={styles.rowClue}
                  style={{ width: `${maxRowClues * 18}px` }}
                >
                  {clues.map((clue, i) => (
                    <span key={i}>{clue}</span>
                  ))}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div
              className={styles.grid}
              style={{ gridTemplateColumns: `repeat(${gridSize}, 24px)` }}
            >
              {userGrid.map((row, y) =>
                row.map((cell, x) => (
                  <button
                    key={`${y}-${x}`}
                    data-cell-y={y}
                    data-cell-x={x}
                    className={`
                      ${styles.cell}
                      ${cell === 1 ? styles.filled : ''}
                      ${cell === 2 ? styles.marked : ''}
                      ${(x + 1) % 4 === 0 && x < gridSize - 1 ? styles.borderRight : ''}
                      ${(y + 1) % 4 === 0 && y < gridSize - 1 ? styles.borderBottom : ''}
                    `}
                    onMouseDown={(e) => handleMouseDown(y, x, e)}
                    onMouseEnter={() => handleMouseEnter(y, x)}
                    onTouchStart={(e) => handleTouchStart(y, x, e)}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎨 Puzzle Complete!"
            message={<>You revealed: {currentImage?.name}</>}
            actions={[{ label: t('common.newPuzzle'), onClick: loadRandomPuzzle, primary: true }]}
          >
            <div className={styles.revealedImage}>
              <img src={currentImage?.url} alt={currentImage?.name} />
            </div>
          </GameResult>
        )}

        {gameState === 'gave_up' && (
          <GameResult
            state="gaveup"
            title="🖼️ Solution Revealed"
            message={<>It was: {currentImage?.name}</>}
            actions={[{ label: t('common.newPuzzle'), onClick: loadRandomPuzzle, primary: true }]}
          >
            <div className={styles.revealedImage}>
              <img src={currentImage?.url} alt={currentImage?.name} />
            </div>
          </GameResult>
        )}

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={loadRandomPuzzle}>
            {t('common.newPuzzle')}
          </button>
        </div>

        {/* Credits */}
        <div className={styles.creditsSection}>
          <button
            className={styles.creditsToggle}
            onClick={() => setShowCredits(!showCredits)}
          >
            {showCredits ? 'Hide Credits' : 'Show Credits'}
          </button>

          {showCredits && (
            <div className={styles.creditsContent}>
              <h4>Image Credits</h4>
              {Object.entries(CREDITS).map(([key, credit]) => (
                <div key={key} className={styles.creditItem}>
                  <strong>{credit.title}</strong> by {credit.author}
                  <br />
                  <span className={styles.license}>License: {credit.license}</span>
                  {credit.link && (
                    <>
                      {' • '}
                      <a href={credit.link} target="_blank" rel="noopener noreferrer">
                        Source
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
