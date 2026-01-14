import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './CodeBreaker.module.css';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const COLOR_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Teal'];

const DIFFICULTIES = {
  easy: { codeLength: 4, colorCount: 6, maxGuesses: 12 },
  medium: { codeLength: 4, colorCount: 6, maxGuesses: 10 },
  hard: { codeLength: 5, colorCount: 8, maxGuesses: 10 },
};

function generateSecretCode(length, colorCount) {
  return Array.from({ length }, () => Math.floor(Math.random() * colorCount));
}

function checkGuess(guess, secret) {
  const exactMatches = []; // correct color and position
  const colorMatches = [];  // correct color, wrong position

  const secretCopy = [...secret];
  const guessCopy = [...guess];

  // First pass: find exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      exactMatches.push(i);
      secretCopy[i] = null;
      guessCopy[i] = null;
    }
  }

  // Second pass: find color matches
  for (let i = 0; i < guess.length; i++) {
    if (guessCopy[i] === null) continue;

    const foundIndex = secretCopy.findIndex(c => c === guessCopy[i] && c !== null);
    if (foundIndex !== -1) {
      colorMatches.push(i);
      secretCopy[foundIndex] = null;
    }
  }

  return {
    exact: exactMatches.length,
    color: colorMatches.length,
  };
}

