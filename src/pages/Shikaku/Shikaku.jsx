import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Shikaku.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

function generatePuzzle(size) {
  // Start with an empty grid
  const rectangles = [];
  const grid = Array(size).fill(null).map(() => Array(size).fill(-1));

  // Generate random rectangles that tile the grid
  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    attempts++;

    // Find first uncovered cell
    let startR = -1, startC = -1;
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) {
          startR = r;
          startC = c;
          break outer;
        }
      }
    }

    if (startR === -1) break; // All covered

    // Try random rectangle sizes
    const maxWidth = size - startC;
    const maxHeight = size - startR;
    const possibleSizes = [];

    for (let h = 1; h <= maxHeight; h++) {
      for (let w = 1; w <= maxWidth; w++) {
        // Check if rectangle fits
        let fits = true;
        for (let r = startR; r < startR + h && fits; r++) {
          for (let c = startC; c < startC + w && fits; c++) {
            if (grid[r][c] !== -1) fits = false;
          }
        }
        if (fits && h * w >= 2 && h * w <= 12) {
          possibleSizes.push([h, w]);
        }
      }
    }

    if (possibleSizes.length === 0) {
      possibleSizes.push([1, 1]);
    }

    const [h, w] = possibleSizes[Math.floor(Math.random() * possibleSizes.length)];
    const rectIdx = rectangles.length;

    // Place number at random position within rectangle
    const numR = startR + Math.floor(Math.random() * h);
    const numC = startC + Math.floor(Math.random() * w);

    rectangles.push({
      r: startR, c: startC,
      h, w,
      numR, numC,
      area: h * w,
    });

    // Mark cells
    for (let r = startR; r < startR + h; r++) {
      for (let c = startC; c < startC + w; c++) {
        grid[r][c] = rectIdx;
      }
    }
  }

  // Create the puzzle grid with only numbers
  const puzzleGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const rect of rectangles) {
    puzzleGrid[rect.numR][rect.numC] = rect.area;
  }

  return { grid: puzzleGrid, solution: grid, rectangles };
}

function checkSolved(playerRects, puzzleGrid, size) {
  // Build grid from player rectangles
  const grid = Array(size).fill(null).map(() => Array(size).fill(-1));

  for (let i = 0; i < playerRects.length; i++) {
    const rect = playerRects[i];
    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) {
        if (grid[r][c] !== -1) return false; // Overlap
        grid[r][c] = i;
      }
    }
  }

  // Check all cells covered
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === -1) return false;
    }
  }

  // Check each rectangle contains exactly one number and matches area
  for (const rect of playerRects) {
    let numberCount = 0;
    let numberValue = null;

    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) {
        if (puzzleGrid[r][c] !== null) {
          numberCount++;
          numberValue = puzzleGrid[r][c];
        }
      }
    }

    if (numberCount !== 1) return false;
    if (rect.h * rect.w !== numberValue) return false;
  }

  return true;
}

