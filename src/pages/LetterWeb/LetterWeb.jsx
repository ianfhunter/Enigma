import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { isValidWord, createSeededRandom, getTodayDateString, stringToSeed, getAllWeightedWords } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useGameState } from '../../hooks/useGameState';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './LetterWeb.module.css';

const VOWELS = 'AEIOU';
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ';

function generateLetterConfiguration(random) {
  const letters = [[], [], [], []]; // 4 sides
  const usedLetters = new Set();

  // Ensure at least 3-4 vowels for better solvability
  const vowelCount = 3 + Math.floor(random() * 2);
  const vowelList = VOWELS.split('');

  for (let i = 0; i < vowelCount; i++) {
    const idx = Math.floor(random() * vowelList.length);
    const vowel = vowelList.splice(idx, 1)[0];
    usedLetters.add(vowel);
  }

  // Fill rest with consonants
  const consonantList = CONSONANTS.split('');
  while (usedLetters.size < 12) {
    const idx = Math.floor(random() * consonantList.length);
    const consonant = consonantList.splice(idx, 1)[0];
    usedLetters.add(consonant);
  }

  // Distribute across 4 sides
  const allLetters = Array.from(usedLetters);
  for (let i = allLetters.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
  }

  for (let i = 0; i < 12; i++) {
    letters[Math.floor(i / 3)].push(allLetters[i]);
  }

  return letters;
}

// Find all valid words that can be played on this board
function findValidLetterBoxedWords(sides) {
  const allBoardLetters = new Set(sides.flat());
  const validWords = [];

  // Get all dictionary words (weighted: common words first)
  const allWords = getAllWeightedWords();

  for (const word of allWords) {
    if (word.length < 3) continue;

    // Check if word only uses available letters
    let usesOnlyBoardLetters = true;
    for (const letter of word) {
      if (!allBoardLetters.has(letter)) {
        usesOnlyBoardLetters = false;
        break;
      }
    }
    if (!usesOnlyBoardLetters) continue;

    // Check that consecutive letters are from different sides
    let validSideRule = true;
    for (let i = 1; i < word.length; i++) {
      const prevSide = sides.findIndex(side => side.includes(word[i - 1]));
      const currSide = sides.findIndex(side => side.includes(word[i]));
      if (prevSide === currSide) {
        validSideRule = false;
        break;
      }
    }

    if (validSideRule) {
      validWords.push(word);
    }
  }

  return validWords;
}

// Find a valid solution using BFS - returns the word chain or null
function findSolution(sides, validWords, maxWords = 5) {
  const allLetters = new Set(sides.flat());

  // Build a map of words by their starting letter for fast lookup
  const wordsByStartLetter = {};
  for (const word of validWords) {
    const startLetter = word[0];
    if (!wordsByStartLetter[startLetter]) {
      wordsByStartLetter[startLetter] = [];
    }
    wordsByStartLetter[startLetter].push(word);
  }

  // Sort words by length (prefer longer words for better solutions)
  for (const letter in wordsByStartLetter) {
    wordsByStartLetter[letter].sort((a, b) => b.length - a.length);
  }

  // BFS to find a chain that covers all letters
  // State: { usedLetters: Set, lastLetter: string, words: string[] }
  const queue = [];

  // Start with each valid word (prioritize longer words)
  const sortedWords = [...validWords].sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    const used = new Set(word.split(''));
    if (used.size === allLetters.size && [...allLetters].every(l => used.has(l))) {
      return [word]; // Single word solution!
    }
    queue.push({
      usedLetters: used,
      lastLetter: word[word.length - 1],
      words: [word]
    });
  }

  while (queue.length > 0) {
    const state = queue.shift();

    if (state.words.length >= maxWords) continue;

    // Find words that can chain from the last letter
    const nextWords = wordsByStartLetter[state.lastLetter] || [];

    for (const word of nextWords) {
      const newUsed = new Set(state.usedLetters);
      for (const letter of word) {
        newUsed.add(letter);
      }

      // Check if we've covered all letters
      if (newUsed.size === allLetters.size && [...allLetters].every(l => newUsed.has(l))) {
        return [...state.words, word];
      }

      // Only continue if we made progress (added new letters)
      if (newUsed.size > state.usedLetters.size) {
        queue.push({
          usedLetters: newUsed,
          lastLetter: word[word.length - 1],
          words: [...state.words, word]
        });
      }
    }
  }

  return null;
}

