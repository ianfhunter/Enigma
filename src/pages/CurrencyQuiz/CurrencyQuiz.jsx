import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './CurrencyQuiz.module.css';

export default function CurrencyQuiz() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const [stats, setStats] = usePersistedState('currency-quiz-stats', {
    played: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
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
    const idx = Math.floor(Math.random() * countries.length);
    return countries[idx];
  }, [countries]);

  const generateOptions = useCallback((correct) => {
    if (!countries.length) return [];
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
      // Generate fake currencies: same adjective + different type
      // e.g., "Mexican Peso" → "Mexican Dollar", "Mexican Franc", "Mexican Yen"
      const fakeTypes = commonTypes
        .filter(t => t !== correctType)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      distractors = fakeTypes.map(type => `${adjective} ${type}`);
    } else {
      // Fallback for "Euro" or currencies we couldn't parse - use real currencies
      const otherCurrencies = [...new Set(
        countries
          .filter(c => c.currency !== correctCurrency)
          .map(c => c.currency)
      )];
      distractors = otherCurrencies.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    return [correctCurrency, ...distractors].sort(() => Math.random() - 0.5);
  }, [countries]);

  const startRound = useCallback(() => {
    const next = pickRandom();
    if (!next) return;
    setCurrent(next);
    setOptions(generateOptions(next));
    setSelected(null);
    setResult(null);
  }, [pickRandom, generateOptions]);

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

    setStats(prev => {
      const played = prev.played + 1;
      const correctCount = prev.correct + (isCorrect ? 1 : 0);
      const streak = isCorrect ? prev.streak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, streak);
      return { played, correct: correctCount, streak, maxStreak };
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Currency Quiz"
        instructions="What currency is used in each country?"
      />

      {!data && <div className={styles.card}>Loading countries...</div>}

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
              <span className={styles.statValue}>
                {stats.played > 0 ? Math.round((stats.correct / stats.played) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.streak}</span>
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
