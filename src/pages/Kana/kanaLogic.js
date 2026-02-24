export const KANA_SYMBOLS = ['あ', 'え', 'う', 'い', 'お'];

const DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

function normalizePath(path) {
  return path.map(([r, c]) => `${r},${c}`);
}

export function buildBaseLoop(size) {
  const max = size - 1;
  const p1 = 1;
  const p2 = size - 2;
  const cA = Math.floor(size * 0.65);
  const cB = Math.floor(size * 0.35);
  const rA = Math.floor(size * 0.55);

  const vertices = [
    [p1, p1],
    [p1, p2],
    [2, p2],
    [2, cA],
    [p2, cA],
    [p2, p2],
    [max - 1, p2],
    [max - 1, p1],
    [rA, p1],
    [rA, cB],
    [2, cB],
    [2, p1],
    [p1, p1],
  ];

  const cells = [];
  for (let i = 1; i < vertices.length; i++) {
    const [sr, sc] = vertices[i - 1];
    const [er, ec] = vertices[i];
    const dr = Math.sign(er - sr);
    const dc = Math.sign(ec - sc);
    const len = Math.abs(er - sr) + Math.abs(ec - sc);

    for (let k = 0; k < len; k++) {
      const r = sr + dr * k;
      const c = sc + dc * k;
      if (cells.length === 0 || cells[cells.length - 1][0] !== r || cells[cells.length - 1][1] !== c) {
        cells.push([r, c]);
      }
    }
  }

  return cells;
}

export function transformLoop(path, size, variant) {
  return path.map(([r, c]) => {
    if (variant === 1) return [r, size - 1 - c];
    if (variant === 2) return [size - 1 - r, c];
    if (variant === 3) return [size - 1 - r, size - 1 - c];
    return [r, c];
  });
}

export function getNeighborsInSet(cell, set, size) {
  const [r, c] = cell;
  const result = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (set.has(`${nr},${nc}`)) result.push([nr, nc]);
  }
  return result;
}

function signatureForIndex(path, idx) {
  const n = path.length;
  const prev = path[(idx - 1 + n) % n];
  const cur = path[idx];
  const next = path[(idx + 1) % n];
  const d = [cur[0] - prev[0], cur[1] - prev[1]];
  const dNext = [next[0] - cur[0], next[1] - cur[1]];

  // Symbol cells must be straight-through cells (not turns).
  if (d[0] !== dNext[0] || d[1] !== dNext[1]) return null;

  const orientation = d[0] === 0 ? 'h' : 'v';

  let backward = 0;
  let i = idx;
  while (true) {
    const a = path[(i - 1 + n) % n];
    const b = path[i];
    const vec = [b[0] - a[0], b[1] - a[1]];
    if (vec[0] !== d[0] || vec[1] !== d[1]) break;
    backward++;
    i = (i - 1 + n) % n;
  }

  let forward = 0;
  i = idx;
  while (true) {
    const a = path[i];
    const b = path[(i + 1) % n];
    const vec = [b[0] - a[0], b[1] - a[1]];
    if (vec[0] !== d[0] || vec[1] !== d[1]) break;
    forward++;
    i = (i + 1) % n;
  }

  const [a, b] = backward < forward ? [backward, forward] : [forward, backward];
  return `${orientation}:${a}:${b}`;
}

export function buildSymbolMap(path) {
  const bySignature = new Map();
  for (let i = 0; i < path.length; i++) {
    const sig = signatureForIndex(path, i);
    if (!sig) continue;
    if (!bySignature.has(sig)) bySignature.set(sig, []);
    bySignature.get(sig).push(path[i]);
  }
  return bySignature;
}

export function generateKanaPuzzle(size, random) {
  const variant = Math.floor(random() * 4);
  const solutionPath = transformLoop(buildBaseLoop(size), size, variant);
  const signatureMap = buildSymbolMap(solutionPath);

  const signatures = [...signatureMap.entries()]
    .filter(([, cells]) => cells.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, KANA_SYMBOLS.length);

  const clues = [];
  signatures.forEach(([signature, cells], idx) => {
    const picks = Math.min(3, cells.length);
    for (let i = 0; i < picks; i++) {
      const [r, c] = cells[(i * 2) % cells.length];
      clues.push({ r, c, symbol: KANA_SYMBOLS[idx], signature });
    }
  });

  return {
    size,
    solutionPath,
    solutionSet: new Set(normalizePath(solutionPath)),
    clues,
    symbolRules: Object.fromEntries(signatures.map(([sig], idx) => [KANA_SYMBOLS[idx], sig])),
  };
}

export function analyzePlayerLoop(size, selectedSet) {
  const cells = [...selectedSet].map((key) => key.split(',').map(Number));
  if (cells.length === 0) return { isSingleLoop: false, allDegreeTwo: false, signatures: new Map() };

  let allDegreeTwo = true;
  const adjacency = new Map();
  for (const cell of cells) {
    const key = `${cell[0]},${cell[1]}`;
    const neighbors = getNeighborsInSet(cell, selectedSet, size);
    adjacency.set(key, neighbors.map(([r, c]) => `${r},${c}`));
    if (neighbors.length !== 2) allDegreeTwo = false;
  }

  let isSingleLoop = false;
  if (allDegreeTwo) {
    const start = `${cells[0][0]},${cells[0][1]}`;
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop();
      for (const n of adjacency.get(cur) || []) {
        if (!seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    isSingleLoop = seen.size === cells.length;
  }

  const ordered = cells;
  const signatures = buildSymbolMap(ordered);

  return { isSingleLoop, allDegreeTwo, signatures };
}

export function checkKanaConstraints(puzzle, selectedSet) {
  const allCluesIncluded = puzzle.clues.every(({ r, c }) => selectedSet.has(`${r},${c}`));
  if (!allCluesIncluded) return false;
  if (selectedSet.size !== puzzle.solutionSet.size) return false;
  for (const key of selectedSet) {
    if (!puzzle.solutionSet.has(key)) return false;
  }
  return true;
}
