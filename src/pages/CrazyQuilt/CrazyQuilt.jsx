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

function createFoundationState(aces = {}) {
  return Object.fromEntries(SUITS.map((suit) => [suit.id, aces[suit.id] ? [aces[suit.id]] : []]));
}

function splitDeck(cards) {
  return {
    quilt: Array.from({ length: 5 }, (_, rowIndex) =>
      cards.slice(rowIndex * 8, (rowIndex + 1) * 8)
    ),
    stock: cards.slice(40),
  };
}

export function generateCrazyQuilt(seed) {
  const random = createSeededRandom(seed);
  const shuffled = seededShuffleArray(createDeck(), random);
  const aces = Object.fromEntries(
    SUITS.map((suit) => [suit.id, shuffled.find((card) => card.suit === suit.id && card.rank === 'A')])
  );
  const nonAces = shuffled.filter((card) => card.rank !== 'A');
  const { quilt, stock } = splitDeck(nonAces);

  return {
    quilt,
    stock,
    waste: [],
    foundations: createFoundationState(aces),
  };
}

export function canMoveToFoundation(card, foundationPile) {
  if (!card) return false;
  if (foundationPile.length === 0) return card.rank === 'A';
  const topCard = foundationPile[foundationPile.length - 1];
  return card.suit === topCard.suit && card.rankIndex === topCard.rankIndex + 1;
}

export function placeOnFoundation(foundations, card) {
  if (!card) return foundations;
  const pile = foundations[card.suit];
  if (!canMoveToFoundation(card, pile)) return foundations;
  return {
    ...foundations,
    [card.suit]: [...pile, card],
  };
}

export function isSolved(foundations) {
  return SUITS.every((suit) => foundations[suit.id].length === 13);
}

function cardClassName(card, isVertical, isSelected) {
  const colors = card.suitColor === 'red' ? styles.red : styles.black;
  return `${styles.card} ${colors} ${isVertical ? styles.vertical : styles.horizontal} ${isSelected ? styles.selected : ''}`;
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

  const solved = useMemo(() => isSolved(foundations), [foundations]);

  const drawFromStock = () => {
    if (showSolution || solved) return;

    if (stock.length === 0) {
      if (waste.length === 0) return;
      setStock([...waste].reverse());
      setWaste([]);
      setSelected(null);
      return;
    }

    const nextStock = stock.slice(0, -1);
    const drawn = stock[stock.length - 1];
    setStock(nextStock);
    setWaste((prev) => [...prev, drawn]);
    setMoves((prev) => prev + 1);
    setSelected(null);
  };

  const tryMoveCardToFoundation = (card, removeCard) => {
    const next = placeOnFoundation(foundations, card);
    if (next === foundations) return false;
    setFoundations(next);
    removeCard();
    setMoves((prev) => prev + 1);
    setSelected(null);
    return true;
  };

  const clickQuiltCard = (rowIndex, colIndex) => {
    if (showSolution || solved) return;
    const card = quilt[rowIndex][colIndex];
    if (!card) return;

    const key = `q-${rowIndex}-${colIndex}`;
    if (selected === key) {
      setSelected(null);
      return;
    }

    const moved = tryMoveCardToFoundation(card, () => {
      setQuilt((prev) => prev.map((row, r) =>
        row.map((rowCard, c) => ((r === rowIndex && c === colIndex) ? null : rowCard))
      ));
    });

    if (!moved) setSelected(key);
  };

  const clickWasteCard = () => {
    if (showSolution || solved || waste.length === 0) return;
    const topCard = waste[waste.length - 1];

    const moved = tryMoveCardToFoundation(topCard, () => {
      setWaste((prev) => prev.slice(0, -1));
    });

    if (!moved) {
      setSelected((prev) => (prev === 'waste' ? null : 'waste'));
    }
  };

  const revealSolution = () => {
    setShowSolution(true);
    const solvedFoundations = Object.fromEntries(
      SUITS.map((suit) => [suit.id, createDeck().filter((card) => card.suit === suit.id)])
    );
    setFoundations(solvedFoundations);
    setQuilt(Array.from({ length: 5 }, () => Array(8).fill(null)));
    setStock([]);
    setWaste([]);
    setSelected(null);
  };

  const quiltCardsLeft = quilt.flat().filter(Boolean).length;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('crazyQuilt.title')}
        instructions={t('crazyQuilt.instructions')}
      />

      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={() => loadPuzzle(seed)}>
            {t('crazyQuilt.reset')}
          </button>
          <button type="button" className={styles.button} onClick={newSeed}>
            {t('common.newPuzzle')}
          </button>
          <GiveUpButton onGiveUp={revealSolution} requireConfirm />
        </div>
        <div className={styles.status}>
          <span>{t('crazyQuilt.moves', { count: moves })}</span>
          <span>{t('crazyQuilt.remaining', { count: quiltCardsLeft + stock.length + waste.length })}</span>
          {solved && !showSolution && <span className={styles.solved}>{t('crazyQuilt.solved')}</span>}
          {showSolution && <span className={styles.giveUp}>{t('crazyQuilt.solutionRevealed')}</span>}
        </div>
      </div>

      <SeedDisplay seed={seed} onSeedChange={setSeed} onNewSeed={newSeed} showNewButton showShare />

      <section className={styles.tableauArea}>
        <div className={styles.sidePiles}>
          <button type="button" className={styles.pile} onClick={drawFromStock}>
            <span className={styles.pileLabel}>{t('crazyQuilt.stock')}</span>
            <span>{stock.length > 0 ? stock.length : '—'}</span>
          </button>

          <button
            type="button"
            className={`${styles.pile} ${selected === 'waste' ? styles.selectedPile : ''}`}
            onClick={clickWasteCard}
            disabled={waste.length === 0}
          >
            <span className={styles.pileLabel}>{t('crazyQuilt.waste')}</span>
            {waste.length > 0 ? (
              <span className={waste[waste.length - 1].suitColor === 'red' ? styles.red : styles.black}>
                {waste[waste.length - 1].rank}{waste[waste.length - 1].suitSymbol}
              </span>
            ) : <span>—</span>}
          </button>

          <div className={styles.foundationGrid}>
            {SUITS.map((suit) => {
              const top = foundations[suit.id][foundations[suit.id].length - 1];
              return (
                <div key={suit.id} className={styles.foundationPile}>
                  <span className={styles.pileLabel}>{t(`crazyQuilt.suits.${suit.id}`)}</span>
                  <span className={suit.color === 'red' ? styles.red : styles.black}>
                    {top ? `${top.rank}${top.suitSymbol}` : `A${suit.symbol}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.quiltBoard}>
          {quilt.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((card, colIndex) => {
                const isVertical = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selected === `q-${rowIndex}-${colIndex}`;

                if (!card) {
                  return <div key={`${rowIndex}-${colIndex}`} className={styles.emptySpot} />;
                }

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={cardClassName(card, isVertical, isSelected)}
                    onClick={() => clickQuiltCard(rowIndex, colIndex)}
                    aria-pressed={isSelected}
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
