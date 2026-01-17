import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRandomCountry } from '@datasets/countries';
import { getCapital, getRandomCapitalOptions } from '@datasets/capitals';
import styles from './CapitalGuesser.module.css';

const TOTAL_ROUNDS = 10;

const defaultDeps = {
  getRandomCountry,
  getCapital,
  getRandomCapitalOptions,
};

export function buildRound(deps = defaultDeps) {
  const { getRandomCountry: randomCountry, getCapital: capitalLookup, getRandomCapitalOptions: optionsLookup } = deps;

  const country = randomCountry();

  const capital = capitalLookup(country.code);
  const options = optionsLookup(capital, 3);

  return {
    country: { ...country, capital },
    options,
  };
}

export default function CapitalGuesser() {
  const [mode, setMode] = useState(null); // 'endless', 'challenge'
  const [currentCountry, setCurrentCountry] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem('capital-guesser-best-streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('capital-guesser-stats');
    return saved ? JSON.parse(saved) : { played: 0, won: 0, totalCorrect: 0 };
  });

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('capital-guesser-stats', JSON.stringify(stats));
  }, [stats]);

  // Save best streak
  useEffect(() => {
    localStorage.setItem('capital-guesser-best-streak', bestStreak.toString());
  }, [bestStreak]);

  const setupRound = useCallback(() => {
    const { country, options } = buildRound();
    setCurrentCountry(country);
    setOptions(options);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, []);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setScore(0);
    setRound(1);
    setStreak(0);
    setGameOver(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    if (mode) {
      setupRound();
    }
  }, [mode, setupRound]);

  const handleGuess = (capitalName) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(capitalName);
    const correct = capitalName === currentCountry.capital;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        return newStreak;
      });
      setStats(prev => ({ ...prev, totalCorrect: prev.totalCorrect + 1 }));
    } else {
      setStreak(0);
    }

  };

  const nextRound = () => {
    if (mode === 'challenge' && round >= TOTAL_ROUNDS) {
      setGameOver(true);
      setStats(prev => ({
        ...prev,
        played: prev.played + 1,
        won: score >= Math.floor(TOTAL_ROUNDS / 2) ? prev.won + 1 : prev.won
      }));
      return;
    }

    if (mode === 'endless' || mode === 'challenge') {
      setRound(prev => prev + 1);
      setupRound();
    }
  };

  const backToMenu = () => {
    setMode(null);
    setCurrentCountry(null);
    setGameOver(false);
  };

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Capital Guesser</h1>
          <p className={styles.instructions}>
            Test your knowledge of world capitals! Can you name the capital of each country?
          </p>
        </div>

        <div className={styles.menuArea}>
          <div className={styles.modeCards}>

            <button
              className={styles.modeCard}
              onClick={() => startGame('challenge')}
            >
              <span className={styles.modeIcon}>🏆</span>
              <span className={styles.modeTitle}>Challenge</span>
              <span className={styles.modeDesc}>{TOTAL_ROUNDS} countries, score as high as you can!</span>
            </button>

            <button
              className={styles.modeCard}
              onClick={() => startGame('endless')}
            >
              <span className={styles.modeIcon}>∞</span>
              <span className={styles.modeTitle}>Endless</span>
              <span className={styles.modeDesc}>Keep playing until you want to stop</span>
            </button>
          </div>

          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.played}</span>
              <span className={styles.statLabel}>Played</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.totalCorrect}</span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{bestStreak}</span>
              <span className={styles.statLabel}>Best Streak</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Win Rate</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game over screen (challenge mode)
  if (gameOver) {
    const percentage = Math.round((score / TOTAL_ROUNDS) * 100);
    const isPerfect = score === TOTAL_ROUNDS;

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Challenge Complete!</h1>
        </div>

        <div className={styles.gameOverArea}>
          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {TOTAL_ROUNDS}</span>
          </div>

          <div className={styles.resultMessage}>
            {isPerfect && <span className={styles.perfect}>🎉 Perfect Score! 🎉</span>}
            {percentage >= 80 && !isPerfect && <span>🌟 Excellent!</span>}
            {percentage >= 60 && percentage < 80 && <span>👍 Good job!</span>}
            {percentage >= 40 && percentage < 60 && <span>Keep practicing!</span>}
            {percentage < 40 && <span>Better luck next time!</span>}
          </div>

          <div className={styles.gameOverActions}>
            <button className={styles.playAgainBtn} onClick={() => startGame('challenge')}>
              Play Again
            </button>
            <button className={styles.menuBtn} onClick={backToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={backToMenu}>← Back to Menu</button>
        <h1 className={styles.title}>Capital Guesser</h1>

        <div className={styles.gameInfo}>
          {mode === 'challenge' && (
            <>
              <span className={styles.modeBadge}>Challenge</span>
              <span className={styles.roundInfo}>Round {round}/{TOTAL_ROUNDS}</span>
            </>
          )}
          {mode === 'endless' && (
            <>
              <span className={styles.modeBadge}>Endless</span>
              <span className={styles.roundInfo}>Round {round}</span>
            </>
          )}
          {(mode === 'challenge' || mode === 'endless') && (
            <span className={styles.scoreInfo}>Score: {score}</span>
          )}
          {streak > 1 && <span className={styles.streakBadge}>🔥 {streak} streak</span>}
        </div>
      </div>

      {currentCountry && (
        <div className={styles.gameArea}>
          <div className={styles.countryDisplay}>
            <img
              src={`https://flagcdn.com/w80/${currentCountry.code.toLowerCase()}.png`}
              alt={`${currentCountry.name} flag`}
              className={styles.smallFlag}
            />
            <span className={styles.countryName}>{currentCountry.name}</span>
          </div>

          <p className={styles.question}>What is the capital of {currentCountry.name}?</p>

          <div className={styles.optionsGrid}>
            {options.map((capital) => {
              const isSelected = selectedAnswer === capital;
              const isAnswer = capital === currentCountry.capital;
              const showResult = selectedAnswer !== null;

              let buttonClass = styles.optionBtn;
              if (showResult) {
                if (isAnswer) {
                  buttonClass += ` ${styles.correct}`;
                } else if (isSelected && !isAnswer) {
                  buttonClass += ` ${styles.wrong}`;
                }
              }

              return (
                <button
                  key={capital}
                  className={buttonClass}
                  onClick={() => handleGuess(capital)}
                  disabled={selectedAnswer !== null}
                >
                  <span className={styles.optionName}>{capital}</span>
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className={styles.resultArea}>
              <div className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
                {isCorrect ? '🎉 Correct!' : `❌ Wrong! It's ${currentCountry.capital}`}
              </div>

              {mode !== 'daily' && (
                <button className={styles.nextBtn} onClick={nextRound}>
                  {mode === 'challenge' && round >= TOTAL_ROUNDS ? 'See Results' : 'Next Country →'}
                </button>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
