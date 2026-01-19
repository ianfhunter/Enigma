import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import ModeSelector from '../../components/ModeSelector';
import StatsPanel from '../../components/StatsPanel';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './Constellations.module.css';

const TOTAL_ROUNDS = 12;

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const MIN_OPTION_COUNT = 4;

// Star data for drawing (simplified positions for common constellations)
const CONSTELLATION_STARS = {
  'And': { stars: [[0.2, 0.4], [0.35, 0.5], [0.5, 0.55], [0.65, 0.6], [0.45, 0.35], [0.55, 0.25], [0.4, 0.7]], lines: [[0,1], [1,2], [2,3], [1,4], [4,5], [2,6]] },
  'Aql': { stars: [[0.5, 0.2], [0.4, 0.4], [0.6, 0.4], [0.3, 0.6], [0.7, 0.6], [0.5, 0.8]], lines: [[0,1], [0,2], [1,3], [2,4], [1,5], [2,5]] },
  'Aqr': { stars: [[0.3, 0.2], [0.4, 0.3], [0.5, 0.35], [0.6, 0.4], [0.5, 0.5], [0.4, 0.6], [0.6, 0.7], [0.3, 0.8]], lines: [[0,1], [1,2], [2,3], [2,4], [4,5], [4,6], [5,7]] },
  'Ari': { stars: [[0.3, 0.5], [0.5, 0.45], [0.7, 0.5]], lines: [[0,1], [1,2]] },
  'Boo': { stars: [[0.5, 0.15], [0.4, 0.35], [0.6, 0.35], [0.35, 0.55], [0.65, 0.55], [0.5, 0.8]], lines: [[0,1], [0,2], [1,3], [2,4], [3,5], [4,5], [1,2]] },
  'Cnc': { stars: [[0.3, 0.4], [0.5, 0.35], [0.7, 0.4], [0.5, 0.6]], lines: [[0,1], [1,2], [1,3]] },
  'CMa': { stars: [[0.5, 0.2], [0.35, 0.35], [0.65, 0.35], [0.3, 0.55], [0.5, 0.5], [0.7, 0.55], [0.5, 0.75]], lines: [[0,1], [0,2], [1,3], [2,5], [1,4], [2,4], [4,6]] },
  'Cap': { stars: [[0.25, 0.4], [0.4, 0.3], [0.6, 0.3], [0.75, 0.4], [0.7, 0.6], [0.3, 0.6]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,0]] },
  'Cas': { stars: [[0.15, 0.5], [0.3, 0.35], [0.5, 0.5], [0.7, 0.35], [0.85, 0.5]], lines: [[0,1], [1,2], [2,3], [3,4]] },
  'Cen': { stars: [[0.3, 0.2], [0.5, 0.3], [0.7, 0.2], [0.4, 0.5], [0.6, 0.5], [0.35, 0.75], [0.65, 0.75]], lines: [[0,1], [1,2], [1,3], [1,4], [3,5], [4,6]] },
  'Cet': { stars: [[0.2, 0.3], [0.4, 0.4], [0.6, 0.35], [0.8, 0.3], [0.5, 0.55], [0.3, 0.7], [0.7, 0.7]], lines: [[0,1], [1,2], [2,3], [1,4], [4,5], [4,6]] },
  'Cyg': { stars: [[0.5, 0.15], [0.5, 0.4], [0.25, 0.5], [0.75, 0.5], [0.5, 0.85]], lines: [[0,1], [1,2], [1,3], [1,4]] },
  'Dra': { stars: [[0.7, 0.2], [0.6, 0.3], [0.5, 0.35], [0.4, 0.45], [0.45, 0.55], [0.55, 0.6], [0.5, 0.75], [0.35, 0.85]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7]] },
  'Gem': { stars: [[0.3, 0.2], [0.6, 0.2], [0.35, 0.4], [0.55, 0.4], [0.4, 0.6], [0.5, 0.6], [0.45, 0.8]], lines: [[0,2], [1,3], [2,4], [3,5], [4,5], [4,6], [5,6]] },
  'Her': { stars: [[0.4, 0.2], [0.6, 0.2], [0.5, 0.4], [0.3, 0.5], [0.7, 0.5], [0.35, 0.75], [0.65, 0.75]], lines: [[0,2], [1,2], [2,3], [2,4], [3,5], [4,6]] },
  'Leo': { stars: [[0.2, 0.4], [0.35, 0.25], [0.5, 0.3], [0.6, 0.35], [0.75, 0.4], [0.55, 0.55], [0.4, 0.7], [0.6, 0.75]], lines: [[0,1], [1,2], [2,3], [3,4], [3,5], [5,6], [5,7]] },
  'Lib': { stars: [[0.3, 0.35], [0.5, 0.5], [0.7, 0.35], [0.4, 0.7], [0.6, 0.7]], lines: [[0,1], [1,2], [1,3], [1,4]] },
  'Lyr': { stars: [[0.5, 0.2], [0.35, 0.45], [0.65, 0.45], [0.4, 0.7], [0.6, 0.7]], lines: [[0,1], [0,2], [1,3], [2,4], [3,4]] },
  'Ori': { stars: [[0.35, 0.15], [0.65, 0.15], [0.3, 0.4], [0.5, 0.45], [0.7, 0.4], [0.4, 0.65], [0.6, 0.65], [0.5, 0.85]], lines: [[0,2], [1,4], [2,3], [3,4], [2,5], [4,6], [5,6], [5,7], [6,7]] },
  'Peg': { stars: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75], [0.15, 0.5]], lines: [[0,1], [0,2], [1,3], [2,3], [2,4]] },
  'Per': { stars: [[0.5, 0.15], [0.45, 0.35], [0.4, 0.5], [0.35, 0.7], [0.55, 0.45], [0.65, 0.55], [0.5, 0.85]], lines: [[0,1], [1,2], [2,3], [1,4], [4,5], [3,6]] },
  'Psc': { stars: [[0.2, 0.4], [0.35, 0.5], [0.5, 0.55], [0.65, 0.5], [0.8, 0.4], [0.5, 0.75]], lines: [[0,1], [1,2], [2,3], [3,4], [2,5]] },
  'Sco': { stars: [[0.2, 0.3], [0.35, 0.35], [0.45, 0.45], [0.5, 0.55], [0.55, 0.65], [0.65, 0.7], [0.75, 0.65], [0.8, 0.55]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7]] },
  'Sgr': { stars: [[0.3, 0.35], [0.45, 0.25], [0.55, 0.35], [0.7, 0.3], [0.4, 0.55], [0.6, 0.55], [0.5, 0.75]], lines: [[0,1], [1,2], [2,3], [0,4], [2,5], [4,5], [4,6], [5,6]] },
  'Tau': { stars: [[0.3, 0.4], [0.45, 0.45], [0.6, 0.5], [0.75, 0.55], [0.55, 0.35], [0.65, 0.25]], lines: [[0,1], [1,2], [2,3], [2,4], [4,5]] },
  'UMa': { stars: [[0.15, 0.45], [0.3, 0.4], [0.45, 0.35], [0.6, 0.4], [0.7, 0.5], [0.75, 0.6], [0.85, 0.55]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [3,6]] },
  'UMi': { stars: [[0.5, 0.15], [0.55, 0.35], [0.5, 0.5], [0.4, 0.6], [0.45, 0.75], [0.55, 0.8], [0.6, 0.7]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,2]] },
  'Vir': { stars: [[0.25, 0.35], [0.4, 0.45], [0.55, 0.5], [0.7, 0.45], [0.85, 0.4], [0.5, 0.65], [0.45, 0.8]], lines: [[0,1], [1,2], [2,3], [3,4], [2,5], [5,6]] },
};

