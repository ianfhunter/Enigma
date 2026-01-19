import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './FamousPaintings.module.css';

// Import all local painting images using Vite's glob import
const localImages = import.meta.glob('/src/assets/paintings/*.{jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });

// Get the URL for a painting (local if available, otherwise remote)
const getImageUrl = (painting) => {
  if (painting.local_image) {
    const localPath = `/src/assets/paintings/${painting.local_image}`;
    if (localImages[localPath]) {
      return localImages[localPath];
    }
  }
  // Fallback to original URL (or image_url if original_url not set)
  return painting.original_url || painting.image_url;
};

const TOTAL_ROUNDS = 10;

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Generate wrong options for a field
const getRandomOptions = (data, correct, field, count = 3) => {
  const allValues = [...new Set(data.map(p => p[field]).filter(Boolean))];
  const wrongOptions = allValues.filter(v => v !== correct);
  const selected = shuffle(wrongOptions).slice(0, count);
  const options = shuffle([correct, ...selected]);
  return options;
};

// Get a random painting
const getRandomPainting = (data, exclude = []) => {
  const available = data.filter(p => !exclude.includes(p.title));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

// Question types
const QUESTION_TYPES = [
  {
    id: 'artist',
    question: (p) => `Who painted "${p.title}"?`,
    answer: (p) => p.artist,
    options: (data, p) => getRandomOptions(data, p.artist, 'artist'),
    showImage: true
  },
  {
    id: 'title',
    question: (_p) => `What is the name of this painting?`,
    answer: (p) => p.title,
    options: (data, p) => getRandomOptions(data, p.title, 'title'),
    showImage: true
  },
  {
    id: 'year',
    question: (p) => `When was "${p.title}" by ${p.artist} created?`,
    answer: (p) => p.year,
    options: (data, p) => {
      const years = data.map(p => p.year).filter(Boolean);
      const shuffled = shuffle(years.filter(y => y !== p.year)).slice(0, 3);
      return shuffle([p.year, ...shuffled]);
    },
    showImage: true
  },
  {
    id: 'style',
    question: (p) => `What art style/movement is "${p.title}" associated with?`,
    answer: (p) => p.style,
    options: (data, p) => getRandomOptions(data, p.style, 'style'),
    showImage: true
  },
  {
    id: 'location',
    question: (p) => `Where is "${p.title}" currently housed?`,
    answer: (p) => p.location,
    options: (data, p) => getRandomOptions(data, p.location, 'location'),
    showImage: false
  }
];

// Export helpers for testing
export {
  shuffle,
  getRandomOptions,
  getRandomPainting,
  QUESTION_TYPES,
};

export default function FamousPaintings() {
  const [paintings, setPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [currentPainting, setCurrentPainting] = useState(null);
  const [questionType, setQuestionType] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [usedPaintings, setUsedPaintings] = useState([]);
  const [streak, setStreak] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [stats, setStats] = usePersistedState('famous-paintings-stats', { played: 0, won: 0, totalCorrect: 0, bestStreak: 0 });

  // Load dataset
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/datasets/famousPaintings.json');
        if (!resp.ok) throw new Error(`Failed to load famous paintings: ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        setPaintings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (mounted) setPaintings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setupRound = useCallback(() => {
    const painting = getRandomPainting(paintings, usedPaintings);
    if (!painting) {
      setGameOver(true);
      return;
    }
    // Pick a random question type
    const qType = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];

    setCurrentPainting(painting);
    setQuestionType(qType);
    setOptions(qType.options(paintings, painting));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setUsedPaintings(prev => [...prev, painting.title]);
    setImageLoaded(false);
    setImageError(false);
  }, [usedPaintings, paintings]);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setScore(0);
    setRound(1);
    setStreak(0);
    setGameOver(false);
    setUsedPaintings([]);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    if (mode && !gameOver && !currentPainting && paintings.length > 0) {
      setupRound();
    }
  }, [mode, gameOver, currentPainting, setupRound, paintings.length]);

  const handleGuess = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === questionType.answer(currentPainting);
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
    setCurrentPainting(null);
  };

  const backToMenu = () => {
    setMode(null);
    setCurrentPainting(null);
    setGameOver(false);
    setUsedPaintings([]);
  };

  const uniqueArtists = [...new Set(paintings.map(p => p.artist))].length;
  const totalPaintings = paintings.length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Famous Paintings</h1>
          <p className={styles.instructions}>Loading paintings…</p>
        </div>
      </div>
    );
  }

  if (!totalPaintings) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Famous Paintings</h1>
          <p className={styles.instructions}>No paintings available.</p>
        </div>
      </div>
    );
  }

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Famous Paintings</h1>
          <p className={styles.instructions}>
            Test your art history knowledge! Identify masterpieces, artists, and art movements.
          </p>
        </div>

        <div className={styles.menuArea}>
          <div className={styles.modeCards}>
            <button className={styles.modeCard} onClick={() => startGame('challenge')}>
              <span className={styles.modeIcon}>🏆</span>
              <span className={styles.modeTitle}>Challenge</span>
              <span className={styles.modeDesc}>{TOTAL_ROUNDS} questions, test your knowledge!</span>
            </button>

            <button className={styles.modeCard} onClick={() => startGame('endless')}>
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
              <span className={styles.statValue}>{stats.bestStreak}</span>
              <span className={styles.statLabel}>Best Streak</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Win Rate</span>
            </div>
          </div>

          <div className={styles.dataInfo}>
            <span>🖼️ {totalPaintings} masterpieces from {uniqueArtists} artists</span>
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
          <h1 className={styles.title}>Gallery Tour Complete!</h1>
        </div>

        <div className={styles.gameOverArea}>
          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {TOTAL_ROUNDS}</span>
          </div>

          <div className={styles.resultMessage}>
            {isPerfect && <span className={styles.perfect}>🎨 Art Master! 🎨</span>}
            {percentage >= 80 && !isPerfect && <span>🌟 Art Connoisseur!</span>}
            {percentage >= 60 && percentage < 80 && <span>👍 Good eye for art!</span>}
            {percentage >= 40 && percentage < 60 && <span>Keep visiting museums!</span>}
            {percentage < 40 && <span>Time to study some art history!</span>}
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
        <h1 className={styles.title}>Famous Paintings</h1>

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

      {currentPainting && questionType && (
        <div className={styles.gameArea}>
          {questionType.showImage && (
            <div className={styles.paintingDisplay}>
              {!imageLoaded && !imageError && (
                <div className={styles.imagePlaceholder}>
                  <span>Loading painting...</span>
                </div>
              )}
              {imageError && (
                <div className={styles.imagePlaceholder}>
                  <span>🖼️</span>
                  <span className={styles.paintingTitle}>{currentPainting.title}</span>
                </div>
              )}
              <img
                src={getImageUrl(currentPainting)}
                alt="Famous painting"
                className={`${styles.painting} ${imageLoaded ? styles.loaded : styles.hidden}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <p className={styles.question}>{questionType.question(currentPainting)}</p>

          <div className={styles.optionsGrid}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isAnswer = option === questionType.answer(currentPainting);
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

          {selectedAnswer === null && currentPainting.attribution && (
            <div className={styles.attributionHint}>
              Attribution visible after answer
            </div>
          )}

          {selectedAnswer !== null && (
            <div className={styles.resultArea}>
              <div className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
                {isCorrect ? '🎨 Correct!' : `❌ Wrong!`}
              </div>

              {!isCorrect && (
                <div className={styles.correctAnswerInfo}>
                  The answer is: <strong>{questionType.answer(currentPainting)}</strong>
                </div>
              )}

              <div className={styles.paintingInfo}>
                <strong>"{currentPainting.title}"</strong> by {currentPainting.artist}
                <br />
                <span className={styles.paintingMeta}>
                  {currentPainting.year} • {currentPainting.style} • {currentPainting.location}
                </span>
              </div>

              {currentPainting.attribution && (
                <div className={styles.attribution}>
                  <span className={styles.attributionLabel}>Image:</span>
                  <span className={styles.attributionText}>
                    {currentPainting.attribution.source}
                    {currentPainting.attribution.license && ` • ${currentPainting.attribution.license}`}
                    {currentPainting.attribution.author && ` • ${currentPainting.attribution.author}`}
                  </span>
                </div>
              )}

              <button className={styles.nextBtn} onClick={nextRound}>
                {mode === 'challenge' && round >= TOTAL_ROUNDS ? 'See Results' : 'Next Painting →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
