import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { createSeededRandom, getTodayDateString, seededShuffleArray, stringToSeed } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './Freecell.module.css';

const CARD_VALUES = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

const SUIT_ORDER = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardColor = (suit) => (suit === '♥' || suit === '♦' ? 'red' : 'black');

function createDeck() {
  const deck = [];
  for (const suit of SUIT_ORDER) {
    for (const rank of RANKS) {
      deck.push({
        rank,
        suit,
        value: CARD_VALUES[rank],
        color: getCardColor(suit),
      });
    }
  }
  return deck;
}

function createEmptyFoundations() {
  return SUIT_ORDER.reduce((acc, suit) => {
    acc[suit] = [];
    return acc;
  }, {});
}

function dealFreecell(seed) {
  const rng = createSeededRandom(seed);
  const shuffled = seededShuffleArray(createDeck(), rng).map((card, idx) => ({
    ...card,
    id: idx,
  }));

  const tableau = Array.from({ length: 8 }, () => []);
  let deckIndex = 0;
  for (let column = 0; column < 8; column++) {
    const cardsInColumn = column < 4 ? 7 : 6;
    for (let i = 0; i < cardsInColumn; i++) {
      tableau[column].push(shuffled[deckIndex++]);
    }
  }

  return {
    tableau,
    freeCells: Array(4).fill(null),
    foundations: createEmptyFoundations(),
  };
}

function isOppositeColor(cardA, cardB) {
  return cardA.color !== cardB.color;
}

function canPlaceOnTableau(card, destinationTop) {
  if (!destinationTop) return true;
  return isOppositeColor(card, destinationTop) && card.value === destinationTop.value - 1;
}

function canPlaceOnFoundation(card, foundationStack) {
  if (!foundationStack.length) {
    return card.value === 1;
  }
  const top = foundationStack[foundationStack.length - 1];
  return top.suit === card.suit && card.value === top.value + 1;
}

function getMovableSequence(column, startIndex) {
  const sequence = column.slice(startIndex);
  if (!sequence.length) return null;

  for (let i = 0; i < sequence.length - 1; i++) {
    const current = sequence[i];
    const next = sequence[i + 1];
    if (!isOppositeColor(current, next) || current.value !== next.value + 1) {
      return null;
    }
  }

  return sequence;
}

function getMaxMovableCards(freeCellsEmpty, emptyTableauCount) {
  return (freeCellsEmpty + 1) * Math.pow(2, emptyTableauCount);
}

function createSolvedFoundations() {
  return SUIT_ORDER.reduce((acc, suit) => {
    acc[suit] = RANKS.map(rank => ({
      rank,
      suit,
      value: CARD_VALUES[rank],
      color: getCardColor(suit),
      id: `${rank}-${suit}`,
    }));
    return acc;
  }, {});
}

export {
  CARD_VALUES,
  SUIT_ORDER,
  createDeck,
  dealFreecell,
  createEmptyFoundations,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  getMovableSequence,
  getMaxMovableCards,
};

