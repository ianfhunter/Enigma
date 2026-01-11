import { useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Guess.module.css';

const DEFAULT_COLORS = [
  { id: 0, name: 'Red', hex: '#ef4444' },
  { id: 1, name: 'Orange', hex: '#f97316' },
  { id: 2, name: 'Yellow', hex: '#eab308' },
  { id: 3, name: 'Green', hex: '#22c55e' },
  { id: 4, name: 'Blue', hex: '#3b82f6' },
  { id: 5, name: 'Purple', hex: '#a855f7' },
  { id: 6, name: 'Pink', hex: '#ec4899' },
  { id: 7, name: 'Teal', hex: '#14b8a6' },
];

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

function makeSecret({ colors, pegs, allowDuplicates }) {
  const out = [];
  const available = colors.map((c) => c.id);
  for (let i = 0; i < pegs; i++) {
    if (allowDuplicates) {
      out.push(colors[randomInt(colors.length)].id);
    } else {
      const pickIdx = randomInt(available.length);
      out.push(available.splice(pickIdx, 1)[0]);
    }
  }
  return out;
}

function scoreGuess(secret, guess) {
  let black = 0;
  const secretCounts = new Map();
  const guessCounts = new Map();

  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      black++;
    } else {
      secretCounts.set(secret[i], (secretCounts.get(secret[i]) || 0) + 1);
      guessCounts.set(guess[i], (guessCounts.get(guess[i]) || 0) + 1);
    }
  }

  let white = 0;
  for (const [colorId, c] of guessCounts.entries()) {
    const s = secretCounts.get(colorId) || 0;
    white += Math.min(s, c);
  }

  return { black, white };
}

export default function Guess() {
  const [settings, setSettings] = useState({
    colors: 6,
    pegs: 4,
    guesses: 10,
    allowDuplicates: true,
  });

  const palette = useMemo(() => DEFAULT_COLORS.slice(0, settings.colors), [settings.colors]);

  const [secret, setSecret] = useState(() => makeSecret({ colors: DEFAULT_COLORS.slice(0, 6), pegs: 4, allowDuplicates: true }));
  const [selectedColor, setSelectedColor] = useState(palette[0]?.id ?? 0);
  const [rows, setRows] = useState(() => Array.from({ length: settings.guesses }, () => Array(settings.pegs).fill(null)));
  const [feedback, setFeedback] = useState(() => Array.from({ length: settings.guesses }, () => ({ black: 0, white: 0, done: false })));
  const [activeRow, setActiveRow] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const reset = (next = settings) => {
    const nextPalette = DEFAULT_COLORS.slice(0, next.colors);
    setSecret(makeSecret({ colors: nextPalette, pegs: next.pegs, allowDuplicates: next.allowDuplicates }));
    setSelectedColor(nextPalette[0]?.id ?? 0);
    setRows(Array.from({ length: next.guesses }, () => Array(next.pegs).fill(null)));
    setFeedback(Array.from({ length: next.guesses }, () => ({ black: 0, white: 0, done: false })));
    setActiveRow(0);
    setRevealed(false);
  };

  const won = feedback.some((f) => f.done && f.black === settings.pegs);
  const lost = !won && activeRow >= settings.guesses;

  const canSubmit = activeRow < settings.guesses && rows[activeRow].every((x) => x != null);

  const placeAt = (idx) => {
    if (won || lost) return;
    if (activeRow >= settings.guesses) return;
    setRows((prev) => {
      const next = prev.map((r) => r.slice());
      next[activeRow][idx] = selectedColor;
      return next;
    });
  };

  const clearAt = (idx) => {
    if (won || lost) return;
    if (activeRow >= settings.guesses) return;
    setRows((prev) => {
      const next = prev.map((r) => r.slice());
      next[activeRow][idx] = null;
      return next;
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    const guessRow = rows[activeRow].slice();
    const { black, white } = scoreGuess(secret, guessRow);
    setFeedback((prev) => {
      const next = prev.slice();
      next[activeRow] = { black, white, done: true };
      return next;
    });
    setActiveRow((r) => r + 1);
    if (black === settings.pegs) setRevealed(true);
  };

  const reveal = () => setRevealed(true);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Guess"
        instructions="Mastermind-style: build a row of colored pegs, then submit to get black (right color + place) and white (right color, wrong place) feedback."
      />

      <div className={styles.topBar}>
        <div className={styles.settings}>
          <label className={styles.label}>
            Colors
            <select
              className={styles.select}
              value={settings.colors}
              onChange={(e) => {
                const next = { ...settings, colors: Number(e.target.value) };
                setSettings(next);
                reset(next);
              }}
            >
              {[4, 5, 6, 7, 8].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Pegs
            <select
              className={styles.select}
              value={settings.pegs}
              onChange={(e) => {
                const next = { ...settings, pegs: Number(e.target.value) };
                setSettings(next);
                reset(next);
              }}
            >
              {[3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Guesses
            <select
              className={styles.select}
              value={settings.guesses}
              onChange={(e) => {
                const next = { ...settings, guesses: Number(e.target.value) };
                setSettings(next);
                reset(next);
              }}
            >
              {[8, 10, 12].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={settings.allowDuplicates}
              onChange={(e) => {
                const next = { ...settings, allowDuplicates: e.target.checked };
                setSettings(next);
                reset(next);
              }}
            />
            Allow duplicates
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.button} onClick={() => reset(settings)}>New</button>
          <button className={styles.button} onClick={submit} disabled={!canSubmit || won || lost}>Mark guess</button>
          <button className={styles.button} onClick={reveal} disabled={revealed}>Solve</button>
        </div>
      </div>

      <div className={styles.palette}>
        {palette.map((c) => (
          <button
            key={c.id}
            className={`${styles.color} ${selectedColor === c.id ? styles.selected : ''}`}
            style={{ background: c.hex }}
            onClick={() => setSelectedColor(c.id)}
            title={c.name}
          />
        ))}
      </div>

      <div className={styles.board}>
        {rows.map((row, rIdx) => {
          const f = feedback[rIdx];
          const isActive = rIdx === activeRow && !won && !lost;
          return (
            <div key={rIdx} className={`${styles.row} ${isActive ? styles.activeRow : ''}`}>
              <div className={styles.pegs}>
                {row.map((cell, cIdx) => {
                  const color = cell == null ? null : palette.find((p) => p.id === cell)?.hex;
                  return (
                    <button
                      key={cIdx}
                      className={styles.peg}
                      style={{ background: color ?? 'rgba(255,255,255,0.06)' }}
                      onClick={() => (cell == null ? placeAt(cIdx) : clearAt(cIdx))}
                      disabled={!isActive}
                      aria-label={`row ${rIdx + 1} peg ${cIdx + 1}`}
                    />
                  );
                })}
              </div>
              <div className={styles.feedback}>
                <div className={styles.fbPegs}>
                  {Array.from({ length: settings.pegs }).map((_, i) => {
                    const type = f.done ? (i < f.black ? 'black' : i < f.black + f.white ? 'white' : 'empty') : 'empty';
                    return <div key={i} className={`${styles.fb} ${styles[type]}`} />;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.secret}>
        <div className={styles.secretLabel}>{revealed ? 'Solution' : (won ? 'Solved!' : lost ? 'Out of guesses' : 'Solution')}</div>
        <div className={styles.secretPegs}>
          {secret.map((id, i) => {
            const hex = palette.find((p) => p.id === id)?.hex;
            return (
              <div
                key={i}
                className={styles.secretPeg}
                style={{ background: revealed ? hex : 'rgba(255,255,255,0.08)' }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

