import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Thermometers.module.css';
import { ThermometerBulb, ThermometerTube } from './ThermometerSVG';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '8×8': 8,
};

// Directions for thermometer orientations
const DIRECTIONS = [
  { dr: -1, dc: 0, name: 'up' },    // bulb at bottom, fills upward
  { dr: 1, dc: 0, name: 'down' },   // bulb at top, fills downward
  { dr: 0, dc: -1, name: 'left' },  // bulb at right, fills leftward
  { dr: 0, dc: 1, name: 'right' },  // bulb at left, fills rightward
];

function generatePuzzle(size) {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGeneratePuzzle(size);
    if (result) return result;
  }

  return tryGeneratePuzzle(size) || generateSimplePuzzle(size);
}

function tryGeneratePuzzle(size) {
  // Grid to track which cells belong to which thermometer
  const thermoGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  const thermometers = [];

  // Try to place thermometers
  const numThermometers = Math.floor(size * size * 0.3);
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

  for (const [startR, startC] of positions) {
    if (thermometers.length >= numThermometers) break;
    if (thermoGrid[startR][startC] !== -1) continue;

    // Shuffle directions
    const dirs = [...DIRECTIONS];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const dir of dirs) {
      const length = 2 + Math.floor(Math.random() * (Math.min(4, size - 1)));
      const cells = [];
      let valid = true;

      for (let i = 0; i < length && valid; i++) {
        const r = startR + dir.dr * i;
        const c = startC + dir.dc * i;

        if (r < 0 || r >= size || c < 0 || c >= size || thermoGrid[r][c] !== -1) {
          valid = false;
        } else {
          cells.push([r, c]);
        }
      }

      if (valid && cells.length >= 2) {
        const thermoId = thermometers.length;
        for (const [r, c] of cells) {
          thermoGrid[r][c] = thermoId;
        }
        thermometers.push({
          cells,
          direction: dir.name,
          bulb: cells[0],
        });
        break;
      }
    }
  }

  if (thermometers.length < 3) return null;

  // Generate a solution - randomly fill thermometers
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));

  // Track total filled to ensure puzzle isn't trivially empty
  let totalFilled = 0;
  for (const thermo of thermometers) {
    // Random fill level (0 to length)
    const fillLevel = Math.floor(Math.random() * (thermo.cells.length + 1));
    for (let i = 0; i < fillLevel; i++) {
      const [r, c] = thermo.cells[i];
      solution[r][c] = true;
      totalFilled++;
    }
  }

  // Ensure at least some cells are filled (avoid trivial empty puzzle)
  if (totalFilled < Math.ceil(thermometers.length / 2)) {
    // Fill at least one cell in each of the first few thermometers
    for (let i = 0; i < Math.min(3, thermometers.length); i++) {
      const [r, c] = thermometers[i].cells[0];
      if (!solution[r][c]) {
        solution[r][c] = true;
      }
    }
  }

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

  return {
    thermometers,
    thermoGrid,
    rowClues,
    colClues,
    solution,
  };
}

function generateSimplePuzzle(size) {
  const thermoGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  const thermometers = [];

  // Place horizontal thermometers in alternating rows
  for (let r = 0; r < size; r += 2) {
    const cells = [];
    for (let c = 0; c < Math.min(3, size); c++) {
      cells.push([r, c]);
      thermoGrid[r][c] = thermometers.length;
    }
    thermometers.push({ cells, direction: 'right', bulb: cells[0] });
  }

  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  for (const thermo of thermometers) {
    const fillLevel = 1 + Math.floor(Math.random() * thermo.cells.length);
    for (let i = 0; i < fillLevel; i++) {
      const [r, c] = thermo.cells[i];
      solution[r][c] = true;
    }
  }

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

  return { thermometers, thermoGrid, rowClues, colClues, solution };
}

