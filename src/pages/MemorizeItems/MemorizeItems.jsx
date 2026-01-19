import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './MemorizeItems.module.css';

const ITEM_POOL = [
  '🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍑', '🍒',
  '🍍', '🥭', '🥥', '🍈', '🍋', '🍐', '🍉', '🥑',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '📱', '💻', '⌚', '🎧', '📷', '📺', '🖥️', '⌨️',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
  '🎮', '🎯', '🎲', '🧩', '🎨', '🖼️', '🎭', '🎪',
];

const DIFFICULTIES = {
  easy: { itemCount: 6, displayTime: 5, label: 'Easy' },
  medium: { itemCount: 8, displayTime: 4, label: 'Medium' },
  hard: { itemCount: 10, displayTime: 3, label: 'Hard' },
};

function generateItems(count, seed, itemPool) {
  const random = createSeededRandom(seed);
  const shuffled = [...itemPool].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
}

function generateDistractors(correctItems, count, seed, itemPool) {
  const random = createSeededRandom(seed + 1000); // Different seed for distractors
  const available = itemPool.filter(item => !correctItems.includes(item));
  const shuffled = [...available].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
}

export default function MemorizeItems() {
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'showing', 'recall', 'results'
  const [round, setRound] = useState(0);
  const [correctItems, setCorrectItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = usePersistedState('memorize-items-best', {});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const { itemCount, displayTime, label } = DIFFICULTIES[difficulty];

  const initGame = useCallback(() => {
    setGameState('waiting');
    setRound(0);
    setCorrectItems([]);
    setAllItems([]);
    setSelectedItems(new Set());
    setScore(0);
    setTimeLeft(0);
  }, []);

  const prepareRound = useCallback(() => {
    const seed = stringToSeed(`${getTodayDateString()}-${difficulty}-${round}`);
    const items = generateItems(itemCount, seed, ITEM_POOL);
    const distractors = generateDistractors(items, itemCount, seed, ITEM_POOL);
    const shuffled = [...items, ...distractors].sort(() =>
      createSeededRandom(seed + 2000)() - 0.5
    );

    setCorrectItems(items);
    setAllItems(shuffled);
    setSelectedItems(new Set());
  }, [round, itemCount, difficulty]);

  const startRound = useCallback(() => {
    setGameState('showing');
    setTimeLeft(displayTime);

    // Start countdown
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [displayTime]);

  // Prepare round when it changes or on mount
  useEffect(() => {
    if (gameState === 'waiting') {
      prepareRound();
    }
  }, [gameState, prepareRound]);

  // Prepare first round on mount
  useEffect(() => {
    prepareRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleItemToggle = (item) => {
    if (gameState !== 'recall') return;

    const newSelected = new Set(selectedItems);
    if (newSelected.has(item)) {
      newSelected.delete(item);
    } else {
      newSelected.add(item);
    }
    setSelectedItems(newSelected);
  };

  const handleSubmit = () => {
    if (gameState !== 'recall') return;

    let correctCount = 0;
    selectedItems.forEach(item => {
      if (correctItems.includes(item)) {
        correctCount++;
      }
    });

    // Score is based on correct selections (maybe also penalize false positives)
    // For now, just count correct items
    const roundScore = correctCount;
    const newScore = score + roundScore;
    setScore(newScore);

    // Update best score
    const currentBest = bestScore[difficulty] || 0;
    if (newScore > currentBest) {
      setBestScore(prev => ({
        ...prev,
        [difficulty]: newScore,
      }));
    }

    setGameState('results');

    // Start next round after delay
    setTimeout(() => {
      setRound(prev => prev + 1);
      setGameState('waiting');
    }, 2000);
  };

  const handleStart = () => {
    if (gameState === 'waiting' && allItems.length > 0) {
      startRound();
    }
  };

  const isItemCorrect = (item) => correctItems.includes(item);
  const isItemSelected = (item) => selectedItems.has(item);
  const showResult = gameState === 'results';

  const currentBest = bestScore[difficulty] || 0;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Memorize Items"
        instructions="Study the items shown, then select all the items you remember!"
      />

      <DifficultySelector
        difficulties={Object.keys(DIFFICULTIES).map(key => ({
          id: key,
          label: DIFFICULTIES[key].label,
        }))}
        selectedDifficulty={difficulty}
        onSelectDifficulty={(key) => {
          setDifficulty(key);
          initGame();
        }}
        disabled={gameState === 'showing' || gameState === 'recall'}
      />

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Round</span>
            <span className={styles.statValue}>{round + 1}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Score</span>
            <span className={styles.statValue}>{score}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Best</span>
            <span className={styles.statValue}>{currentBest}</span>
          </div>
          {gameState === 'showing' && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Time</span>
              <span className={styles.statValue}>{timeLeft}s</span>
            </div>
          )}
        </div>

        {gameState === 'showing' && (
          <div className={styles.hint}>
            Memorize the items! ({timeLeft} seconds)
          </div>
        )}

        {gameState === 'recall' && (
          <div className={styles.hint}>
            Select all the items you remember
          </div>
        )}

        {gameState === 'waiting' && (
          <div className={styles.startScreen}>
            <p className={styles.startText}>
              Round {round + 1} - {itemCount} items to memorize
            </p>
            <button className={styles.startBtn} onClick={handleStart}>
              Start
            </button>
          </div>
        )}

        {gameState !== 'waiting' && (
          <div className={styles.itemsGrid}>
          {(gameState === 'showing' ? correctItems : allItems).map((item, index) => {
            const selected = isItemSelected(item);
            const correct = isItemCorrect(item);
            const showFeedback = showResult;

            let className = styles.item;
            if (selected) {
              className += ` ${styles.selected}`;
            }
            if (showFeedback) {
              if (correct && selected) {
                className += ` ${styles.correct}`;
              } else if (correct && !selected) {
                className += ` ${styles.missed}`;
              } else if (!correct && selected) {
                className += ` ${styles.incorrect}`;
              }
            }

            return (
              <button
                key={`${item}-${index}`}
                className={className}
                onClick={() => handleItemToggle(item)}
                disabled={gameState === 'showing' || gameState === 'results'}
              >
                <span className={styles.itemEmoji}>{item}</span>
              </button>
            );
          })}
          </div>
        )}

        {gameState === 'recall' && (
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={selectedItems.size === 0}
          >
            Submit
          </button>
        )}

        {gameState === 'results' && (
          <div className={styles.results}>
            <div className={styles.resultsEmoji}>
              {selectedItems.size === correctItems.length &&
               Array.from(selectedItems).every(item => correctItems.includes(item))
                ? '🎉' : '📝'}
            </div>
            <h3>Round Complete!</h3>
            <p>
              Selected: {selectedItems.size} / Correct: {correctItems.length}
            </p>
          </div>
        )}

        {gameState === 'results' && (
          <button className={styles.newGameBtn} onClick={() => setGameState('waiting')}>
            Next Round
          </button>
        )}
      </div>
    </div>
  );
}
