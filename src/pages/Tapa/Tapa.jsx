import { useState, useEffect, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { createSeededRNG, generateRandomSeed, parseSeedFromUrl, setSeedInUrl } from '../../enigma-sdk/seeding';
import styles from './Tapa.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// 8 directions: up, up-right, right, down-right, down, down-left, left, up-left
const DIRECTIONS_8 = [
  [-1, 0], [-1, 1], [0, 1], [1, 1],
  [1, 0], [1, -1], [0, -1], [-1, -1]
];

// 4 orthogonal directions
const DIRECTIONS_4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * Get the shaded pattern around a clue cell as consecutive group lengths
 * Going clockwise from top: top, top-right, right, bottom-right, bottom, bottom-left, left, top-left
 */
export function getCluePattern(grid, row, col, size) {
  const runs = [];
  let currentRun = 0;

  // Check all 8 neighbors in clockwise order
  for (let i = 0; i < 8; i++) {
    const [dr, dc] = DIRECTIONS_8[i];
    const nr = row + dr;
    const nc = col + dc;

    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === true) {
      currentRun++;
    } else if (currentRun > 0) {
      runs.push(currentRun);
      currentRun = 0;
    }
  }

  // Handle wrap-around: if first and last neighbors are both shaded, they form one run
  if (currentRun > 0) {
    if (runs.length > 0 && grid[row + DIRECTIONS_8[0][0]]?.[col + DIRECTIONS_8[0][1]] === true) {
      // Check if starting cell is also shaded (wrap-around case)
      const [dr, dc] = DIRECTIONS_8[0];
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === true) {
        // Add to first run (wrap-around)
        runs[0] += currentRun;
      } else {
        runs.push(currentRun);
      }
    } else {
      runs.push(currentRun);
    }
  }

  return runs.sort((a, b) => a - b);
}

/**
 * Check if a clue is satisfied by the current grid
 */
export function isClueMatched(clue, pattern) {
  if (!clue || clue.length === 0) return pattern.length === 0;

  const sortedClue = [...clue].sort((a, b) => a - b);
  const sortedPattern = [...pattern].sort((a, b) => a - b);

  if (sortedClue.length !== sortedPattern.length) return false;
  return sortedClue.every((val, idx) => val === sortedPattern[idx]);
}

/**
 * Check if current pattern could potentially match the clue
 */
export function canClueBeSatisfied(clue, pattern, remainingUnshaded) {
  if (!clue || clue.length === 0) return pattern.length === 0 || remainingUnshaded > 0;

  const clueSum = clue.reduce((a, b) => a + b, 0);
  const patternSum = pattern.reduce((a, b) => a + b, 0);

  // If we've already shaded more than the clue allows, it's invalid
  if (patternSum > clueSum) return false;

  // If pattern has more runs than clue allows, invalid
  if (pattern.length > clue.length) return false;

  return true;
}

/**
 * Check for 2x2 shaded squares (not allowed in Tapa)
 */
export function has2x2ShadedSquare(grid, size) {
  const violations = [];

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] === true && grid[r+1][c] === true &&
          grid[r][c+1] === true && grid[r+1][c+1] === true) {
        violations.push([r, c], [r+1, c], [r, c+1], [r+1, c+1]);
      }
    }
  }

  return violations;
}

/**
 * Check if all shaded cells are connected (orthogonally)
 */
