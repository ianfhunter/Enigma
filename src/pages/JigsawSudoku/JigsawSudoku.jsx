import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import SeedDisplay from '../../components/SeedDisplay';
import GameResult from '../../components/GameResult';
import { createSeededRandom, stringToSeed } from '../../data/wordUtils';
import styles from './JigsawSudoku.module.css';

const SIZE = 9;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function isFixedCell(fixedCells, row, col) {
  return fixedCells.has(`${row}-${col}`);
}

export function findFirstEditableCell(fixedCells) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!isFixedCell(fixedCells, row, col)) return { row, col };
    }
  }
  return null;
}

export function moveSelection(selection, key, fixedCells) {
  if (!selection) return findFirstEditableCell(fixedCells);

  const deltas = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };

  const delta = deltas[key];
  if (!delta) return selection;

  let { row, col } = selection;
  while (true) {
    row += delta[0];
    col += delta[1];

    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return selection;
    if (!isFixedCell(fixedCells, row, col)) return { row, col };
  }
}

export function keyToDigit(key) {
  const value = Number.parseInt(key, 10);
  if (Number.isNaN(value) || value < 1 || value > 9) return null;
  return value;
}

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

function shuffle(values, random) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


const BASE_REGION_MAP = [
  [7, 7, 7, 7, 7, 7, 1, 4, 4],
  [5, 5, 7, 7, 1, 1, 1, 4, 4],
  [3, 5, 7, 5, 1, 2, 1, 4, 4],
  [3, 5, 5, 5, 5, 2, 1, 1, 4],
  [3, 3, 3, 3, 5, 2, 2, 1, 4],
  [0, 3, 3, 2, 2, 2, 2, 2, 4],
  [0, 0, 3, 8, 8, 8, 8, 8, 8],
  [0, 0, 0, 8, 8, 6, 8, 6, 6],
  [0, 0, 0, 6, 6, 6, 6, 6, 6],
];

const BASE_SOLUTION = [
  [1, 4, 6, 8, 3, 5, 9, 7, 2],
  [8, 3, 9, 7, 2, 1, 4, 6, 5],
  [5, 7, 2, 9, 8, 3, 6, 1, 4],
  [4, 2, 5, 1, 6, 8, 7, 3, 9],
  [7, 9, 8, 2, 4, 6, 1, 5, 3],
  [3, 6, 1, 4, 7, 2, 5, 9, 8],
  [2, 1, 3, 5, 9, 7, 8, 4, 6],
  [6, 5, 4, 3, 1, 9, 2, 8, 7],
  [9, 8, 7, 6, 5, 4, 3, 2, 1],
];


function transformMap(regionMap, transform) {
  const out = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const [nr, nc] = transform(r, c);
      out[nr][nc] = regionMap[r][c];
    }
  }
  return out;
}

function hasValidRegionSizes(regionMap) {
  const counts = Array(9).fill(0);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const region = regionMap[r][c];
      if (region < 0 || region > 8) return false;
      counts[region]++;
    }
  }
  return counts.every(count => count === 9);
}

export function generateRegionMap(random = Math.random) {
  return generateRegionAndSolution(random).regionMap;
}

function generateRegionAndSolution(random = Math.random) {
  const transforms = [
    (r, c) => [r, c],
    (r, c) => [c, SIZE - 1 - r],
    (r, c) => [SIZE - 1 - r, SIZE - 1 - c],
    (r, c) => [SIZE - 1 - c, r],
    (r, c) => [r, SIZE - 1 - c],
    (r, c) => [SIZE - 1 - r, c],
    (r, c) => [c, r],
    (r, c) => [SIZE - 1 - c, SIZE - 1 - r],
  ];

  const transform = transforms[Math.floor(random() * transforms.length)];
  let regionMap = transformMap(BASE_REGION_MAP, transform);
  let solution = transformMap(BASE_SOLUTION, transform);

  const regionLabels = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], random);
  regionMap = regionMap.map(row => row.map(cell => regionLabels[cell]));

  const digitMap = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
  solution = solution.map(row => row.map(value => digitMap[value - 1]));

  if (!hasValidRegionSizes(regionMap)) {
    throw new Error('Generated invalid region sizes for jigsaw sudoku');
  }

  return { regionMap, solution };
}


export function isValidPlacement(grid, regionMap, row, col, num) {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }

  const region = regionMap[row][col];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r !== row || c !== col) && regionMap[r][c] === region && grid[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}


