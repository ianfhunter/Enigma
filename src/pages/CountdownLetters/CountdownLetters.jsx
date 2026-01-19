import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  shuffleArray,
  isValidCountdownWord,
  getLongestWordsFromLetters,
  findAllWordsFromLetters
} from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './CountdownLetters.module.css';

// Letter distributions (based on Scrabble/Countdown)
const VOWEL_POOL = [
  'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A',
  'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',
  'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I',
  'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O',
  'U', 'U', 'U', 'U',
];

const CONSONANT_POOL = [
  'B', 'B',
  'C', 'C', 'C',
  'D', 'D', 'D', 'D',
  'F', 'F',
  'G', 'G', 'G',
  'H', 'H',
  'J',
  'K',
  'L', 'L', 'L', 'L',
  'M', 'M', 'M',
  'N', 'N', 'N', 'N', 'N', 'N',
  'P', 'P', 'P',
  'Q',
  'R', 'R', 'R', 'R', 'R', 'R',
  'S', 'S', 'S', 'S',
  'T', 'T', 'T', 'T', 'T', 'T',
  'V', 'V',
  'W', 'W',
  'X',
  'Y', 'Y',
  'Z',
];

const GAME_TIME = 30; // 30 seconds like real Countdown
const TOTAL_LETTERS = 9;
const MIN_VOWELS = 3;
const MIN_CONSONANTS = 4;

