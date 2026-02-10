import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function buildDomainOptions(allDomains, correctDomains, totalOptions, random) {
  const safeAll = Array.isArray(allDomains) ? allDomains : [];
  const safeCorrect = Array.isArray(correctDomains) ? correctDomains : [];
  const uniqueCorrect = Array.from(new Set(safeCorrect));
  const uniqueAll = Array.from(new Set(safeAll));
  const optionCount = Math.max(totalOptions, uniqueCorrect.length);
  const pool = uniqueAll.filter(domain => !uniqueCorrect.includes(domain));
  const selections = [...uniqueCorrect];

  while (selections.length < optionCount && pool.length > 0) {
    const idx = Math.floor(random() * pool.length);
    selections.push(pool.splice(idx, 1)[0]);
  }

  for (let i = selections.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [selections[i], selections[j]] = [selections[j], selections[i]];
  }

  return selections;
}

export function getRoundInitSignature(seed, mythology, godsLength) {
  return `${seed}|${mythology}|${godsLength}`;
}

export default function GodsQuiz() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [mythology, setMythology] = useState('all');
  const [current, setCurrent] = useState(null);
  const [guessDomains, setGuessDomains] = useState(() => new Set());
  const [result, setResult] = useState(null);
  const [seed, setSeed] = useState(() => stringToSeed(`gods-quiz-${getTodayDateString()}`));
  const [roundSeed, setRoundSeed] = useState(() => seed);
  const roundNumberRef = useRef(0);
  const lastRoundInitSignatureRef = useRef('');

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

  const startRound = useCallback(() => {
    if (!gods.length) return;
    const nextSeed = seed + roundNumberRef.current;
    const random = createSeededRandom(nextSeed);
    const idx = Math.floor(random() * gods.length);
    const next = gods[idx];
    if (!next) return;
    setCurrent(next);
    setRoundSeed(nextSeed);
    setGuessDomains(new Set());
    setResult(null);
    roundNumberRef.current += 1;
  }, [gods, seed]);

  useEffect(() => {
    const signature = getRoundInitSignature(seed, mythology, gods.length);
    if (!gods.length || lastRoundInitSignatureRef.current === signature) return;
    lastRoundInitSignatureRef.current = signature;
    roundNumberRef.current = 0;
    startRound();
  }, [gods.length, mythology, seed, startRound]);

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

  const domainOptions = useMemo(() => {
    if (!current) return [];
    const random = createSeededRandom(roundSeed);
    return buildDomainOptions(allDomains, current.domains, 9, random);
  }, [allDomains, current, roundSeed]);

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('Gods & Domains Quiz')}
        instructions={t('Select all the domains associated with each deity from Greek, Roman, Norse, and Egyptian mythology.')}
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
            setRoundSeed(seedNum);
            roundNumberRef.current = 0;
            lastRoundInitSignatureRef.current = '';
          }}
        />
      )}

      <div className={styles.controls}>
        <label className={styles.label}>
          {t('Mythology')}
          <select
            className={styles.select}
            value={mythology}
            onChange={(e) => setMythology(e.target.value)}
          >
            <option value="all">{t('All Mythologies')}</option>
            {mythologies.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {!data && <div className={styles.card}>{t('Loading gods...')}</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>{t('{{mythology}} Mythology', { mythology: current.mythology })}</div>
            <div className={styles.prompt}>{current.name}</div>
            <div className={styles.subtle}>
              {t('Pick {{count}} from {{total}}', {
                count: current.domains.length,
                total: domainOptions.length,
              })}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>{t('Domains')}</div>
            <div className={styles.domainsGrid}>
              {domainOptions.map(domain => {
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
                  {t('Check Answer')}
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={startRound}>
                  {t('Next God →')}
                </button>
              )}
            </div>

            {result && (
              <div className={`${styles.result} ${result.correct ? styles.ok : styles.nope}`}>
                <div className={styles.resultTitle}>
                  {result.correct ? t('✓ Correct!') : t('✗ Incorrect')}
                </div>
                <div className={styles.resultBody}>
                  {t('{{name}} ({{mythology}}): {{domains}}', {
                    name: current.name,
                    mythology: current.mythology,
                    domains: result.correctDomains.join(', '),
                  })}
                </div>
              </div>
            )}
          </div>

          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.played}</span>
              <span className={styles.statLabel}>{t('Played')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{winRate}%</span>
              <span className={styles.statLabel}>{t('Accuracy')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.currentStreak}</span>
              <span className={styles.statLabel}>{t('Streak')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.maxStreak}</span>
              <span className={styles.statLabel}>{t('Best')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
