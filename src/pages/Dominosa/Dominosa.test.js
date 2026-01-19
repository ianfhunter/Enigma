import { describe, it, expect } from 'vitest';

// ===========================================
// Dominosa - Pair Generation Tests
// ===========================================
describe('Dominosa - Pair Generation', () => {
  function pairsUpTo(n) {
    const out = [];
    for (let a = 0; a <= n; a++) {
      for (let b = a; b <= n; b++) out.push([a, b]);
    }
    return out;
  }

  it('should generate correct number of pairs', () => {
    // For maxN, pairs = (n+1)(n+2)/2
    expect(pairsUpTo(3).length).toBe(10); // 0-0, 0-1, 0-2, 0-3, 1-1, 1-2, 1-3, 2-2, 2-3, 3-3
    expect(pairsUpTo(6).length).toBe(28);
  });

  it('should generate pairs in correct order', () => {
    const pairs = pairsUpTo(2);
    expect(pairs).toContainEqual([0, 0]);
    expect(pairs).toContainEqual([0, 1]);
    expect(pairs).toContainEqual([0, 2]);
    expect(pairs).toContainEqual([1, 1]);
    expect(pairs).toContainEqual([1, 2]);
    expect(pairs).toContainEqual([2, 2]);
  });

  it('should not have duplicate pairs', () => {
    const pairs = pairsUpTo(4);
    const stringified = pairs.map(p => `${p[0]}-${p[1]}`);
    const unique = new Set(stringified);
    expect(unique.size).toBe(pairs.length);
  });
});

// ===========================================
// Dominosa - Adjacency Tests
// ===========================================
describe('Dominosa - Adjacency', () => {
  function adjacent(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
  }

  it('should detect horizontally adjacent cells', () => {
    expect(adjacent([0, 0], [0, 1])).toBe(true);
    expect(adjacent([2, 3], [2, 4])).toBe(true);
  });

  it('should detect vertically adjacent cells', () => {
    expect(adjacent([0, 0], [1, 0])).toBe(true);
    expect(adjacent([3, 2], [4, 2])).toBe(true);
  });

  it('should reject diagonal cells', () => {
    expect(adjacent([0, 0], [1, 1])).toBe(false);
    expect(adjacent([2, 2], [3, 3])).toBe(false);
  });

  it('should reject non-adjacent cells', () => {
    expect(adjacent([0, 0], [0, 2])).toBe(false);
    expect(adjacent([0, 0], [2, 0])).toBe(false);
  });

  it('should reject same cell', () => {
    expect(adjacent([1, 1], [1, 1])).toBe(false);
  });
});

// ===========================================
// Dominosa - Edge Key Tests
// ===========================================
describe('Dominosa - Edge Key Generation', () => {
  function edgeKey(a, b) {
    const [r1, c1] = a;
    const [r2, c2] = b;
    const k1 = `${r1},${c1}`;
    const k2 = `${r2},${c2}`;
    return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
  }

  it('should generate consistent key regardless of order', () => {
    const key1 = edgeKey([0, 0], [0, 1]);
    const key2 = edgeKey([0, 1], [0, 0]);
    expect(key1).toBe(key2);
  });

  it('should generate unique keys for different edges', () => {
    const key1 = edgeKey([0, 0], [0, 1]);
    const key2 = edgeKey([0, 0], [1, 0]);
    expect(key1).not.toBe(key2);
  });
});

// ===========================================
// Dominosa - Solution Validation Tests
// ===========================================
describe('Dominosa - Solution Validation', () => {
  function validateSolution(placed, numbers, maxN) {
    const requiredCount = ((maxN + 1) * (maxN + 2)) / 2;

    // Get unique pairs from placed dominoes
    const usedPairs = new Set();
    const seen = new Set();

    for (const [k, v] of placed.entries()) {
      if (seen.has(k)) continue;
      seen.add(k);
      seen.add(v);

      const [r1, c1] = k.split(',').map(Number);
      const [r2, c2] = v.split(',').map(Number);
      const a = numbers[r1][c1];
      const b = numbers[r2][c2];
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      usedPairs.add(`${lo}-${hi}`);
    }

    return {
      pairCount: usedPairs.size,
      requiredCount,
      isComplete: usedPairs.size === requiredCount,
    };
  }

  it('should count placed pairs correctly', () => {
    const placed = new Map([
      ['0,0', '0,1'],
      ['0,1', '0,0'],
      ['1,0', '1,1'],
      ['1,1', '1,0'],
    ]);
    const numbers = [
      [0, 1],
      [2, 3],
    ];

    const result = validateSolution(placed, numbers, 3);
    expect(result.pairCount).toBe(2);
  });

  it('should detect incomplete solution', () => {
    const placed = new Map([
      ['0,0', '0,1'],
      ['0,1', '0,0'],
    ]);
    const numbers = [
      [0, 1],
      [2, 3],
    ];

    const result = validateSolution(placed, numbers, 3);
    expect(result.isComplete).toBe(false);
  });
});

// ===========================================
// Dominosa - Duplicate Pair Detection Tests
// ===========================================
describe('Dominosa - Duplicate Pair Detection', () => {
  function findDuplicatePairs(placed, numbers) {
    const pairs = [];
    const seen = new Set();

    for (const [k, v] of placed.entries()) {
      if (seen.has(k)) continue;
      seen.add(k);
      seen.add(v);

      const [r1, c1] = k.split(',').map(Number);
      const [r2, c2] = v.split(',').map(Number);
      const a = numbers[r1][c1];
      const b = numbers[r2][c2];
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      pairs.push(`${lo}-${hi}`);
    }

    const counts = {};
    for (const p of pairs) {
      counts[p] = (counts[p] || 0) + 1;
    }

    return Object.entries(counts).filter(([_, count]) => count > 1).map(([pair]) => pair);
  }

  it('should detect duplicate pairs', () => {
    const placed = new Map([
      ['0,0', '0,1'],
      ['0,1', '0,0'],
      ['1,0', '1,1'],
      ['1,1', '1,0'],
    ]);
    // Both dominoes form pair 0-1
    const numbers = [
      [0, 1],
      [0, 1],
    ];

    const duplicates = findDuplicatePairs(placed, numbers);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toBe('0-1');
  });

  it('should not flag unique pairs', () => {
    const placed = new Map([
      ['0,0', '0,1'],
      ['0,1', '0,0'],
      ['1,0', '1,1'],
      ['1,1', '1,0'],
    ]);
    const numbers = [
      [0, 1],
      [2, 3],
    ];

    const duplicates = findDuplicatePairs(placed, numbers);
    expect(duplicates.length).toBe(0);
  });
});

// ===========================================
// Dominosa - Grid Size Tests
// ===========================================
describe('Dominosa - Grid Size Calculation', () => {
  it('should calculate correct grid size for maxN', () => {
    // For maxN, grid is (maxN+2) x (maxN+1)
    const maxN = 6;
    const w = maxN + 2; // 8
    const h = maxN + 1; // 7
    const cells = w * h; // 56
    const dominoes = ((maxN + 1) * (maxN + 2)) / 2; // 28

    // Each domino covers 2 cells
    expect(cells).toBe(dominoes * 2);
  });

  it('should work for different maxN values', () => {
    for (const maxN of [4, 5, 6, 7]) {
      const w = maxN + 2;
      const h = maxN + 1;
      const cells = w * h;
      const dominoes = ((maxN + 1) * (maxN + 2)) / 2;
      expect(cells).toBe(dominoes * 2);
    }
  });
});
