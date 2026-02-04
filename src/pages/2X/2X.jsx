import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import { createSeededRandom, stringToSeed } from '../../data/wordUtils';
import { useGameState } from '../../hooks/useGameState';
import styles from './2X.module.css';

const BOARD_SIZE = 4;
const START_TILES = 2;
const CHANCE_OF_FOUR = 0.1;

function createEmptyBoard(size) {
  return Array.from({ length: size * size }, () => 0);
}

function getEmptyIndices(board) {
  const empty = [];
  board.forEach((value, idx) => {
    if (value === 0) empty.push(idx);
  });
  return empty;
}

function addRandomTile(board, random) {
  const empty = getEmptyIndices(board);
  if (empty.length === 0) return board.slice();
  const pickIndex = empty[Math.floor(random() * empty.length)];
  const next = board.slice();
  next[pickIndex] = random() < CHANCE_OF_FOUR ? 4 : 2;
  return next;
}

function initializeBoard(size, random) {
  let board = createEmptyBoard(size);
  for (let i = 0; i < START_TILES; i++) {
    board = addRandomTile(board, random);
  }
  return board;
}

function slideAndMergeLine(line) {
  const compact = line.filter((value) => value !== 0);
  const merged = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i++) {
    if (compact[i] === compact[i + 1]) {
      const nextValue = compact[i] * 2;
      merged.push(nextValue);
      gained += nextValue;
      i += 1;
    } else {
      merged.push(compact[i]);
    }
  }

  while (merged.length < line.length) merged.push(0);
  return { line: merged, gained };
}

function applyMove(board, size, direction) {
  const next = board.slice();
  let moved = false;
  let gained = 0;

  const readIndex = (r, c) => r * size + c;

  const processLine = (values, indices) => {
    const { line, gained: lineGained } = slideAndMergeLine(values);
    line.forEach((value, idx) => {
      const targetIndex = indices[idx];
      if (next[targetIndex] !== value) {
        moved = true;
      }
      next[targetIndex] = value;
    });
    gained += lineGained;
  };

  for (let r = 0; r < size; r++) {
    const rowIndices = Array.from({ length: size }, (_, c) => readIndex(r, c));
    const colIndices = Array.from({ length: size }, (_, c) => readIndex(c, r));

    if (direction === 'left' || direction === 'right') {
      const indices = direction === 'left' ? rowIndices : rowIndices.slice().reverse();
      const values = indices.map((idx) => board[idx]);
      processLine(values, indices);
    }

    if (direction === 'up' || direction === 'down') {
      const indices = direction === 'up' ? colIndices : colIndices.slice().reverse();
      const values = indices.map((idx) => board[idx]);
      processLine(values, indices);
    }
  }

  return { board: next, moved, gained };
}

function hasMoves(board, size) {
  if (getEmptyIndices(board).length > 0) return true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const value = board[r * size + c];
      const right = c < size - 1 ? board[r * size + c + 1] : null;
      const down = r < size - 1 ? board[(r + 1) * size + c] : null;
      if (value === right || value === down) return true;
    }
  }
  return false;
}

function getMaxTile(board) {
  return board.reduce((max, value) => (value > max ? value : max), 0);
}

// Export helpers for tests
export {
  createEmptyBoard,
  getEmptyIndices,
  addRandomTile,
  initializeBoard,
  slideAndMergeLine,
  applyMove,
  hasMoves,
  getMaxTile
};

export default function TwoX() {
  const { t } = useTranslation();
  const [board, setBoard] = useState(() => createEmptyBoard(BOARD_SIZE));
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [seed, setSeed] = useState(null);
  const rngRef = useRef(createSeededRandom(0));
  const { gameState, checkWin, giveUp, lose, reset, isPlaying } = useGameState();

  const maxTile = useMemo(() => getMaxTile(board), [board]);

  const initGame = useCallback((nextSeed) => {
    const seedValue = typeof nextSeed === 'string'
      ? (isNaN(parseInt(nextSeed, 10)) ? stringToSeed(nextSeed) : parseInt(nextSeed, 10))
      : (nextSeed ?? stringToSeed(`2X-${Date.now()}`));
    const random = createSeededRandom(seedValue);
    rngRef.current = random;
    setBoard(initializeBoard(BOARD_SIZE, random));
    setScore(0);
    setMoves(0);
    setSeed(seedValue);
    reset();
  }, [reset]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!hasMoves(board, BOARD_SIZE)) {
      lose();
    }
  }, [board, checkWin, isPlaying, lose]);

  const handleMove = useCallback((direction) => {
    if (!isPlaying) return;
    setBoard((current) => {
      const { board: movedBoard, moved, gained } = applyMove(current, BOARD_SIZE, direction);
      if (!moved) return current;
      const withTile = addRandomTile(movedBoard, rngRef.current);
      setScore((prev) => prev + gained);
      setMoves((prev) => prev + 1);
      return withTile;
    });
  }, [isPlaying]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isPlaying) return;
      const keyMap = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };
      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove, isPlaying]);

  const statusMessage = useMemo(() => {
    if (gameState === 'won') return t('gameStatus.puzzleSolved');
    if (gameState === 'lost') return t('2X.gameOver');
    if (gameState === 'gaveUp') return t('gameStatus.solutionRevealed');
    return null;
  }, [gameState, t]);

  const statusClassName = useMemo(() => {
    if (gameState === 'lost') return styles.statusMessageLost;
    if (gameState === 'gaveUp') return styles.statusMessageGaveUp;
    return styles.statusMessage;
  }, [gameState]);

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('2X.title')}
        instructions={t('2X.instructions')}
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showShare={false}
          onSeedChange={(newSeed) => initGame(newSeed)}
        />
      )}

      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <div>
            <span className={styles.statLabel}>{t('gameStatus.score')}</span>
            <span className={styles.statValue}>{score}</span>
          </div>
          <div>
            <span className={styles.statLabel}>{t('gameStatus.moves')}</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div>
            <span className={styles.statLabel}>{t('2X.bestTile')}</span>
            <span className={styles.statValue}>{maxTile}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.button} onClick={() => initGame()}>
            {t('common.newGame')}
          </button>
        </div>
      </div>

      <div className={styles.board} role="grid" aria-label={t('2X.title')}>
        {board.map((value, idx) => (
          <div
            key={idx}
            role="gridcell"
            className={styles.tile}
            style={{
              backgroundColor: value === 0 ? '#cdc1b4' : undefined,
              color: value <= 4 ? '#776e65' : '#f9f6f2',
              fontSize: value >= 1024 ? '1.5rem' : value >= 128 ? '1.75rem' : '2rem',
              ...(value ? { backgroundColor: TILE_COLORS[value] || '#3c3a32' } : {}),
            }}
            aria-label={value === 0
              ? t('2X.emptyTile')
              : t('2X.tileLabel', { value })}
          >
            {value === 0 ? '' : value}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>
          {statusMessage && <span className={statusClassName}>{statusMessage}</span>}
        </div>
      </div>
    </div>
  );
}

const TILE_COLORS = {
  2: '#e8f4f8',
  4: '#b8e0f0',
  8: '#7ec8e3',
  16: '#4fb3d6',
  32: '#3aa7cc',
  64: '#2196f3',
  128: '#42c896',
  256: '#2eb87c',
  512: '#1fa862',
  1024: '#109648',
  2048: '#ff9800',
  4096: '#ff6f00',
  8192: '#f44336',
  16384: '#e91e63',
  32768: '#9c27b0',
  65536: '#673ab7',
  131072: '#3f51b5',
  262144: '#2c3e50',
  524288: '#34495e',
  1048576: '#1a252f',
};
