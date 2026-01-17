import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './PyramidCards.module.css';

// Card values: A=1, 2-10, J=11, Q=12, K=13
const CARD_VALUES = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

// Suit code to symbol mapping
const SUIT_SYMBOLS = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
const SUIT_COLORS = {
  '♠': 'black',
  '♣': 'black',
  '♥': 'red',
  '♦': 'red'
};

// Parse card code (e.g., "AS" -> { rank: 'A', suit: '♠', value: 1 })
function parseCardCode(code) {
  const rank = code.slice(0, -1);
  const suitCode = code.slice(-1);
  return {
    rank,
    suit: SUIT_SYMBOLS[suitCode],
    value: CARD_VALUES[rank]
  };
}

// Build pyramid and draw pile from deck array
function buildFromDeck(deckCodes) {
  const deck = deckCodes.map((code, idx) => ({
    ...parseCardCode(code),
    code,
    id: idx,
    removed: false
  }));

  const pyramid = [];
  let cardIndex = 0;

  for (let row = 0; row < 7; row++) {
    pyramid[row] = [];
    for (let col = 0; col <= row; col++) {
      pyramid[row][col] = { ...deck[cardIndex++] };
    }
  }

  // Remaining 24 cards go to draw pile
  const drawPile = deck.slice(28).map(card => ({ ...card }));

  return { pyramid, drawPile };
}

// ============================================
// Legacy functions for testing compatibility
// ============================================
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seededShuffle(array, rng) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: CARD_VALUES[rank] });
    }
  }
  return deck;
}

function generatePyramid(seed) {
  const rng = createSeededRandom(seed);
  const deck = seededShuffle(createDeck(), rng);

  const pyramid = [];
  let cardIndex = 0;

  for (let row = 0; row < 7; row++) {
    pyramid[row] = [];
    for (let col = 0; col <= row; col++) {
      pyramid[row][col] = {
        ...deck[cardIndex],
        id: cardIndex,
        removed: false
      };
      cardIndex++;
    }
  }

  const drawPile = deck.slice(28).map((card, idx) => ({
    ...card,
    id: 28 + idx,
    removed: false
  }));

  return { pyramid, drawPile };
}

// Check if a card in the pyramid is exposed (no cards below it)
function isExposed(pyramid, row, col) {
  if (row === 6) return true; // Bottom row is always exposed

  const leftBelow = pyramid[row + 1]?.[col];
  const rightBelow = pyramid[row + 1]?.[col + 1];

  return (!leftBelow || leftBelow.removed) && (!rightBelow || rightBelow.removed);
}

// Get all currently exposed cards in pyramid
function getExposedCards(pyramid) {
  const exposed = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col <= row; col++) {
      const card = pyramid[row][col];
      if (!card.removed && isExposed(pyramid, row, col)) {
        exposed.push({ card, row, col });
      }
    }
  }
  return exposed;
}

// Check if pyramid is cleared
function isPyramidCleared(pyramid) {
  return pyramid.every(row => row.every(card => card.removed));
}

// ============================================
// SOLVER - Determines if a puzzle is solvable
// Uses efficient bit-based state representation
// ============================================

// Convert pyramid state to a 32-bit integer (28 cards = 28 bits)
function pyramidToBits(pyramid) {
  let bits = 0;
  let idx = 0;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col <= row; col++) {
      if (!pyramid[row][col].removed) {
        bits |= (1 << idx);
      }
      idx++;
    }
  }
  return bits;
}

// Convert draw pile state to bits
function drawPileToBits(drawPile) {
  let bits = 0;
  for (let i = 0; i < drawPile.length; i++) {
    if (!drawPile[i].removed) {
      bits |= (1 << i);
    }
  }
  return bits;
}

function clonePyramid(pyramid) {
  return pyramid.map(row => row.map(card => ({ ...card })));
}

