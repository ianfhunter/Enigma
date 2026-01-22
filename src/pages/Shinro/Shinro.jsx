import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Shinro.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Arrow directions
const ARROWS = {
  'N': '↑',
  'S': '↓',
  'E': '→',
  'W': '←',
  'NE': '↗',
  'NW': '↖',
  'SE': '↘',
  'SW': '↙',
};

const ARROW_DELTAS = {
  'N': [-1, 0],
  'S': [1, 0],
  'E': [0, 1],
  'W': [0, -1],
  'NE': [-1, 1],
  'NW': [-1, -1],
  'SE': [1, 1],
  'SW': [1, -1],
};

function generatePuzzle(size) {
  // Place gems randomly
  const numGems = Math.floor(size * 1.5); // Roughly 1.5 gems per row
  const gems = new Set();
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));

  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Place gems
  for (let i = 0; i < numGems && i < positions.length; i++) {
    const [r, c] = positions[i];
    gems.add(`${r},${c}`);
  }

  // Calculate row and column counts
  const rowCounts = Array(size).fill(0);
  const colCounts = Array(size).fill(0);

  for (const pos of gems) {
    const [r, c] = pos.split(',').map(Number);
    rowCounts[r]++;
    colCounts[c]++;
  }

  // Place arrows pointing toward gems
  const arrowPositions = positions.filter(([r, c]) => !gems.has(`${r},${c}`));

  // Shuffle arrow positions
  for (let i = arrowPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrowPositions[i], arrowPositions[j]] = [arrowPositions[j], arrowPositions[i]];
  }

  // Place arrows (~30% of non-gem cells)
  const numArrows = Math.floor(arrowPositions.length * 0.3);

  for (let i = 0; i < numArrows && i < arrowPositions.length; i++) {
    const [r, c] = arrowPositions[i];

    // Find valid arrow directions (ones that point to at least one gem)
    const validDirs = [];

    for (const [dir, [dr, dc]] of Object.entries(ARROW_DELTAS)) {
      let nr = r + dr;
      let nc = c + dc;

      while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (gems.has(`${nr},${nc}`)) {
          validDirs.push(dir);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    if (validDirs.length > 0) {
      const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
      grid[r][c] = dir;
    }
  }

  return { grid, gems, rowCounts, colCounts, size };
}

function checkValidity(playerGems, grid, rowCounts, colCounts, size) {
  const errors = new Set();

  // Check row counts
  const currentRowCounts = Array(size).fill(0);
  const currentColCounts = Array(size).fill(0);

  for (const pos of playerGems) {
    const [r, c] = pos.split(',').map(Number);
    currentRowCounts[r]++;
    currentColCounts[c]++;
  }

  // Mark cells in rows/cols that exceed the count
  for (let r = 0; r < size; r++) {
    if (currentRowCounts[r] > rowCounts[r]) {
      for (let c = 0; c < size; c++) {
        if (playerGems.has(`${r},${c}`)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  for (let c = 0; c < size; c++) {
    if (currentColCounts[c] > colCounts[c]) {
      for (let r = 0; r < size; r++) {
        if (playerGems.has(`${r},${c}`)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  // Check arrows - a gem placed on an arrow is an error
  for (const pos of playerGems) {
    const [r, c] = pos.split(',').map(Number);
    if (grid[r][c]) {
      errors.add(`${r},${c}`);
    }
  }

  return errors;
}

function checkSolved(playerGems, gems, rowCounts, colCounts, grid, size) {
  // Check if player has found all gems correctly
  if (playerGems.size !== gems.size) return false;

  // Check exact positions
  for (const pos of gems) {
    if (!playerGems.has(pos)) return false;
  }

  return true;
}

// Export helpers for testing
export {
  GRID_SIZES,
  ARROWS,
  ARROW_DELTAS,
  generatePuzzle,
  checkValidity,
  checkSolved,
};

export default function Shinro() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGems, setPlayerGems] = useState(new Set());
  const [marked, setMarked] = useState(new Set()); // Cells marked as not gems
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPlayerGems(new Set());
    setMarked(new Set());
    resetGameState();
    setErrors(new Set());
    setShowSolution(false);
  }, [size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors && !showSolution ?
      checkValidity(playerGems, puzzleData.grid, puzzleData.rowCounts, puzzleData.colCounts, size) :
      new Set();
    setErrors(newErrors);

    if (!showSolution) {
      checkWin(checkSolved(playerGems, puzzleData.gems, puzzleData.rowCounts, puzzleData.colCounts, puzzleData.grid, size));
    }
  }, [playerGems, puzzleData, showErrors, showSolution, size, isPlaying, checkWin]);

  const handleCellClick = (r, c, e) => {
    if (!isPlaying || showSolution) return;
    if (puzzleData.grid[r][c]) return; // Can't click on arrow cells

    const key = `${r},${c}`;

    if (e.type === 'contextmenu' || e.ctrlKey) {
      e.preventDefault();
      // Toggle mark
      setMarked(prev => {
        const newMarked = new Set(prev);
        if (newMarked.has(key)) {
          newMarked.delete(key);
        } else {
          newMarked.add(key);
          // Remove gem if present
          setPlayerGems(p => {
            const n = new Set(p);
            n.delete(key);
            return n;
          });
        }
        return newMarked;
      });
    } else {
      // Toggle gem
      setPlayerGems(prev => {
        const newGems = new Set(prev);
        if (newGems.has(key)) {
          newGems.delete(key);
        } else {
          newGems.add(key);
          // Remove mark if present
          setMarked(m => {
            const n = new Set(m);
            n.delete(key);
            return n;
          });
        }
        return newGems;
      });
    }
  };

  const handleReset = () => {
    setPlayerGems(new Set());
    setMarked(new Set());
    resetGameState();
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    if (!isPlaying) return;
    setShowSolution(true);
    giveUp();
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Shinro"
        instructions="Find all hidden gems! Numbers show how many gems are in each row/column. Arrows point toward at least one gem. Click to place a gem, right-click to mark as empty."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <div className={styles.gameArea}>
        <div className={styles.gridContainer}>
          {/* Row counts column (corner + row numbers) */}
          <div className={styles.rowCountsColumn}>
            <div className={styles.corner}></div>
            {puzzleData.rowCounts.map((count, r) => (
              <div key={r} className={styles.rowCountCell}>
                {count}
              </div>
            ))}
          </div>

          {/* Main column (column counts + grid) */}
          <div className={styles.mainColumn}>
            {/* Column counts header */}
            <div
              className={styles.colCounts}
              style={{
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                width: `${size * 40}px`,
              }}
            >
              {puzzleData.colCounts.map((count, c) => (
                <div key={c} className={styles.colCountCell}>
                  {count}
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                width: `${size * 40}px`,
                height: `${size * 40}px`,
              }}
            >
            {puzzleData.grid.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const hasArrow = cell !== null;
                const hasGem = showSolution ? puzzleData.gems.has(key) : playerGems.has(key);
                const isMarked = !showSolution && marked.has(key);
                const hasError = errors.has(key);

                return (
                  <button
                    key={key}
                    className={`
                      ${styles.cell}
                      ${hasArrow ? styles.arrowCell : ''}
                      ${hasGem ? styles.gemCell : ''}
                      ${isMarked ? styles.markedCell : ''}
                      ${hasError ? styles.error : ''}
                    `}
                    onClick={(e) => handleCellClick(r, c, e)}
                    onContextMenu={(e) => handleCellClick(r, c, e)}
                    disabled={showSolution}
                  >
                    {hasArrow && <span className={styles.arrow}>{ARROWS[cell]}</span>}
                    {hasGem && !hasArrow && <span className={styles.gem}>💎</span>}
                    {isMarked && !hasArrow && <span className={styles.mark}>×</span>}
                  </button>
                );
              })
            )}
            </div>
          </div>
        </div>

        <div className={styles.gemCounter}>
          Gems: {showSolution ? puzzleData.gems.size : playerGems.size} / {puzzleData.gems.size}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="💎 All Gems Found!"
            message="You're a treasure hunter!"
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Try a new puzzle!"
          />
        )}

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Show errors
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendGem}>💎</span>
            <span>Gem (click)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendMark}>×</span>
            <span>Not gem (right-click)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
