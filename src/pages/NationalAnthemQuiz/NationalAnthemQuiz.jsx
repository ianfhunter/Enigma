import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import ModeSelector from '../../components/ModeSelector';
import StatsPanel from '../../components/StatsPanel';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './NationalAnthemQuiz.module.css';

const TOTAL_ROUNDS = 10;

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Generate wrong options for countries
const getRandomCountryOptions = (data, correct, count = 3) => {
  const allCountries = data.map(a => a.countryName);
  const wrongOptions = allCountries.filter(c => c !== correct);
  const selected = shuffle(wrongOptions).slice(0, count);
  return shuffle([correct, ...selected]);
};

// Get a random anthem
const getRandomAnthem = (data, exclude = []) => {
  const available = data.filter(a => !exclude.includes(a.isoCode));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

// Get continent/region for a country (simple mapping for hints)
const getRegion = (countryCode) => {
  const regions = {
    // Africa
    DZA: 'Africa', AGO: 'Africa', BEN: 'Africa', BWA: 'Africa', BFA: 'Africa',
    BDI: 'Africa', CPV: 'Africa', CMR: 'Africa', CAF: 'Africa', TCD: 'Africa',
    COM: 'Africa', COG: 'Africa', COD: 'Africa', CIV: 'Africa', DJI: 'Africa',
    EGY: 'Africa', GNQ: 'Africa', ERI: 'Africa', SWZ: 'Africa', ETH: 'Africa',
    GAB: 'Africa', GMB: 'Africa', GHA: 'Africa', GIN: 'Africa', GNB: 'Africa',
    KEN: 'Africa', LSO: 'Africa', LBR: 'Africa', LBY: 'Africa', MDG: 'Africa',
    MWI: 'Africa', MLI: 'Africa', MRT: 'Africa', MUS: 'Africa', MAR: 'Africa',
    MOZ: 'Africa', NAM: 'Africa', NER: 'Africa', NGA: 'Africa', RWA: 'Africa',
    STP: 'Africa', SEN: 'Africa', SYC: 'Africa', SLE: 'Africa', SOM: 'Africa',
    ZAF: 'Africa', SSD: 'Africa', SDN: 'Africa', TZA: 'Africa', TGO: 'Africa',
    TUN: 'Africa', UGA: 'Africa', ZMB: 'Africa', ZWE: 'Africa',
    // Asia
    AFG: 'Asia', ARM: 'Asia', AZE: 'Asia', BHR: 'Asia', BGD: 'Asia',
    BTN: 'Asia', BRN: 'Asia', KHM: 'Asia', CHN: 'Asia', GEO: 'Asia',
    IND: 'Asia', IDN: 'Asia', IRN: 'Asia', IRQ: 'Asia', ISR: 'Asia',
    JPN: 'Asia', JOR: 'Asia', KAZ: 'Asia', KWT: 'Asia', KGZ: 'Asia',
    LAO: 'Asia', LBN: 'Asia', MYS: 'Asia', MDV: 'Asia', MNG: 'Asia',
    MMR: 'Asia', NPL: 'Asia', PRK: 'Asia', OMN: 'Asia', PAK: 'Asia',
    PHL: 'Asia', QAT: 'Asia', SAU: 'Asia', SGP: 'Asia', KOR: 'Asia',
    LKA: 'Asia', SYR: 'Asia', TJK: 'Asia', THA: 'Asia', TLS: 'Asia',
    TUR: 'Asia', TKM: 'Asia', ARE: 'Asia', UZB: 'Asia', VNM: 'Asia',
    YEM: 'Asia',
    // Europe
    ALB: 'Europe', AND: 'Europe', AUT: 'Europe', BLR: 'Europe', BEL: 'Europe',
    BIH: 'Europe', BGR: 'Europe', HRV: 'Europe', CYP: 'Europe', CZE: 'Europe',
    DNK: 'Europe', EST: 'Europe', FIN: 'Europe', FRA: 'Europe', DEU: 'Europe',
    GRC: 'Europe', HUN: 'Europe', ISL: 'Europe', IRL: 'Europe', ITA: 'Europe',
    LVA: 'Europe', LIE: 'Europe', LTU: 'Europe', LUX: 'Europe', MLT: 'Europe',
    MDA: 'Europe', MCO: 'Europe', MNE: 'Europe', NLD: 'Europe', MKD: 'Europe',
    NOR: 'Europe', POL: 'Europe', PRT: 'Europe', ROU: 'Europe', RUS: 'Europe',
    SMR: 'Europe', SRB: 'Europe', SVK: 'Europe', SVN: 'Europe', ESP: 'Europe',
    SWE: 'Europe', CHE: 'Europe', UKR: 'Europe', GBR: 'Europe', VAT: 'Europe',
    // North America
    ATG: 'North America', BHS: 'North America', BRB: 'North America', BLZ: 'North America',
    CAN: 'North America', CRI: 'North America', CUB: 'North America', DMA: 'North America',
    DOM: 'North America', SLV: 'North America', GRD: 'North America', GTM: 'North America',
    HTI: 'North America', HND: 'North America', JAM: 'North America', MEX: 'North America',
    NIC: 'North America', PAN: 'North America', KNA: 'North America', LCA: 'North America',
    VCT: 'North America', TTO: 'North America', USA: 'North America',
    // South America
    ARG: 'South America', BOL: 'South America', BRA: 'South America', CHL: 'South America',
    COL: 'South America', ECU: 'South America', GUY: 'South America', PRY: 'South America',
    PER: 'South America', SUR: 'South America', URY: 'South America', VEN: 'South America',
    // Oceania
    AUS: 'Oceania', FJI: 'Oceania', KIR: 'Oceania', MHL: 'Oceania', FSM: 'Oceania',
    NRU: 'Oceania', NZL: 'Oceania', PLW: 'Oceania', PNG: 'Oceania', WSM: 'Oceania',
    SLB: 'Oceania', TON: 'Oceania', TUV: 'Oceania', VUT: 'Oceania',
  };
  return regions[countryCode] || 'Unknown';
};

export default function NationalAnthemQuiz() {
  const { t } = useTranslation();
  const [anthems, setAnthems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [currentAnthem, setCurrentAnthem] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [usedAnthems, setUsedAnthems] = useState([]);
  const [streak, setStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const audioRef = useRef(null);

  const [stats, setStats] = usePersistedState('national-anthem-quiz-stats', { played: 0, won: 0, totalCorrect: 0, bestStreak: 0 });

  // Load dataset
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/datasets/nationalAnthems.json');
        if (!resp.ok) throw new Error(`Failed to load national anthems: ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        setAnthems(Array.isArray(data.anthems) ? data.anthems : []);
      } catch (e) {
        console.error(e);
        if (mounted) setAnthems([]);
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

    const anthem = getRandomAnthem(anthems, usedAnthems);
    if (!anthem) {
      setGameOver(true);
      return;
    }

    setCurrentAnthem(anthem);
    setOptions(getRandomCountryOptions(anthems, anthem.countryName));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setUsedAnthems(prev => [...prev, anthem.isoCode]);
    setAudioLoaded(false);
    setAudioError(false);
    setIsPlaying(false);
    setShowHint(false);

    // Create new audio element
    const audioUrl = `/datasets/anthems/${anthem.filename}`;
    const audio = new Audio(audioUrl);
    audio.addEventListener('canplaythrough', () => setAudioLoaded(true));
    audio.addEventListener('error', () => setAudioError(true));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current = audio;
  }, [usedAnthems, anthems]);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setScore(0);
    setRound(1);
    setStreak(0);
    setGameOver(false);
    setUsedAnthems([]);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCurrentAnthem(null);
  };

  useEffect(() => {
    if (mode && !gameOver && !currentAnthem && anthems.length > 0) {
      setupRound();
    }
  }, [mode, gameOver, currentAnthem, setupRound, anthems.length]);

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
    const correct = answer === currentAnthem.countryName;
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
    setCurrentAnthem(null);
  };

  const backToMenu = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setMode(null);
    setCurrentAnthem(null);
    setGameOver(false);
    setUsedAnthems([]);
  };

  // Get unique countries count
  const uniqueCountries = anthems.length;

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="🎺 National Anthem Quiz"
          instructions="Loading anthems…"
        />
      </div>
    );
  }

  if (!anthems.length) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="🎺 National Anthem Quiz"
          instructions="No anthems available."
        />
      </div>
    );
  }

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="🎺 National Anthem Quiz"
          instructions="Listen to national anthems and guess which country they belong to!"
        />

        <div className={styles.menuArea}>
          <ModeSelector
            modes={[
              { id: 'challenge', label: 'Challenge', icon: '🏆', description: `${TOTAL_ROUNDS} anthems, test your global knowledge!` },
              { id: 'endless', label: 'Endless', icon: '∞', description: 'Keep playing until you want to stop' },
            ]}
            onChange={startGame}
            variant="cards"
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
            <span>🌍 {uniqueCountries} national anthems from around the world</span>
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
          <h1 className={styles.title}>🎺 Quiz Complete!</h1>
        </div>

        <div className={styles.gameOverArea}>
          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {TOTAL_ROUNDS}</span>
          </div>

          <div className={styles.resultMessage}>
            {isPerfect && <span className={styles.perfect}>🌟 World Champion! 🌟</span>}
            {percentage >= 80 && !isPerfect && <span>🏅 Diplomatic Expert!</span>}
            {percentage >= 60 && percentage < 80 && <span>🌍 Globe Trotter!</span>}
            {percentage >= 40 && percentage < 60 && <span>Keep exploring the world!</span>}
            {percentage < 40 && <span>Time for a world tour!</span>}
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
        <h1 className={styles.title}>🎺 National Anthem Quiz</h1>

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

      {currentAnthem && (
        <div className={styles.gameArea}>
          <div className={styles.audioPlayer}>
            <div className={styles.musicVisual}>
              {isPlaying ? (
                <div className={styles.soundWaves}>
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              ) : (
                <span className={styles.musicNote}>🎺</span>
              )}
            </div>

            {audioError ? (
              <div className={styles.audioError}>
                <span>⚠️ Audio unavailable</span>
                <span className={styles.errorHint}>Try the next anthem</span>
              </div>
            ) : !audioLoaded ? (
              <div className={styles.audioLoading}>
                <span>Loading anthem...</span>
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

          <p className={styles.question}>Which country does this anthem belong to?</p>

          {selectedAnswer === null && !showHint && (
            <button className={styles.hintBtn} onClick={() => setShowHint(true)}>
              💡 Show Region Hint
            </button>
          )}

          {showHint && selectedAnswer === null && (
            <div className={styles.hint}>
              <span className={styles.hintLabel}>Region:</span> {getRegion(currentAnthem.isoCode)}
            </div>
          )}

          <div className={styles.optionsGrid}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isAnswer = option === currentAnthem.countryName;
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
                {isCorrect ? '🎉 Correct!' : '❌ Wrong!'}
              </div>

              {!isCorrect && (
                <div className={styles.correctAnswerInfo}>
                  The anthem belongs to: <strong>{currentAnthem.countryName}</strong>
                </div>
              )}

              <div className={styles.anthemInfo}>
                <span className={styles.countryFlag}>
                  <img
                    src={`https://flagcdn.com/48x36/${currentAnthem.countryCode}.png`}
                    alt={currentAnthem.countryName}
                    className={styles.flagImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </span>
                <strong>{currentAnthem.countryName}</strong>
                <br />
                <span className={styles.anthemMeta}>
                  {getRegion(currentAnthem.isoCode)} • ISO: {currentAnthem.isoCode}
                </span>
              </div>

              <button className={styles.nextBtn} onClick={nextRound}>
                {mode === 'challenge' && round >= TOTAL_ROUNDS ? 'See Results' : 'Next Anthem →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
