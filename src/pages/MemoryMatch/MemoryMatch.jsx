import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './MemoryMatch.module.css';

const CARD_SYMBOLS = [
  '🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸',
  '🌈', '🌸', '🍀', '🍎', '🍕', '🎂', '🎃', '🎄',
  '🐶', '🐱', '🐼', '🦊', '🦋', '🐢', '🦄', '🐙',
  '🚀', '⚡', '🔥', '💎', '🎵', '❤️', '⭐', '🌙'
];

const GRID_SIZES = {
  '4×3': { cols: 4, rows: 3, pairs: 6 },
  '4×4': { cols: 4, rows: 4, pairs: 8 },
  '6×4': { cols: 6, rows: 4, pairs: 12 },
  '6×5': { cols: 6, rows: 5, pairs: 15 },
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateCards(pairs) {
  const symbols = shuffleArray(CARD_SYMBOLS).slice(0, pairs);
  const cards = [];

  symbols.forEach((symbol, index) => {
    cards.push({ id: index * 2, symbol, pairId: index });
    cards.push({ id: index * 2 + 1, symbol, pairId: index });
  });

  return shuffleArray(cards);
}

export default function MemoryMatch() {
  const [gridSize, setGridSize] = useState('4×4');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'won'
  const [bestScores, setBestScores] = useState(() => {
    const saved = localStorage.getItem('memory-match-best');
    return saved ? JSON.parse(saved) : {};
  });
  const [isLocked, setIsLocked] = useState(false);

  const timerRef = useRef(null);

  const initGame = useCallback(() => {
    const { pairs } = GRID_SIZES[gridSize];
    setCards(generateCards(pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setTimer(0);
    setIsRunning(false);
    setGameState('ready');
    setIsLocked(false);
  }, [gridSize]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    localStorage.setItem('memory-match-best', JSON.stringify(bestScores));
  }, [bestScores]);

  const handleCardClick = (index) => {
    if (isLocked) return;
    if (flipped.includes(index)) return;
    if (matched.has(cards[index].pairId)) return;

    // Start game on first click
    if (gameState === 'ready') {
      setGameState('playing');
      setIsRunning(true);
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      if (cards[first].pairId === cards[second].pairId) {
        // Match found
        const newMatched = new Set(matched);
        newMatched.add(cards[first].pairId);
        setMatched(newMatched);
        setFlipped([]);
        setIsLocked(false);

        // Check for win
        const { pairs } = GRID_SIZES[gridSize];
        if (newMatched.size === pairs) {
          setGameState('won');
          setIsRunning(false);

          // Save best score
          const currentBest = bestScores[gridSize];
          if (!currentBest || moves + 1 < currentBest.moves ||
              (moves + 1 === currentBest.moves && timer < currentBest.time)) {
            setBestScores(prev => ({
              ...prev,
              [gridSize]: { moves: moves + 1, time: timer }
            }));
          }
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlipped([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { cols, rows: _rows, pairs } = GRID_SIZES[gridSize];
  const currentBest = bestScores[gridSize];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Memory Match</h1>
        <p className={styles.instructions}>
          Find all matching pairs! Click cards to flip them and match symbols.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.sizeSelector}>
          {Object.keys(GRID_SIZES).map((size) => (
            <button
              key={size}
              className={`${styles.sizeBtn} ${gridSize === size ? styles.active : ''}`}
              onClick={() => setGridSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Time</span>
            <span className={styles.statValue}>{formatTime(timer)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Pairs</span>
            <span className={styles.statValue}>{matched.size}/{pairs}</span>
          </div>
          {currentBest && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Best</span>
              <span className={styles.statValue}>{currentBest.moves} moves</span>
            </div>
          )}
        </div>

        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: `${cols * 80}px`,
          }}
        >
          {cards.map((card, index) => {
            const isFlipped = flipped.includes(index) || matched.has(card.pairId);
            const isMatched = matched.has(card.pairId);

            return (
              <button
                key={card.id}
                className={`${styles.card} ${isFlipped ? styles.flipped : ''} ${isMatched ? styles.matched : ''}`}
                onClick={() => handleCardClick(index)}
                disabled={isMatched}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}>?</div>
                  <div className={styles.cardBack}>{card.symbol}</div>
                </div>
              </button>
            );
          })}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Congratulations!</h3>
            <p>Completed in {moves} moves and {formatTime(timer)}</p>
            {currentBest && moves === currentBest.moves && timer <= currentBest.time && (
              <p className={styles.newBest}>🏆 New Best Score!</p>
            )}
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {gameState === 'won' ? 'Play Again' : 'New Game'}
        </button>
      </div>
    </div>
  );
}

