import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { isValidWord, isCommonWord, getZipfScore, createSeededRandom, getTodayDateString, stringToSeed, seededShuffleArray, getAllWords } from '../../data/wordUtils';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './Pyramid.module.css';

// Calculate word weight score (higher = more common/recognizable)
function getWordWeight(word) {
  return (isCommonWord(word) ? 1000 : 0) + getZipfScore(word) * 100;
}

// Total letters: 1+2+3+4+5 = 15
const TOTAL_CELLS = 15;
const ROWS = 5;

// Color palette for different words (distinct, vibrant colors)
const WORD_COLORS = [
  { bg: 'rgba(34, 197, 94, 0.4)', border: 'rgba(34, 197, 94, 0.7)', text: '#4ade80' },    // Green
  { bg: 'rgba(59, 130, 246, 0.4)', border: 'rgba(59, 130, 246, 0.7)', text: '#60a5fa' },  // Blue
  { bg: 'rgba(168, 85, 247, 0.4)', border: 'rgba(168, 85, 247, 0.7)', text: '#c084fc' },  // Purple
  { bg: 'rgba(236, 72, 153, 0.4)', border: 'rgba(236, 72, 153, 0.7)', text: '#f472b6' },  // Pink
  { bg: 'rgba(20, 184, 166, 0.4)', border: 'rgba(20, 184, 166, 0.7)', text: '#2dd4bf' },  // Teal
  { bg: 'rgba(249, 115, 22, 0.4)', border: 'rgba(249, 115, 22, 0.7)', text: '#fb923c' },  // Orange
  { bg: 'rgba(234, 179, 8, 0.4)', border: 'rgba(234, 179, 8, 0.7)', text: '#facc15' },    // Yellow
  { bg: 'rgba(239, 68, 68, 0.4)', border: 'rgba(239, 68, 68, 0.7)', text: '#f87171' },    // Red
];

// Letter frequency distribution for good puzzles (weighted toward common letters)
const LETTER_POOL = 'EEEEEEAAAAIIIIOOOOUUUURRRRTTTTNNNNSSSSLLLLCCCCDDDDPPPPMMMMHHHHGGGGBBFFWWYYKKVVJJXQZ';

let PREFIX_SET = null;

// Build prefix cache once to prune DFS when no valid word can be formed
function ensurePrefixSet() {
  if (PREFIX_SET) return PREFIX_SET;
  PREFIX_SET = new Set();
  for (const word of getAllWords()) {
    const upper = word.toUpperCase();
    const limit = Math.min(upper.length, 10);
    for (let i = 1; i <= limit; i++) {
      PREFIX_SET.add(upper.slice(0, i));
    }
  }
  return PREFIX_SET;
}

// Get row and position within row from flat index
function getRowAndPos(index) {
  let row = 0;
  let remaining = index;
  while (remaining >= row + 1) {
    remaining -= (row + 1);
    row++;
  }
  return { row, pos: remaining };
}

// Get flat index from row and position
function getIndex(row, pos) {
  return (row * (row + 1)) / 2 + pos;
}

// Build adjacency map for the triangle
function buildAdjacencyMap() {
  const adjacency = {};

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const { row, pos } = getRowAndPos(i);
    const neighbors = [];

    // Same row neighbors
    if (pos > 0) neighbors.push(getIndex(row, pos - 1));
    if (pos < row) neighbors.push(getIndex(row, pos + 1));

    // Row above
    if (row > 0) {
      if (pos > 0) neighbors.push(getIndex(row - 1, pos - 1));
      if (pos < row) neighbors.push(getIndex(row - 1, pos));
    }

    // Row below
    if (row < ROWS - 1) {
      neighbors.push(getIndex(row + 1, pos));
      neighbors.push(getIndex(row + 1, pos + 1));
    }

    adjacency[i] = neighbors;
  }

  return adjacency;
}

const ADJACENCY = buildAdjacencyMap();

// Generate letters for the pyramid
function generatePyramidLetters(random) {
  // Pick 15 letters from the weighted pool
  const pool = LETTER_POOL.split('');
  const letters = [];

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const idx = Math.floor(random() * pool.length);
    letters.push(pool[idx]);
  }

  // Shuffle final arrangement
  return seededShuffleArray(letters, random);
}

