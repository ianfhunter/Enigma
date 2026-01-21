import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import GameResult from '../../components/GameResult';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './ChimpTest.module.css';

const DIFFICULTIES = {
  easy: { startLength: 3, increment: 1, label: 'Easy' },
  medium: { startLength: 4, increment: 1, label: 'Medium' },
  hard: { startLength: 5, increment: 1, label: 'Hard' },
};

function generateSequence(length, seed) {
  const random = createSeededRandom(seed);
  const positions = Array.from({ length }, (_, i) => i);
  const shuffled = [...positions].sort(() => random() - 0.5);

  return shuffled.map((pos, idx) => ({
    number: idx + 1,
    index: pos,
  }));
}

export default function ChimpTest() {
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'showing', 'playing', 'lost'
  const [currentRound, setCurrentRound] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [clickedNumbers, setClickedNumbers] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = usePersistedState('chimp-test-best', {});
  const showTimeoutRef = useRef(null);

  const { startLength, increment, label } = DIFFICULTIES[difficulty];

  const initGame = useCallback(() => {
    setGameState('waiting');
    setCurrentRound(0);
    setSequence([]);
    setClickedNumbers([]);
    setScore(0);
  }, []);

  const prepareRound = useCallback(() => {
    const roundLength = startLength + (currentRound * increment);
    const seed = stringToSeed(`${getTodayDateString()}-${difficulty}-${currentRound}`);
    const newSequence = generateSequence(roundLength, seed);
    setSequence(newSequence);
  }, [currentRound, startLength, increment, difficulty]);

  const startRound = useCallback(() => {
    setGameState('showing');
    setClickedNumbers([]);

    // Show sequence for 2 seconds, then hide numbers
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    showTimeoutRef.current = setTimeout(() => {
      setGameState('playing');
    }, 2000);
  }, []);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, []);

  const handleBoxClick = (number) => {
    if (gameState !== 'playing') return;
    if (clickedNumbers.includes(number)) return;

    const expectedNumber = clickedNumbers.length + 1;

    if (number === expectedNumber) {
      const newClicked = [...clickedNumbers, number];
      setClickedNumbers(newClicked);

      // Check if round is complete
      if (newClicked.length === sequence.length) {
        const newScore = score + 1;
        setScore(newScore);

        // Update best score
        const currentBest = bestScore[difficulty] || 0;
        if (newScore > currentBest) {
          setBestScore(prev => ({
            ...prev,
            [difficulty]: newScore,
          }));
        }

        // Start next round after a short delay
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          setGameState('waiting');
        }, 500);
      }
    } else {
      // Wrong number clicked - game over
      setGameState('lost');
    }
  };

  // Sort sequence by index for display
  const sortedSequence = [...sequence].sort((a, b) => a.index - b.index);

  const currentBest = bestScore[difficulty] || 0;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Chimp Test"
        instructions="Click the boxes in order (1, 2, 3...). The sequence gets longer each round!"
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
        disabled={gameState === 'playing' || gameState === 'showing'}
      />

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Round</span>
            <span className={styles.statValue}>{currentRound + 1}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Score</span>
            <span className={styles.statValue}>{score}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Best</span>
            <span className={styles.statValue}>{currentBest}</span>
          </div>
        </div>

        {gameState === 'showing' && (
          <div className={styles.hint}>Remember the sequence...</div>
        )}

        {gameState === 'playing' && (
          <div className={styles.hint}>Click the boxes in order</div>
        )}

        {gameState === 'waiting' && (
          <div className={styles.startScreen}>
            <p className={styles.startText}>
              Round {currentRound + 1} - {startLength + (currentRound * increment)} boxes
            </p>
            <button className={styles.startBtn} onClick={() => startRound()}>
              Start
            </button>
          </div>
        )}

        {gameState !== 'waiting' && (
          <div className={styles.grid}>
          {sortedSequence.map((item) => {
            const isClicked = clickedNumbers.includes(item.number);
            const showNumber = gameState === 'showing' || isClicked;
            const isNext = gameState === 'playing' && !isClicked && clickedNumbers.length + 1 === item.number;

            return (
              <button
                key={item.index}
                className={`${styles.box} ${isClicked ? styles.clicked : ''} ${isNext ? styles.next : ''}`}
                onClick={() => handleBoxClick(item.number)}
                disabled={gameState !== 'playing' || isClicked}
              >
                {showNumber && (
                  <span className={styles.number}>{item.number}</span>
                )}
              </button>
            );
          })}
          </div>
        )}

        {gameState === 'lost' && (
          <GameResult
            state="lost"
            title="Game Over!"
            message={`You reached round ${currentRound + 1} with a score of ${score}${score === currentBest && score > 0 ? ' • 🏆 New Best Score!' : ''}`}
          />
        )}

        {gameState !== 'lost' && gameState !== 'showing' && gameState !== 'playing' && (
          <button className={styles.newGameBtn} onClick={initGame}>
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
