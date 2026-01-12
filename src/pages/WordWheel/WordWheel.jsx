import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isValidWord, findAllWords, generatePuzzle, shuffleArray } from '../../data/wordUtils';
import { flagWord, getWordFeedback, unflagWord, FeedbackType } from '../../data/wordFeedback';
import styles from './WordWheel.module.css';

const STORAGE_KEY = 'wordwheel_puzzle';
const MODE_KEY = 'wordwheel_mode';

// Game modes
const MODES = {
  CLASSIC: { letters: 9, outer: 8, name: 'Classic', description: '9 letters' },
  SPELLING_BEE: { letters: 7, outer: 6, name: 'Spelling Bee', description: '7 letters' },
};

export default function WordWheel() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === 'SPELLING_BEE' ? 'SPELLING_BEE' : 'CLASSIC';
  });
  const [puzzle, setPuzzle] = useState(null);
  const [outerLetters, setOuterLetters] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [usedPositions, setUsedPositions] = useState([]); // Track which positions are used: { index, isCenter }
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [possibleWords, setPossibleWords] = useState([]);
  const [showAllWords, setShowAllWords] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (puzzle) {
      const gameState = {
        puzzle,
        outerLetters,
        foundWords,
        possibleWords,
        mode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [puzzle, outerLetters, foundWords, possibleWords, mode]);

  const createNewPuzzle = useCallback((newMode = mode) => {
    const modeConfig = MODES[newMode];
    // Generate a puzzle with at least 10 possible words
    const generatedPuzzle = generatePuzzle(10, 100, modeConfig.letters);

    if (!generatedPuzzle) {
      console.error('Failed to generate puzzle');
      return;
    }

    const { letters, center } = generatedPuzzle;
    // Only remove ONE instance of the center letter for outer letters
    const outer = [...letters];
    const centerIndex = outer.indexOf(center);
    if (centerIndex !== -1) {
      outer.splice(centerIndex, 1);
    }

    setPuzzle({ letters, center, letterCount: modeConfig.letters });
    setOuterLetters(shuffleArray(outer));
    setCurrentWord('');
    setUsedPositions([]);
    setFoundWords([]);
    setMessage({ text: '', type: '' });
    setShowAllWords(false);

    // Calculate possible words
    const words = findAllWords(letters, center);
    setPossibleWords(words);
    setSelectedWord(null);
    setFeedbackMap({});
  }, [mode]);

  // Load feedback for all words when showing all words
  useEffect(() => {
    if (showAllWords && possibleWords.length > 0) {
      const map = {};
      possibleWords.forEach(word => {
        const feedback = getWordFeedback(word);
        if (feedback) {
          map[word] = feedback;
        }
      });
      setFeedbackMap(map);
    }
  }, [showAllWords, possibleWords]);

  const handleWordClick = (word) => {
    setSelectedWord(selectedWord === word ? null : word);
  };

  const handleFlagWord = (word, type) => {
    flagWord(word, type);
    setFeedbackMap(prev => ({
      ...prev,
      [word]: getWordFeedback(word)
    }));
    setSelectedWord(null);
  };

  const handleUnflagWord = (word) => {
    unflagWord(word);
    setFeedbackMap(prev => {
      const updated = { ...prev };
      delete updated[word];
      return updated;
    });
    setSelectedWord(null);
  };

  // Load saved puzzle on mount, or create new one if none exists
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const gameState = JSON.parse(saved);
        // Check if saved puzzle matches current mode
        const savedMode = gameState.mode || 'CLASSIC';
        if (savedMode === mode) {
          setPuzzle(gameState.puzzle);
          setOuterLetters(gameState.outerLetters);
          setFoundWords(gameState.foundWords || []);
          setPossibleWords(gameState.possibleWords || []);
        } else {
          // Mode changed, create new puzzle
          createNewPuzzle();
        }
      } catch (e) {
        console.error('Failed to load saved puzzle:', e);
        createNewPuzzle();
      }
    } else {
      createNewPuzzle();
    }
  }, [createNewPuzzle, mode]);

  // Handle mode change
  const handleModeChange = (newMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      createNewPuzzle(newMode);
    }
  };

  const addLetter = (letter, index, isCenter = false) => {
    setCurrentWord(prev => prev + letter);
    setUsedPositions(prev => [...prev, { index, isCenter }]);
    setMessage({ text: '', type: '' });
  };

  const removeLetter = () => {
    setCurrentWord(prev => prev.slice(0, -1));
    setUsedPositions(prev => prev.slice(0, -1));
    setMessage({ text: '', type: '' });
  };

  const clearWord = () => {
    setCurrentWord('');
    setUsedPositions([]);
    setMessage({ text: '', type: '' });
  };

  const shuffleLetters = () => {
    setOuterLetters(shuffleArray(outerLetters));
    // Reset current word since indices change
    setCurrentWord('');
    setUsedPositions([]);
  };

  const submitWord = () => {
    const word = currentWord.toUpperCase();

    if (word.length < 4) {
      setMessage({ text: 'Words must be at least 4 letters', type: 'error' });
      return;
    }

    if (!word.includes(puzzle.center)) {
      setMessage({ text: `Words must contain the center letter "${puzzle.center}"`, type: 'error' });
      return;
    }

    if (foundWords.includes(word)) {
      setMessage({ text: 'Already found!', type: 'error' });
      return;
    }

    // Check if word uses only available letters
    const availableLetters = [...puzzle.letters];
    for (const char of word) {
      const idx = availableLetters.indexOf(char);
      if (idx === -1) {
        setMessage({ text: 'Invalid letters used', type: 'error' });
        return;
      }
      availableLetters.splice(idx, 1);
    }

    if (!isValidWord(word)) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      return;
    }

    setFoundWords(prev => [...prev, word].sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return a.localeCompare(b);
    }));

    const modeConfig = MODES[mode];
    if (word.length === modeConfig.letters) {
      setMessage({ text: `🎉 Amazing! You found the ${modeConfig.letters}-letter word!`, type: 'success' });
    } else if (word.length >= 6) {
      setMessage({ text: '✨ Excellent!', type: 'success' });
    } else {
      setMessage({ text: '✓ Good!', type: 'success' });
    }

    setCurrentWord('');
    setUsedPositions([]);
  };

  const handleKeyDown = useCallback((e) => {
    if (!puzzle) return;

    const key = e.key.toUpperCase();

    if (e.key === 'Enter') {
      e.preventDefault();
      submitWord();
    } else if (e.key === 'Backspace') {
      removeLetter();
    } else if (e.key === 'Escape') {
      clearWord();
    } else if (puzzle.letters.includes(key)) {
      // Find an available position for this letter
      // First check center
      const centerUsed = usedPositions.some(pos => pos.isCenter);
      if (puzzle.center === key && !centerUsed) {
        addLetter(key, -1, true);
      } else {
        // Find first unused outer position with this letter
        const availableIndex = outerLetters.findIndex((letter, idx) =>
          letter === key && !usedPositions.some(pos => !pos.isCenter && pos.index === idx)
        );
        if (availableIndex !== -1) {
          addLetter(key, availableIndex, false);
        }
      }
    }
  }, [puzzle, outerLetters, usedPositions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const calculateScore = () => {
    const modeConfig = MODES[mode];
    return foundWords.reduce((score, word) => {
      // Pangram (uses all letters) gets bonus
      if (word.length === modeConfig.letters) return score + modeConfig.letters * 2;
      if (word.length >= 7) return score + 7;
      if (word.length >= 5) return score + 5;
      if (word.length >= 4) return score + 2;
      return score + 1;
    }, 0);
  };

  // Check if a specific position (button) is used
  const isPositionUsed = (index, isCenter) => {
    return usedPositions.some(pos => pos.index === index && pos.isCenter === isCenter);
  };

  if (!puzzle) return null;

  const modeConfig = MODES[mode];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          ← Back to Games
        </Link>
        <h1 className={styles.title}>Word Wheel</h1>
        <p className={styles.instructions}>
          Find words using the letters. Every word must include the center letter <strong>{puzzle.center}</strong>.
          Each letter can only be used once per word.
        </p>
        <div className={styles.modeSelector}>
          {Object.entries(MODES).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.modeBtn} ${mode === key ? styles.active : ''}`}
              onClick={() => handleModeChange(key)}
            >
              {config.name}
              <span className={styles.modeDesc}>{config.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.wheelSection}>
          <div className={`${styles.wheel} ${mode === 'SPELLING_BEE' ? styles.smallerWheel : ''}`}>
            <div
              className={`${styles.centerLetter} ${isPositionUsed(-1, true) ? styles.used : ''}`}
              onClick={() => !isPositionUsed(-1, true) && addLetter(puzzle.center, -1, true)}
            >
              {puzzle.center}
            </div>
            {outerLetters.map((letter, index) => (
              <div
                key={`${letter}-${index}`}
                className={`${styles.outerLetter} ${isPositionUsed(index, false) ? styles.used : ''}`}
                style={{
                  '--angle': `${(index * 360) / modeConfig.outer}deg`,
                }}
                onClick={() => !isPositionUsed(index, false) && addLetter(letter, index)}
              >
                {letter}
              </div>
            ))}
          </div>

          <div className={styles.inputArea}>
            <div className={styles.currentWord}>
              {currentWord || <span className={styles.placeholder}>Type or click letters...</span>}
            </div>

            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <div className={styles.buttons}>
              <button className={styles.btn} onClick={clearWord}>Clear</button>
              <button className={styles.btn} onClick={removeLetter}>⌫</button>
              <button className={styles.btn} onClick={shuffleLetters}>Shuffle</button>
              <button className={`${styles.btn} ${styles.submitBtn}`} onClick={submitWord}>
                Submit
              </button>
            </div>
          </div>
        </div>

        <div className={styles.wordsSection}>
          <div className={styles.scorePanel}>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>Score</span>
              <span className={styles.scoreValue}>{calculateScore()}</span>
            </div>
            <div className={styles.wordCount}>
              <span className={styles.scoreLabel}>Words</span>
              <span className={styles.scoreValue}>{foundWords.length} / {possibleWords.length}</span>
            </div>
          </div>

          <div className={styles.foundWords}>
            <h3>Found Words</h3>
            {foundWords.length === 0 ? (
              <p className={styles.noWords}>No words found yet</p>
            ) : (
              <div className={styles.wordList}>
                {foundWords.map((word) => (
                  <span
                    key={word}
                    className={`${styles.word} ${word.length === modeConfig.letters ? styles.pangramWord : ''}`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button className={styles.newGameBtn} onClick={createNewPuzzle}>
              New Puzzle
            </button>
            <button
              className={styles.revealBtn}
              onClick={() => setShowAllWords(!showAllWords)}
            >
              {showAllWords ? 'Hide Answers' : 'Show All Words'}
            </button>
          </div>

          {showAllWords && (
            <div className={styles.allWords}>
              <h4>All Possible Words ({possibleWords.length})</h4>
              <p className={styles.feedbackHint}>Click a word to mark it as archaic or obscure</p>
              <div className={styles.wordList}>
                {possibleWords.map((word) => (
                  <div key={word} className={styles.wordContainer}>
                    <span
                      className={`${styles.word} ${styles.clickable} ${foundWords.includes(word) ? styles.found : styles.missed} ${word.length === modeConfig.letters ? styles.pangramWord : ''} ${feedbackMap[word] ? styles.flaggedWord : ''} ${selectedWord === word ? styles.selected : ''}`}
                      onClick={() => handleWordClick(word)}
                    >
                      {feedbackMap[word] && <span className={styles.flagIcon}>{feedbackMap[word].type === FeedbackType.ARCHAIC ? '📜' : '🤔'}</span>}
                      {word}
                    </span>
                    {selectedWord === word && (
                      <div className={styles.wordFeedbackPopup}>
                        {feedbackMap[word] ? (
                          <button
                            className={`${styles.feedbackBtn} ${styles.unflagBtn}`}
                            onClick={() => handleUnflagWord(word)}
                          >
                            ✕ Remove flag
                          </button>
                        ) : (
                          <>
                            <button
                              className={`${styles.feedbackBtn} ${styles.archaicBtn}`}
                              onClick={() => handleFlagWord(word, FeedbackType.ARCHAIC)}
                            >
                              📜 Archaic
                            </button>
                            <button
                              className={`${styles.feedbackBtn} ${styles.obscureBtn}`}
                              onClick={() => handleFlagWord(word, FeedbackType.OBSCURE)}
                            >
                              🤔 Obscure
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
