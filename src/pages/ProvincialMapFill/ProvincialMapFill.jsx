import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { REGION_CONFIGS, buildLookup, getRegionCode } from '../../data/provincialMapData';
import styles from './ProvincialMapFill.module.css';

const REGION_OPTIONS = Object.values(REGION_CONFIGS);

export default function ProvincialMapFill() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [guessedRegions, setGuessedRegions] = useState(new Set());
  const [inputValue, setInputValue] = useState('');
  const [lastGuess, setLastGuess] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [showGuessedList, setShowGuessedList] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('provincial-map-fill-stats');
    return saved ? JSON.parse(saved) : {};
  });
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const regionConfig = selectedRegion ? REGION_CONFIGS[selectedRegion] : null;
  const totalRegions = regionConfig ? regionConfig.regions.length : 0;

  // Get stats for current region
  const currentStats = useMemo(() => {
    if (!selectedRegion) return { gamesPlayed: 0, bestScore: 0, bestTime: null };
    return stats[selectedRegion] || { gamesPlayed: 0, bestScore: 0, bestTime: null };
  }, [selectedRegion, stats]);

  // Build lookup map for region names
  const regionLookup = useMemo(() => {
    if (!regionConfig) return {};
    return buildLookup(regionConfig);
  }, [regionConfig]);

  // Load GeoJSON data when region is selected
  useEffect(() => {
    if (!regionConfig) return;

    setLoading(true);
    fetch(regionConfig.geoJsonUrl)
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load map data:', err);
        setLoading(false);
      });
  }, [regionConfig]);

  // Timer
  useEffect(() => {
    if (gameStarted && !isComplete) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameStarted, isComplete]);

  // Save stats
  useEffect(() => {
    localStorage.setItem('provincial-map-fill-stats', JSON.stringify(stats));
  }, [stats]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !regionConfig) return;

    const guess = inputValue.trim().toLowerCase();
    const regionCode = regionLookup[guess];

    if (regionCode && !guessedRegions.has(regionCode)) {
      const region = regionConfig.regions.find(r => r.code === regionCode);
      setGuessedRegions(prev => new Set([...prev, regionCode]));
      setLastGuess({ name: region.name, correct: true });

      // Check if complete
      if (guessedRegions.size + 1 === totalRegions) {
        setIsComplete(true);
        clearInterval(timerRef.current);
        setStats(prev => ({
          ...prev,
          [selectedRegion]: {
            gamesPlayed: (prev[selectedRegion]?.gamesPlayed || 0) + 1,
            bestScore: Math.max(prev[selectedRegion]?.bestScore || 0, totalRegions),
            bestTime: prev[selectedRegion]?.bestTime
              ? Math.min(prev[selectedRegion].bestTime, timeElapsed)
              : timeElapsed
          }
        }));
      }
    } else if (regionCode && guessedRegions.has(regionCode)) {
      const region = regionConfig.regions.find(r => r.code === regionCode);
      setLastGuess({ name: region.name, correct: false, duplicate: true });
    } else {
      setLastGuess({ name: inputValue, correct: false });
    }

    setInputValue('');
  };

  const selectRegion = (regionId) => {
    setSelectedRegion(regionId);
    setGeoData(null);
  };

  const startGame = () => {
    setGameStarted(true);
    setGuessedRegions(new Set());
    setTimeElapsed(0);
    setIsComplete(false);
    setShowGiveUp(false);
    setShowGuessedList(false);
    setLastGuess(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleGiveUp = () => {
    setIsComplete(true);
    clearInterval(timerRef.current);
    setStats(prev => ({
      ...prev,
      [selectedRegion]: {
        ...(prev[selectedRegion] || {}),
        gamesPlayed: (prev[selectedRegion]?.gamesPlayed || 0) + 1,
        bestScore: Math.max(prev[selectedRegion]?.bestScore || 0, guessedRegions.size)
      }
    }));
  };

  const goBackToRegionSelect = () => {
    setSelectedRegion(null);
    setGameStarted(false);
    setGeoData(null);
    setGuessedRegions(new Set());
    setTimeElapsed(0);
    setIsComplete(false);
    setShowGiveUp(false);
    setLastGuess(null);
  };

  // Get sorted list of guessed region names
  const guessedList = useMemo(() => {
    if (!regionConfig) return [];
    return regionConfig.regions
      .filter(r => guessedRegions.has(r.code))
      .map(r => r.name)
      .sort((a, b) => a.localeCompare(b));
  }, [guessedRegions, regionConfig]);

  // Get sorted list of missed region names
  const missedList = useMemo(() => {
    if (!regionConfig) return [];
    return regionConfig.regions
      .filter(r => !guessedRegions.has(r.code))
      .map(r => r.name)
      .sort((a, b) => a.localeCompare(b));
  }, [guessedRegions, regionConfig]);

  // Render path from coordinates
  const renderPath = useCallback((coords, key, isGuessed, isMissed) => {
    const pathData = coords.map((ring, ringIdx) => {
      return ring.map((point, pointIdx) => {
        const [lng, lat] = point;
        return `${pointIdx === 0 ? 'M' : 'L'} ${lng} ${-lat}`;
      }).join(' ');
    }).join(' Z ') + ' Z';

    return (
      <path
        key={key}
        d={pathData}
        className={`${styles.region} ${isGuessed ? styles.guessed : ''} ${isMissed ? styles.missed : ''}`}
      />
    );
  }, []);

  // Main region selection screen
  if (!selectedRegion) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Provincial Map Fill</h1>
          <p className={styles.instructions}>
            Choose a region to start filling in the map!
          </p>
        </div>

        <div className={styles.regionGrid}>
          {REGION_OPTIONS.map(region => (
            <button
              key={region.id}
              className={styles.regionCard}
              onClick={() => selectRegion(region.id)}
            >
              <span className={styles.regionIcon}>{region.icon}</span>
              <span className={styles.regionName}>{region.name}</span>
              <span className={styles.regionCount}>{region.regions.length} regions</span>
              {stats[region.id]?.bestScore > 0 && (
                <span className={styles.regionBest}>
                  Best: {stats[region.id].bestScore}/{region.regions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Menu screen (region selected but game not started)
  if (!gameStarted) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backLink} onClick={goBackToRegionSelect}>
            ← Choose Different Region
          </button>
          <h1 className={styles.title}>
            {regionConfig.icon} {regionConfig.name}
          </h1>
          <p className={styles.instructions}>
            {regionConfig.description}. Can you name all {totalRegions}?
          </p>
        </div>

        <div className={styles.menuArea}>
          <button className={styles.startBtn} onClick={startGame}>
            Start Game
          </button>

          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{currentStats.gamesPlayed}</span>
              <span className={styles.statLabel}>Games</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{currentStats.bestScore}</span>
              <span className={styles.statLabel}>Best Score</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{currentStats.bestTime ? formatTime(currentStats.bestTime) : '--'}</span>
              <span className={styles.statLabel}>Best Time</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading map data...</div>
      </div>
    );
  }

  // Game screen
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={() => setGameStarted(false)}>
          ← Back to Menu
        </button>
        <h1 className={styles.titleSmall}>
          {regionConfig.icon} {regionConfig.name}
        </h1>

        <div className={styles.gameInfo}>
          <span className={styles.score}>{guessedRegions.size} / {totalRegions}</span>
          <span className={styles.timer}>{formatTime(timeElapsed)}</span>
        </div>
      </div>

      <div className={styles.mapContainer}>
        <svg viewBox={regionConfig.viewBox} className={styles.map}>
          {geoData && geoData.features.map((feature, idx) => {
            const code = getRegionCode(feature, regionConfig);
            const isGuessed = guessedRegions.has(code);
            const isMissed = isComplete && !isGuessed;

            if (feature.geometry.type === 'Polygon') {
              return renderPath(feature.geometry.coordinates, idx, isGuessed, isMissed);
            } else if (feature.geometry.type === 'MultiPolygon') {
              return feature.geometry.coordinates.map((polygon, polyIdx) =>
                renderPath(polygon, `${idx}-${polyIdx}`, isGuessed, isMissed)
              );
            }
            return null;
          })}
        </svg>
      </div>

      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Type a ${regionConfig.name.replace(/ies$/, 'y').replace(/s$/, '').toLowerCase()} name...`}
            className={styles.input}
            disabled={isComplete}
            autoComplete="off"
            autoCapitalize="off"
          />
        </form>

        {lastGuess && (
          <div className={`${styles.feedback} ${lastGuess.correct ? styles.correct : styles.wrong}`}>
            {lastGuess.correct ? `✓ ${lastGuess.name}` :
             lastGuess.duplicate ? `Already guessed: ${lastGuess.name}` :
             `✗ "${lastGuess.name}" not recognized`}
          </div>
        )}

        {guessedRegions.size > 0 && (
          <div className={styles.guessedSection}>
            <button
              className={styles.toggleListBtn}
              onClick={() => setShowGuessedList(!showGuessedList)}
            >
              {showGuessedList ? '▼' : '▶'} View Guessed ({guessedRegions.size})
            </button>
            {showGuessedList && (
              <div className={styles.guessedList}>
                {guessedList.map(name => (
                  <span key={name} className={styles.guessedItem}>{name}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {!isComplete && (
          <button
            className={styles.giveUpBtn}
            onClick={() => setShowGiveUp(true)}
          >
            Give Up
          </button>
        )}

        {showGiveUp && !isComplete && (
          <div className={styles.confirmModal}>
            <p>Are you sure you want to give up?</p>
            <div className={styles.confirmBtns}>
              <button onClick={handleGiveUp} className={styles.confirmYes}>Yes, Give Up</button>
              <button onClick={() => setShowGiveUp(false)} className={styles.confirmNo}>Keep Playing</button>
            </div>
          </div>
        )}

        {isComplete && (
          <div className={styles.completeMessage}>
            <h2>{guessedRegions.size === totalRegions ? '🎉 Perfect!' : 'Game Over!'}</h2>
            <p>You named {guessedRegions.size} of {totalRegions} in {formatTime(timeElapsed)}</p>

            {guessedList.length > 0 && (
              <div className={styles.resultSection}>
                <h3 className={styles.resultTitle}>✓ Correct ({guessedList.length})</h3>
                <div className={styles.resultList}>
                  {guessedList.map(name => (
                    <span key={name} className={styles.guessedItem}>{name}</span>
                  ))}
                </div>
              </div>
            )}

            {missedList.length > 0 && (
              <div className={styles.resultSection}>
                <h3 className={styles.resultTitleMissed}>✗ Missed ({missedList.length})</h3>
                <div className={styles.resultList}>
                  {missedList.map(name => (
                    <span key={name} className={styles.missedItem}>{name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.completeActions}>
              <button className={styles.playAgainBtn} onClick={startGame}>Play Again</button>
              <button className={styles.changeRegionBtn} onClick={goBackToRegionSelect}>
                Try Different Region
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