const FALLBACK_ABBREVIATIONS = Object.keys(CONSTELLATION_STARS);
const FALLBACK_SEMANTICS = [
  'hunter',
  'hero',
  'queen',
  'king',
  'dragon',
  'lion',
  'bear',
  'bird',
  'mythical figure',
  'instrument',
  'sea creature',
  'creature',
  'beast',
];

const buildOptionSet = ({ answer, pool, fallbackPool = [], desiredTotal = MIN_OPTION_COUNT }) => {
  const desiredWrong = Math.max(desiredTotal - 1, 0);
  const cleanedPool = [...new Set(pool.filter(Boolean))].filter(opt => opt !== answer);
  const cleanedFallback = [...new Set(fallbackPool.filter(Boolean))]
    .filter(opt => opt !== answer && !cleanedPool.includes(opt));

  const basePool = [...cleanedPool, ...cleanedFallback];
  while (basePool.length < desiredWrong) {
    basePool.push(`Option ${basePool.length + 1}`);
  }

  const selectedWrong = shuffle(basePool).slice(0, desiredWrong);
  return shuffle([answer, ...selectedWrong]);
};

// Get constellation options for multiple choice
const getConstellationOptions = (data, correct, count = 3) => {
  const allConstellations = data.map(c => c.names[0].english);
  return buildOptionSet({
    answer: correct,
    pool: allConstellations,
    fallbackPool: allConstellations,
    desiredTotal: count + 1,
  });
};

