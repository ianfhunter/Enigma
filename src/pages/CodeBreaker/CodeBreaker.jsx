import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameStats } from '../../hooks/useGameStats';
import { useGameState } from '../../hooks/useGameState';
import { createSeededRNG, parseSeedFromUrl, generateRandomSeed } from '../../enigma-sdk/seeding';
import styles from './CodeBreaker.module.css';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const COLOR_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Teal'];

const DIFFICULTIES = {
  easy: { codeLength: 4, colorCount: 6, maxGuesses: 12 },
  medium: { codeLength: 4, colorCount: 6, maxGuesses: 10 },
  hard: { codeLength: 5, colorCount: 8, maxGuesses: 10 },
};

export function generateSecretCode(length, colorCount, seed) {
  const rng = createSeededRNG(seed);
  return Array.from({ length }, () => Math.floor(rng() * colorCount));
}

export function checkGuess(guess, secret) {
  const exactMatches = []; // correct color and position
  const colorMatches = [];  // correct color, wrong position

  const secretCopy = [...secret];
  const guessCopy = [...guess];

  // First pass: find exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      exactMatches.push(i);
      secretCopy[i] = null;
      guessCopy[i] = null;
    }
  }

  // Second pass: find color matches
  for (let i = 0; i < guess.length; i++) {
    if (guessCopy[i] === null) continue;

    const foundIndex = secretCopy.findIndex(c => c === guessCopy[i] && c !== null);
    if (foundIndex !== -1) {
      colorMatches.push(i);
      secretCopy[foundIndex] = null;
    }
  }

  return {
    exact: exactMatches.length,
    color: colorMatches.length,
  };
}

