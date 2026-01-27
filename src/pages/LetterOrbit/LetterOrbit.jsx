import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import GiveUpButton from '../../components/GiveUpButton/GiveUpButton';
import GameResult from '../../components/GameResult';
import {
  isValidWord,
  findAllWordsFromLetters,
  createSeededRandom,
  getTodayDateString,
  stringToSeed,
  getCommonWordsByLength
} from '../../data/wordUtils';
import styles from './LetterOrbit.module.css';

// Get seed from URL query parameter
function getSeedFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get('seed');
  if (seedParam) {
    const seedNum = parseInt(seedParam, 10);
    return isNaN(seedNum) ? stringToSeed(seedParam) : seedNum;
  }
  return null;
}

const NUM_ORBITS = 4;
const LETTERS_PER_ORBIT = 3;

// Check if a word matches the orbit order (inner to outer or outer to inner)
function matchesOrbitOrder(word, orbits) {
  if (word.length !== NUM_ORBITS) return false;

  // Try inner to outer (0 → 1 → 2 → 3)
  let matchesInnerOuter = true;
  for (let i = 0; i < NUM_ORBITS; i++) {
    if (!orbits[i].includes(word[i])) {
      matchesInnerOuter = false;
      break;
    }
  }

  // Try outer to inner (3 → 2 → 1 → 0)
  let matchesOuterInner = true;
  for (let i = 0; i < NUM_ORBITS; i++) {
    const orbitIdx = NUM_ORBITS - 1 - i;
    if (!orbits[orbitIdx].includes(word[i])) {
      matchesOuterInner = false;
      break;
    }
  }

  return matchesInnerOuter || matchesOuterInner;
}

// Generate puzzle with guaranteed word using letters in orbit order
function generatePuzzle(seed) {
  const random = createSeededRandom(seed);
  const maxAttempts = 1000;

  // Get common 4-letter words to use as the first word
  const commonWords = getCommonWordsByLength(NUM_ORBITS);
  if (commonWords.length === 0) {
    // Fallback if no common words
    return generatePuzzleFallback(seed);
  }

  // Shuffle common words using seeded random
  const shuffledCommonWords = [...commonWords];
  for (let i = shuffledCommonWords.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledCommonWords[i], shuffledCommonWords[j]] = [shuffledCommonWords[j], shuffledCommonWords[i]];
  }

  // Try common words first
  for (const targetWord of shuffledCommonWords.slice(0, Math.min(200, shuffledCommonWords.length))) {
    // Generate orbits that can form this word (either inner→outer or outer→inner)
    const orbits = generateOrbitsForWord(targetWord, random);

    if (!orbits) continue; // Skip if we couldn't generate valid orbits

    const allLetters = orbits.flat();

    // Find all 4-letter words that match orbit order (inner→outer or outer→inner)
    const validWords = [];
    for (const word of findAllWordsFromLetters(allLetters, 4)) {
      if (word.length !== NUM_ORBITS) continue;

      if (matchesOrbitOrder(word, orbits)) {
        validWords.push(word);
      }
    }

    // If we found at least the target word, this is a valid puzzle
    if (validWords.length > 0) {
      return {
        orbits,
        allLetters,
        allWords: validWords,
      };
    }
  }

  // Fallback to random generation if common words didn't work
  return generatePuzzleFallback(seed);
}

// Generate orbits for a target word (either inner→outer or outer→inner)
function generateOrbitsForWord(word, random) {
  if (word.length !== NUM_ORBITS) return null;

  const allLetters = word.split('');
  const usedLetters = new Set(allLetters);
  const orbits = [];

  // Try inner→outer first (word[0] in orbit[0], word[1] in orbit[1], etc.)
  for (let orbitIdx = 0; orbitIdx < NUM_ORBITS; orbitIdx++) {
    const orbitLetters = [word[orbitIdx]]; // First letter from word
    const remainingLetters = [];

    // Add 2 more random letters (not already used, not duplicates)
    let added = 1;
    let attempts = 0;
    while (added < LETTERS_PER_ORBIT && attempts < 200) {
      const letter = String.fromCharCode(65 + Math.floor(random() * 26));
      if (!usedLetters.has(letter) && !orbitLetters.includes(letter)) {
        orbitLetters.push(letter);
        usedLetters.add(letter);
        added++;
      }
      attempts++;
    }

    // If we couldn't find enough unique letters, fill with any available
    while (added < LETTERS_PER_ORBIT) {
      for (let c = 65; c <= 90; c++) {
        const l = String.fromCharCode(c);
        if (!usedLetters.has(l) && !orbitLetters.includes(l)) {
          orbitLetters.push(l);
          usedLetters.add(l);
          added++;
          break;
        }
      }
    }

    // Shuffle letters in orbit
    for (let i = orbitLetters.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [orbitLetters[i], orbitLetters[j]] = [orbitLetters[j], orbitLetters[i]];
    }

    orbits.push(orbitLetters);
  }

  return orbits;
}

