import { useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Untangle.module.css';

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

function chordCross(a, b, c, d) {
  // a<b, c<d, points on circle in numeric order
  if (a === c || a === d || b === c || b === d) return false;
  return (a < c && c < b && b < d) || (c < a && a < d && d < b);
}

function makeOuterPlanarGraph(n, extraEdges = Math.floor(n / 2)) {
  const edges = new Set();
  const add = (u, v) => {
    const a = Math.min(u, v);
    const b = Math.max(u, v);
    if (a === b) return false;
    const key = `${a}-${b}`;
    if (edges.has(key)) return false;
    // crossing check against existing chords (in circle order)
    for (const e of edges) {
      const [x, y] = e.split('-').map(Number);
      if (chordCross(a, b, x, y)) return false;
    }
    edges.add(key);
    return true;
  };

  // Outer cycle
  for (let i = 0; i < n; i++) add(i, (i + 1) % n);

  let tries = 0;
  while (tries < 5000 && edges.size < n + extraEdges) {
    tries++;
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    add(u, v);
  }

  return [...edges].map((e) => e.split('-').map(Number));
}

function segIntersect(p1, p2, p3, p4) {
  // Proper segment intersection excluding shared endpoints handled outside
  const ax = p2.x - p1.x;
  const ay = p2.y - p1.y;
  const bx = p4.x - p3.x;
  const by = p4.y - p3.y;
  const cx = p3.x - p1.x;
  const cy = p3.y - p1.y;
  const denom = ax * by - ay * bx;
  if (Math.abs(denom) < 1e-9) return false;
  const t = (cx * by - cy * bx) / denom;
  const u = (cx * ay - cy * ax) / denom;
  return t > 0 && t < 1 && u > 0 && u < 1;
}

export default function Untangle() {
  const [n, setN] = useState(12);
  const [edges, setEdges] = useState(() => makeOuterPlanarGraph(12));
  const [points, setPoints] = useState(() => Array.from({ length: 12 }, () => ({ x: randBetween(60, 540), y: randBetween(80, 520) })));
  const [dragIdx, setDragIdx] = useState(null);
  const svgRef = useRef(null);

  const reset = (nextN = n) => {
    setEdges(makeOuterPlanarGraph(nextN));
    setPoints(Array.from({ length: nextN }, () => ({ x: randBetween(60, 540), y: randBetween(80, 520) })));
    setDragIdx(null);
  };

  const crossings = useMemo(() => {
    let count = 0;
    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const p1 = points[a];
      const p2 = points[b];
      if (!p1 || !p2) continue;
      for (let j = i + 1; j < edges.length; j++) {
        const [c, d] = edges[j];
        if (a === c || a === d || b === c || b === d) continue;
        const p3 = points[c];
        const p4 = points[d];
        if (!p3 || !p4) continue;
        if (segIntersect(p1, p2, p3, p4)) count++;
      }
    }
    return count;
  }, [edges, points]);

  const solved = crossings === 0;

  useEffect(() => {
    const onMove = (e) => {
      if (dragIdx == null) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      // Convert screen coordinates to SVG viewBox coordinates (600x600)
      const scaleX = 600 / rect.width;
      const scaleY = 600 / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setPoints((prev) => prev.map((p, i) => (i === dragIdx ? { x, y } : p)));
    };
    const onUp = () => setDragIdx(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragIdx]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Untangle"
        instructions="Drag points until no lines cross."
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          Points
          <select
            className={styles.select}
            value={n}
            onChange={(e) => {
              const v = Number(e.target.value);
              setN(v);
              reset(v);
            }}
          >
            {[8, 10, 12, 15, 18].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <button className={styles.button} onClick={() => reset(n)}>New</button>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>No crossings!</span> : <span>Crossings: {crossings}</span>}
        </div>
      </div>

      <div className={styles.stageWrap}>
        <svg
          ref={svgRef}
          className={styles.svg}
          viewBox="0 0 600 600"
        >
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={points[a]?.x ?? 0}
              y1={points[a]?.y ?? 0}
              x2={points[b]?.x ?? 0}
              y2={points[b]?.y ?? 0}
              className={styles.edge}
            />
          ))}

          {points.map((p, i) => (
            <g key={i} onMouseDown={() => setDragIdx(i)} className={styles.nodeGroup}>
              <circle cx={p.x} cy={p.y} r="14" className={styles.node} />
              <text x={p.x} y={p.y + 5} textAnchor="middle" className={styles.nodeLabel}>
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