function createState(grid, regionMap) {
  const rowMask = Array(9).fill(0);
  const colMask = Array(9).fill(0);
  const regMask = Array(9).fill(0);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const bit = 1 << v;
      const reg = regionMap[r][c];
      if ((rowMask[r] & bit) || (colMask[c] & bit) || (regMask[reg] & bit)) {
        return null;
      }
      rowMask[r] |= bit;
      colMask[c] |= bit;
      regMask[reg] |= bit;
    }
  }

  return { rowMask, colMask, regMask };
}

function getAllowedMask(state, regionMap, row, col) {
  const used = state.rowMask[row] | state.colMask[col] | state.regMask[regionMap[row][col]];
  return (~used) & 0b1111111110;
}

function bitCount(n) {
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

function maskToDigits(mask) {
  const digits = [];
  for (let d = 1; d <= 9; d++) {
    if (mask & (1 << d)) digits.push(d);
  }
  return digits;
}

function findBestCellWithMask(grid, regionMap, state) {
  let best = null;
  let bestMask = 0;
  let bestCount = 10;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== 0) continue;
      const mask = getAllowedMask(state, regionMap, r, c);
      const count = bitCount(mask);
      if (count === 0) return { row: r, col: c, mask: 0 };
      if (count < bestCount) {
        best = { row: r, col: c };
        bestMask = mask;
        bestCount = count;
      }
    }
  }

  return best ? { ...best, mask: bestMask } : null;
}

function placeNumber(grid, state, regionMap, row, col, num) {
  const bit = 1 << num;
  grid[row][col] = num;
  state.rowMask[row] |= bit;
  state.colMask[col] |= bit;
  state.regMask[regionMap[row][col]] |= bit;
}

function removeNumber(grid, state, regionMap, row, col, num) {
  const bit = 1 << num;
  grid[row][col] = 0;
  state.rowMask[row] &= ~bit;
  state.colMask[col] &= ~bit;
  state.regMask[regionMap[row][col]] &= ~bit;
}

export function solveGrid(grid, regionMap, random = Math.random) {
  const work = cloneGrid(grid);
  const state = createState(work, regionMap);
  if (!state) return null;

  function solve() {
    const next = findBestCellWithMask(work, regionMap, state);
    if (!next) return true;
    if (next.mask === 0) return false;

    for (const num of shuffle(maskToDigits(next.mask), random)) {
      placeNumber(work, state, regionMap, next.row, next.col, num);
      if (solve()) return true;
      removeNumber(work, state, regionMap, next.row, next.col, num);
    }

    return false;
  }

  return solve() ? work : null;
}

export function countSolutions(grid, regionMap, limit = 2) {
  const work = cloneGrid(grid);
  const state = createState(work, regionMap);
  if (!state) return 0;
  let total = 0;

  function search() {
    if (total >= limit) return;
    const next = findBestCellWithMask(work, regionMap, state);
    if (!next) {
      total++;
      return;
    }
    if (next.mask === 0) return;

    for (const num of maskToDigits(next.mask)) {
      if (total >= limit) return;
      placeNumber(work, state, regionMap, next.row, next.col, num);
      search();
      removeNumber(work, state, regionMap, next.row, next.col, num);
    }
  }

  search();
  return total;
}


const difficultyRanges = {
  easy: [40, 45],
  medium: [32, 39],
  hard: [28, 31],
};

export function generatePuzzle(difficulty = 'medium', seed = Date.now()) {
  const random = createSeededRandom(seed);
  const { regionMap, solution } = generateRegionAndSolution(random);
  const puzzle = cloneGrid(solution);
  const positions = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) positions.push([r, c]);
  }

  const [minClues, maxClues] = difficultyRanges[difficulty] || difficultyRanges.medium;
  const targetClues = minClues + Math.floor(random() * (maxClues - minClues + 1));

  for (const [r, c] of shuffle(positions, random)) {
    const clues = puzzle.flat().filter(n => n !== 0).length;
    if (clues <= targetClues) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const solutions = countSolutions(puzzle, regionMap, 2);
    if (solutions !== 1) puzzle[r][c] = backup;
  }

  const finalClues = puzzle.flat().filter(n => n !== 0).length;
  if (finalClues < minClues || finalClues > maxClues || countSolutions(puzzle, regionMap, 2) !== 1) {
    throw new Error('Could not generate unique jigsaw sudoku puzzle');
  }

  return { puzzle, solution, regionMap, seed };
}