// Check if a valid solution exists
function hasSolution(sides, validWords, maxWords = 5) {
  return findSolution(sides, validWords, maxWords) !== null;
}

function generateLetters(seed) {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const random = createSeededRandom(seed + attempt);
    const sides = generateLetterConfiguration(random);

    // Find all valid words for this configuration
    const validWords = findValidLetterBoxedWords(sides);

    // Try to find a solution
    if (validWords.length >= 20) {
      const solution = findSolution(sides, validWords);
      if (solution) {
        return { sides, solution, validWords };
      }
    }
  }

  // Fallback: return a known-good configuration
  const fallbackSides = [
    ['A', 'R', 'T'],
    ['E', 'S', 'N'],
    ['I', 'L', 'D'],
    ['O', 'C', 'M']
  ];
  const fallbackWords = findValidLetterBoxedWords(fallbackSides);
  return {
    sides: fallbackSides,
    solution: findSolution(fallbackSides, fallbackWords) || ['ASTEROID', 'DECIMAL'],
    validWords: fallbackWords
  };
}

function getLetterSide(letter, sides) {
  for (let i = 0; i < 4; i++) {
    if (sides[i].includes(letter)) return i;
  }
  return -1;
}

function isValidLetterBoxedWord(word, sides, lastLetter = null, options = {}) {
  const {
    validateWord = isValidWord,
    skipDictionaryCheck = false
  } = options;

  if (word.length < 3) return { valid: false, reason: 'Word must be at least 3 letters' };

  const upperWord = word.toUpperCase();
  const allLetters = sides.flat();

  // Check if word uses only available letters
  for (const letter of upperWord) {
    if (!allLetters.includes(letter)) {
      return { valid: false, reason: `Letter "${letter}" is not available` };
    }
  }

  // Check that consecutive letters are from different sides
  for (let i = 1; i < upperWord.length; i++) {
    const prevSide = getLetterSide(upperWord[i - 1], sides);
    const currSide = getLetterSide(upperWord[i], sides);

    if (prevSide === currSide) {
      return { valid: false, reason: 'Cannot use consecutive letters from the same side' };
    }
  }

  // Check if word chains from last letter
  if (lastLetter && upperWord[0] !== lastLetter) {
    return { valid: false, reason: `Word must start with "${lastLetter}"` };
  }

  // Check if it's a real word
  if (!skipDictionaryCheck && validateWord && !validateWord(upperWord)) {
    return { valid: false, reason: 'Not a valid word' };
  }

  return { valid: true };
}

function checkWin(words, sides) {
  const usedLetters = new Set();
  for (const word of words) {
    for (const letter of word) {
      usedLetters.add(letter);
    }
  }

  const allLetters = sides.flat();
  return allLetters.every(letter => usedLetters.has(letter));
}

// Get position of a letter on the box for line drawing
// Returns the CENTER of each letter circle
function getLetterPosition(letter, sides) {
  const sideIndex = sides.findIndex(side => side.includes(letter));
  if (sideIndex === -1) return null;

  const letterIndex = sides[sideIndex].indexOf(letter);

  // Box is 280x280, letter circles are 44px diameter
  // Positions adjusted empirically to match actual rendered circle centers
  // Top/bottom use xPositions, left/right use yPositions
  const xPositions = [45, 135, 230];  // for top/bottom sides
  const yPositions = [60, 140, 220];  // for left/right sides
  const pos = (sideIndex === 0 || sideIndex === 2) ? xPositions[letterIndex] : yPositions[letterIndex];

  // Side containers are positioned with top/bottom/left/right: -25px
  // The letters (44px) are centered in the container
  // Adjusted empirically for visual alignment

  switch (sideIndex) {
    case 0: // top - letters above the box
      return { x: pos + 35, y: -3 };
    case 1: // right - letters to the right of the box
      return { x: 323, y: pos };
    case 2: // bottom - letters below the box
      return { x: pos + 35, y: 283 };
    case 3: // left - letters to the left of the box
      return { x: -3, y: pos };
    default:
      return null;
  }
}