// Find all valid words AND their paths by traversing the pyramid
function findAllValidWordsWithPaths(letters) {
  const wordPaths = new Map(); // word -> array of paths (each path is array of indices)
  const prefixSet = ensurePrefixSet();

  function dfs(index, path, word) {
    const currentWord = word + letters[index];
    const upperWord = currentWord.toUpperCase();

    // If no dictionary word begins with this prefix, prune search
    if (!prefixSet.has(upperWord)) {
      return;
    }

    // Check if current path forms a valid word (min 3 letters)
    if (currentWord.length >= 3 && isValidWord(currentWord)) {
      if (!wordPaths.has(upperWord)) {
        wordPaths.set(upperWord, []);
      }
      wordPaths.get(upperWord).push([...path]);
    }

    // Continue searching (limit depth to prevent too long searches)
    if (currentWord.length < 10) {
      for (const neighbor of ADJACENCY[index]) {
        if (!path.includes(neighbor)) {
          dfs(neighbor, [...path, neighbor], currentWord);
        }
      }
    }
  }

  // Start DFS from each cell
  for (let i = 0; i < TOTAL_CELLS; i++) {
    dfs(i, [i], '');
  }

  return wordPaths;
}

// Check if all cells can be covered with NON-OVERLAPPING words
function findNonOverlappingSolution(wordPaths) {
  // Get all unique paths and their cell coverage
  const allPaths = [];
  for (const [word, paths] of wordPaths) {
    const weight = getWordWeight(word);
    for (const path of paths) {
      allPaths.push({ word, path, cells: new Set(path), weight });
    }
  }

  // Sort by: weight (common words first), then path length descending
  allPaths.sort((a, b) => {
    // Prioritize common words
    const weightDiff = b.weight - a.weight;
    if (weightDiff !== 0) return weightDiff;
    // Then prefer longer words
    return b.path.length - a.path.length;
  });

  // Recursive backtracking to find non-overlapping solution
  function backtrack(used, solution) {
    if (used.size === TOTAL_CELLS) {
      return [...solution]; // Found a valid solution
    }

    // Find paths that only use unused cells
    for (const pathInfo of allPaths) {
      // Check if this path overlaps with already used cells
      let overlaps = false;
      for (const cell of pathInfo.cells) {
        if (used.has(cell)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        // Try this path
        const newUsed = new Set(used);
        for (const cell of pathInfo.cells) {
          newUsed.add(cell);
        }

        const result = backtrack(newUsed, [...solution, pathInfo]);
        if (result) return result;
      }
    }

    return null; // No solution found from this state
  }

  const solution = backtrack(new Set(), []);
  return { solvable: solution !== null, solution: solution || [] };
}

function sortWordsByWeight(wordPaths) {
  return Array.from(wordPaths.keys())
    .map(word => ({ word, weight: getWordWeight(word) }))
    .sort((a, b) => b.weight - a.weight || b.word.length - a.word.length || a.word.localeCompare(b.word))
    .map(item => item.word);
}

// Generate a valid, solvable puzzle
function generateSolvablePuzzle(baseSeed) {
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = baseSeed + attempt * 12345;
    const random = createSeededRandom(seed);
    const letters = generatePyramidLetters(random);

    const wordPaths = findAllValidWordsWithPaths(letters);
    const { solvable, solution } = findNonOverlappingSolution(wordPaths);

    if (solvable) {
      const validWords = sortWordsByWeight(wordPaths);

      return {
        letters,
        validWords,
        wordPaths,
        solution // The greedy solution (for hint purposes)
      };
    }
  }

  throw new Error('Pyramid generator failed to find a solvable puzzle');
}

// Check if a word can be traced through the given path in the pyramid
function isValidPath(path) {
  if (path.length < 2) return true;

  for (let i = 1; i < path.length; i++) {
    if (!ADJACENCY[path[i - 1]].includes(path[i])) {
      return false;
    }
  }

  // Check no duplicate cells
  const uniqueCells = new Set(path);
  return uniqueCells.size === path.length;
}

// Export helpers for testing
export {
  getWordWeight,
  TOTAL_CELLS,
  ROWS,
  WORD_COLORS,
  LETTER_POOL,
  getRowAndPos,
  getIndex,
  buildAdjacencyMap,
  generatePyramidLetters,
  findAllValidWordsWithPaths,
  findNonOverlappingSolution,
  generateSolvablePuzzle,
  isValidPath,
};

