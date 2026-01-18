import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  generateAnagramsPuzzle,
  isValidAnagramGuess,
  shuffleArray,
  formatTime,
  canUseLetter,
  appendLetterIfAvailable,
} from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './Anagrams.module.css';

const GAME_TIME = 90; // 90 seconds per puzzle

export default function Anagrams() {
  const [puzzle, setPuzzle] = useState(null);
  const [displayLetters, setDisplayLetters] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'finished'
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAllWords, setShowAllWords] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const initializePuzzle = useCallback(() => {
    const newPuzzle = generateAnagramsPuzzle(4); // Minimum 4 anagrams
    setPuzzle(newPuzzle);
    setDisplayLetters(newPuzzle.letters);
    setCurrentWord('');
    setFoundWords([]);
    setTimeLeft(GAME_TIME);
    setGameState('ready');
    setMessage({ text: '', type: '' });
    setShowAllWords(false);
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
      setGameState('finished');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft]);

  // Auto-end game if all anagrams found
  useEffect(() => {
    if (puzzle && foundWords.length === puzzle.anagrams.length && gameState === 'playing') {
      setGameState('finished');
      setMessage({ text: '🎉 Perfect! You found all anagrams!', type: 'success' });
    }
  }, [foundWords, puzzle, gameState]);

  const startGame = () => {
    setGameState('playing');
    inputRef.current?.focus();
  };

  const shuffleDisplayLetters = () => {
    setDisplayLetters(shuffleArray(displayLetters));
  };

  // Track which letters are used in current input
  const getUsedIndices = useCallback(() => {
    const usedIndices = new Set();
    const tempLetters = [...displayLetters];

    for (const char of currentWord) {
      const idx = tempLetters.findIndex((l, i) => l === char && !usedIndices.has(i));
      if (idx !== -1) {
        usedIndices.add(idx);
      }
    }

    return usedIndices;
  }, [currentWord, displayLetters]);

  const handleInputChange = (e) => {
    const newValue = e.target.value.toUpperCase();

    if (newValue.length < currentWord.length) {
      setCurrentWord(newValue);
      setMessage({ text: '', type: '' });
      return;
    }

    if (newValue.length > currentWord.length) {
      const newChar = newValue[newValue.length - 1];
      if (canUseLetter(currentWord, newChar, displayLetters)) {
        setCurrentWord(newValue);
        setMessage({ text: '', type: '' });
      }
    }
  };

  const submitWord = () => {
    const word = currentWord.toUpperCase();

    if (word.length !== puzzle.wordLength) {
      setMessage({ text: `Must use all ${puzzle.wordLength} letters!`, type: 'error' });
      return;
    }

    if (foundWords.includes(word)) {
      setMessage({ text: 'Already found!', type: 'error' });
      setCurrentWord('');
      return;
    }

    if (!isValidAnagramGuess(word, displayLetters)) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      return;
    }

    // Valid anagram found!
    setFoundWords(prev => [...prev, word].sort());

    const remaining = puzzle.anagrams.length - foundWords.length - 1;
    if (remaining === 0) {
      setMessage({ text: '🎉 Perfect!', type: 'success' });
    } else if (remaining <= 2) {
      setMessage({ text: `✨ Great! ${remaining} more to go!`, type: 'success' });
    } else {
      setMessage({ text: '✓ Correct!', type: 'success' });
    }

    setCurrentWord('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && gameState === 'playing') {
      e.preventDefault();
      submitWord();
    }
  };

  const calculateScore = () => {
    // Score based on percentage of anagrams found + bonus for longer words
    const baseScore = foundWords.length * 10;
    const lengthBonus = puzzle ? foundWords.length * (puzzle.wordLength - 3) : 0;
    const perfectBonus = (puzzle && foundWords.length === puzzle.anagrams.length) ? 50 : 0;
    return baseScore + lengthBonus + perfectBonus;
  };

  const getTimerClass = () => {
    if (timeLeft <= 10) return styles.timerCritical;
    if (timeLeft <= 30) return styles.timerWarning;
    return '';
  };

  const handleLetterClick = (letter) => {
    if (gameState !== 'playing') return;

    setCurrentWord(prev => appendLetterIfAvailable(prev, letter, displayLetters));
    setMessage({ text: '', type: '' });
    inputRef.current?.focus();
  };

  const usedIndices = getUsedIndices();

  if (!puzzle) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Anagrams</h1>
        <p className={styles.instructions}>
          Rearrange the letters to find all {puzzle.anagrams.length} valid words that use ALL {puzzle.wordLength} letters!
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
              <button
                type="button"
                key={`${letter}-${index}`}
                className={`${styles.letterTile} ${usedIndices.has(index) ? styles.used : ''}`}
                onClick={() => handleLetterClick(letter)}
                disabled={gameState !== 'playing' || usedIndices.has(index)}
                aria-pressed={usedIndices.has(index)}
                aria-label={`Use letter ${letter}`}
              >
                {letter}
              </button>
            ))}
          </div>

          {gameState === 'ready' && (
            <button className={styles.startBtn} onClick={startGame}>
              Start Game
            </button>
          )}

          {gameState === 'playing' && (
            <div className={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                value={currentWord}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.wordInput}
                placeholder="Type a word..."
                autoComplete="off"
                autoCapitalize="characters"
              />
              <div className={styles.inputButtons}>
                <button className={styles.btn} onClick={shuffleDisplayLetters}>
                  Shuffle
                </button>
                <button className={styles.btn} onClick={() => setCurrentWord('')}>
                  Clear
                </button>
                <button className={`${styles.btn} ${styles.submitBtn}`} onClick={submitWord}>
                  Submit
                </button>
                <button className={`${styles.btn} ${styles.giveUpBtn}`} onClick={() => setGameState('finished')}>
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

          {gameState === 'finished' && (
            <div className={styles.resultArea}>
              <div className={styles.finalScore}>
                <div className={styles.scoreLabel}>Final Score</div>
                <div className={styles.scoreValue}>{calculateScore()}</div>
              </div>
              <div className={styles.wordsSummary}>
                Found {foundWords.length} of {puzzle.anagrams.length} anagrams
              </div>
              <button className={styles.newGameBtn} onClick={initializePuzzle}>
                New Game
              </button>
            </div>
          )}
        </div>

        <div className={styles.wordsSection}>
          <div className={styles.scorePanel}>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>Score</span>
              <span className={styles.scoreValue}>{calculateScore()}</span>
            </div>
            <div className={styles.wordCount}>
              <span className={styles.scoreLabel}>Found</span>
              <span className={styles.scoreValue}>{foundWords.length}/{puzzle.anagrams.length}</span>
            </div>
          </div>

          <div className={styles.foundWords}>
            <h3>Found Anagrams</h3>
            {foundWords.length === 0 ? (
              <p className={styles.noWords}>No anagrams found yet</p>
            ) : (
              <div className={styles.wordList}>
                {foundWords.map((word) => (
                  <span key={word} className={styles.word}>
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>

          {gameState === 'finished' && (
            <div className={styles.actions}>
              <button
                className={styles.revealBtn}
                onClick={() => setShowAllWords(!showAllWords)}
              >
                {showAllWords ? 'Hide Answers' : 'Show All Anagrams'}
              </button>
            </div>
          )}

          {showAllWords && (
            <div className={styles.allWords}>
              <h4>All Anagrams ({puzzle.anagrams.length})</h4>
              <div className={styles.wordList}>
                {puzzle.anagrams.map((word) => (
                  <WordWithDefinition
                    key={word}
                    word={word}
                    className={`${styles.word} ${foundWords.includes(word) ? styles.found : styles.missed}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
