import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom } from '../../utils/generatorUtils';
import styles from './GrandTour.module.css';

const SIZE = 5;
const CELL_COUNT = SIZE * SIZE;
const KNIGHT_DELTAS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

function toKey(r, c) {
  return `${r},${c}`;
}

function getKnightNeighbors(r, c, size = SIZE) {
  return KNIGHT_DELTAS
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size);
}

function shuffleInPlace(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function generateKnightTour(seed, size = SIZE) {
  const random = createSeededRandom(seed);

  for (let attempt = 0; attempt < 80; attempt++) {
    const board = Array(size).fill(null).map(() => Array(size).fill(0));
    const startRow = Math.floor(random() * size);
    const startCol = Math.floor(random() * size);

    const visit = (row, col, step) => {
      board[row][col] = step;
      if (step === size * size) {
        return true;
      }

      const candidates = getKnightNeighbors(row, col, size)
        .filter(([nr, nc]) => board[nr][nc] === 0)
        .map(([nr, nc]) => ({
          row: nr,
          col: nc,
          onward: getKnightNeighbors(nr, nc, size).filter(([r2, c2]) => board[r2][c2] === 0).length,
          noise: random(),
        }))
        .sort((a, b) => a.onward - b.onward || a.noise - b.noise);

      for (const { row: nr, col: nc } of candidates) {
        if (visit(nr, nc, step + 1)) {
          return true;
        }
      }

      board[row][col] = 0;
      return false;
    };

    if (visit(startRow, startCol, 1)) {
      return board;
    }
  }

  throw new Error('Failed to generate knight tour');
}

function buildGivenPositionMap(clues) {
  const givens = new Map();
  for (let r = 0; r < clues.length; r++) {
    for (let c = 0; c < clues[r].length; c++) {
      const val = clues[r][c];
      if (val > 0) {
        givens.set(val, [r, c]);
      }
    }
  }
  return givens;
}

function countSolutions(clues, size = SIZE, maxSolutions = 2) {
  const total = size * size;
  const givenPositions = buildGivenPositionMap(clues);
  const used = Array(size).fill(null).map(() => Array(size).fill(false));
  let solutionCount = 0;

  const dfs = (step, row, col) => {
    if (solutionCount >= maxSolutions) return;

    const givenPos = givenPositions.get(step);
    if (givenPos && (givenPos[0] !== row || givenPos[1] !== col)) return;

    used[row][col] = true;

    if (step === total) {
      solutionCount += 1;
      used[row][col] = false;
      return;
    }

    const nextGiven = givenPositions.get(step + 1);
    if (nextGiven) {
      const [nr, nc] = nextGiven;
      if (!used[nr][nc] && getKnightNeighbors(row, col, size).some(([rr, cc]) => rr === nr && cc === nc)) {
        dfs(step + 1, nr, nc);
      }
      used[row][col] = false;
      return;
    }

    const nextCandidates = getKnightNeighbors(row, col, size)
      .filter(([nr, nc]) => !used[nr][nc])
      .sort((a, b) => {
        const onwardA = getKnightNeighbors(a[0], a[1], size).filter(([rr, cc]) => !used[rr][cc]).length;
        const onwardB = getKnightNeighbors(b[0], b[1], size).filter(([rr, cc]) => !used[rr][cc]).length;
        return onwardA - onwardB;
      });

    for (const [nr, nc] of nextCandidates) {
      dfs(step + 1, nr, nc);
      if (solutionCount >= maxSolutions) break;
    }

    used[row][col] = false;
  };

  const startGiven = givenPositions.get(1);
  if (startGiven) {
    dfs(1, startGiven[0], startGiven[1]);
    return solutionCount;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      dfs(1, r, c);
      if (solutionCount >= maxSolutions) return solutionCount;
    }
  }

  return solutionCount;
}

function generatePuzzle(seed, size = SIZE) {
  const random = createSeededRandom(seed);
  const solution = generateKnightTour(seed, size);
  const clues = solution.map(row => [...row]);

  const removable = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = solution[r][c];
      if (v !== 1 && v !== size * size) {
        removable.push([r, c]);
      }
    }
  }

  shuffleInPlace(removable, random);

  const minimumClues = 6;
  let clueCount = size * size;

  for (const [r, c] of removable) {
    if (clueCount <= minimumClues) break;
    const original = clues[r][c];
    clues[r][c] = 0;
    const solutions = countSolutions(clues, size, 2);
    if (solutions !== 1) {
      clues[r][c] = original;
    } else {
      clueCount -= 1;
    }
  }

  const given = clues.map(row => row.map(v => v > 0));
  return { solution, clues, given, size };
}

function findInputErrors(grid, size = SIZE) {
  const errors = new Set();
  const posByNum = new Map();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const value = grid[r][c];
      if (value <= 0) continue;

      if (posByNum.has(value)) {
        const [rr, cc] = posByNum.get(value);
        errors.add(toKey(r, c));
        errors.add(toKey(rr, cc));
      } else {
        posByNum.set(value, [r, c]);
      }
    }
  }

  for (let n = 1; n < size * size; n++) {
    const first = posByNum.get(n);
    const second = posByNum.get(n + 1);
    if (!first || !second) continue;

    const connected = getKnightNeighbors(first[0], first[1], size).some(([r, c]) => r === second[0] && c === second[1]);
    if (!connected) {
      errors.add(toKey(first[0], first[1]));
      errors.add(toKey(second[0], second[1]));
    }
  }

  return errors;
}

