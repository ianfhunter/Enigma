import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Blackbox.module.css';

const DIRS = [
  { name: 'N', dr: -1, dc: 0 },
  { name: 'E', dr: 0, dc: 1 },
  { name: 'S', dr: 1, dc: 0 },
  { name: 'W', dr: 0, dc: -1 },
];

function leftOf(dir) {
  if (dir.name === 'N') return DIRS[3];
  if (dir.name === 'E') return DIRS[0];
  if (dir.name === 'S') return DIRS[1];
  return DIRS[2]; // W -> S
}
function rightOf(dir) {
  if (dir.name === 'N') return DIRS[1];
  if (dir.name === 'E') return DIRS[2];
  if (dir.name === 'S') return DIRS[3];
  return DIRS[0]; // W -> N
}

function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function keyRC(r, c) {
  return `${r},${c}`;
}

function portId(side, i) {
  return `${side}:${i}`;
}

function allPorts(w, h) {
  const ports = [];
  for (let c = 0; c < w; c++) ports.push(portId('T', c));
  for (let c = 0; c < w; c++) ports.push(portId('B', c));
  for (let r = 0; r < h; r++) ports.push(portId('L', r));
  for (let r = 0; r < h; r++) ports.push(portId('R', r));
  return ports;
}

function portToStart(port, w, h) {
  const [side, idxStr] = port.split(':');
  const i = Number(idxStr);
  if (side === 'T') return { r: -1, c: i, dir: DIRS[2] }; // S
  if (side === 'B') return { r: h, c: i, dir: DIRS[0] }; // N
  if (side === 'L') return { r: i, c: -1, dir: DIRS[1] }; // E
  return { r: i, c: w, dir: DIRS[3] }; // W
}

function exitToPort(r, c, w, h) {
  if (r === -1) return portId('T', c);
  if (r === h) return portId('B', c);
  if (c === -1) return portId('L', r);
  if (c === w) return portId('R', r);
  return null;
}

function simulateShot(entryPort, ballsSet, w, h) {
  const { r: sr, c: sc, dir: sdir } = portToStart(entryPort, w, h);

  // Pre-entry reflection: diagonal adjacency to first rank
  {
    const L = leftOf(sdir);
    const R = rightOf(sdir);
    const flr = sr + sdir.dr + L.dr;
    const flc = sc + sdir.dc + L.dc;
    const frr = sr + sdir.dr + R.dr;
    const frc = sc + sdir.dc + R.dc;
    const fl = inBounds(flr, flc, h, w) && ballsSet.has(keyRC(flr, flc));
    const fr = inBounds(frr, frc, h, w) && ballsSet.has(keyRC(frr, frc));
    if (fl || fr) {
      return { kind: 'R', entry: entryPort, exit: entryPort };
    }
  }

  let r = sr;
  let c = sc;
  let dir = sdir;

  // Avoid infinite loops in weird layouts
  const seen = new Set();
  const stepLimit = (w + h) * (w + h) * 8 + 50;

  for (let steps = 0; steps < stepLimit; steps++) {
    const stateKey = `${r},${c},${dir.name}`;
    if (seen.has(stateKey)) {
      // Treat as reflection fallback
      return { kind: 'R', entry: entryPort, exit: entryPort };
    }
    seen.add(stateKey);

    const nr = r + dir.dr;
    const nc = c + dir.dc;

    // Leaving the arena
    if (!inBounds(nr, nc, h, w)) {
      const exit = exitToPort(nr, nc, w, h);
      if (!exit) return { kind: 'R', entry: entryPort, exit: entryPort };
      if (exit === entryPort) return { kind: 'R', entry: entryPort, exit };
      return { kind: 'X', entry: entryPort, exit };
    }

    // Head-on hit
    if (ballsSet.has(keyRC(nr, nc))) {
      return { kind: 'H', entry: entryPort, exit: null };
    }

    const L = leftOf(dir);
    const R = rightOf(dir);
    const flr = r + dir.dr + L.dr;
    const flc = c + dir.dc + L.dc;
    const frr = r + dir.dr + R.dr;
    const frc = c + dir.dc + R.dc;
    const fl = inBounds(flr, flc, h, w) && ballsSet.has(keyRC(flr, flc));
    const fr = inBounds(frr, frc, h, w) && ballsSet.has(keyRC(frr, frc));

    // Both diagonals -> reflect
    if (fl && fr) {
      dir = DIRS[(DIRS.findIndex((d) => d.name === dir.name) + 2) % 4];
      continue;
    }
    if (fl) {
      dir = rightOf(dir);
      continue;
    }
    if (fr) {
      dir = leftOf(dir);
      continue;
    }

    // Move forward one square (beam passes through square centres in this simplified model)
    r = nr;
    c = nc;
  }

  return { kind: 'R', entry: entryPort, exit: entryPort };
}

