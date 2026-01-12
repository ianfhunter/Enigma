import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Loopy.module.css';

function idxHEdge(r, c, w) {
  // horizontal edge between (r,c) and (r,c+1), r in [0..h], c in [0..w-1]
  return r * w + c;
}
function idxVEdge(r, c, w) {
  // vertical edge between (r,c) and (r+1,c), r in [0..h-1], c in [0..w]
  return r * (w + 1) + c;
}

// Generate clues from edge arrays
function makeClues(w, h, hEdges, vEdges) {
  const clues = new Array(h * w).fill(null);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const topE = hEdges[idxHEdge(r, c, w)];
      const botE = hEdges[idxHEdge(r + 1, c, w)];
      const leftE = vEdges[idxVEdge(r, c, w)];
      const rightE = vEdges[idxVEdge(r, c + 1, w)];
      const n = (topE === 1) + (botE === 1) + (leftE === 1) + (rightE === 1);
      clues[r * w + c] = n;
    }
  }
  return clues;
}

function makeRectanglePuzzle(w, h) {
  const top = Math.floor(Math.random() * h);
  const bottom = top + 1 + Math.floor(Math.random() * (h - top));
  const left = Math.floor(Math.random() * w);
  const right = left + 1 + Math.floor(Math.random() * (w - left));

  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  for (let c = left; c < right; c++) {
    hEdges[idxHEdge(top, c, w)] = 1;
    hEdges[idxHEdge(bottom, c, w)] = 1;
  }
  for (let r = top; r < bottom; r++) {
    vEdges[idxVEdge(r, left, w)] = 1;
    vEdges[idxVEdge(r, right, w)] = 1;
  }

  return { w, h, clues: makeClues(w, h, hEdges, vEdges), solution: { hEdges, vEdges } };
}

// Generate an L-shaped loop
function makeLShapePuzzle(w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  // Random dimensions for the L
  const minSize = 2;
  const armWidth = minSize + Math.floor(Math.random() * Math.min(2, Math.floor((w - minSize) / 2)));
  const armHeight = minSize + Math.floor(Math.random() * Math.min(2, Math.floor((h - minSize) / 2)));
  const totalWidth = Math.min(w - 1, armWidth + minSize + Math.floor(Math.random() * (w - armWidth - minSize)));
  const totalHeight = Math.min(h - 1, armHeight + minSize + Math.floor(Math.random() * (h - armHeight - minSize)));

  // Position the L
  const startR = Math.floor(Math.random() * Math.max(1, h - totalHeight));
  const startC = Math.floor(Math.random() * Math.max(1, w - totalWidth));

  // Draw L-shape (rotated randomly)
  const rotation = Math.floor(Math.random() * 4);

  // Build path vertices for L shape
  let vertices;
  switch (rotation) {
    case 0: // L normal (└)
      vertices = [
        [startR, startC],
        [startR, startC + armWidth],
        [startR + totalHeight - armHeight, startC + armWidth],
        [startR + totalHeight - armHeight, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth],
        [startR + totalHeight, startC],
      ];
      break;
    case 1: // L rotated 90° (┌)
      vertices = [
        [startR, startC],
        [startR + totalHeight, startC],
        [startR + totalHeight, startC + armWidth],
        [startR + armHeight, startC + armWidth],
        [startR + armHeight, startC + totalWidth],
        [startR, startC + totalWidth],
      ];
      break;
    case 2: // L rotated 180° (┐)
      vertices = [
        [startR, startC],
        [startR + armHeight, startC],
        [startR + armHeight, startC + totalWidth - armWidth],
        [startR + totalHeight, startC + totalWidth - armWidth],
        [startR + totalHeight, startC + totalWidth],
        [startR, startC + totalWidth],
      ];
      break;
    default: // L rotated 270° (┘)
      vertices = [
        [startR, startC + totalWidth - armWidth],
        [startR + totalHeight - armHeight, startC + totalWidth - armWidth],
        [startR + totalHeight - armHeight, startC],
        [startR + totalHeight, startC],
        [startR + totalHeight, startC + totalWidth],
        [startR, startC + totalWidth],
      ];
  }

  // Draw edges between consecutive vertices
  for (let i = 0; i < vertices.length; i++) {
    const [r1, c1] = vertices[i];
    const [r2, c2] = vertices[(i + 1) % vertices.length];

    if (r1 === r2) {
      // Horizontal segment
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC; c < maxC; c++) {
        hEdges[idxHEdge(r1, c, w)] = 1;
      }
    } else {
      // Vertical segment
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR; r < maxR; r++) {
        vEdges[idxVEdge(r, c1, w)] = 1;
      }
    }
  }

  return { w, h, clues: makeClues(w, h, hEdges, vEdges), solution: { hEdges, vEdges } };
}

