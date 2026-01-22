import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import ModeSelector from '../../components/ModeSelector';
import { usePersistedState } from '../../hooks/usePersistedState';
import { isValidWord, findAllWords, generatePuzzle, shuffleArray } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './WordWheel.module.css';

const STORAGE_KEY = 'wordwheel_puzzle';
const MODE_KEY = 'wordwheel_mode';

// Game modes
const MODES = {
  CLASSIC: { letters: 9, outer: 8, name: 'Classic', description: '9 letters' },
  HEX: { letters: 7, outer: 6, name: 'Hex', description: '7 letters' },
};

// Export helpers for testing
export { MODES };

export default function WordWheel() {
  const { t } = useTranslation();
  const [mode, setMode] = usePersistedState(MODE_KEY, 'CLASSIC');
  const [savedGameState, setSavedGameState] = usePersistedState(STORAGE_KEY, null);
  const [puzzle, setPuzzle] = useState(null);
  const [outerLetters, setOuterLetters] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [usedPositions, setUsedPositions] = useState([]); // Track which positions are used: { index, isCenter }
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [possibleWords, setPossibleWords] = useState([]);
  const [showAllWords, setShowAllWords] = useState(false);

  // Save game state whenever it changes
  useEffect(() => {
    if (puzzle) {
      setSavedGameState({
        puzzle,
        outerLetters,
        foundWords,
        possibleWords,
        mode,
      });
    }
  }, [puzzle, outerLetters, foundWords, possibleWords, mode, setSavedGameState]);

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
  }, [mode]);

  // Load saved puzzle on mount, or create new one if none exists
  useEffect(() => {
    if (savedGameState) {
      try {
        // Check if saved puzzle matches current mode
        const savedMode = savedGameState.mode || 'CLASSIC';
        if (savedMode === mode) {
          setPuzzle(savedGameState.puzzle);
          setOuterLetters(savedGameState.outerLetters);
          setFoundWords(savedGameState.foundWords || []);
          setPossibleWords(savedGameState.possibleWords || []);
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

  const modeOptions = Object.entries(MODES).map(([key, config]) => ({
    id: key,
    label: config.name,
    description: config.description,
  }));

  return (
    <div className={styles.container}>
      <GameHeader
        title="Word Wheel"
        instructions={`Find words using the letters. Every word must include the center letter ${puzzle.center}. Each letter can only be used once per word.`}
      />

      <ModeSelector
        modes={modeOptions}
        selectedMode={mode}
        onSelectMode={handleModeChange}
      />

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
              <button className={styles.btn} onClick={shuffleLetters}>{t('common.shuffle')}</button>
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
            <h3>{t('common.foundWords')}</h3>
            {foundWords.length === 0 ? (
              <p className={styles.noWords}>{t('common.noWordsYet')}</p>
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
              <h4>{t('common.allPossibleWords')} ({possibleWords.length})</h4>
              <div className={styles.wordList}>
                {possibleWords.map((word) => (
                  <WordWithDefinition
                    key={word}
                    word={word}
                    className={`${styles.word} ${foundWords.includes(word) ? styles.found : styles.missed} ${word.length === modeConfig.letters ? styles.pangramWord : ''}`}
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
