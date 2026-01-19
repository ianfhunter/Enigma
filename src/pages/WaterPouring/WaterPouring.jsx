import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import GameResult from '../../components/GameResult';
import styles from './WaterPouring.module.css';

// GCD using Euclidean algorithm
function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// GCD of multiple numbers
function gcdMultiple(nums) {
  return nums.reduce((acc, n) => gcd(acc, n), nums[0]);
}

// BFS solver to find minimum moves and verify solvability
function solvePuzzle(puzzle) {
  const { jugs, target, source } = puzzle;
  const n = jugs.length;
  const capacities = jugs.map(j => j.capacity);
  const initial = jugs.map(j => j.initial);

  // Calculate maximum possible states to prevent memory exhaustion
  const maxStates = capacities.reduce((acc, cap) => acc * (cap + 1), 1);
  // Very conservative limits to prevent memory issues during tests
  const MAX_STATES_TO_EXPLORE = Math.min(2000, maxStates);
  const MAX_MOVES = 30;

  const stateKey = (levels) => levels.join(',');
  const visited = new Set();
  // Use array as queue but process in batches to avoid O(n) shift operations
  let queue = [{ levels: [...initial], moves: 0 }];
  let queueIndex = 0;
  visited.add(stateKey(initial));

  while (queueIndex < queue.length) {
    // Safety check: prevent memory exhaustion
    if (visited.size > MAX_STATES_TO_EXPLORE) {
      return { solvable: false, minMoves: -1 };
    }

    const { levels, moves } = queue[queueIndex++];

    // Safety check: prevent infinite loops
    if (moves > MAX_MOVES) {
      return { solvable: false, minMoves: -1 };
    }

    // Check win condition
    if (levels.some(l => l === target)) {
      return { solvable: true, minMoves: moves };
    }

    // Clean up old queue entries periodically to free memory
    if (queueIndex > 1000) {
      queue = queue.slice(queueIndex);
      queueIndex = 0;
    }

    const tryState = (newLevels) => {
      const key = stateKey(newLevels);
      if (!visited.has(key) && visited.size < MAX_STATES_TO_EXPLORE) {
        visited.add(key);
        queue.push({ levels: newLevels, moves: moves + 1 });
      }
    };

    // Generate all possible moves
    for (let i = 0; i < n; i++) {
      // Fill from infinite source
      if (source === 'infinite' && levels[i] < capacities[i]) {
        const newLevels = [...levels];
        newLevels[i] = capacities[i];
        tryState(newLevels);
      }

      // Empty (only if infinite source - otherwise water is conserved)
      if (source === 'infinite' && levels[i] > 0) {
        const newLevels = [...levels];
        newLevels[i] = 0;
        tryState(newLevels);
      }

      // Pour from i to j
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (levels[i] === 0) continue;
        if (levels[j] === capacities[j]) continue;

        const newLevels = [...levels];
        const amount = Math.min(levels[i], capacities[j] - levels[j]);
        newLevels[i] -= amount;
        newLevels[j] += amount;
        tryState(newLevels);
      }
    }
  }

  return { solvable: false, minMoves: -1 };
}

// Generate a random puzzle with infinite source
function generateInfinitePuzzle(numJugs, difficulty) {
  const minCap = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  // Reduced max capacities to prevent memory issues with large state spaces
  const maxCap = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : 12;
  const minMoves = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 8;
  const maxMoves = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 15 : 25;

  // Very limited attempts to prevent memory exhaustion during test runs
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate random capacities (ensure they're coprime for interesting puzzles)
    const capacities = [];
    for (let i = 0; i < numJugs; i++) {
      let cap;
      do {
        cap = minCap + Math.floor(Math.random() * (maxCap - minCap + 1));
      } while (capacities.includes(cap));
      capacities.push(cap);
    }
    capacities.sort((a, b) => a - b);

    // Calculate GCD to find achievable targets
    const g = gcdMultiple(capacities);
    const maxTarget = Math.max(...capacities);

    // Find possible targets (multiples of GCD, up to largest capacity)
    const possibleTargets = [];
    for (let t = g; t <= maxTarget; t += g) {
      // Exclude trivial targets (capacities themselves or 0)
      if (!capacities.includes(t) && t > 0) {
        possibleTargets.push(t);
      }
    }

    if (possibleTargets.length === 0) continue;

    // Pick a random target
    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

    const puzzle = {
      name: `Generated ${numJugs}-Jug`,
      jugs: capacities.map(cap => ({ capacity: cap, initial: 0 })),
      target,
      source: 'infinite',
    };

    // Verify solvability and check move count
    const result = solvePuzzle(puzzle);
    if (result.solvable && result.minMoves >= minMoves && result.minMoves <= maxMoves) {
      puzzle.minMoves = result.minMoves;
      return puzzle;
    }
  }

  // Fallback to classic puzzle
  return {
    name: 'Classic (3 & 5)',
    jugs: [{ capacity: 3, initial: 0 }, { capacity: 5, initial: 0 }],
    target: 4,
    source: 'infinite',
    minMoves: 6,
  };
}