export default function CountdownLetters() {
  const [gameState, setGameState] = useState('selecting'); // 'selecting', 'playing', 'finished'
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [vowelPool, setVowelPool] = useState([]);
  const [consonantPool, setConsonantPool] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [submittedWord, setSubmittedWord] = useState(null);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [bestWords, setBestWords] = useState([]);
  const [showAllWords, setShowAllWords] = useState(false);
  const [allValidWords, setAllValidWords] = useState([]);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize letter pools
  const initializePools = useCallback(() => {
    setVowelPool(shuffleArray([...VOWEL_POOL]));
    setConsonantPool(shuffleArray([...CONSONANT_POOL]));
  }, []);

  // Start a new game
  const initializeGame = useCallback(() => {
    setSelectedLetters([]);
    setCurrentWord('');
    setSubmittedWord(null);
    setTimeLeft(GAME_TIME);
    setGameState('selecting');
    setMessage({ text: '', type: '' });
    setBestWords([]);
    setShowAllWords(false);
    setAllValidWords([]);
    initializePools();
  }, [initializePools]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      finishGame();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft]);

  // Calculate vowel and consonant counts
  const vowelCount = selectedLetters.filter(l => 'AEIOU'.includes(l)).length;
  const consonantCount = selectedLetters.length - vowelCount;
  const remainingPicks = TOTAL_LETTERS - selectedLetters.length;

  // Can we pick more vowels? Need to leave room for minimum consonants
  const canPickVowel = vowelCount < (TOTAL_LETTERS - MIN_CONSONANTS) && remainingPicks > 0;
  // Can we pick more consonants? Need to leave room for minimum vowels
  const canPickConsonant = consonantCount < (TOTAL_LETTERS - MIN_VOWELS) && remainingPicks > 0;

  const pickVowel = () => {
    if (!canPickVowel || vowelPool.length === 0) return;

    const letter = vowelPool[0];
    setVowelPool(prev => prev.slice(1));
    setSelectedLetters(prev => [...prev, letter]);
  };

  const pickConsonant = () => {
    if (!canPickConsonant || consonantPool.length === 0) return;

    const letter = consonantPool[0];
    setConsonantPool(prev => prev.slice(1));
    setSelectedLetters(prev => [...prev, letter]);
  };

  const startGame = () => {
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const finishGame = useCallback(() => {
    setGameState('finished');

    // Find the best possible words
    const longest = getLongestWordsFromLetters(selectedLetters);
    setBestWords(longest);

    // Get all valid words for "show all" feature
    const allWords = findAllWordsFromLetters(selectedLetters, 3);
    setAllValidWords(allWords);

    // Validate submitted word
    if (submittedWord) {
      if (isValidCountdownWord(submittedWord, selectedLetters)) {
        const wordLength = submittedWord.length;
        const maxLength = longest.length > 0 ? longest[0].length : 0;

        if (wordLength === 9) {
          setMessage({ text: '🎉 Perfect! 9-letter word for 18 points!', type: 'success' });
        } else if (wordLength === maxLength) {
          setMessage({ text: `✨ Excellent! You found the longest word!`, type: 'success' });
        } else {
          setMessage({ text: `Good word! ${wordLength} points`, type: 'success' });
        }
      } else {
        setMessage({ text: 'Invalid word - no points', type: 'error' });
        setSubmittedWord(null);
      }
    }
  }, [selectedLetters, submittedWord]);

  // Track which letters are used in current input
  const getUsedIndices = useCallback(() => {
    const usedIndices = new Set();
    const tempLetters = [...selectedLetters];

    for (const char of currentWord) {
      const idx = tempLetters.findIndex((l, i) => l === char && !usedIndices.has(i));
      if (idx !== -1) {
        usedIndices.add(idx);
      }
    }

    return usedIndices;
  }, [currentWord, selectedLetters]);

  const canAddLetter = useCallback((char) => {
    const upperChar = char.toUpperCase();
    const availableCount = selectedLetters.filter(l => l === upperChar).length;
    const usedCount = currentWord.split('').filter(c => c === upperChar).length;
    return usedCount < availableCount;
  }, [currentWord, selectedLetters]);

  const handleInputChange = (e) => {
    const newValue = e.target.value.toUpperCase();

    if (newValue.length < currentWord.length) {
      setCurrentWord(newValue);
      setMessage({ text: '', type: '' });
      return;
    }

    if (newValue.length > currentWord.length) {
      const newChar = newValue[newValue.length - 1];
      if (canAddLetter(newChar)) {
        setCurrentWord(newValue);
        setMessage({ text: '', type: '' });
      }
    }
  };

  const submitWord = () => {
    if (currentWord.length < 3) {
      setMessage({ text: 'Word must be at least 3 letters', type: 'error' });
      return;
    }

    // Don't validate here - let the player lock in any word, validation happens at end of game
    setSubmittedWord(currentWord);
    setMessage({ text: `✓ "${currentWord}" locked in! (will be checked at end)`, type: 'success' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && gameState === 'playing') {
      e.preventDefault();
      submitWord();
    }
  };

  const calculateScore = () => {
    if (!submittedWord || gameState !== 'finished') return 0;
    if (!isValidCountdownWord(submittedWord, selectedLetters)) return 0;

    // 9-letter word gets double points (18)
    if (submittedWord.length === 9) return 18;
    return submittedWord.length;
  };

  const getTimerClass = () => {
    if (timeLeft <= 5) return styles.timerCritical;
    if (timeLeft <= 10) return styles.timerWarning;
    return '';
  };

  const usedIndices = getUsedIndices();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Countdown Letters</h1>
        <p className={styles.instructions}>
          {gameState === 'selecting'
            ? `Pick ${TOTAL_LETTERS} letters (at least ${MIN_VOWELS} vowels and ${MIN_CONSONANTS} consonants)`
            : 'Find the longest word using the available letters!'
          }
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.mainSection}>
          {/* Timer - only show during play and after */}
          {gameState !== 'selecting' && (
            <div className={`${styles.timer} ${getTimerClass()}`}>
              <span className={styles.timerIcon}>⏱️</span>
              <span className={styles.timerValue}>{timeLeft}s</span>
            </div>
          )}

          {/* Letter Selection Panel */}
          {gameState === 'selecting' && (
            <div className={styles.selectionPanel}>
              <div className={styles.selectionInfo}>
                <span>Vowels: {vowelCount}</span>
                <span>Consonants: {consonantCount}</span>
                <span>Remaining: {remainingPicks}</span>
              </div>

              <div className={styles.selectionButtons}>
                <button
                  className={`${styles.pickBtn} ${styles.vowelBtn}`}
                  onClick={pickVowel}
                  disabled={!canPickVowel}
                >
                  Vowel
                </button>
                <button
                  className={`${styles.pickBtn} ${styles.consonantBtn}`}
                  onClick={pickConsonant}
                  disabled={!canPickConsonant}
                >
                  Consonant
                </button>
              </div>
            </div>
          )}

          {/* Letter Display */}
          <div className={styles.letterSection}>
            <div className={styles.letterGrid}>
              {Array.from({ length: TOTAL_LETTERS }).map((_, index) => (
                <div
                  key={index}
                  className={`${styles.letterTile} ${
                    selectedLetters[index] ? styles.filled : styles.empty
                  } ${usedIndices.has(index) && gameState === 'playing' ? styles.used : ''}`}
                >
                  {selectedLetters[index] || '?'}
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          {gameState === 'selecting' && selectedLetters.length === TOTAL_LETTERS && (
            <button className={styles.startBtn} onClick={startGame}>
              Start Clock
            </button>
          )}

          {/* Input Area */}
          {gameState === 'playing' && (
            <div className={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                value={currentWord}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.wordInput}
                placeholder="Type your word..."
                autoComplete="off"
                autoCapitalize="characters"
              />
              <div className={styles.inputButtons}>
                <button className={styles.btn} onClick={() => setCurrentWord('')}>
                  Clear
                </button>
                <button
                  className={`${styles.btn} ${styles.submitBtn}`}
                  onClick={submitWord}
                  disabled={currentWord.length < 3}
                >
                  Lock In
                </button>
                <button
                  className={`${styles.btn} ${styles.giveUpBtn}`}
                  onClick={() => finishGame()}
                >
                  Give Up
                </button>
              </div>

              {submittedWord && (
                <div className={styles.lockedWord}>
                  Locked: <strong>{submittedWord}</strong> ({submittedWord.length} pts if valid)
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {/* Results */}
          {gameState === 'finished' && (
            <div className={styles.resultArea}>
              <div className={styles.finalScore}>
                <div className={styles.scoreLabel}>Your Score</div>
                <div className={styles.scoreValue}>{calculateScore()}</div>
                {submittedWord && (
                  <div className={styles.yourWord}>
                    Your word: <strong>{submittedWord}</strong>
                  </div>
                )}
              </div>

              <button className={styles.newGameBtn} onClick={initializeGame}>
                New Game
              </button>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          {gameState === 'selecting' && (
            <div className={styles.rulesPanel}>
              <h4>How to Play</h4>
              <ul>
                <li>Pick <strong>9 letters</strong> - vowels or consonants</li>
                <li>You must have at least <strong>3 vowels</strong></li>
                <li>You must have at least <strong>4 consonants</strong></li>
                <li>You have <strong>30 seconds</strong> to find the longest word</li>
                <li>Longer words = more points!</li>
                <li>9-letter words score <strong>18 points</strong> (double!)</li>
              </ul>
            </div>
          )}

          {gameState === 'playing' && (
            <div className={styles.scorePanel}>
              <div className={styles.scoreItem}>
                <span className={styles.scoreLabelSmall}>Current Word</span>
                <span className={styles.scoreValueBig}>{currentWord.length || '-'}</span>
                <span className={styles.scoreLabelSmall}>letters</span>
              </div>
              {submittedWord && (
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabelSmall}>Locked</span>
                  <span className={styles.scoreValueBig}>{submittedWord.length}?</span>
                  <span className={styles.scoreLabelSmall}>pending</span>
                </div>
              )}
            </div>
          )}

          {gameState === 'finished' && (
            <>
              <div className={styles.dictionaryCorner}>
                <h4>📖 Dictionary Corner</h4>
                <p className={styles.bestWordLabel}>
                  Best possible {bestWords.length > 1 ? 'words' : 'word'} ({bestWords[0]?.length || 0} letters):
                </p>
                <div className={styles.bestWords}>
                  {bestWords.slice(0, 5).map((word, i) => (
                    <span key={word} className={styles.bestWord}>
                      {word}
                    </span>
                  ))}
                  {bestWords.length > 5 && (
                    <span className={styles.moreWords}>+{bestWords.length - 5} more</span>
                  )}
                </div>
              </div>

              <button
                className={styles.showAllBtn}
                onClick={() => setShowAllWords(!showAllWords)}
              >
                {showAllWords ? 'Hide All Words' : `Show All Words (${allValidWords.length})`}
              </button>

              {showAllWords && (
                <div className={styles.allWordsPanel}>
                  <h4>All Valid Words</h4>
                  <div className={styles.wordsByLength}>
                    {Object.entries(
                      allValidWords.reduce((acc, word) => {
                        const len = word.length;
                        if (!acc[len]) acc[len] = [];
                        acc[len].push(word);
                        return acc;
                      }, {})
                    ).sort((a, b) => b[0] - a[0]).map(([length, words]) => (
                      <div key={length} className={styles.lengthGroup}>
                        <h5>{length} letters ({words.length})</h5>
                        <div className={styles.wordList}>
                          {words.slice(0, 20).map(word => (
                            <WordWithDefinition
                              key={word}
                              word={word}
                              className={`${styles.wordItem} ${
                                submittedWord === word ? styles.matched : ''
                              }`}
                            />
                          ))}
                          {words.length > 20 && (
                            <span className={styles.moreWords}>+{words.length - 20} more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
