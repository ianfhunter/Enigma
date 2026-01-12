import { useMemo, useState, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Palisade.module.css';

// Palisade: Divide the grid into connected regions of fixed size K.
// Each numbered cell tells how many of its 4 edges are region boundaries
// (including outer border).

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
const DIRS = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

// Calculate boundary count for a cell given a full assignment
function getBoundaryCount(r, c, assign, h, w) {
  const i = rcToIdx(r, c, w);
  const id = assign[i];
  let b = 0;
  for (const d of DIRS) {
    const rr = r + d.dr, cc = c + d.dc;
    if (!inBounds(rr, cc, h, w)) { b++; continue; }
    const nid = assign[rcToIdx(rr, cc, w)];
    if (nid !== id) b++;
  }
  return b;
}

// Generate a random partition of the grid into connected regions of size k
function generateRandomPartition(h, w, k) {
  const n = h * w;
  const numRegions = n / k;
  if (!Number.isInteger(numRegions)) return null;

  const assign = new Array(n).fill(-1);
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    assign.fill(-1);
    let success = true;

    for (let regionId = 0; regionId < numRegions && success; regionId++) {
      // Find available cells to start a new region
      const unassigned = [];
      for (let i = 0; i < n; i++) {
        if (assign[i] === -1) unassigned.push(i);
      }
      if (unassigned.length < k) { success = false; break; }

      // Start from a random unassigned cell
      const startIdx = unassigned[Math.floor(Math.random() * unassigned.length)];
      const regionCells = [startIdx];
      assign[startIdx] = regionId;

      // Grow the region to size k using random BFS
      while (regionCells.length < k) {
        // Find all cells that can be added (adjacent to current region, unassigned)
        const candidates = [];
        for (const cellIdx of regionCells) {
          const { r, c } = idxToRC(cellIdx, w);
          for (const d of DIRS) {
            const rr = r + d.dr, cc = c + d.dc;
            if (!inBounds(rr, cc, h, w)) continue;
            const ni = rcToIdx(rr, cc, w);
            if (assign[ni] === -1 && !candidates.includes(ni)) {
              // Check if adding this cell would strand remaining cells
              if (canAddCell(ni, assign, regionId, h, w, k, numRegions - regionId - 1)) {
                candidates.push(ni);
              }
            }
          }
        }

        if (candidates.length === 0) {
          success = false;
          break;
        }

        // Pick a random candidate
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        assign[pick] = regionId;
        regionCells.push(pick);
      }
    }

    if (success && assign.every(x => x >= 0)) {
      return { assign, numRegions };
    }
  }

  return null;
}

// Check if adding a cell maintains reachability for remaining regions
function canAddCell(cellIdx, assign, regionId, h, w, k, remainingRegions) {
  // Temporarily assign the cell
  const tempAssign = assign.slice();
  tempAssign[cellIdx] = regionId;

  // Count remaining unassigned cells
  const unassigned = tempAssign.filter(x => x === -1).length;
  if (unassigned < remainingRegions * k) return false;

  // Check connectivity of remaining unassigned cells
  const unassignedIdxs = [];
  for (let i = 0; i < tempAssign.length; i++) {
    if (tempAssign[i] === -1) unassignedIdxs.push(i);
  }

  if (unassignedIdxs.length === 0) return true;

  // BFS to check if all unassigned cells are connected
  const visited = new Set([unassignedIdxs[0]]);
  const queue = [unassignedIdxs[0]];

  while (queue.length > 0) {
    const curr = queue.shift();
    const { r, c } = idxToRC(curr, w);
    for (const d of DIRS) {
      const rr = r + d.dr, cc = c + d.dc;
      if (!inBounds(rr, cc, h, w)) continue;
      const ni = rcToIdx(rr, cc, w);
      if (tempAssign[ni] === -1 && !visited.has(ni)) {
        visited.add(ni);
        queue.push(ni);
      }
    }
  }

  return visited.size === unassignedIdxs.length;
}

// Generate clue numbers from a solution
function generateClues(solution, h, w) {
  const nums = new Array(h * w).fill(null);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      nums[rcToIdx(r, c, w)] = getBoundaryCount(r, c, solution, h, w);
    }
  }
  return nums;
}

