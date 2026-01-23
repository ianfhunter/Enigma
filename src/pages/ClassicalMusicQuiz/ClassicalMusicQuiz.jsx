import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import ModeSelector from '../../components/ModeSelector';
import StatsPanel from '../../components/StatsPanel';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './ClassicalMusicQuiz.module.css';

const TOTAL_ROUNDS = 10;

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Generate wrong options for composers
const getRandomComposerOptions = (data, correct, count = 3) => {
  const allComposers = [...new Set(data.map(p => p.composer))];
  const wrongOptions = allComposers.filter(c => c !== correct);
  const selected = shuffle(wrongOptions).slice(0, count);
  return shuffle([correct, ...selected]);
};

// Get a random piece
const getRandomPiece = (data, exclude = []) => {
  const available = data.filter(p => !exclude.includes(p.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

export default function ClassicalMusicQuiz() {
  const { t } = useTranslation();
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const { stats, updateStats, recordWin, recordLoss, winRate } = useGameStats('classical-music-quiz', {
    trackBestTime: false,
    trackBestScore: true,
    scoreComparison: 'higher',
    defaultStats: { totalCorrect: 0 },
  });

  // Load dataset
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/datasets/classicalComposers.json');
        if (!resp.ok) throw new Error(`Failed to load classical composers: ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        setPieces(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (mounted) setPieces([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

    const piece = getRandomPiece(pieces, usedPieces);
    if (!piece) {
      setGameOver(true);
      return;
    }

    setCurrentPiece(piece);
    setOptions(getRandomComposerOptions(pieces, piece.composer));
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
  }, [usedPieces, pieces]);

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
    if (mode && !gameOver && !currentPiece && pieces.length > 0) {
      setupRound();
    }
  }, [mode, gameOver, currentPiece, setupRound, pieces.length]);

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
        if (newStreak > (stats.maxStreak || 0)) {
          updateStats({ maxStreak: newStreak });
        }
        return newStreak;
      });
      updateStats(prev => ({ ...prev, totalCorrect: (prev.totalCorrect || 0) + 1 }));
    } else {
      setStreak(0);
    }
  };

  const nextRound = () => {
    if (mode === 'challenge' && round >= TOTAL_ROUNDS) {
      setGameOver(true);
      if (score >= Math.floor(TOTAL_ROUNDS / 2)) {
        recordWin();
      } else {
        recordLoss();
      }
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
  const uniqueComposers = [...new Set(pieces.map(p => p.composer))].length;

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="🎼 Classical Music Quiz"
          instructions="Loading pieces…"
        />
      </div>
    );
  }

  if (!pieces.length) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="🎼 Classical Music Quiz"
          instructions="No pieces available."
        />
      </div>
    );
  }

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="🎼 Classical Music Quiz"
          instructions="Listen to classical masterpieces and guess the composer!"
        />

        <div className={styles.menuArea}>
          <ModeSelector
            modes={[
              { id: 'challenge', label: 'Challenge', icon: '🏆', description: `${TOTAL_ROUNDS} pieces, test your musical knowledge!` },
              { id: 'endless', label: 'Endless', icon: '∞', description: 'Keep playing until you want to stop' },
            ]}
            onChange={startGame}
          />

          <StatsPanel
            stats={[
              { label: 'Played', value: stats.played },
              { label: 'Correct', value: stats.totalCorrect || 0 },
              { label: 'Best Streak', value: stats.maxStreak || 0 },
              { label: 'Win Rate', value: `${winRate}%` },
            ]}
          />

          <div className={styles.dataInfo}>
            <span>🎵 {pieces.length} pieces from {uniqueComposers} legendary composers</span>
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
              <span className={styles.roundInfo}>{t('common.round')} {round}/{TOTAL_ROUNDS}</span>
            </>
          )}
          {mode === 'endless' && (
            <>
              <span className={styles.modeBadge}>Endless</span>
              <span className={styles.roundInfo}>{t('common.round')} {round}</span>
            </>
          )}
          <span className={styles.scoreInfo}>{t('gameStatus.score')}: {score}</span>
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
                <span className={styles.errorHint}>{t('common.tryNextPiece')}</span>
              </div>
            ) : !audioLoaded ? (
              <div className={styles.audioLoading}>
                <span>{t('common.loadingAudio')}</span>
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
