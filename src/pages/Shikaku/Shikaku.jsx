import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Shikaku.module.css';

const GRID_SIZES = {
  '7×7': 7,
  '10×10': 10,
  '12×12': 12,
  '15×15': 15,
};

function checkSolved(playerRects, puzzleGrid, gridSize) {
  // Build grid from player rectangles
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(-1));
  const rectInfo = playerRects.map(() => ({ clueCount: 0, clueValue: null }));

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
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === -1) return false;

      const clueValue = puzzleGrid?.[r]?.[c];
      if (clueValue !== null && clueValue !== undefined) {
        const info = rectInfo[grid[r][c]];
        info.clueCount += 1;
        if (info.clueValue === null) {
          info.clueValue = clueValue;
        } else if (info.clueValue !== clueValue) {
          return false; // conflicting clue values within a rectangle
        }
      }
    }
  }

  // Check each rectangle has at most one clue and matches its value when present
  for (let i = 0; i < playerRects.length; i++) {
    const rect = playerRects[i];
    const info = rectInfo[i];
    if (info.clueCount > 1) return false;
    if (info.clueCount === 1 && rect.h * rect.w !== info.clueValue) return false;
  }

  return true;
}

// Convert solution grid (with rectangle IDs) to rectangle objects
function solutionToRects(solutionGrid) {
  const size = solutionGrid.length;
  const rectMap = new Map(); // rectId -> {minR, maxR, minC, maxC}

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const rectId = solutionGrid[r][c];
      if (rectId === null) continue;

      if (!rectMap.has(rectId)) {
        rectMap.set(rectId, { minR: r, maxR: r, minC: c, maxC: c });
      } else {
        const rect = rectMap.get(rectId);
        rect.minR = Math.min(rect.minR, r);
        rect.maxR = Math.max(rect.maxR, r);
        rect.minC = Math.min(rect.minC, c);
        rect.maxC = Math.max(rect.maxC, c);
      }
    }
  }

  return Array.from(rectMap.values()).map(bounds => ({
    r: bounds.minR,
    c: bounds.minC,
    h: bounds.maxR - bounds.minR + 1,
    w: bounds.maxC - bounds.minC + 1
  }));
}

// Export helpers for testing
export {
  GRID_SIZES,
  checkSolved,
  solutionToRects,
};

export default function Shikaku() {
  const [sizeKey, setSizeKey] = useState('10×10');
  const [difficulty, setDifficulty] = useState('easy');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerRects, setPlayerRects] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [loading, setLoading] = useState(true);

  const size = GRID_SIZES[sizeKey];

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/shikakuPuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Shikaku puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (allPuzzles.length === 0) return;

    let available = allPuzzles.filter(p =>
      p.rows === size && p.cols === size && p.difficulty === difficulty
    );

    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === size && p.cols === size);
    }

    if (available.length === 0) {
      const sizes = [...new Set(allPuzzles.filter(p => p.rows === p.cols).map(p => p.rows))].sort((a,b) => a-b);
      const closest = sizes.reduce((prev, curr) => Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev, sizes[0]);
      available = allPuzzles.filter(p => p.rows === closest && p.cols === closest);
    }

    if (available.length === 0) return;

    const puzzle = available[Math.floor(Math.random() * available.length)];
    const puzzleSize = puzzle.rows;

    // Convert solution grid to rectangle objects
    const solutionRects = solutionToRects(puzzle.solution);

    setPuzzleData({
      grid: puzzle.clues,
      solution: solutionRects,
      size: puzzleSize
    });
    setPlayerRects([]);
    setDrawing(null);
    setGameState('playing');
  }, [allPuzzles, size, difficulty]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      initGame();
    }
  }, [loading, allPuzzles, initGame]);

  useEffect(() => {
    if (!puzzleData || playerRects.length === 0 || gameState !== 'playing') return;

    const gridSize = puzzleData.size || size;
    if (checkSolved(playerRects, puzzleData.grid, gridSize)) {
      setGameState('won');
    }
  }, [playerRects, puzzleData, size, gameState]);

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

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setPlayerRects([...puzzleData.solution]);
    setGameState('gaveUp');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader title="Shikaku" />
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  const gridSize = puzzleData.size || size;

  // Build display grid
  const displayGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(-1));
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

  // Generate unique color for each rectangle using HSL
  const getRectColor = (index) => {
    // Use golden angle approximation for good color distribution
    const hue = (index * 137.508) % 360;
    // Use moderate saturation and lightness for good visibility
    const saturation = 60 + (index % 20) * 1; // Vary between 60-80%
    const lightness = 50 + (index % 15) * 1; // Vary between 50-65%
    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Shikaku"
        instructions="Divide the grid into rectangles. Each rectangle must contain exactly one number, which equals its area. Drag to draw rectangles, right-click to remove."
      />

      <SizeSelector
        options={Object.keys(GRID_SIZES)}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <DifficultySelector
        options={['easy', 'medium', 'hard']}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.difficultySelector}
      />

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: `${Math.min(gridSize * 40, 500)}px`,
            height: `${Math.min(gridSize * 40, 500)}px`,
          }}
          onMouseLeave={() => setDrawing(null)}
        >
          {Array(gridSize).fill(null).map((_, r) =>
            Array(gridSize).fill(null).map((_, c) => {
              const rectIdx = displayGrid[r][c];
              const isDrawing = drawingCells.has(`${r},${c}`);
              const hasNumber = puzzleData.grid[r][c] !== null;
              const bgColor = rectIdx >= 0 ? getRectColor(rectIdx) : undefined;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isDrawing ? styles.drawing : ''}
                    ${hasNumber ? styles.number : ''}
                  `}
                  style={{ backgroundColor: bgColor }}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseMove={() => handleMouseMove(r, c)}
                  onMouseUp={handleMouseUp}
                  onContextMenu={(e) => handleRightClick(r, c, e)}
                >
                  {hasNumber && <span className={styles.value}>{puzzleData.grid[r][c]}</span>}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎉 Puzzle Solved!"
            message="All rectangles complete!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="🗺️ Solution Revealed"
            message="Study the pattern and try another puzzle!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
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
