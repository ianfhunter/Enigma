import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './CurrencyQuiz.module.css';

export default function CurrencyQuiz() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [seed, setSeed] = useState(() => stringToSeed(`currency-quiz-${getTodayDateString()}`));
  const [roundNumber, setRoundNumber] = useState(0);
  const roundNumberRef = useRef(0);

  const { stats, recordWin, recordLoss, winRate } = useGameStats('currency-quiz', {
    trackBestTime: false,
    trackBestScore: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('../../../datasets/currencies.json');
      if (!mounted) return;
      setData(mod.default);
    })().catch((e) => {
      console.error('Failed to load currencies.json:', e);
      setData({ countries: [], allCurrencies: [] });
    });
    return () => { mounted = false; };
  }, []);

  const countries = useMemo(() => data?.countries || [], [data]);

  const pickRandom = useCallback(() => {
    if (!countries.length) return null;
    const random = createSeededRandom(seed + roundNumberRef.current);
    const idx = Math.floor(random() * countries.length);
    return countries[idx];
  }, [countries, seed]);

  const generateOptions = useCallback((correct) => {
    if (!countries.length) return [];
    const random = createSeededRandom(seed + roundNumberRef.current + 1000); // Different offset for options
    const correctCurrency = correct.currency;

    // Currency types to detect (check longer/multi-word ones first)
    const currencyTypes = [
      'Convertible Mark', 'CFA Franc', 'New Shekel',
      'Dollar', 'Peso', 'Dinar', 'Franc', 'Pound', 'Rupee', 'Rupiah',
      'Yen', 'Yuan', 'Won', 'Krone', 'Krona', 'Króna', 'Ruble', 'Real',
      'Rial', 'Riyal', 'Lira', 'Shilling', 'Rand', 'Koruna', 'Forint',
      'Zloty', 'Baht', 'Ringgit', 'Dirham', 'Kwacha', 'Leu', 'Som',
      'Manat', 'Taka', 'Dram', 'Lek', 'Afghani', 'Kwanza', 'Ngultrum',
      'Boliviano', 'Pula', 'Lev', 'Riel', 'Escudo', 'Colón', 'Nakfa',
      'Birr', 'Dalasi', 'Lari', 'Cedi', 'Quetzal', 'Gourde', 'Lempira',
      'Tenge', 'Kip', 'Loti', 'Denar', 'Ariary', 'Rufiyaa', 'Ouguiya',
      'Tugrik', 'Metical', 'Kyat', 'Naira', 'Córdoba', 'Balboa', 'Kina',
      'Guarani', 'Sol', 'Tala', 'Dobra', 'Leone', "Pa'anga", 'Somoni',
      'Hryvnia', 'Vatu', 'Bolívar', 'Dong'
    ];

    // Common types for generating believable fake currencies
    const commonTypes = ['Dollar', 'Peso', 'Franc', 'Pound', 'Dinar', 'Rupee', 'Yen', 'Shilling', 'Krone'];

    // Try to extract adjective and type from currency name
    let adjective = null;
    let correctType = null;

    for (const type of currencyTypes) {
      if (correctCurrency.endsWith(type)) {
        correctType = type;
        adjective = correctCurrency.slice(0, correctCurrency.length - type.length).trim();
        break;
      }
    }

    let distractors = [];

    if (adjective && adjective.length > 0) {
      // Generate fake currencies using seeded shuffle
      const fakeTypes = commonTypes
        .filter(t => t !== correctType);

      // Seeded shuffle
      const shuffled = [...fakeTypes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      distractors = shuffled.slice(0, 3).map(type => `${adjective} ${type}`);
    } else {
      // Fallback - use real currencies with seeded shuffle
      const otherCurrencies = [...new Set(
        countries
          .filter(c => c.currency !== correctCurrency)
          .map(c => c.currency)
      )];

      // Seeded shuffle
      for (let i = otherCurrencies.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [otherCurrencies[i], otherCurrencies[j]] = [otherCurrencies[j], otherCurrencies[i]];
      }

      distractors = otherCurrencies.slice(0, 3);

      // If we don't have enough unique currencies, fill with some common ones
      const commonFallbacks = ['Euro', 'US Dollar', 'British Pound', 'Japanese Yen', 'Chinese Yuan'];
      while (distractors.length < 3) {
        const fallback = commonFallbacks[Math.floor(random() * commonFallbacks.length)];
        if (fallback !== correctCurrency && !distractors.includes(fallback)) {
          distractors.push(fallback);
        }
      }
    }

    // Final shuffle of all options
    const allOptions = [correctCurrency, ...distractors];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    return allOptions;
  }, [countries, seed]);

  const startRound = useCallback(() => {
    const next = pickRandom();
    if (!next) return;
    setCurrent(next);
    setOptions(generateOptions(next));
    setSelected(null);
    setResult(null);
    setRoundNumber(prev => {
      roundNumberRef.current = prev + 1;
      return prev + 1;
    });
  }, [pickRandom, generateOptions, seed]);

  useEffect(() => {
    if (countries.length) {
      startRound();
    }
  }, [countries, startRound]);

  const handleSelect = (opt) => {
    if (result) return;
    setSelected(opt);
    const correctCurrency = current.currency;
    const isCorrect = opt === correctCurrency;
    setResult({ correct: isCorrect, correctCurrency, currencyCode: current.currencyCode });

    if (isCorrect) {
      recordWin();
    } else {
      recordLoss();
    }
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Currency Quiz"
        instructions="What currency is used in each country?"
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
              : newSeed;
            setSeed(seedNum);
            setRoundNumber(0);
          }}
        />
      )}

      {!data && <div className={styles.card}>{t('common.loadingCountries')}</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>{t('common.country')}</div>
            <div className={styles.prompt}>{current.name}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>What is the official currency?</div>

            <div className={styles.optionsGrid}>
              {options.map(opt => {
                let btnClass = styles.optionBtn;
                if (result) {
                  if (opt === result.correctCurrency) {
                    btnClass += ` ${styles.correct}`;
                  } else if (opt === selected) {
                    btnClass += ` ${styles.wrong}`;
                  }
                } else if (opt === selected) {
                  btnClass += ` ${styles.selected}`;
                }
                return (
                  <button
                    key={opt}
                    className={btnClass}
                    onClick={() => handleSelect(opt)}
                    disabled={!!result}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {result && (
              <>
                <div className={`${styles.result} ${result.correct ? styles.ok : styles.nope}`}>
                  <div className={styles.resultTitle}>
                    {result.correct ? '✓ Correct!' : '✗ Incorrect'}
                  </div>
                  <div className={styles.resultBody}>
                    {current.name} uses the <strong>{result.correctCurrency}</strong> ({result.currencyCode})
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.primaryBtn} onClick={startRound}>
                    Next Country →
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.played}</span>
              <span className={styles.statLabel}>Played</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{winRate}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.currentStreak}</span>
              <span className={styles.statLabel}>{t('common.streak')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.maxStreak}</span>
              <span className={styles.statLabel}>Best</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
