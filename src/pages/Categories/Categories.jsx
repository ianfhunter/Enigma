import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed, seededShuffleArray } from '../../data/wordUtils';
import { wordCategories } from '@datasets/wordCategories';
import SeedDisplay from '../../components/SeedDisplay';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './Categories.module.css';

const GRID_SIZE = 4;
const WORDS_PER_CATEGORY = 4;
const MAX_MISTAKES = 4;

// Difficulty colors by tier
const DIFFICULTY_COLORS = {
  1: { name: 'yellow', bg: '#f9df6d', text: '#000' },
  2: { name: 'green', bg: '#a0c35a', text: '#000' },
  3: { name: 'blue', bg: '#b0c4ef', text: '#000' },
  4: { name: 'purple', bg: '#ba81c5', text: '#000' },
};

// Generate a puzzle from word categories
function generatePuzzle(seed) {
  const random = createSeededRandom(seed);

  // Get category keys and shuffle them
  const categoryKeys = Object.keys(wordCategories);
  const shuffledKeys = seededShuffleArray(categoryKeys, random);

  // We need 4 categories with non-overlapping words
  const selectedCategories = [];
  const usedWords = new Set();

  for (const key of shuffledKeys) {
    if (selectedCategories.length >= 4) break;

    const category = wordCategories[key];
    // Filter words: 3-10 chars, not already used
    const availableWords = category.words.filter(
      w => w.length >= 3 && w.length <= 10 && !usedWords.has(w)
    );

    if (availableWords.length >= WORDS_PER_CATEGORY) {
      const shuffledWords = seededShuffleArray(availableWords, random);
      const selectedWords = shuffledWords.slice(0, WORDS_PER_CATEGORY);

      selectedWords.forEach(w => usedWords.add(w));

      selectedCategories.push({
        id: key,
        name: category.name,
        words: selectedWords,
        difficulty: category.difficulty || (selectedCategories.length + 1),
      });
    }
  }

  // Sort by difficulty and reassign difficulty levels 1-4
  selectedCategories.sort((a, b) => a.difficulty - b.difficulty);
  selectedCategories.forEach((cat, idx) => {
    cat.difficulty = idx + 1;
  });

  // Create the word grid (all 16 words shuffled)
  const allWords = selectedCategories.flatMap(cat =>
    cat.words.map(word => ({ word, categoryId: cat.id }))
  );
  const shuffledWords = seededShuffleArray(allWords, random);

  return {
    categories: selectedCategories,
    words: shuffledWords,
  };
}

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