function checkValidity(filled, thermometers, rowClues, colClues, size) {
  const errors = new Set();

  // Check thermometer fill order (must fill from bulb)
  for (const thermo of thermometers) {
    let sawEmpty = false;
    for (const [r, c] of thermo.cells) {
      if (filled[r][c]) {
        if (sawEmpty) {
          // Filled after empty - error
          errors.add(`${r},${c}`);
        }
      } else {
        sawEmpty = true;
      }
    }
  }

  // Check row counts
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (filled[r][c]) count++;
    }
    if (count > rowClues[r]) {
      for (let c = 0; c < size; c++) {
        if (filled[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check column counts
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (filled[r][c]) count++;
    }
    if (count > colClues[c]) {
      for (let r = 0; r < size; r++) {
        if (filled[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(filled, solution, rowClues, colClues, size) {
  // First verify row clues are satisfied
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (filled[r][c]) count++;
    }
    if (count !== rowClues[r]) return false;
  }

  // Verify column clues are satisfied
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (filled[r][c]) count++;
    }
    if (count !== colClues[c]) return false;
  }

  // Finally check if filled matches solution exactly
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (filled[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  GRID_SIZES,
  DIRECTIONS,
  generatePuzzle,
  tryGeneratePuzzle,
  generateSimplePuzzle,
  checkValidity,
  checkSolved,
};

export default function Thermometers() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [filled, setFilled] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setFilled(Array(size).fill(null).map(() => Array(size).fill(false)));
    resetGameState();
    setErrors(new Set());
  }, [size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors
      ? checkValidity(filled, puzzleData.thermometers, puzzleData.rowClues, puzzleData.colClues, size)
      : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(filled, puzzleData.solution, puzzleData.rowClues, puzzleData.colClues, size));
  }, [filled, puzzleData, showErrors, size, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    if (puzzleData.thermoGrid[r][c] === -1) return; // Not part of thermometer

    setFilled(prev => {
      const newFilled = prev.map(row => [...row]);
      newFilled[r][c] = !newFilled[r][c];
      return newFilled;
    });
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setFilled(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  const handleReset = () => {
    setFilled(Array(size).fill(null).map(() => Array(size).fill(false)));
    resetGameState();
  };

  const getCellInfo = (r, c) => {
    const thermoId = puzzleData.thermoGrid[r][c];
    if (thermoId === -1) return { isThermo: false };

    const thermo = puzzleData.thermometers[thermoId];
    const cellIndex = thermo.cells.findIndex(([cr, cc]) => cr === r && cc === c);
    const isBulb = cellIndex === 0;
    const isEnd = cellIndex === thermo.cells.length - 1;

    return {
      isThermo: true,
      isBulb,
      isEnd,
      direction: thermo.direction
    };
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Thermometers"
        instructions="Fill thermometers from the bulb (round end) upward. Mercury must be continuous from the bulb. Numbers show how many filled cells in each row/column."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <div className={styles.gameArea}>
        <div className={styles.gridWrapper}>
          {/* Column clues */}
          <div className={styles.colClues} style={{ gridTemplateColumns: `40px repeat(${size}, 1fr)` }}>
            <div></div>
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
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              {Array(size).fill(null).map((_, r) =>
                Array(size).fill(null).map((_, c) => {
                  const isFilled = filled[r][c];
                  const hasError = errors.has(`${r},${c}`);
                  const cellInfo = getCellInfo(r, c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${!cellInfo.isThermo ? styles.empty : ''}
                      `}
                      onClick={() => handleCellClick(r, c)}
                      disabled={!cellInfo.isThermo}
                    >
                      {cellInfo.isThermo && (
                        <>
                          {cellInfo.isBulb ? (
                            <ThermometerBulb
                              direction={cellInfo.direction}
                              filled={isFilled}
                              hasError={hasError}
                            />
                          ) : (
                            <ThermometerTube
                              direction={cellInfo.direction}
                              filled={isFilled}
                              hasError={hasError}
                              isEnd={cellInfo.isEnd}
                            />
                          )}
                        </>
                      )}
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
            title="🌡️ Puzzle Solved!"
            message="All thermometers correctly filled!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
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
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