// Solver: count solutions up to limit using a robust backtracking approach
function solvePuzzle(h, w, k, numRegions, clues, maxSolutions = 2) {
  const n = h * w;
  const solutions = [];
  let callCount = 0;
  const maxCalls = 500000; // Prevent infinite loops

  function solve(assign, regionSizes, regionCells) {
    if (solutions.length >= maxSolutions) return;
    if (++callCount > maxCalls) return;

    // Find first unassigned cell (prefer cells with constraints)
    let unassignedIdx = -1;
    let minOptions = Infinity;

    for (let i = 0; i < n; i++) {
      if (assign[i] !== -1) continue;

      // Count valid options for this cell
      const { r, c } = idxToRC(i, w);
      let options = 0;

      // Check adjacent regions
      const adjacentRegions = new Set();
      for (const d of DIRS) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, h, w)) continue;
        const ni = rcToIdx(rr, cc, w);
        if (assign[ni] >= 0 && regionSizes[assign[ni]] < k) {
          adjacentRegions.add(assign[ni]);
        }
      }
      options = adjacentRegions.size;

      // Can start new region if no adjacent incomplete regions
      const usedRegions = regionSizes.filter(s => s > 0).length;
      if (usedRegions < numRegions && adjacentRegions.size === 0) {
        options = 1;
      } else if (usedRegions < numRegions) {
        options++;
      }

      if (options < minOptions) {
        minOptions = options;
        unassignedIdx = i;
      }
      if (minOptions === 0) break; // Early exit - no valid options
    }

    if (unassignedIdx === -1) {
      // All cells assigned - verify solution
      if (isValidSolution(assign, h, w, k, numRegions, clues)) {
        solutions.push(assign.slice());
      }
      return;
    }

    if (minOptions === 0) return; // Dead end

    const { r, c } = idxToRC(unassignedIdx, w);

    // Collect valid region options
    const adjacentRegions = new Set();
    for (const d of DIRS) {
      const rr = r + d.dr, cc = c + d.dc;
      if (!inBounds(rr, cc, h, w)) continue;
      const ni = rcToIdx(rr, cc, w);
      if (assign[ni] >= 0 && regionSizes[assign[ni]] < k) {
        adjacentRegions.add(assign[ni]);
      }
    }

    const usedRegions = regionSizes.filter(s => s > 0).length;
    const canStartNew = usedRegions < numRegions;

    const options = [...adjacentRegions];
    // Only allow starting new region if not adjacent to any incomplete region
    // OR allow it as an option (this is key for correct solving)
    if (canStartNew) {
      options.push(usedRegions); // Start new region
    }

    for (const regionId of options) {
      // Skip if trying to start new region but adjacent to incomplete regions
      // (cell must extend an existing region if possible)
      if (regionId === usedRegions && adjacentRegions.size > 0) {
        // Actually, we should allow starting new regions even with adjacent incomplete ones
        // because different partitions may be valid. But we should try extending first.
        continue; // Try extending existing regions first
      }

      const newAssign = assign.slice();
      const newSizes = regionSizes.slice();
      const newRegionCells = regionCells.map(cells => [...cells]);

      newAssign[unassignedIdx] = regionId;
      newSizes[regionId] = (newSizes[regionId] || 0) + 1;
      if (!newRegionCells[regionId]) newRegionCells[regionId] = [];
      newRegionCells[regionId].push(unassignedIdx);

      // Pruning checks
      if (!checkLocalClues(unassignedIdx, newAssign, h, w, clues)) continue;
      if (!checkRegionConnectivity(regionId, newRegionCells[regionId], w, h)) continue;
      if (!checkCanGrowRegion(regionId, newAssign, newSizes, newRegionCells, h, w, k)) continue;
      if (!canCompletePartition(newAssign, newSizes, h, w, k, numRegions)) continue;

      solve(newAssign, newSizes, newRegionCells);
    }

    // Now try starting new regions (if we skipped above)
    if (canStartNew && adjacentRegions.size > 0) {
      const regionId = usedRegions;
      const newAssign = assign.slice();
      const newSizes = regionSizes.slice();
      const newRegionCells = regionCells.map(cells => [...cells]);

      newAssign[unassignedIdx] = regionId;
      newSizes[regionId] = 1;
      newRegionCells[regionId] = [unassignedIdx];

      if (!checkLocalClues(unassignedIdx, newAssign, h, w, clues)) return;
      if (!canCompletePartition(newAssign, newSizes, h, w, k, numRegions)) return;

      solve(newAssign, newSizes, newRegionCells);
    }
  }

  const initialAssign = new Array(n).fill(-1);
  const initialSizes = new Array(numRegions).fill(0);
  const initialRegionCells = Array.from({ length: numRegions }, () => []);
  solve(initialAssign, initialSizes, initialRegionCells);

  return solutions;
}

