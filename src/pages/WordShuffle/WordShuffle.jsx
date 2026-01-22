import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import { isValidWord, shuffleArray, createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './WordShuffle.module.css';

const DICE_4X4 = [
  'AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS',
  'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
  'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
  'EIOSST', 'ELRTTY', 'HIMNQU', 'HLNNRZ'
];

const DICE_5X5 = [
  'AAAFRS', 'AAEEEE', 'AAFIRS', 'ADENNN', 'AEEEEM',
  'AEEGMU', 'AEGMNN', 'AFIRSY', 'BJKQXZ', 'CCNSTW',
  'CEIILT', 'CEILPT', 'CEIPST', 'DDLNOR', 'DHHLOR',
  'DHHNOT', 'DHLNOR', 'EIIITT', 'EMOTTT', 'ENSSSU',
  'FIPRSY', 'GORRVW', 'HIPRRY', 'NOOTUW', 'OOOTTU'
];

const GAME_TIME = 180; // 3 minutes

function generateBoard(size, seed) {
  const random = createSeededRandom(seed);
  const dice = size === 4 ? DICE_4X4 : DICE_5X5;

  // Shuffle dice
  const shuffledDice = [...dice];
  for (let i = shuffledDice.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledDice[i], shuffledDice[j]] = [shuffledDice[j], shuffledDice[i]];
  }

  // Roll each die
  const board = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      const dieIndex = i * size + j;
      const die = shuffledDice[dieIndex];
      const face = die[Math.floor(random() * 6)];
      row.push(face === 'Q' ? 'Qu' : face);
    }
    board.push(row);
  }

  return board;
}

function findAllValidWords(board) {
  const size = board.length;
  const validWords = new Set();

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  function dfs(row, col, path, visited) {
    const letter = board[row][col];
    const currentPath = path + letter;

    // Check if current path forms a valid word (min 3 letters)
    if (currentPath.length >= 3 && isValidWord(currentPath)) {
      validWords.add(currentPath.toUpperCase());
    }

    // Continue searching if path is short enough
    if (currentPath.length < 8) {
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        const key = `${newRow},${newCol}`;

        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size &&
          !visited.has(key)
        ) {
          const newVisited = new Set(visited);
          newVisited.add(key);
          dfs(newRow, newCol, currentPath, newVisited);
        }
      }
    }
  }

  // Start DFS from each cell
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const visited = new Set([`${row},${col}`]);
      dfs(row, col, '', visited);
    }
  }

  return Array.from(validWords).sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function isValidPath(board, path) {
  if (path.length < 2) return true;

  const size = board.length;

  for (let i = 1; i < path.length; i++) {
    const [r1, c1] = path[i - 1];
    const [r2, c2] = path[i];

    // Check adjacency
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);

    if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) {
      return false;
    }
  }

  return true;
}