// Generate a U-shaped loop
function makeUShapePuzzle(w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  const minSize = 2;
  const armWidth = minSize;
  const totalWidth = Math.min(w - 1, armWidth * 2 + minSize + Math.floor(Math.random() * Math.max(1, w - armWidth * 2 - minSize)));
  const totalHeight = Math.min(h - 1, minSize + 1 + Math.floor(Math.random() * Math.max(1, h - minSize - 1)));
  const notchDepth = Math.max(1, Math.floor(totalHeight / 2) - 1 + Math.floor(Math.random() * 2));

  const startR = Math.floor(Math.random() * Math.max(1, h - totalHeight));
  const startC = Math.floor(Math.random() * Math.max(1, w - totalWidth));

  const rotation = Math.floor(Math.random() * 4);

  let vertices;
  switch (rotation) {
    case 0: // U opens up
      vertices = [
        [startR + notchDepth, startC + armWidth],
        [startR, startC + armWidth],
        [startR, startC],
        [startR + totalHeight, startC],
        [startR + totalHeight, startC + totalWidth],
        [startR, startC + totalWidth],
        [startR, startC + totalWidth - armWidth],
        [startR + notchDepth, startC + totalWidth - armWidth],
      ];
      break;
    case 1: // U opens right
      vertices = [
        [startR + armWidth, startC + totalWidth - notchDepth],
        [startR + armWidth, startC + totalWidth],
        [startR, startC + totalWidth],
        [startR, startC],
        [startR + totalHeight, startC],
        [startR + totalHeight, startC + totalWidth],
        [startR + totalHeight - armWidth, startC + totalWidth],
        [startR + totalHeight - armWidth, startC + totalWidth - notchDepth],
      ];
      break;
    case 2: // U opens down
      vertices = [
        [startR + totalHeight - notchDepth, startC + armWidth],
        [startR + totalHeight, startC + armWidth],
        [startR + totalHeight, startC],
        [startR, startC],
        [startR, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth - armWidth],
        [startR + totalHeight - notchDepth, startC + totalWidth - armWidth],
      ];
      break;
    default: // U opens left
      vertices = [
        [startR + armWidth, startC + notchDepth],
        [startR + armWidth, startC],
        [startR, startC],
        [startR, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth],
        [startR + totalHeight, startC],
        [startR + totalHeight - armWidth, startC],
        [startR + totalHeight - armWidth, startC + notchDepth],
      ];
  }

  for (let i = 0; i < vertices.length; i++) {
    const [r1, c1] = vertices[i];
    const [r2, c2] = vertices[(i + 1) % vertices.length];

    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC; c < maxC; c++) {
        hEdges[idxHEdge(r1, c, w)] = 1;
      }
    } else {
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR; r < maxR; r++) {
        vEdges[idxVEdge(r, c1, w)] = 1;
      }
    }
  }

  return { w, h, clues: makeClues(w, h, hEdges, vEdges), solution: { hEdges, vEdges } };
}

