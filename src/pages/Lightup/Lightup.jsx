import { useCallback, useMemo, useState, useEffect } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Lightup.module.css';

// Cell types:
// - '.' empty
// - '#' black
// - '0'..'4' numbered black

function idx(r, c, w) {
  return r * w + c;
}

function inBounds(r, c, w, h) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function isWall(ch) {
  return ch === '#' || (ch >= '0' && ch <= '4');
}

// Get cells lit by a bulb at position i
function getLitCells(i, cells, w, h) {
  const lit = new Set([i]);
  const r0 = Math.floor(i / w);
  const c0 = i % w;
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let r = r0 + dr;
    let c = c0 + dc;
    while (inBounds(r, c, w, h)) {
      const j = idx(r, c, w);
      if (isWall(cells[j])) break;
      lit.add(j);
      r += dr;
      c += dc;
    }
  }
  return lit;
}

// Check if two bulb positions see each other
function bulbsSeeEachOther(i1, i2, cells, w, h) {
  const r1 = Math.floor(i1 / w);
  const c1 = i1 % w;
  const r2 = Math.floor(i2 / w);
  const c2 = i2 % w;
  
  if (r1 !== r2 && c1 !== c2) return false;
  
  const dr = r2 === r1 ? 0 : (r2 > r1 ? 1 : -1);
  const dc = c2 === c1 ? 0 : (c2 > c1 ? 1 : -1);
  
  let r = r1 + dr;
  let c = c1 + dc;
  while (r !== r2 || c !== c2) {
    if (isWall(cells[idx(r, c, w)])) return false;
    r += dr;
    c += dc;
  }
  return true;
}

// Solve the puzzle using backtracking
function solveLightup(cells, w, h, findAll = false) {
  const n = w * h;
  const emptyCells = [];
  for (let i = 0; i < n; i++) {
    if (!isWall(cells[i])) emptyCells.push(i);
  }
  
  const solutions = [];
  
  function tryPlace(bulbs, litSet, cellIdx) {
    if (solutions.length > 1 && !findAll) return; // Early exit if not unique
    
    // Check if all empty cells are lit
    const allLit = emptyCells.every(i => litSet.has(i));
    if (allLit) {
      // Validate numbered constraints
      for (let i = 0; i < n; i++) {
        const ch = cells[i];
        if (!(ch >= '0' && ch <= '4')) continue;
        const target = Number(ch);
        const r0 = Math.floor(i / w);
        const c0 = i % w;
        let count = 0;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (!inBounds(r, c, w, h)) continue;
          const j = idx(r, c, w);
          if (bulbs.has(j)) count++;
        }
        if (count !== target) return;
      }
      solutions.push(new Set(bulbs));
      return;
    }
    
    if (cellIdx >= emptyCells.length) return;
    
    const i = emptyCells[cellIdx];
    
    // If already lit, skip (don't need bulb here)
    if (litSet.has(i)) {
      tryPlace(bulbs, litSet, cellIdx + 1);
      return;
    }
    
    // Try placing bulb here
    let canPlace = true;
    for (const b of bulbs) {
      if (bulbsSeeEachOther(i, b, cells, w, h)) {
        canPlace = false;
        break;
      }
    }
    
    // Check numbered constraint limits
    if (canPlace) {
      const r0 = Math.floor(i / w);
      const c0 = i % w;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (!inBounds(r, c, w, h)) continue;
        const j = idx(r, c, w);
        const ch = cells[j];
        if (ch >= '0' && ch <= '4') {
          const target = Number(ch);
          let count = 0;
          for (const [dr2, dc2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const r2 = Math.floor(j / w) + dr2;
            const c2 = (j % w) + dc2;
            if (!inBounds(r2, c2, w, h)) continue;
            const k = idx(r2, c2, w);
            if (bulbs.has(k) || k === i) count++;
          }
          if (count > target) canPlace = false;
        }
      }
    }
    
    if (canPlace) {
      const newBulbs = new Set(bulbs);
      newBulbs.add(i);
      const newLit = new Set(litSet);
      for (const li of getLitCells(i, cells, w, h)) newLit.add(li);
      tryPlace(newBulbs, newLit, cellIdx + 1);
    }
    
    // Also try NOT placing bulb here (another bulb might light this cell)
    tryPlace(bulbs, litSet, cellIdx + 1);
  }
  
  tryPlace(new Set(), new Set(), 0);
  return solutions;
}

