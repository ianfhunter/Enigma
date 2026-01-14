import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { cryptogramQuotes } from '@datasets/quotes';
import styles from './Fliptogram.module.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Get initial random letter for each position
function getRandomLetter(random) {
  return ALPHABET[Math.floor(random() * 26)];
}

export default function Fliptogram() {
  const [quote, setQuote] = useState(null);
  const [targetText, setTargetText] = useState('');
  const [currentLetters, setCurrentLetters] = useState([]);
  const [initialLetters, setInitialLetters] = useState([]); // The wrong letters to toggle with
  const [flipping, setFlipping] = useState({});
  const [flipDirection, setFlipDirection] = useState({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [flipCount, setFlipCount] = useState(0);

  const initGame = useCallback((useDailySeed = true) => {
    const today = getTodayDateString();
    const seed = useDailySeed
      ? stringToSeed(`fliptogram-${today}`)
      : stringToSeed(`fliptogram-${Date.now()}`);
    const random = createSeededRandom(seed);

    // Pick a random quote
    const quoteIndex = Math.floor(random() * cryptogramQuotes.length);
    const selectedQuote = cryptogramQuotes[quoteIndex];

    const text = selectedQuote.text.toUpperCase();
    setQuote(selectedQuote);
    setTargetText(text);

    // Initialize each letter position - some start correct, some start wrong (flipped)
    // Store the "wrong" letter for each position for toggling
    const wrongLetters = text.split('').map(char => {
      if (/[A-Z]/.test(char)) {
        // Generate a random letter that's NOT the correct one
        let randomLetter = getRandomLetter(random);
        while (randomLetter === char) {
          randomLetter = getRandomLetter(random);
        }
        return randomLetter;
      }
      return char;
    });

    // Randomly decide which letters start flipped (showing wrong letter) vs correct
    const startingLetters = text.split('').map((char, idx) => {
      if (/[A-Z]/.test(char)) {
        // ~50% chance to start with the correct letter, ~50% chance to start flipped
        const startCorrect = random() < 0.5;
        return startCorrect ? char : wrongLetters[idx];
      }
      return char;
    });

    setCurrentLetters(startingLetters);
    setInitialLetters(wrongLetters); // Store the wrong letters for toggling
    setFlipping({});
    setFlipDirection({});
    setHintsUsed(0);
    setGameState('playing');
    setStartTime(Date.now());
    setEndTime(null);
    setFlipCount(0);
  }, []);

  useEffect(() => {
    initGame();
  }, []);

  // Check win condition
  useEffect(() => {
    if (!targetText || gameState !== 'playing') return;

    const isComplete = currentLetters.every((letter, idx) => {
      return letter === targetText[idx];
    });

    if (isComplete && currentLetters.length > 0) {
      setGameState('won');
      setEndTime(Date.now());
    }
  }, [currentLetters, targetText, gameState]);

  const handleGiveUp = () => {
    if (!targetText || gameState !== 'playing') return;
    setCurrentLetters([...targetText]);
    setGameState('gaveUp');
    setEndTime(Date.now());
  };

  const handleFlip = (index, direction = 'up') => {
    if (gameState !== 'playing') return;
    if (!/[A-Z]/.test(targetText[index])) return;

    // Start flip animation
    setFlipping(prev => ({ ...prev, [index]: true }));
    setFlipDirection(prev => ({ ...prev, [index]: direction }));

    // Update letter after animation starts - toggle between initial (wrong) and target (correct)
    setTimeout(() => {
      setCurrentLetters(prev => {
        const newLetters = [...prev];
        const wrongLetter = initialLetters[index];
        const correctLetter = targetText[index];
        // Toggle between the two letters
        newLetters[index] = prev[index] === wrongLetter ? correctLetter : wrongLetter;
        return newLetters;
      });
      setFlipCount(prev => prev + 1);
    }, 150);

    // End flip animation
    setTimeout(() => {
      setFlipping(prev => ({ ...prev, [index]: false }));
    }, 300);
  };

  const handleKeyDown = (e, index) => {
    if (gameState !== 'playing') return;
    if (!/[A-Z]/.test(targetText[index])) return;

    if (e.key === 'ArrowUp' || e.key === 'w') {
      e.preventDefault();
      handleFlip(index, 'up');
    } else if (e.key === 'ArrowDown' || e.key === 's') {
      e.preventDefault();
      handleFlip(index, 'down');
    }
  };

  const getHint = () => {
    if (gameState !== 'playing') return;

    // Find positions that are wrong
    const wrongPositions = currentLetters
      .map((letter, idx) => ({ letter, idx, target: targetText[idx] }))
      .filter(({ letter, target }) => /[A-Z]/.test(target) && letter !== target);

    if (wrongPositions.length === 0) return;

    // Reveal one random wrong position
    const randomPos = wrongPositions[Math.floor(Math.random() * wrongPositions.length)];

    setFlipping(prev => ({ ...prev, [randomPos.idx]: true }));
    setFlipDirection(prev => ({ ...prev, [randomPos.idx]: 'up' }));

    setTimeout(() => {
      setCurrentLetters(prev => {
        const newLetters = [...prev];
        newLetters[randomPos.idx] = randomPos.target;
        return newLetters;
      });
    }, 150);

    setTimeout(() => {
      setFlipping(prev => ({ ...prev, [randomPos.idx]: false }));
    }, 300);

    setHintsUsed(prev => prev + 1);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPuzzle = () => {
    if (!targetText) return null;

    const words = [];
    let currentWord = [];
    let charIndex = 0;

    for (const char of targetText) {
      if (char === ' ') {
        if (currentWord.length > 0) {
          words.push({ chars: currentWord, startIdx: charIndex - currentWord.length });
          currentWord = [];
        }
      } else {
        currentWord.push({ char, idx: charIndex });
      }
      charIndex++;
    }
    if (currentWord.length > 0) {
      words.push({ chars: currentWord, startIdx: charIndex - currentWord.length });
    }

    return (
      <div className={styles.puzzleText}>
        {words.map((word, wordIndex) => {
          // Check if the entire word is correct (all letters match target)
          const isWordComplete = word.chars.every(({ char, idx }) => {
            if (!/[A-Z]/.test(char)) return true; // Non-letters always match
            return currentLetters[idx] === char;
          });

          return (
          <span key={wordIndex} className={styles.word}>
            {word.chars.map(({ char, idx }) => {
              const isLetter = /[A-Z]/.test(char);
              const currentLetter = currentLetters[idx];
              // Only mark as correct if the entire word is complete
              const isCorrect = isWordComplete && currentLetter === char;
              const isFlipping = flipping[idx];
              const direction = flipDirection[idx] || 'up';

              if (!isLetter) {
                return (
                  <span key={idx} className={styles.punctuation}>
                    {char}
                  </span>
                );
              }

              return (
                <div
                  key={idx}
                  className={`${styles.tileContainer} ${isCorrect ? styles.correct : ''}`}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <button
                    className={styles.flipArrow}
                    onClick={() => handleFlip(idx, 'up')}
                    aria-label="Next letter"
                  >
                    ▲
                  </button>
                  <div
                    className={`${styles.tile} ${isFlipping ? styles.flipping : ''} ${direction === 'down' ? styles.flipDown : ''}`}
                    onClick={() => handleFlip(idx, 'up')}
                  >
                    <span className={styles.letter}>{currentLetter}</span>
                  </div>
                  <button
                    className={styles.flipArrow}
                    onClick={() => handleFlip(idx, 'down')}
                    aria-label="Previous letter"
                  >
                    ▼
                  </button>
                </div>
              );
            })}
            {wordIndex < words.length - 1 && <span className={styles.space}> </span>}
          </span>
        );})}
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

  const timeTaken = endTime ? endTime - startTime : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Fliptogram</h1>
        <p className={styles.instructions}>
          Flip each tile to toggle between two letters and reveal the hidden quote!
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.puzzleContainer}>
          {renderPuzzle()}

          {gameState === 'won' && (
            <div className={styles.authorReveal}>
              — {quote.author}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Flips</span>
              <span className={styles.statValue}>{flipCount}</span>
            </div>
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

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winTitle}>🎉 Puzzle Solved!</div>
            <div className={styles.winStats}>
              Time: {formatTime(timeTaken)} • Flips: {flipCount} • Hints: {hintsUsed}
            </div>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <span className={styles.gaveUpIcon}>📖</span>
            <span>Solution Revealed</span>
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            className={styles.giveUpBtn}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
          <button className={styles.newGameBtn} onClick={() => initGame(false)}>
            New Random Puzzle
          </button>
          <button className={styles.dailyBtn} onClick={() => initGame(true)}>
            Today's Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