function checkLocalClues(cellIdx, assign, h, w, clues) {
  const { r, c } = idxToRC(cellIdx, w);

  // Check this cell and its neighbors
  const toCheck = [{ r, c }];
  for (const d of DIRS) {
    const rr = r + d.dr, cc = c + d.dc;
    if (inBounds(rr, cc, h, w)) toCheck.push({ r: rr, c: cc });
  }

  for (const { r: cr, c: cc } of toCheck) {
    const ci = rcToIdx(cr, cc, w);
    if (clues[ci] === null) continue;
    if (assign[ci] === -1) continue;

    // Count definite boundaries and undetermined neighbors
    let definite = 0;
    let undetermined = 0;
    const id = assign[ci];

    for (const d of DIRS) {
      const rr = cr + d.dr, ccc = cc + d.dc;
      if (!inBounds(rr, ccc, h, w)) {
        definite++;
        continue;
      }
      const ni = rcToIdx(rr, ccc, w);
      if (assign[ni] === -1) {
        undetermined++;
      } else if (assign[ni] !== id) {
        definite++;
      }
    }

    // If definite already exceeds clue, prune
    if (definite > clues[ci]) return false;
    // If even with all undetermined becoming boundaries, we can't reach clue, prune
    if (definite + undetermined < clues[ci]) return false;
  }

  return true;
}

function checkRegionConnectivity(regionId, cells, w, h) {
  if (cells.length <= 1) return true;

  const cellSet = new Set(cells);
  const visited = new Set([cells[0]]);
  const queue = [cells[0]];

  while (queue.length > 0) {
    const curr = queue.shift();
    const { r, c } = idxToRC(curr, w);
    for (const d of DIRS) {
      const rr = r + d.dr, cc = c + d.dc;
      if (!inBounds(rr, cc, h, w)) continue;
      const ni = rcToIdx(rr, cc, w);
      if (cellSet.has(ni) && !visited.has(ni)) {
        visited.add(ni);
        queue.push(ni);
      }
    }
  }

  return visited.size === cells.length;
}

function checkCanGrowRegion(regionId, assign, sizes, regionCells, h, w, k) {
  // Check if this region can still grow to size k
  const currentSize = sizes[regionId];
  if (currentSize >= k) return true;

  const needed = k - currentSize;
  const cells = regionCells[regionId];

  // Count reachable unassigned cells adjacent to this region
  const reachable = new Set();
  for (const cellIdx of cells) {
    const { r, c } = idxToRC(cellIdx, w);
    for (const d of DIRS) {
      const rr = r + d.dr, cc = c + d.dc;
      if (!inBounds(rr, cc, h, w)) continue;
      const ni = rcToIdx(rr, cc, w);
      if (assign[ni] === -1) reachable.add(ni);
    }
  }

  return reachable.size >= needed;
}

function canCompletePartition(assign, sizes, h, w, k, numRegions) {
  // Check if remaining cells can form valid regions
  let needed = 0;
  for (let id = 0; id < numRegions; id++) {
    if (sizes[id] > 0 && sizes[id] < k) {
      needed += k - sizes[id];
    }
  }
  const unassignedCount = assign.filter(x => x === -1).length;
  const unusedRegions = numRegions - sizes.filter(s => s > 0).length;

  // Must have exactly enough cells for all regions
  if (unassignedCount < needed + unusedRegions * k) return false;

  // Check connectivity of unassigned cells (must be able to form connected regions)
  if (unassignedCount === 0) return true;

  const unassignedIdxs = [];
  for (let i = 0; i < assign.length; i++) {
    if (assign[i] === -1) unassignedIdxs.push(i);
  }

  // Check if unassigned cells form connected components that can support remaining regions
  const visited = new Set();
  let componentCount = 0;

  for (const start of unassignedIdxs) {
    if (visited.has(start)) continue;
    componentCount++;

    const queue = [start];
    visited.add(start);
    let componentSize = 0;

    while (queue.length > 0) {
      const curr = queue.shift();
      componentSize++;
      const { r, c } = idxToRC(curr, w);
      for (const d of DIRS) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, h, w)) continue;
        const ni = rcToIdx(rr, cc, w);
        if (assign[ni] === -1 && !visited.has(ni)) {
          visited.add(ni);
          queue.push(ni);
        }
      }
    }

    // Each component must be able to form at least one region of size k
    // (or be absorbed by adjacent incomplete regions)
    if (componentSize < k && componentSize > 0) {
      // Check if this component is adjacent to an incomplete region
      let adjacentToIncomplete = false;
      for (const idx of unassignedIdxs) {
        if (!visited.has(idx)) continue;
        const { r, c } = idxToRC(idx, w);
        for (const d of DIRS) {
          const rr = r + d.dr, cc = c + d.dc;
          if (!inBounds(rr, cc, h, w)) continue;
          const ni = rcToIdx(rr, cc, w);
          if (assign[ni] >= 0 && sizes[assign[ni]] < k) {
            adjacentToIncomplete = true;
            break;
          }
        }
        if (adjacentToIncomplete) break;
      }
      if (!adjacentToIncomplete) return false;
    }
  }

  return true;
}