export default function Pyramid() {
  const { t } = useTranslation();
  const [letters, setLetters] = useState([]);
  const [allValidWords, setAllValidWords] = useState([]);
  const [wordPathsMap, setWordPathsMap] = useState(new Map());
  const [solutionHint, setSolutionHint] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [foundWordPaths, setFoundWordPaths] = useState({}); // word -> path (indices used)
  const [currentPath, setCurrentPath] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [usedIndices, setUsedIndices] = useState(new Set());
  const { gameState, checkWin, setGameState, reset: resetGameState, isPlaying } = useGameState();
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [puzzleNumber, setPuzzleNumber] = useState(0);
  const [seed, setSeed] = useState(null);

  const boardRef = useRef(null);
  const currentPathRef = useRef([]); // Ref to track path during drag (avoids stale closure)

  const initGame = useCallback((newPuzzle = false, customSeed = null) => {
    const today = getTodayDateString();
    const nextPuzzleNum = newPuzzle ? puzzleNumber + 1 : puzzleNumber;
    const gameSeed = customSeed ?? stringToSeed(`pyramid-${today}-${nextPuzzleNum}`);
    const puzzle = generateSolvablePuzzle(gameSeed);

    setSeed(gameSeed);
    setLetters(puzzle.letters);
    setAllValidWords(puzzle.validWords);
    setWordPathsMap(puzzle.wordPaths);
    setSolutionHint(puzzle.solution);
    setFoundWords(new Set());
    setFoundWordPaths({});
    setCurrentPath([]);
    currentPathRef.current = [];
    setCurrentWord('');
    setUsedIndices(new Set());
    resetGameState();
    setMessage('');
    setShowAllWords(false);
    setShowSolution(false);
    setHintsUsed(0);
    if (newPuzzle) {
      setPuzzleNumber(nextPuzzleNum);
    }
  }, [puzzleNumber, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check win condition
  useEffect(() => {
    if (usedIndices.size === TOTAL_CELLS && isPlaying) {
      checkWin(true);
      setMessage('');
    }
  }, [usedIndices, isPlaying, checkWin]);

  const handleCellMouseDown = (index) => {
    if (!isPlaying) return;

    // Cannot start on a cell that's already used in another word
    if (usedIndices.has(index)) return;

    setIsDragging(true);
    currentPathRef.current = [index];
    setCurrentPath([index]);
    setCurrentWord(letters[index]);
    setMessage('');
  };

  const handleCellMouseEnter = (index) => {
    if (!isDragging || gameState !== 'playing') return;

    // Use ref for immediate check (avoids stale closure)
    const path = currentPathRef.current;

    // Check if cell is already in path - prevent reusing letters in same word
    if (path.includes(index)) return;

    // Cannot use a cell that's already used in another word
    if (usedIndices.has(index)) return;

    // Check if adjacent to last cell
    const lastIndex = path[path.length - 1];
    if (ADJACENCY[lastIndex].includes(index)) {
      const newPath = [...path, index];
      currentPathRef.current = newPath;
      setCurrentPath(newPath);
      setCurrentWord(prev => prev + letters[index]);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const path = currentPathRef.current;
    const word = path.map(i => letters[i]).join('');

    if (word.length >= 3) {
      const upperWord = word.toUpperCase();

      // Check if any cell in the path is already used
      const usesAlreadyUsedCell = path.some(idx => usedIndices.has(idx));

      if (foundWords.has(upperWord)) {
        setMessage('Already found!');
      } else if (usesAlreadyUsedCell) {
        setMessage('Cannot reuse letters!');
      } else if (allValidWords.includes(upperWord) && isValidPath(path)) {
        // Add word to found list
        const newFoundWords = new Set([...foundWords, upperWord]);
        setFoundWords(newFoundWords);

        // Track which indices this word used
        const newPaths = { ...foundWordPaths, [upperWord]: [...path] };
        setFoundWordPaths(newPaths);

        // Update used indices
        const newUsed = new Set([...usedIndices, ...path]);
        setUsedIndices(newUsed);

        setMessage(`+${path.length} letter${path.length > 1 ? 's' : ''}!`);
      } else if (!isValidWord(word)) {
        setMessage('Not a valid word');
      } else {
        setMessage('Invalid path');
      }
    }

    currentPathRef.current = [];
    setCurrentPath([]);
    setCurrentWord('');
  };

  const handleTouchStart = (e, index) => {
    e.preventDefault();
    handleCellMouseDown(index);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.dataset.index !== undefined) {
      const index = parseInt(element.dataset.index);
      const path = currentPathRef.current;

      // Check if cell is already in path - prevent reusing letters in same word
      if (path.includes(index)) return;

      // Cannot use a cell that's already used in another word
      if (usedIndices.has(index)) return;

      // Check if adjacent to last cell
      const lastIndex = path[path.length - 1];
      if (lastIndex !== undefined && ADJACENCY[lastIndex].includes(index)) {
        const newPath = [...path, index];
        currentPathRef.current = newPath;
        setCurrentPath(newPath);
        setCurrentWord(prev => prev + letters[index]);
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const isInPath = (index) => currentPath.includes(index);
  const isUsed = (index) => usedIndices.has(index);

  // Get color index for a word based on order it was found
  const getWordColorIndex = (word) => {
    const words = Array.from(foundWords);
    const idx = words.indexOf(word);
    return idx >= 0 ? idx % WORD_COLORS.length : 0;
  };

  // Find which word a cell belongs to
  const getWordForCell = (index) => {
    for (const [word, path] of Object.entries(foundWordPaths)) {
      if (path.includes(index)) {
        return word;
      }
    }
    return null;
  };

  // Get color for a cell based on which word it belongs to
  const getCellColor = (index) => {
    const word = getWordForCell(index);
    if (!word) return null;
    return WORD_COLORS[getWordColorIndex(word)];
  };

  // Remove word by clicking on a used cell
  const handleRemoveFromCell = (e, index) => {
    e.stopPropagation();
    e.preventDefault();
    if (gameState !== 'playing') return;

    const word = getWordForCell(index);
    if (word) {
      removeWord(word);
    }
  };

  // Remove a word and recalculate used indices
  const removeWord = (wordToRemove) => {
    if (gameState !== 'playing') return;

    // Remove from found words
    const newFoundWords = new Set(foundWords);
    newFoundWords.delete(wordToRemove);
    setFoundWords(newFoundWords);

    // Remove from paths
    const newPaths = { ...foundWordPaths };
    delete newPaths[wordToRemove];
    setFoundWordPaths(newPaths);

    // Recalculate used indices from remaining words
    const newUsed = new Set();
    for (const path of Object.values(newPaths)) {
      for (const idx of path) {
        newUsed.add(idx);
      }
    }
    setUsedIndices(newUsed);
    setMessage('Word removed');
  };

  // Get a hint - reveal a word from the solution that uses ONLY unused cells
  const getHint = () => {
    if (gameState !== 'playing') return;

    // Helper to check if a path uses only unused cells (no overlap)
    const usesOnlyUnusedCells = (path) => {
      return path.every(idx => !usedIndices.has(idx));
    };

    // Find a word from solution that uses only unused cells
    for (const item of solutionHint) {
      if (foundWords.has(item.word)) continue;

      // Check if this word uses ONLY unused cells (no overlap with already used)
      if (usesOnlyUnusedCells(item.path)) {
        // Add this word as found (using the solution's path)
        const newFoundWords = new Set([...foundWords, item.word]);
        setFoundWords(newFoundWords);

        const newPaths = { ...foundWordPaths, [item.word]: item.path };
        setFoundWordPaths(newPaths);

        const newUsed = new Set([...usedIndices, ...item.path]);
        setUsedIndices(newUsed);

        setHintsUsed(hintsUsed + 1);
        setMessage(`Hint: ${item.word}`);
        return;
      }
    }

    // If no solution word works, find any valid word that uses only unused cells
    // Prefer longer words
    const candidates = [];
    for (const [word, paths] of wordPathsMap) {
      if (foundWords.has(word)) continue;

      for (const path of paths) {
        if (usesOnlyUnusedCells(path)) {
          candidates.push({ word, path });
          break; // One path per word is enough
        }
      }
    }

    // Sort by length descending
    candidates.sort((a, b) => b.path.length - a.path.length);

    if (candidates.length > 0) {
      const { word, path } = candidates[0];
      const newFoundWords = new Set([...foundWords, word]);
      setFoundWords(newFoundWords);

      const newPaths = { ...foundWordPaths, [word]: path };
      setFoundWordPaths(newPaths);

      const newUsed = new Set([...usedIndices, ...path]);
      setUsedIndices(newUsed);

      setHintsUsed(hintsUsed + 1);
      setMessage(`Hint: ${word}`);
      return;
    }

    setMessage('No more hints available');
  };

  const giveUp = () => {
    setGameState('ended');
    setShowAllWords(true);
    setShowSolution(true);
  };

  if (letters.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  // Build rows for rendering
  const rows = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let p = 0; p <= r; p++) {
      row.push({ letter: letters[idx], index: idx });
      idx++;
    }
    rows.push(row);
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pyramid"
        instructions={`Connect adjacent letters to form words. Use all ${TOTAL_CELLS} letters to win!`}
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
        <div className={styles.progressBar}>
          <div className={styles.progressLabel}>
            Letters used: {usedIndices.size} / {TOTAL_CELLS}
            {hintsUsed > 0 && <span className={styles.hintsUsed}> ({hintsUsed} hint{hintsUsed > 1 ? 's' : ''} used)</span>}
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${(usedIndices.size / TOTAL_CELLS) * 100}%` }}
            />
          </div>
        </div>

        <div
          ref={boardRef}
          className={styles.pyramid}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map(({ letter, index }) => {
                const cellColor = getCellColor(index);
                return (
                  <div
                    key={index}
                    data-index={index}
                    className={`${styles.cell} ${isInPath(index) ? styles.selected : ''} ${isUsed(index) ? styles.used : ''}`}
                    style={cellColor ? {
                      background: `linear-gradient(135deg, ${cellColor.bg} 0%, ${cellColor.bg} 100%)`,
                      borderColor: cellColor.border,
                    } : undefined}
                    onMouseDown={() => handleCellMouseDown(index)}
                    onMouseEnter={() => handleCellMouseEnter(index)}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                  >
                    {letter}
                    {isUsed(index) && gameState === 'playing' && (
                      <button
                        className={styles.cellRemoveBtn}
                        onClick={(e) => handleRemoveFromCell(e, index)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleRemoveFromCell(e, index);
                        }}
                        title={`Remove "${getWordForCell(index)}"`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {currentWord && (
          <div className={styles.currentWord}>{currentWord}</div>
        )}

        {message && (
          <div className={`${styles.message} ${message.includes('+') || message.includes('found') || message.includes('Hint:') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="All letters used! You win!"
            message={hintsUsed > 0 ? `with ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ''}
          />
        )}

        {gameState === 'playing' && (
          <div className={styles.actionButtons}>
            <button className={styles.hintBtn} onClick={getHint}>
              💡 Hint
            </button>
            <GiveUpButton onGiveUp={giveUp} />
          </div>
        )}

        <div className={styles.wordList}>
          <h3>{t('common.foundWords')} ({foundWords.size})</h3>
          <div className={styles.words}>
            {Array.from(foundWords).map((word) => {
              const color = WORD_COLORS[getWordColorIndex(word)];
              return (
                <span
                  key={word}
                  className={styles.wordWithRemove}
                  style={{
                    background: color.bg,
                    borderColor: color.border,
                    color: color.text,
                  }}
                >
                  <span className={styles.wordText}>{word}</span>
                  {gameState === 'playing' && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeWord(word)}
                      title="Remove word"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {showSolution && solutionHint.length > 0 && (
          <div className={styles.solutionBox}>
            <h3>One Possible Solution</h3>
            <div className={styles.solutionWords}>
              {solutionHint.map((item, i) => (
                <span key={i} className={styles.solutionWord}>
                  {item.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {showAllWords && (
          <div className={styles.allWords}>
            <h3>All Possible Words ({allValidWords.length})</h3>
            <div className={styles.words}>
              {allValidWords.slice(0, 100).map(word => (
                <WordWithDefinition
                  key={word}
                  word={word}
                  className={`${styles.word} ${foundWords.has(word) ? styles.found : styles.missed}`}
                />
              ))}
              {allValidWords.length > 100 && (
                <span className={styles.moreWords}>...and {allValidWords.length - 100} more</span>
              )}
            </div>
          </div>
        )}

        <button className={styles.newGameBtn} onClick={() => initGame(true)}>
          New Puzzle
        </button>
      </div>
    </div>
  );
}
