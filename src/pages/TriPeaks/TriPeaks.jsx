import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import { getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import SeedDisplay from '../../components/SeedDisplay';
import styles from './TriPeaks.module.css';

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

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

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

// Create seeded random number generator
function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Seeded shuffle
function seededShuffle(array, rng) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create a standard 52-card deck
function createDeck() {
  const deck = [];
  for (const suitCode of Object.keys(SUIT_SYMBOLS)) {
    for (const rank of RANKS) {
      deck.push({ rank, suit: SUIT_SYMBOLS[suitCode], suitCode, value: CARD_VALUES[rank] });
    }
  }
  return deck;
}

// Check if two card values are adjacent (wrapping: A-2-K-Q-J-10-9-8-7-6-5-4-3-2-A)
function isAdjacent(value1, value2) {
  // Values are adjacent if they differ by 1, or if one is 1 and the other is 13, or vice versa
  const diff = Math.abs(value1 - value2);
  return diff === 1 || diff === 12;
}

// Generate Tri-Peaks layout from a seed
// Layout: 3 peaks, each with 4 rows (1+2+3+4 = 10 cards per peak)
// 3 peaks × 10 = 30 cards total (22 cards left for draw pile)
function generateTriPeaks(seed) {
  const rng = createSeededRandom(seed);
  const deck = seededShuffle(createDeck(), rng);

  const peaks = [];
  let cardIndex = 0;

  // Create 3 peaks
  for (let peak = 0; peak < 3; peak++) {
    peaks[peak] = [];
    for (let row = 0; row < 4; row++) {
      peaks[peak][row] = [];
      for (let col = 0; col <= row; col++) {
        const card = { ...deck[cardIndex++], id: peak * 10 + row * 4 + col, removed: false };
        // Bottom row (row 3) is face-up, others are face-down initially
        card.faceUp = row === 3;
        peaks[peak][row][col] = card;
      }
    }
  }

  // Remaining 22 cards go to draw pile
  const drawPile = deck.slice(30).map((card, idx) => ({
    ...card,
    id: 30 + idx,
    removed: false
  }));

  return { peaks, drawPile };
}

// Check if a card in a peak is exposed (face-up and available to remove)
// A card is exposed if it's face-up AND both cards below it (its children) are removed
function isExposed(peaks, peakIndex, row, col) {
  const card = peaks[peakIndex][row]?.[col];
  if (!card || card.removed || !card.faceUp) return false;

  // If it's the bottom row, it's exposed if face-up
  if (row === 3) return true;

  // Check if both children below are removed
  // A card at [row][col] has children at [row+1][col] (left) and [row+1][col+1] (right)
  const childLeft = peaks[peakIndex][row + 1]?.[col];
  const childRight = peaks[peakIndex][row + 1]?.[col + 1];

  // Both children must be removed (or not exist)
  return (!childLeft || childLeft.removed) && (!childRight || childRight.removed);
}

// Get all currently exposed cards in all peaks
function getExposedCards(peaks) {
  const exposed = [];
  for (let peak = 0; peak < 3; peak++) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col <= row; col++) {
        if (isExposed(peaks, peak, row, col)) {
          exposed.push({ card: peaks[peak][row][col], peak, row, col });
        }
      }
    }
  }
  return exposed;
}

// When a card is removed, reveal cards above it
// A parent card is revealed if both of its children are removed
function revealCardAbove(peaks, peakIndex, row, col) {
  if (row === 0) return; // Top row has nothing above

  // The parents of card at [row][col] are:
  // - Left parent at [row-1][col-1] (if col > 0)
  // - Right parent at [row-1][col] (if col < row-1 length, i.e., col <= row-1)

  // Check left parent at [row-1][col-1]
  // Its children are [row][col-1] (left) and [row][col] (right)
  if (col > 0 && row - 1 >= 0) {
    const aboveLeft = peaks[peakIndex][row - 1][col - 1];
    if (!aboveLeft.removed) {
      const childLeft = peaks[peakIndex][row][col - 1];
      const childRight = peaks[peakIndex][row][col];
      // Both children must be removed to reveal parent
      if (childLeft && childLeft.removed && childRight && childRight.removed) {
        aboveLeft.faceUp = true;
      }
    }
  }

  // Check right parent at [row-1][col]
  // Its children are [row][col] (left) and [row][col+1] (right)
  if (col <= row - 1 && row - 1 >= 0) {
    const aboveRight = peaks[peakIndex][row - 1][col];
    if (!aboveRight.removed) {
      const childLeft = peaks[peakIndex][row][col];
      const childRight = peaks[peakIndex][row][col + 1];
      // Both children must be removed to reveal parent
      if (childLeft && childLeft.removed && childRight && childRight.removed) {
        aboveRight.faceUp = true;
      }
    }
  }
}

