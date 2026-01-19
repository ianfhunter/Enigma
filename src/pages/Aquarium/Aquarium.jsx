import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Aquarium.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Analyze tank structure - find rows each tank occupies and cells per row
function analyzeTanks(tanks) {
  const size = tanks.length;
  const tankInfo = {};

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const tank = tanks[r][c];
      if (!(tank in tankInfo)) {
        tankInfo[tank] = { rows: new Set(), rowCells: {}, topRow: size, bottomRow: -1 };
      }
      tankInfo[tank].rows.add(r);
      if (!tankInfo[tank].rowCells[r]) tankInfo[tank].rowCells[r] = [];
      tankInfo[tank].rowCells[r].push(c);
      tankInfo[tank].topRow = Math.min(tankInfo[tank].topRow, r);
      tankInfo[tank].bottomRow = Math.max(tankInfo[tank].bottomRow, r);
    }
  }

  return tankInfo;
}

// Solve the puzzle - returns all solutions (up to a limit)
function solvePuzzle(tanks, rowClues, colClues, maxSolutions = 2) {
  const size = tanks.length;
  const tankInfo = analyzeTanks(tanks);
  const tankIds = Object.keys(tankInfo).map(Number);
  const solutions = [];

  // For each tank, possible water levels are: no water (level = bottomRow+1) or
  // water starting at any row from topRow to bottomRow
  // Water level L means all cells in rows >= L are filled

  function getTankPossibleLevels(tankId) {
    const info = tankInfo[tankId];
    const levels = [];
    // No water: level beyond bottom
    levels.push(info.bottomRow + 1);
    // Water at various levels
    for (let r = info.bottomRow; r >= info.topRow; r--) {
      levels.push(r);
    }
    return levels;
  }

  // Apply a water level to a tank and get the filled cells
  function getTankFilledCells(tankId, waterLevel) {
    const info = tankInfo[tankId];
    const cells = [];
    for (let r = waterLevel; r <= info.bottomRow; r++) {
      if (info.rowCells[r]) {
        for (const c of info.rowCells[r]) {
          cells.push([r, c]);
        }
      }
    }
    return cells;
  }

  // Backtracking solver
  function solve(tankIndex, currentRowCounts, currentColCounts) {
    if (solutions.length >= maxSolutions) return;

    if (tankIndex >= tankIds.length) {
      // Check if all clues are satisfied
      for (let r = 0; r < size; r++) {
        if (currentRowCounts[r] !== rowClues[r]) return;
      }
      for (let c = 0; c < size; c++) {
        if (currentColCounts[c] !== colClues[c]) return;
      }
      // Valid solution found - reconstruct it
      solutions.push(true); // Just count, don't store full grid
      return;
    }

    const tankId = tankIds[tankIndex];
    const levels = getTankPossibleLevels(tankId);

    for (const level of levels) {
      const cells = getTankFilledCells(tankId, level);

      // Check if this level is feasible (doesn't exceed clues)
      let feasible = true;
      const rowDeltas = {};
      const colDeltas = {};

      for (const [r, c] of cells) {
        rowDeltas[r] = (rowDeltas[r] || 0) + 1;
        colDeltas[c] = (colDeltas[c] || 0) + 1;
      }

      for (const r in rowDeltas) {
        if (currentRowCounts[r] + rowDeltas[r] > rowClues[r]) {
          feasible = false;
          break;
        }
      }

      if (feasible) {
        for (const c in colDeltas) {
          if (currentColCounts[c] + colDeltas[c] > colClues[c]) {
            feasible = false;
            break;
          }
        }
      }

      if (feasible) {
        // Apply this level
        const newRowCounts = [...currentRowCounts];
        const newColCounts = [...currentColCounts];
        for (const r in rowDeltas) newRowCounts[r] += rowDeltas[r];
        for (const c in colDeltas) newColCounts[c] += colDeltas[c];

        solve(tankIndex + 1, newRowCounts, newColCounts);
      }
    }
  }

  solve(0, Array(size).fill(0), Array(size).fill(0));
  return solutions.length;
}