// Word colors for line drawing
const WORD_COLORS = [
  '#a855f7', // purple
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
];

export function getWordDisplayText(currentWord, lastLetter, gameState) {
  if (currentWord) return currentWord;
  if (gameState === 'won') return 'Puzzle solved!';
  if (gameState === 'revealed') return 'Solution revealed';
  if (lastLetter) return `Start with ${lastLetter}...`;
  return 'Click letters...';
}

// Export helpers for testing
export {
  VOWELS,
  CONSONANTS,
  generateLetterConfiguration,
  findValidLetterBoxedWords,
  findSolution,
  hasSolution,
  generateLetters,
  getLetterSide,
  isValidLetterBoxedWord,
};

export default function LetterWeb() {
  const [sides, setSides] = useState([[], [], [], []]);
  const [solution, setSolution] = useState([]);
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const { gameState, checkWin: checkWinState, giveUp, reset: resetGameState, isPlaying, isWon, isGaveUp } = useGameState();
  const [stats, setStats] = usePersistedState('letterweb-stats', { gamesWon: 0, bestWords: null });
  const [puzzleNumber, setPuzzleNumber] = useState(0);
  const [seed, setSeed] = useState(null);

  const initGame = useCallback((isNewPuzzle = false, customSeed = null) => {
    const today = getTodayDateString();
    const puzzleOffset = isNewPuzzle ? puzzleNumber + 1 : puzzleNumber;
    if (isNewPuzzle) {
      setPuzzleNumber(puzzleOffset);
    }
    const gameSeed = customSeed ?? stringToSeed(`letterweb-${today}-${puzzleOffset}`);
    const result = generateLetters(gameSeed);

    setSeed(gameSeed);
    setSides(result.sides);
    setSolution(result.solution);
    setWords([]);
    setCurrentWord('');
    setSelectedLetters([]);
    setMessage('');
    resetGameState();
  }, [puzzleNumber, resetGameState]);

  const handleGiveUp = () => {
    giveUp();
    setWords(solution);
    setCurrentWord('');
    setSelectedLetters([]);
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  const lastLetter = words.length > 0 ? words[words.length - 1].slice(-1) : null;

  const handleLetterClick = (letter, sideIndex) => {
    if (isWon || isGaveUp) return;

    // Check if this is the first letter or comes from a different side
    if (selectedLetters.length > 0) {
      const lastSelected = selectedLetters[selectedLetters.length - 1];
      if (lastSelected.side === sideIndex) {
        setMessage('Cannot select from the same side consecutively');
        return;
      }
    }

    setSelectedLetters(prev => [...prev, { letter, side: sideIndex }]);
    setCurrentWord(prev => prev + letter);
    setMessage('');
  };

  const handleSubmit = () => {
    if (!currentWord) return;

    const result = isValidLetterBoxedWord(currentWord, sides, lastLetter);

    if (!result.valid) {
      setMessage(result.reason);
      return;
    }

    const newWords = [...words, currentWord.toUpperCase()];
    setWords(newWords);
    setCurrentWord('');
    setSelectedLetters([]);
    setMessage('');

    if (checkWin(newWords, sides)) {
      checkWinState(true);
      setStats(prev => ({
        gamesWon: prev.gamesWon + 1,
        bestWords: prev.bestWords === null || newWords.length < prev.bestWords
          ? newWords.length
          : prev.bestWords,
      }));
    }
  };

  const handleClear = () => {
    setCurrentWord('');
    setSelectedLetters([]);
    setMessage('');
  };

  const handleUndo = () => {
    if (words.length === 0) return;
    setWords(prev => prev.slice(0, -1));
  };

  const handleKeyDown = useCallback((e) => {
    if (gameState === 'won' || gameState === 'revealed') return;

    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace') {
      if (currentWord.length > 0) {
        setCurrentWord(prev => prev.slice(0, -1));
        setSelectedLetters(prev => prev.slice(0, -1));
      }
    } else if (e.key === 'Escape') {
      handleClear();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      const letter = e.key.toUpperCase();
      const sideIndex = getLetterSide(letter, sides);

      if (sideIndex !== -1) {
        handleLetterClick(letter, sideIndex);
      }
    }
  }, [gameState, currentWord, sides]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const usedLetters = new Set(words.join('').split(''));
  const allLetters = sides.flat();
  const remainingCount = allLetters.filter(l => !usedLetters.has(l)).length;
  const wordDisplayText = getWordDisplayText(currentWord, lastLetter, gameState);

  // Generate line paths for submitted words
  const generateWordLines = () => {
    const lines = [];

    words.forEach((word, wordIndex) => {
      const color = WORD_COLORS[wordIndex % WORD_COLORS.length];
      const letters = word.split('');

      for (let i = 0; i < letters.length - 1; i++) {
        const start = getLetterPosition(letters[i], sides);
        const end = getLetterPosition(letters[i + 1], sides);

        if (start && end) {
          lines.push({
            key: `${wordIndex}-${i}`,
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            color,
            wordIndex
          });
        }
      }
    });

    return lines;
  };

  const renderSide = (sideLetters, sideIndex, position) => (
    <div className={`${styles.side} ${styles[position]}`}>
      {sideLetters.map((letter, i) => (
        <button
          key={letter}
          className={`${styles.letter} ${
            usedLetters.has(letter) ? styles.used : ''
          } ${
            selectedLetters.some(s => s.letter === letter && s.side === sideIndex)
              ? styles.selected
              : ''
          }`}
          onClick={() => handleLetterClick(letter, sideIndex)}
        >
          {letter}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <GameHeader
        title="Letter Web"
        instructions="Use all 12 letters! Words must chain (last letter = first letter of next). Can't use consecutive letters from the same side."
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
            initGame(false, seedNum);
          }}
        />
      )}

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Words</span>
            <span className={styles.statValue}>{words.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Remaining</span>
            <span className={styles.statValue}>{remainingCount}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Best</span>
            <span className={styles.statValue}>{stats.bestWords || '-'}</span>
          </div>
        </div>

        <div className={styles.box}>
          {/* SVG overlay for lines - viewBox extends beyond box to reach letter centers */}
          <svg className={styles.linesSvg} viewBox="-30 -30 340 340" preserveAspectRatio="none">
            {generateWordLines().map(line => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.color}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
              />
            ))}
            {/* Current word preview lines */}
            {selectedLetters.length > 1 && selectedLetters.map((sel, i) => {
              if (i === 0) return null;
              const prevLetter = selectedLetters[i - 1].letter;
              const currLetter = sel.letter;
              const start = getLetterPosition(prevLetter, sides);
              const end = getLetterPosition(currLetter, sides);
              if (!start || !end) return null;
              return (
                <line
                  key={`current-${i}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>
          {renderSide(sides[0], 0, 'top')}
          {renderSide(sides[1], 1, 'right')}
          {renderSide(sides[2], 2, 'bottom')}
          {renderSide(sides[3], 3, 'left')}
          <div className={styles.boxCenter}>
            {lastLetter && gameState === 'playing' && (
              <span className={styles.chainHint}>
                Start with: {lastLetter}
              </span>
            )}
          </div>
        </div>

        <div className={styles.inputArea}>
          <div className={styles.wordDisplay}>
            {wordDisplayText}
          </div>
          <div className={styles.buttons}>
            <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={currentWord.length < 3}
            >
              Submit
            </button>
          </div>
        </div>

        {message && (
          <div className={styles.message}>{message}</div>
        )}

        <div className={styles.wordList}>
          <h3>{t('common.yourWords')}</h3>
          <div className={styles.words}>
            {words.map((word, i) => (
              <span key={i} className={styles.word}>
                <WordWithDefinition word={word} />
                {i < words.length - 1 && <span className={styles.chain}>→</span>}
              </span>
            ))}
          </div>
          {words.length > 0 && (
            <button className={styles.undoBtn} onClick={handleUndo}>
              Undo Last Word
            </button>
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Congratulations!"
            message={`Solved in ${words.length} words!`}
          />
        )}
        {gameState === 'revealed' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message={`The solution used ${solution.length} words.`}
          />
        )}

        <div className={styles.bottomButtons}>
          {gameState === 'playing' && (
            <GiveUpButton onGiveUp={handleGiveUp} />
          )}
          <button className={styles.newGameBtn} onClick={() => initGame(true)}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
