import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Congestion.module.css';

const GRID_SIZE = 6;
const EXIT_ROW = 2; // 0-indexed, the row where 'AA' needs to exit (row 3)

// Difficulty packs based on minimum moves to solve
const DIFFICULTY_PACKS = [
  { id: 'beginner', label: 'Beginner', range: [0, 1000], description: '1-10 moves' },
  { id: 'easy', label: 'Easy', range: [1000, 5000], description: '10-15 moves' },
  { id: 'medium', label: 'Medium', range: [5000, 15000], description: '15-25 moves' },
  { id: 'hard', label: 'Hard', range: [15000, 25000], description: '25-35 moves' },
  { id: 'expert', label: 'Expert', range: [25000, 33583], description: '35+ moves' },
];

// Vehicle colors - vibrant, distinct colors for each letter
const VEHICLE_COLORS = {
  A: { bg: '#ef4444', border: '#dc2626', text: '#fff' }, // Red - the target car!
  B: { bg: '#f59e0b', border: '#d97706', text: '#fff' }, // Amber
  C: { bg: '#10b981', border: '#059669', text: '#fff' }, // Emerald
  D: { bg: '#3b82f6', border: '#2563eb', text: '#fff' }, // Blue
  E: { bg: '#8b5cf6', border: '#7c3aed', text: '#fff' }, // Violet
  F: { bg: '#ec4899', border: '#db2777', text: '#fff' }, // Pink
  G: { bg: '#14b8a6', border: '#0d9488', text: '#fff' }, // Teal
  H: { bg: '#f97316', border: '#ea580c', text: '#fff' }, // Orange
  I: { bg: '#06b6d4', border: '#0891b2', text: '#fff' }, // Cyan
  J: { bg: '#84cc16', border: '#65a30d', text: '#fff' }, // Lime
  K: { bg: '#a855f7', border: '#9333ea', text: '#fff' }, // Purple
  L: { bg: '#6366f1', border: '#4f46e5', text: '#fff' }, // Indigo
  M: { bg: '#22c55e', border: '#16a34a', text: '#fff' }, // Green
  N: { bg: '#e11d48', border: '#be123c', text: '#fff' }, // Rose
  O: { bg: '#0ea5e9', border: '#0284c7', text: '#fff' }, // Sky
  x: { bg: '#374151', border: '#1f2937', text: '#9ca3af' }, // Gray - walls
};

function getVehicleColor(letter) {
  return VEHICLE_COLORS[letter] || { bg: '#6b7280', border: '#4b5563', text: '#fff' };
}

/**
 * Parse a 36-char puzzle string into a structured board
 */
function parsePuzzle(puzzleString) {
  const grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid.push([]);
    for (let col = 0; col < GRID_SIZE; col++) {
      const char = puzzleString[row * GRID_SIZE + col];
      grid[row].push(char === 'o' ? null : char);
    }
  }
  return grid;
}

/**
 * Extract vehicles from grid
 * Returns an object mapping vehicle letter to its properties
 */
function extractVehicles(grid) {
  const vehicles = {};
  const visited = new Set();

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = grid[row][col];
      if (!cell || cell === 'x' || visited.has(`${row},${col}`)) continue;

      const letter = cell;
      const positions = [];

      // Find all positions of this vehicle
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === letter) {
            positions.push({ row: r, col: c });
            visited.add(`${r},${c}`);
          }
        }
      }

      // Determine orientation
      const isHorizontal = positions.length > 1 && positions[0].row === positions[1].row;

      // Sort positions
      positions.sort((a, b) =>
        isHorizontal ? a.col - b.col : a.row - b.row
      );

      vehicles[letter] = {
        letter,
        positions,
        isHorizontal,
        length: positions.length,
        // Starting position is the first cell
        startRow: positions[0].row,
        startCol: positions[0].col,
      };
    }
  }

  return vehicles;
}

/**
 * Convert vehicles back to grid
 */
function vehiclesToGrid(vehicles) {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

  for (const vehicle of Object.values(vehicles)) {
    for (const pos of vehicle.positions) {
      grid[pos.row][pos.col] = vehicle.letter;
    }
  }

  return grid;
}

/**
 * Check if the red car can exit (won!)
 */
