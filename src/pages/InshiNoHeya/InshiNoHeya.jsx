import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './InshiNoHeya.module.css';

const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
};

const DIFFICULTY = {
  'Easy': { minRoomSize: 2, maxRoomSize: 3 },
  'Medium': { minRoomSize: 2, maxRoomSize: 4 },
  'Hard': { minRoomSize: 2, maxRoomSize: 5 },
};

// Inshi no heya (Factor Rooms) rules:
// - Fill the grid with numbers 1-N (where N is grid size)
// - Each row and column contains each number exactly once (Latin square)
// - The grid is divided into rooms (polyominoes)
// - Each room has a clue showing the product of all numbers in that room

// Generate random rooms covering the grid
function generateRooms(size, minRoomSize, maxRoomSize) {
  const roomGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  let roomId = 0;
  const rooms = [];

  // Use a flood-fill approach to create rooms
  const unassigned = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      unassigned.push([r, c]);
    }
  }

  // Shuffle
  for (let i = unassigned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unassigned[i], unassigned[j]] = [unassigned[j], unassigned[i]];
  }

  while (unassigned.length > 0) {
    // Find an unassigned cell
    const startIdx = unassigned.findIndex(([r, c]) => roomGrid[r][c] === -1);
    if (startIdx === -1) break;

    const [startR, startC] = unassigned[startIdx];
    const roomCells = [[startR, startC]];
    roomGrid[startR][startC] = roomId;

    // Grow room randomly
    const targetSize = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));

    let attempts = 0;
    while (roomCells.length < targetSize && attempts < 50) {
      attempts++;
      // Pick a random cell in the room
      const [r, c] = roomCells[Math.floor(Math.random() * roomCells.length)];

      // Get unassigned neighbors
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ].filter(([nr, nc]) =>
        nr >= 0 && nr < size && nc >= 0 && nc < size && roomGrid[nr][nc] === -1
      );

      if (neighbors.length > 0) {
        const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
        roomGrid[nr][nc] = roomId;
        roomCells.push([nr, nc]);
      }
    }

    rooms.push({ id: roomId, cells: roomCells, product: 0 });
    roomId++;

    // Remove assigned cells from unassigned
    unassigned.splice(0, unassigned.length,
      ...unassigned.filter(([r, c]) => roomGrid[r][c] === -1));
  }

  return { roomGrid, rooms };
}

// Generate a valid Latin square
function generateLatinSquare(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));

  // Simple shifted pattern
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = ((r + c) % size) + 1;
    }
  }

  // Shuffle rows within the grid
  for (let i = 0; i < size * 3; i++) {
    const r1 = Math.floor(Math.random() * size);
    const r2 = Math.floor(Math.random() * size);
    [grid[r1], grid[r2]] = [grid[r2], grid[r1]];
  }

  // Shuffle columns
  for (let i = 0; i < size * 3; i++) {
    const c1 = Math.floor(Math.random() * size);
    const c2 = Math.floor(Math.random() * size);
    for (let r = 0; r < size; r++) {
      [grid[r][c1], grid[r][c2]] = [grid[r][c2], grid[r][c1]];
    }
  }

  // Shuffle symbols
  const perm = Array.from({ length: size }, (_, i) => i + 1);
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = perm[grid[r][c] - 1];
    }
  }

  return grid;
}

// Generate complete puzzle
function generatePuzzle(size, difficultyKey) {
  const { minRoomSize, maxRoomSize } = DIFFICULTY[difficultyKey];

  // Generate Latin square solution
  const solution = generateLatinSquare(size);

  // Generate rooms
  const { roomGrid, rooms } = generateRooms(size, minRoomSize, maxRoomSize);

  // Calculate products for each room
  for (const room of rooms) {
    let product = 1;
    for (const [r, c] of room.cells) {
      product *= solution[r][c];
    }
    room.product = product;
  }

  return {
    solution,
    roomGrid,
    rooms,
    size,
  };
}

// Get room borders for a cell
function getRoomBorders(r, c, roomGrid, size) {
  const roomId = roomGrid[r][c];
  const borders = {
    top: r === 0 || roomGrid[r - 1][c] !== roomId,
    bottom: r === size - 1 || roomGrid[r + 1][c] !== roomId,
    left: c === 0 || roomGrid[r][c - 1] !== roomId,
    right: c === size - 1 || roomGrid[r][c + 1] !== roomId,
  };
  return borders;
}

// Check if puzzle is solved
function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