// Question types
const QUESTION_TYPES = [
  {
    id: 'identify',
    question: () => `Identify this constellation:`,
    showStars: true,
    getAnswer: (c) => c.names[0].english,
    getOptions: (data, c) => getConstellationOptions(data, c.names[0].english),
  },
  {
    id: 'abbreviation',
    question: (c) => `What is the IAU abbreviation for ${c.names[0].english}?`,
    showStars: false,
    getAnswer: (c) => c.IAU,
    getOptions: (data, c) => buildOptionSet({
      answer: c.IAU,
      pool: data.map(con => con.IAU),
      fallbackPool: FALLBACK_ABBREVIATIONS,
    }),
  },
  {
    id: 'semantic',
    question: (c) => `${c.names[0].english} represents which type of figure?`,
    showStars: false,
    getAnswer: (c) => c.semantics?.[0] || 'unknown',
    getOptions: (data, c) => buildOptionSet({
      answer: c.semantics?.[0] || 'unknown',
      pool: data.flatMap(con => con.semantics || []),
      fallbackPool: FALLBACK_SEMANTICS,
    }),
    valid: (c) => c.semantics && c.semantics.length > 0,
  },
];

// Export helpers for testing
export { CONSTELLATION_STARS, QUESTION_TYPES, getConstellationOptions, shuffle };