// Generate a Z/S-shaped loop
function makeZigzagPuzzle(w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  const minSize = 2;
  const segWidth = Math.max(minSize, Math.floor(w / 3));
  const totalWidth = Math.min(w - 1, segWidth * 2 + Math.floor(Math.random() * Math.max(1, w - segWidth * 2)));
  const totalHeight = Math.min(h - 1, minSize * 2 + Math.floor(Math.random() * Math.max(1, h - minSize * 2)));
  const midHeight = Math.floor(totalHeight / 2);

  const startR = Math.floor(Math.random() * Math.max(1, h - totalHeight));
  const startC = Math.floor(Math.random() * Math.max(1, w - totalWidth));

  const isZ = Math.random() > 0.5;

  let vertices;
  if (isZ) {
    vertices = [
      [startR, startC],
      [startR, startC + totalWidth],
      [startR + minSize, startC + totalWidth],
      [startR + minSize, startC + totalWidth - segWidth + minSize],
      [startR + totalHeight - minSize, startC + segWidth - minSize],
      [startR + totalHeight - minSize, startC],
      [startR + totalHeight, startC],
      [startR + totalHeight, startC + totalWidth],
      [startR + totalHeight, startC + totalWidth],
      [startR + midHeight + minSize, startC + totalWidth],
      [startR + midHeight + minSize, startC + totalWidth - segWidth + minSize],
      [startR + midHeight - minSize, startC + segWidth - minSize],
      [startR + midHeight - minSize, startC],
    ];
    // Simplify to a proper Z
    vertices = [
      [startR, startC],
      [startR, startC + totalWidth],
      [startR + minSize, startC + totalWidth],
      [startR + totalHeight - minSize, startC + minSize],
      [startR + totalHeight - minSize, startC],
      [startR + totalHeight, startC],
      [startR + totalHeight, startC + totalWidth],
      [startR + totalHeight - minSize, startC + totalWidth],
      [startR + minSize, startC + minSize],
      [startR + minSize, startC],
    ];
  } else {
    // S shape (reversed Z)
    vertices = [
      [startR, startC + totalWidth],
      [startR, startC],
      [startR + minSize, startC],
      [startR + totalHeight - minSize, startC + totalWidth - minSize],
      [startR + totalHeight - minSize, startC + totalWidth],
      [startR + totalHeight, startC + totalWidth],
      [startR + totalHeight, startC],
      [startR + totalHeight - minSize, startC],
      [startR + minSize, startC + totalWidth - minSize],
      [startR + minSize, startC + totalWidth],
    ];
  }

  for (let i = 0; i < vertices.length; i++) {
    const [r1, c1] = vertices[i];
    const [r2, c2] = vertices[(i + 1) % vertices.length];

    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC; c < maxC; c++) {
        hEdges[idxHEdge(r1, c, w)] = 1;
      }
    } else if (c1 === c2) {
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR; r < maxR; r++) {
        vEdges[idxVEdge(r, c1, w)] = 1;
      }
    }
  }

  return { w, h, clues: makeClues(w, h, hEdges, vEdges), solution: { hEdges, vEdges } };
}

// Generate a T-shaped loop
function makeTShapePuzzle(w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  const minSize = 2;
  const stemWidth = minSize;
  const totalWidth = Math.min(w - 1, stemWidth + minSize * 2 + Math.floor(Math.random() * Math.max(1, w - stemWidth - minSize * 2)));
  const totalHeight = Math.min(h - 1, stemWidth + minSize + Math.floor(Math.random() * Math.max(1, h - stemWidth - minSize)));
  const topHeight = minSize;
  const stemStart = Math.floor((totalWidth - stemWidth) / 2);

  const startR = Math.floor(Math.random() * Math.max(1, h - totalHeight));
  const startC = Math.floor(Math.random() * Math.max(1, w - totalWidth));

  const rotation = Math.floor(Math.random() * 4);

  let vertices;
  switch (rotation) {
    case 0: // T normal (stem down)
      vertices = [
        [startR, startC],
        [startR, startC + totalWidth],
        [startR + topHeight, startC + totalWidth],
        [startR + topHeight, startC + stemStart + stemWidth],
        [startR + totalHeight, startC + stemStart + stemWidth],
        [startR + totalHeight, startC + stemStart],
        [startR + topHeight, startC + stemStart],
        [startR + topHeight, startC],
      ];
      break;
    case 1: // T rotated 90° (stem right)
      vertices = [
        [startR, startC],
        [startR, startC + topHeight],
        [startR + stemStart, startC + topHeight],
        [startR + stemStart, startC + totalWidth],
        [startR + stemStart + stemWidth, startC + totalWidth],
        [startR + stemStart + stemWidth, startC + topHeight],
        [startR + totalHeight, startC + topHeight],
        [startR + totalHeight, startC],
      ];
      break;
    case 2: // T rotated 180° (stem up)
      vertices = [
        [startR, startC + stemStart],
        [startR, startC + stemStart + stemWidth],
        [startR + totalHeight - topHeight, startC + stemStart + stemWidth],
        [startR + totalHeight - topHeight, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth],
        [startR + totalHeight, startC],
        [startR + totalHeight - topHeight, startC],
        [startR + totalHeight - topHeight, startC + stemStart],
      ];
      break;
    default: // T rotated 270° (stem left)
      vertices = [
        [startR, startC + totalWidth - topHeight],
        [startR, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth],
        [startR + totalHeight, startC + totalWidth - topHeight],
        [startR + stemStart + stemWidth, startC + totalWidth - topHeight],
        [startR + stemStart + stemWidth, startC],
        [startR + stemStart, startC],
        [startR + stemStart, startC + totalWidth - topHeight],
      ];
  }

  for (let i = 0; i < vertices.length; i++) {
    const [r1, c1] = vertices[i];
    const [r2, c2] = vertices[(i + 1) % vertices.length];

    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC; c < maxC; c++) {
        hEdges[idxHEdge(r1, c, w)] = 1;
      }
    } else {
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR; r < maxR; r++) {
        vEdges[idxVEdge(r, c1, w)] = 1;
      }
    }
  }

  return { w, h, clues: makeClues(w, h, hEdges, vEdges), solution: { hEdges, vEdges } };
}