function generateTanks(size) {
  const tanks = Array(size).fill(null).map(() => Array(size).fill(-1));
  const numTanks = Math.floor(size * 1.2);

  // Seed tanks
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Place tank seeds
  for (let i = 0; i < numTanks && i < positions.length; i++) {
    const [r, c] = positions[i];
    if (tanks[r][c] === -1) {
      tanks[r][c] = i;
    }
  }

  // Grow tanks
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (tanks[r][c] !== -1) continue;

        const neighbors = [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]
          .filter(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size && tanks[nr][nc] !== -1);

        if (neighbors.length > 0) {
          const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
          tanks[r][c] = tanks[nr][nc];
          changed = true;
        }
      }
    }
  }

  return tanks;
}

function generateSolutionForTanks(tanks) {
  const size = tanks.length;
  const tankInfo = analyzeTanks(tanks);
  const tankWaterLevels = {};

  // Generate random water level for each tank
  for (const tankId in tankInfo) {
    const info = tankInfo[tankId];
    const tankHeight = info.bottomRow - info.topRow + 1;
    // Water level can be from topRow (full) to bottomRow+1 (empty)
    tankWaterLevels[tankId] = info.topRow + Math.floor(Math.random() * (tankHeight + 1));
  }

  // Create solution grid
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const tank = tanks[r][c];
      if (r >= tankWaterLevels[tank]) {
        solution[r][c] = true;
      }
    }
  }

  return solution;
}

function generatePuzzle(size) {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate tank layout
    const tanks = generateTanks(size);

    // Generate a random solution
    const solution = generateSolutionForTanks(tanks);

    // Calculate row and column clues
    const rowClues = Array(size).fill(0);
    const colClues = Array(size).fill(0);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c]) {
          rowClues[r]++;
          colClues[c]++;
        }
      }
    }

    // Check if this puzzle has exactly one solution
    const numSolutions = solvePuzzle(tanks, rowClues, colClues, 2);

    if (numSolutions === 1) {
      return { tanks, solution, rowClues, colClues };
    }
  }

  // Fallback: return a puzzle even if not unique (shouldn't happen often)
  console.warn('Could not generate unique puzzle after', maxAttempts, 'attempts');
  const tanks = generateTanks(size);
  const solution = generateSolutionForTanks(tanks);
  const rowClues = Array(size).fill(0);
  const colClues = Array(size).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c]) {
        rowClues[r]++;
        colClues[c]++;
      }
    }
  }
  return { tanks, solution, rowClues, colClues };
}

