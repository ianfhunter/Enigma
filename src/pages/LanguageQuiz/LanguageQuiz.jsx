import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './LanguageQuiz.module.css';

function pickRandomCountry(countries, randomFn = Math.random) {
  if (!countries.length) return null;
  const idx = Math.floor(randomFn() * countries.length);
  return countries[idx];
}

function evaluateGuess(current, guessLanguages) {
  const correctLanguages = current.languages;
  const guessed = Array.from(guessLanguages);

  const correctSelected = guessed.filter(l => correctLanguages.includes(l));
  const wrongSelected = guessed.filter(l => !correctLanguages.includes(l));

  const correctCount = correctSelected.length;
  const totalCorrect = correctLanguages.length;
  const isFullyCorrect = correctCount === totalCorrect && wrongSelected.length === 0;
  const isPartiallyCorrect = correctCount > 0 && !isFullyCorrect;

  return {
    correct: isFullyCorrect,
    partial: isPartiallyCorrect,
    correctLanguages,
    correctCount,
    totalCorrect,
    wrongCount: wrongSelected.length,
  };
}

// Export helpers for testing
export {
  pickRandomCountry,
  evaluateGuess,
};

export default function LanguageQuiz() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [guessLanguages, setGuessLanguages] = useState(() => new Set());
  const [result, setResult] = useState(null);

  const [stats, setStats] = usePersistedState('language-quiz-stats', {
    played: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('../../../datasets/languages.json');
      if (!mounted) return;
      setData(mod.default);
    })().catch((e) => {
      console.error('Failed to load languages.json:', e);
      setData({ countries: [], allLanguages: [] });
    });
    return () => { mounted = false; };
  }, []);

  const countries = useMemo(() => data?.countries || [], [data]);
  const allLanguages = useMemo(() => data?.allLanguages || [], [data]);

  const pickRandom = useCallback(() => pickRandomCountry(countries), [countries]);

  const startRound = useCallback(() => {
    const next = pickRandom();
    if (!next) return;
    setCurrent(next);
    setGuessLanguages(new Set());
    setResult(null);
  }, [pickRandom]);

  useEffect(() => {
    if (countries.length) {
      startRound();
    }
  }, [countries, startRound]);

  const toggleLanguage = (lang) => {
    if (result) return;
    setGuessLanguages(prev => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  };

  const submit = () => {
    if (!current) return;
    const evaluated = evaluateGuess(current, guessLanguages);
    setResult(evaluated);

    setStats(prev => {
      const played = prev.played + 1;
      const correctStat = prev.correct + (evaluated.correct ? 1 : 0);
      const streak = evaluated.correct ? prev.streak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, streak);
      return { played, correct: correctStat, streak, maxStreak };
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Language Quiz"
        instructions="Select the official language(s) of each country. Some countries have multiple official languages!"
      />

      {!data && <div className={styles.card}>Loading countries...</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>{t('common.country')}</div>
            <div className={styles.prompt}>{current.name}</div>
            <div className={styles.subtle}>
              Select all official languages ({current.languages.length} total)
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>Official Language(s)</div>
            <div className={styles.languagesGrid}>
              {allLanguages.map(lang => {
                let btnClass = styles.langBtn;
                if (result) {
                  const isCorrectLang = current.languages.includes(lang);
                  const wasSelected = guessLanguages.has(lang);
                  if (isCorrectLang && wasSelected) {
                    btnClass += ` ${styles.correctSelected}`;
                  } else if (isCorrectLang && !wasSelected) {
                    btnClass += ` ${styles.missed}`;
                  } else if (!isCorrectLang && wasSelected) {
                    btnClass += ` ${styles.wrong}`;
                  }
                } else if (guessLanguages.has(lang)) {
                  btnClass += ` ${styles.selected}`;
                }
                return (
                  <button
                    key={lang}
                    className={btnClass}
                    onClick={() => toggleLanguage(lang)}
                    disabled={!!result}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            <div className={styles.actions}>
              {!result ? (
                <button className={styles.primaryBtn} onClick={submit}>
                  Check Answer
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={startRound}>
                  Next Country →
                </button>
              )}
            </div>

            {result && (
              <div className={`${styles.result} ${result.correct ? styles.ok : result.partial ? styles.partial : styles.nope}`}>
                <div className={styles.resultTitle}>
                  {result.correct ? '✓ Correct!' : result.partial ? '◐ Partially Correct' : '✗ Incorrect'}
                </div>
                <div className={styles.resultBody}>
                  <div className={styles.scoreBreakdown}>
                    {result.correctCount}/{result.totalCorrect} correct
                    {result.wrongCount > 0 && `, ${result.wrongCount} wrong`}
                  </div>
                  Official languages: <strong>{result.correctLanguages.join(', ')}</strong>
                </div>
              </div>
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
