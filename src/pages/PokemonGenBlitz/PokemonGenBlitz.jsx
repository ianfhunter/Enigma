import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './PokemonGenBlitz.module.css';

function normalize(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replaceAll('♀', 'f')
    .replaceAll('♂', 'm')
    .replace(/[^a-z0-9]+/g, '');
}

function titleCaseName(apiName) {
  // "mr-mime" -> "Mr Mime"
  return apiName
    .split('-')
    .filter(Boolean)
    .map(w => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

// Export helpers for testing
export {
  normalize,
  titleCaseName,
};

export default function PokemonGenBlitz() {
  const [data, setData] = useState(null);
  const [gen, setGen] = useState(1);
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [input, setInput] = useState('');
  const [found, setFound] = useState(() => new Set());
  const [message, setMessage] = useState('');

  const inputRef = useRef(null);

  const [best, setBest] = usePersistedState('pokemon-genblitz-best', {
    // gen -> bestCount
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
        if (mounted) setData({ generations: [] });
      }
    })().catch((e) => {
      console.error('Failed to load pokemon dataset:', e);
      setData({ generations: [] });
    });
    return () => { mounted = false; };
  }, []);

  const availableGens = useMemo(() => {
    if (!data?.generations) return [];
    return data.generations.map(g => g.gen);
  }, [data]);

  const genList = useMemo(() => {
    const g = data?.generations?.find(x => x.gen === gen);
    return g?.pokemon || [];
  }, [data, gen]);

  const answerSet = useMemo(() => {
    const set = new Set();
    for (const p of genList) set.add(normalize(p.name));
    return set;
  }, [genList]);

  const total = genList.length;

  const reset = useCallback(() => {
    setRunning(false);
    setTimeLeft(seconds);
    setFound(new Set());
    setInput('');
    setMessage('');
  }, [seconds]);

  useEffect(() => {
    if (!data?.generations?.length) return;
    const initialGen = availableGens.includes(gen) ? gen : availableGens[0];
    setGen(initialGen);
    setTimeLeft(seconds);
    setFound(new Set());
    setInput('');
    setMessage('');
  }, [data, availableGens]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setMessage('Time!');
      const count = found.size;
      setBest(prev => {
        const prevBest = Number(prev?.[gen] || 0);
        if (count > prevBest) return { ...prev, [gen]: count };
        return prev;
      });
      return;
    }
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft, found, gen, setBest]);

  const start = () => {
    reset();
    setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submit = () => {
    if (!running) return;
    const n = normalize(input);
    if (!n) return;

    if (!answerSet.has(n)) {
      setMessage('Nope (for this generation).');
      return;
    }
    if (found.has(n)) {
      setMessage('Already got that one.');
      return;
    }

    setFound(prev => {
      const next = new Set(prev);
      next.add(n);
      return next;
    });
    setInput('');
    setMessage('');
  };

  const giveUp = () => {
    setRunning(false);
    setMessage('Stopped.');
    const count = found.size;
    setBest(prev => {
      const prevBest = Number(prev?.[gen] || 0);
      if (count > prevBest) return { ...prev, [gen]: count };
      return prev;
    });
  };

  const bestForGen = Number(best?.[gen] || 0);
  const foundCount = found.size;

  const foundDisplay = useMemo(() => {
    if (!foundCount) return [];
    // Map normalized -> canonical API name by scanning genList once
    const canonical = new Map(genList.map(p => [normalize(p.name), p.name]));
    return Array.from(found)
      .map(k => canonical.get(k) || k)
      .sort((a, b) => a.localeCompare(b))
      .map(titleCaseName);
  }, [found, genList, foundCount]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pokémon Gen Blitz (Text)"
        instructions="Pick a generation and type as many Pokémon names as you can before time runs out."
      />

      <div className={styles.controls}>
        <label className={styles.label}>
          Generation
          <select
            className={styles.select}
            value={gen}
            onChange={(e) => { setGen(Number(e.target.value)); reset(); }}
            disabled={running || !availableGens.length}
          >
            {availableGens.map(g => (
              <option key={g} value={g}>Gen {g}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Timer
          <select
            className={styles.select}
            value={seconds}
            onChange={(e) => { setSeconds(Number(e.target.value)); setTimeLeft(Number(e.target.value)); reset(); }}
            disabled={running}
          >
            {[60, 90, 120, 180, 300].map(s => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
        </label>

        {!running ? (
          <button className={styles.primaryBtn} onClick={start} disabled={!total}>
            Start
          </button>
        ) : (
          <button className={styles.secondaryBtn} onClick={giveUp}>
            Stop
          </button>
        )}
      </div>

      {!data && <div className={styles.card}>Loading Pokémon...</div>}

      {data && (
        <>
          <div className={styles.hud}>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>Time</span>
              <span className={styles.hudValue}>{timeLeft}s</span>
            </div>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>Found</span>
              <span className={styles.hudValue}>{foundCount} / {total}</span>
            </div>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>Best</span>
              <span className={styles.hudValue}>{bestForGen}</span>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.inputRow}>
              <input
                ref={inputRef}
                className={styles.input}
                value={input}
                disabled={!running}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
                placeholder={running ? 'Type a Pokémon name… (e.g., Mr Mime, Farfetchd, Nidoran F)' : 'Press Start'}
              />
              <button className={styles.primaryBtn} onClick={submit} disabled={!running}>
                Add
              </button>
            </div>

            {message && <div className={styles.message}>{message}</div>}
            <div className={styles.subtle}>Text-only. Matches are forgiving about spaces/hyphens/punctuation.</div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>Found</div>
            {foundCount === 0 ? (
              <div className={styles.subtle}>No names yet.</div>
            ) : (
              <div className={styles.chips}>
                {foundDisplay.map((n) => (
                  <span key={n} className={styles.chip}>{n}</span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
