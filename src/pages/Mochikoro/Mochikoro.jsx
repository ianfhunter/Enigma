import { useState, useEffect, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { createSeededRNG, generateRandomSeed, parseSeedFromUrl, setSeedInUrl } from '../../enigma-sdk/seeding';
import styles from './Mochikoro.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIRECTIONS_4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DISABLED_SIZES = ['10x10']; // Sizes to exclude from UI (too hard to generate)

/**
 * Check for 2x2 black squares (not allowed)
 */
export function has2x2BlackSquare(grid, rows, cols) {
  const violations = [];

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (grid[r][c] === 'black' && grid[r+1][c] === 'black' &&
          grid[r][c+1] === 'black' && grid[r+1][c+1] === 'black') {
        violations.push([r, c], [r+1, c], [r, c+1], [r+1, c+1]);
      }
    }
  }

  return violations;
}

/**
 * Find connected white region containing a cell using BFS
 */
function findWhiteRegion(grid, startR, startC, rows, cols, visited) {
  if (grid[startR][startC] !== 'white' || visited.has(`${startR},${startC}`)) {
    return null;
  }

  const region = [];
  const queue = [[startR, startC]];
  visited.add(`${startR},${startC}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    region.push([r, c]);

    for (const [dr, dc] of DIRECTIONS_4) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] === 'white' && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return region;
}

/**
 * Check if a region forms a rectangle
 */
function isRectangle(region) {
  if (region.length === 0) return false;

  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;

  for (const [r, c] of region) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }

  const expectedCount = (maxR - minR + 1) * (maxC - minC + 1);
  return region.length === expectedCount;
}

/**
 * Check validity - returns object with errors
 */
export function checkValidity(grid, clues, rows, cols) {
  const errors = new Set();

  // Check for 2x2 black squares
  const blackViolations = has2x2BlackSquare(grid, rows, cols);
  blackViolations.forEach(([r, c]) => errors.add(`${r},${c}`));

  // Check each white region
  const visited = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'white' && !visited.has(`${r},${c}`)) {
        const region = findWhiteRegion(grid, r, c, rows, cols, visited);

        if (region) {
          // Find clue in this region
          let clueCount = 0;
          let clueValue = null;

          for (const [rr, cc] of region) {
            if (clues[rr][cc] !== null) {
              clueCount++;
              clueValue = clues[rr][cc];
            }
          }

          // Region should have exactly one clue
          if (clueCount > 1) {
            // Multiple clues in same region - error
            region.forEach(([rr, cc]) => {
              if (clues[rr][cc] !== null) errors.add(`${rr},${cc}`);
            });
          }

          // If region has a clue, check if area could match
          if (clueValue !== null && region.length > clueValue) {
            // Region too big
            region.forEach(([rr, cc]) => errors.add(`${rr},${cc}`));
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Check if puzzle is solved
 */
export function checkSolved(grid, clues, rows, cols) {
  // Check no 2x2 black squares
  if (has2x2BlackSquare(grid, rows, cols).length > 0) {
    return false;
  }

  // Check all white regions are rectangles with correct area
  const visited = new Set();
  const cluesUsed = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'white' && !visited.has(`${r},${c}`)) {
        const region = findWhiteRegion(grid, r, c, rows, cols, visited);

        if (!region || !isRectangle(region)) {
          return false;
        }

        // Find clue in this region
        let clueCount = 0;
        let clueValue = null;
        let clueKey = null;

        for (const [rr, cc] of region) {
          if (clues[rr][cc] !== null) {
            clueCount++;
            clueValue = clues[rr][cc];
            clueKey = `${rr},${cc}`;
          }
        }

        // Must have exactly one clue matching the area
        if (clueCount !== 1 || clueValue !== region.length) {
          return false;
        }

        cluesUsed.add(clueKey);
      }
    }
  }

  // All clues must be used
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clues[r][c] !== null && !cluesUsed.has(`${r},${c}`)) {
        return false;
      }
    }
  }

  return true;
}

// Get available sizes from dataset (excluding disabled sizes)
function getAvailableSizes(puzzles, difficulty) {
  const sizes = new Set();
  puzzles.forEach(p => {
    const sizeKey = `${p.rows}x${p.cols}`;
    if (p.difficulty === difficulty && !DISABLED_SIZES.includes(sizeKey)) {
      sizes.add(sizeKey);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [ar] = a.split('x').map(Number);
    const [br] = b.split('x').map(Number);
    return ar - br;
  });
}

export default function Mochikoro() {
  const [difficulty, setDifficulty] = useState('medium');
  const [sizeKey, setSizeKey] = useState('7x7');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [whiteMode, setWhiteMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(() => parseSeedFromUrl() || generateRandomSeed());

  const availableSizes = useMemo(
    () => getAvailableSizes(allPuzzles, difficulty),
    [allPuzzles, difficulty]
  );

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(sizeKey)) {
      setSizeKey(availableSizes[0]);
    }
  }, [availableSizes, sizeKey]);

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/mochikoroPuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Mochikoro puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback((customSeed = null) => {
    if (allPuzzles.length === 0) return;

    const currentSeed = customSeed ?? generateRandomSeed();
    setSeed(currentSeed);
    setSeedInUrl(currentSeed);
    const rng = createSeededRNG(currentSeed);

    const [targetRows, targetCols] = sizeKey.split('x').map(Number);
    let available = allPuzzles.filter(p =>
      p.rows === targetRows && p.cols === targetCols && p.difficulty === difficulty
    );

    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === targetRows && p.cols === targetCols);
    }

    if (available.length === 0) {
      available = allPuzzles.filter(p => p.difficulty === difficulty);
    }

    if (available.length === 0) {
      available = allPuzzles;
    }

    if (available.length === 0) {
      console.error('No Mochikoro puzzles available');
      return;
    }

    const puzzle = available[Math.floor(rng() * available.length)];
    const { rows, cols, clues, solution } = puzzle;

    setPuzzleData({
      clues,
      solution,
      rows,
      cols,
    });

    // Initialize grid - all cells start as white (unshaded)
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill('white')));
    setGameState('playing');
    setErrors(new Set());
  }, [allPuzzles, difficulty, sizeKey]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      const urlSeed = parseSeedFromUrl();
      initGame(urlSeed || undefined);
    }
  }, [loading, allPuzzles, initGame]);

  const rows = puzzleData?.rows || 7;
  const cols = puzzleData?.cols || 7;

  // Check validity and win condition
  useEffect(() => {
    if (!puzzleData || gameState !== 'playing') return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.clues, rows, cols)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.clues, rows, cols)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, rows, cols, gameState]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;
    if (puzzleData.clues[r][c] !== null) {
      // Clue cells can still be shaded/unshaded
    }

    const isBlackAction = e.type === 'contextmenu' || e.ctrlKey || !whiteMode;

    if (e.type === 'contextmenu') e.preventDefault();

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);

      if (whiteMode) {
        // In white mode, left-click marks as white
        newGrid[r][c] = newGrid[r][c] === 'white' ? null : 'white';
      } else {
        // Normal mode: left-click toggles black
        newGrid[r][c] = newGrid[r][c] === 'black' ? 'white' : 'black';
      }

      return newGrid;
    });
  };

  const handleReset = () => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill('white')));
    setGameState('playing');
    setErrors(new Set());
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  const handleNewGame = () => {
    initGame();
  };

  const handleSeedChange = (newSeed) => {
    initGame(newSeed);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Mochikoro"
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Mochikoro"
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
        <div className={styles.loading}>No puzzles available.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Mochikoro"
        instructions="Divide the grid into white rectangles. Each rectangle contains one number showing its area. Shade cells black to form borders. No 2×2 black squares allowed."
        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
      />

      <DifficultySelector
        options={DIFFICULTIES}
        value={difficulty}
        onChange={setDifficulty}
      />

      {availableSizes.length > 0 && (
        <SizeSelector
          options={availableSizes}
          value={sizeKey}
          onChange={setSizeKey}
        />
      )}

      <SeedDisplay seed={seed} onSeedChange={handleSeedChange} />

      <div className={styles.gameArea}>
        <button
          className={`${styles.modeToggle} ${whiteMode ? styles.whiteModeActive : ''}`}
          onClick={() => setWhiteMode(!whiteMode)}
        >
          {whiteMode ? '◻ White Mode ON' : '◼ Black Mode'}
        </button>

        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            width: `${Math.min(cols * 44, 500)}px`,
          }}
        >
          {Array(rows).fill(null).map((_, r) =>
            Array(cols).fill(null).map((_, c) => {
              const clue = puzzleData.clues[r][c];
              const hasClue = clue !== null;
              const isBlack = grid[r][c] === 'black';
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${hasClue ? styles.clue : ''}
                    ${isBlack ? styles.black : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  aria-label={hasClue ? `Clue: ${clue}` : isBlack ? 'Black' : 'White'}
                >
                  {hasClue && !isBlack && (
                    <span className={styles.clueValue}>{clue}</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎯 Puzzle Solved!"
            message="All rectangles formed correctly!"
            actions={[{ label: 'New Puzzle', onClick: handleNewGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Study the pattern and try another puzzle!"
            actions={[{ label: 'New Puzzle', onClick: handleNewGame, primary: true }]}
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
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={handleNewGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.blackLegend}`}></div>
            <span>Black (click)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.whiteLegend}`}></div>
            <span>White rectangle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