// Draw constellation on canvas
const ConstellationCanvas = ({ constellation, revealed }) => {
  const canvasRef = useRef(null);
  const abbrev = constellation?.IAU;
  const starData = CONSTELLATION_STARS[abbrev];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw background stars
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!starData) {
      // Fallback: draw random pattern
      const fallbackStars = [];
      for (let i = 0; i < 6; i++) {
        fallbackStars.push([0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6]);
      }

      // Draw constellation stars
      fallbackStars.forEach(([px, py]) => {
        const x = px * width;
        const y = py * height;

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Star center
        ctx.fillStyle = '#ffffd0';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    // Draw constellation lines (if revealed)
    if (revealed) {
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.6)';
      ctx.lineWidth = 1.5;
      starData.lines.forEach(([from, to]) => {
        const [x1, y1] = starData.stars[from];
        const [x2, y2] = starData.stars[to];
        ctx.beginPath();
        ctx.moveTo(x1 * width, y1 * height);
        ctx.lineTo(x2 * width, y2 * height);
        ctx.stroke();
      });
    }

    // Draw constellation stars
    starData.stars.forEach(([px, py], i) => {
      const x = px * width;
      const y = py * height;
      const size = i === 0 ? 5 : 3 + Math.random() * 2;

      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Star center
      ctx.fillStyle = '#ffffd0';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [starData, revealed]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className={styles.constellationCanvas}
    />
  );
};

export default function Constellations() {
  const [constellations, setConstellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [currentConstellation, setCurrentConstellation] = useState(null);
  const [questionType, setQuestionType] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [usedConstellations, setUsedConstellations] = useState([]);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = usePersistedState('constellations-stats', { played: 0, won: 0, totalCorrect: 0, bestStreak: 0 });
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/datasets/constellations.json');
        if (!resp.ok) throw new Error(`Failed to load constellations: ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        const list = Array.isArray(data?.constellations) ? data.constellations : [];
        setConstellations(list);
      } catch (e) {
        console.error(e);
        if (mounted) setConstellations([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setupRound = useCallback(() => {
    const available = constellations.filter(c => !usedConstellations.includes(c.id));
    if (available.length === 0) {
      setUsedConstellations([]);
      return;
    }

    const constellation = available[Math.floor(Math.random() * available.length)];

    // Pick valid question type
    const validTypes = QUESTION_TYPES.filter(qt => !qt.valid || qt.valid(constellation));
    const qType = validTypes[Math.floor(Math.random() * validTypes.length)];

    setCurrentConstellation(constellation);
    setQuestionType(qType);
    setOptions(qType.getOptions(constellations, constellation));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setUsedConstellations(prev => [...prev, constellation.id]);
  }, [constellations, usedConstellations]);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setScore(0);
    setRound(1);
    setStreak(0);
    setGameOver(false);
    setUsedConstellations([]);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCurrentConstellation(null);
  };

  useEffect(() => {
    if (mode && !gameOver && !currentConstellation && constellations.length > 0) {
      setupRound();
    }
  }, [mode, gameOver, currentConstellation, setupRound, constellations.length]);

  const handleGuess = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === questionType.getAnswer(currentConstellation);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > stats.bestStreak) {
          setStats(s => ({ ...s, bestStreak: newStreak }));
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

    setRound(prev => prev + 1);
    setCurrentConstellation(null);
  };

  const backToMenu = () => {
    setMode(null);
    setCurrentConstellation(null);
    setGameOver(false);
    setUsedConstellations([]);
  };

  const totalConstellations = constellations.length;

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Constellations"
          instructions="Loading constellations…"
        />
      </div>
    );
  }

  if (!totalConstellations) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Constellations"
          instructions="No constellations available."
        />
      </div>
    );
  }

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Constellations"
          instructions="Learn the 88 IAU constellations! Identify star patterns and test your astronomy knowledge."
        />

        <div className={styles.menuArea}>
          <ModeSelector
            modes={[
              { id: 'challenge', label: 'Challenge', icon: '🏆', description: `${TOTAL_ROUNDS} constellations to identify` },
              { id: 'endless', label: 'Endless', icon: '∞', description: 'Keep stargazing!' },
            ]}
            onSelectMode={startGame}
          />

          <StatsPanel
            stats={[
              { label: 'Played', value: stats.played },
              { label: 'Correct', value: stats.totalCorrect },
              { label: 'Best Streak', value: stats.bestStreak },
              { label: 'Win Rate', value: `${stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%` },
            ]}
          />

          <div className={styles.dataInfo}>
            <span>⭐ {totalConstellations} official IAU constellations</span>
          </div>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    const percentage = Math.round((score / TOTAL_ROUNDS) * 100);
    const isPerfect = score === TOTAL_ROUNDS;

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Stargazing Complete!</h1>
        </div>

        <div className={styles.gameOverArea}>
          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {TOTAL_ROUNDS}</span>
          </div>

          <div className={styles.resultMessage}>
            {isPerfect && <span className={styles.perfect}>⭐ Master Astronomer! ⭐</span>}
            {percentage >= 80 && !isPerfect && <span>🌟 Excellent stargazer!</span>}
            {percentage >= 60 && percentage < 80 && <span>👍 Good celestial knowledge!</span>}
            {percentage >= 40 && percentage < 60 && <span>Keep looking up!</span>}
            {percentage < 40 && <span>Time to study the night sky!</span>}
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
  if (!currentConstellation || !questionType) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading constellation...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={backToMenu}>← Back to Menu</button>
        <h1 className={styles.title}>Constellations</h1>

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
          <span className={styles.scoreInfo}>Score: {score}</span>
          {streak > 1 && <span className={styles.streakBadge}>🔥 {streak} streak</span>}
        </div>
      </div>

      <div className={styles.gameArea}>
        {questionType.showStars && (
          <div className={styles.canvasContainer}>
            <ConstellationCanvas
              constellation={currentConstellation}
              revealed={selectedAnswer !== null}
            />
          </div>
        )}

        <p className={styles.question}>
          {typeof questionType.question === 'function'
            ? questionType.question(currentConstellation)
            : questionType.question}
        </p>

        <div className={styles.optionsGrid}>
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isAnswer = option === questionType.getAnswer(currentConstellation);
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
                key={index}
                className={buttonClass}
                onClick={() => handleGuess(option)}
                disabled={selectedAnswer !== null}
              >
                <span className={styles.optionText}>{option}</span>
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className={styles.resultArea}>
            <div className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
              {isCorrect ? '⭐ Correct!' : `❌ Wrong!`}
            </div>

            <div className={styles.constellationInfo}>
              <strong>{currentConstellation.names[0].english}</strong>
              <span className={styles.abbrev}>({currentConstellation.IAU})</span>
              {currentConstellation.semantics && (
                <span className={styles.semantic}>
                  — Represents: {currentConstellation.semantics.join(', ')}
                </span>
              )}
            </div>

            <button className={styles.nextBtn} onClick={nextRound}>
              {mode === 'challenge' && round >= TOTAL_ROUNDS ? 'See Results' : 'Next Constellation →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