// Check if all peaks are cleared
function areAllPeaksCleared(peaks) {
  return peaks.every(peak =>
    peak.every(row => row.every(card => card.removed))
  );
}

// Export for testing
export {
  createDeck,
  generateTriPeaks,
  parseCardCode,
  isExposed,
  getExposedCards,
  isAdjacent,
  areAllPeaksCleared,
  CARD_VALUES
};

export default function TriPeaks() {
  const { t } = useTranslation();
  const [peaks, setPeaks] = useState([]);
  const [drawPile, setDrawPile] = useState([]);
  const [wastePile, setWastePile] = useState([]);
  const getDefaultSeed = () => stringToSeed(`tri-peaks-${getTodayDateString()}`);
  const [seed, setSeed] = usePersistedState('tri-peaks-seed', getDefaultSeed());
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('ready'); // ready, playing, won, lost
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  // Initialize game
  const initGame = useCallback((newSeed = null) => {
    const gameSeed = newSeed ?? seed;
    const { peaks: newPeaks, drawPile: newDrawPile } = generateTriPeaks(gameSeed);

    setPeaks(newPeaks);
    setDrawPile(newDrawPile);
    setWastePile([]);
    setMoves(0);
    setGameState('playing');
    setMessage('');
    setHistory([]);
    setSeed(gameSeed);
  }, [seed]);

  useEffect(() => {
    initGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing' && areAllPeaksCleared(peaks)) {
      setGameState('won');
      setMessage('Congratulations! You cleared all three peaks!');
    }
  }, [peaks, gameState]);

  // Get current waste card (top of waste pile)
  const currentWasteCard = useMemo(() => {
    if (wastePile.length === 0) return null;
    return wastePile[wastePile.length - 1];
  }, [wastePile]);

  // Draw next card from pile - adds to waste pile
  const drawCard = useCallback(() => {
    if (drawPile.length === 0) {
      setMessage('No more cards to draw!');
      return;
    }

    // Save state for undo
    setHistory(prev => [...prev, {
      peaks: peaks.map(p => p.map(r => r.map(c => ({ ...c })))),
      drawPile: [...drawPile],
      wastePile: [...wastePile],
      moves
    }]);

    const newDrawPile = [...drawPile];
    const drawnCard = newDrawPile.shift(); // Take first card from draw pile
    setDrawPile(newDrawPile);
    // Card is face-up when added to waste pile
    setWastePile(prev => [...prev, { ...drawnCard, faceUp: true }]); // Add to top of waste pile
    setMoves(prev => prev + 1);
    setMessage('');
  }, [drawPile, peaks, wastePile, moves]);

  // Handle card click - remove card from peak if it's adjacent to waste card
  const handleCardClick = useCallback((card, location) => {
    if (gameState !== 'playing') return;
    if (!currentWasteCard) {
      setMessage('Draw a card from the deck first!');
      return;
    }

    // Check if card is exposed
    if (!isExposed(peaks, location.peak, location.row, location.col)) {
      setMessage('This card is not available yet.');
      return;
    }

    // Check if card is adjacent to waste card
    if (!isAdjacent(card.value, currentWasteCard.value)) {
      setMessage(`${card.rank}${card.suit} is not adjacent to ${currentWasteCard.rank}${currentWasteCard.suit}.`);
      return;
    }

    // Remove the card (it goes on top of waste pile)
    removeCard(card, location);
  }, [gameState, peaks, currentWasteCard]);

  // Remove a card from a peak - it goes on top of waste pile
  const removeCard = useCallback((card, location) => {
    // Save state for undo
    setHistory(prev => [...prev, {
      peaks: peaks.map(p => p.map(r => r.map(c => ({ ...c })))),
      drawPile: [...drawPile],
      wastePile: [...wastePile],
      moves
    }]);

    const newPeaks = peaks.map(p => p.map(r => r.map(c => ({ ...c }))));

    // Remove the card from peak
    newPeaks[location.peak][location.row][location.col].removed = true;

    // Add removed card to top of waste pile (face-up)
    const removedCard = { ...card, removed: false, faceUp: true }; // Card on waste pile is face-up
    setWastePile(prev => [...prev, removedCard]);

    // Reveal cards above
    revealCardAbove(newPeaks, location.peak, location.row, location.col);

    setPeaks(newPeaks);
    setMoves(prev => prev + 1);
    setMessage('');
  }, [peaks, drawPile, wastePile, moves]);

  // Undo last move
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setPeaks(lastState.peaks);
    setDrawPile(lastState.drawPile);
    setWastePile(lastState.wastePile);
    setMoves(lastState.moves);
    setHistory(prev => prev.slice(0, -1));
    setMessage('');
  }, [history]);

  // New game
  const newGame = useCallback(() => {
    // Generate a truly random seed for a new puzzle
    const newSeed = stringToSeed(`tri-peaks-${Date.now()}-${Math.random()}`);
    initGame(newSeed);
  }, [initGame]);

  // Give up
  const giveUp = useCallback(() => {
    setGameState('lost');
    setMessage('Game over. Try a new game!');
  }, []);

  // Count remaining cards
  const remainingPeakCards = useMemo(() => {
    return peaks.reduce((acc, peak) =>
      acc + peak.reduce((sum, row) =>
        sum + row.filter(c => !c.removed).length, 0
      ), 0
    );
  }, [peaks]);

  const remainingDrawCards = useMemo(() => {
    return drawPile.length;
  }, [drawPile]);

  // Render a card
  const renderCard = (card, location, isSelected = false) => {
    if (!card || card.removed) return null;

    const colorClass = SUIT_COLORS[card.suit] === 'red' ? styles.red : styles.black;

    return (
      <button
        key={card.id}
        className={`${styles.card} ${colorClass} ${card.faceUp ? styles.faceUp : styles.faceDown} ${isSelected ? styles.selected : ''}`}
        onClick={() => card.faceUp && handleCardClick(card, location)}
        disabled={gameState !== 'playing' || !card.faceUp}
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

  return (
    <div className={styles.container}>
      <GameHeader
        title="Tri-Peaks"
        instructions="Remove cards from the peaks that are one rank higher or lower than the waste card. Clear all three peaks to win!"
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            // Convert string seeds to numbers if needed
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
              : newSeed;
            initGame(seedNum);
          }}
        />
      )}

      <div className={styles.gameInfo}>
        <span className={styles.moves}>Moves: {moves}</span>
        <span className={styles.remaining}>{t('common.remaining')}: {remainingPeakCards}</span>
      </div>

      {message && (
        <div className={`${styles.message} ${gameState === 'won' ? styles.success : ''}`}>
          {message}
        </div>
      )}

      <div className={styles.gameArea}>
        {/* Three Peaks */}
        <div className={styles.peaks}>
          {peaks.map((peak, peakIndex) => (
            <div key={peakIndex} className={styles.peak}>
              {peak.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.peakRow}>
                  {row.map((card, colIndex) => (
                    <div
                      key={`${peakIndex}-${rowIndex}-${colIndex}`}
                      className={`${styles.cardSlot} ${card.removed ? styles.empty : ''}`}
                    >
                      {!card.removed && renderCard(
                        card,
                        { peak: peakIndex, row: rowIndex, col: colIndex }
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Draw and Waste piles */}
        <div className={styles.piles}>
          <div className={styles.pileSection}>
            <span className={styles.pileLabel}>{t('common.draw')} ({remainingDrawCards})</span>
            <button
              className={`${styles.pile} ${styles.drawPile} ${drawPile.length === 0 ? styles.empty : ''}`}
              onClick={drawCard}
              disabled={gameState !== 'playing' || drawPile.length === 0}
            >
              {drawPile.length > 0 ? (
                <span className={styles.cardBackIcon}>🂠</span>
              ) : (
                <span className={styles.emptyPile}>∅</span>
              )}
            </button>
          </div>

          <div className={styles.pileSection}>
            <span className={styles.pileLabel}>Waste</span>
            <div className={`${styles.pile} ${styles.wastePile}`}>
              {currentWasteCard ? renderCard(
                currentWasteCard,
                { type: 'waste', index: wastePile.length - 1 }
              ) : (
                <span className={styles.emptyPile}>∅</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card value reference */}
      <div className={styles.reference}>
        <span className={styles.refTitle}>Adjacent Cards:</span>
        <span>Cards are adjacent if they differ by 1 rank (wrapping: A-2-K-Q-J-10-9-8-7-6-5-4-3-2-A)</span>
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
            <p>Cleared all three peaks in {moves} moves!</p>
            <button className={styles.playAgain} onClick={newGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}