// Generate a cross/plus-shaped loop
function makeCrossPuzzle(w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  const minSize = 2;
  const armWidth = minSize;
  const totalSize = Math.min(w - 1, h - 1, armWidth * 2 + minSize + Math.floor(Math.random() * 2));
  const armStart = Math.floor((totalSize - armWidth) / 2);

  const startR = Math.floor(Math.random() * Math.max(1, h - totalSize));
  const startC = Math.floor(Math.random() * Math.max(1, w - totalSize));

  // Cross shape vertices (12 vertices)
  const vertices = [
    [startR, startC + armStart],
    [startR, startC + armStart + armWidth],
    [startR + armStart, startC + armStart + armWidth],
    [startR + armStart, startC + totalSize],
    [startR + armStart + armWidth, startC + totalSize],
    [startR + armStart + armWidth, startC + armStart + armWidth],
    [startR + totalSize, startC + armStart + armWidth],
    [startR + totalSize, startC + armStart],
    [startR + armStart + armWidth, startC + armStart],
    [startR + armStart + armWidth, startC],
    [startR + armStart, startC],
    [startR + armStart, startC + armStart],
  ];

  for (let i = 0; i < vertices.length; i++) {
    const [r1, c1] = vertices[i];
    const [r2, c2] = vertices[(i + 1) % vertices.length];

    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC; c < maxC; c++) {
        hEdges[idxHEdge(r1, c, w)] = 1;
      }
    } else {
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR; r < maxR; r++) {
        vEdges[idxVEdge(r, c1, w)] = 1;
      }
    }
  }

  return { w, h, clues: makeClues(w, h, hEdges, vEdges), solution: { hEdges, vEdges } };
}

// Master puzzle generator that randomly picks a shape
function makeRandomPuzzle(w, h) {
  const generators = [
    makeRectanglePuzzle,
    makeLShapePuzzle,
    makeUShapePuzzle,
    makeTShapePuzzle,
  ];
  // Add more complex shapes for larger grids
  if (w >= 7 && h >= 7) {
    generators.push(makeCrossPuzzle);
    generators.push(makeZigzagPuzzle);
  }

  const gen = generators[Math.floor(Math.random() * generators.length)];
  return gen(w, h);
}