function checkWin(vehicles) {
  const redCar = vehicles['A'];
  if (!redCar) return false;

  // Red car wins when its rightmost position reaches column 5 (exit)
  const rightmost = Math.max(...redCar.positions.map(p => p.col));
  return rightmost === GRID_SIZE - 1 && redCar.startRow === EXIT_ROW;
}

/**
 * Try to move a vehicle by a delta
 * Returns new vehicles state if valid, or null if invalid
 */
function tryMoveVehicle(vehicles, letter, delta) {
  const vehicle = vehicles[letter];
  if (!vehicle || letter === 'x') return null;

  const newPositions = vehicle.positions.map(pos => ({
    row: pos.row + (vehicle.isHorizontal ? 0 : delta),
    col: pos.col + (vehicle.isHorizontal ? delta : 0),
  }));

  // Check bounds
  for (const pos of newPositions) {
    if (pos.row < 0 || pos.row >= GRID_SIZE || pos.col < 0 || pos.col >= GRID_SIZE) {
      return null;
    }
  }

  // Check collisions with other vehicles
  const newPosSet = new Set(newPositions.map(p => `${p.row},${p.col}`));
  const oldPosSet = new Set(vehicle.positions.map(p => `${p.row},${p.col}`));

  for (const [otherLetter, otherVehicle] of Object.entries(vehicles)) {
    if (otherLetter === letter) continue;
    for (const pos of otherVehicle.positions) {
      const key = `${pos.row},${pos.col}`;
      if (newPosSet.has(key) && !oldPosSet.has(key)) {
        return null;
      }
    }
  }

  // Valid move - create new state
  const newVehicles = { ...vehicles };
  newVehicles[letter] = {
    ...vehicle,
    positions: newPositions,
    startRow: newPositions[0].row,
    startCol: newPositions[0].col,
  };

  return newVehicles;
}

