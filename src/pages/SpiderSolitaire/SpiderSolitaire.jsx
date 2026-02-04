import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { getTodayDateString, stringToSeed, createSeededRandom, seededShuffleArray } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './SpiderSolitaire.module.css';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_VALUES = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
};

const TOTAL_RUNS = 8;
const COLUMNS = 10;
const INITIAL_COLUMN_COUNTS = [6, 6, 6, 6, 5, 5, 5, 5, 5, 5];

const createSpiderDeck = () => {
  const deck = [];
  let id = 0;
  for (let deckIndex = 0; deckIndex < 8; deckIndex++) {
    for (const rank of RANKS) {
      deck.push({
        id: id++,
        rank,
        value: CARD_VALUES[rank],
        suit: '♠',
        faceUp: false,
      });
    }
  }
  return deck;
};

const dealTableau = (deck) => {
  const columns = [];
  let index = 0;

  for (let columnIndex = 0; columnIndex < COLUMNS; columnIndex++) {
    const count = INITIAL_COLUMN_COUNTS[columnIndex];
    const columnCards = deck.slice(index, index + count).map((card, cardIndex) => ({
      ...card,
      faceUp: cardIndex === count - 1,
    }));
    columns.push(columnCards);
    index += count;
  }

  const stock = deck.slice(index).map(card => ({ ...card, faceUp: false }));

  return { columns, stock };
};

const generateSpiderGame = (seed) => {
  const random = createSeededRandom(seed);
  const shuffledDeck = seededShuffleArray(createSpiderDeck(), random);
  return dealTableau(shuffledDeck);
};

const isDescendingSequence = (column, startIndex) => {
  for (let i = startIndex; i < column.length; i++) {
    const card = column[i];
    if (!card.faceUp) return false;
    if (i < column.length - 1 && card.value !== column[i + 1].value + 1) {
      return false;
    }
  }
  return true;
};

const canPlaceSequence = (sequence, destination) => {
  if (destination.length === 0) return true;
  const destinationTop = destination[destination.length - 1];
  return destinationTop.faceUp && destinationTop.value === sequence[0].value + 1;
};

const flipTopCardIfNeeded = (column) => {
  if (column.length === 0) return column;
  const topCard = column[column.length - 1];
  if (!topCard.faceUp) {
    const updated = [...column];
    updated[updated.length - 1] = { ...topCard, faceUp: true };
    return updated;
  }
  return column;
};

const removeCompletedRuns = (columns) => {
  let completedRuns = 0;
  const updatedColumns = columns.map(column => {
    let nextColumn = [...column];
    let removed = true;

    while (removed && nextColumn.length >= 13) {
      const startIndex = nextColumn.length - 13;
      const run = nextColumn.slice(startIndex);
      const isCompleteRun = run[0].value === 13
        && run[run.length - 1].value === 1
        && run.every((card, idx) => card.faceUp
          && (idx === run.length - 1 || card.value === run[idx + 1].value + 1));

      if (isCompleteRun) {
        completedRuns += 1;
        nextColumn = nextColumn.slice(0, startIndex);
      } else {
        removed = false;
      }
    }

    return nextColumn;
  });

  return { columns: updatedColumns, completedRuns };
};

export {
  createSpiderDeck,
  dealTableau,
  generateSpiderGame,
  isDescendingSequence,
  canPlaceSequence,
  removeCompletedRuns,
  CARD_VALUES,
};