function checkValidity(tanks, water, rowClues, colClues) {
  const size = tanks.length;
  const errors = new Set();
  const tankInfo = analyzeTanks(tanks);

  // Check row counts
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (water[r][c]) count++;
    }
    if (count > rowClues[r]) {
      for (let c = 0; c < size; c++) {
        if (water[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check column counts
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (water[r][c]) count++;
    }
    if (count > colClues[c]) {
      for (let r = 0; r < size; r++) {
        if (water[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check water settling rules for each tank
  // Rule 1: Water must be uniform across each row of a tank (all or none)
  // Rule 2: Water settles to bottom - if a row has air, all rows above must also be air
  for (const tankId in tankInfo) {
    const info = tankInfo[tankId];
    // Traverse bottom to top (high row numbers to low) since water settles down
    const rows = Array.from(info.rows).sort((a, b) => b - a);

    // Check each row of the tank (starting from bottom)
    let foundAirRow = false;
    for (const r of rows) {
      const cells = info.rowCells[r];
      const waterCount = cells.filter(c => water[r][c]).length;

      // Rule 1: Row must be all water or all air
      if (waterCount > 0 && waterCount < cells.length) {
        // Partial fill - mark all cells in this row as errors
        for (const c of cells) {
          errors.add(`${r},${c}`);
        }
        // Partial fill also counts as having air
        foundAirRow = true;
      }

      // Rule 2: Check water settling (water can't float above air)
      const hasWater = waterCount === cells.length;
      const hasAir = waterCount === 0;

      if (hasAir) {
        foundAirRow = true;
      } else if (hasWater && foundAirRow) {
        // Water floating above air - mark as error
        for (const c of cells) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

function checkSolved(tanks, water, solution, _rowClues, _colClues) {
  const size = tanks.length;

  // Check exact match with solution
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (water[r][c] !== solution[r][c]) return false;
    }
  }

  return true;
}

const TANK_COLORS = [
  'rgba(239, 68, 68, 0.15)',
  'rgba(249, 115, 22, 0.15)',
  'rgba(234, 179, 8, 0.15)',
  'rgba(34, 197, 94, 0.15)',
  'rgba(14, 165, 233, 0.15)',
  'rgba(99, 102, 241, 0.15)',
  'rgba(168, 85, 247, 0.15)',
  'rgba(236, 72, 153, 0.15)',
  'rgba(20, 184, 166, 0.15)',
  'rgba(251, 191, 36, 0.15)',
];

export default function Aquarium() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [water, setWater] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setWater(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(puzzleData.tanks, water, puzzleData.rowClues, puzzleData.colClues) : new Set();
    setErrors(newErrors);

    if (checkSolved(puzzleData.tanks, water, puzzleData.solution, puzzleData.rowClues, puzzleData.colClues)) {
      setGameState('won');
    }
  }, [water, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;

    const tank = puzzleData.tanks[r][c];
    const tankInfo = analyzeTanks(puzzleData.tanks);
    const info = tankInfo[tank];

    setWater(prev => {
      const newWater = prev.map(row => [...row]);
      const wasWater = newWater[r][c];

      if (wasWater) {
        // Clicking on water: remove water from this row and all rows ABOVE in this tank
        for (const row of info.rows) {
          if (row <= r) {
            for (const col of info.rowCells[row]) {
              newWater[row][col] = false;
            }
          }
        }
      } else {
        // Clicking on air: add water to this row and all rows BELOW in this tank
        for (const row of info.rows) {
          if (row >= r) {
            for (const col of info.rowCells[row]) {
              newWater[row][col] = true;
            }
          }
        }
      }

      return newWater;
    });
  };

  const handleReset = () => {
    setWater(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    setWater(puzzleData.solution.map(row => [...row]));
    setGameState('gave_up');
  };

  if (!puzzleData) return null;

  // Calculate border classes for tanks
  const getBorderClasses = (r, c) => {
    const tank = puzzleData.tanks[r][c];
    const classes = [];
    if (r === 0 || puzzleData.tanks[r-1][c] !== tank) classes.push(styles.borderTop);
    if (r === size - 1 || puzzleData.tanks[r+1]?.[c] !== tank) classes.push(styles.borderBottom);
    if (c === 0 || puzzleData.tanks[r][c-1] !== tank) classes.push(styles.borderLeft);
    if (c === size - 1 || puzzleData.tanks[r][c+1] !== tank) classes.push(styles.borderRight);
    return classes.join(' ');
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Aquarium"
        instructions="Fill water in tanks to match row and column totals. Water settles to the bottom and fills evenly across each tank row. Click to toggle water level."
      />

      <SizeSelector
        options={Object.keys(GRID_SIZES)}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <div className={styles.gameArea}>
        <div className={styles.gridWrapper}>
          {/* Column clues */}
          <div className={styles.colClues} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {puzzleData.colClues.map((clue, c) => (
              <div key={c} className={styles.clue}>{clue}</div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Row clues */}
            <div className={styles.rowClues}>
              {puzzleData.rowClues.map((clue, r) => (
                <div key={r} className={styles.clue}>{clue}</div>
              ))}
            </div>

            {/* Grid */}
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${size}, 1fr)`,
              }}
            >
              {puzzleData.tanks.map((row, r) =>
                row.map((tank, c) => {
                  const hasWater = water[r][c];
                  const hasError = errors.has(`${r},${c}`);
                  const tankColor = TANK_COLORS[tank % TANK_COLORS.length];

                  return (
                    <button
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${getBorderClasses(r, c)}
                        ${hasWater ? styles.water : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      style={{ backgroundColor: hasWater ? 'rgba(6, 182, 212, 0.6)' : tankColor }}
                      onClick={() => handleCellClick(r, c)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🐠 Puzzle Solved!"
            message="Aquariums perfectly filled!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gave_up' && (
          <GameResult
            state="gaveup"
            title="💧 Solution Revealed"
            message="Better luck next time!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
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
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
