import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { cryptogramQuotes } from '@datasets/quotes';
import styles from './Cryptogram.module.css';

// Parse seed from URL if present
function getSeedFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const seedStr = params.get('seed');
  if (seedStr) {
    const parsed = parseInt(seedStr, 10);
    return isNaN(parsed) ? stringToSeed(seedStr) : parsed;
  }
  return null;
}

// Create a random letter substitution cipher
function createCipher(random) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const shuffled = [...alphabet];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Ensure no letter maps to itself
  for (let i = 0; i < alphabet.length; i++) {
    if (alphabet[i] === shuffled[i]) {
      // Swap with next position
      const next = (i + 1) % alphabet.length;
      [shuffled[i], shuffled[next]] = [shuffled[next], shuffled[i]];
    }
  }

  const cipher = {};
  const reverse = {};
  for (let i = 0; i < alphabet.length; i++) {
    cipher[alphabet[i]] = shuffled[i];
    reverse[shuffled[i]] = alphabet[i];
  }

  return { cipher, reverse };
}

// Encrypt text using cipher
function encrypt(text, cipher) {
  return text.toUpperCase().split('').map(char => {
    if (cipher[char]) return cipher[char];
    return char;
  }).join('');
}

// Get unique letters in text
function getUniqueLetters(text) {
  const letters = new Set();
  for (const char of text.toUpperCase()) {
    if (/[A-Z]/.test(char)) {
      letters.add(char);
    }
  }
  return Array.from(letters).sort();
}

// Default and max starting hints
const DEFAULT_STARTING_HINTS = 3;
const MAX_STARTING_HINTS = 5;

