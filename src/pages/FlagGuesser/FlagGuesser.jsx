import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import ModeSelector from '../../components/ModeSelector';
import StatsPanel from '../../components/StatsPanel';
import { usePersistedState } from '../../hooks/usePersistedState';
import { getRandomCountry, getRandomOptions } from '@datasets/countries';
import styles from './FlagGuesser.module.css';

const TOTAL_ROUNDS = 10;

export default function FlagGuesser() {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null); // 'endless', 'challenge'
  const [currentCountry, setCurrentCountry] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = usePersistedState('flag-guesser-best-streak', 0);
  const [stats, setStats] = usePersistedState('flag-guesser-stats', { played: 0, won: 0, totalCorrect: 0 });

  const setupRound = useCallback(() => {
    const country = getRandomCountry();
    setCurrentCountry(country);
    setOptions(getRandomOptions(country, 3));
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

  const handleGuess = (country) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(country.code);
    const correct = country.code === currentCountry.code;
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
        <GameHeader
          title="Flag Guesser"
          instructions="Test your knowledge of world flags! Can you identify countries by their flags?"
        />

        <div className={styles.menuArea}>
          <ModeSelector
            modes={[
              { id: 'challenge', label: 'Challenge', icon: '🏆', description: `${TOTAL_ROUNDS} flags, score as high as you can!` },
              { id: 'endless', label: 'Endless', icon: '∞', description: 'Keep playing until you want to stop' },
            ]}
            selectedMode={null}
            onSelectMode={startGame}
          />

          <StatsPanel
            stats={[
              { label: 'Played', value: stats.played },
              { label: 'Correct', value: stats.totalCorrect },
              { label: 'Best Streak', value: bestStreak },
              { label: 'Win Rate', value: `${stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%` },
            ]}
          />
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
        <h1 className={styles.title}>Flag Guesser</h1>

        <div className={styles.gameInfo}>
          {mode === 'challenge' && (
            <>
              <span className={styles.modeBadge}>Challenge</span>
              <span className={styles.roundInfo}>{t('common.round')} {round}/{TOTAL_ROUNDS}</span>
            </>
          )}
          {mode === 'endless' && (
            <>
              <span className={styles.modeBadge}>Endless</span>
              <span className={styles.roundInfo}>{t('common.round')} {round}</span>
            </>
          )}
          {(mode === 'challenge' || mode === 'endless') && (
            <span className={styles.scoreInfo}>{t('gameStatus.score')}: {score}</span>
          )}
          {streak > 1 && <span className={styles.streakBadge}>🔥 {streak} streak</span>}
        </div>
      </div>

      {currentCountry && (
        <div className={styles.gameArea}>
          <div className={styles.flagDisplay}>
            <img
              src={`https://flagcdn.com/w320/${currentCountry.code.toLowerCase()}.png`}
              alt="Flag"
              className={styles.flag}
            />
          </div>

          <p className={styles.question}>Which country does this flag belong to?</p>

          <div className={styles.optionsGrid}>
            {options.map((option) => {
              const isSelected = selectedAnswer === option.code;
              const isAnswer = option.code === currentCountry.code;
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
                  key={option.code}
                  className={buttonClass}
                  onClick={() => handleGuess(option)}
                  disabled={selectedAnswer !== null}
                >
                  <span className={styles.optionName}>{option.name}</span>
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className={styles.resultArea}>
              <div className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
                {isCorrect ? '🎉 Correct!' : `❌ Wrong! It was ${currentCountry.name}`}
              </div>

              <button className={styles.nextBtn} onClick={nextRound}>
                {mode === 'challenge' && round >= TOTAL_ROUNDS ? 'See Results' : 'Next Flag →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