function isValidSolution(assign, h, w, k, numRegions, clues) {
  const n = h * w;

  // Check region sizes
  const sizes = new Array(numRegions).fill(0);
  for (const id of assign) {
    if (id < 0 || id >= numRegions) return false;
    sizes[id]++;
  }
  if (!sizes.every(s => s === k)) return false;

  // Check connectivity for each region
  for (let id = 0; id < numRegions; id++) {
    const cells = [];
    for (let i = 0; i < n; i++) {
      if (assign[i] === id) cells.push(i);
    }
    const visited = new Set([cells[0]]);
    const queue = [cells[0]];
    while (queue.length > 0) {
      const curr = queue.shift();
      const { r, c } = idxToRC(curr, w);
      for (const d of DIRS) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, h, w)) continue;
        const ni = rcToIdx(rr, cc, w);
        if (assign[ni] === id && !visited.has(ni)) {
          visited.add(ni);
          queue.push(ni);
        }
      }
    }
    if (visited.size !== k) return false;
  }

  // Check clues
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = rcToIdx(r, c, w);
      if (clues[i] !== null) {
        const b = getBoundaryCount(r, c, assign, h, w);
        if (b !== clues[i]) return false;
      }
    }
  }

  return true;
}

// Generate a puzzle with unique solution
function generatePuzzle(h, w, k) {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const partition = generateRandomPartition(h, w, k);
    if (!partition) continue;

    const { assign: solution, numRegions } = partition;
    const allClues = generateClues(solution, h, w);

    // Start with all clues, then try to remove while maintaining uniqueness
    const clues = allClues.slice();
    const indices = Array.from({ length: h * w }, (_, i) => i);

    // Shuffle indices for random removal order
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Try to remove each clue
    for (const idx of indices) {
      const savedClue = clues[idx];
      clues[idx] = null;

      // Check if still uniquely solvable
      const solutions = solvePuzzle(h, w, k, numRegions, clues, 2);
      if (solutions.length !== 1) {
        // Restore clue
        clues[idx] = savedClue;
      }
    }

    // Verify final puzzle has unique solution
    const finalSolutions = solvePuzzle(h, w, k, numRegions, clues, 2);
    if (finalSolutions.length === 1) {
      return { w, h, k, regions: numRegions, nums: clues, solution };
    }
  }

  // Fallback to a simple preset
  return generateSimplePreset(h, w, k);
}

function generateSimplePreset(h, w, k) {
  // Generate horizontal stripes as fallback
  const numRegions = (h * w) / k;
  const solution = new Array(h * w).fill(-1);

  let regionId = 0;
  let count = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      solution[rcToIdx(r, c, w)] = regionId;
      count++;
      if (count === k) {
        count = 0;
        regionId++;
      }
    }
  }

  const nums = generateClues(solution, h, w);
  return { w, h, k, regions: numRegions, nums, solution };
}

function analyze(puz, assign) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // boundary counts
  for (let r = 0; r < puz.h; r++) {
    for (let c = 0; c < puz.w; c++) {
      const i = rcToIdx(r, c, puz.w);
      const id = assign[i];
      if (id < 0) continue; // unassigned cells are not bad, just incomplete
      const b = getBoundaryCount(r, c, assign, puz.h, puz.w);
      if (puz.nums[i] != null && b !== puz.nums[i]) bad.add(i);
    }
  }

  // region sizes + connectivity
  const cellsBy = Array.from({ length: puz.regions }, () => []);
  for (let i = 0; i < n; i++) {
    const id = assign[i];
    if (id >= 0 && id < puz.regions) cellsBy[id].push(i);
  }
  for (let id = 0; id < puz.regions; id++) {
    const cells = cellsBy[id];
    if (cells.length > puz.k) {
      // Too many cells in region
      for (const i of cells) bad.add(i);
      continue;
    }
    if (cells.length === 0) continue;

    // Check connectivity
    const set = new Set(cells);
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    while (stack.length) {
      const u = stack.pop();
      const { r, c } = idxToRC(u, puz.w);
      for (const d of DIRS) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, puz.h, puz.w)) continue;
        const v = rcToIdx(rr, cc, puz.w);
        if (!set.has(v) || seen.has(v)) continue;
        seen.add(v); stack.push(v);
      }
    }
    if (seen.size !== cells.length) for (const i of cells) bad.add(i);
  }

  // Check if solved (all assigned, all regions correct size, no bad cells)
  const allAssigned = assign.every(x => x >= 0);
  const correctSizes = cellsBy.every(cells => cells.length === puz.k);
  const solved = allAssigned && correctSizes && bad.size === 0;

  return { bad, solved };
}