export default function Freecell() {
  const { t } = useTranslation();
  const getDefaultSeed = () => stringToSeed(`freecell-${getTodayDateString()}`);
  const [seed, setSeed] = usePersistedState('freecell-seed', getDefaultSeed());
  const [tableau, setTableau] = useState([]);
  const [freeCells, setFreeCells] = useState([]);
  const [foundations, setFoundations] = useState(createEmptyFoundations());
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState('ready');
  const [selected, setSelected] = useState(null);

  const initGame = useCallback((newSeed = null) => {
    const gameSeed = newSeed ?? seed;
    const deal = dealFreecell(gameSeed);
    setTableau(deal.tableau);
    setFreeCells(deal.freeCells);
    setFoundations(deal.foundations);
    setMoves(0);
    setMessage('');
    setSelected(null);
    setGameState('playing');
    setSeed(gameSeed);
  }, [seed, setSeed]);

  useEffect(() => {
    initGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const freeCellsEmpty = useMemo(() => freeCells.filter(cell => !cell).length, [freeCells]);
  const emptyTableauCount = useMemo(() => tableau.filter(column => column.length === 0).length, [tableau]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const allComplete = SUIT_ORDER.every(suit => foundations[suit]?.length === 13);
    if (allComplete) {
      setGameState('won');
      setMessage(t('freecell.win'));
    }
  }, [foundations, gameState, t]);

  const clearSelection = () => setSelected(null);

  const selectTableauCard = (columnIndex, cardIndex) => {
    if (gameState !== 'playing') return;
    const column = tableau[columnIndex];
    const sequence = getMovableSequence(column, cardIndex);
    if (!sequence) {
      setMessage(t('freecell.invalidSequence'));
      return;
    }
    setMessage('');
    setSelected({
      source: 'tableau',
      columnIndex,
      cardIndex,
      cards: sequence,
    });
  };

  const selectFreeCellCard = (cellIndex) => {
    if (gameState !== 'playing') return;
    const card = freeCells[cellIndex];
    if (!card) return;
    setMessage('');
    setSelected({
      source: 'freecell',
      cellIndex,
      cardIndex: 0,
      cards: [card],
    });
  };

  const moveSelectionToTableau = (destinationIndex) => {
    if (!selected) return;
    const sequence = selected.cards;
    const destinationColumn = tableau[destinationIndex];
    const destinationTop = destinationColumn[destinationColumn.length - 1];
    if (!canPlaceOnTableau(sequence[0], destinationTop)) {
      setMessage(t('freecell.invalidMove'));
      return;
    }

    const isDestinationEmpty = destinationColumn.length === 0;
    const availableEmptyColumns = isDestinationEmpty ? emptyTableauCount - 1 : emptyTableauCount;
    const maxMovable = getMaxMovableCards(freeCellsEmpty, Math.max(availableEmptyColumns, 0));

    if (sequence.length > maxMovable) {
      setMessage(t('freecell.sequenceTooLarge', { count: maxMovable }));
      return;
    }

    const newTableau = tableau.map(column => [...column]);
    if (selected.source === 'tableau') {
      newTableau[selected.columnIndex] = newTableau[selected.columnIndex].slice(0, selected.cardIndex);
    }
    if (selected.source === 'freecell') {
      const newFreeCells = [...freeCells];
      newFreeCells[selected.cellIndex] = null;
      setFreeCells(newFreeCells);
    }

    newTableau[destinationIndex] = [...newTableau[destinationIndex], ...sequence];
    setTableau(newTableau);
    setMoves(prev => prev + 1);
    clearSelection();
    setMessage('');
  };

  const moveSelectionToFreeCell = (cellIndex) => {
    if (!selected) return;
    if (freeCells[cellIndex]) return;
    if (selected.cards.length !== 1) {
      setMessage(t('freecell.singleCardOnly'));
      return;
    }

    const card = selected.cards[0];
    const newFreeCells = [...freeCells];
    newFreeCells[cellIndex] = card;

    if (selected.source === 'tableau') {
      const newTableau = tableau.map(column => [...column]);
      newTableau[selected.columnIndex] = newTableau[selected.columnIndex].slice(0, selected.cardIndex);
      setTableau(newTableau);
    }

    if (selected.source === 'freecell') {
      newFreeCells[selected.cellIndex] = null;
    }

    setFreeCells(newFreeCells);
    setMoves(prev => prev + 1);
    clearSelection();
    setMessage('');
  };

  const moveSelectionToFoundation = (suit) => {
    if (!selected) return;
    if (selected.cards.length !== 1) {
      setMessage(t('freecell.singleCardOnly'));
      return;
    }
    const card = selected.cards[0];
    if (!canPlaceOnFoundation(card, foundations[suit])) {
      setMessage(t('freecell.invalidFoundationMove'));
      return;
    }

    const newFoundations = { ...foundations };
    newFoundations[suit] = [...newFoundations[suit], card];
    setFoundations(newFoundations);

    if (selected.source === 'tableau') {
      const newTableau = tableau.map(column => [...column]);
      newTableau[selected.columnIndex] = newTableau[selected.columnIndex].slice(0, selected.cardIndex);
      setTableau(newTableau);
    }

    if (selected.source === 'freecell') {
      const newFreeCells = [...freeCells];
      newFreeCells[selected.cellIndex] = null;
      setFreeCells(newFreeCells);
    }

    setMoves(prev => prev + 1);
    clearSelection();
    setMessage('');
  };

  const handleFreeCellClick = (cellIndex) => {
    if (gameState !== 'playing') return;
    if (selected && selected.source === 'freecell' && selected.cellIndex === cellIndex) {
      clearSelection();
      return;
    }
    if (selected) {
      moveSelectionToFreeCell(cellIndex);
      return;
    }
    selectFreeCellCard(cellIndex);
  };

  const handleFoundationClick = (suit) => {
    if (gameState !== 'playing') return;
    if (selected) {
      moveSelectionToFoundation(suit);
    }
  };

  const handleTableauCardClick = (columnIndex, cardIndex) => {
    if (gameState !== 'playing') return;
    if (selected && selected.source === 'tableau' && selected.columnIndex === columnIndex && selected.cardIndex === cardIndex) {
      clearSelection();
      return;
    }
    selectTableauCard(columnIndex, cardIndex);
  };

  const handleTableauColumnClick = (columnIndex) => {
    if (gameState !== 'playing') return;
    if (!selected) return;
    moveSelectionToTableau(columnIndex);
  };

  const newGame = useCallback(() => {
    const random = createSeededRandom(Date.now());
    const newSeed = stringToSeed(`freecell-${Date.now()}-${random()}`);
    initGame(newSeed);
  }, [initGame]);

  const giveUp = useCallback(() => {
    setGameState('revealed');
    setFoundations(createSolvedFoundations());
    setTableau(Array.from({ length: 8 }, () => []));
    setFreeCells(Array(4).fill(null));
    setSelected(null);
    setMessage(t('freecell.solutionRevealed'));
  }, [t]);

  const renderCard = (card, isSelected) => (
    <div
      className={`${styles.card} ${card.color === 'red' ? styles.red : styles.black} ${isSelected ? styles.selected : ''}`}
    >
      <span className={styles.cardRank}>{card.rank}</span>
      <span className={styles.cardSuit}>{card.suit}</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('freecell.title')}
        instructions={t('freecell.instructions')}
      />

      {seed !== null && (
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
      )}

      <div className={styles.statusRow}>
        <span>{t('gameStatus.moves')}: {moves}</span>
        {selected && (
          <span className={styles.selectedHint}>{t('freecell.selectedCount', { count: selected.cards.length })}</span>
        )}
      </div>

      {message && (
        <div className={`${styles.message} ${gameState === 'won' ? styles.success : ''}`}>
          {message}
        </div>
      )}

      <div className={styles.topRow}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('freecell.freeCells')}</div>
          <div className={styles.pileRow}>
            {freeCells.map((cell, index) => (
              <button
                key={`freecell-${index}`}
                type="button"
                className={`${styles.pile} ${styles.freeCell} ${cell ? styles.filled : ''}`}
                onClick={() => handleFreeCellClick(index)}
              >
                {cell ? renderCard(cell, selected?.source === 'freecell' && selected.cellIndex === index) : <span className={styles.empty}>∅</span>}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('freecell.foundations')}</div>
          <div className={styles.pileRow}>
            {SUIT_ORDER.map((suit) => {
              const stack = foundations[suit] || [];
              const topCard = stack[stack.length - 1];
              return (
                <button
                  key={`foundation-${suit}`}
                  type="button"
                  className={`${styles.pile} ${styles.foundation}`}
                  onClick={() => handleFoundationClick(suit)}
                >
                  {topCard ? renderCard(topCard, false) : <span className={styles.foundationSuit}>{suit}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.tableau}>
        {tableau.map((column, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className={styles.column}
          >
            {column.length === 0 && (
              <button
                type="button"
                className={`${styles.pile} ${styles.emptyColumn}`}
                onClick={() => handleTableauColumnClick(columnIndex)}
              >
                <span className={styles.empty}>∅</span>
              </button>
            )}
            {column.map((card, cardIndex) => {
              const isSelected = selected?.source === 'tableau'
                && selected.columnIndex === columnIndex
                && cardIndex >= selected.cardIndex;
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`${styles.cardWrapper} ${isSelected ? styles.selectedCard : ''}`}
                  onClick={() => handleTableauCardClick(columnIndex, cardIndex)}
                >
                  {renderCard(card, isSelected)}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button className={styles.controlButton} onClick={newGame} type="button">
          🔄 {t('common.newGame')}
        </button>
        {gameState === 'playing' && (
          <button className={`${styles.controlButton} ${styles.giveUp}`} onClick={giveUp} type="button">
            🏳 {t('common.giveUp')}
          </button>
        )}
      </div>

      {gameState === 'won' && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <h2>{t('freecell.winTitle')}</h2>
            <p>{t('freecell.winMessage', { moves })}</p>
            <button className={styles.playAgain} onClick={newGame} type="button">
              {t('common.playAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
