import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isValidWord, generateConundrum, shuffleArray } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './Conundrum.module.css';

const GAME_TIME = 30; // seconds

export default function Conundrum() {
  const [puzzle, setPuzzle] = useState(null);
  const [displayLetters, setDisplayLetters] = useState([]);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'won', 'lost'
  const [message, setMessage] = useState({ text: '', type: '' });
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const initializePuzzle = useCallback(() => {
    const newPuzzle = generateConundrum();
    setPuzzle(newPuzzle);
    setDisplayLetters(newPuzzle.scrambled.split(''));
    setGuess('');
    setTimeLeft(GAME_TIME);
    setGameState('ready');
    setMessage({ text: '', type: '' });
  }, []);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      // Time's up!
      setGameState('lost');
      setMessage({ text: `Time's up! The word was ${puzzle.word}`, type: 'error' });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft, puzzle]);

  const startGame = () => {
    setGameState('playing');
    inputRef.current?.focus();
  };

  const giveUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState('lost');
    setMessage({ text: `The word was ${puzzle.word}`, type: 'error' });
  };

  const shuffleDisplayLetters = () => {
    setDisplayLetters(shuffleArray(displayLetters));
  };

  // Calculate which display letter indices are used by the current guess
  const getUsedIndices = useCallback(() => {
    const usedIndices = new Set();
    const availableIndices = displayLetters.map((_, i) => i);

    for (const char of guess) {
      // Find the first available index with this letter
      const matchIdx = availableIndices.findIndex(
        idx => displayLetters[idx] === char && !usedIndices.has(idx)
      );
      if (matchIdx !== -1) {
        usedIndices.add(availableIndices[matchIdx]);
      }
    }

    return usedIndices;
  }, [guess, displayLetters]);

  // Check if a new character can be added to the guess
  const canAddLetter = useCallback((newChar) => {
    const upperChar = newChar.toUpperCase();
    const currentGuessChars = guess.split('');

    // Count how many times this letter appears in display
    const availableCount = displayLetters.filter(l => l === upperChar).length;
    // Count how many times it's already used in the guess
    const usedCount = currentGuessChars.filter(c => c === upperChar).length;

    return usedCount < availableCount;
  }, [guess, displayLetters]);

  // Handle input change with validation
  const handleInputChange = (e) => {
    const newValue = e.target.value.toUpperCase();
    const currentValue = guess;

    // If deleting, always allow
    if (newValue.length < currentValue.length) {
      setGuess(newValue);
      setMessage({ text: '', type: '' });
      return;
    }

    // If adding a character, validate it
    if (newValue.length > currentValue.length) {
      const newChar = newValue[newValue.length - 1];

      // Check if this letter exists in the puzzle and is still available
      if (canAddLetter(newChar)) {
        setGuess(newValue);
        setMessage({ text: '', type: '' });
      }
      // Silently reject invalid letters
    }
  };

  const submitGuess = () => {
    const upperGuess = guess.toUpperCase().trim();

    if (upperGuess.length !== 9) {
      setMessage({ text: 'Enter a 9-letter word', type: 'error' });
      return;
    }

    if (!isValidWord(upperGuess)) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      return;
    }

    // Correct guess!
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState('won');

    if (upperGuess === puzzle.word) {
      setMessage({ text: '🎉 Brilliant! You found it!', type: 'success' });
    } else {
      setMessage({ text: `🎉 Well done! (Expected: ${puzzle.word})`, type: 'success' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && gameState === 'playing') {
      e.preventDefault();
      submitGuess();
    }
  };

  const usedIndices = getUsedIndices();

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeLeft <= 5) return styles.timerCritical;
    if (timeLeft <= 10) return styles.timerWarning;
    return '';
  };

  if (!puzzle) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          ← Back to Games
        </Link>
        <h1 className={styles.title}>Conundrum</h1>
        <p className={styles.instructions}>
          Unscramble the nine letters to find the hidden word. You have {GAME_TIME} seconds!
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.puzzleSection}>
          <div className={`${styles.timer} ${getTimerClass()}`}>
            <div className={styles.timerLabel}>Time</div>
            <div className={styles.timerValue}>{formatTime(timeLeft)}</div>
          </div>

          <div className={styles.letterGrid}>
            {displayLetters.map((letter, index) => (
              <div
                key={`${letter}-${index}`}
                className={`${styles.letterTile} ${gameState !== 'ready' ? styles.revealed : ''} ${usedIndices.has(index) ? styles.used : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className={styles.letterContent}>
                  {gameState === 'ready' ? '?' : letter}
                </span>
              </div>
            ))}
          </div>

          {gameState === 'ready' && (
            <button className={styles.startBtn} onClick={startGame}>
              Start Conundrum
            </button>
          )}

          {gameState === 'playing' && (
            <div className={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.guessInput}
                placeholder="Type your answer..."
                maxLength={9}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <div className={styles.inputButtons}>
                <button className={styles.btn} onClick={shuffleDisplayLetters}>
                  Shuffle
                </button>
                <button className={`${styles.btn} ${styles.submitBtn}`} onClick={submitGuess}>
                  Submit
                </button>
                <button className={`${styles.btn} ${styles.giveUpBtn}`} onClick={giveUp}>
                  Give Up
                </button>
              </div>
            </div>
          )}

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {(gameState === 'won' || gameState === 'lost') && (
            <div className={styles.resultArea}>
              {gameState === 'won' && (
                <div className={styles.answerReveal}>
                  <div className={styles.answerLabel}>Answer</div>
                  <WordWithDefinition word={puzzle.word} className={styles.answerWordWrapper}>
                    <div className={styles.answerWord}>
                      {puzzle.word.split('').map((letter, i) => (
                        <span key={i} className={styles.answerLetter}>{letter}</span>
                      ))}
                    </div>
                  </WordWithDefinition>
                </div>
              )}
              {gameState === 'lost' && (
                <div className={styles.answerReveal}>
                  <div className={styles.answerLabel}>The answer was</div>
                  <WordWithDefinition word={puzzle.word} className={styles.answerWordWrapper}>
                    <div className={`${styles.answerWord} ${styles.missed}`}>
                      {puzzle.word.split('').map((letter, i) => (
                        <span key={i} className={styles.answerLetter}>{letter}</span>
                      ))}
                    </div>
                  </WordWithDefinition>
                </div>
              )}

              <button className={styles.newGameBtn} onClick={initializePuzzle}>
                New Conundrum
              </button>
            </div>
          )}
        </div>

        <div className={styles.howToPlay}>
          <h4>How to Play</h4>
          <ul>
            <li>Press "Start" to reveal the scrambled letters</li>
            <li>Rearrange all 9 letters to form a valid word</li>
            <li>Type your answer and submit before time runs out</li>
            <li>Use "Shuffle" to rearrange the display</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
