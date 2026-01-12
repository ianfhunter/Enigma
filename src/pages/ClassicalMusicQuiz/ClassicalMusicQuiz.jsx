import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './ClassicalMusicQuiz.module.css';

// Import the classical music dataset
import composersData from '@datasets/trivia_datasets/classical_composers.json';

const TOTAL_ROUNDS = 10;

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Generate wrong options for composers
const getRandomComposerOptions = (correct, count = 3) => {
  const allComposers = [...new Set(composersData.map(p => p.composer))];
  const wrongOptions = allComposers.filter(c => c !== correct);
  const selected = shuffle(wrongOptions).slice(0, count);
  return shuffle([correct, ...selected]);
};

// Get a random piece
const getRandomPiece = (exclude = []) => {
  const available = composersData.filter(p => !exclude.includes(p.id));
  return available[Math.floor(Math.random() * available.length)];
};

export default function ClassicalMusicQuiz() {
  const [mode, setMode] = useState(null);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [usedPieces, setUsedPieces] = useState([]);
  const [streak, setStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const audioRef = useRef(null);

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('classical-music-quiz-stats');
    return saved ? JSON.parse(saved) : { played: 0, won: 0, totalCorrect: 0, bestStreak: 0 };
  });

  useEffect(() => {
    localStorage.setItem('classical-music-quiz-stats', JSON.stringify(stats));
  }, [stats]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const setupRound = useCallback(() => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const piece = getRandomPiece(usedPieces);
    if (!piece) {
      setGameOver(true);
      return;
    }

    setCurrentPiece(piece);
    setOptions(getRandomComposerOptions(piece.composer));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setUsedPieces(prev => [...prev, piece.id]);
    setAudioLoaded(false);
    setAudioError(false);
    setIsPlaying(false);
    setShowHint(false);

    // Create new audio element
    const audio = new Audio(piece.audio_url);
    audio.addEventListener('canplaythrough', () => setAudioLoaded(true));
    audio.addEventListener('error', () => setAudioError(true));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current = audio;
  }, [usedPieces]);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setScore(0);
    setRound(1);
    setStreak(0);
    setGameOver(false);
    setUsedPieces([]);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCurrentPiece(null);
  };

  useEffect(() => {
    if (mode && !gameOver && !currentPiece) {
      setupRound();
    }
  }, [mode, gameOver, currentPiece, setupRound]);

  const togglePlayPause = () => {
    if (!audioRef.current || audioError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setAudioError(true));
      setIsPlaying(true);
    }
  };

  const restartAudio = () => {
    if (!audioRef.current || audioError) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => setAudioError(true));
    setIsPlaying(true);
  };

  const handleGuess = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentPiece.composer;
    setIsCorrect(correct);

    // Stop audio when answering
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

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
    setCurrentPiece(null);
  };

  const backToMenu = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setMode(null);
    setCurrentPiece(null);
    setGameOver(false);
    setUsedPieces([]);
  };

  // Get unique composers count
  const uniqueComposers = [...new Set(composersData.map(p => p.composer))].length;

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>🎼 Classical Music Quiz</h1>
          <p className={styles.instructions}>
            Listen to classical masterpieces and guess the composer!
          </p>
        </div>

        <div className={styles.menuArea}>
          <div className={styles.modeCards}>
            <button className={styles.modeCard} onClick={() => startGame('challenge')}>
              <span className={styles.modeIcon}>🏆</span>
              <span className={styles.modeTitle}>Challenge</span>
              <span className={styles.modeDesc}>{TOTAL_ROUNDS} pieces, test your musical knowledge!</span>
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
            <span>🎵 {composersData.length} pieces from {uniqueComposers} legendary composers</span>
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
          <h1 className={styles.title}>🎼 Concert Over!</h1>
        </div>

        <div className={styles.gameOverArea}>
          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {TOTAL_ROUNDS}</span>
          </div>

          <div className={styles.resultMessage}>
            {isPerfect && <span className={styles.perfect}>🎹 Maestro! 🎹</span>}
            {percentage >= 80 && !isPerfect && <span>🌟 Concert Pianist!</span>}
            {percentage >= 60 && percentage < 80 && <span>👏 Music Enthusiast!</span>}
            {percentage >= 40 && percentage < 60 && <span>Keep listening to the classics!</span>}
            {percentage < 40 && <span>Time to visit the concert hall!</span>}
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
        <h1 className={styles.title}>🎼 Classical Music Quiz</h1>

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

      {currentPiece && (
        <div className={styles.gameArea}>
          <div className={styles.audioPlayer}>
            <div className={styles.musicVisual}>
              {isPlaying ? (
                <div className={styles.soundWaves}>
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              ) : (
                <span className={styles.musicNote}>🎵</span>
              )}
            </div>

            {audioError ? (
              <div className={styles.audioError}>
                <span>⚠️ Audio unavailable</span>
                <span className={styles.errorHint}>Try the next piece</span>
              </div>
            ) : !audioLoaded ? (
              <div className={styles.audioLoading}>
                <span>Loading audio...</span>
              </div>
            ) : (
              <div className={styles.audioControls}>
                <button
                  className={styles.playBtn}
                  onClick={togglePlayPause}
                  disabled={!audioLoaded}
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button
                  className={styles.restartBtn}
                  onClick={restartAudio}
                  disabled={!audioLoaded}
                >
                  🔄 Restart
                </button>
              </div>
            )}
          </div>

          <p className={styles.question}>Who composed this piece?</p>

          {selectedAnswer === null && !showHint && (
            <button className={styles.hintBtn} onClick={() => setShowHint(true)}>
              💡 Show Era Hint
            </button>
          )}

          {showHint && selectedAnswer === null && (
            <div className={styles.hint}>
              <span className={styles.hintLabel}>Era:</span> {currentPiece.era}
            </div>
          )}

          <div className={styles.optionsGrid}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isAnswer = option === currentPiece.composer;
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
                {isCorrect ? '🎵 Correct!' : '❌ Wrong!'}
              </div>

              {!isCorrect && (
                <div className={styles.correctAnswerInfo}>
                  The composer is: <strong>{currentPiece.composer}</strong>
                </div>
              )}

              <div className={styles.pieceInfo}>
                <strong>"{currentPiece.title}"</strong>
                <br />
                by {currentPiece.composer}
                <br />
                <span className={styles.pieceMeta}>
                  {currentPiece.year} • {currentPiece.era} • {currentPiece.nationality}
                </span>
              </div>

              {currentPiece.fun_fact && (
                <div className={styles.funFact}>
                  <span className={styles.funFactLabel}>🎹 Fun Fact:</span>
                  <span className={styles.funFactText}>{currentPiece.fun_fact}</span>
                </div>
              )}

              <button className={styles.nextBtn} onClick={nextRound}>
                {mode === 'challenge' && round >= TOTAL_ROUNDS ? 'See Results' : 'Next Piece →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