const SIZES = [
  { label: '5×5', h: 5, w: 5, k: 5 },
  { label: '6×6', h: 6, w: 6, k: 4 },
  { label: '6×6', h: 6, w: 6, k: 6 },
  { label: '8×6', h: 6, w: 8, k: 4 },
  { label: '8×8', h: 8, w: 8, k: 4 },
];

export default function Palisade() {
  const [sizeIdx, setSizeIdx] = useState(0);
  const [puz, setPuz] = useState(() => generatePuzzle(SIZES[0].h, SIZES[0].w, SIZES[0].k));
  const [sel, setSel] = useState(0);
  const [assign, setAssign] = useState(() => new Array(puz.w * puz.h).fill(-1));
  const [generating, setGenerating] = useState(false);

  const { bad, solved } = useMemo(() => analyze(puz, assign), [puz, assign]);

  const handleNewPuzzle = useCallback(() => {
    setGenerating(true);
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const size = SIZES[sizeIdx];
      const newPuz = generatePuzzle(size.h, size.w, size.k);
      setPuz(newPuz);
      setAssign(new Array(newPuz.w * newPuz.h).fill(-1));
      setSel(0);
      setGenerating(false);
    }, 10);
  }, [sizeIdx]);

  const handleSizeChange = useCallback((newIdx) => {
    setSizeIdx(newIdx);
    setGenerating(true);
    setTimeout(() => {
      const size = SIZES[newIdx];
      const newPuz = generatePuzzle(size.h, size.w, size.k);
      setPuz(newPuz);
      setAssign(new Array(newPuz.w * newPuz.h).fill(-1));
      setSel(0);
      setGenerating(false);
    }, 10);
  }, []);

  const paint = (i) => {
    setAssign((prev) => {
      const n = prev.slice();
      n[i] = n[i] === sel ? -1 : sel;
      return n;
    });
  };

  const clueCount = puz.nums.filter(n => n !== null).length;
  const totalCells = puz.w * puz.h;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Palisade"
        instructions={`Divide the grid into ${puz.regions} connected regions of size ${puz.k}. Each number tells how many of the four edges of that cell are region boundaries (including the outer border). Select a region color and click cells to assign them.`}
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <select
            className={styles.select}
            value={sizeIdx}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            disabled={generating}
          >
            {SIZES.map((s, i) => (
              <option key={i} value={i}>
                {s.label} (k={s.k})
              </option>
            ))}
          </select>
          <button
            className={`${styles.button} ${styles.newButton}`}
            onClick={handleNewPuzzle}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'New Puzzle'}
          </button>
        </div>
        <div className={styles.group}>
          <button className={styles.button} onClick={() => setAssign(new Array(puz.w * puz.h).fill(-1))}>Clear</button>
          <button className={styles.button} onClick={() => setAssign(puz.solution.slice())}>Reveal</button>
        </div>
        <div className={styles.group}>
          <div className={styles.palette}>
            {Array.from({ length: puz.regions }, (_, i) => (
              <div
                key={i}
                className={`${styles.swatch} ${sel === i ? styles.active : ''}`}
                style={{ background: COLORS[i % COLORS.length] }}
                onClick={() => setSel(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
                title={`Region ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className={styles.status}>
          {generating ? (
            <span className={styles.generating}>Generating...</span>
          ) : solved ? (
            <span className={styles.win}>Solved!</span>
          ) : bad.size ? (
            <span className={styles.bad}>Invalid</span>
          ) : (
            <span>{clueCount}/{totalCells} clues</span>
          )}
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 44px)`, opacity: generating ? 0.5 : 1 }}>
        {Array.from({ length: puz.w * puz.h }, (_, i) => {
          const id = assign[i];
          const bg = id >= 0 ? COLORS[id % COLORS.length] : 'rgba(255,255,255,0.06)';
          return (
            <div
              key={i}
              className={`${styles.cell} ${bad.has(i) ? styles.badCell : ''}`}
              style={{ background: bg }}
              onClick={() => !generating && paint(i)}
              title={puz.nums[i] !== null ? `Clue: ${puz.nums[i]}` : 'No clue'}
            >
              {puz.nums[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
