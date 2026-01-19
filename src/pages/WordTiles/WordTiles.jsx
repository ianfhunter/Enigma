import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isValidWord } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './WordTiles.module.css';

// Tile distribution and values
const TILE_VALUES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const TILE_DISTRIBUTION = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1
};

const NUM_TILES = 7;
const WORD_SLOTS = 7;

export function getNextAutoSlot(placedTiles) {
  const occupied = new Set(placedTiles.map(p => p.slotIndex));
  for (let i = 0; i < WORD_SLOTS; i++) {
    if (!occupied.has(i)) return i;
  }
  return null;
}

function createTileBag() {
  const bag = [];
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      bag.push(letter);
    }
  }
  // Shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function drawTiles(bag, count) {
  const tiles = [];
  for (let i = 0; i < count && bag.length > 0; i++) {
    tiles.push(bag.pop());
  }
  return tiles;
}

function calculateWordScore(word, doubleWordPosition) {
  let score = 0;
  for (let i = 0; i < word.length; i++) {
    score += TILE_VALUES[word[i]] || 0;
  }
  if (doubleWordPosition !== null && doubleWordPosition < word.length) {
    score *= 2;
  }
  return score;
}

// Standard tile set has 100 tiles (98 letters + 2 blanks), we use 98 (no blanks)
const TOTAL_TILES = Object.values(TILE_DISTRIBUTION).reduce((a, b) => a + b, 0); // 98

const STORAGE_KEY = 'wordTilesHighScore';