// Generate a puzzle with no external source (conservation mode)
function generateConservationPuzzle(numJugs, difficulty) {
  const minCap = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 6;
  // Reduced max capacities to prevent memory issues with large state spaces
  const maxCap = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 12 : 15;
  const minMoves = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 8;
  const maxMoves = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 18 : 30;

  // Very limited attempts to prevent memory exhaustion during test runs
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate random capacities
    const capacities = [];
    for (let i = 0; i < numJugs; i++) {
      let cap;
      do {
        cap = minCap + Math.floor(Math.random() * (maxCap - minCap + 1));
      } while (capacities.includes(cap));
      capacities.push(cap);
    }
    capacities.sort((a, b) => b - a); // Largest first (it starts full)

    const totalWater = capacities[0]; // First jug starts full

    // Find possible targets
    const possibleTargets = [];
    for (let t = 1; t < totalWater; t++) {
      // Target must be achievable and not trivial
      if (t !== totalWater && !capacities.slice(1).includes(t)) {
        possibleTargets.push(t);
      }
    }

    if (possibleTargets.length === 0) continue;

    // Pick a random target
    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

    const puzzle = {
      name: `Generated ${numJugs}-Jug (No Source)`,
      jugs: capacities.map((cap, i) => ({ capacity: cap, initial: i === 0 ? cap : 0 })),
      target,
      source: 'none',
    };

    // Verify solvability and check move count
    const result = solvePuzzle(puzzle);
    if (result.solvable && result.minMoves >= minMoves && result.minMoves <= maxMoves) {
      puzzle.minMoves = result.minMoves;
      return puzzle;
    }
  }

  // Fallback
  return {
    name: 'Three Jugs',
    jugs: [{ capacity: 8, initial: 8 }, { capacity: 5, initial: 0 }, { capacity: 3, initial: 0 }],
    target: 4,
    source: 'none',
    minMoves: 7,
  };
}

// Generate a puzzle based on settings
function generatePuzzle(settings) {
  const { numJugs, difficulty, hasSource } = settings;
  if (hasSource) {
    return generateInfinitePuzzle(numJugs, difficulty);
  } else {
    return generateConservationPuzzle(numJugs, difficulty);
  }
}

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Export helpers for testing
export {
  gcd,
  gcdMultiple,
  solvePuzzle,
  generateInfinitePuzzle,
  generateConservationPuzzle,
  generatePuzzle,
  DIFFICULTIES,
};