export default function SpiderSolitaire() {
  const { t } = useTranslation();
  const getDefaultSeed = () => stringToSeed(`spider-solitaire-${getTodayDateString()}`);
  const [seed, setSeed] = usePersistedState('spider-solitaire-seed', getDefaultSeed());
  const [columns, setColumns] = useState([]);
  const [stock, setStock] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState('ready');
  const [selected, setSelected] = useState(null);

  const initGame = useCallback((newSeed = null) => {
    const gameSeed = newSeed ?? seed;
    const { columns: initialColumns, stock: initialStock } = generateSpiderGame(gameSeed);
    setColumns(initialColumns);
    setStock(initialStock);
    setCompleted(0);
    setMoves(0);
    setMessage('');
    setSelected(null);
    setSeed(gameSeed);
    setGameState('playing');
  }, [seed, setSeed]);

  useEffect(() => {
    initGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stockRemaining = stock.length;

  const handleSelectCard = (columnIndex, cardIndex) => {
    if (gameState !== 'playing') return;
    const column = columns[columnIndex];
    const card = column[cardIndex];
    if (!card?.faceUp) return;
    if (!isDescendingSequence(column, cardIndex)) {
      setMessage(t('spiderSolitaire.invalidSequence', 'Select a fully descending face-up sequence.'));
      return;
    }
    if (selected && selected.columnIndex === columnIndex && selected.cardIndex === cardIndex) {
      setSelected(null);
      return;
    }
    setMessage('');
    setSelected({ columnIndex, cardIndex });
  };

  const applyMove = useCallback((fromColumnIndex, startIndex, toColumnIndex) => {
    const nextColumns = columns.map(column => [...column]);
    const movingCards = nextColumns[fromColumnIndex].slice(startIndex);
    nextColumns[fromColumnIndex] = nextColumns[fromColumnIndex].slice(0, startIndex);
    nextColumns[toColumnIndex] = [...nextColumns[toColumnIndex], ...movingCards];
    nextColumns[fromColumnIndex] = flipTopCardIfNeeded(nextColumns[fromColumnIndex]);

    const { columns: cleanedColumns, completedRuns } = removeCompletedRuns(nextColumns);
    setColumns(cleanedColumns);
    setCompleted(prev => prev + completedRuns);
    setMoves(prev => prev + 1);
  }, [columns]);

  const handleColumnClick = (columnIndex) => {
    if (!selected || gameState !== 'playing') return;
    if (selected.columnIndex === columnIndex) return;

    const fromColumn = columns[selected.columnIndex];
    const sequence = fromColumn.slice(selected.cardIndex);
    const destination = columns[columnIndex];

    if (!canPlaceSequence(sequence, destination)) {
      setMessage(t('spiderSolitaire.invalidMove', 'You can only place a sequence on the next higher card or an empty column.'));
      return;
    }

    setMessage('');
    setSelected(null);
    applyMove(selected.columnIndex, selected.cardIndex, columnIndex);
  };

  const handleDeal = () => {
    if (gameState !== 'playing') return;
    if (stock.length < COLUMNS) {
      setMessage(t('spiderSolitaire.noStock', 'No more cards to deal.'));
      return;
    }
    const hasEmptyColumn = columns.some(column => column.length === 0);
    if (hasEmptyColumn) {
      setMessage(t('spiderSolitaire.emptyColumnDeal', 'Fill empty columns before dealing new cards.'));
      return;
    }

    const nextStock = [...stock];
    const nextColumns = columns.map(column => [...column]);
    for (let i = 0; i < COLUMNS; i++) {
      const nextCard = nextStock.shift();
      if (!nextCard) break;
      nextColumns[i].push({ ...nextCard, faceUp: true });
    }

    const { columns: cleanedColumns, completedRuns } = removeCompletedRuns(nextColumns);
    setColumns(cleanedColumns);
    setStock(nextStock);
    setCompleted(prev => prev + completedRuns);
    setMoves(prev => prev + 1);
    setMessage('');
  };

  const handleGiveUp = () => {
    setColumns([]);
    setStock([]);
    setCompleted(TOTAL_RUNS);
    setMoves(prev => prev + 1);
    setSelected(null);
    setGameState('gave-up');
    setMessage(t('spiderSolitaire.gaveUpMessage', 'You gave up. All runs have been completed.'));
  };

  const handleNewGame = () => {
    initGame(getDefaultSeed());
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (completed === TOTAL_RUNS) {
      setGameState('won');
      setMessage(t('spiderSolitaire.winMessage', 'You completed all eight runs!'));
    }
  }, [completed, gameState, t]);

  const renderCard = (card, columnIndex, cardIndex) => {
    const isSelected = selected
      && selected.columnIndex === columnIndex
      && selected.cardIndex === cardIndex;

    return (
      <button
        key={`${card.id}-${cardIndex}`}
        className={`${styles.card} ${card.faceUp ? styles.faceUp : styles.faceDown} ${isSelected ? styles.selected : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          handleSelectCard(columnIndex, cardIndex);
        }}
        disabled={!card.faceUp || gameState !== 'playing'}
        type="button"
      >
        {card.faceUp ? (
          <>
            <span className={styles.cardRank}>{card.rank}</span>
            <span className={styles.cardSuit}>{card.suit}</span>
          </>
        ) : (
          <span className={styles.cardBack}>🂠</span>
        )}
      </button>
    );
  };

  const completedLabel = useMemo(() => t('spiderSolitaire.completed', 'Completed Runs'), [t]);

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('spiderSolitaire.title', 'Spider Solitaire')}
        instructions={t(
          'spiderSolitaire.instructions',
          'Build descending sequences from King to Ace. Move any face-up descending sequence onto the next higher card or an empty column. Complete all eight runs to win.'
        )}
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showShare={false}
          showNewButton={false}
          onSeedChange={(newSeed) => {
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
              : newSeed;
            initGame(seedNum);
          }}
        />
      )}

      <div className={styles.gameInfo}>
        <span>{t('common.moves', 'Moves')}: {moves}</span>
        <span>{completedLabel}: {completed}/{TOTAL_RUNS}</span>
        <span>{t('spiderSolitaire.stock', 'Stock')}: {stockRemaining}</span>
      </div>

      {message && (
        <div className={`${styles.message} ${gameState === 'won' ? styles.success : ''}`}>
          {message}
        </div>
      )}

      <div className={styles.tableau}>
        {columns.map((column, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className={styles.column}
            onClick={() => handleColumnClick(columnIndex)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleColumnClick(columnIndex);
              }
            }}
          >
            {column.length === 0 ? (
              <div className={styles.emptySlot}>{t('spiderSolitaire.empty', 'Empty')}</div>
            ) : (
              column.map((card, cardIndex) => (
                <div
                  key={`${card.id}-${cardIndex}`}
                  className={styles.cardSlot}
                  style={{ top: `${cardIndex * 26}px` }}
                >
                  {renderCard(card, columnIndex, cardIndex)}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={handleDeal}
          disabled={gameState !== 'playing'}
          type="button"
        >
          🂠 {t('spiderSolitaire.deal', 'Deal 10 Cards')}
        </button>
        <button
          className={styles.controlButton}
          onClick={handleNewGame}
          type="button"
        >
          🔄 {t('common.newGame', 'New Game')}
        </button>
        {gameState === 'playing' && (
          <button
            className={`${styles.controlButton} ${styles.giveUp}`}
            onClick={handleGiveUp}
            type="button"
          >
            🏳️ {t('common.giveUp', 'Give Up')}
          </button>
        )}
      </div>

      {gameState === 'won' && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <h2>🎉 {t('common.youWon', 'You Won!')}</h2>
            <p>{t('spiderSolitaire.winDetail', 'Completed all runs in {{count}} moves.', { count: moves })}</p>
            <button
              className={styles.playAgain}
              onClick={handleNewGame}
              type="button"
            >
              {t('common.playAgain', 'Play Again')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
