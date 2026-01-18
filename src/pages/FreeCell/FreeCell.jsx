import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import SeedDisplay from '../../components/SeedDisplay';
import styles from './FreeCell.module.css';

// Card values: A=1, 2-10, J=11, Q=12, K=13
const CARD_VALUES = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13
};

const CARD_RANKS = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: 'T', 11: 'J', 12: 'Q', 13: 'K'
};

// Suit code to symbol mapping
const SUIT_SYMBOLS = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
const SUIT_COLORS = {
  'S': 'black',
  'C': 'black',
  'H': 'red',
  'D': 'red'
};

// Parse card code (e.g., "AH" -> { rank: 'A', suit: '♠', suitCode: 'H', value: 1 })
function parseCardCode(code) {
  const match = code.match(/^([0-9ATJQK]+)([SHDC])$/);
  if (!match) return null;
  const [, rank, suitCode] = match;
  return {
    rank,
    suit: SUIT_SYMBOLS[suitCode],
    suitCode,
    value: CARD_VALUES[rank] || parseInt(rank),
    code
  };
}

// Load puzzle from dataset
async function loadPuzzle(seed) {
  try {
    const response = await fetch('/datasets/freecellPuzzles.json');
    if (!response.ok) throw new Error(`Failed to load FreeCell puzzles: ${response.status}`);
    const data = await response.json();
    const puzzles = data.puzzles || [];
    
    if (puzzles.length === 0) return null;
    
    // Use seed to select puzzle
    const random = createSeededRandom(seed);
    const puzzleIndex = Math.floor(random() * puzzles.length);
    return puzzles[puzzleIndex];
  } catch (err) {
    console.error('Failed to load FreeCell puzzles:', err);
    return null;
  }
}

// Convert puzzle data to game state
function puzzleToGameState(puzzle) {
  const columns = puzzle.columns.map(col => 
    col.map(cardCode => parseCardCode(cardCode)).filter(card => card)
  );
  
  return {
    columns,
    freecells: Array(4).fill(null),
    foundations: {
      'H': [],
      'D': [],
      'C': [],
      'S': []
    }
  };
}

// Check if cards can be placed on a foundation (same suit, ascending)
function canPlaceOnFoundation(card, foundation) {
  if (foundation.length === 0) {
    return card.value === 1; // Only Ace can start
  }
  const topCard = foundation[foundation.length - 1];
  return card.suitCode === topCard.suitCode && card.value === topCard.value + 1;
}

// Check if a card can be placed on another card in a column (alternating colors, descending)
function canPlaceOnColumn(card, targetCard) {
  if (!targetCard) return true; // Can place on empty column
  const color1 = SUIT_COLORS[card.suitCode];
  const color2 = SUIT_COLORS[targetCard.suitCode];
  return color1 !== color2 && card.value === targetCard.value - 1;
}

// Check if a sequence of cards can be moved together
function canMoveSequence(cards, targetCard) {
  if (cards.length === 0) return false;
  if (cards.length === 1) return canPlaceOnColumn(cards[0], targetCard);
  
  // For multiple cards, they must form a valid sequence
  for (let i = 1; i < cards.length; i++) {
    if (!canPlaceOnColumn(cards[i], cards[i - 1])) {
      return false;
    }
  }
  
  // First card of sequence must be placeable on target
  return canPlaceOnColumn(cards[0], targetCard);
}

// Calculate maximum sequence that can be moved based on free cells
function getMaxMovableSequence(columnIndex, cardIndex, freeCellCount, columns) {
  const column = columns[columnIndex];
  const availableSpaces = freeCellCount + 1; // free cells + empty columns count
  
  // Can move up to (availableSpaces + 1) cards
  const maxMove = availableSpaces + 1;
  const sequenceLength = column.length - cardIndex;
  
  return Math.min(sequenceLength, maxMove);
}

// Check if game is won (all cards in foundations)
function checkWin(foundations) {
  let totalCards = 0;
  for (const suit in foundations) {
    totalCards += foundations[suit].length;
  }
  return totalCards === 52;
}