// Optimized solver with iterative deepening and better pruning
function solvePyramid(pyramid, drawPile, wasteIndex = 0, memo = new Map(), depth = 0, maxDepth = 100) {
  // Depth limit to prevent infinite recursion
  if (depth > maxDepth) return false;

  // Create efficient state key
  const pyramidBits = pyramidToBits(pyramid);
  const drawBits = drawPileToBits(drawPile);
  const stateKey = `${pyramidBits}:${drawBits}:${wasteIndex}`;

  if (memo.has(stateKey)) return memo.get(stateKey);

  // Win condition - all pyramid cards removed
  if (pyramidBits === 0) {
    memo.set(stateKey, true);
    return true;
  }

  const exposed = getExposedCards(pyramid);

  // No exposed cards but pyramid not empty = stuck (shouldn't happen)
  if (exposed.length === 0) {
    memo.set(stateKey, false);
    return false;
  }

  // Prioritize removing cards (makes progress) over drawing

  // Try removing Kings (value 13) alone - always good
  for (const { card, row, col } of exposed) {
    if (card.value === 13) {
      const newPyramid = clonePyramid(pyramid);
      newPyramid[row][col].removed = true;
      if (solvePyramid(newPyramid, drawPile, wasteIndex, memo, depth + 1, maxDepth)) {
        memo.set(stateKey, true);
        return true;
      }
    }
  }

  // Try pairing exposed pyramid cards that sum to 13
  for (let i = 0; i < exposed.length; i++) {
    for (let j = i + 1; j < exposed.length; j++) {
      if (exposed[i].card.value + exposed[j].card.value === 13) {
        const newPyramid = clonePyramid(pyramid);
        newPyramid[exposed[i].row][exposed[i].col].removed = true;
        newPyramid[exposed[j].row][exposed[j].col].removed = true;
        if (solvePyramid(newPyramid, drawPile, wasteIndex, memo, depth + 1, maxDepth)) {
          memo.set(stateKey, true);
          return true;
        }
      }
    }
  }

  // Try pairing pyramid card with current waste card
  if (wasteIndex > 0 && wasteIndex <= drawPile.length) {
    const wasteCard = drawPile[wasteIndex - 1];
    if (!wasteCard.removed) {
      // King in waste
      if (wasteCard.value === 13) {
        const newDrawPile = drawPile.map(c => ({ ...c }));
        newDrawPile[wasteIndex - 1].removed = true;
        if (solvePyramid(pyramid, newDrawPile, wasteIndex, memo, depth + 1, maxDepth)) {
          memo.set(stateKey, true);
          return true;
        }
      }

      // Pair waste with pyramid
      for (const { card, row, col } of exposed) {
        if (card.value + wasteCard.value === 13) {
          const newPyramid = clonePyramid(pyramid);
          const newDrawPile = drawPile.map(c => ({ ...c }));
          newPyramid[row][col].removed = true;
          newDrawPile[wasteIndex - 1].removed = true;
          if (solvePyramid(newPyramid, newDrawPile, wasteIndex, memo, depth + 1, maxDepth)) {
            memo.set(stateKey, true);
            return true;
          }
        }
      }
    }
  }

  // Try drawing next card from pile (only if no better moves)
  if (wasteIndex < drawPile.length) {
    if (solvePyramid(pyramid, drawPile, wasteIndex + 1, memo, depth + 1, maxDepth)) {
      memo.set(stateKey, true);
      return true;
    }
  }

  memo.set(stateKey, false);
  return false;
}

// Check if a seed produces a solvable puzzle (for testing)
function isSolvable(seed) {
  const { pyramid, drawPile } = generatePyramid(seed);
  return solvePyramid(pyramid, drawPile, 0, new Map(), 0, 150);
}

// Find next solvable seed (for testing)
function findSolvableSeed(startSeed, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    const seed = startSeed + i;
    if (isSolvable(seed)) {
      return seed;
    }
  }
  return null;
}

// Export for testing
export {
  createDeck,
  generatePyramid,
  buildFromDeck,
  parseCardCode,
  isExposed,
  getExposedCards,
  isPyramidCleared,
  solvePyramid,
  isSolvable,
  findSolvableSeed,
  CARD_VALUES
};