export default function CodeBreaker() {
  const [difficulty, setDifficulty] = useState('medium');
  const [secretCode, setSecretCode] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('codebreaker-stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0 };
  });

  const { codeLength, colorCount, maxGuesses } = DIFFICULTIES[difficulty];

  const initGame = useCallback(() => {
    setSecretCode(generateSecretCode(codeLength, colorCount));
    setGuesses([]);
    setCurrentGuess(Array(codeLength).fill(null));
    setSelectedSlot(0);
    setGameState('playing');
  }, [codeLength, colorCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    localStorage.setItem('codebreaker-stats', JSON.stringify(stats));
  }, [stats]);

  const handleColorSelect = (colorIndex) => {
    if (gameState !== 'playing') return;

    const newGuess = [...currentGuess];
    newGuess[selectedSlot] = colorIndex;
    setCurrentGuess(newGuess);

    // Auto-advance to next empty slot
    const nextEmpty = newGuess.findIndex((c, i) => c === null && i > selectedSlot);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      // Find any empty slot
      const anyEmpty = newGuess.findIndex(c => c === null);
      if (anyEmpty !== -1) {
        setSelectedSlot(anyEmpty);
      }
    }
  };

  const handleSlotClick = (index) => {
    if (gameState !== 'playing') return;
    setSelectedSlot(index);
  };

  const handleClearSlot = () => {
    if (gameState !== 'playing') return;
    const newGuess = [...currentGuess];
    newGuess[selectedSlot] = null;
    setCurrentGuess(newGuess);
  };

  const handleGiveUp = () => {
    if (gameState !== 'playing') return;
    setGameState('gaveUp');
    setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
  };

  const handleSubmitGuess = () => {
    if (gameState !== 'playing') return;
    if (currentGuess.some(c => c === null)) return;

    const result = checkGuess(currentGuess, secretCode);
    const newGuess = {
      colors: [...currentGuess],
      result,
    };

    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    if (result.exact === codeLength) {
      setGameState('won');
      setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
    } else if (newGuesses.length >= maxGuesses) {
      setGameState('lost');
      setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
    } else {
      setCurrentGuess(Array(codeLength).fill(null));
      setSelectedSlot(0);
    }
  };

  const renderFeedbackPegs = (result) => {
    const pegs = [];
    for (let i = 0; i < result.exact; i++) {
      pegs.push(
        <div key={`exact-${i}`} className={`${styles.feedbackPeg} ${styles.exact}`} title="Correct color & position">
          ●
        </div>
      );
    }
    for (let i = 0; i < result.color; i++) {
      pegs.push(
        <div key={`color-${i}`} className={`${styles.feedbackPeg} ${styles.color}`} title="Right color, wrong position">
          ○
        </div>
      );
    }
    while (pegs.length < codeLength) {
      pegs.push(<div key={`empty-${pegs.length}`} className={`${styles.feedbackPeg} ${styles.empty}`} />);
    }
    return pegs;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>CodeBreaker</h1>
        <p className={styles.instructions}>
          Crack the secret code! Check the feedback pegs after each guess.
        </p>
      </div>

      <div className={styles.difficultySelector}>
        {Object.keys(DIFFICULTIES).map((level) => (
          <button
            key={level}
            className={`${styles.difficultyBtn} ${difficulty === level ? styles.active : ''}`}
            onClick={() => setDifficulty(level)}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Guesses</span>
            <span className={styles.statValue}>{guesses.length} / {maxGuesses}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Wins</span>
            <span className={styles.statValue}>{stats.wins}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Losses</span>
            <span className={styles.statValue}>{stats.losses}</span>
          </div>
        </div>

        <div className={styles.board}>
          {/* Secret code (revealed when game over) */}
          <div className={styles.secretRow}>
            {secretCode.map((colorIndex, i) => (
              <div
                key={i}
                className={`${styles.peg} ${gameState === 'playing' ? styles.hidden : ''}`}
                style={gameState !== 'playing' ? { backgroundColor: COLORS[colorIndex] } : {}}
              >
                {gameState === 'playing' && '?'}
              </div>
            ))}
            <div className={styles.feedbackArea} />
          </div>

          <div className={styles.divider} />

          {/* Previous guesses */}
          {guesses.map((guess, guessIndex) => (
            <div key={guessIndex} className={styles.guessRow}>
              {guess.colors.map((colorIndex, i) => (
                <div
                  key={i}
                  className={styles.peg}
                  style={{ backgroundColor: COLORS[colorIndex] }}
                />
              ))}
              <div className={styles.feedbackArea}>
                {renderFeedbackPegs(guess.result)}
              </div>
            </div>
          ))}

          {/* Current guess */}
          {gameState === 'playing' && (
            <div className={styles.guessRow}>
              {currentGuess.map((colorIndex, i) => (
                <div
                  key={i}
                  className={`${styles.peg} ${styles.slot} ${selectedSlot === i ? styles.selected : ''} ${colorIndex === null ? styles.empty : ''}`}
                  style={colorIndex !== null ? { backgroundColor: COLORS[colorIndex] } : {}}
                  onClick={() => handleSlotClick(i)}
                />
              ))}
              <button
                className={styles.submitBtn}
                onClick={handleSubmitGuess}
                disabled={currentGuess.some(c => c === null)}
              >
                ✓
              </button>
            </div>
          )}
        </div>

        {/* Feedback legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendPeg} ${styles.exact}`}>●</div>
            <span>Correct color & position</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendPeg} ${styles.color}`}>○</div>
            <span>Right color, wrong spot</span>
          </div>
        </div>

        {/* Color picker */}
        {gameState === 'playing' && (
          <div className={styles.colorPicker}>
            {COLORS.slice(0, colorCount).map((color, index) => (
              <button
                key={index}
                className={styles.colorBtn}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(index)}
                title={COLOR_NAMES[index]}
              />
            ))}
            <button className={styles.clearBtn} onClick={handleClearSlot}>
              ✕
            </button>
          </div>
        )}

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 You cracked the code in {guesses.length} guesses!
          </div>
        )}

        {gameState === 'lost' && (
          <div className={styles.loseMessage}>
            Game Over! The code was revealed above.
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <span className={styles.gaveUpIcon}>📖</span>
            <span>Code Revealed</span>
          </div>
        )}

        <div className={styles.buttons}>
          {gameState === 'playing' && (
            <button
              className={styles.giveUpBtn}
              onClick={handleGiveUp}
            >
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            {gameState === 'playing' ? 'New Game' : 'Play Again'}
          </button>
        </div>
      </div>
    </div>
  );
}
