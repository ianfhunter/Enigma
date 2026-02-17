import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import { createSeededRandom, seededShuffleArray } from '../../data/wordUtils';
import styles from './CrazyQuilt.module.css';

const SUITS = [
  { id: 'spades', symbol: '♠', color: 'black' },
  { id: 'hearts', symbol: '♥', color: 'red' },
  { id: 'diamonds', symbol: '♦', color: 'red' },
  { id: 'clubs', symbol: '♣', color: 'black' },
];

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank, rankIndex) => ({
      id: `${suit.id}-${rank}`,
      suit: suit.id,
      suitSymbol: suit.symbol,
      suitColor: suit.color,
      rank,
      rankIndex,
    }))
  );
}

function createFoundationState(aces = {}, kings = {}) {
  return Object.fromEntries(
    SUITS.map((suit) => [
      suit.id,
      {
        up: aces[suit.id] ? [aces[suit.id]] : [],
        down: kings[suit.id] ? [kings[suit.id]] : [],
      },
    ])
  );
}

function splitDeck(cards) {
  return {
    quilt: Array.from({ length: 5 }, (_, rowIndex) => cards.slice(rowIndex * 8, (rowIndex + 1) * 8)),
    stock: cards.slice(40),
  };
}

export function getOrientation(rowIndex, colIndex) {
  return (rowIndex + colIndex) % 2 === 0 ? 'horizontal' : 'vertical';
}

export function isCardExposed(quilt, rowIndex, colIndex) {
  const card = quilt[rowIndex]?.[colIndex];
  if (!card) return false;

  const orientation = getOrientation(rowIndex, colIndex);
  if (orientation === 'horizontal') {
    const left = quilt[rowIndex]?.[colIndex - 1] ?? null;
    const right = quilt[rowIndex]?.[colIndex + 1] ?? null;
    return !left || !right;
  }

  const above = quilt[rowIndex - 1]?.[colIndex] ?? null;
  const below = quilt[rowIndex + 1]?.[colIndex] ?? null;
  return !above || !below;
}

export function canMoveToFoundation(card, pile, direction) {
  if (!card || pile.length === 0) return false;
  const top = pile[pile.length - 1];
  if (card.suit !== top.suit) return false;
  if (direction === 'up') return card.rankIndex === top.rankIndex + 1;
  return card.rankIndex === top.rankIndex - 1;
}

export function applyFoundationMove(foundations, card, suit, direction) {
  const pile = foundations[suit][direction];
  if (!canMoveToFoundation(card, pile, direction)) return foundations;
  return {
    ...foundations,
    [suit]: {
      ...foundations[suit],
      [direction]: [...pile, card],
    },
  };
}

export function isSolved(quilt, stock, waste) {
  const quiltCards = quilt.flat().filter(Boolean).length;
  return quiltCards === 0 && stock.length === 0 && waste.length === 0;
}


export function getFoundationDisplayCard(foundations, suitId, direction) {
  const pile = foundations?.[suitId]?.[direction] ?? [];
  const top = pile[pile.length - 1];
  if (top) return top;

  const suit = SUITS.find((item) => item.id === suitId);
  const rank = direction === 'up' ? 'A' : 'K';
  return {
    suit: suitId,
    suitSymbol: suit?.symbol ?? '',
    rank,
  };
}

export function generateCrazyQuilt(seed) {
  const random = createSeededRandom(seed);
  const shuffled = seededShuffleArray(createDeck(), random);

  const aces = Object.fromEntries(
    SUITS.map((suit) => [suit.id, shuffled.find((card) => card.suit === suit.id && card.rank === 'A')])
  );
  const kings = Object.fromEntries(
    SUITS.map((suit) => [suit.id, shuffled.find((card) => card.suit === suit.id && card.rank === 'K')])
  );

  const quiltAndStock = shuffled.filter((card) => card.rank !== 'A' && card.rank !== 'K');
  const { quilt, stock } = splitDeck(quiltAndStock);

  return {
    quilt,
    stock,
    waste: [],
    foundations: createFoundationState(aces, kings),
  };
}

