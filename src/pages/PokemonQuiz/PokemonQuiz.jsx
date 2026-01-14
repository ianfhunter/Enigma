import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './PokemonQuiz.module.css';

function titleCase(s) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function sortTypes(types) {
  return [...types].sort((a, b) => a.localeCompare(b));
}

export default function PokemonQuiz() {
  const [data, setData] = useState(null); // loaded pokemon_min.json
  const [current, setCurrent] = useState(null); // { gen, pokemon }
  const [guessGen, setGuessGen] = useState(1);
  const [guessTypes, setGuessTypes] = useState(() => new Set());
  const [result, setResult] = useState(null); // { correct, genOk, typesOk, correctGen, correctTypes }

  const [stats, setStats] = usePersistedState('pokemon-quiz-stats', {
    played: 0,
    correct: 0,
    points: 0,
    totalPossible: 0,
    streak: 0,
    maxStreak: 0,
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
    // Pick a random generation, then a random pokemon from it
    const g = data.generations[Math.floor(Math.random() * data.generations.length)];
    if (!g || !g.pokemon?.length) return null;
    const idx = Math.floor(Math.random() * g.pokemon.length);
    return { gen: g.gen, pokemon: g.pokemon[idx] };
  }, [data]);

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

    setStats(prev => {
      const played = prev.played + 1;
      const correctCount = prev.correct + (correct ? 1 : 0);
      const points = prev.points + earnedPoints;
      const totalPossible = prev.totalPossible + maxPoints;
      const streak = correct ? prev.streak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, streak);
      return { played, correct: correctCount, points, totalPossible, streak, maxStreak };
    });
  };

  const onNext = () => {
    startRound();
  };

  const prompt = current ? titleCase(current.pokemon.name.replaceAll('-', ' ')) : '';

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pokémon Quiz"
        instructions="For the shown Pokémon, pick its generation and its type(s)."
      />

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
              <span className={styles.statValue}>{stats.points}</span>
              <span className={styles.statLabel}>Points</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {stats.totalPossible > 0 ? Math.round((stats.points / stats.totalPossible) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Score</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.correct}/{stats.played}</span>
              <span className={styles.statLabel}>Perfect</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.streak}</span>
              <span className={styles.statLabel}>Streak</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
