import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './PeriodicTableQuiz.module.css';

const MODES = [
  { id: 'symbol-to-name', label: 'Symbol → Name', prompt: 'symbol', answer: 'name' },
  { id: 'name-to-symbol', label: 'Name → Symbol', prompt: 'name', answer: 'symbol' },
];

export default function PeriodicTableQuiz() {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState(MODES[0]);
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const [stats, setStats] = usePersistedState('periodic-table-quiz-stats', {
    played: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('../../data/periodic_table.json');
      if (!mounted) return;
      setData(mod.default);
    })().catch((e) => {
      console.error('Failed to load periodic_table.json:', e);
      setData({ elements: [], categories: [] });
    });
    return () => { mounted = false; };
  }, []);

  const elements = useMemo(() => data?.elements || [], [data]);

  const pickRandom = useCallback(() => {
    if (!elements.length) return null;
    const idx = Math.floor(Math.random() * elements.length);
    return elements[idx];
  }, [elements]);

  const generateOptions = useCallback((correct, field) => {
    if (!elements.length) return [];
    const correctVal = correct[field];
    const others = elements
      .filter(e => e[field] !== correctVal)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(e => e[field]);
    const allOptions = [correctVal, ...others].sort(() => Math.random() - 0.5);
    return allOptions;
  }, [elements]);

  const startRound = useCallback(() => {
    const next = pickRandom();
    if (!next) return;
    setCurrent(next);
    setOptions(generateOptions(next, mode.answer));
    setSelected(null);
    setResult(null);
  }, [pickRandom, generateOptions, mode]);

  useEffect(() => {
    if (elements.length) {
      startRound();
    }
  }, [elements, mode, startRound]);

  const handleSelect = (opt) => {
    if (result) return;
    setSelected(opt);
    const correctAnswer = current[mode.answer];
    const isCorrect = opt === correctAnswer;
    setResult({ correct: isCorrect, correctAnswer });

    setStats(prev => {
      const played = prev.played + 1;
      const correctCount = prev.correct + (isCorrect ? 1 : 0);
      const streak = isCorrect ? prev.streak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, streak);
      return { played, correct: correctCount, streak, maxStreak };
    });
  };

  const promptValue = current ? (mode.prompt === 'symbol' ? current.symbol : current.name) : '';
  const promptLabel = mode.prompt === 'symbol' ? 'Element Symbol' : 'Element Name';

  return (
    <div className={styles.container}>
      <GameHeader
        title="Periodic Table Quiz"
        instructions="Test your knowledge of element symbols and names!"
      />

      <div className={styles.controls}>
        <label className={styles.label}>
          Mode
          <select
            className={styles.select}
            value={mode.id}
            onChange={(e) => {
              const m = MODES.find(x => x.id === e.target.value);
              setMode(m);
            }}
          >
            {MODES.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!data && <div className={styles.card}>Loading elements...</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>{promptLabel}</div>
            <div className={styles.prompt}>{promptValue}</div>
            <div className={styles.subtle}>
              Atomic Number: {current.number} • {current.category}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              {mode.answer === 'name' ? 'What is the element name?' : 'What is the element symbol?'}
            </div>

            <div className={styles.optionsGrid}>
              {options.map(opt => {
                let btnClass = styles.optionBtn;
                if (result) {
                  if (opt === result.correctAnswer) {
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
                    {current.name} ({current.symbol}) - Atomic #{current.number}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.primaryBtn} onClick={startRound}>
                    Next Element →
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