export default function Shikaku() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerRects, setPlayerRects] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const [gameState, setGameState] = useState('playing');

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPlayerRects([]);
    setDrawing(null);
    setGameState('playing');
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || playerRects.length === 0) return;

    if (checkSolved(playerRects, puzzleData.grid, size)) {
      setGameState('won');
    }
  }, [playerRects, puzzleData, size]);

  const handleMouseDown = (r, c) => {
    if (gameState !== 'playing') return;
    setDrawing({ startR: r, startC: c, endR: r, endC: c });
  };

  const handleMouseMove = (r, c) => {
    if (!drawing || gameState !== 'playing') return;
    setDrawing(prev => ({ ...prev, endR: r, endC: c }));
  };

  const handleMouseUp = () => {
    if (!drawing || gameState !== 'playing') return;

    const minR = Math.min(drawing.startR, drawing.endR);
    const maxR = Math.max(drawing.startR, drawing.endR);
    const minC = Math.min(drawing.startC, drawing.endC);
    const maxC = Math.max(drawing.startC, drawing.endC);

    const newRect = {
      r: minR,
      c: minC,
      h: maxR - minR + 1,
      w: maxC - minC + 1,
    };

    // Remove any overlapping rectangles
    const filteredRects = playerRects.filter(rect => {
      const overlapR = !(rect.r + rect.h <= newRect.r || newRect.r + newRect.h <= rect.r);
      const overlapC = !(rect.c + rect.w <= newRect.c || newRect.c + newRect.w <= rect.c);
      return !(overlapR && overlapC);
    });

    setPlayerRects([...filteredRects, newRect]);
    setDrawing(null);
  };

  const handleRightClick = (r, c, e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;

    // Remove rectangle containing this cell
    setPlayerRects(prev => prev.filter(rect => {
      const inRect = r >= rect.r && r < rect.r + rect.h &&
                     c >= rect.c && c < rect.c + rect.w;
      return !inRect;
    }));
  };

  const handleReset = () => {
    setPlayerRects([]);
    setGameState('playing');
  };

  if (!puzzleData) return null;

  // Build display grid
  const displayGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  playerRects.forEach((rect, i) => {
    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) {
        displayGrid[r][c] = i;
      }
    }
  });

  // Highlight cells during drawing
  const drawingCells = new Set();
  if (drawing) {
    const minR = Math.min(drawing.startR, drawing.endR);
    const maxR = Math.max(drawing.startR, drawing.endR);
    const minC = Math.min(drawing.startC, drawing.endC);
    const maxC = Math.max(drawing.startC, drawing.endC);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        drawingCells.add(`${r},${c}`);
      }
    }
  }

  const RECT_COLORS = [
    'rgba(239, 68, 68, 0.3)',
    'rgba(249, 115, 22, 0.3)',
    'rgba(234, 179, 8, 0.3)',
    'rgba(34, 197, 94, 0.3)',
    'rgba(14, 165, 233, 0.3)',
    'rgba(99, 102, 241, 0.3)',
    'rgba(168, 85, 247, 0.3)',
    'rgba(236, 72, 153, 0.3)',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Shikaku</h1>
        <p className={styles.instructions}>
          Divide the grid into rectangles. Each rectangle must contain exactly one number,
          which equals its area. Drag to draw rectangles, right-click to remove.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.keys(GRID_SIZES).map((key) => (
          <button
            key={key}
            className={`${styles.sizeBtn} ${sizeKey === key ? styles.active : ''}`}
            onClick={() => setSizeKey(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 42}px`,
            height: `${size * 42}px`,
          }}
          onMouseLeave={() => setDrawing(null)}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const rectIdx = displayGrid[r][c];
              const isDrawing = drawingCells.has(`${r},${c}`);
              const bgColor = rectIdx >= 0 ? RECT_COLORS[rectIdx % RECT_COLORS.length] : 'transparent';

              // Calculate borders
              let borderClasses = '';
              if (rectIdx >= 0) {
                const rect = playerRects[rectIdx];
                if (r === rect.r) borderClasses += ` ${styles.borderTop}`;
                if (r === rect.r + rect.h - 1) borderClasses += ` ${styles.borderBottom}`;
                if (c === rect.c) borderClasses += ` ${styles.borderLeft}`;
                if (c === rect.c + rect.w - 1) borderClasses += ` ${styles.borderRight}`;
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isDrawing ? styles.drawing : ''}
                    ${borderClasses}
                  `}
                  style={{ backgroundColor: isDrawing ? 'rgba(244, 114, 182, 0.3)' : bgColor }}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseMove={() => handleMouseMove(r, c)}
                  onMouseUp={handleMouseUp}
                  onContextMenu={(e) => handleRightClick(r, c, e)}
                >
                  {cell !== null && <span className={styles.number}>{cell}</span>}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All rectangles perfectly divided!</p>
          </div>
        )}

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}