export default function Congestion() {
  const boardRef = useRef(null);

  const [allPuzzles, setAllPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [difficulty, setDifficulty] = useState(() =>
    localStorage.getItem('congestion.difficulty') || 'beginner'
  );
  const [levelIndex, setLevelIndex] = useState(() => {
    const saved = localStorage.getItem('congestion.levelIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [vehicles, setVehicles] = useState({});
  const [history, setHistory] = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const [dragState, setDragState] = useState(null);

  // Load puzzles
  useEffect(() => {
    async function loadPuzzles() {
      try {
        const res = await fetch('/datasets/rushhour/puzzles.json');
        if (!res.ok) throw new Error('Failed to load puzzles');
        const data = await res.json();
        setAllPuzzles(data);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    loadPuzzles();
  }, []);

  // Get puzzles for current difficulty
  const puzzlesForDifficulty = useMemo(() => {
    const pack = DIFFICULTY_PACKS.find(p => p.id === difficulty);
    if (!pack || !allPuzzles.length) return [];
    return allPuzzles.slice(pack.range[0], pack.range[1]);
  }, [allPuzzles, difficulty]);

  // Initialize level
  const initLevel = useCallback((puzzles, index) => {
    if (!puzzles.length) return;
    const clampedIndex = Math.max(0, Math.min(index, puzzles.length - 1));
    const puzzle = puzzles[clampedIndex];
    const grid = parsePuzzle(puzzle);
    const extracted = extractVehicles(grid);

    setVehicles(extracted);
    setHistory([]);
    setMoves(0);
    setWon(false);
    setLevelIndex(clampedIndex);
  }, []);

  useEffect(() => {
    if (puzzlesForDifficulty.length) {
      initLevel(puzzlesForDifficulty, levelIndex);
    }
  }, [puzzlesForDifficulty, initLevel]); // Don't include levelIndex to avoid loops

  // Save progress
  useEffect(() => {
    localStorage.setItem('congestion.difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('congestion.levelIndex', String(levelIndex));
  }, [levelIndex]);

  // Check win condition
  useEffect(() => {
    if (Object.keys(vehicles).length && checkWin(vehicles)) {
      setWon(true);
    }
  }, [vehicles]);

  const handleMove = useCallback((letter, delta) => {
    if (won) return;

    const newVehicles = tryMoveVehicle(vehicles, letter, delta);
    if (newVehicles) {
      setHistory(prev => [...prev, vehicles]);
      setVehicles(newVehicles);
      setMoves(m => m + 1);
    }
  }, [vehicles, won]);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setVehicles(prev);
    setHistory(h => h.slice(0, -1));
    setMoves(m => Math.max(0, m - 1));
    setWon(false);
  }, [history]);

  const reset = useCallback(() => {
    initLevel(puzzlesForDifficulty, levelIndex);
  }, [initLevel, puzzlesForDifficulty, levelIndex]);

  const goNext = useCallback(() => {
    const next = levelIndex + 1;
    if (next < puzzlesForDifficulty.length) {
      initLevel(puzzlesForDifficulty, next);
    }
  }, [initLevel, puzzlesForDifficulty, levelIndex]);

  const goPrev = useCallback(() => {
    const prev = levelIndex - 1;
    if (prev >= 0) {
      initLevel(puzzlesForDifficulty, prev);
    }
  }, [initLevel, puzzlesForDifficulty, levelIndex]);

  const changeDifficulty = useCallback((newDiff) => {
    setDifficulty(newDiff);
    setLevelIndex(0);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'u' || e.key === 'U' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'r' || e.key === 'R') {
        reset();
      }
      if (e.key === 'n' || e.key === 'N') {
        goNext();
      }
      if (e.key === 'p' || e.key === 'P') {
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, reset, goNext, goPrev]);

  // Click handler for vehicles
  const handleCellClick = useCallback((row, col, e) => {
    if (won) return;

    const grid = vehiclesToGrid(vehicles);
    const letter = grid[row][col];
    if (!letter || letter === 'x') return;

    const vehicle = vehicles[letter];
    if (!vehicle) return;

    // Determine which direction to try based on click position within cell
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    let delta;
    if (vehicle.isHorizontal) {
      delta = clickX > centerX ? 1 : -1;
    } else {
      delta = clickY > centerY ? 1 : -1;
    }

    // Try the clicked direction first, then opposite
    if (!tryMoveVehicle(vehicles, letter, delta)) {
      delta = -delta;
    }
    handleMove(letter, delta);
  }, [vehicles, won, handleMove]);

  // Drag handlers
  const handleDragStart = useCallback((letter, e) => {
    if (won) return;
    const vehicle = vehicles[letter];
    if (!vehicle || letter === 'x') return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragState({
      letter,
      startX: clientX,
      startY: clientY,
      moved: 0,
    });
  }, [vehicles, won]);

  const handleDragMove = useCallback((e) => {
    if (!dragState) return;

    const vehicle = vehicles[dragState.letter];
    if (!vehicle) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;

    // Cell size (approximate)
    const cellSize = 60;
    const threshold = cellSize * 0.5;

    let delta = 0;
    if (vehicle.isHorizontal) {
      if (Math.abs(deltaX) > threshold) {
        delta = deltaX > 0 ? 1 : -1;
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        delta = deltaY > 0 ? 1 : -1;
      }
    }

    if (delta !== 0) {
      const newVehicles = tryMoveVehicle(vehicles, dragState.letter, delta);
      if (newVehicles) {
        setHistory(prev => [...prev, vehicles]);
        setVehicles(newVehicles);
        setMoves(m => m + 1);
        setDragState(prev => ({
          ...prev,
          startX: clientX,
          startY: clientY,
          moved: prev.moved + 1,
        }));
      }
    }
  }, [dragState, vehicles]);

  const handleDragEnd = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragState, handleDragMove, handleDragEnd]);

  const grid = useMemo(() => vehiclesToGrid(vehicles), [vehicles]);

  const instructions = (
    <>
      Click or drag vehicles to slide them. Get the <span className={styles.redCar}>red car</span> to the exit!
      Undo <span className={styles.pill}>U</span>, reset <span className={styles.pill}>R</span>,
      prev/next <span className={styles.pill}>P</span>/<span className={styles.pill}>N</span>.
    </>
  );

  const pack = DIFFICULTY_PACKS.find(p => p.id === difficulty);

  return (
    <div className={styles.page}>
      <GameHeader title="Congestion" instructions={instructions}>
        <div className={styles.subHeader}>
          <div className={styles.packRow}>
            <label className={styles.label}>
              Difficulty
              <select
                className={styles.select}
                value={difficulty}
                onChange={(e) => changeDifficulty(e.target.value)}
              >
                {DIFFICULTY_PACKS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.description})
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.meta}>
              <span className={styles.badge}>
                Level {levelIndex + 1}/{puzzlesForDifficulty.length}
              </span>
              <span className={styles.badge}>Moves: {moves}</span>
              {won && <span className={`${styles.badge} ${styles.won}`}>🎉 Solved!</span>}
            </div>
          </div>
        </div>
      </GameHeader>

      <div className={styles.main}>
        <div className={styles.controls}>
          <button className={styles.button} onClick={goPrev} disabled={levelIndex === 0}>
            Prev
          </button>
          <button className={styles.button} onClick={goNext} disabled={levelIndex >= puzzlesForDifficulty.length - 1}>
            Next
          </button>
          <button className={styles.button} onClick={reset}>
            Reset
          </button>
          <button className={styles.button} onClick={undo} disabled={!history.length}>
            Undo
          </button>
        </div>

        <div className={styles.boardContainer}>
          {loading && <div className={styles.notice}>Loading puzzles...</div>}
          {error && <div className={styles.noticeError}>Error: {error}</div>}

          {!loading && !error && (
            <div className={styles.boardWrapper}>
              <div
                ref={boardRef}
                className={styles.board}
                tabIndex={0}
              >
                {/* Exit indicator */}
                <div className={styles.exitIndicator}>
                  <span className={styles.exitArrow}>→</span>
                  <span className={styles.exitText}>EXIT</span>
                </div>

                {/* Grid cells */}
                {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
                  const row = Math.floor(idx / GRID_SIZE);
                  const col = idx % GRID_SIZE;
                  const letter = grid[row][col];
                  const isWall = letter === 'x';
                  const isVehicle = letter && letter !== 'x';
                  const vehicle = isVehicle ? vehicles[letter] : null;
                  const color = letter ? getVehicleColor(letter) : null;

                  // Determine if this is the first cell of a vehicle (for rendering)
                  const isFirstCell = vehicle &&
                    vehicle.positions[0].row === row &&
                    vehicle.positions[0].col === col;

                  // Calculate vehicle dimensions for first cell
                  let vehicleStyle = {};
                  if (isFirstCell && vehicle) {
                    const cellSize = 60;
                    const gap = 4;
                    if (vehicle.isHorizontal) {
                      vehicleStyle = {
                        width: `${vehicle.length * cellSize + (vehicle.length - 1) * gap}px`,
                        height: `${cellSize}px`,
                        backgroundColor: color.bg,
                        borderColor: color.border,
                      };
                    } else {
                      vehicleStyle = {
                        width: `${cellSize}px`,
                        height: `${vehicle.length * cellSize + (vehicle.length - 1) * gap}px`,
                        backgroundColor: color.bg,
                        borderColor: color.border,
                      };
                    }
                  }

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`${styles.cell} ${isWall ? styles.wall : ''}`}
                      onClick={(e) => handleCellClick(row, col, e)}
                    >
                      {isFirstCell && vehicle && (
                        <div
                          className={`${styles.vehicle} ${vehicle.isHorizontal ? styles.horizontal : styles.vertical} ${letter === 'A' ? styles.targetCar : ''} ${dragState?.letter === letter ? styles.dragging : ''}`}
                          style={vehicleStyle}
                          onMouseDown={(e) => handleDragStart(letter, e)}
                          onTouchStart={(e) => handleDragStart(letter, e)}
                        >
                          <span className={styles.vehicleIcon}>
                            {letter === 'A' ? '🚗' : vehicle.length === 3 ? '🚚' : '🚙'}
                          </span>
                        </div>
                      )}
                      {isWall && <div className={styles.wallBlock}>✕</div>}
                    </div>
                  );
                })}
              </div>

              {/* Win overlay */}
              {won && (
                <div className={styles.winOverlay}>
                  <div className={styles.winContent}>
                    <div className={styles.winEmoji}>🎉</div>
                    <div className={styles.winTitle}>Puzzle Solved!</div>
                    <div className={styles.winStats}>Completed in {moves} moves</div>
                    <button className={styles.nextButton} onClick={goNext}>
                      Next Puzzle →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.attribution}>
            Puzzles from Michael Fogleman's Rush Hour database (MIT License).
            See <a className={styles.link} href="/datasets/rushhour/README.md">dataset info</a> and{' '}
            <a className={styles.link} href="/datasets/rushhour/LICENSE.md">license</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
