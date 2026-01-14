import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Sequence.module.css';

const COLORS = ['green', 'red', 'yellow', 'blue'];
const FREQUENCIES = {
  green: 329.63,  // E4
  red: 261.63,    // C4
  yellow: 220.00, // A3
  blue: 164.81,   // E3
};

function playTone(frequency, duration = 300) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch {
    // Audio not supported
  }
}

const SPEEDS = {
  slow: { show: 800, gap: 300 },
  normal: { show: 500, gap: 200 },
  fast: { show: 300, gap: 100 },
};

// Export helpers for testing
export {
  COLORS,
  FREQUENCIES,
  SPEEDS,
};

export default function Sequence() {
  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'showing', 'playing', 'gameOver'
  const [activeColor, setActiveColor] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('sequence-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [speed, setSpeed] = useState('normal'); // 'slow', 'normal', 'fast'

  const timeoutRef = useRef(null);
  const isShowingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('sequence-high-score', highScore.toString());
  }, [highScore]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showSequence = useCallback(async (seq) => {
    isShowingRef.current = true;
    setGameState('showing');

    const { show, gap } = SPEEDS[speed];

    for (let i = 0; i < seq.length; i++) {
      if (!isShowingRef.current) break;

      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, gap);
      });

      if (!isShowingRef.current) break;

      const color = seq[i];
      setActiveColor(color);
      playTone(FREQUENCIES[color], show);

      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, show);
      });

      setActiveColor(null);
    }

    if (isShowingRef.current) {
      setGameState('playing');
      setPlayerIndex(0);
    }
    isShowingRef.current = false;
  }, [speed]);

  const startGame = useCallback(() => {
    isShowingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const firstColor = COLORS[Math.floor(Math.random() * 4)];
    const newSequence = [firstColor];
    setSequence(newSequence);
    setScore(0);
    setPlayerIndex(0);

    setTimeout(() => {
      showSequence(newSequence);
    }, 500);
  }, [showSequence]);

  const addToSequence = useCallback(() => {
    const nextColor = COLORS[Math.floor(Math.random() * 4)];
    const newSequence = [...sequence, nextColor];
    setSequence(newSequence);
    setScore(newSequence.length - 1);

    if (newSequence.length - 1 > highScore) {
      setHighScore(newSequence.length - 1);
    }

    setTimeout(() => {
      showSequence(newSequence);
    }, 1000);
  }, [sequence, highScore, showSequence]);

  const handleColorClick = useCallback((color) => {
    if (gameState !== 'playing') return;

    setActiveColor(color);
    playTone(FREQUENCIES[color], 200);

    setTimeout(() => setActiveColor(null), 200);

    if (color === sequence[playerIndex]) {
      if (playerIndex === sequence.length - 1) {
        // Completed sequence
        setGameState('showing');
        addToSequence();
      } else {
        setPlayerIndex(prev => prev + 1);
      }
    } else {
      // Wrong color - game over
      setGameState('gameOver');
      playTone(100, 500); // Error sound
    }
  }, [gameState, sequence, playerIndex, addToSequence]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Sequence</h1>
        <p className={styles.instructions}>
          Watch, remember, repeat! How long a sequence can you memorize?
        </p>
      </div>

      <div className={styles.speedSelector}>
        {['slow', 'normal', 'fast'].map((s) => (
          <button
            key={s}
            className={`${styles.speedBtn} ${speed === s ? styles.active : ''}`}
            onClick={() => setSpeed(s)}
            disabled={gameState === 'showing' || gameState === 'playing'}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreStat}>
            <span className={styles.scoreLabel}>Score</span>
            <span className={styles.scoreValue}>{score}</span>
          </div>
          <div className={styles.scoreStat}>
            <span className={styles.scoreLabel}>Best</span>
            <span className={styles.scoreValue}>{highScore}</span>
          </div>
        </div>

        <div className={styles.simonBoard}>
          {COLORS.map((color) => (
            <button
              key={color}
              className={`${styles.colorBtn} ${styles[color]} ${activeColor === color ? styles.active : ''}`}
              onClick={() => handleColorClick(color)}
              disabled={gameState !== 'playing'}
            />
          ))}
          <div className={styles.centerCircle}>
            {gameState === 'idle' && (
              <button className={styles.startBtn} onClick={startGame}>
                START
              </button>
            )}
            {gameState === 'showing' && (
              <span className={styles.statusText}>Watch...</span>
            )}
            {gameState === 'playing' && (
              <span className={styles.statusText}>Your turn!</span>
            )}
            {gameState === 'gameOver' && (
              <button className={styles.startBtn} onClick={startGame}>
                RETRY
              </button>
            )}
          </div>
        </div>

        {gameState === 'gameOver' && (
          <div className={styles.gameOverMessage}>
            Game Over! You scored {score} {score === 1 ? 'point' : 'points'}
          </div>
        )}
      </div>
    </div>
  );
}