function randomBalls(w, h, n) {
  const cells = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push({ r, c });
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const set = new Set();
  for (let i = 0; i < Math.min(n, cells.length); i++) set.add(keyRC(cells[i].r, cells[i].c));
  return set;
}

function normalizePair(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export default function Blackbox() {
  const [w, setW] = useState(8);
  const [h, setH] = useState(8);
  const [ballCount, setBallCount] = useState(4);

  const [solution, setSolution] = useState(() => randomBalls(8, 8, 4));
  const [guesses, setGuesses] = useState(() => new Set());
  const [revealed, setRevealed] = useState(false);

  const [fired, setFired] = useState(() => new Map()); // port -> { kind, entry, exit, label }
  const [pairLabels, setPairLabels] = useState(() => new Map()); // "a|b" -> number
  const [nextLabel, setNextLabel] = useState(1);
  const [checkMsg, setCheckMsg] = useState(null);

  const ports = useMemo(() => allPorts(w, h), [w, h]);

  const newGame = useCallback(() => {
    setSolution(randomBalls(w, h, ballCount));
    setGuesses(new Set());
    setRevealed(false);
    setFired(new Map());
    setPairLabels(new Map());
    setNextLabel(1);
    setCheckMsg(null);
  }, [w, h, ballCount]);

  const toggleGuess = (r, c) => {
    const k = keyRC(r, c);
    setGuesses((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
    setCheckMsg(null);
  };

  const fire = (port) => {
    const shot = simulateShot(port, solution, w, h);
    setFired((prev) => {
      const n = new Map(prev);
      let label = null;
      if (shot.kind === 'X' && shot.exit) {
        const pk = normalizePair(shot.entry, shot.exit);
        const existing = pairLabels.get(pk);
        if (existing != null) label = existing;
        else label = nextLabel;
      }
      n.set(port, { ...shot, label });
      if (shot.kind === 'X' && shot.exit) n.set(shot.exit, { ...shot, entry: shot.exit, exit: shot.entry, label });
      return n;
    });
    if (shot.kind === 'X' && shot.exit) {
      const pk = normalizePair(shot.entry, shot.exit);
      setPairLabels((prev) => {
        const n = new Map(prev);
        if (!n.has(pk)) n.set(pk, nextLabel);
        return n;
      });
      setNextLabel((x) => x + (pairLabels.has(pk) ? 0 : 1));
    }
    setCheckMsg(null);
  };

  const check = () => {
    // Compare *all* ports against the hidden solution (accept any equivalent ball layout).
    for (const p of ports) {
      const sol = simulateShot(p, solution, w, h);
      const usr = simulateShot(p, guesses, w, h);
      const solKey = sol.kind === 'X' ? `${sol.kind}:${normalizePair(sol.entry, sol.exit)}` : sol.kind;
      const usrKey = usr.kind === 'X' ? `${usr.kind}:${normalizePair(usr.entry, usr.exit)}` : usr.kind;
      if (solKey !== usrKey) {
        setCheckMsg({ ok: false, text: `Not consistent: shot at ${p} differs.`, port: p });
        // Reveal just that shot result (like the original shows minimal info)
        const s = simulateShot(p, solution, w, h);
        setFired((prev) => {
          const n = new Map(prev);
          n.set(p, { ...s, label: s.kind === 'X' ? 0 : null, _forced: true });
          return n;
        });
        return;
      }
    }
    setCheckMsg({ ok: true, text: 'Solved! Your ball layout matches all beam behaviour.', port: null });
  };

  const cellType = (rr, cc) => {
    const isCorner = (rr === 0 || rr === h + 1) && (cc === 0 || cc === w + 1);
    if (isCorner) return 'corner';
    const isInner = rr >= 1 && rr <= h && cc >= 1 && cc <= w;
    if (isInner) return 'inner';
    return 'laser';
  };

  const displayForPort = (port) => {
    const res = fired.get(port);
    if (!res) return '';
    if (res.kind === 'H') return 'H';
    if (res.kind === 'R') return 'R';
    if (res.kind === 'X') return String(res.label ?? '');
    return '';
  };

  const portAt = (rr, cc) => {
    // Map board border cell position to a port id.
    if (rr === 0 && cc >= 1 && cc <= w) return portId('T', cc - 1);
    if (rr === h + 1 && cc >= 1 && cc <= w) return portId('B', cc - 1);
    if (cc === 0 && rr >= 1 && rr <= h) return portId('L', rr - 1);
    if (cc === w + 1 && rr >= 1 && rr <= h) return portId('R', rr - 1);
    return null;
  };

  const solved = checkMsg?.ok === true;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Black Box"
        instructions="Fire lasers from the edge to deduce hidden balls. H = hit, R = reflection, matching numbers indicate entry/exit pairs. You can win with any ball layout that reproduces the same beam behaviour."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Width
            <select className={styles.select} value={w} onChange={(e) => setW(Number(e.target.value))}>
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Height
            <select className={styles.select} value={h} onChange={(e) => setH(Number(e.target.value))}>
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Balls
            <input
              className={styles.input}
              type="number"
              min={1}
              max={Math.max(1, w * h - 1)}
              value={ballCount}
              onChange={(e) => setBallCount(Math.max(1, Math.min(w * h - 1, Number(e.target.value) || 1)))}
              style={{ width: 70 }}
            />
          </label>
          <button className={styles.button} onClick={newGame}>New</button>
          <button className={styles.button} onClick={() => setRevealed((v) => !v)}>
            {revealed ? 'Hide' : 'Reveal'}
          </button>
          <button className={styles.button} onClick={check}>Check</button>
        </div>

        <div className={styles.status}>
          {solved && <span className={styles.win}>Solved!</span>}
          {!solved && checkMsg?.ok === false && <span className={styles.bad}>{checkMsg.text}</span>}
          {!checkMsg && <span className={styles.small}>Guesses: {guesses.size}</span>}
        </div>
      </div>

      <div
        className={styles.board}
        style={{ gridTemplateColumns: `repeat(${w + 2}, 42px)` }}
      >
        {Array.from({ length: (h + 2) * (w + 2) }, (_, idx) => {
          const rr = Math.floor(idx / (w + 2));
          const cc = idx % (w + 2);
          const t = cellType(rr, cc);
          const p = portAt(rr, cc);
          if (t === 'corner') {
            return <div key={idx} className={`${styles.cell} ${styles.corner}`} />;
          }
          if (t === 'laser') {
            const label = p ? displayForPort(p) : '';
            return (
              <button
                key={idx}
                className={`${styles.cell} ${styles.laser}`}
                onClick={() => p && fire(p)}
                aria-label={p ? `laser ${p}` : 'laser'}
              >
                {label}
              </button>
            );
          }
          const r = rr - 1;
          const c = cc - 1;
          const k = keyRC(r, c);
          const isGuess = guesses.has(k);
          const isBall = solution.has(k);
          const showBall = revealed && isBall;
          return (
            <button
              key={idx}
              className={[
                styles.cell,
                styles.innerCell,
                isGuess ? styles.guess : '',
                showBall ? styles.revealedBall : '',
              ].join(' ')}
              onClick={() => toggleGuess(r, c)}
              aria-label={`cell ${r},${c}`}
            >
              {showBall ? '●' : (isGuess ? '●' : '')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

