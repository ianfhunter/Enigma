import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useGameState } from '../../hooks/useGameState';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './Klondike.module.css';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_VALUES = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
};

const SUIT_COLORS = {
  '♠': 'black',
  '♣': 'black',
  '♥': 'red',
  '♦': 'red',
};

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}${suit}`,
        rank,
        suit,
        color: SUIT_COLORS[suit],
        value: CARD_VALUES[rank],
      });
    }
  }
  return deck;
}

function shuffleDeck(deck, seed) {
  const rng = createSeededRandom(seed);
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealKlondike(deck) {
  const tableau = Array.from({ length: 7 }, () => []);
  let index = 0;

  for (let col = 0; col < 7; col++) {
    const column = [];
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[index++] };
      column.push({
        ...card,
        faceUp: row === col,
      });
    }
    tableau[col] = column;
  }

  const stock = deck.slice(index).map(card => ({ ...card, faceUp: false }));
  const waste = [];
  const foundations = SUITS.reduce((acc, suit) => {
    acc[suit] = [];
    return acc;
  }, {});

  return { tableau, stock, waste, foundations };
}

function canMoveToFoundation(card, foundationPile) {
  if (!card) return false;
  if (foundationPile.length === 0) return card.rank === 'A';
  const top = foundationPile[foundationPile.length - 1];
  return top.suit === card.suit && card.value === top.value + 1;
}

function canMoveToTableau(card, targetColumn) {
  if (!card) return false;
  if (targetColumn.length === 0) return card.rank === 'K';
  const top = targetColumn[targetColumn.length - 1];
  return card.color !== top.color && card.value === top.value - 1;
}

function cloneTableau(tableau) {
  return tableau.map(column => column.map(card => ({ ...card })));
}

function cloneFoundations(foundations) {
  return SUITS.reduce((acc, suit) => {
    acc[suit] = foundations[suit].map(card => ({ ...card }));
    return acc;
  }, {});
}

function revealTopCard(column) {
  if (column.length === 0) return column;
  const newColumn = column.map(card => ({ ...card }));
  const top = newColumn[newColumn.length - 1];
  if (!top.faceUp) {
    top.faceUp = true;
  }
  return newColumn;
}

function buildSolvedFoundations() {
  const deck = createDeck();
  return SUITS.reduce((acc, suit) => {
    acc[suit] = deck
      .filter(card => card.suit === suit)
      .sort((a, b) => a.value - b.value)
      .map(card => ({ ...card, faceUp: true }));
    return acc;
  }, {});
}

export {
  createDeck,
  shuffleDeck,
  dealKlondike,
  canMoveToFoundation,
  canMoveToTableau,
  revealTopCard,
  buildSolvedFoundations,
};

export default function Klondike() {
  const { t } = useTranslation();
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const getDefaultSeed = () => stringToSeed(`klondike-${getTodayDateString()}`);
  const [seed, setSeed] = usePersistedState('klondike-seed', getDefaultSeed());
  const [tableau, setTableau] = useState([]);
  const [stock, setStock] = useState([]);
  const [waste, setWaste] = useState([]);
  const [foundations, setFoundations] = useState({});
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const initGame = useCallback((newSeed = null) => {
    const gameSeed = newSeed ?? seed;
    const shuffled = shuffleDeck(createDeck(), gameSeed);
    const { tableau: newTableau, stock: newStock, waste: newWaste, foundations: newFoundations } =
      dealKlondike(shuffled);

    setTableau(newTableau);
    setStock(newStock);
    setWaste(newWaste);
    setFoundations(newFoundations);
    setSelected(null);
    setMoves(0);
    setMessage('');
    setHistory([]);
    setSeed(gameSeed);
    resetGameState();
  }, [seed, resetGameState]);

  useEffect(() => {
    initGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const total = SUITS.reduce((acc, suit) => acc + (foundations[suit]?.length ?? 0), 0);
    if (total === 52 && isPlaying) {
      checkWin();
      setMessage(t('klondike.winMessage', { moves }));
    }
  }, [foundations, isPlaying, checkWin, moves, t]);

  const remainingStock = stock.length;
  const topWasteCard = waste[waste.length - 1] || null;

  const saveHistory = useCallback(() => {
    setHistory(prev => [
      ...prev,
      {
        tableau: cloneTableau(tableau),
        stock: stock.map(card => ({ ...card })),
        waste: waste.map(card => ({ ...card })),
        foundations: cloneFoundations(foundations),
        moves,
      },
    ]);
  }, [tableau, stock, waste, foundations, moves]);

  const drawFromStock = useCallback(() => {
    if (!isPlaying) return;

    if (stock.length === 0) {
      if (waste.length === 0) {
        setMessage(t('klondike.stockEmpty'));
        return;
      }
      saveHistory();
      const recycled = [...waste].reverse().map(card => ({ ...card, faceUp: false }));
      setStock(recycled);
      setWaste([]);
      setMoves(prev => prev + 1);
      setSelected(null);
      setMessage(t('klondike.recycleMessage'));
      return;
    }

    saveHistory();
    const newStock = [...stock];
    const drawn = { ...newStock.pop(), faceUp: true };
    setStock(newStock);
    setWaste(prev => [...prev, drawn]);
    setMoves(prev => prev + 1);
    setSelected(null);
    setMessage('');
  }, [stock, waste, isPlaying, saveHistory, t]);

  const undo = useCallback(() => {
    if (history.length === 0 || !isPlaying) return;
    const last = history[history.length - 1];
    setTableau(last.tableau);
    setStock(last.stock);
    setWaste(last.waste);
    setFoundations(last.foundations);
    setMoves(last.moves);
    setHistory(prev => prev.slice(0, -1));
    setSelected(null);
    setMessage('');
  }, [history, isPlaying]);

  const selectCard = useCallback((selection) => {
    setSelected(selection);
    setMessage('');
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setMessage('');
  }, []);

  const moveToFoundation = useCallback((card, source) => {
    const foundation = foundations[card.suit] || [];
    if (!canMoveToFoundation(card, foundation)) {
      setMessage(t('klondike.invalidFoundationMove'));
      return false;
    }

    saveHistory();
    const newFoundations = cloneFoundations(foundations);
    newFoundations[card.suit].push({ ...card, faceUp: true });

    if (source.type === 'waste') {
      const newWaste = waste.slice(0, -1);
      setWaste(newWaste);
    } else if (source.type === 'tableau') {
      const newTableau = cloneTableau(tableau);
      newTableau[source.columnIndex] = newTableau[source.columnIndex].slice(0, source.cardIndex);
      newTableau[source.columnIndex] = revealTopCard(newTableau[source.columnIndex]);
      setTableau(newTableau);
    }

    setFoundations(newFoundations);
    setMoves(prev => prev + 1);
    setSelected(null);
    setMessage('');
    return true;
  }, [foundations, saveHistory, tableau, waste, t]);

  const moveToTableau = useCallback((targetColumnIndex) => {
    if (!selected) return false;

    const targetColumn = tableau[targetColumnIndex];
    if (selected.type === 'tableau' && selected.columnIndex === targetColumnIndex) {
      return false;
    }

    if (selected.type === 'waste') {
      const card = topWasteCard;
      if (!card) return false;
      if (!canMoveToTableau(card, targetColumn)) {
        setMessage(t('klondike.invalidTableauMove'));
        return false;
      }
      saveHistory();
      const newTableau = cloneTableau(tableau);
      newTableau[targetColumnIndex] = [...newTableau[targetColumnIndex], { ...card, faceUp: true }];
      setTableau(newTableau);
      setWaste(waste.slice(0, -1));
      setMoves(prev => prev + 1);
      clearSelection();
      return true;
    }

    if (selected.type === 'tableau') {
      const sourceColumn = tableau[selected.columnIndex];
      const movingStack = sourceColumn.slice(selected.cardIndex);
      if (movingStack.some(card => !card.faceUp)) {
        setMessage(t('klondike.invalidTableauMove'));
        return false;
      }
      if (!canMoveToTableau(movingStack[0], targetColumn)) {
        setMessage(t('klondike.invalidTableauMove'));
        return false;
      }

      saveHistory();
      const newTableau = cloneTableau(tableau);
      newTableau[targetColumnIndex] = [...newTableau[targetColumnIndex], ...movingStack.map(card => ({ ...card }))];
      newTableau[selected.columnIndex] = newTableau[selected.columnIndex].slice(0, selected.cardIndex);
      newTableau[selected.columnIndex] = revealTopCard(newTableau[selected.columnIndex]);
      setTableau(newTableau);
      setMoves(prev => prev + 1);
      clearSelection();
      return true;
    }

    return false;
  }, [selected, tableau, topWasteCard, waste, saveHistory, t, clearSelection]);

  const handleTableauCardClick = useCallback((columnIndex, cardIndex) => {
    if (!isPlaying) return;

    const card = tableau[columnIndex][cardIndex];
    if (!card.faceUp) {
      setMessage(t('klondike.cardFaceDown'));
      return;
    }

    if (selected) {
      if (selected.type === 'tableau' && selected.columnIndex === columnIndex && selected.cardIndex === cardIndex) {
        clearSelection();
        return;
      }
      moveToTableau(columnIndex);
      return;
    }

    selectCard({ type: 'tableau', columnIndex, cardIndex });
  }, [isPlaying, tableau, selected, moveToTableau, selectCard, clearSelection, t]);

  const handleWasteClick = useCallback(() => {
    if (!isPlaying) return;
    if (!topWasteCard) return;
    if (selected?.type === 'waste') {
      clearSelection();
      return;
    }
    selectCard({ type: 'waste' });
  }, [isPlaying, topWasteCard, selected, selectCard, clearSelection]);

  const handleFoundationClick = useCallback((suit) => {
    if (!isPlaying || !selected) return;
    const card = selected.type === 'waste'
      ? topWasteCard
      : tableau[selected.columnIndex][selected.cardIndex];

    if (!card) return;
    if (selected.type === 'tableau') {
      const isTopCard = selected.cardIndex === tableau[selected.columnIndex].length - 1;
      if (!isTopCard) {
        setMessage(t('klondike.foundationTopOnly'));
        return;
      }
    }

    moveToFoundation(card, selected.type === 'waste'
      ? { type: 'waste' }
      : { type: 'tableau', columnIndex: selected.columnIndex, cardIndex: selected.cardIndex });
  }, [isPlaying, selected, topWasteCard, tableau, moveToFoundation, t]);

  const handleEmptyTableauClick = useCallback((columnIndex) => {
    if (!isPlaying || !selected) return;
    moveToTableau(columnIndex);
  }, [isPlaying, selected, moveToTableau]);

  const newGame = useCallback(() => {
    const random = createSeededRandom(Date.now());
    const newSeed = stringToSeed(`klondike-${Date.now()}-${random()}`);
    initGame(newSeed);
  }, [initGame]);

  const handleGiveUp = useCallback(() => {
    giveUp();
    setTableau(Array.from({ length: 7 }, () => []));
    setStock([]);
    setWaste([]);
    setFoundations(buildSolvedFoundations());
    setSelected(null);
    setMessage(t('klondike.gaveUpMessage'));
  }, [giveUp, t]);

  const renderCard = (card, isSelected) => {
    const colorClass = card.color === 'red' ? styles.red : styles.black;
    const faceClass = card.faceUp ? styles.faceUp : styles.faceDown;
    return (
      <div className={`${styles.card} ${colorClass} ${faceClass} ${isSelected ? styles.selected : ''}`}>
        {card.faceUp ? (
          <>
            <span className={styles.cardRank}>{card.rank}</span>
            <span className={styles.cardSuit}>{card.suit}</span>
          </>
        ) : (
          <span className={styles.cardBack}>🂠</span>
        )}
      </div>
    );
  };

  const tableauColumns = useMemo(() => tableau.map((column, columnIndex) => (
    <div key={columnIndex} className={styles.tableauColumn}>
      {column.length === 0 ? (
        <button
          type="button"
          className={styles.emptyColumn}
          onClick={() => handleEmptyTableauClick(columnIndex)}
        >
          {t('klondike.emptyColumn')}
        </button>
      ) : (
        column.map((card, cardIndex) => (
          <button
            type="button"
            key={card.id}
            className={styles.cardButton}
            onClick={() => handleTableauCardClick(columnIndex, cardIndex)}
          >
            {renderCard(card, selected?.type === 'tableau'
              && selected.columnIndex === columnIndex
              && selected.cardIndex === cardIndex)}
          </button>
        ))
      )}
    </div>
  )), [tableau, handleTableauCardClick, handleEmptyTableauClick, selected, t]);

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('klondike.title')}
        instructions={t('klondike.instructions')}
      />

      <SeedDisplay
        seed={seed}
        variant="compact"
        showNewButton={false}
        showShare={false}
        onSeedChange={(newSeed) => {
          const seedNum = typeof newSeed === 'string'
            ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
            : newSeed;
          initGame(seedNum);
        }}
      />

      <div className={styles.gameInfo}>
        <span>{t('gameStatus.moves')}: {moves}</span>
        <span>{t('klondike.stockLabel')}: {remainingStock}</span>
      </div>

      {message && (
        <div className={`${styles.message} ${gameState === 'won' ? styles.success : ''}`}>
          {message}
        </div>
      )}

      <div className={styles.playArea}>
        <div className={styles.topRow}>
          <div className={styles.stockArea}>
            <span className={styles.pileLabel}>{t('klondike.stockLabel')}</span>
            <button
              type="button"
              className={`${styles.pile} ${styles.stockPile} ${remainingStock === 0 ? styles.emptyPile : ''}`}
              onClick={drawFromStock}
              disabled={!isPlaying}
            >
              {remainingStock > 0 ? <span className={styles.cardBack}>🂠</span> : <span>∅</span>}
            </button>
          </div>

          <div className={styles.wasteArea}>
            <span className={styles.pileLabel}>{t('klondike.wasteLabel')}</span>
            <button
              type="button"
              className={`${styles.pile} ${styles.wastePile}`}
              onClick={handleWasteClick}
              disabled={!isPlaying || !topWasteCard}
            >
              {topWasteCard ? renderCard(topWasteCard, selected?.type === 'waste') : <span>∅</span>}
            </button>
          </div>

          <div className={styles.foundationArea}>
            <span className={styles.pileLabel}>{t('klondike.foundationLabel')}</span>
            <div className={styles.foundations}>
              {SUITS.map(suit => {
                const pile = foundations[suit] || [];
                const top = pile[pile.length - 1];
                return (
                  <button
                    key={suit}
                    type="button"
                    className={`${styles.pile} ${styles.foundationPile}`}
                    onClick={() => handleFoundationClick(suit)}
                    disabled={!isPlaying || !selected}
                  >
                    {top ? renderCard(top, false) : <span className={styles.foundationSuit}>{suit}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.tableauArea}>
          {tableauColumns}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={undo}
          disabled={history.length === 0 || !isPlaying}
        >
          {t('common.undo')}
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={newGame}
        >
          {t('common.newGame')}
        </button>
        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={!isPlaying}
          requireConfirm
          variant="compact"
        />
      </div>

      {gameState === 'won' && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <h2>{t('klondike.winTitle')}</h2>
            <p>{t('klondike.winMessage', { moves })}</p>
            <button type="button" className={styles.playAgain} onClick={newGame}>
              {t('common.playAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