// Generate a random puzzle
function generatePuzzle(size, difficulty) {
  const wallDensity = difficulty === 'easy' ? 0.15 : difficulty === 'medium' ? 0.2 : 0.25;
  const numberDensity = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.7;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    const cells = new Array(size * size).fill('.');
    
    // Place random walls
    const numWalls = Math.floor(size * size * wallDensity);
    const positions = [];
    for (let i = 0; i < size * size; i++) positions.push(i);
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    for (let i = 0; i < numWalls && i < positions.length; i++) {
      cells[positions[i]] = '#';
    }
    
    // Try to solve it
    const solutions = solveLightup(cells, size, size, false);
    if (solutions.length === 0) continue;
    
    // We have at least one solution - add numbered constraints based on it
    const solution = solutions[0];
    
    // For each wall, maybe add a number constraint
    for (let i = 0; i < size * size; i++) {
      if (cells[i] !== '#') continue;
      if (Math.random() > numberDensity) continue;
      
      const r0 = Math.floor(i / size);
      const c0 = i % size;
      let count = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (!inBounds(r, c, size, size)) continue;
        const j = idx(r, c, size);
        if (solution.has(j)) count++;
      }
      cells[i] = String(count);
    }
    
    // Verify uniqueness with numbers
    const finalSolutions = solveLightup(cells, size, size, true);
    if (finalSolutions.length === 1) {
      // Convert to grid format
      const grid = [];
      for (let r = 0; r < size; r++) {
        let row = '';
        for (let c = 0; c < size; c++) {
          row += cells[idx(r, c, size)];
        }
        grid.push(row);
      }
      return { grid, solution };
    }
  }
  
  // Fallback
  return {
    grid: [
      '#######',
      '#..1..#',
      '#..#..#',
      '#2###2#',
      '#..#..#',
      '#..1..#',
      '#######',
    ],
    solution: null,
  };
}

const SIZES = [5, 7, 9];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function parseGrid(lines) {
  const h = lines.length;
  const w = lines[0]?.length || 0;
  const cells = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      cells.push(lines[r][c]);
    }
  }
  return { w, h, cells };
}

