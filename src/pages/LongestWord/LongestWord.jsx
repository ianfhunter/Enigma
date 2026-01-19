import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isValidWord, createSeededRandom, getTodayDateString, stringToSeed, findLongestWordWithSeed } from '../../data/wordUtils';
import SeedDisplay from '../../components/SeedDisplay';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './LongestWord.module.css';

const MAX_WORDS = 5;

// Common 2-3 letter combinations that appear in many words
const SEEDS = [
  'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ON', 'AT', 'EN', 'ND',
  'ST', 'OR', 'TE', 'ES', 'OU', 'NT', 'IS', 'AR', 'IT', 'TO',
  'NG', 'AL', 'SE', 'HA', 'AS', 'LE', 'VE', 'DE', 'EA', 'RO',
  'ACE', 'AGE', 'ATE', 'ANT', 'AIR', 'ART',
  'EAR', 'END', 'EST', 'ENT',
  'ING', 'ION', 'IST', 'ISH',
  'OUR', 'OUT', 'OWN', 'ORE',
  'URN', 'USE', 'UNE',
];

function generateSeed(random) {
  const idx = Math.floor(random() * SEEDS.length);
  return SEEDS[idx];
}

function containsSeed(word, seed) {
  return word.toUpperCase().includes(seed.toUpperCase());
}

// Export helpers for testing
export {
  MAX_WORDS,
  SEEDS,
  generateSeed,
  containsSeed,
};

export default function LongestWord() {
  const [seed, setSeed] = useState('');
  const [seedNum, setSeedNum] = useState(null);
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [message, setMessage] = useState('');
  const [longestPossibleWord, setLongestPossibleWord] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('longestword-stats');
    return saved ? JSON.parse(saved) : { bestLength: 0, gamesPlayed: 0 };
  });

  const inputRef = useRef(null);

  const initGame = useCallback((useRandomSeed = false, customSeedNum = null) => {
    let newSeedNum;
    if (customSeedNum !== null) {
      // Use provided custom seed
      newSeedNum = typeof customSeedNum === 'string'
        ? (isNaN(parseInt(customSeedNum, 10)) ? stringToSeed(customSeedNum) : parseInt(customSeedNum, 10))
        : customSeedNum;
    } else if (useRandomSeed) {
      // Use current timestamp for a truly random puzzle
      newSeedNum = stringToSeed(`longestword-${Date.now()}-${Math.random()}`);
    } else {
      // Use daily seed for consistent daily puzzle
      const today = getTodayDateString();
      newSeedNum = stringToSeed(`longestword-${today}`);
    }
    const random = createSeededRandom(newSeedNum);
    const newSeed = generateSeed(random);

    // Find the longest possible word for this seed
    const longest = findLongestWordWithSeed(newSeed);

    setSeed(newSeed);
    setSeedNum(newSeedNum);
    setWords([]);
    setCurrentWord('');
    setMessage('');
    setLongestPossibleWord(longest);
    setGameState('playing');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    localStorage.setItem('longestword-stats', JSON.stringify(stats));
  }, [stats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentWord || gameState !== 'playing') return;

    const upperWord = currentWord.trim().toUpperCase();

    // Validate word contains seed
    if (!containsSeed(upperWord, seed)) {
      setMessage(`Word must contain "${seed}"`);
      return;
    }

    // Check minimum length
    if (upperWord.length < 4) {
      setMessage('Word must be at least 4 letters');
      return;
    }

    // Check if already found
    if (words.some(w => w.toUpperCase() === upperWord)) {
      setMessage('Already found this word');
      return;
    }

    // Check if valid word
    if (!isValidWord(upperWord)) {
      setMessage('Not a valid word');
      return;
    }

    // Add word
    const newWords = [...words, upperWord].sort((a, b) => b.length - a.length);
    setWords(newWords);
    setCurrentWord('');
    setMessage(`+${upperWord.length} letters!`);

    // Update best
    if (upperWord.length > stats.bestLength) {
      setStats(prev => ({ ...prev, bestLength: upperWord.length }));
    }

    // Auto-finish after MAX_WORDS
    if (newWords.length >= MAX_WORDS) {
      setGameState('finished');
      setStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
    }
  };

  const handleGiveUp = () => {
    setGameState('finished');
    setStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
  };

  const longestFound = words.length > 0 ? words[0].length : 0;
  const totalLetters = words.reduce((sum, word) => sum + word.length, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Longest Word</h1>
        <p className={styles.instructions}>
          Find the longest words containing the starter letters!
        </p>
      </div>

      {seedNum !== null && (
        <SeedDisplay
          seed={seedNum}
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
        <div className={styles.starterDisplay}>
          <span className={styles.seedLabel}>Today's Starter</span>
          <span className={styles.seed}>{seed}</span>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Words</span>
            <span className={styles.statValue}>{words.length}/{MAX_WORDS}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Longest</span>
            <span className={styles.statValue}>{longestFound}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total</span>
            <span className={styles.statValue}>{totalLetters}</span>
          </div>
        </div>

        {gameState === 'playing' && (
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={currentWord}
              onChange={(e) => {
                setCurrentWord(e.target.value.toUpperCase());
                setMessage('');
              }}
              placeholder={`Enter a word with "${seed}"...`}
              className={styles.input}
              autoFocus
            />
            <button type="submit" className={styles.submitBtn}>
              Submit
            </button>
          </form>
        )}

        {message && (
          <div className={`${styles.message} ${message.includes('+') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <div className={styles.wordList}>
          <h3>Your Words ({words.length})</h3>
          <div className={styles.words}>
            {words.map((word, i) => (
              <div key={i} className={styles.wordItem}>
                <span className={styles.word}>
                  {word.split('').map((letter, j) => {
                    const seedStart = word.toUpperCase().indexOf(seed);
                    const isInSeed = j >= seedStart && j < seedStart + seed.length;
                    return (
                      <span
                        key={j}
                        className={isInSeed ? styles.seedLetter : ''}
                      >
                        {letter}
                      </span>
                    );
                  })}
                </span>
                <span className={styles.wordLength}>{word.length} letters</span>
              </div>
            ))}
          </div>
        </div>

        {gameState === 'playing' && (
          <button className={styles.giveUpBtn} onClick={handleGiveUp}>
            Give Up
          </button>
        )}

        {gameState === 'finished' && (
          <div className={styles.summary}>
            <h3>Game Summary</h3>
            <p>You found {words.length} word{words.length !== 1 ? 's' : ''}</p>
            <p>Your longest: {longestFound} letters</p>
            <p>Total letters: {totalLetters}</p>
            {longestPossibleWord && (
              <div className={styles.longestReveal}>
                <span className={styles.longestLabel}>Longest possible word:</span>
                <WordWithDefinition word={longestPossibleWord.word} className={styles.longestWordWrapper}>
                  <span className={styles.longestWord}>
                    {longestPossibleWord.word.split('').map((letter, j) => {
                      const seedStart = longestPossibleWord.word.indexOf(seed);
                      const isInSeed = j >= seedStart && j < seedStart + seed.length;
                      return (
                        <span
                          key={j}
                          className={isInSeed ? styles.seedLetter : ''}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </span>
                </WordWithDefinition>
                <span className={styles.longestLength}>({longestPossibleWord.length} letters)</span>
              </div>
            )}
            <p className={styles.bestLabel}>Best ever: {stats.bestLength} letters</p>
          </div>
        )}

        <div className={styles.buttonRow}>
          <button className={styles.newGameBtn} onClick={() => initGame(true)}>
            New Puzzle
          </button>
          <button className={styles.dailyBtn} onClick={() => initGame(false)}>
            Today's Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