export default function CodeBreaker() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const [secretCode, setSecretCode] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const { gameState, checkWin, giveUp, lose, reset: resetGameState, isPlaying } = useGameState();
  const { stats, recordWin, recordLoss, recordGiveUp, winRate } = useGameStats('codebreaker', {
    trackBestTime: false,
    trackBestScore: false,
    trackStreak: false,
  });
  const [seed, setSeed] = useState(() => parseSeedFromUrl() || generateRandomSeed());

  const { codeLength, colorCount, maxGuesses } = DIFFICULTIES[difficulty];

  const initGame = useCallback((customSeed = null) => {
    const gameSeed = customSeed !== null ? customSeed : generateRandomSeed();
    setSeed(gameSeed);
    setSecretCode(generateSecretCode(codeLength, colorCount, gameSeed));
    setGuesses([]);
    setCurrentGuess(Array(codeLength).fill(null));
    setSelectedSlot(0);
    resetGameState();
  }, [codeLength, colorCount, resetGameState]);

  useEffect(() => {
    // Initialize with seed from URL or the generated seed
    initGame(seed);
    // Only run on mount, not when seed changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleColorSelect = (colorIndex) => {
    if (!isPlaying) return;

    const newGuess = [...currentGuess];
    newGuess[selectedSlot] = colorIndex;
    setCurrentGuess(newGuess);

    // Auto-advance to next empty slot
    const nextEmpty = newGuess.findIndex((c, i) => c === null && i > selectedSlot);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      // Find any empty slot
      const anyEmpty = newGuess.findIndex(c => c === null);
      if (anyEmpty !== -1) {
        setSelectedSlot(anyEmpty);
      }
    }
  };

  const handleSlotClick = (index) => {
    if (!isPlaying) return;
    setSelectedSlot(index);
  };

  const handleClearSlot = () => {
    if (!isPlaying) return;
    const newGuess = [...currentGuess];
    newGuess[selectedSlot] = null;
    setCurrentGuess(newGuess);
  };

  const handleGiveUp = () => {
    if (!isPlaying) return;
    giveUp();
    recordGiveUp();
  };

  const handleSubmitGuess = () => {
    if (!isPlaying) return;
    if (currentGuess.some(c => c === null)) return;

    const result = checkGuess(currentGuess, secretCode);
    const newGuess = {
      colors: [...currentGuess],
      result,
    };

    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    if (result.exact === codeLength) {
      checkWin(true);
      recordWin();
    } else if (newGuesses.length >= maxGuesses) {
      lose();
      recordLoss();
    } else {
      setCurrentGuess(Array(codeLength).fill(null));
      setSelectedSlot(0);
    }
  };

  const renderFeedbackPegs = (result) => {
    const pegs = [];
    for (let i = 0; i < result.exact; i++) {
      pegs.push(
        <div key={`exact-${i}`} className={`${styles.feedbackPeg} ${styles.exact}`} title="Correct color & position">
          ●
        </div>
      );
    }
    for (let i = 0; i < result.color; i++) {
      pegs.push(
        <div key={`color-${i}`} className={`${styles.feedbackPeg} ${styles.color}`} title="Right color, wrong position">
          ○
        </div>
      );
    }
    while (pegs.length < codeLength) {
      pegs.push(<div key={`empty-${pegs.length}`} className={`${styles.feedbackPeg} ${styles.empty}`} />);
    }
    return pegs;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="CodeBreaker"
        instructions="Crack the secret code! Check the feedback pegs after each guess."
      />

      <DifficultySelector
        difficulties={Object.keys(DIFFICULTIES)}
        selectedDifficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      <SeedDisplay
        seed={seed}
        variant="compact"
        onSeedChange={(newSeed) => {
          const seedNum = typeof newSeed === 'string'
            ? (isNaN(parseInt(newSeed, 10)) ? newSeed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : parseInt(newSeed, 10))
            : newSeed;
          initGame(seedNum);
        }}
      />

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Guesses</span>
            <span className={styles.statValue}>{guesses.length} / {maxGuesses}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('common.wins')}</span>
            <span className={styles.statValue}>{stats.won}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('common.losses')}</span>
            <span className={styles.statValue}>{stats.played - stats.won}</span>
          </div>
        </div>

        <div className={styles.board}>
          {/* Secret code (revealed when game over) */}
          <div className={styles.secretRow}>
            {secretCode.map((colorIndex, i) => (
              <div
                key={i}
                className={`${styles.peg} ${gameState === 'playing' ? styles.hidden : ''}`}
                style={gameState !== 'playing' ? { backgroundColor: COLORS[colorIndex] } : {}}
              >
                {gameState === 'playing' && '?'}
              </div>
            ))}
            <div className={styles.feedbackArea} />
          </div>

          <div className={styles.divider} />

          {/* Previous guesses */}
          {guesses.map((guess, guessIndex) => (
            <div key={guessIndex} className={styles.guessRow}>
              {guess.colors.map((colorIndex, i) => (
                <div
                  key={i}
                  className={styles.peg}
                  style={{ backgroundColor: COLORS[colorIndex] }}
                />
              ))}
              <div className={styles.feedbackArea}>
                {renderFeedbackPegs(guess.result)}
              </div>
            </div>
          ))}

          {/* Current guess */}
          {gameState === 'playing' && (
            <div className={styles.guessRow}>
              {currentGuess.map((colorIndex, i) => (
                <div
                  key={i}
                  className={`${styles.peg} ${styles.slot} ${selectedSlot === i ? styles.selected : ''} ${colorIndex === null ? styles.empty : ''}`}
                  style={colorIndex !== null ? { backgroundColor: COLORS[colorIndex] } : {}}
                  onClick={() => handleSlotClick(i)}
                />
              ))}
              <button
                className={styles.submitBtn}
                onClick={handleSubmitGuess}
                disabled={currentGuess.some(c => c === null)}
              >
                ✓
              </button>
            </div>
          )}
        </div>

        {/* Feedback legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendPeg} ${styles.exact}`}>●</div>
            <span>Correct color & position</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendPeg} ${styles.color}`}>○</div>
            <span>Right color, wrong spot</span>
          </div>
        </div>

        {/* Color picker */}
        {gameState === 'playing' && (
          <div className={styles.colorPicker}>
            {COLORS.slice(0, colorCount).map((color, index) => (
              <button
                key={index}
                className={styles.colorBtn}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(index)}
                title={COLOR_NAMES[index]}
              />
            ))}
            <button className={styles.clearBtn} onClick={handleClearSlot}>
              ✕
            </button>
          </div>
        )}

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Code Cracked!"
            message={`You cracked the code in ${guesses.length} guesses!`}
          />
        )}
        {gameState === 'lost' && (
          <GameResult
            state="lost"
            title="Game Over!"
            message="The code was revealed above."
          />
        )}
        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Code Revealed"
          />
        )}

        <div className={styles.buttons}>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            {gameState === 'playing' ? 'New Game' : 'Play Again'}
          </button>
        </div>
      </div>
    </div>
  );
}