export default function WaterPouring() {
  const [puzzle, setPuzzle] = useState(null);
  const [jugLevels, setJugLevels] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [history, setHistory] = useState([]);
  const [selectedJug, setSelectedJug] = useState(null);

  // Generation settings
  const [numJugs, setNumJugs] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');
  const [hasSource, setHasSource] = useState(true);

  const generateNew = useCallback(() => {
    const newPuzzle = generatePuzzle({ numJugs, difficulty, hasSource });
    setPuzzle(newPuzzle);
    setJugLevels(newPuzzle.jugs.map(j => j.initial));
    setMoves(0);
    setGameState('playing');
    setHistory([]);
    setSelectedJug(null);
  }, [numJugs, difficulty, hasSource]);

  const initGame = useCallback(() => {
    if (!puzzle) return;
    setJugLevels(puzzle.jugs.map(j => j.initial));
    setMoves(0);
    setGameState('playing');
    setHistory([]);
    setSelectedJug(null);
  }, [puzzle]);

  useEffect(() => {
    generateNew();
  }, []); // Generate initial puzzle on mount

  useEffect(() => {
    if (puzzle) {
      initGame();
    }
  }, [puzzle]);

  useEffect(() => {
    if (!puzzle || gameState !== 'playing') return;

    // Check if target is reached
    if (jugLevels.some(level => level === puzzle.target)) {
      setGameState('won');
    }
  }, [jugLevels, puzzle, gameState]);

  const saveHistory = () => {
    setHistory(prev => [...prev, { jugLevels: [...jugLevels], moves }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setJugLevels(prev.jugLevels);
    setMoves(prev.moves);
    setHistory(h => h.slice(0, -1));
  };

  const handleFill = (jugIndex) => {
    if (gameState !== 'playing') return;
    if (puzzle.source !== 'infinite') return;
    if (jugLevels[jugIndex] === puzzle.jugs[jugIndex].capacity) return;

    saveHistory();
    setJugLevels(prev => {
      const newLevels = [...prev];
      newLevels[jugIndex] = puzzle.jugs[jugIndex].capacity;
      return newLevels;
    });
    setMoves(m => m + 1);
    setSelectedJug(null);
  };

  const handleEmpty = (jugIndex) => {
    if (gameState !== 'playing') return;
    if (jugLevels[jugIndex] === 0) return;

    saveHistory();
    setJugLevels(prev => {
      const newLevels = [...prev];
      newLevels[jugIndex] = 0;
      return newLevels;
    });
    setMoves(m => m + 1);
    setSelectedJug(null);
  };

  const handlePour = (fromIndex, toIndex) => {
    if (gameState !== 'playing') return;
    if (fromIndex === toIndex) return;
    if (jugLevels[fromIndex] === 0) return;
    if (jugLevels[toIndex] === puzzle.jugs[toIndex].capacity) return;

    saveHistory();
    setJugLevels(prev => {
      const newLevels = [...prev];
      const available = puzzle.jugs[toIndex].capacity - newLevels[toIndex];
      const toPour = Math.min(newLevels[fromIndex], available);
      newLevels[fromIndex] -= toPour;
      newLevels[toIndex] += toPour;
      return newLevels;
    });
    setMoves(m => m + 1);
    setSelectedJug(null);
  };

  const handleJugClick = (jugIndex) => {
    if (gameState !== 'playing') return;

    if (selectedJug === null) {
      setSelectedJug(jugIndex);
    } else if (selectedJug === jugIndex) {
      setSelectedJug(null);
    } else {
      handlePour(selectedJug, jugIndex);
    }
  };

  const renderJug = (jugIndex) => {
    const jug = puzzle.jugs[jugIndex];
    const level = jugLevels[jugIndex];
    const fillPercent = (level / jug.capacity) * 100;
    const isSelected = selectedJug === jugIndex;
    const isTarget = level === puzzle.target;

    return (
      <div key={jugIndex} className={styles.jugContainer}>
        <div
          className={`${styles.jug} ${isSelected ? styles.selected : ''} ${isTarget ? styles.target : ''}`}
          onClick={() => handleJugClick(jugIndex)}
          style={{ height: `${80 + jug.capacity * 15}px` }}
        >
          <div
            className={styles.water}
            style={{ height: `${fillPercent}%` }}
          />
          <div className={styles.jugLevel}>
            {level}L
          </div>
          <div className={styles.jugMarks}>
            {Array.from({ length: jug.capacity }, (_, i) => (
              <div
                key={i}
                className={styles.mark}
                style={{ bottom: `${((i + 1) / jug.capacity) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className={styles.jugCapacity}>{jug.capacity}L capacity</div>

        <div className={styles.jugActions}>
          {puzzle.source === 'infinite' && (
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); handleFill(jugIndex); }}
              disabled={level === jug.capacity}
            >
              Fill
            </button>
          )}
          <button
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); handleEmpty(jugIndex); }}
            disabled={level === 0}
          >
            Empty
          </button>
        </div>
      </div>
    );
  };

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Water Pouring"
        instructions={`${puzzle.targetDescription || `Measure exactly ${puzzle.target} liters using the jugs.`} Click a jug to select it, then click another to pour.${puzzle.source === 'infinite' ? ' You have unlimited water supply.' : ''}`}
      />

      <div className={styles.puzzleSelector}>
        <div className={styles.settingGroup}>
          <label>Jugs:</label>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={`${styles.puzzleBtn} ${numJugs === n ? styles.active : ''}`}
              onClick={() => setNumJugs(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className={styles.settingGroup}>
          <label>Difficulty:</label>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.puzzleBtn} ${difficulty === d ? styles.active : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.settingGroup}>
          <label>Mode:</label>
          <button
            className={`${styles.puzzleBtn} ${hasSource ? styles.active : ''}`}
            onClick={() => setHasSource(true)}
          >
            Infinite Source
          </button>
          <button
            className={`${styles.puzzleBtn} ${!hasSource ? styles.active : ''}`}
            onClick={() => setHasSource(false)}
          >
            Conservation
          </button>
        </div>
        <button className={styles.generateBtn} onClick={generateNew}>
          Generate New Puzzle
        </button>
      </div>

      <div className={styles.targetDisplay}>
        <span className={styles.targetLabel}>Target:</span>
        <span className={styles.targetValue}>{puzzle.target}L</span>
        <span className={styles.movesLabel}>Moves:</span>
        <span className={styles.movesValue}>{moves}</span>
        {puzzle.minMoves && (
          <>
            <span className={styles.movesLabel}>Par:</span>
            <span className={styles.movesValue}>{puzzle.minMoves}</span>
          </>
        )}
      </div>


        <div className={styles.gameArea}>
          <div className={styles.jugsContainer}>
            {puzzle.jugs.map((_, i) => renderJug(i))}
          </div>

          {selectedJug !== null && (
            <div className={styles.hint}>
              Jug {selectedJug + 1} selected. Click another jug to pour, or click again to deselect.
            </div>
          )}

          <GameResult
            gameState={gameState}
            onNewGame={generateNew}
            winTitle="Measured!"
            winMessage={`Completed in ${moves} moves!${puzzle.minMoves && moves === puzzle.minMoves ? ' (Perfect!)' : ''}`}
          />

          <div className={styles.buttons}>
            <button
              className={styles.undoBtn}
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              Undo
            </button>
            <button className={styles.resetBtn} onClick={initGame}>
              Reset
            </button>
            {gameState === 'won' && (
              <button
                className={styles.nextBtn}
                onClick={generateNew}
              >
                New Puzzle →
              </button>
            )}
          </div>
        </div>

    </div>
  );
}