function shuffleArray(arr, randomFn = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mergeHandTiles(tiles, placedTiles) {
  const placedByHand = new Map();
  placedTiles.forEach(t => {
    placedByHand.set(t.handIndex, t.letter);
  });

  return tiles.map((tile, idx) => {
    if (tile !== null && tile !== undefined) {
      return tile;
    }
    return placedByHand.get(idx) ?? null;
  });
}

export function computeSwapResult({ tiles, placedTiles, bag, randomFn = Math.random }) {
  const fullHand = mergeHandTiles(tiles, placedTiles);

  const handEntries = fullHand
    .map((letter, index) => (letter ? { letter, index } : null))
    .filter(Boolean);

  if (bag.length === 0 || handEntries.length === 0) {
    return {
      canSwap: false,
      reason: bag.length === 0 ? 'empty-bag' : 'empty-hand'
    };
  }

  const swapCount = Math.min(bag.length, handEntries.length);
  const shuffledHand = shuffleArray([...handEntries], randomFn);
  const toSwap = shuffledHand.slice(0, swapCount);

  const newBag = [...bag];
  const drawn = drawTiles(newBag, swapCount);

  toSwap.forEach(({ letter }) => newBag.push(letter));

  const newTiles = [...fullHand];
  toSwap.forEach((entry, idx) => {
    newTiles[entry.index] = drawn[idx];
  });

  return {
    canSwap: true,
    swapCount,
    partial: swapCount < handEntries.length,
    nextBag: newBag,
    nextTiles: newTiles
  };
}

// Export helpers for testing
export {
  TILE_VALUES,
  TILE_DISTRIBUTION,
  NUM_TILES,
  WORD_SLOTS,
  createTileBag,
  drawTiles,
  calculateWordScore,
  shuffleArray,
  mergeHandTiles,
};

export default function WordTiles() {
  const [tiles, setTiles] = useState([]);
  const [bag, setBag] = useState([]);
  const [placedTiles, setPlacedTiles] = useState([]); // Array of {letter, index}
  const [doubleWordSlot, setDoubleWordSlot] = useState(2); // Which slot has 2x
  const [score, setScore] = useState(0);
  const [wordsPlayed, setWordsPlayed] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [message, setMessage] = useState('');
  const [finalPenalty, setFinalPenalty] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const initGame = useCallback(() => {
    const newBag = createTileBag();
    const newTiles = drawTiles(newBag, NUM_TILES);
    setBag(newBag);
    setTiles(newTiles);
    setPlacedTiles([]);
    setDoubleWordSlot(Math.floor(Math.random() * WORD_SLOTS));
    setScore(0);
    setWordsPlayed([]);
    setGameState('playing');
    setMessage('');
    setFinalPenalty(0);
    setIsNewHighScore(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check and save high score when game ends
  useEffect(() => {
    if (gameState === 'finished' && score > highScore) {
      setHighScore(score);
      setIsNewHighScore(true);
      localStorage.setItem(STORAGE_KEY, score.toString());
    }
  }, [gameState, score, highScore]);

  // Refs to store handlers for keyboard use
  const submitRef = useRef(null);
  const clearRef = useRef(null);

  const handleTileClick = (handIndex) => {
    if (gameState !== 'playing') return;
    const letter = tiles[handIndex];
    if (!letter) return;

    const nextSlot = getNextAutoSlot(placedTiles);
    if (nextSlot === null) {
      setMessage('All word slots filled!');
      return;
    }

    setPlacedTiles(prev => [...prev, {
      letter,
      slotIndex: nextSlot,
      handIndex
    }]);
    setTiles(prev => {
      const newTiles = [...prev];
      newTiles[handIndex] = null;
      return newTiles;
    });
    setMessage('');
  };

  const handlePlacedTileClick = (slotIndex) => {
    if (gameState !== 'playing') return;

    // Return tile to hand
    const tileInSlot = placedTiles.find(t => t.slotIndex === slotIndex);
    if (!tileInSlot) return;

    setPlacedTiles(prev => prev.filter(t => t.slotIndex !== slotIndex));
    setTiles(prev => {
      const newTiles = [...prev];
      newTiles[tileInSlot.handIndex] = tileInSlot.letter;
      return newTiles;
    });
  };

  const handleSubmitWord = async () => {
    if (gameState !== 'playing') return;

    // Build word from placed tiles
    const sortedTiles = [...placedTiles].sort((a, b) => a.slotIndex - b.slotIndex);

    // Check for gaps
    if (sortedTiles.length === 0) {
      setMessage('Place some tiles first!');
      return;
    }

    const minSlot = sortedTiles[0].slotIndex;
    const maxSlot = sortedTiles[sortedTiles.length - 1].slotIndex;

    if (maxSlot - minSlot + 1 !== sortedTiles.length) {
      setMessage('No gaps allowed between tiles!');
      return;
    }

    const word = sortedTiles.map(t => t.letter).join('');

    if (word.length < 2) {
      setMessage('Word must be at least 2 letters!');
      return;
    }

    // Check if word is valid
    const valid = await isValidWord(word);
    if (!valid) {
      setMessage(`"${word}" is not a valid word!`);
      return;
    }

    // Calculate score
    const hasDouble = sortedTiles.some(t => t.slotIndex === doubleWordSlot);
    const wordScore = calculateWordScore(word, hasDouble ? 0 : null);

    setScore(prev => prev + wordScore);
    setWordsPlayed(prev => [...prev, { word, score: wordScore, double: hasDouble }]);
    setMessage(`+${wordScore} points!${hasDouble ? ' (2× WORD!)' : ''}`);

    // Draw new tiles
    const newTiles = [...tiles];
    const tilesNeeded = placedTiles.length;
    const drawn = drawTiles(bag, tilesNeeded);

    let drawIndex = 0;
    for (let i = 0; i < newTiles.length && drawIndex < drawn.length; i++) {
      if (newTiles[i] === null) {
        newTiles[i] = drawn[drawIndex++];
      }
    }

    setTiles(newTiles);
    setPlacedTiles([]);

    // Move double word slot
    setDoubleWordSlot(Math.floor(Math.random() * WORD_SLOTS));

    // Check if game over
    const remainingTiles = newTiles.filter(t => t !== null).length;
    if (remainingTiles === 0 && bag.length === 0) {
      setGameState('finished');
    }
  };

  const handleClear = () => {
    // Return all placed tiles to hand
    const newTiles = [...tiles];
    for (const placed of placedTiles) {
      newTiles[placed.handIndex] = placed.letter;
    }
    setTiles(newTiles);
    setPlacedTiles([]);
    setMessage('');
  };

  // Keep refs updated for keyboard handler
  submitRef.current = handleSubmitWord;
  clearRef.current = handleClear;

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      // Don't capture if user is in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();

      // Handle letter keys (A-Z)
      if (/^[A-Z]$/.test(key)) {
        // Find an available tile with this letter
        const tileIndex = tiles.findIndex((tile, idx) =>
          tile === key && !placedTiles.some(p => p.handIndex === idx)
        );

        if (tileIndex === -1) {
          // No tile with this letter available
          return;
        }

        // Find the next empty slot (left to right, filling gaps)
        let nextSlot = 0;
        const occupiedSlots = placedTiles.map(p => p.slotIndex).sort((a, b) => a - b);

        if (occupiedSlots.length > 0) {
          // Find the rightmost occupied slot and place next to it
          nextSlot = occupiedSlots[occupiedSlots.length - 1] + 1;
        }

        if (nextSlot >= WORD_SLOTS) {
          // All slots full
          return;
        }

        // Place the tile
        setPlacedTiles(prev => [...prev, {
          letter: key,
          slotIndex: nextSlot,
          handIndex: tileIndex
        }]);
        setTiles(prev => {
          const newTiles = [...prev];
          newTiles[tileIndex] = null;
          return newTiles;
        });
        setMessage('');
      }

      // Handle Backspace - remove last placed tile
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (placedTiles.length > 0) {
          // Remove the last placed tile (rightmost)
          const sortedTiles = [...placedTiles].sort((a, b) => a.slotIndex - b.slotIndex);
          const lastTile = sortedTiles[sortedTiles.length - 1];

          setPlacedTiles(prev => prev.filter(t => t.slotIndex !== lastTile.slotIndex));
          setTiles(prev => {
            const newTiles = [...prev];
            newTiles[lastTile.handIndex] = lastTile.letter;
            return newTiles;
          });
          setMessage('');
        }
      }

      // Handle Enter - submit word
      if (e.key === 'Enter') {
        e.preventDefault();
        submitRef.current?.();
      }

      // Handle Escape - clear all
      if (e.key === 'Escape') {
        e.preventDefault();
        clearRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, tiles, placedTiles]);

  const handleShuffle = () => {
    setTiles(prev => {
      const nonNull = prev.filter(t => t !== null);
      // Shuffle
      for (let i = nonNull.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nonNull[i], nonNull[j]] = [nonNull[j], nonNull[i]];
      }
      // Rebuild with nulls in same positions
      const result = [];
      let nonNullIdx = 0;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i] !== null) {
          result.push(nonNull[nonNullIdx++]);
        } else {
          result.push(null);
        }
      }
      return result;
    });
  };

  const handleSkip = () => {
    if (gameState !== 'playing') return;

    const swapResult = computeSwapResult({ tiles, placedTiles, bag });

    if (!swapResult.canSwap) {
      setMessage('No tiles left to swap!');
      return;
    }

    setTiles(swapResult.nextTiles);
    setBag(swapResult.nextBag);
    setPlacedTiles([]);
    setMessage(
      swapResult.partial
        ? `Swapped ${swapResult.swapCount} tile${swapResult.swapCount === 1 ? '' : 's'} (bag low) -10 points`
        : 'Tiles swapped! -10 points'
    );
    setScore(prev => Math.max(0, prev - 10));
  };

  const handleSubmitFinalScore = () => {
    if (gameState !== 'playing') return;

    // Clear any placed tiles back to hand first
    handleClear();

    // Calculate penalty for remaining tiles (hand + bag)
    const handTiles = tiles.filter(t => t !== null);
    const allRemainingTiles = [...handTiles, ...bag];
    const penalty = allRemainingTiles.reduce((sum, letter) => sum + (TILE_VALUES[letter] || 0), 0);

    setFinalPenalty(penalty);
    setScore(prev => Math.max(0, prev - penalty));
    setGameState('finished');
    setMessage('');
  };

  // Build the word display
  const wordSlots = Array(WORD_SLOTS).fill(null);
  for (const placed of placedTiles) {
    wordSlots[placed.slotIndex] = placed.letter;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>WordTiles</h1>
        <p className={styles.instructions}>
          Type your word, or click tiles to place. Backspace to undo, Enter to submit.
        </p>
      </div>

      <div className={styles.scoreBoard}>
        <div className={styles.scoreLabel}>Score</div>
        <div className={styles.scoreValue}>{score}</div>
        <div className={styles.highScoreRow}>
          <span className={styles.highScoreLabel}>Best:</span>
          <span className={styles.highScoreValue}>{highScore}</span>
        </div>
        <div className={styles.tilesLeft}>
          {bag.length + tiles.filter(t => t !== null).length} / {TOTAL_TILES} tiles remaining
        </div>
      </div>

      <div className={styles.gameArea}>
        {/* Word slots */}
        <div className={styles.wordArea}>
          <div className={styles.wordSlots}>
            {wordSlots.map((letter, i) => (
              <div
                key={i}
                className={`
                  ${styles.wordSlot}
                  ${i === doubleWordSlot ? styles.doubleWord : ''}
                  ${letter ? styles.filled : ''}
                `}
                onClick={() => letter && handlePlacedTileClick(i)}
              >
                {i === doubleWordSlot && !letter && (
                  <span className={styles.doubleLabel}>2×</span>
                )}
                {letter && (
                  <div className={styles.placedTile}>
                    <span className={styles.letter}>{letter}</span>
                    <span className={styles.points}>{TILE_VALUES[letter]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${message.includes('not') || message.includes('gaps') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}

        {/* Tile rack */}
        <div className={styles.tileRack}>
          {tiles.map((tile, i) => (
            <button
              key={i}
              className={`
                ${styles.tile}
                ${tile ? '' : styles.empty}
              `}
              onClick={() => tile && handleTileClick(i)}
              disabled={!tile}
            >
              {tile && (
                <>
                  <span className={styles.tileLetter}>{tile}</span>
                  <span className={styles.tilePoints}>{TILE_VALUES[tile]}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleClear}>
            Clear
          </button>
          <button className={styles.actionBtn} onClick={handleShuffle}>
            Shuffle
          </button>
          <button className={styles.submitBtn} onClick={handleSubmitWord}>
            Submit Word
          </button>
          <button className={styles.skipBtn} onClick={handleSkip}>
            Swap (-10)
          </button>
        </div>

        <button className={styles.endGameBtn} onClick={handleSubmitFinalScore}>
          End Game & Submit Score
        </button>

        {/* Words played */}
        {wordsPlayed.length > 0 && (
          <div className={styles.wordsPlayed}>
            <h3>Words Played</h3>
            <div className={styles.wordsList}>
              {wordsPlayed.map((w, i) => (
                <div key={i} className={styles.playedWord}>
                  <WordWithDefinition word={w.word} className={styles.playedWordText} />
                  <span className={`${styles.playedWordScore} ${w.double ? styles.double : ''}`}>
                    +{w.score}{w.double && ' 2×'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className={`${styles.gameOver} ${isNewHighScore ? styles.newHighScore : ''}`}>
            <div className={styles.winEmoji}>{isNewHighScore ? '🏆' : '🎯'}</div>
            {isNewHighScore && <div className={styles.newHighScoreBanner}>New High Score!</div>}
            <h3>Game Over!</h3>
            <p className={styles.finalScore}>Final Score: {score}</p>
            <p>{wordsPlayed.length} words played</p>
            {finalPenalty > 0 && (
              <p className={styles.penalty}>-{finalPenalty} pts for unused tiles</p>
            )}
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          New Game
        </button>
      </div>
    </div>
  );
}
