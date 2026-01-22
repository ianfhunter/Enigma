import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Campixu.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Generate a valid Campixu (Tents-style Nonogram) puzzle
function generateSolution(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const trees = [];
  const tents = [];

  // Target number of tree-tent pairs
  const targetPairs = Math.floor(size * size * 0.15);

  // Shuffle all positions
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let placed = 0;

  for (const [r, c] of positions) {
    if (placed >= targetPairs) break;
    if (grid[r][c] !== null) continue;

    // Get orthogonal neighbors for tent
    const neighbors = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
    ].filter(([nr, nc]) =>
      nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === null
    );

    if (neighbors.length === 0) continue;

    // Shuffle neighbors
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    // Try to place tent
    for (const [tr, tc] of neighbors) {
      // Check no adjacent tents (8 neighbors)
      let valid = true;
      for (let dr = -1; dr <= 1 && valid; dr++) {
        for (let dc = -1; dc <= 1 && valid; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = tr + dr;
          const nc = tc + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'tent') {
            valid = false;
          }
        }
      }

      if (valid) {
        grid[r][c] = 'tree';
        grid[tr][tc] = 'tent';
        trees.push([r, c]);
        tents.push([tr, tc]);
        placed++;
        break;
      }
    }
  }

  return { grid, trees, tents };
}

// Generate row and column clues (like nonogram)
function generateClues(grid, size) {
  const rowClues = [];
  const colClues = [];

  // Row clues - runs of tents
  for (let r = 0; r < size; r++) {
    const clue = [];
    let run = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'tent') {
        run++;
      } else if (run > 0) {
        clue.push(run);
        run = 0;
      }
    }
    if (run > 0) clue.push(run);
    rowClues.push(clue.length > 0 ? clue : [0]);
  }

  // Column clues
  for (let c = 0; c < size; c++) {
    const clue = [];
    let run = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 'tent') {
        run++;
      } else if (run > 0) {
        clue.push(run);
        run = 0;
      }
    }
    if (run > 0) clue.push(run);
    colClues.push(clue.length > 0 ? clue : [0]);
  }

  return { rowClues, colClues };
}

function generatePuzzle(size) {
  const { grid, trees, tents } = generateSolution(size);
  const { rowClues, colClues } = generateClues(grid, size);

  // Create the puzzle grid (only show trees)
  const puzzle = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const [r, c] of trees) {
    puzzle[r][c] = 'tree';
  }

  return { puzzle, solution: grid, trees, tents, rowClues, colClues, size };
}

function checkValidity(playerGrid, puzzle, rowClues, colClues, size) {
  const errors = new Set();

  // Check tents don't touch (8 neighbors)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] !== 'tent') continue;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerGrid[nr][nc] === 'tent') {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  // Check tents are adjacent to trees
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] !== 'tent') continue;

      let hasAdjacentTree = false;
      for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && puzzle[nr][nc] === 'tree') {
          hasAdjacentTree = true;
          break;
        }
      }

      if (!hasAdjacentTree) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function getRowColCluesStatus(playerGrid, rowClues, colClues, size) {
  const rowStatus = [];
  const colStatus = [];

  // Check row clues
  for (let r = 0; r < size; r++) {
    const actual = [];
    let run = 0;
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] === 'tent') {
        run++;
      } else if (run > 0) {
        actual.push(run);
        run = 0;
      }
    }
    if (run > 0) actual.push(run);
    if (actual.length === 0) actual.push(0);

    rowStatus.push(JSON.stringify(actual) === JSON.stringify(rowClues[r]) ? 'complete' : 'incomplete');
  }

  // Check column clues
  for (let c = 0; c < size; c++) {
    const actual = [];
    let run = 0;
    for (let r = 0; r < size; r++) {
      if (playerGrid[r][c] === 'tent') {
        run++;
      } else if (run > 0) {
        actual.push(run);
        run = 0;
      }
    }
    if (run > 0) actual.push(run);
    if (actual.length === 0) actual.push(0);

    colStatus.push(JSON.stringify(actual) === JSON.stringify(colClues[c]) ? 'complete' : 'incomplete');
  }

  return { rowStatus, colStatus };
}

function checkSolved(playerGrid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const expected = solution[r][c] === 'tent';
      const actual = playerGrid[r][c] === 'tent';
      if (expected !== actual) return false;
    }
  }
  return true;
}