export default function PyramidCards() {
  const boardRef = useRef(null);

  const [puzzles, setPuzzles] = useState([]);
  const [puzzleId, setPuzzleId] = useState(() => {
    const saved = localStorage.getItem('pyramid-cards-puzzle-id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [pyramid, setPyramid] = useState([]);
  const [drawPile, setDrawPile] = useState([]);
  const [wasteIndex, setWasteIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, won, lost
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [showGiveUp, setShowGiveUp] = useState(false);

  // Load puzzles dataset
  useEffect(() => {
    fetch('/datasets/pyramidCardsPuzzles.json')
      .then(res => res.json())
      .then(data => {
        setPuzzles(data.puzzles);
      })
      .catch(err => {
        console.error('Failed to load puzzles:', err);
        setMessage('Failed to load puzzles. Please refresh.');
        setGameState('lost');
      });
  }, []);

  // Initialize game with a puzzle from the dataset
  const initGame = useCallback((forceId = null) => {
    if (puzzles.length === 0) return;

    const id = forceId ?? Math.floor(Math.random() * puzzles.length) + 1;
    const puzzle = puzzles.find(p => p.id === id) || puzzles[Math.floor(Math.random() * puzzles.length)];

    if (!puzzle) {
      setMessage('No puzzles available.');
      setGameState('lost');
      return;
    }

    const { pyramid: newPyramid, drawPile: newDrawPile } = buildFromDeck(puzzle.deck);

    setPuzzleId(puzzle.id);
    setPyramid(newPyramid);
    setDrawPile(newDrawPile);
    setWasteIndex(0);
    setSelectedCard(null);
    setMoves(0);
    setGameState('playing');
    setMessage('');
    setHistory([]);
    setShowGiveUp(false);

    localStorage.setItem('pyramid-cards-puzzle-id', String(puzzle.id));
  }, [puzzles]);

  // Initialize when puzzles are loaded
  useEffect(() => {
    if (puzzles.length === 0) return;

    if (puzzleId !== null) {
      // Try to load saved puzzle
      const puzzle = puzzles.find(p => p.id === puzzleId);
      if (puzzle) {
        const { pyramid: newPyramid, drawPile: newDrawPile } = buildFromDeck(puzzle.deck);
        setPyramid(newPyramid);
        setDrawPile(newDrawPile);
        setWasteIndex(0);
        setGameState('playing');
      } else {
        initGame();
      }
    } else {
      initGame();
    }
  }, [puzzles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing' && isPyramidCleared(pyramid)) {
      setGameState('won');
      setMessage('Congratulations! You cleared the pyramid!');
    }
  }, [pyramid, gameState]);

  // Get current waste card
  const currentWasteCard = useMemo(() => {
    if (wasteIndex === 0) return null;
    // Find the topmost non-removed card in waste
    for (let i = wasteIndex - 1; i >= 0; i--) {
      if (!drawPile[i]?.removed) {
        return { card: drawPile[i], index: i };
      }
    }
    return null;
  }, [drawPile, wasteIndex]);

  // Draw next card from pile
  const drawCard = useCallback(() => {
    if (wasteIndex >= drawPile.length) {
      setMessage('No more cards to draw!');
      return;
    }

    // Save state for undo
    setHistory(prev => [...prev, {
      pyramid: pyramid.map(row => row.map(c => ({ ...c }))),
      drawPile: drawPile.map(c => ({ ...c })),
      wasteIndex,
      moves
    }]);

    setWasteIndex(prev => prev + 1);
    setSelectedCard(null);
    setMoves(prev => prev + 1);
    setMessage('');
  }, [wasteIndex, drawPile, pyramid, moves]);

  // Handle card selection
  const handleCardClick = useCallback((card, location) => {
    if (gameState !== 'playing') return;

    // Check if card is accessible
    if (location.type === 'pyramid') {
      if (!isExposed(pyramid, location.row, location.col)) {
        setMessage('This card is covered by other cards.');
        return;
      }
    }

    // If no card selected, select this one
    if (!selectedCard) {
      // Kings can be removed alone
      if (card.value === 13) {
        removeCards([{ card, location }]);
        return;
      }
      setSelectedCard({ card, location });
      setMessage(`Selected ${card.rank}${card.suit} (value ${card.value}). Pick a card that sums to 13.`);
      return;
    }

    // If same card clicked, deselect
    if (selectedCard.card.id === card.id) {
      setSelectedCard(null);
      setMessage('');
      return;
    }

    // Check if pair sums to 13
    if (selectedCard.card.value + card.value === 13) {
      removeCards([selectedCard, { card, location }]);
    } else {
      setMessage(`${selectedCard.card.rank} + ${card.rank} = ${selectedCard.card.value + card.value}. Need 13!`);
      setSelectedCard({ card, location });
    }
  }, [gameState, pyramid, selectedCard]);

  // Remove cards
  const removeCards = useCallback((cards) => {
    // Save state for undo
    setHistory(prev => [...prev, {
      pyramid: pyramid.map(row => row.map(c => ({ ...c }))),
      drawPile: drawPile.map(c => ({ ...c })),
      wasteIndex,
      moves
    }]);

    const newPyramid = pyramid.map(row => row.map(c => ({ ...c })));
    const newDrawPile = drawPile.map(c => ({ ...c }));

    for (const { card, location } of cards) {
      if (location.type === 'pyramid') {
        newPyramid[location.row][location.col].removed = true;
      } else if (location.type === 'waste') {
        newDrawPile[location.index].removed = true;
      }
    }

    setPyramid(newPyramid);
    setDrawPile(newDrawPile);
    setSelectedCard(null);
    setMoves(prev => prev + 1);
    setMessage('');
  }, [pyramid, drawPile, wasteIndex, moves]);

  // Undo last move
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setPyramid(lastState.pyramid);
    setDrawPile(lastState.drawPile);
    setWasteIndex(lastState.wasteIndex);
    setMoves(lastState.moves);
    setHistory(prev => prev.slice(0, -1));
    setSelectedCard(null);
    setMessage('');
  }, [history]);

  // New game
  const newGame = useCallback(() => {
    initGame();
  }, [initGame]);

  // Give up - show that it was solvable
  const giveUp = useCallback(() => {
    setShowGiveUp(true);
    setGameState('lost');
    setMessage('This puzzle was solvable! Try a new game.');
  }, []);

  // Count remaining cards
  const remainingPyramidCards = useMemo(() => {
    return pyramid.reduce((acc, row) =>
      acc + row.filter(c => !c.removed).length, 0
    );
  }, [pyramid]);

  const remainingDrawCards = useMemo(() => {
    return drawPile.length - wasteIndex + drawPile.slice(0, wasteIndex).filter(c => !c.removed).length;
  }, [drawPile, wasteIndex]);

  // Render a card
  const renderCard = (card, location, isSelected = false) => {
    if (!card || card.removed) return null;

    const colorClass = SUIT_COLORS[card.suit] === 'red' ? styles.red : styles.black;

    return (
      <button
        key={card.id}
        className={`${styles.card} ${colorClass} ${isSelected ? styles.selected : ''}`}
        onClick={() => handleCardClick(card, location)}
        disabled={gameState !== 'playing'}
      >
        <span className={styles.cardRank}>{card.rank}</span>
        <span className={styles.cardSuit}>{card.suit}</span>
      </button>
    );
  };

  if (gameState === 'loading') {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Pyramid Cards"
          instructions="Loading..."
        />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{message || 'Finding a solvable puzzle...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pyramid Cards"
        instructions="Remove pairs of cards that sum to 13. Kings (13) can be removed alone."
      />

      <div className={styles.gameInfo}>
        <span className={styles.seed}>Puzzle #{puzzleId}</span>
        <span className={styles.moves}>Moves: {moves}</span>
        <span className={styles.remaining}>Pyramid: {remainingPyramidCards}</span>
      </div>

      {message && (
        <div className={`${styles.message} ${gameState === 'won' ? styles.success : ''}`}>
          {message}
        </div>
      )}

      <div className={styles.gameArea} ref={boardRef}>
        {/* Pyramid */}
        <div className={styles.pyramid}>
          {pyramid.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.pyramidRow}>
              {row.map((card, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cardSlot} ${card.removed ? styles.empty : ''}`}
                >
                  {!card.removed && renderCard(
                    card,
                    { type: 'pyramid', row: rowIndex, col: colIndex },
                    selectedCard?.card.id === card.id
                  )}
                  {!card.removed && !isExposed(pyramid, rowIndex, colIndex) && (
                    <div className={styles.cardCover}></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Draw and Waste piles */}
        <div className={styles.piles}>
          <div className={styles.pileSection}>
            <span className={styles.pileLabel}>Draw ({drawPile.length - wasteIndex})</span>
            <button
              className={`${styles.pile} ${styles.drawPile} ${wasteIndex >= drawPile.length ? styles.empty : ''}`}
              onClick={drawCard}
              disabled={gameState !== 'playing' || wasteIndex >= drawPile.length}
            >
              {wasteIndex < drawPile.length ? (
                <span className={styles.cardBack}>🂠</span>
              ) : (
                <span className={styles.emptyPile}>∅</span>
              )}
            </button>
          </div>

          <div className={styles.pileSection}>
            <span className={styles.pileLabel}>Waste</span>
            <div className={`${styles.pile} ${styles.wastePile}`}>
              {currentWasteCard ? renderCard(
                currentWasteCard.card,
                { type: 'waste', index: currentWasteCard.index },
                selectedCard?.card.id === currentWasteCard.card.id
              ) : (
                <span className={styles.emptyPile}>∅</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card value reference */}
      <div className={styles.reference}>
        <span className={styles.refTitle}>Card Values:</span>
        <span>A=1, 2-10, J=11, Q=12, K=13</span>
        <span className={styles.refPairs}>Pairs: A+Q, 2+J, 3+10, 4+9, 5+8, 6+7</span>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={undo}
          disabled={history.length === 0 || gameState !== 'playing'}
        >
          ↩ Undo
        </button>
        <button
          className={styles.controlButton}
          onClick={newGame}
        >
          🔄 New Game
        </button>
        {gameState === 'playing' && (
          <button
            className={`${styles.controlButton} ${styles.giveUp}`}
            onClick={giveUp}
          >
            🏳 Give Up
          </button>
        )}
      </div>

      {gameState === 'won' && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <h2>🎉 You Won!</h2>
            <p>Cleared the pyramid in {moves} moves!</p>
            <button className={styles.playAgain} onClick={newGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