function analyze(w, h, clues, hEdges, vEdges) {
  const clueBad = new Set();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const clue = clues[r * w + c];
      if (clue == null) continue;
      const topE = hEdges[idxHEdge(r, c, w)] === 1;
      const botE = hEdges[idxHEdge(r + 1, c, w)] === 1;
      const leftE = vEdges[idxVEdge(r, c, w)] === 1;
      const rightE = vEdges[idxVEdge(r, c + 1, w)] === 1;
      const count = (topE ? 1 : 0) + (botE ? 1 : 0) + (leftE ? 1 : 0) + (rightE ? 1 : 0);
      if (count !== clue) clueBad.add(r * w + c);
    }
  }

  // Build vertex degrees
  const deg = new Array((h + 1) * (w + 1)).fill(0);
  const adj = Array.from({ length: (h + 1) * (w + 1) }, () => []);
  let edgeCount = 0;

  const vtx = (r, c) => r * (w + 1) + c;

  // horizontal edges
  for (let r = 0; r <= h; r++) {
    for (let c = 0; c < w; c++) {
      if (hEdges[idxHEdge(r, c, w)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r, c + 1);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }
  // vertical edges
  for (let r = 0; r < h; r++) {
    for (let c = 0; c <= w; c++) {
      if (vEdges[idxVEdge(r, c, w)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r + 1, c);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }

  const active = [];
  for (let i = 0; i < deg.length; i++) if (deg[i] > 0) active.push(i);

  let loopOk = false;
  if (active.length > 0) {
    // must all have degree 2
    const degreesOk = active.every((i) => deg[i] === 2);
    if (degreesOk) {
      // connectivity
      const seen = new Set();
      const stack = [active[0]];
      seen.add(active[0]);
      while (stack.length) {
        const u = stack.pop();
        for (const v of adj[u]) {
          if (!seen.has(v)) { seen.add(v); stack.push(v); }
        }
      }
      const connected = active.every((i) => seen.has(i));
      // A single cycle implies edges == vertices in the connected subgraph
      if (connected && edgeCount === active.length) loopOk = true;
    }
  }

  const solved = clueBad.size === 0 && loopOk;
  return { clueBad, loopOk, solved };
}

export default function Loopy() {
  const [w, setW] = useState(8);
  const [h, setH] = useState(8);

  const [puz, setPuz] = useState(() => makeRandomPuzzle(8, 8));
  const [hEdges, setHEdges] = useState(() => new Array((8 + 1) * 8).fill(0));
  const [vEdges, setVEdges] = useState(() => new Array(8 * (8 + 1)).fill(0));

  const rebuild = useCallback((nw = w, nh = h) => {
    const np = makeRandomPuzzle(nw, nh);
    setPuz(np);
    setHEdges(new Array((nh + 1) * nw).fill(0));
    setVEdges(new Array(nh * (nw + 1)).fill(0));
  }, [w, h]);

  const { clueBad, loopOk, solved } = useMemo(
    () => analyze(puz.w, puz.h, puz.clues, hEdges, vEdges),
    [puz, hEdges, vEdges],
  );

  const cell = 44;
  const pad = 26;
  const svgW = pad * 2 + puz.w * cell;
  const svgH = pad * 2 + puz.h * cell;

  const toggleEdge = (kind, r, c, dir) => {
    // dir: 'on' for left click, 'off' for right click
    if (kind === 'h') {
      const i = idxHEdge(r, c, puz.w);
      setHEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (dir === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    } else {
      const i = idxVEdge(r, c, puz.w);
      setVEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (dir === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    }
  };

  const strokeFor = (v) => {
    if (v === 1) return { stroke: 'rgba(0,0,0,0.95)', strokeWidth: 6, opacity: 1 };
    if (v === -1) return { stroke: 'rgba(255,255,255,0.22)', strokeWidth: 4, opacity: 1, strokeDasharray: '6 6' };
    return { stroke: 'rgba(245, 158, 11, 0.60)', strokeWidth: 4, opacity: 1 };
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Loopy"
        instructions="Draw a single loop using some of the grid edges. Left-click an edge to include it; right-click to exclude it. The numbers in cells (here we show all of them) must match how many loop edges surround that cell."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Width
            <select
              className={styles.select}
              value={w}
              onChange={(e) => {
                const v = Number(e.target.value);
                setW(v);
                rebuild(v, h);
              }}
            >
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Height
            <select
              className={styles.select}
              value={h}
              onChange={(e) => {
                const v = Number(e.target.value);
                setH(v);
                rebuild(w, v);
              }}
            >
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => rebuild(w, h)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              // reveal the generated rectangle solution for quick sanity/testing
              setHEdges(puz.solution.hEdges.slice());
              setVEdges(puz.solution.vEdges.slice());
            }}
          >
            Reveal
          </button>
          <button
            className={styles.button}
            onClick={() => {
              setHEdges(new Array((puz.h + 1) * puz.w).fill(0));
              setVEdges(new Array(puz.h * (puz.w + 1)).fill(0));
            }}
          >
            Clear
          </button>
        </div>

        <div className={styles.status}>
          {solved ? (
            <span className={styles.win}>Solved!</span>
          ) : (
            <span className={loopOk ? '' : styles.bad}>
              {loopOk ? 'Loop OK' : 'Not a single loop yet'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Clues */}
          {Array.from({ length: puz.h * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const clue = puz.clues[i];
            const x = pad + c * cell + cell / 2;
            const y = pad + r * cell + cell / 2 + 6;
            const bad = clueBad.has(i);
            return (
              <text
                key={`clue-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill={bad ? 'rgba(251,113,133,0.95)' : 'rgba(255,255,255,0.82)'}
              >
                {clue}
              </text>
            );
          })}

          {/* Edges (clickable) */}
          {/* Horizontal */}
          {Array.from({ length: (puz.h + 1) * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1 + cell;
            const y2 = y1;
            const st = strokeFor(hEdges[i]);
            return (
              <g key={`h-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('h', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('h', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}
          {/* Vertical */}
          {Array.from({ length: puz.h * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1;
            const y2 = y1 + cell;
            const st = strokeFor(vEdges[i]);
            return (
              <g key={`v-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('v', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('v', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Dots */}
          {Array.from({ length: (puz.h + 1) * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x = pad + c * cell;
            const y = pad + r * cell;
            return <circle key={`dot-${i}`} cx={x} cy={y} r="2.3" fill="rgba(255,255,255,0.55)" />;
          })}
        </svg>
      </div>

      <div className={styles.hint}>
        Tip: right-clicking an edge marks it as “definitely not part of the loop”.
      </div>
    </div>
  );
}