function isComplete(grid, solution) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function JigsawSudoku() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const initialSeed = Date.now();
  const [seed, setSeed] = useState(initialSeed);
  const [data, setData] = useState(() => generatePuzzle('medium', initialSeed));
  const [grid, setGrid] = useState(() => cloneGrid(data.puzzle));
  const [selected, setSelected] = useState(null);
  const [gameState, setGameState] = useState('playing');

  const fixedCells = useMemo(() => new Set(
    data.puzzle.flatMap((row, r) => row.map((value, c) => value !== 0 ? `${r}-${c}` : null)).filter(Boolean)
  ), [data.puzzle]);

  const regenerate = useCallback((nextDifficulty, seedValue = Date.now()) => {
    const nextData = generatePuzzle(nextDifficulty, seedValue);
    setDifficulty(nextDifficulty);
    setSeed(seedValue);
    setData(nextData);
    setGrid(cloneGrid(nextData.puzzle));
    setSelected(null);
    setGameState('playing');
  }, []);

  const handleCellClick = (row, col) => {
    if (gameState !== 'playing') return;
    if (fixedCells.has(`${row}-${col}`)) return;
    setSelected({ row, col });
  };

  const handleNumber = useCallback((num) => {
    if (!selected || gameState !== 'playing') return;
    const { row, col } = selected;
    if (fixedCells.has(`${row}-${col}`)) return;

    const next = cloneGrid(grid);
    next[row][col] = num;
    setGrid(next);
    if (isComplete(next, data.solution)) setGameState('won');
  }, [data.solution, fixedCells, gameState, grid, selected]);

  const handleClear = useCallback(() => {
    if (!selected || gameState !== 'playing') return;
    const { row, col } = selected;
    if (fixedCells.has(`${row}-${col}`)) return;
    const next = cloneGrid(grid);
    next[row][col] = 0;
    setGrid(next);
  }, [fixedCells, gameState, grid, selected]);

  const handleGiveUp = () => {
    setGrid(cloneGrid(data.solution));
    setGameState('gaveUp');
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameState !== 'playing') return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        setSelected(current => moveSelection(current, event.key, fixedCells));
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        event.preventDefault();
        handleClear();
        return;
      }

      const num = keyToDigit(event.key);
      if (num !== null) {
        event.preventDefault();
        handleNumber(num);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fixedCells, gameState, handleClear, handleNumber]);

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('jigsawSudoku.title', { defaultValue: 'Jigsaw Sudoku' })}
        instructions={t('jigsawSudoku.instructions', { defaultValue: 'Fill digits 1-9 so each row, each column, and each jigsaw region contains every digit exactly once.' })}
      />

      <div className={styles.controls}>
        <DifficultySelector
          options={['easy', 'medium', 'hard']}
          value={difficulty}
          onChange={(d) => regenerate(d, Date.now())}
        />
        <button type="button" className={styles.newButton} onClick={() => regenerate(difficulty, Date.now())}>
          {t('common.newPuzzle')}
        </button>
      </div>

      <SeedDisplay seed={seed} onNewSeed={(value) => regenerate(difficulty, typeof value === 'number' ? value : stringToSeed(value))} />

      <div className={styles.topBar}>
        <GiveUpButton onGiveUp={handleGiveUp} disabled={gameState !== 'playing'} requireConfirm />
      </div>

      <div className={styles.board}>
        {grid.map((row, r) => row.map((value, c) => {
          const region = data.regionMap[r][c];
          const selectedCell = selected?.row === r && selected?.col === c;
          const fixed = fixedCells.has(`${r}-${c}`);
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              className={`${styles.cell} ${styles[`region${region}`]} ${selectedCell ? styles.selected : ''} ${fixed ? styles.fixed : ''}`}
              data-region={region}
              onClick={() => handleCellClick(r, c)}
            >
              {value || ''}
            </button>
          );
        }))}
      </div>

      <div className={styles.keypad}>
        {DIGITS.map(num => (
          <button key={num} type="button" className={styles.key} onClick={() => handleNumber(num)}>{num}</button>
        ))}
        <button type="button" className={styles.key} onClick={handleClear}>{t('common.clear')}</button>
      </div>

      {gameState === 'won' && (
        <GameResult
          status="success"
          title={t('common.congratulations')}
          message={t('common.puzzleComplete')}
          actions={[{ label: t('common.newPuzzle'), onClick: () => regenerate(difficulty, Date.now()), primary: true }]}
        />
      )}
      {gameState === 'gaveUp' && (
        <GameResult
          status="gaveup"
          title={t('common.puzzleRevealed')}
          message={t('common.betterLuckNextTime')}
          actions={[{ label: t('common.tryAgain'), onClick: () => regenerate(difficulty, Date.now()), primary: true }]}
        />
      )}
    </div>
  );
}