// Find errors in current state
function findErrors(grid, roomGrid, rooms, size) {
  const errors = new Set();

  // Check row duplicates
  for (let r = 0; r < size; r++) {
    const seen = new Map();
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (val > 0) {
        if (seen.has(val)) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${seen.get(val)}`);
        } else {
          seen.set(val, c);
        }
      }
    }
  }

  // Check column duplicates
  for (let c = 0; c < size; c++) {
    const seen = new Map();
    for (let r = 0; r < size; r++) {
      const val = grid[r][c];
      if (val > 0) {
        if (seen.has(val)) {
          errors.add(`${r},${c}`);
          errors.add(`${seen.get(val)},${c}`);
        } else {
          seen.set(val, r);
        }
      }
    }
  }

  // Check room products (only if room is complete)
  for (const room of rooms) {
    let product = 1;
    let complete = true;

    for (const [r, c] of room.cells) {
      if (grid[r][c] === 0) {
        complete = false;
        break;
      }
      product *= grid[r][c];
    }

    if (complete && product !== room.product) {
      for (const [r, c] of room.cells) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

// Export helpers for testing
export {
  GRID_SIZES,
  DIFFICULTY,
  generateRooms,
  generateLatinSquare,
  generatePuzzle,
  getRoomBorders,
  checkSolved,
  findErrors,
};

// Get room info for display (top-left cell of each room)
function getRoomDisplayCell(room) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of room.cells) {
    if (r < minR || (r === minR && c < minC)) {
      minR = r;
      minC = c;
    }
  }
  return [minR, minC];
}

export default function InshiNoHeya() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('5×5');
  const [difficultyKey, setDifficultyKey] = useState('Medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, difficultyKey);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(0)));
    setSelectedCell(null);
    resetGameState();
    setErrors(new Set());
  }, [size, difficultyKey, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const puzzleSize = puzzleData.size;
    if (!puzzleSize) return;

    // Ensure grid matches puzzle size before running checks
    if (grid.length !== puzzleSize || (grid[0] && grid[0].length !== puzzleSize)) {
      return;
    }

    if (showErrors) {
      setErrors(findErrors(grid, puzzleData.roomGrid, puzzleData.rooms, puzzleSize));
    } else {
      setErrors(new Set());
    }

    // Don't check for win if game is not in playing state
    if (!isPlaying) return;

    checkWin(checkSolved(grid, puzzleData.solution, puzzleSize));
  }, [grid, puzzleData, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    setSelectedCell([r, c]);
  };

  const handleKeyDown = useCallback((e) => {
    if (!selectedCell || !isPlaying || !puzzleData) return;

    const [r, c] = selectedCell;
    const puzzleSize = puzzleData.size;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = 0;
        return newGrid;
      });
      return;
    }

    if (e.key === 'Escape') {
      setSelectedCell(null);
      return;
    }

    // Arrow keys
    if (e.key === 'ArrowUp' && r > 0) {
      setSelectedCell([r - 1, c]);
      return;
    }
    if (e.key === 'ArrowDown' && r < puzzleSize - 1) {
      setSelectedCell([r + 1, c]);
      return;
    }
    if (e.key === 'ArrowLeft' && c > 0) {
      setSelectedCell([r, c - 1]);
      return;
    }
    if (e.key === 'ArrowRight' && c < puzzleSize - 1) {
      setSelectedCell([r, c + 1]);
      return;
    }

    // Number input
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= puzzleSize) {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = num;
        return newGrid;
      });
    }
  }, [selectedCell, isPlaying, puzzleData]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNumberPad = (num) => {
    if (!selectedCell || !isPlaying || !puzzleData) return;

    const [r, c] = selectedCell;
    const puzzleSize = puzzleData.size;

    if (num === 'clear') {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = 0;
        return newGrid;
      });
      return;
    }

    if (num >= 1 && num <= puzzleSize) {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = num;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(0)));
    setSelectedCell(null);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (!puzzleData) return null;

  const puzzleSize = puzzleData.size || size;

  // Get room display positions
  const roomDisplayCells = new Map();
  for (const room of puzzleData.rooms) {
    const [r, c] = getRoomDisplayCell(room);
    roomDisplayCells.set(`${r},${c}`, room.product);
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Inshi no Heya"
        instructions={`Fill in numbers 1-${puzzleSize} so each row and column has each number once. Numbers in each room must multiply to the shown product.`}
      />

      <div className={styles.selectors}>
        <SizeSelector
          sizes={Object.keys(GRID_SIZES)}
          selectedSize={sizeKey}
          onSizeChange={setSizeKey}
          getLabel={(key) => key}
        />
        <DifficultySelector
          difficulties={Object.keys(DIFFICULTY)}
          selectedDifficulty={difficultyKey}
          onDifficultyChange={setDifficultyKey}
        />
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${puzzleSize}, 1fr)`,
            width: `${puzzleSize * 55}px`,
            height: `${puzzleSize * 55}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((num, c) => {
              const borders = getRoomBorders(r, c, puzzleData.roomGrid, puzzleSize);
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasError = errors.has(`${r},${c}`);
              const roomProduct = roomDisplayCells.get(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.selected : ''}
                    ${hasError ? styles.error : ''}
                    ${borders.top ? styles.borderTop : ''}
                    ${borders.bottom ? styles.borderBottom : ''}
                    ${borders.left ? styles.borderLeft : ''}
                    ${borders.right ? styles.borderRight : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {roomProduct && (
                    <span className={styles.roomClue}>{roomProduct}</span>
                  )}
                  {num > 0 && <span className={styles.number}>{num}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            message="All products correct!"
          />
        )}

        <div className={styles.numberPad}>
          {Array.from({ length: puzzleSize }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberPad(num)}
            >
              {num}
            </button>
          ))}
          <button
            className={styles.numBtn}
            onClick={() => handleNumberPad('clear')}
          >
            ✕
          </button>
        </div>

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

        <div className={styles.hint}>
          <p>Use keyboard: Arrow keys to move, 1-{puzzleSize} to enter, Backspace to clear</p>
        </div>
      </div>
    </div>
  );
}