export default function Lightup() {
  const [size, setSize] = useState(7);
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzle, setPuzzle] = useState(null);
  const [bulbs, setBulbs] = useState(() => new Set());
  const [marks, setMarks] = useState(() => new Set());

  const base = useMemo(() => puzzle ? parseGrid(puzzle.grid) : { w: 0, h: 0, cells: [] }, [puzzle]);

  const generateNew = useCallback(() => {
    const newPuzzle = generatePuzzle(size, difficulty);
    setPuzzle(newPuzzle);
    setBulbs(new Set());
    setMarks(new Set());
  }, [size, difficulty]);

  useEffect(() => {
    generateNew();
  }, []);

  const reset = () => {
    setBulbs(new Set());
    setMarks(new Set());
  };

  const lit = useMemo(() => {
    const out = new Set();
    for (const b of bulbs) {
      out.add(b);
      const r0 = Math.floor(b / base.w);
      const c0 = b % base.w;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let r = r0 + dr;
        let c = c0 + dc;
        while (inBounds(r, c, base.w, base.h)) {
          const i = idx(r, c, base.w);
          const ch = base.cells[i];
          if (isWall(ch)) break;
          out.add(i);
          r += dr;
          c += dc;
        }
      }
    }
    return out;
  }, [base.cells, base.h, base.w, bulbs]);

  const bulbConflicts = useMemo(() => {
    const bad = new Set();
    for (const b of bulbs) {
      const r0 = Math.floor(b / base.w);
      const c0 = b % base.w;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let r = r0 + dr;
        let c = c0 + dc;
        while (inBounds(r, c, base.w, base.h)) {
          const i = idx(r, c, base.w);
          const ch = base.cells[i];
          if (isWall(ch)) break;
          if (bulbs.has(i)) {
            bad.add(b);
            bad.add(i);
          }
          r += dr;
          c += dc;
        }
      }
    }
    return bad;
  }, [base.cells, base.h, base.w, bulbs]);

  const numberedErrors = useMemo(() => {
    const bad = new Set();
    for (let i = 0; i < base.cells.length; i++) {
      const ch = base.cells[i];
      if (!(ch >= '0' && ch <= '4')) continue;
      const target = Number(ch);
      const r0 = Math.floor(i / base.w);
      const c0 = i % base.w;
      let count = 0;
      let possible = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (!inBounds(r, c, base.w, base.h)) continue;
        const j = idx(r, c, base.w);
        if (isWall(base.cells[j])) continue;
        possible++;
        if (bulbs.has(j)) count++;
      }
      if (count > target || count + (possible - count) < target) bad.add(i);
      if (count !== target) bad.add(i);
    }
    return bad;
  }, [base, bulbs]);

  const allLit = useMemo(() => {
    for (let i = 0; i < base.cells.length; i++) {
      if (isWall(base.cells[i])) continue;
      if (!lit.has(i)) return false;
    }
    return true;
  }, [base.cells, lit]);

  const solved = allLit && bulbConflicts.size === 0 && numberedErrors.size === 0;

  const toggleBulb = (i) => {
    if (isWall(base.cells[i])) return;
    if (marks.has(i)) return;
    setBulbs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleMark = (i) => {
    if (isWall(base.cells[i])) return;
    if (bulbs.has(i)) return;
    setMarks((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Light Up"
        instructions="Place bulbs to light all non-black squares. Bulbs must not see each other. Numbered black squares require exactly that many adjacent bulbs."
      />

      <div className={styles.toolbar}>
        <div className={styles.settingGroup}>
          <label>Size:</label>
          {SIZES.map((s) => (
            <button
              key={s}
              className={`${styles.button} ${size === s ? styles.active : ''}`}
              onClick={() => setSize(s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <div className={styles.settingGroup}>
          <label>Difficulty:</label>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.button} ${difficulty === d ? styles.active : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.generateBtn} onClick={generateNew}>New Puzzle</button>
          <button className={styles.button} onClick={reset}>Clear</button>
        </div>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : <span>Conflicts: {bulbConflicts.size} • Unlit: {allLit ? 0 : 'some'}</span>}
        </div>
      </div>

      {puzzle && base.w > 0 && (
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${base.w}, 1fr)` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {base.cells.map((ch, i) => {
            const wall = isWall(ch);
            const isNumber = ch >= '0' && ch <= '4';
            const isLit = lit.has(i);
            const hasBulb = bulbs.has(i);
            const hasMark = marks.has(i);
            const conflict = bulbConflicts.has(i);
            const numBad = numberedErrors.has(i);
            return (
              <button
                key={i}
                className={[
                  styles.cell,
                  wall ? styles.wall : styles.floor,
                  isLit ? styles.lit : '',
                  hasBulb ? styles.bulb : '',
                  conflict ? styles.bad : '',
                  hasMark ? styles.mark : '',
                  numBad ? styles.bad : '',
                ].join(' ')}
                onClick={() => {
                  if (wall) return;
                  toggleBulb(i);
                }}
                onMouseDown={(e) => {
                  if (e.button === 2) toggleMark(i);
                }}
                aria-label={`cell ${i}`}
              >
                {wall && isNumber ? <span className={styles.num}>{ch}</span> : null}
                {!wall && hasBulb ? <span className={styles.icon}>💡</span> : null}
                {!wall && !hasBulb && hasMark ? <span className={styles.icon}>✖</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

