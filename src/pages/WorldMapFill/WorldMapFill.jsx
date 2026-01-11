import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { countries } from '../../data/countries';
import styles from './WorldMapFill.module.css';

// World map SVG paths - using simplified world map data
const WORLD_MAP_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

// Micronations that are too small to see on the map - show as markers
const MICRONATIONS = [
  { code: 'VA', name: 'Vatican City', lat: 41.9, lng: 12.45 },
  { code: 'MC', name: 'Monaco', lat: 43.73, lng: 7.42 },
  { code: 'SM', name: 'San Marino', lat: 43.94, lng: 12.46 },
  { code: 'LI', name: 'Liechtenstein', lat: 47.16, lng: 9.55 },
  { code: 'AD', name: 'Andorra', lat: 42.55, lng: 1.6 },
  { code: 'MT', name: 'Malta', lat: 35.9, lng: 14.5 },
  { code: 'LU', name: 'Luxembourg', lat: 49.82, lng: 6.13 },
  { code: 'SG', name: 'Singapore', lat: 1.35, lng: 103.82 },
  { code: 'BH', name: 'Bahrain', lat: 26.07, lng: 50.55 },
  { code: 'MV', name: 'Maldives', lat: 3.2, lng: 73.22 },
  { code: 'SC', name: 'Seychelles', lat: -4.68, lng: 55.49 },
  { code: 'KM', name: 'Comoros', lat: -11.88, lng: 43.87 },
  { code: 'MU', name: 'Mauritius', lat: -20.35, lng: 57.55 },
  { code: 'CV', name: 'Cabo Verde', lat: 16.0, lng: -24.0 },
  { code: 'ST', name: 'São Tomé and Príncipe', lat: 0.19, lng: 6.61 },
  { code: 'BB', name: 'Barbados', lat: 13.19, lng: -59.54 },
  { code: 'AG', name: 'Antigua and Barbuda', lat: 17.06, lng: -61.8 },
  { code: 'DM', name: 'Dominica', lat: 15.41, lng: -61.34 },
  { code: 'GD', name: 'Grenada', lat: 12.26, lng: -61.6 },
  { code: 'KN', name: 'Saint Kitts and Nevis', lat: 17.36, lng: -62.78 },
  { code: 'LC', name: 'Saint Lucia', lat: 13.91, lng: -60.98 },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', lat: 13.25, lng: -61.2 },
  { code: 'TT', name: 'Trinidad and Tobago', lat: 10.69, lng: -61.22 },
  { code: 'BN', name: 'Brunei', lat: 4.54, lng: 114.73 },
  { code: 'TL', name: 'Timor-Leste', lat: -8.87, lng: 125.73 },
  { code: 'WS', name: 'Samoa', lat: -13.76, lng: -172.1 },
  { code: 'TO', name: 'Tonga', lat: -21.18, lng: -175.2 },
  { code: 'FJ', name: 'Fiji', lat: -17.71, lng: 178.07 },
  { code: 'PW', name: 'Palau', lat: 7.51, lng: 134.58 },
  { code: 'FM', name: 'Micronesia', lat: 7.43, lng: 150.55 },
  { code: 'MH', name: 'Marshall Islands', lat: 7.13, lng: 171.18 },
  { code: 'KI', name: 'Kiribati', lat: 1.87, lng: -157.36 },
  { code: 'NR', name: 'Nauru', lat: -0.52, lng: 166.93 },
  { code: 'TV', name: 'Tuvalu', lat: -7.11, lng: 177.65 },
];