export default function Cryptogram({ startingHints = DEFAULT_STARTING_HINTS }) {
  const { t } = useTranslation();
  // Clamp startingHints between 0 and MAX_STARTING_HINTS
  const numStartingHints = Math.max(0, Math.min(MAX_STARTING_HINTS, startingHints));

  const [quote, setQuote] = useState(null);
  const [cipher, setCipher] = useState(null);
  const [encrypted, setEncrypted] = useState('');
  const [guesses, setGuesses] = useState({});
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [seed, setSeed] = useState(null);

  const inputRef = useRef(null);

  const initGame = useCallback((customSeed = null) => {
    const today = getTodayDateString();
    const urlSeed = getSeedFromUrl();
    const seed = customSeed ?? urlSeed ?? stringToSeed(`cryptogram-${today}`);
    setSeed(seed);
    const random = createSeededRandom(seed);

    // Pick a random quote
    const quoteIndex = Math.floor(random() * cryptogramQuotes.length);
    const selectedQuote = cryptogramQuotes[quoteIndex];

    // Create cipher
    const { cipher: newCipher, reverse } = createCipher(random);

    // Encrypt the quote
    const encryptedText = encrypt(selectedQuote.text, newCipher);

    // Generate starting hints - reveal random letters
    const initialGuesses = {};
    if (numStartingHints > 0) {
      const encryptedLetters = getUniqueLetters(encryptedText);
      // Shuffle the encrypted letters using seeded random for consistency
      const shuffledLetters = [...encryptedLetters];
      for (let i = shuffledLetters.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
      }
      // Reveal the first numStartingHints letters
      const lettersToReveal = shuffledLetters.slice(0, numStartingHints);
      for (const encLetter of lettersToReveal) {
        initialGuesses[encLetter] = reverse[encLetter];
      }
    }

    setQuote(selectedQuote);
    setCipher({ encrypt: newCipher, decrypt: reverse });
    setEncrypted(encryptedText);
    setGuesses(initialGuesses);
    setSelectedLetter(null);
    setHintsUsed(0);
    resetGameState();
    setStartTime(Date.now());
    setEndTime(null);
  }, [numStartingHints, resetGameState]);

  useEffect(() => {
    initGame();
  }, []);

  // Check if puzzle is solved
  useEffect(() => {
    if (!quote || !cipher || !isPlaying) return;

    const originalLetters = getUniqueLetters(quote.text);
    const allCorrect = originalLetters.every(letter => {
      const encryptedLetter = cipher.encrypt[letter];
      return guesses[encryptedLetter] === letter;
    });

    if (allCorrect && Object.keys(guesses).length > 0) {
      checkWin(true);
      setEndTime(Date.now());
    }
  }, [guesses, quote, cipher, isPlaying, checkWin]);

  const handleLetterClick = (encryptedLetter) => {
    if (!isPlaying) return;
    if (!/[A-Z]/.test(encryptedLetter)) return;

    setSelectedLetter(encryptedLetter);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleGuess = (e) => {
    const value = e.target.value.toUpperCase();
    if (!selectedLetter) return;

    if (value === '' || /^[A-Z]$/.test(value)) {
      setGuesses(prev => {
        const newGuesses = { ...prev };

        // Remove this letter from any other position it was guessed
        if (value) {
          Object.keys(newGuesses).forEach(key => {
            if (newGuesses[key] === value) {
              delete newGuesses[key];
            }
          });
        }

        if (value) {
          newGuesses[selectedLetter] = value;
        } else {
          delete newGuesses[selectedLetter];
        }

        return newGuesses;
      });
    }

    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSelectedLetter(null);
    } else if (e.key === 'Backspace' && selectedLetter) {
      setGuesses(prev => {
        const newGuesses = { ...prev };
        delete newGuesses[selectedLetter];
        return newGuesses;
      });
    }
  };

  const handleGiveUp = () => {
    if (!cipher || !isPlaying) return;
    // Reveal all letters using the cipher's decrypt map
    const allGuesses = {};
    Object.keys(cipher.decrypt).forEach(encLetter => {
      allGuesses[encLetter] = cipher.decrypt[encLetter];
    });
    setGuesses(allGuesses);
    giveUp();
    setEndTime(Date.now());
  };

  const getHint = () => {
    if (!cipher || gameState !== 'playing') return;

    // Find an unguessed or incorrectly guessed letter
    const encryptedLetters = getUniqueLetters(encrypted);
    const wrongLetters = encryptedLetters.filter(encLetter => {
      const correctLetter = cipher.decrypt[encLetter];
      return guesses[encLetter] !== correctLetter;
    });

    if (wrongLetters.length === 0) return;

    // Reveal one random wrong letter
    const randomIndex = Math.floor(Math.random() * wrongLetters.length);
    const letterToReveal = wrongLetters[randomIndex];
    const correctAnswer = cipher.decrypt[letterToReveal];

    setGuesses(prev => {
      const newGuesses = { ...prev };
      // Remove this answer from other positions
      Object.keys(newGuesses).forEach(key => {
        if (newGuesses[key] === correctAnswer) {
          delete newGuesses[key];
        }
      });
      newGuesses[letterToReveal] = correctAnswer;
      return newGuesses;
    });

    setHintsUsed(prev => prev + 1);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEncryptedText = () => {
    if (!encrypted || !cipher) return null;

    const words = encrypted.split(' ');

    return (
      <div className={styles.puzzleText}>
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className={styles.word}>
            {word.split('').map((char, charIndex) => {
              const isLetter = /[A-Z]/.test(char);
              const guess = guesses[char];
              const isSelected = selectedLetter === char;
              const isCorrect = guess && cipher.decrypt[char] === guess;
              const isWrong = guess && cipher.decrypt[char] !== guess;

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
                  className={`${styles.letterCell} ${isSelected ? styles.selected : ''} ${isCorrect ? styles.correct : ''} ${isWrong ? styles.wrong : ''}`}
                  onClick={() => handleLetterClick(char)}
                >
                  <span className={styles.guess}>{guess || ''}</span>
                  <span className={styles.encrypted}>{char}</span>
                </span>
              );
            })}
            {wordIndex < words.length - 1 && <span className={styles.space}> </span>}
          </span>
        ))}
      </div>
    );
  };

  const renderLetterBank = () => {
    if (!cipher) return null;

    const usedLetters = new Set(Object.values(guesses));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
      <div className={styles.letterBank}>
        {alphabet.map(letter => {
          const isUsed = usedLetters.has(letter);
          return (
            <span
              key={letter}
              className={`${styles.bankLetter} ${isUsed ? styles.used : ''}`}
            >
              {letter}
            </span>
          );
        })}
      </div>
    );
  };

  if (!quote) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  const timeTaken = endTime ? endTime - startTime : 0;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Cryptogram"
        instructions="Each letter has been replaced with another. Click a letter and type to decode the quote!"
      />

      {seed && (
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

      <div className={styles.gameArea}>
        <div className={styles.puzzleContainer}>
          {renderEncryptedText()}

          {gameState === 'won' && (
            <div className={styles.authorReveal}>
              — {quote.author}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {renderLetterBank()}

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Hints</span>
              <span className={styles.statValue}>{hintsUsed}</span>
            </div>

            {gameState === 'playing' && (
              <button className={styles.hintBtn} onClick={getHint}>
                💡 Get Hint
              </button>
            )}
          </div>
        </div>

        {/* Hidden input for keyboard */}
        <input
          ref={inputRef}
          type="text"
          className={styles.hiddenInput}
          onChange={handleGuess}
          onKeyDown={handleKeyDown}
          maxLength={1}
          autoComplete="off"
        />

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={`Time: ${formatTime(timeTaken)} • Hints used: ${hintsUsed}`}
          />
        )}
        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
          />
        )}

        <div className={styles.buttonRow}>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={() => initGame(Math.floor(Math.random() * 2147483647))}>
            New Random Puzzle
          </button>
          <button className={styles.dailyBtn} onClick={() => initGame(null)}>
            Today's Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
