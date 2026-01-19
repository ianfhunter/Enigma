import { useState, useEffect, useCallback } from 'react';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { phraseGuessQuotes } from '@datasets/quotes';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import StatsPanel from '../../components/StatsPanel';
import GameResult from '../../components/GameResult';
import styles from './PhraseGuess.module.css';

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const MAX_WRONG_GUESSES = 6;

// Normalize text for comparison (lowercase, collapse whitespace, remove punctuation)
const normalizeForComparison = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim();
};

// Export helpers for testing
export {
  VOWELS,
  MAX_WRONG_GUESSES,
  normalizeForComparison,
};

export default function PhraseGuess() {
  const [quote, setQuote] = useState(null);
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveAttempt, setSolveAttempt] = useState('');
  const [solveBonus, setSolveBonus] = useState(0);
  const [seed, setSeed] = useState(null);

  const initGame = useCallback((useDailySeed = true, customSeed = null) => {
    const today = getTodayDateString();
    const gameSeed = customSeed ?? (useDailySeed
      ? stringToSeed(`phraseguess-${today}`)
      : stringToSeed(`phraseguess-${Date.now()}`));
    const random = createSeededRandom(gameSeed);

    // Pick a random quote
    const quoteIndex = Math.floor(random() * phraseGuessQuotes.length);
    const selectedQuote = phraseGuessQuotes[quoteIndex];

    setSeed(gameSeed);
    setQuote(selectedQuote);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameState('playing');
    setShowSolveModal(false);
    setSolveAttempt('');
    setSolveBonus(0);
  }, []);

  useEffect(() => {
    initGame();
  }, []);

  // Check win/lose conditions
  useEffect(() => {
    if (!quote || gameState !== 'playing') return;

    const phraseLetters = new Set(
      quote.text.toUpperCase().split('').filter(c => /[A-Z]/.test(c))
    );

    const allRevealed = [...phraseLetters].every(letter => guessedLetters.has(letter));

    if (allRevealed) {
      setGameState('won');
      setScore(prev => prev + (MAX_WRONG_GUESSES - wrongGuesses) * 100);
      setStreak(prev => prev + 1);
    } else if (wrongGuesses >= MAX_WRONG_GUESSES) {
      setGameState('lost');
      setStreak(0);
    }
  }, [guessedLetters, wrongGuesses, quote, gameState]);

  const handleGuess = (letter) => {
    if (gameState !== 'playing') return;
    if (guessedLetters.has(letter)) return;

    setGuessedLetters(prev => new Set([...prev, letter]));

    const phraseUpper = quote.text.toUpperCase();
    if (!phraseUpper.includes(letter)) {
      setWrongGuesses(prev => prev + 1);
    }
  };

  const handleKeyPress = useCallback((e) => {
    // Don't process keypresses when solve modal is open
    if (showSolveModal) return;

    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter) && gameState === 'playing') {
      handleGuess(letter);
    }
  }, [gameState, guessedLetters, quote, showSolveModal]);

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  // Calculate how many letters are still hidden
  const getHiddenLetterCount = useCallback(() => {
    if (!quote) return 0;
    const phraseLetters = quote.text.toUpperCase().split('').filter(c => /[A-Z]/.test(c));
    const hiddenCount = phraseLetters.filter(letter => !guessedLetters.has(letter)).length;
    return hiddenCount;
  }, [quote, guessedLetters]);

  // Calculate unique hidden letters (for bonus calculation)
  const getUniqueHiddenLetterCount = useCallback(() => {
    if (!quote) return 0;
    const phraseLetters = new Set(
      quote.text.toUpperCase().split('').filter(c => /[A-Z]/.test(c))
    );
    const hiddenCount = [...phraseLetters].filter(letter => !guessedLetters.has(letter)).length;
    return hiddenCount;
  }, [quote, guessedLetters]);

  const handleSolveAttempt = () => {
    if (!quote || gameState !== 'playing') return;

    const normalizedAttempt = normalizeForComparison(solveAttempt);
    const normalizedQuote = normalizeForComparison(quote.text);

    if (normalizedAttempt === normalizedQuote) {
      // Correct! Calculate bonus based on hidden letters
      const hiddenCount = getHiddenLetterCount();
      const uniqueHiddenCount = getUniqueHiddenLetterCount();
      // Bonus: 50 points per hidden letter instance + 100 per unique letter still hidden
      const bonus = (hiddenCount * 50) + (uniqueHiddenCount * 100);
      const baseScore = (MAX_WRONG_GUESSES - wrongGuesses) * 100;

      setSolveBonus(bonus);
      setScore(prev => prev + baseScore + bonus);
      setStreak(prev => prev + 1);
      setGameState('won');
      setShowSolveModal(false);
    } else {
      // Wrong! Game over
      setGameState('lost');
      setShowSolveModal(false);
      setStreak(0);
    }
  };

  const renderPhrase = () => {
    if (!quote) return null;

    const words = quote.text.split(' ');

    return (
      <div className={styles.phraseBoard}>
        {words.map((word, wordIndex) => (
          <div key={wordIndex} className={styles.word}>
            {word.split('').map((char, charIndex) => {
              const upperChar = char.toUpperCase();
              const isLetter = /[A-Z]/.test(upperChar);
              const isRevealed = guessedLetters.has(upperChar);
              const showLetter = !isLetter || isRevealed || gameState !== 'playing';

              if (!isLetter) {
                return (
                  <span key={charIndex} className={styles.punctuation}>
                    {char}
                  </span>
                );
              }

              return (
                <span
                  key={charIndex}
                  className={`${styles.tile} ${isRevealed ? styles.revealed : ''} ${gameState === 'lost' && !isRevealed ? styles.missed : ''} ${gameState === 'won' && !isRevealed ? styles.solved : ''}`}
                >
                  {showLetter ? upperChar : ''}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderKeyboard = () => {
    const rows = [
      'QWERTYUIOP'.split(''),
      'ASDFGHJKL'.split(''),
      'ZXCVBNM'.split('')
    ];

    return (
      <div className={styles.keyboard}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.keyboardRow}>
            {row.map(letter => {
              const isGuessed = guessedLetters.has(letter);
              const isInPhrase = quote?.text.toUpperCase().includes(letter);
              const isVowel = VOWELS.has(letter);

              let keyClass = styles.key;
              if (isGuessed) {
                keyClass += isInPhrase ? ` ${styles.correct}` : ` ${styles.wrong}`;
              }
              if (isVowel) {
                keyClass += ` ${styles.vowel}`;
              }

              return (
                <button
                  key={letter}
                  className={keyClass}
                  onClick={() => handleGuess(letter)}
                  disabled={isGuessed || gameState !== 'playing'}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderWrongGuessIndicator = () => {
    return (
      <div className={styles.wrongGuesses}>
        {Array.from({ length: MAX_WRONG_GUESSES }).map((_, i) => (
          <span
            key={i}
            className={`${styles.guessSlot} ${i < wrongGuesses ? styles.used : ''}`}
          >
            {i < wrongGuesses ? '✗' : '○'}
          </span>
        ))}
      </div>
    );
  };

  if (!quote) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="PhraseGuess"
        instructions="Guess letters to reveal the hidden phrase! Vowels are highlighted."
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
            initGame(true, seedNum);
          }}
        />
      )}

      <div className={styles.gameArea}>
        <StatsPanel
          stats={[
            { label: 'Score', value: score },
            { label: 'Streak', value: `${streak} 🔥` }
          ]}
          layout="row"
        />

        {renderWrongGuessIndicator()}

        <div className={styles.boardContainer}>
          {renderPhrase()}

          {gameState !== 'playing' && (
            <div className={styles.authorReveal}>
              — {quote.author}
            </div>
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            status="won"
            title="🎉 You got it!"
            message={`+${(MAX_WRONG_GUESSES - wrongGuesses) * 100} points${solveBonus > 0 ? ` (+${solveBonus} solve bonus!)` : ''}`}
          />
        )}

        {gameState === 'lost' && (
          <GameResult
            status="lost"
            title={wrongGuesses >= MAX_WRONG_GUESSES ? '😔 Out of guesses!' : '😔 Wrong solve attempt!'}
            message="The phrase was revealed above."
          />
        )}

        {gameState === 'playing' && (
          <button
            className={styles.solveBtn}
            onClick={() => setShowSolveModal(true)}
          >
            🎯 Solve! ({getHiddenLetterCount()} letters hidden)
          </button>
        )}

        {renderKeyboard()}

        <div className={styles.buttonRow}>
          <button className={styles.newGameBtn} onClick={() => initGame(false)}>
            New Random Phrase
          </button>
          <button className={styles.dailyBtn} onClick={() => initGame(true)}>
            Today's Phrase
          </button>
        </div>
      </div>

      {/* Solve Modal */}
      {showSolveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSolveModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>🎯 Solve the Phrase!</h2>
            <p className={styles.modalHint}>
              {getHiddenLetterCount()} letters still hidden • Potential bonus: +{(getHiddenLetterCount() * 50) + (getUniqueHiddenLetterCount() * 100)} pts
            </p>
            <p className={styles.modalWarning}>⚠️ Be careful! Wrong guess = Game Over</p>
            <textarea
              className={styles.solveInput}
              value={solveAttempt}
              onChange={(e) => setSolveAttempt(e.target.value)}
              placeholder="Type the full phrase here..."
              autoFocus
              rows={3}
            />
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowSolveModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitSolveBtn}
                onClick={handleSolveAttempt}
                disabled={!solveAttempt.trim()}
              >
                Submit Guess
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
