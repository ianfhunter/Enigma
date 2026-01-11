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
  const [modeGen, setModeGen] = useState(1); // optional: focus quiz on a single generation
  const [current, setCurrent] = useState(null); // { gen, pokemon }
  const [guessGen, setGuessGen] = useState(1);
  const [guessTypes, setGuessTypes] = useState(() => new Set());
  const [result, setResult] = useState(null); // { correct, genOk, typesOk, correctGen, correctTypes }

  const [stats, setStats] = usePersistedState('pokemon-quiz-stats', {
    played: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('../../data/pokemon_min.json');
      if (!mounted) return;
      setData(mod.default);
    })().catch((e) => {
      console.error('Failed to load pokemon_min.json:', e);
      setData({ generations: [], types: [] });
    });
    return () => { mounted = false; };
  }, []);

  const availableGens = useMemo(() => {
    if (!data?.generations) return [];
    return data.generations.map(g => g.gen);
  }, [data]);

  const allTypes = useMemo(() => sortTypes(data?.types || []), [data]);

  const pickRandomPokemon = useCallback((gen) => {
    if (!data?.generations?.length) return null;
    const g = data.generations.find(x => x.gen === gen);
    if (!g || !g.pokemon?.length) return null;
    const idx = Math.floor(Math.random() * g.pokemon.length);
    return { gen: g.gen, pokemon: g.pokemon[idx] };
  }, [data]);

  const startRound = useCallback((gen) => {
    const next = pickRandomPokemon(gen);
    setCurrent(next);
    setGuessGen(gen);
    setGuessTypes(new Set());
    setResult(null);
  }, [pickRandomPokemon]);

  useEffect(() => {
    if (!data?.generations?.length) return;
    const initialGen = availableGens.includes(modeGen) ? modeGen : availableGens[0];
    setModeGen(initialGen);
    startRound(initialGen);
  }, [data, availableGens, modeGen, startRound]);

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
    const typesOk =
      guessedTypes.length === correctTypes.length &&
      guessedTypes.every(t => correctTypes.includes(t));

    const correct = genOk && typesOk;
    setResult({ correct, genOk, typesOk, correctGen, correctTypes });

    setStats(prev => {
      const played = prev.played + 1;
      const correctCount = prev.correct + (correct ? 1 : 0);
      const streak = correct ? prev.streak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, streak);
      return { played, correct: correctCount, streak, maxStreak };
    });
  };

  const onNext = () => {
    startRound(modeGen);
  };

  const prompt = current ? titleCase(current.pokemon.name.replaceAll('-', ' ')) : '';

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pokémon Quiz (Text)"
        instructions="For the shown Pokémon, pick its generation and its type(s)."
      />

      <div className={styles.controls}>
        <label className={styles.label}>
          Generation pool
          <select
            className={styles.select}
            value={modeGen}
            onChange={(e) => {
              const g = Number(e.target.value);
              setModeGen(g);
              startRound(g);
            }}
            disabled={!availableGens.length}
          >
            {availableGens.map(g => (
              <option key={g} value={g}>Gen {g}</option>
            ))}
          </select>
        </label>
      </div>

      {!data && <div className={styles.card}>Loading Pokémon...</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>Pokémon</div>
            <div className={styles.prompt}>{prompt}</div>
            <div className={styles.subtle}>Data derived from PokéAPI. No images/sprites included.</div>
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
                  {result.correct ? 'Correct!' : 'Not quite.'}
                </div>
                <div className={styles.resultBody}>
                  Correct: <strong>Gen {result.correctGen}</strong> •{' '}
                  <strong>{result.correctTypes.map(titleCase).join(' / ')}</strong>
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
              <span className={styles.statLabel}>Max</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

