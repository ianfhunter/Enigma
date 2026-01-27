import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './GodsQuiz.module.css';

// Helper to check if guessed domains match exactly the deity's domains
export function evaluateDomains(correctDomains, guessedDomainsSet) {
  if (!correctDomains) return false;
  const guessed = Array.from(guessedDomainsSet);
  if (guessed.length !== correctDomains.length) return false;
  return guessed.every(d => correctDomains.includes(d));
}

// Helper to filter gods list by mythology code
export function filterGodsByMythology(gods, mythology) {
  if (!Array.isArray(gods)) return [];
  if (mythology === 'all') return gods;
  return gods.filter(g => g.mythology === mythology);
}

export default function GodsQuiz() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [mythology, setMythology] = useState('all');
  const [current, setCurrent] = useState(null);
  const [guessDomains, setGuessDomains] = useState(() => new Set());
  const [result, setResult] = useState(null);
  const [seed, setSeed] = useState(() => stringToSeed(`gods-quiz-${getTodayDateString()}`));
  const [roundNumber, setRoundNumber] = useState(0);

  const { stats, recordWin, recordLoss, winRate } = useGameStats('gods-quiz', {
    trackBestTime: false,
    trackBestScore: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('../../../datasets/gods.json');
      if (!mounted) return;
      setData(mod.default);
    })().catch((e) => {
      console.error('Failed to load gods.json:', e);
      setData({ gods: [], mythologies: [], allDomains: [] });
    });
    return () => { mounted = false; };
  }, []);

  const gods = useMemo(() => filterGodsByMythology(data?.gods || [], mythology), [data, mythology]);

  const mythologies = useMemo(() => data?.mythologies || [], [data]);
  const allDomains = useMemo(() => data?.allDomains || [], [data]);

  const pickRandom = useCallback(() => {
    if (!gods.length) return null;
    const random = createSeededRandom(seed + roundNumber);
    const idx = Math.floor(random() * gods.length);
    return gods[idx];
  }, [gods, seed, roundNumber]);

  const startRound = useCallback(() => {
    const next = pickRandom();
    if (!next) return;
    setCurrent(next);
    setGuessDomains(new Set());
    setResult(null);
    setRoundNumber(prev => prev + 1);
  }, [pickRandom]);

  useEffect(() => {
    if (gods.length) {
      startRound();
    }
  }, [gods, startRound]);

  const toggleDomain = (domain) => {
    if (result) return;
    setGuessDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const submit = () => {
    if (!current) return;
    const correctDomains = current.domains;
    const isCorrect = evaluateDomains(correctDomains, guessDomains);
    setResult({ correct: isCorrect, correctDomains });

    if (isCorrect) {
      recordWin();
    } else {
      recordLoss();
    }
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Gods & Domains Quiz"
        instructions="Select all the domains associated with each deity from Greek, Roman, Norse, and Egyptian mythology."
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

      <div className={styles.controls}>
        <label className={styles.label}>
          Mythology
          <select
            className={styles.select}
            value={mythology}
            onChange={(e) => setMythology(e.target.value)}
          >
            <option value="all">All Mythologies</option>
            {mythologies.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {!data && <div className={styles.card}>Loading gods...</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>{current.mythology} Mythology</div>
            <div className={styles.prompt}>{current.name}</div>
            <div className={styles.subtle}>
              Select all domains ({current.domains.length} total)
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>Domains</div>
            <div className={styles.domainsGrid}>
              {allDomains.map(domain => {
                let btnClass = styles.domainBtn;
                if (result) {
                  const isCorrectDomain = current.domains.includes(domain);
                  const wasSelected = guessDomains.has(domain);
                  if (isCorrectDomain && wasSelected) {
                    btnClass += ` ${styles.correctSelected}`;
                  } else if (isCorrectDomain && !wasSelected) {
                    btnClass += ` ${styles.missed}`;
                  } else if (!isCorrectDomain && wasSelected) {
                    btnClass += ` ${styles.wrong}`;
                  }
                } else if (guessDomains.has(domain)) {
                  btnClass += ` ${styles.selected}`;
                }
                return (
                  <button
                    key={domain}
                    className={btnClass}
                    onClick={() => toggleDomain(domain)}
                    disabled={!!result}
                  >
                    {domain}
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
                  Next God →
                </button>
              )}
            </div>

            {result && (
              <div className={`${styles.result} ${result.correct ? styles.ok : styles.nope}`}>
                <div className={styles.resultTitle}>
                  {result.correct ? '✓ Correct!' : '✗ Incorrect'}
                </div>
                <div className={styles.resultBody}>
                  {current.name} ({current.mythology}): <strong>{result.correctDomains.join(', ')}</strong>
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
              <span className={styles.statValue}>{winRate}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.currentStreak}</span>
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