function isSolved(grid, solution) {
  return solution.every((row, r) => row.every((value, c) => value === grid[r][c]));
}

export {
  SIZE,
  getKnightNeighbors,
  generateKnightTour,
  countSolutions,
  generatePuzzle,
  findInputErrors,
  isSolved,
};

export default function GrandTour() {
  const { t } = useTranslation();
  const { seed, setSeed, newSeed } = useSeed('grand-tour', () => Math.floor(Math.random() * 1000000));
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();

  const initGame = useCallback((seedValue) => {
    const nextSeed = seedValue ?? seed;
    const puzzle = generatePuzzle(nextSeed, SIZE);
    setPuzzleData(puzzle);
    setGrid(puzzle.clues.map(row => [...row]));
    setSelectedCell(null);
    setErrors(new Set());
    resetGameState();
  }, [seed, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;
    checkWin(isSolved(grid, puzzleData.solution));
    setErrors(showErrors ? findInputErrors(grid, puzzleData.size) : new Set());
  }, [grid, puzzleData, isPlaying, checkWin, showErrors]);

  const handleKeyDown = useCallback((event) => {
    if (!selectedCell || !puzzleData || !isPlaying) return;

    const [row, col] = selectedCell;
    if (puzzleData.given[row][col]) return;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      setGrid(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = 0;
        return next;
      });
      return;
    }

    if (event.key === 'Escape') {
      setSelectedCell(null);
      return;
    }

    const num = Number.parseInt(event.key, 10);
    if (Number.isNaN(num)) return;

    setGrid(prev => {
      const next = prev.map(r => [...r]);
      const current = next[row][col];
      const combined = current > 0 ? current * 10 + num : num;
      if (combined >= 1 && combined <= CELL_COUNT) {
        next[row][col] = combined;
      } else if (num >= 1 && num <= CELL_COUNT) {
        next[row][col] = num;
      }
      return next;
    });
  }, [selectedCell, puzzleData, isPlaying]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCellClick = (r, c) => {
    if (!isPlaying || puzzleData?.given[r][c]) return;
    setSelectedCell([r, c]);
  };

  const handlePadInput = (value) => {
    if (!selectedCell || !puzzleData || !isPlaying) return;

    const [row, col] = selectedCell;
    if (puzzleData.given[row][col]) return;

    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = value;
      return next;
    });
  };

  const handleNewGame = () => {
    const next = newSeed();
    initGame(next);
  };

  const handleReset = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.clues.map(row => [...row]));
    setSelectedCell(null);
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  const keypadNumbers = useMemo(() => Array.from({ length: CELL_COUNT }, (_, i) => i + 1), []);

  useGameStats('grand-tour', gameState, {
    seed,
    clueCount: puzzleData?.clues.flat().filter(Boolean).length || 0,
  });

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('grandTour.title', 'Grand Tour')}
        instructions={t('grandTour.instructions', 'Fill numbers 1-25 so consecutive numbers are a knight move apart. Use the given clues to complete the full tour.')}
      />

      <div className={styles.controls}>
        <SeedDisplay seed={seed} onSeedChange={setSeed} onNewSeed={handleNewGame} showNewButton />
        <label className={styles.toggleLabel}>
          <input type="checkbox" checked={showErrors} onChange={(event) => setShowErrors(event.target.checked)} />
          {t('grandTour.showErrors', 'Show errors')}
        </label>
      </div>

      <div className={styles.grid}>
        {grid.map((row, r) => row.map((value, c) => {
          const key = toKey(r, c);
          const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
          const isGiven = puzzleData.given[r][c];
          const hasError = errors.has(key);

          return (
            <button
              key={key}
              className={`${styles.cell} ${isGiven ? styles.given : ''} ${isSelected ? styles.selected : ''} ${hasError ? styles.error : ''}`}
              onClick={() => handleCellClick(r, c)}
              disabled={!isPlaying || isGiven}
            >
              {value > 0 ? value : ''}
            </button>
          );
        }))}
      </div>

      <div className={styles.keypad}>
        {keypadNumbers.map(num => (
          <button key={num} className={styles.keypadBtn} onClick={() => handlePadInput(num)} disabled={!selectedCell || !isPlaying}>
            {num}
          </button>
        ))}
        <button className={styles.clearBtn} onClick={() => handlePadInput(0)} disabled={!selectedCell || !isPlaying}>
          {t('common.clear', 'Clear')}
        </button>
      </div>

      {gameState === 'won' && (
        <GameResult
          state="won"
          title={t('grandTour.won', 'Tour Completed!')}
          message={t('grandTour.wonMessage', 'Perfect! You found the full knight route.')}
          actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
        />
      )}

      {gameState === 'gaveUp' && (
        <GameResult
          state="gaveup"
          title={t('grandTour.gaveUp', 'Solution Revealed')}
          message={t('grandTour.gaveUpMessage', 'Review the route and try a new seed.')}
          actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
        />
      )}

      <div className={styles.actions}>
        <button className={styles.secondaryBtn} onClick={handleReset} disabled={!isPlaying}>{t('common.reset', 'Reset')}</button>
        <GiveUpButton onGiveUp={handleGiveUp} disabled={!isPlaying} />
        <button className={styles.primaryBtn} onClick={handleNewGame}>{t('common.newGame')}</button>
      </div>
    </div>
  );
}
