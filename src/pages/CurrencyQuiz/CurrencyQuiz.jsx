import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './CurrencyQuiz.module.css';

export default function CurrencyQuiz() {
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
      const mod = await import('../../data/currencies.json');
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
    // Get unique currencies different from the correct one
    const otherCurrencies = [...new Set(
      countries
        .filter(c => c.currency !== correctCurrency)
        .map(c => c.currency)
    )];
    const shuffled = otherCurrencies.sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [correctCurrency, ...shuffled].sort(() => Math.random() - 0.5);
    return allOptions;
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
            <div className={styles.promptLabel}>Country</div>
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
              <span className={styles.statLabel}>Streak</span>
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