export default function FreeCell() {
  const [gameState, setGameState] = useState('loading');
  const [puzzle, setPuzzle] = useState(null);
  const [state, setState] = useState(null);
  const [seed, setSeed] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [moves, setMoves] = useState(0);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('freecell-stats');
    return saved ? JSON.parse(saved) : { played: 0, won: 0 };
  });

  useEffect(() => {
    localStorage.setItem('freecell-stats', JSON.stringify(stats));
  }, [stats]);

  const initGame = useCallback(async () => {
    const today = getTodayDateString();
    const gameSeed = stringToSeed(today);
    setSeed(gameSeed);
    
    const puzzleData = await loadPuzzle(gameSeed);
    if (!puzzleData) {
      setGameState('error');
      return;
    }
    
    setPuzzle(puzzleData);
    const initialState = puzzleToGameState(puzzleData);
    setState(initialState);
    setSelectedCard(null);
    setMoves(0);
    setGameState('playing');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (state && gameState === 'playing') {
      if (checkWin(state.foundations)) {
        setGameState('won');
        setStats(prev => ({ ...prev, played: prev.played + 1, won: prev.won + 1 }));
      }
    }
  }, [state, gameState]);

  const handleCardClick = (source, index, cardIndex = null) => {
    if (gameState !== 'playing') return;
    
    if (selectedCard) {
      // Try to move
      handleMove(selectedCard, source, index);
      setSelectedCard(null);
    } else {
      // Select card
      if (source === 'column') {
        const column = state.columns[index];
        if (column.length > 0) {
          // If cardIndex provided, use it; otherwise select top card
          const targetIndex = cardIndex !== null ? cardIndex : column.length - 1;
          setSelectedCard({ source: 'column', index, cardIndex: targetIndex });
        }
      } else if (source === 'freecell') {
        if (state.freecells[index]) {
          setSelectedCard({ source: 'freecell', index });
        }
      }
    }
  };

  const handleMove = (from, toSource, toIndex) => {
    if (!from || !state) return;
    
    let fromCard = null;
    let newState = JSON.parse(JSON.stringify(state));
    
    // Get card(s) to move
    if (from.source === 'column') {
      const column = newState.columns[from.index];
      const cardIndex = from.cardIndex;
      const freeCellCount = newState.freecells.filter(c => c !== null).length;
      const emptyColumns = newState.columns.filter(col => col.length === 0).length;
      const maxMove = getMaxMovableSequence(from.index, cardIndex, freeCellCount, newState.columns);
      
      fromCard = column.slice(cardIndex, cardIndex + maxMove);
      newState.columns[from.index] = column.slice(0, cardIndex);
    } else if (from.source === 'freecell') {
      fromCard = [newState.freecells[from.index]];
      newState.freecells[from.index] = null;
    }
    
    if (!fromCard || fromCard.length === 0) return;
    
    // Try to place
    if (toSource === 'column') {
      const targetColumn = newState.columns[toIndex];
      const targetCard = targetColumn.length > 0 ? targetColumn[targetColumn.length - 1] : null;
      
      if (canMoveSequence(fromCard, targetCard)) {
        newState.columns[toIndex] = [...targetColumn, ...fromCard];
        setState(newState);
        setMoves(prev => prev + 1);
      }
    } else if (toSource === 'freecell') {
      if (fromCard.length === 1 && !newState.freecells[toIndex]) {
        newState.freecells[toIndex] = fromCard[0];
        setState(newState);
        setMoves(prev => prev + 1);
      }
    } else if (toSource === 'foundation') {
      if (fromCard.length === 1) {
        const suit = toIndex; // 'H', 'D', 'C', 'S'
        if (canPlaceOnFoundation(fromCard[0], newState.foundations[suit])) {
          newState.foundations[suit] = [...newState.foundations[suit], fromCard[0]];
          setState(newState);
          setMoves(prev => prev + 1);
        }
      }
    }
  };

  const handleFoundationClick = (suit) => {
    if (gameState !== 'playing' || !selectedCard) return;
    handleMove(selectedCard, 'foundation', suit);
    setSelectedCard(null);
  };

  const renderCard = (card, index = 0) => {
    if (!card) return null;
    const color = SUIT_COLORS[card.suitCode];
    return (
      <div
        key={index}
        className={`${styles.card} ${styles[color]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.suit}>{card.suit}</span>
      </div>
    );
  };

  if (gameState === 'loading') {
    return <div className={styles.container}>Loading...</div>;
  }

  if (gameState === 'error') {
    return (
      <div className={styles.container}>
        <p>Failed to load FreeCell puzzle</p>
        <button onClick={initGame}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back</Link>
        <h1>FreeCell</h1>
        {seed && <SeedDisplay seed={seed} />}
      </div>

      <div className={styles.gameInfo}>
        <div>Moves: {moves}</div>
        <div>Games Played: {stats.played}</div>
        <div>Games Won: {stats.won}</div>
        {gameState === 'won' && <div className={styles.won}>You Won! 🎉</div>}
      </div>

      <div className={styles.gameBoard}>
        {/* Foundations */}
        <div className={styles.foundations}>
          {['H', 'D', 'C', 'S'].map((suit) => (
            <div
              key={suit}
              className={`${styles.foundation} ${selectedCard ? styles.selectable : ''}`}
              onClick={() => handleFoundationClick(suit)}
            >
              {state.foundations[suit].length > 0 ? (
                renderCard(state.foundations[suit][state.foundations[suit].length - 1])
              ) : (
                <div className={styles.emptyFoundation}>{SUIT_SYMBOLS[suit]}</div>
              )}
            </div>
          ))}
        </div>

        {/* Free Cells */}
        <div className={styles.freecells}>
          {state.freecells.map((cell, index) => (
            <div
              key={index}
              className={`${styles.freecell} ${selectedCard && !cell ? styles.selectable : ''}`}
              onClick={() => handleCardClick('freecell', index)}
            >
              {cell ? renderCard(cell) : <div className={styles.emptyCell} />}
            </div>
          ))}
        </div>

        {/* Columns */}
        <div className={styles.columns}>
          {state.columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className={styles.column}
              onClick={() => handleCardClick('column', colIndex)}
            >
              {column.length === 0 ? (
                <div className={styles.emptyColumn} />
              ) : (
                column.map((card, cardIndex) => {
                  const isSelected = selectedCard &&
                    selectedCard.source === 'column' &&
                    selectedCard.index === colIndex &&
                    selectedCard.cardIndex === cardIndex;
                  
                  const isTopCard = cardIndex === column.length - 1;
                  const isInSelectedSequence = selectedCard &&
                    selectedCard.source === 'column' &&
                    selectedCard.index === colIndex &&
                    cardIndex >= selectedCard.cardIndex;
                  
                  return (
                    <div
                      key={cardIndex}
                      className={`${styles.cardContainer} ${isSelected ? styles.selected : ''} ${isInSelectedSequence ? styles.inSequence : ''} ${isTopCard ? styles.topCard : ''}`}
                      style={{ top: `${cardIndex * 30}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick('column', colIndex, cardIndex);
                      }}
                    >
                      {renderCard(card, cardIndex)}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <button onClick={initGame}>New Game</button>
        {gameState === 'won' && (
          <button onClick={() => setStats(prev => ({ ...prev, played: prev.played + 1 }))}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