function cardClassName(card, orientation, selected, blocked) {
  return [
    styles.card,
    card.suitColor === 'red' ? styles.red : styles.black,
    orientation === 'vertical' ? styles.vertical : styles.horizontal,
    selected ? styles.selected : '',
    blocked ? styles.blocked : '',
  ].filter(Boolean).join(' ');
}

export default function CrazyQuilt() {
  const { t } = useTranslation();
  const { seed, setSeed, newSeed } = useSeed('crazy-quilt');

  const [quilt, setQuilt] = useState([]);
  const [stock, setStock] = useState([]);
  const [waste, setWaste] = useState([]);
  const [foundations, setFoundations] = useState(createFoundationState);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const loadPuzzle = useCallback((nextSeed) => {
    const state = generateCrazyQuilt(nextSeed);
    setQuilt(state.quilt);
    setStock(state.stock);
    setWaste(state.waste);
    setFoundations(state.foundations);
    setSelected(null);
    setMoves(0);
    setShowSolution(false);
  }, []);

  useEffect(() => {
    loadPuzzle(seed);
  }, [seed, loadPuzzle]);

  const solved = useMemo(() => isSolved(quilt, stock, waste), [quilt, stock, waste]);

  const selectedCard = useMemo(() => {
    if (!selected) return null;
    if (selected.source === 'waste') return waste[waste.length - 1] ?? null;
    return quilt[selected.row]?.[selected.col] ?? null;
  }, [selected, waste, quilt]);

  const drawFromStock = () => {
    if (showSolution || solved) return;
    if (stock.length === 0) {
      if (waste.length === 0) return;
      setStock([...waste].reverse());
      setWaste([]);
      setSelected(null);
      return;
    }

    const drawn = stock[stock.length - 1];
    setStock((prev) => prev.slice(0, -1));
    setWaste((prev) => [...prev, drawn]);
    setSelected(null);
    setMoves((prev) => prev + 1);
  };

  const selectQuiltCard = (rowIndex, colIndex) => {
    if (showSolution || solved) return;
    if (!isCardExposed(quilt, rowIndex, colIndex)) return;

    if (selected?.source === 'quilt' && selected.row === rowIndex && selected.col === colIndex) {
      setSelected(null);
      return;
    }

    setSelected({ source: 'quilt', row: rowIndex, col: colIndex });
  };

  const selectWasteCard = () => {
    if (showSolution || solved || waste.length === 0) return;
    if (selected?.source === 'waste') {
      setSelected(null);
      return;
    }
    setSelected({ source: 'waste' });
  };

  const moveSelectedToWaste = () => {
    if (!selectedCard || selected?.source !== 'quilt') return;

    setQuilt((prev) => prev.map((row, r) => row.map((card, c) => (r === selected.row && c === selected.col ? null : card))));
    setWaste((prev) => [...prev, selectedCard]);
    setSelected(null);
    setMoves((prev) => prev + 1);
  };

  const moveSelectedToFoundation = (suit, direction) => {
    if (!selectedCard) return;

    const nextFoundations = applyFoundationMove(foundations, selectedCard, suit, direction);
    if (nextFoundations === foundations) return;

    setFoundations(nextFoundations);
    if (selected.source === 'quilt') {
      setQuilt((prev) => prev.map((row, r) => row.map((card, c) => (r === selected.row && c === selected.col ? null : card))));
    } else {
      setWaste((prev) => prev.slice(0, -1));
    }
    setSelected(null);
    setMoves((prev) => prev + 1);
  };

  const revealSolution = () => {
    setShowSolution(true);
    const solvedFoundations = Object.fromEntries(
      SUITS.map((suit) => [
        suit.id,
        {
          up: createDeck().filter((card) => card.suit === suit.id && card.rankIndex <= 11),
          down: createDeck().filter((card) => card.suit === suit.id && card.rankIndex >= 1).reverse(),
        },
      ])
    );

    setFoundations(solvedFoundations);
    setQuilt(Array.from({ length: 5 }, () => Array(8).fill(null)));
    setStock([]);
    setWaste([]);
    setSelected(null);
  };

  const remaining = quilt.flat().filter(Boolean).length + stock.length + waste.length;

  return (
    <div className={styles.container}>
      <GameHeader title={t('crazyQuilt.title')} instructions={t('crazyQuilt.instructions')} />

      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={() => loadPuzzle(seed)}>{t('crazyQuilt.reset')}</button>
          <button type="button" className={styles.button} onClick={newSeed}>{t('common.newPuzzle')}</button>
          <GiveUpButton onGiveUp={revealSolution} requireConfirm />
        </div>

        <div className={styles.status}>
          <span>{t('crazyQuilt.moves', { count: moves })}</span>
          <span>{t('crazyQuilt.remaining', { count: remaining })}</span>
          {solved && !showSolution && <span className={styles.solved}>{t('crazyQuilt.solved')}</span>}
          {showSolution && <span className={styles.giveUp}>{t('crazyQuilt.solutionRevealed')}</span>}
        </div>
      </div>

      <SeedDisplay seed={seed} onSeedChange={setSeed} onNewSeed={newSeed} showNewButton showShare />

      <section className={styles.tableauArea}>
        <div className={styles.sidePiles}>
          <button type="button" className={styles.pile} onClick={drawFromStock}>
            <span className={styles.pileLabel}>{t('crazyQuilt.stock')}</span>
            <span>{stock.length || '—'}</span>
          </button>

          <button
            type="button"
            className={`${styles.pile} ${selected?.source === 'waste' ? styles.selectedPile : ''}`}
            onClick={selectWasteCard}
            disabled={waste.length === 0}
          >
            <span className={styles.pileLabel}>{t('crazyQuilt.waste')}</span>
            {waste.length > 0 ? (
              <span className={waste[waste.length - 1].suitColor === 'red' ? styles.red : styles.black}>
                {waste[waste.length - 1].rank}{waste[waste.length - 1].suitSymbol}
              </span>
            ) : (
              <span>—</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.pile} ${selected?.source === 'quilt' ? styles.selectedPile : ''}`}
            onClick={moveSelectedToWaste}
            disabled={selected?.source !== 'quilt'}
          >
            <span className={styles.pileLabel}>{t('crazyQuilt.toWaste')}</span>
            <span>{t('crazyQuilt.place')}</span>
          </button>

          <div className={styles.foundationColumns}>
            {SUITS.map((suit) => {
              const upTop = getFoundationDisplayCard(foundations, suit.id, 'up');
              const downTop = getFoundationDisplayCard(foundations, suit.id, 'down');
              return (
                <div key={suit.id} className={styles.foundationColumn}>
                  <button type="button" className={styles.foundationPile} onClick={() => moveSelectedToFoundation(suit.id, 'up')}>
                    <span className={styles.pileLabel}>{t('crazyQuilt.foundationUp')}</span>
                    <span className={suit.color === 'red' ? styles.red : styles.black}>{upTop.rank}{upTop.suitSymbol}</span>
                  </button>
                  <button type="button" className={styles.foundationPile} onClick={() => moveSelectedToFoundation(suit.id, 'down')}>
                    <span className={styles.pileLabel}>{t('crazyQuilt.foundationDown')}</span>
                    <span className={suit.color === 'red' ? styles.red : styles.black}>{downTop.rank}{downTop.suitSymbol}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.quiltBoard}>
          {quilt.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((card, colIndex) => {
                if (!card) return <div key={`${rowIndex}-${colIndex}`} className={styles.emptySpot} />;

                const orientation = getOrientation(rowIndex, colIndex);
                const exposed = isCardExposed(quilt, rowIndex, colIndex);
                const isSelected = selected?.source === 'quilt' && selected.row === rowIndex && selected.col === colIndex;

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={cardClassName(card, orientation, isSelected, !exposed)}
                    onClick={() => selectQuiltCard(rowIndex, colIndex)}
                    aria-pressed={isSelected}
                    aria-disabled={!exposed}
                  >
                    <span>{card.rank}</span>
                    <span>{card.suitSymbol}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