export default function Categories() {
  const [puzzle, setPuzzle] = useState(null);
  const [seed, setSeed] = useState(null);
  const [selectedWords, setSelectedWords] = useState([]);
  const [solvedCategories, setSolvedCategories] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [shakingWords, setShakingWords] = useState([]);
  const [remainingWords, setRemainingWords] = useState([]);

  const initGame = useCallback((customSeed = null) => {
    const today = getTodayDateString();
    const urlSeed = getSeedFromUrl();
    const gameSeed = customSeed ?? urlSeed ?? stringToSeed(`categories-${today}`);
    const newPuzzle = generatePuzzle(gameSeed);

    setSeed(gameSeed);
    setPuzzle(newPuzzle);
    setSelectedWords([]);
    setSolvedCategories([]);
    setMistakes(0);
    setGameState('playing');
    setMessage('');
    setMessageType('');
    setShakingWords([]);
    setRemainingWords(newPuzzle.words.map(w => w.word));
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check for win/lose conditions
  useEffect(() => {
    if (!puzzle) return;

    if (solvedCategories.length === 4) {
      setGameState('won');
      setMessage('Perfect! You found all connections!');
      setMessageType('win');
    } else if (mistakes >= MAX_MISTAKES) {
      setGameState('lost');
      setMessage('Game Over! Better luck next time.');
      setMessageType('lose');
      // Reveal remaining categories
      const remaining = puzzle.categories.filter(
        cat => !solvedCategories.find(s => s.id === cat.id)
      );
      setSolvedCategories([...solvedCategories, ...remaining]);
    }
  }, [solvedCategories, mistakes, puzzle]);

  const showTemporaryMessage = (msg, type, duration = 2000) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      if (gameState === 'playing') {
        setMessage('');
        setMessageType('');
      }
    }, duration);
  };

  const handleWordClick = (word) => {
    if (gameState !== 'playing') return;
    if (!remainingWords.includes(word)) return;

    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else if (selectedWords.length < WORDS_PER_CATEGORY) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length !== WORDS_PER_CATEGORY) return;
    if (gameState !== 'playing') return;

    // Check if all selected words belong to the same category
    const wordCategories = selectedWords.map(word => {
      const wordData = puzzle.words.find(w => w.word === word);
      return wordData?.categoryId;
    });

    const allSameCategory = wordCategories.every(cat => cat === wordCategories[0]);

    if (allSameCategory) {
      // Correct! Find the category and mark it as solved
      const category = puzzle.categories.find(cat => cat.id === wordCategories[0]);
      setSolvedCategories([...solvedCategories, category]);
      setRemainingWords(remainingWords.filter(w => !selectedWords.includes(w)));
      setSelectedWords([]);
      showTemporaryMessage(`Correct! "${category.name}"`, 'correct', 1500);
    } else {
      // Check if 3 out of 4 are correct (close guess)
      const categoryCounts = {};
      wordCategories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(categoryCounts));

      if (maxCount === 3) {
        showTemporaryMessage('One away...', 'close', 1500);
      } else {
        showTemporaryMessage('Not quite right', 'wrong', 1500);
      }

      // Shake animation for wrong answer
      setShakingWords([...selectedWords]);
      setTimeout(() => setShakingWords([]), 500);

      setMistakes(mistakes + 1);
      setSelectedWords([]);
    }
  };

  const handleShuffle = () => {
    if (gameState !== 'playing') return;

    const seed = Date.now();
    const random = createSeededRandom(seed);
    setRemainingWords(seededShuffleArray(remainingWords, random));
    setSelectedWords([]);
  };

  const handleGiveUp = () => {
    if (gameState !== 'playing' || !puzzle) return;
    // Reveal all unsolved categories
    const unsolved = puzzle.categories.filter(
      cat => !solvedCategories.some(s => s.id === cat.id)
    );
    setSolvedCategories([...solvedCategories, ...unsolved]);
    setRemainingWords([]);
    setGameState('gaveUp');
    setMessage('Solution Revealed');
    setMessageType('gaveUp');
  };

  const handleDeselectAll = () => {
    setSelectedWords([]);
  };

  const handleNewGame = () => {
    const randomSeed = Math.floor(Math.random() * 2147483647);
    initGame(randomSeed);
  };

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Categories</h1>
        <p className={styles.instructions}>
          Find groups of four words that share a connection
        </p>
      </div>

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
        {/* Solved categories */}
        <div className={styles.solvedCategories}>
          {solvedCategories.map((category) => (
            <div
              key={category.id}
              className={styles.solvedCategory}
              style={{
                backgroundColor: DIFFICULTY_COLORS[category.difficulty].bg,
                color: DIFFICULTY_COLORS[category.difficulty].text,
              }}
            >
              <div className={styles.categoryName}>{category.name}</div>
              <div className={styles.categoryWords}>
                {category.words.map((word, index) => (
                  <span key={word}>
                    <WordWithDefinition word={word} />
                    {index < category.words.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Word grid */}
        {remainingWords.length > 0 && (
          <div className={styles.grid}>
            {remainingWords.map((word) => (
              <button
                key={word}
                className={`${styles.wordTile}
                  ${selectedWords.includes(word) ? styles.selected : ''}
                  ${shakingWords.includes(word) ? styles.shaking : ''}
                  ${gameState !== 'playing' ? styles.disabled : ''}
                `}
                onClick={() => handleWordClick(word)}
                disabled={gameState !== 'playing'}
              >
                {word}
              </button>
            ))}
          </div>
        )}

        {/* Message display */}
        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}

        {/* Mistakes indicator */}
        <div className={styles.mistakesArea}>
          <span className={styles.mistakesLabel}>Mistakes remaining:</span>
          <div className={styles.mistakesDots}>
            {Array(MAX_MISTAKES).fill(0).map((_, i) => (
              <div
                key={i}
                className={`${styles.mistakeDot} ${i < MAX_MISTAKES - mistakes ? styles.active : styles.used}`}
              />
            ))}
          </div>
        </div>

        {/* Control buttons */}
        <div className={styles.controls}>
          {gameState === 'playing' ? (
            <>
              <button
                className={styles.controlBtn}
                onClick={handleShuffle}
              >
                Shuffle
              </button>
              <button
                className={styles.controlBtn}
                onClick={handleDeselectAll}
                disabled={selectedWords.length === 0}
              >
                Deselect All
              </button>
              <button
                className={`${styles.controlBtn} ${styles.submitBtn}`}
                onClick={handleSubmit}
                disabled={selectedWords.length !== WORDS_PER_CATEGORY}
              >
                Submit
              </button>
              <button
                className={`${styles.controlBtn} ${styles.giveUpBtn}`}
                onClick={handleGiveUp}
              >
                Give Up
              </button>
            </>
          ) : (
            <button
              className={`${styles.controlBtn} ${styles.newGameBtn}`}
              onClick={handleNewGame}
            >
              New Game
            </button>
          )}
        </div>

        {/* Results section for end of game */}
        {gameState !== 'playing' && (
          <div className={styles.results}>
            <div className={styles.resultsTitle}>
              {gameState === 'won' ? '🎉 Congratulations!' : gameState === 'gaveUp' ? '📖 Solution Revealed' : '😔 Game Over'}
            </div>
            <div className={styles.resultsStats}>
              <span>Mistakes: {mistakes}/{MAX_MISTAKES}</span>
              <span>Categories found: {solvedCategories.length}/4</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