// Fallback generation if common words don't work
function generatePuzzleFallback(seed) {
  const random = createSeededRandom(seed);
  const allLetters = [];
  const usedLetters = new Set();
  const orbits = [];

  for (let orbitIdx = 0; orbitIdx < NUM_ORBITS; orbitIdx++) {
    const orbitLetters = [];
    for (let i = 0; i < LETTERS_PER_ORBIT; i++) {
      let letter;
      for (let c = 65; c <= 90; c++) {
        const l = String.fromCharCode(c);
        if (!usedLetters.has(l)) {
          letter = l;
          usedLetters.add(l);
          break;
        }
      }
      orbitLetters.push(letter);
      allLetters.push(letter);
    }
    orbits.push(orbitLetters);
  }

  // Find valid words for fallback
  const validWords = [];
  for (const word of findAllWordsFromLetters(allLetters, 4)) {
    if (word.length !== NUM_ORBITS) continue;
    if (matchesOrbitOrder(word, orbits)) {
      validWords.push(word);
    }
  }

  return {
    orbits,
    allLetters,
    allWords: validWords,
  };
}

// Export for testing
export { generatePuzzle, NUM_ORBITS, LETTERS_PER_ORBIT, matchesOrbitOrder };

export default function LetterOrbit() {
  const { t } = useTranslation();
  const [puzzle, setPuzzle] = useState(null);
  const [foundWords, setFoundWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [seed, setSeed] = useState(null);
  const [showAllWords, setShowAllWords] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const initGame = useCallback((customSeed = null) => {
    const today = getTodayDateString();
    const urlSeed = getSeedFromUrl();
    let gameSeed;

    if (customSeed !== null) {
      gameSeed = customSeed;
    } else if (urlSeed !== null) {
      gameSeed = urlSeed;
    } else {
      // Generate a unique seed using timestamp to ensure new puzzles
      gameSeed = stringToSeed(`letterorbit-${today}-${Date.now()}`);
    }

    const newPuzzle = generatePuzzle(gameSeed);
    setPuzzle(newPuzzle);
    setSeed(gameSeed);
    setFoundWords([]);
    setCurrentWord('');
    setMessage({ text: '', type: '' });
    setShowAllWords(false);
    setGaveUp(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const clearWord = () => {
    setCurrentWord('');
    setMessage({ text: '', type: '' });
  };

  const submitWord = () => {
    const word = currentWord.toUpperCase().trim();

    if (word.length !== NUM_ORBITS) {
      setMessage({ text: `Word must be exactly ${NUM_ORBITS} letters`, type: 'error' });
      return;
    }

    if (!isValidWord(word)) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      return;
    }

    // Check if word matches orbit order (inner→outer or outer→inner)
    if (!matchesOrbitOrder(word, puzzle.orbits)) {
      setMessage({
        text: `Word must use letters in order: inner→outer OR outer→inner (not other combinations)`,
        type: 'error'
      });
      return;
    }

    // Check if word is in the valid word list
    if (!puzzle.allWords.includes(word)) {
      setMessage({ text: 'Word not found in puzzle', type: 'error' });
      return;
    }

    if (foundWords.includes(word)) {
      setMessage({ text: 'Already found!', type: 'error' });
      return;
    }

    // Determine direction
    const isInnerOuter = puzzle.orbits.every((orbit, i) => orbit.includes(word[i]));
    const direction = isInnerOuter ? 'inner→outer' : 'outer→inner';

    setFoundWords(prev => [...prev, word].sort((a, b) => a.localeCompare(b)));

    setMessage({ text: `🎉 Great! Found "${word}" (${direction})!`, type: 'success' });

    setCurrentWord('');
  };

  const calculateScore = () => {
    return foundWords.length * 10; // Simple scoring - 10 points per word
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    setShowAllWords(true);
    setMessage({ text: '', type: '' });
  };

  const gameWon = foundWords.length === puzzle?.allWords.length;

  if (!puzzle) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Letter Orbit"
        instructions={`Type ${NUM_ORBITS}-letter words using letters in order: inner→outer OR outer→inner (one letter from each orbit in sequence)`}
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      />

      <div className={styles.headerActions}>
        {seed !== null && (
          <SeedDisplay
            seed={seed}
            variant="compact"
            showNewButton={false}
            showShare={true}
            onSeedChange={(newSeed) => {
              const seedNum = typeof newSeed === 'string'
                ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
                : newSeed;
              initGame(seedNum);
            }}
          />
        )}
        <button
          className={styles.newGameBtn}
          onClick={() => {
            // Force new puzzle by generating unique seed (ignore URL seed)
            const today = getTodayDateString();
            const gameSeed = stringToSeed(`letterorbit-${today}-${Date.now()}`);
            initGame(gameSeed);
          }}
        >
          New Game
        </button>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.orbitsSection}>
          <div className={styles.orbitsContainer}>
            {puzzle.orbits.map((orbit, orbitIdx) => (
              <div
                key={orbitIdx}
                className={styles.orbit}
                style={{ '--orbit-index': orbitIdx }}
              >
                {orbit.map((letter, letterIdx) => {
                  // Check if this specific letter is used in current word
                  let isUsed = false;

                  // Check inner→outer: letter at position orbitIdx should be from this orbit
                  if (currentWord.length > orbitIdx && currentWord[orbitIdx] === letter) {
                    isUsed = true;
                  }

                  // Check outer→inner: letter at position (NUM_ORBITS-1-orbitIdx) should be from this orbit
                  const reversePos = NUM_ORBITS - 1 - orbitIdx;
                  if (!isUsed && currentWord.length > reversePos && currentWord[reversePos] === letter) {
                    isUsed = true;
                  }

                  return (
                    <button
                      key={`${orbitIdx}-${letterIdx}`}
                      className={`${styles.letter} ${isUsed ? styles.selected : ''}`}
                      onClick={() => {
                        // Append letter to current word
                        if (currentWord.length < NUM_ORBITS) {
                          setCurrentWord(prev => prev + letter);
                        }
                      }}
                      style={{
                        '--angle': `${(letterIdx * 360) / LETTERS_PER_ORBIT}deg`,
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.inputArea}>
            <input
              type="text"
              className={styles.currentWord}
              value={currentWord}
              onChange={(e) => {
                // Just let them type - no auto-assignment
                const typed = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, NUM_ORBITS);
                setCurrentWord(typed);
                setMessage({ text: '', type: '' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitWord();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  clearWord();
                }
              }}
              placeholder={`Type ${NUM_ORBITS} letters (inner→outer or outer→inner)...`}
              maxLength={NUM_ORBITS}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />

            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <div className={styles.buttons}>
              <button className={styles.btn} onClick={clearWord}>Clear</button>
              <button className={styles.btn} onClick={() => setCurrentWord(prev => prev.slice(0, -1))}>⌫</button>
              <button className={`${styles.btn} ${styles.submitBtn}`} onClick={submitWord}>
                Submit
              </button>
            </div>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('gameStatus.score')}:</span>
              <span className={styles.statValue}>{calculateScore()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Words Found:</span>
              <span className={styles.statValue}>{foundWords.length} / {puzzle.allWords.length}</span>
            </div>
          </div>

          <div className={styles.wordsList}>
            <div className={styles.wordsHeader}>
              <h3>{t('common.foundWords')}</h3>
              {!gaveUp && (
                <button
                  className={styles.toggleBtn}
                  onClick={() => setShowAllWords(!showAllWords)}
                >
                  {showAllWords ? 'Hide' : 'Show'} All Words
                </button>
              )}
            </div>
            <div className={styles.words}>
              {(showAllWords || gaveUp ? puzzle.allWords : foundWords).map((word, idx) => {
                const isFound = foundWords.includes(word);
                const isInnerOuter = puzzle.orbits.every((orbit, i) => orbit.includes(word[i]));
                const direction = isInnerOuter ? '→' : '←';

                return (
                  <div
                    key={idx}
                    className={`${styles.word} ${isFound ? styles.found : ''} ${gaveUp && !isFound ? styles.revealed : ''} ${styles.spanning}`}
                  >
                    <WordWithDefinition word={word} /> <span className={styles.direction}>{direction}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {gameWon && (
        <GameResult
          state="won"
          title={t('gameStatus.congratulations')}
          message={t('common.allWordsFound', `You found all ${puzzle.allWords.length} words!`)}
        />
      )}

      {gaveUp && !gameWon && (
        <GameResult
          state="gaveup"
          title={t('common.solutionRevealed', 'Solution Revealed')}
          message={t('common.tryAnotherPuzzle', 'All words are now shown. Try another puzzle!')}
        />
      )}

      <div className={styles.bottomControls}>
        {!gameWon && !gaveUp && (
          <GiveUpButton onGiveUp={handleGiveUp} />
        )}
      </div>
    </div>
  );
}