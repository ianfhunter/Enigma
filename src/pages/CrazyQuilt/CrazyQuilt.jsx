import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import { createSeededRandom, seededShuffleArray } from '../../data/wordUtils';
import styles from './CrazyQuilt.module.css';

const SUITS = [
  { id: 'spades', symbol: '♠', label: 'Spades', color: 'black' },
  { id: 'hearts', symbol: '♥', label: 'Hearts', color: 'red' },
  { id: 'diamonds', symbol: '♦', label: 'Diamonds', color: 'red' },
  { id: 'clubs', symbol: '♣', label: 'Clubs', color: 'black' },
];

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${suit.id}-${rank}`,
      suit: suit.id,
      suitSymbol: suit.symbol,
      suitColor: suit.color,
      rank,
    }))
  );
}

function buildSolution(suitOrder) {
  const deck = createDeck();
  const lookup = new Map(deck.map((card) => [card.id, card]));
  return suitOrder.map((suit) =>
    RANKS.map((rank) => lookup.get(`${suit.id}-${rank}`))
  );
}

function chunkGrid(cards, columns) {
  const rows = [];
  for (let i = 0; i < cards.length; i += columns) {
    rows.push(cards.slice(i, i + columns));
  }
  return rows;
}

export function generateCrazyQuilt(seed) {
  const random = createSeededRandom(seed);
  const suitOrder = seededShuffleArray(SUITS, random);
  const deck = seededShuffleArray(createDeck(), random);
  return {
    grid: chunkGrid(deck, 13),
    solution: buildSolution(suitOrder),
    suitOrder,
  };
}

export function swapCards(grid, first, second) {
  if (!first || !second) return grid;
  if (first.row === second.row && first.col === second.col) return grid;
  const next = grid.map((row) => row.slice());
  const temp = next[first.row][first.col];
  next[first.row][first.col] = next[second.row][second.col];
  next[second.row][second.col] = temp;
  return next;
}

export function isSolved(grid, solution) {
  if (!grid.length || !solution.length) return false;
  for (let row = 0; row < solution.length; row++) {
    for (let col = 0; col < solution[row].length; col++) {
      if (grid[row][col].id !== solution[row][col].id) return false;
    }
  }
  return true;
}

export default function CrazyQuilt() {
  const { t } = useTranslation();
  const { seed, setSeed, newSeed } = useSeed('crazy-quilt');
  const [grid, setGrid] = useState([]);
  const [solution, setSolution] = useState([]);
  const [suitOrder, setSuitOrder] = useState([]);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const loadSeed = useCallback((nextSeed) => {
    const { grid: nextGrid, solution: nextSolution, suitOrder: nextSuitOrder } =
      generateCrazyQuilt(nextSeed);
    setGrid(nextGrid);
    setSolution(nextSolution);
    setSuitOrder(nextSuitOrder);
    setSelected(null);
    setMoves(0);
    setShowSolution(false);
  }, []);

  useEffect(() => {
    loadSeed(seed);
  }, [seed, loadSeed]);

  const solved = useMemo(() => isSolved(grid, solution), [grid, solution]);

  const handleCardClick = (rowIndex, colIndex) => {
    if (showSolution) return;
    if (!selected) {
      setSelected({ row: rowIndex, col: colIndex });
      return;
    }
    if (selected.row === rowIndex && selected.col === colIndex) {
      setSelected(null);
      return;
    }
    setGrid((prev) => swapCards(prev, selected, { row: rowIndex, col: colIndex }));
    setSelected(null);
    setMoves((prev) => prev + 1);
  };

  const resetPuzzle = () => {
    loadSeed(seed);
  };

  const handleGiveUp = () => {
    setShowSolution(true);
    setSelected(null);
  };

  const displayGrid = showSolution ? solution : grid;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('crazyQuilt.title')}
        instructions={t('crazyQuilt.instructions')}
      />

      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <button className={styles.button} onClick={resetPuzzle}>
            {t('crazyQuilt.reset')}
          </button>
          <button className={styles.button} onClick={newSeed}>
            {t('common.newPuzzle')}
          </button>
          <GiveUpButton onGiveUp={handleGiveUp} requireConfirm />
        </div>
        <div className={styles.status}>
          <span>{t('crazyQuilt.moves', { count: moves })}</span>
          {solved && !showSolution && (
            <span className={styles.solved}>{t('crazyQuilt.solved', { count: moves })}</span>
          )}
          {showSolution && (
            <span className={styles.giveUp}>{t('crazyQuilt.solutionRevealed')}</span>
          )}
        </div>
      </div>

      <SeedDisplay
        seed={seed}
        onSeedChange={setSeed}
        onNewSeed={newSeed}
        showNewButton
        showShare
      />

      <div className={styles.grid}>
        {displayGrid.map((row, rowIndex) => (
          <div key={suitOrder[rowIndex]?.id ?? rowIndex} className={styles.row}>
            <div className={styles.rowLabel}>
              <span className={styles.rowSuit}>
                {suitOrder[rowIndex]?.symbol}
              </span>
              <span className={styles.rowName}>
                {t(`crazyQuilt.suits.${suitOrder[rowIndex]?.id || 'spades'}`)}
              </span>
            </div>
            <div className={styles.rowCards}>
              {row.map((card, colIndex) => {
                const isSelected =
                  selected?.row === rowIndex && selected?.col === colIndex;
                const colorClass =
                  card.suitColor === 'red' ? styles.red : styles.black;
                return (
                  <button
                    key={card.id}
                    className={`${styles.card} ${colorClass} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleCardClick(rowIndex, colIndex)}
                    type="button"
                    aria-pressed={isSelected}
                  >
                    <span className={styles.rank}>{card.rank}</span>
                    <span className={styles.suit}>{card.suitSymbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