// Continent configurations with country codes and map viewBox settings
const REGIONS = {
  world: {
    name: 'World',
    icon: '🌍',
    viewBox: '-180 -90 360 180',
    countries: null, // null means all countries
  },
  africa: {
    name: 'Africa',
    icon: '🌍',
    viewBox: '-20 -40 80 85',
    countries: ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'],
  },
  europe: {
    name: 'Europe',
    icon: '🇪🇺',
    viewBox: '-12 -72 55 40',
    countries: ['AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA'],
  },
  asia: {
    name: 'Asia',
    icon: '🌏',
    viewBox: '25 -75 150 85',
    countries: ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'],
  },
  northAmerica: {
    name: 'North America',
    icon: '🌎',
    viewBox: '-175 -85 130 70',
    countries: ['CA', 'US'],
  },
  centralAmerica: {
    name: 'Central America & Caribbean',
    icon: '🌴',
    viewBox: '-120 -30 70 40',
    countries: ['BZ', 'CR', 'CU', 'DM', 'DO', 'SV', 'GD', 'GT', 'HT', 'HN', 'JM', 'MX', 'NI', 'PA', 'AG', 'BS', 'BB', 'KN', 'LC', 'VC', 'TT'],
  },
  southAmerica: {
    name: 'South America',
    icon: '🌎',
    viewBox: '-85 -15 55 75',
    countries: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
  },
  oceania: {
    name: 'Oceania',
    icon: '🌏',
    viewBox: '110 10 80 55',
    countries: ['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'],
  },
};

