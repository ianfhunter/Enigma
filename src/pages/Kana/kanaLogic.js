export const KANA_SYMBOLS = ['あ', 'え', 'う', 'い', 'お'];

const DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

function cellKey(r, c) {
  return `${r},${c}`;
}

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function areAdjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function shuffled(items, random) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function signatureForIndex(path, idx) {
  const n = path.length;
  const prev = path[(idx - 1 + n) % n];
  const cur = path[idx];
  const next = path[(idx + 1) % n];
  const dIn = [cur[0] - prev[0], cur[1] - prev[1]];
  const dOut = [next[0] - cur[0], next[1] - cur[1]];

  if (dIn[0] !== dOut[0] || dIn[1] !== dOut[1]) return null;

  const orientation = dIn[0] === 0 ? 'horizontal' : 'vertical';

  let backward = 0;
  let i = idx;
  while (true) {
    const a = path[(i - 1 + n) % n];
    const b = path[i];
    const vec = [b[0] - a[0], b[1] - a[1]];
    if (vec[0] !== dIn[0] || vec[1] !== dIn[1]) break;
    backward++;
    i = (i - 1 + n) % n;
  }

  let forward = 0;
  i = idx;
  while (true) {
    const a = path[i];
    const b = path[(i + 1) % n];
    const vec = [b[0] - a[0], b[1] - a[1]];
    if (vec[0] !== dIn[0] || vec[1] !== dIn[1]) break;
    forward++;
    i = (i + 1) % n;
  }

  const [d1, d2] = backward < forward ? [backward, forward] : [forward, backward];
  return `${orientation}:${d1}:${d2}`;
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

export function pathToEdgeSet(path) {
  const edges = new Set();
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    edges.add(edgeKey(cellKey(a[0], a[1]), cellKey(b[0], b[1])));
  }
  return edges;
}

function findRandomSimpleCycle(size, random, minLength = 12) {
  const starts = [];
  for (let r = 1; r < size - 1; r++) {
    for (let c = 1; c < size - 1; c++) starts.push([r, c]);
  }

  const maxDfsSteps = size * size * 150;

  for (const start of shuffled(starts, random)) {
    const path = [start];
    const visited = new Set([cellKey(start[0], start[1])]);
    let steps = 0;

    const dfs = (cur) => {
      steps++;
      if (steps > maxDfsSteps) return null;

      const neighbors = shuffled(DIRS.map(([dr, dc]) => [cur[0] + dr, cur[1] + dc]), random)
        .filter(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size);

      for (const next of neighbors) {
        const nKey = cellKey(next[0], next[1]);

        if (nKey === cellKey(start[0], start[1])) {
          if (path.length >= minLength && areAdjacent(cur, start)) {
            return path.slice();
          }
          continue;
        }

        if (visited.has(nKey)) continue;

        const freeNeighbors = DIRS
          .map(([dr, dc]) => [next[0] + dr, next[1] + dc])
          .filter(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size)
          .filter(([nr, nc]) => {
            const key = cellKey(nr, nc);
            return key === cellKey(start[0], start[1]) || !visited.has(key);
          }).length;
        if (freeNeighbors < 2 && path.length < minLength - 1) continue;

        visited.add(nKey);
        path.push(next);
        const result = dfs(next);
        if (result) return result;
        path.pop();
        visited.delete(nKey);
      }

      return null;
    };

    const result = dfs(start);
    if (result) return result;
  }

  return null;
}

export function generateKanaPuzzle(size, random) {
  const minLength = Math.max(12, size * 2 + 2);

  for (let attempt = 0; attempt < 40; attempt++) {
    const solutionPath = findRandomSimpleCycle(size, random, minLength);
    if (!solutionPath) continue;

    const signatureMap = buildSymbolMap(solutionPath);
    const signatures = [...signatureMap.entries()]
      .filter(([, cells]) => cells.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, KANA_SYMBOLS.length);

    if (signatures.length < KANA_SYMBOLS.length) continue;

    const clues = [];
    signatures.forEach(([signature, cells], idx) => {
      const picks = Math.min(3, cells.length);
      for (let i = 0; i < picks; i++) {
        const [r, c] = cells[Math.floor((i * cells.length) / picks)];
        clues.push({ r, c, symbol: KANA_SYMBOLS[idx], signature });
      }
    });

    return {
      size,
      solutionPath,
      solutionEdges: pathToEdgeSet(solutionPath),
      clues,
      symbolRules: Object.fromEntries(signatures.map(([sig], idx) => [KANA_SYMBOLS[idx], sig])),
    };
  }

  throw new Error(`Failed to generate Kana puzzle for size ${size}`);
}

export function checkKanaConstraints(puzzle, playerEdges) {
  if (playerEdges.size !== puzzle.solutionEdges.size) return false;
  for (const edge of playerEdges) {
    if (!puzzle.solutionEdges.has(edge)) return false;
  }
  return true;
}