export default function Campixu() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [cluesStatus, setCluesStatus] = useState({ rowStatus: [], colStatus: [] });
  const [grassMode, setGrassMode] = useState(false); // Mobile grass mode

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPlayerGrid(data.puzzle.map(row => [...row]));
    resetGameState();
    setErrors(new Set());
  }, [size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors
      ? checkValidity(playerGrid, puzzleData.puzzle, puzzleData.rowClues, puzzleData.colClues, size)
      : new Set();
    setErrors(newErrors);

    setCluesStatus(getRowColCluesStatus(playerGrid, puzzleData.rowClues, puzzleData.colClues, size));

    checkWin(checkSolved(playerGrid, puzzleData.solution, size));
  }, [playerGrid, puzzleData, showErrors, size, isPlaying, checkWin]);

  const handleCellClick = (r, c, e) => {
    if (!isPlaying) return;
    if (puzzleData.puzzle[r][c] === 'tree') return; // Can't click on trees

    const isGrassAction = e.type === 'contextmenu' || e.ctrlKey || grassMode;

    if (isGrassAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      // Mark as grass/empty
      setPlayerGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === 'grass' ? null : 'grass';
        return newGrid;
      });
    } else {
      // Place/remove tent
      setPlayerGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === 'tent' ? null : 'tent';
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setPlayerGrid(puzzleData.puzzle.map(row => [...row]));
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    // Reveal solution - show tents in their correct positions
    const solutionGrid = puzzleData.puzzle.map((row, r) =>
      row.map((cell, c) => puzzleData.solution[r][c] === 'tent' ? 'tent' : cell)
    );
    setPlayerGrid(solutionGrid);
    giveUp();
  };

  if (!puzzleData) return null;

  const maxColClues = Math.max(...puzzleData.colClues.map(c => c.length));
  const maxRowClues = Math.max(...puzzleData.rowClues.map(c => c.length));

  return (
    <div className={styles.container}>
      <GameHeader
        title="Campixu"
        instructions="Place tents (⛺) using nonogram clues. Numbers show runs of consecutive tents. Tents must be adjacent to a tree and cannot touch each other (even diagonally)."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selectedSize={sizeKey}
        onSizeChange={setSizeKey}
        getLabel={(key) => key}
      />

      <div className={styles.gameArea}>
        {/* Mobile Grass Toggle */}
        <button
          className={`${styles.grassToggle} ${grassMode ? styles.grassModeActive : ''}`}
          onClick={() => setGrassMode(!grassMode)}
        >
          🌿 {grassMode ? 'Grass Mode ON' : 'Grass Mode'}
        </button>

        <div className={styles.gridWrapper}>
          {/* Column clues */}
          <div
            className={styles.colClues}
            style={{
              gridTemplateColumns: `${maxRowClues * 20}px repeat(${size}, 1fr)`,
              height: `${maxColClues * 20}px`
            }}
          >
            <div className={styles.corner}></div>
            {puzzleData.colClues.map((clue, c) => (
              <div
                key={c}
                className={`${styles.colClue} ${cluesStatus.colStatus[c] === 'complete' ? styles.complete : ''}`}
              >
                {clue.map((n, i) => (
                  <span key={i}>{n}</span>
                ))}
              </div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Row clues */}
            <div className={styles.rowClues} style={{ width: `${maxRowClues * 20}px` }}>
              {puzzleData.rowClues.map((clue, r) => (
                <div
                  key={r}
                  className={`${styles.rowClue} ${cluesStatus.rowStatus[r] === 'complete' ? styles.complete : ''}`}
                >
                  {clue.map((n, i) => (
                    <span key={i}>{n}</span>
                  ))}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div
              className={styles.grid}
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              {playerGrid.map((row, r) =>
                row.map((cell, c) => {
                  const isTree = cell === 'tree';
                  const isTent = cell === 'tent';
                  const isGrass = cell === 'grass';
                  const hasError = errors.has(`${r},${c}`);

                  return (
                    <button
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${isTree ? styles.tree : ''}
                        ${isTent ? styles.tent : ''}
                        ${isGrass ? styles.grass : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={(e) => handleCellClick(r, c, e)}
                      onContextMenu={(e) => handleCellClick(r, c, e)}
                      disabled={isTree}
                    >
                      {isTree && '🌲'}
                      {isTent && '⛺'}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Camp Complete!"
            message="All tents perfectly placed!"
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
          <span>Click: Place tent</span>
          <span>Right-click: Mark grass</span>
        </div>
      </div>
    </div>
  );
}