export default function WorldMapFill() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [guessedCountries, setGuessedCountries] = useState(new Set());
  const [inputValue, setInputValue] = useState('');
  const [lastGuess, setLastGuess] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [showGuessedList, setShowGuessedList] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('world-map-fill-stats');
    return saved ? JSON.parse(saved) : {};
  });
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Get current region config
  const regionConfig = selectedRegion ? REGIONS[selectedRegion] : null;

  // Filter countries based on selected region
  const regionCountries = useMemo(() => {
    if (!regionConfig || !regionConfig.countries) {
      return countries;
    }
    return countries.filter(c => regionConfig.countries.includes(c.code));
  }, [regionConfig]);

  const totalCountries = regionCountries.length;

  // Get stats for current region
  const regionStats = stats[selectedRegion] || { gamesPlayed: 0, bestScore: 0, bestTime: null };

  // Build lookup map for country names (including common alternatives)
  const countryLookup = useCallback(() => {
    const lookup = {};
    regionCountries.forEach(country => {
      // Add main name
      lookup[country.name.toLowerCase()] = country.code;
    });

    // Add common alternative names
    const alternatives = {
      'usa': 'US',
      'united states': 'US',
      'america': 'US',
      'uk': 'GB',
      'united kingdom': 'GB',
      'great britain': 'GB',
      'britain': 'GB',
      'england': 'GB',
      'russia': 'RU',
      'russian federation': 'RU',
      'south korea': 'KR',
      'korea': 'KR',
      'north korea': 'KP',
      'dprk': 'KP',
      'taiwan': 'TW',
      'uae': 'AE',
      'united arab emirates': 'AE',
      'czech republic': 'CZ',
      'czechia': 'CZ',
      'holland': 'NL',
      'ivory coast': 'CI',
      'cote d\'ivoire': 'CI',
      'dr congo': 'CD',
      'democratic republic of congo': 'CD',
      'drc': 'CD',
      'congo': 'CG',
      'republic of congo': 'CG',
      'burma': 'MM',
      'myanmar': 'MM',
      'eswatini': 'SZ',
      'swaziland': 'SZ',
      'cabo verde': 'CV',
      'cape verde': 'CV',
      'timor leste': 'TL',
      'east timor': 'TL',
      'vatican': 'VA',
      'vatican city': 'VA',
      'the gambia': 'GM',
      'gambia': 'GM',
      'the bahamas': 'BS',
      'bahamas': 'BS',
      'bosnia': 'BA',
      'bosnia and herzegovina': 'BA',
      'north macedonia': 'MK',
      'macedonia': 'MK',
      'the netherlands': 'NL',
      'netherlands': 'NL',
      'the philippines': 'PH',
      'philippines': 'PH',
    };

    Object.entries(alternatives).forEach(([alt, code]) => {
      // Only add if the country is in the current region
      if (regionCountries.some(c => c.code === code) && !lookup[alt]) {
        lookup[alt] = code;
      }
    });

    return lookup;
  }, [regionCountries]);

  // Load GeoJSON data
  useEffect(() => {
    fetch(WORLD_MAP_URL)
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load map data:', err);
        setLoading(false);
      });
  }, []);

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
    localStorage.setItem('world-map-fill-stats', JSON.stringify(stats));
  }, [stats]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const lookup = countryLookup();
    const guess = inputValue.trim().toLowerCase();
    const countryCode = lookup[guess];

    if (countryCode && !guessedCountries.has(countryCode)) {
      const country = regionCountries.find(c => c.code === countryCode);
      setGuessedCountries(prev => new Set([...prev, countryCode]));
      setLastGuess({ name: country.name, correct: true });

      // Check if complete
      if (guessedCountries.size + 1 === totalCountries) {
        setIsComplete(true);
        clearInterval(timerRef.current);
        setStats(prev => ({
          ...prev,
          [selectedRegion]: {
            gamesPlayed: (prev[selectedRegion]?.gamesPlayed || 0) + 1,
            bestScore: Math.max(prev[selectedRegion]?.bestScore || 0, totalCountries),
            bestTime: prev[selectedRegion]?.bestTime
              ? Math.min(prev[selectedRegion].bestTime, timeElapsed)
              : timeElapsed
          }
        }));
      }
    } else if (countryCode && guessedCountries.has(countryCode)) {
      const country = regionCountries.find(c => c.code === countryCode);
      setLastGuess({ name: country.name, correct: false, duplicate: true });
    } else {
      setLastGuess({ name: inputValue, correct: false });
    }

    setInputValue('');
  };

  const startGame = (region) => {
    setSelectedRegion(region);
    setGameStarted(true);
    setGuessedCountries(new Set());
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
        ...prev[selectedRegion],
        gamesPlayed: (prev[selectedRegion]?.gamesPlayed || 0) + 1,
        bestScore: Math.max(prev[selectedRegion]?.bestScore || 0, guessedCountries.size)
      }
    }));
  };

  const backToMenu = () => {
    setGameStarted(false);
    setSelectedRegion(null);
    clearInterval(timerRef.current);
  };

  const getCountryCode = (feature) => {
    // Natural Earth uses ISO_A2 or ISO_A2_EH for country codes
    // But some countries like France and Norway have -99 as ISO_A2 due to overseas territories
    const props = feature.properties;

    // First try ISO_A2 if it's valid (not -99)
    if (props.ISO_A2 && props.ISO_A2 !== '-99') {
      return props.ISO_A2;
    }

    // Try ISO_A2_EH (de facto codes)
    if (props.ISO_A2_EH && props.ISO_A2_EH !== '-99') {
      return props.ISO_A2_EH;
    }

    // Fall back to mapping from 3-letter code (ADM0_A3) to 2-letter code
    const iso3to2 = {
      'FRA': 'FR', 'NOR': 'NO', 'USA': 'US', 'GBR': 'GB', 'NLD': 'NL',
      'DNK': 'DK', 'FIN': 'FI', 'PRT': 'PT', 'ESP': 'ES', 'ITA': 'IT',
      'CHN': 'CN', 'IND': 'IN', 'AUS': 'AU', 'NZL': 'NZ', 'CYP': 'CY',
      'SRB': 'RS', 'KOS': 'XK', 'SSD': 'SS', 'SOL': 'SB',
    };

    if (props.ADM0_A3 && iso3to2[props.ADM0_A3]) {
      return iso3to2[props.ADM0_A3];
    }

    // Last resort: try ADM0_A3 and just take first 2 chars (not always accurate)
    return '';
  };

  // Check if country is in the current region
  const isInRegion = (code) => {
    if (!regionConfig || !regionConfig.countries) return true;
    return regionConfig.countries.includes(code);
  };

  // Get sorted list of guessed country names
  const guessedList = useMemo(() => {
    return regionCountries
      .filter(c => guessedCountries.has(c.code))
      .map(c => c.name)
      .sort((a, b) => a.localeCompare(b));
  }, [guessedCountries, regionCountries]);

  // Get sorted list of missed country names
  const missedList = useMemo(() => {
    return regionCountries
      .filter(c => !guessedCountries.has(c.code))
      .map(c => c.name)
      .sort((a, b) => a.localeCompare(b));
  }, [guessedCountries, regionCountries]);

  // Menu screen - region selection
  if (!gameStarted) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>World Map Fill</h1>
          <p className={styles.instructions}>
            Choose a region and name all the countries to fill in the map!
          </p>
        </div>

        <div className={styles.regionGrid}>
          {Object.entries(REGIONS).map(([key, region]) => {
            const regionStat = stats[key] || { gamesPlayed: 0, bestScore: 0 };
            const countryCount = region.countries ? region.countries.length : countries.length;
            return (
              <button
                key={key}
                className={styles.regionCard}
                onClick={() => startGame(key)}
              >
                <span className={styles.regionIcon}>{region.icon}</span>
                <span className={styles.regionName}>{region.name}</span>
                <span className={styles.regionCount}>{countryCount} countries</span>
                {regionStat.gamesPlayed > 0 && (
                  <span className={styles.regionBest}>
                    Best: {regionStat.bestScore}/{countryCount}
                  </span>
                )}
              </button>
            );
          })}
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
        <button className={styles.backLink} onClick={backToMenu}>← Back to Menu</button>
        <h1 className={styles.titleSmall}>{regionConfig?.name || 'World'} Map Fill</h1>

        <div className={styles.gameInfo}>
          <span className={styles.score}>{guessedCountries.size} / {totalCountries}</span>
          <span className={styles.timer}>{formatTime(timeElapsed)}</span>
        </div>
      </div>

      <div className={styles.mapContainer}>
        <svg viewBox={regionConfig?.viewBox || '-180 -90 360 180'} className={styles.map}>
          {geoData && geoData.features.map((feature, idx) => {
            const code = getCountryCode(feature);
            const inRegion = isInRegion(code);
            const isGuessed = guessedCountries.has(code);
            const isMissed = isComplete && inRegion && !isGuessed;

            // Handle different geometry types
            const renderPath = (coords, key) => {
              const pathData = coords.map((ring) => {
                return ring.map((point, pointIdx) => {
                  const [lng, lat] = point;
                  // Flip Y axis for SVG coordinate system
                  return `${pointIdx === 0 ? 'M' : 'L'} ${lng} ${-lat}`;
                }).join(' ');
              }).join(' Z ') + ' Z';

              return (
                <path
                  key={key}
                  d={pathData}
                  className={`${styles.country} ${!inRegion ? styles.outOfRegion : ''} ${isGuessed ? styles.guessed : ''} ${isMissed ? styles.missed : ''}`}
                  data-code={code}
                />
              );
            };

            if (feature.geometry.type === 'Polygon') {
              return renderPath(feature.geometry.coordinates, idx);
            } else if (feature.geometry.type === 'MultiPolygon') {
              return feature.geometry.coordinates.map((polygon, polyIdx) =>
                renderPath(polygon, `${idx}-${polyIdx}`)
              );
            }
            return null;
          })}

          {/* Micronation markers - small countries that are hard to see */}
          {MICRONATIONS.filter(m => isInRegion(m.code)).map(micro => {
            const isGuessed = guessedCountries.has(micro.code);
            const isMissed = isComplete && !isGuessed;
            return (
              <circle
                key={micro.code}
                cx={micro.lng}
                cy={-micro.lat}
                r={selectedRegion === 'world' ? 1.5 : 0.4}
                className={`${styles.microMarker} ${isGuessed ? styles.guessed : ''} ${isMissed ? styles.missed : ''}`}
                data-code={micro.code}
              />
            );
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
            placeholder="Type a country name..."
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

        {guessedCountries.size > 0 && (
          <div className={styles.guessedSection}>
            <button
              className={styles.toggleListBtn}
              onClick={() => setShowGuessedList(!showGuessedList)}
            >
              {showGuessedList ? '▼' : '▶'} View Guessed ({guessedCountries.size})
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
            <h2>{guessedCountries.size === totalCountries ? '🎉 Perfect!' : 'Game Over!'}</h2>
            <p>You named {guessedCountries.size} of {totalCountries} countries in {formatTime(timeElapsed)}</p>

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
              <button className={styles.playAgainBtn} onClick={() => startGame(selectedRegion)}>Play Again</button>
              <button className={styles.menuBtn} onClick={backToMenu}>Change Region</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