export function areShadedConnected(grid, size) {
  // Find first shaded cell
  let firstShaded = null;
  for (let r = 0; r < size && !firstShaded; r++) {
    for (let c = 0; c < size && !firstShaded; c++) {
      if (grid[r][c] === true) firstShaded = [r, c];
    }
  }

  if (!firstShaded) return true; // No shaded cells = trivially connected

  // BFS to find all connected shaded cells
  const visited = new Set();
  const queue = [firstShaded];
  visited.add(`${firstShaded[0]},${firstShaded[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [dr, dc] of DIRECTIONS_4) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          grid[nr][nc] === true && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  // Count total shaded cells
  let totalShaded = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === true) totalShaded++;
    }
  }

  return visited.size === totalShaded;
}

/**
 * Validate current grid state and return errors
 */
export function checkValidity(grid, clues, size) {
  const errors = new Set();

  // Check for 2x2 shaded squares
  const violations = has2x2ShadedSquare(grid, size);
  for (const [r, c] of violations) {
    errors.add(`${r},${c}`);
  }

  // Check each clue cell
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (clues[r][c] !== null) {
        // Clue cell shaded = error
        if (grid[r][c] === true) {
          errors.add(`${r},${c}`);
          continue;
        }

        const pattern = getCluePattern(grid, r, c, size);
        const clue = clues[r][c];

        // Count remaining unshaded neighbors
        let unshaded = 0;
        for (const [dr, dc] of DIRECTIONS_8) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              grid[nr][nc] !== true && clues[nr][nc] === null) {
            unshaded++;
          }
        }

        // Check if clue is already violated
        if (!canClueBeSatisfied(clue, pattern, unshaded)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

/**
 * Check if puzzle is solved
 */
export function checkSolved(grid, clues, size) {
  // Check no 2x2 shaded squares
  if (has2x2ShadedSquare(grid, size).length > 0) return false;

  // Check all shaded cells are connected
  if (!areShadedConnected(grid, size)) return false;

  // Check all clues are satisfied
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (clues[r][c] !== null) {
        // Clue cells cannot be shaded
        if (grid[r][c] === true) return false;

        const pattern = getCluePattern(grid, r, c, size);
        if (!isClueMatched(clues[r][c], pattern)) return false;
      }
    }
  }

  return true;
}

/**
 * Format clue for display (e.g., [1,1,2] => "1 1 2" or [0] => "0")
 */
export function formatClue(clue) {
  if (!clue || clue.length === 0) return '';
  if (clue.length === 1 && clue[0] === 0) return '0';
  return clue.join(' ');
}

// Get available sizes from dataset
function getAvailableSizes(puzzles, difficulty) {
  const sizes = new Set();
  puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}x${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [ar] = a.split('x').map(Number);
    const [br] = b.split('x').map(Number);
    return ar - br;
  });
}

export default function Tapa() {
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

  // Update sizeKey when difficulty changes if current size not available
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(sizeKey)) {
      setSizeKey(availableSizes[0]);
    }
  }, [availableSizes, sizeKey]);

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/tapaPuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Tapa puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback((customSeed = null) => {
    if (allPuzzles.length === 0) return;

    const currentSeed = customSeed ?? generateRandomSeed();
    setSeed(currentSeed);
    setSeedInUrl(currentSeed);
    const rng = createSeededRNG(currentSeed);

    // Filter by size and difficulty
    const [targetRows, targetCols] = sizeKey.split('x').map(Number);
    let available = allPuzzles.filter(p =>
      p.rows === targetRows && p.cols === targetCols && p.difficulty === difficulty
    );

    // Fallback to just size if no difficulty match
    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === targetRows && p.cols === targetCols);
    }

    // Fallback to any puzzle of the difficulty
    if (available.length === 0) {
      available = allPuzzles.filter(p => p.difficulty === difficulty);
    }

    // Final fallback
    if (available.length === 0) {
      available = allPuzzles;
    }

    if (available.length === 0) {
      console.error('No Tapa puzzles available');
      return;
    }

    const puzzle = available[Math.floor(rng() * available.length)];
    const { rows, cols, clues, solution } = puzzle;

    // Parse clues - they should already be arrays of numbers or null
    const parsedClues = clues.map(row =>
      row.map(cell => (cell === null || cell === '') ? null : cell)
    );

    // Parse solution - 'x' or true for shaded, anything else for unshaded
    const parsedSolution = solution.map(row =>
      row.map(cell => cell === 'x' || cell === true)
    );

    setPuzzleData({
      clues: parsedClues,
      solution: parsedSolution,
      rows,
      cols,
    });

    // Initialize empty grid (null = empty, true = shaded, false = marked white)
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
    setGameState('playing');
    setErrors(new Set());
  }, [allPuzzles, difficulty, sizeKey]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      // On initial load, check for URL seed
      const urlSeed = parseSeedFromUrl();
      initGame(urlSeed || undefined);
    }
  }, [loading, allPuzzles, initGame]);

  const rows = puzzleData?.rows || 10;
  const cols = puzzleData?.cols || 10;

  // Check validity and win condition
  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.clues, rows)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.clues, rows)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, rows]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;
    if (puzzleData.clues[r][c] !== null) return; // Can't shade clue cells

    const isWhiteAction = e.type === 'contextmenu' || e.ctrlKey || whiteMode;

    if (isWhiteAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      // Mark as white (explicitly not shaded)
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === false ? null : false;
        return newGrid;
      });
    } else {
      // Shade
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === true ? null : true;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
    setGameState('playing');
    setErrors(new Set());
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => row.map(cell => cell ? true : null)));
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
          title="Tapa"
          gradient="linear-gradient(135deg, #a855f7 0%, #6366f1 100%)"
        />
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Tapa"
          gradient="linear-gradient(135deg, #a855f7 0%, #6366f1 100%)"
        />
        <div className={styles.loading}>No puzzles available. Dataset may be loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Tapa"
        instructions="Shade cells so clue numbers show lengths of consecutive shaded groups around that cell. Shaded cells must connect orthogonally. No 2×2 shaded squares allowed."
        gradient="linear-gradient(135deg, #a855f7 0%, #6366f1 100%)"
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
        {/* Mobile White Toggle */}
        <button
          className={`${styles.whiteToggle} ${whiteMode ? styles.whiteModeActive : ''}`}
          onClick={() => setWhiteMode(!whiteMode)}
        >
          ○ {whiteMode ? 'White Mode ON' : 'White Mode'}
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
              const isShaded = grid[r][c] === true;
              const isMarkedWhite = grid[r][c] === false;
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${hasClue ? styles.clue : ''}
                    ${isShaded ? styles.shaded : ''}
                    ${isMarkedWhite ? styles.markedWhite : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={hasClue}
                  aria-label={hasClue ? `Clue: ${formatClue(clue)}` : isShaded ? 'Shaded' : 'Empty'}
                >
                  {hasClue && (
                    <span className={`${styles.clueValue} ${clue.length > 2 ? styles.smallClue : ''}`}>
                      {formatClue(clue)}
                    </span>
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
            message="All clues satisfied!"
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
            <div className={`${styles.legendBox} ${styles.shadedLegend}`}></div>
            <span>Shaded (click)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.whiteLegend}`}></div>
            <span>Not shaded (right-click)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
