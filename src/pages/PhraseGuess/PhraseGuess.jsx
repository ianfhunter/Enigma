import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { phraseGuessQuotes } from '@datasets/quotes';
import styles from './PhraseGuess.module.css';

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const MAX_WRONG_GUESSES = 6;

export default function PhraseGuess() {
  const [quote, setQuote] = useState(null);
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const initGame = useCallback((useDailySeed = true) => {
    const today = getTodayDateString();
    const seed = useDailySeed
      ? stringToSeed(`phraseguess-${today}`)
      : stringToSeed(`phraseguess-${Date.now()}`);
    const random = createSeededRandom(seed);

    // Pick a random quote
    const quoteIndex = Math.floor(random() * phraseGuessQuotes.length);
    const selectedQuote = phraseGuessQuotes[quoteIndex];

    setQuote(selectedQuote);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameState('playing');
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
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter) && gameState === 'playing') {
      handleGuess(letter);
    }
  }, [gameState, guessedLetters, quote]);

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

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
              const showLetter = !isLetter || isRevealed || gameState === 'lost';

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
                  className={`${styles.tile} ${isRevealed ? styles.revealed : ''} ${gameState === 'lost' && !isRevealed ? styles.missed : ''}`}
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
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>PhraseGuess</h1>
        <p className={styles.instructions}>
          Guess letters to reveal the hidden phrase! Vowels are highlighted.
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Score</span>
            <span className={styles.statValue}>{score}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Streak</span>
            <span className={styles.statValue}>{streak} 🔥</span>
          </div>
        </div>

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
          <div className={styles.winMessage}>
            🎉 You got it! +{(MAX_WRONG_GUESSES - wrongGuesses) * 100} points
          </div>
        )}

        {gameState === 'lost' && (
          <div className={styles.loseMessage}>
            😔 Out of guesses! The phrase was revealed above.
          </div>
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
    </div>
  );
}