function getWordScore(word) {
  const len = word.length;
  if (len <= 2) return 0;
  if (len === 3 || len === 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
}

// Export helpers for testing
export {
  DICE_4X4,
  DICE_5X5,
  GAME_TIME,
  generateBoard,
  findAllValidWords,
  isValidPath,
  getWordScore,
};

export default function WordShuffle() {
  const { t } = useTranslation();
  const [size, setSize] = useState(4);
  const [board, setBoard] = useState([]);
  const [allValidWords, setAllValidWords] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [currentPath, setCurrentPath] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'ended'
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [seed, setSeed] = useState(null);

  const timerRef = useRef(null);

  const initGame = useCallback((newSize = size, newPuzzle = false, customSeed = null) => {
    const today = getTodayDateString();
    const index = newPuzzle ? puzzleIndex + 1 : puzzleIndex;
    if (newPuzzle) setPuzzleIndex(index);
    const gameSeed = customSeed ?? stringToSeed(`wordshuffle-${today}-${newSize}-${index}`);
    const newBoard = generateBoard(newSize, gameSeed);

    setSeed(gameSeed);
    setBoard(newBoard);
    setSize(newSize);
    setFoundWords(new Set());
    setCurrentPath([]);
    setCurrentWord('');
    setTimeLeft(GAME_TIME);
    setGameState('ready');
    setMessage('');
    setShowAllWords(false);

    // Pre-compute valid words
    const words = findAllValidWords(newBoard);
    setAllValidWords(words);
  }, [size, puzzleIndex]);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('ended');
            setShowAllWords(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
  };

  const handleCellMouseDown = (row, col) => {
    if (gameState !== 'playing') return;

    setIsDragging(true);
    setCurrentPath([[row, col]]);
    setCurrentWord(board[row][col]);
    setMessage('');
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isDragging || gameState !== 'playing') return;

    // Check if cell is already in path
    if (currentPath.some(([r, c]) => r === row && c === col)) return;

    // Check if adjacent to last cell
    const [lastRow, lastCol] = currentPath[currentPath.length - 1];
    const dr = Math.abs(row - lastRow);
    const dc = Math.abs(col - lastCol);

    if (dr <= 1 && dc <= 1) {
      const newPath = [...currentPath, [row, col]];
      setCurrentPath(newPath);
      setCurrentWord(prev => prev + board[row][col]);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (currentWord.length >= 3) {
      const upperWord = currentWord.toUpperCase();

      if (foundWords.has(upperWord)) {
        setMessage('Already found!');
      } else if (allValidWords.includes(upperWord)) {
        setFoundWords(prev => new Set([...prev, upperWord]));
        setMessage(`+${getWordScore(upperWord)} points!`);
      } else {
        setMessage('Not a valid word');
      }
    }

    setCurrentPath([]);
    setCurrentWord('');
  };

  // Touch event handlers for mobile
  const handleTouchStart = (row, col, e) => {
    e.preventDefault();
    handleCellMouseDown(row, col);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || gameState !== 'playing') return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.dataset.row !== undefined) {
      const row = parseInt(element.dataset.row);
      const col = parseInt(element.dataset.col);
      handleCellMouseEnter(row, col);
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const isInPath = (row, col) => {
    return currentPath.some(([r, c]) => r === row && c === col);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalScore = Array.from(foundWords).reduce((sum, word) => sum + getWordScore(word), 0);
  const maxScore = allValidWords.reduce((sum, word) => sum + getWordScore(word), 0);

  return (
    <div className={styles.container}>
      <GameHeader
        title="WordShuffle"
        instructions="Connect adjacent letters to form words. Drag to select!"
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
            initGame(size, false, seedNum);
          }}
        />
      )}

      <SizeSelector
        sizes={[4, 5]}
        selected={size}
        onSelect={(s) => initGame(s)}
        formatLabel={(s) => `${s}×${s}`}
      />

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Time</span>
            <span className={`${styles.statValue} ${timeLeft <= 30 ? styles.warning : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Score</span>
            <span className={styles.statValue}>{totalScore}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Words</span>
            <span className={styles.statValue}>{foundWords.size}/{allValidWords.length}</span>
          </div>
        </div>

        {gameState === 'ready' && (
          <button className={styles.startBtn} onClick={startGame}>
            Start Game
          </button>
        )}

        <div
          className={`${styles.board} ${gameState !== 'playing' ? styles.disabled : ''}`}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {board.map((row, rowIndex) =>
            row.map((letter, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                data-row={rowIndex}
                data-col={colIndex}
                className={`${styles.cell} ${isInPath(rowIndex, colIndex) ? styles.selected : ''}`}
                onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                onTouchStart={(e) => handleTouchStart(rowIndex, colIndex, e)}
              >
                {letter}
              </div>
            ))
          )}
        </div>

        {gameState === 'playing' && (
          <GiveUpButton
            onGiveUp={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setGameState('ended');
              setShowAllWords(true);
            }}
          />
        )}

        {currentWord && (
          <div className={styles.currentWord}>{currentWord}</div>
        )}

        {message && (
          <div className={`${styles.message} ${message.includes('+') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <div className={styles.wordList}>
          <h3>{t('common.foundWords')} ({foundWords.size})</h3>
          <div className={styles.words}>
            {Array.from(foundWords).sort((a, b) => b.length - a.length).map(word => (
              <span key={word} className={styles.word}>
                {word} <small>+{getWordScore(word)}</small>
              </span>
            ))}
          </div>
        </div>

        {gameState === 'ended' && showAllWords && (
          <div className={styles.allWords}>
            <h3>{t('common.allWords')} ({allValidWords.length})</h3>
            <div className={styles.words}>
              {allValidWords.map(word => (
                <WordWithDefinition
                  key={word}
                  word={word}
                  className={`${styles.word} ${foundWords.has(word) ? styles.found : styles.missed}`}
                />
              ))}
            </div>
          </div>
        )}

        {gameState === 'ended' && (
          <div className={styles.finalScore}>
            Final Score: {totalScore} / {maxScore} ({Math.round((totalScore / maxScore) * 100)}%)
          </div>
        )}

        <button className={styles.newGameBtn} onClick={() => initGame(size, true)}>
          New Game
        </button>
      </div>
    </div>
  );
}
