import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './PokemonQuiz.module.css';

function titleCase(s) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function sortTypes(types) {
  return [...types].sort((a, b) => a.localeCompare(b));
}

export default function PokemonQuiz() {
  const { t } = useTranslation();
  const [data, setData] = useState(null); // loaded pokemon_min.json
  const [current, setCurrent] = useState(null); // { gen, pokemon }
  const [guessGen, setGuessGen] = useState(1);
  const [guessTypes, setGuessTypes] = useState(() => new Set());
  const [result, setResult] = useState(null); // { correct, genOk, typesOk, correctGen, correctTypes }
  const [seed, setSeed] = useState(() => stringToSeed(`pokemon-quiz-${getTodayDateString()}`));
  const [roundNumber, setRoundNumber] = useState(0);

  const { stats, updateStats, recordWin, recordLoss, winRate } = useGameStats('pokemon-quiz', {
    trackBestTime: false,
    trackBestScore: true,
    scoreComparison: 'higher',
    defaultStats: { points: 0, totalPossible: 0 },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/datasets/pokemon.json');
        if (!resp.ok) throw new Error(`Failed to load pokemon dataset: ${resp.status}`);
        const json = await resp.json();
        if (!mounted) return;
        setData(json);
      } catch (e) {
        console.error('Failed to load pokemon dataset:', e);
        if (mounted) setData({ generations: [], types: [] });
      }
    })().catch((e) => {
      console.error('Failed to load pokemon dataset:', e);
      setData({ generations: [], types: [] });
    });
    return () => { mounted = false; };
  }, []);

  const availableGens = useMemo(() => {
    if (!data?.generations) return [];
    return data.generations.map(g => g.gen);
  }, [data]);

  const allTypes = useMemo(() => sortTypes(data?.types || []), [data]);

  const pickRandomPokemon = useCallback(() => {
    if (!data?.generations?.length) return null;
    // Use seeded random based on current seed and round number
    const random = createSeededRandom(seed + roundNumber);

    // Pick a random generation, then a random pokemon from it
    const g = data.generations[Math.floor(random() * data.generations.length)];
    if (!g || !g.pokemon?.length) return null;
    const idx = Math.floor(random() * g.pokemon.length);
    return { gen: g.gen, pokemon: g.pokemon[idx] };
  }, [data, seed, roundNumber]);

  const startRound = useCallback(() => {
    const next = pickRandomPokemon();
    setCurrent(next);
    setGuessGen(1); // Default guess to Gen 1
    setGuessTypes(new Set());
    setResult(null);
  }, [pickRandomPokemon]);

  useEffect(() => {
    if (!data?.generations?.length) return;
    startRound();
  }, [data, startRound]);

  const toggleType = (t) => {
    if (result) return;
    setGuessTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const submit = () => {
    if (!current) return;
    const correctGen = current.gen;
    const correctTypes = current.pokemon.types;

    const genOk = guessGen === correctGen;
    const guessedTypes = Array.from(guessTypes);

    // Calculate which types are correct
    const correctGuessedTypes = guessedTypes.filter(t => correctTypes.includes(t));
    const typesOk =
      guessedTypes.length === correctTypes.length &&
      guessedTypes.every(t => correctTypes.includes(t));

    // Points: 1 for generation, 1 for each correct type
    const genPoints = genOk ? 1 : 0;
    const typePoints = correctGuessedTypes.length;
    const earnedPoints = genPoints + typePoints;
    const maxPoints = 1 + correctTypes.length; // gen + all types

    const correct = genOk && typesOk;
    setResult({
      correct,
      genOk,
      typesOk,
      correctGen,
      correctTypes,
      correctGuessedTypes,
      earnedPoints,
      maxPoints,
      genPoints,
      typePoints
    });

    // Track points in custom stats
    updateStats(prev => ({
      ...prev,
      points: (prev.points || 0) + earnedPoints,
      totalPossible: (prev.totalPossible || 0) + maxPoints,
    }));
    // Record win/loss based on whether they got the Pokemon exactly right
    if (correct) {
      recordWin();
    } else {
      recordLoss();
    }
  };

  const onNext = () => {
    setRoundNumber(prev => prev + 1);
    startRound();
  };

  const prompt = current ? titleCase(current.pokemon.name.replaceAll('-', ' ')) : '';

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pokémon Quiz"
        instructions="For the shown Pokémon, pick its generation and its type(s)."
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

      {!data && <div className={styles.card}>Loading Pokémon...</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>Pokémon</div>
            <div className={styles.prompt}>{prompt}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>Your answer</div>

            <div className={styles.row}>
              <label className={styles.label}>
                Generation
                <select
                  className={styles.select}
                  value={guessGen}
                  onChange={(e) => setGuessGen(Number(e.target.value))}
                  disabled={!!result}
                >
                  {availableGens.map(g => (
                    <option key={g} value={g}>Gen {g}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.sectionTitle}>Types</div>
            <div className={styles.typesGrid}>
              {allTypes.map(t => (
                <button
                  key={t}
                  className={`${styles.typeBtn} ${guessTypes.has(t) ? styles.selected : ''}`}
                  onClick={() => toggleType(t)}
                  disabled={!!result}
                >
                  {titleCase(t)}
                </button>
              ))}
            </div>

            <div className={styles.actions}>
              {!result ? (
                <button className={styles.primaryBtn} onClick={submit}>
                  Check
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={onNext}>
                  Next
                </button>
              )}
            </div>

            {result && (
              <div className={`${styles.result} ${result.correct ? styles.ok : styles.nope}`}>
                <div className={styles.resultTitle}>
                  {result.correct ? 'Perfect!' : `${result.earnedPoints}/${result.maxPoints} points`}
                </div>
                <div className={styles.resultBreakdown}>
                  <span className={result.genOk ? styles.pointOk : styles.pointMiss}>
                    Generation: {result.genOk ? '+1' : '0'} {!result.genOk && `(was Gen ${result.correctGen})`}
                  </span>
                  <span className={result.typesOk ? styles.pointOk : styles.pointMiss}>
                    Types: +{result.typePoints}/{result.correctTypes.length}
                    {!result.typesOk && ` (${result.correctTypes.map(titleCase).join('/')})`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.points || 0}</span>
              <span className={styles.statLabel}>Points</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {(stats.totalPossible || 0) > 0 ? Math.round(((stats.points || 0) / stats.totalPossible) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Score</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.won}/{stats.played}</span>
              <span className={styles.statLabel}>{t('common.perfect')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.currentStreak}</span>
              <span className={styles.statLabel}>{t('common.streak')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
