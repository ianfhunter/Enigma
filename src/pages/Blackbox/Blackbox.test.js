import { describe, it, expect } from 'vitest';

// ===========================================
// Blackbox - Direction Utilities Tests
// ===========================================
describe('Blackbox - Direction Utilities', () => {
  const DIRS = [
    { name: 'N', dr: -1, dc: 0 },
    { name: 'E', dr: 0, dc: 1 },
    { name: 'S', dr: 1, dc: 0 },
    { name: 'W', dr: 0, dc: -1 },
  ];

  function leftOf(dir) {
    if (dir.name === 'N') return DIRS[3]; // W
    if (dir.name === 'E') return DIRS[0]; // N
    if (dir.name === 'S') return DIRS[1]; // E
    return DIRS[2]; // W -> S
  }

  function rightOf(dir) {
    if (dir.name === 'N') return DIRS[1]; // E
    if (dir.name === 'E') return DIRS[2]; // S
    if (dir.name === 'S') return DIRS[3]; // W
    return DIRS[0]; // W -> N
  }

  it('should return correct left direction', () => {
    expect(leftOf(DIRS[0]).name).toBe('W'); // Left of N is W
    expect(leftOf(DIRS[1]).name).toBe('N'); // Left of E is N
    expect(leftOf(DIRS[2]).name).toBe('E'); // Left of S is E
    expect(leftOf(DIRS[3]).name).toBe('S'); // Left of W is S
  });

  it('should return correct right direction', () => {
    expect(rightOf(DIRS[0]).name).toBe('E'); // Right of N is E
    expect(rightOf(DIRS[1]).name).toBe('S'); // Right of E is S
    expect(rightOf(DIRS[2]).name).toBe('W'); // Right of S is W
    expect(rightOf(DIRS[3]).name).toBe('N'); // Right of W is N
  });

  it('should have inverse relationship between left and right', () => {
    for (const dir of DIRS) {
      const left = leftOf(dir);
      const rightOfLeft = rightOf(left);
      expect(rightOfLeft.name).toBe(dir.name);
    }
  });
});

// ===========================================
// Blackbox - Bounds Checking Tests
// ===========================================
describe('Blackbox - Bounds Checking', () => {
  function inBounds(r, c, h, w) {
    return r >= 0 && r < h && c >= 0 && c < w;
  }

  it('should return true for valid positions', () => {
    expect(inBounds(0, 0, 8, 8)).toBe(true);
    expect(inBounds(7, 7, 8, 8)).toBe(true);
    expect(inBounds(4, 4, 8, 8)).toBe(true);
  });

  it('should return false for out of bounds positions', () => {
    expect(inBounds(-1, 0, 8, 8)).toBe(false);
    expect(inBounds(0, -1, 8, 8)).toBe(false);
    expect(inBounds(8, 0, 8, 8)).toBe(false);
    expect(inBounds(0, 8, 8, 8)).toBe(false);
  });

  it('should work with non-square grids', () => {
    expect(inBounds(5, 3, 6, 4)).toBe(true);
    expect(inBounds(5, 4, 6, 4)).toBe(false); // col out of bounds
    expect(inBounds(6, 3, 6, 4)).toBe(false); // row out of bounds
  });
});

// ===========================================
// Blackbox - Port Utilities Tests
// ===========================================
describe('Blackbox - Port Utilities', () => {
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

  it('should generate correct number of ports', () => {
    const ports = allPorts(8, 8);
    // 8 top + 8 bottom + 8 left + 8 right = 32
    expect(ports.length).toBe(32);
  });

  it('should include all sides', () => {
    const ports = allPorts(4, 4);
    const topPorts = ports.filter(p => p.startsWith('T:'));
    const bottomPorts = ports.filter(p => p.startsWith('B:'));
    const leftPorts = ports.filter(p => p.startsWith('L:'));
    const rightPorts = ports.filter(p => p.startsWith('R:'));

    expect(topPorts.length).toBe(4);
    expect(bottomPorts.length).toBe(4);
    expect(leftPorts.length).toBe(4);
    expect(rightPorts.length).toBe(4);
  });

  it('should handle non-square grids', () => {
    const ports = allPorts(6, 4);
    // 6 top + 6 bottom + 4 left + 4 right = 20
    expect(ports.length).toBe(20);
  });
});

// ===========================================
// Blackbox - Laser Simulation Tests
// ===========================================
describe('Blackbox - Laser Simulation', () => {
  const DIRS = [
    { name: 'N', dr: -1, dc: 0 },
    { name: 'E', dr: 0, dc: 1 },
    { name: 'S', dr: 1, dc: 0 },
    { name: 'W', dr: 0, dc: -1 },
  ];

  function keyRC(r, c) {
    return `${r},${c}`;
  }

  function inBounds(r, c, h, w) {
    return r >= 0 && r < h && c >= 0 && c < w;
  }

  function leftOf(dir) {
    if (dir.name === 'N') return DIRS[3];
    if (dir.name === 'E') return DIRS[0];
    if (dir.name === 'S') return DIRS[1];
    return DIRS[2];
  }

  function rightOf(dir) {
    if (dir.name === 'N') return DIRS[1];
    if (dir.name === 'E') return DIRS[2];
    if (dir.name === 'S') return DIRS[3];
    return DIRS[0];
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
    if (r === -1) return `T:${c}`;
    if (r === h) return `B:${c}`;
    if (c === -1) return `L:${r}`;
    if (c === w) return `R:${r}`;
    return null;
  }

  function simulateShot(entryPort, ballsSet, w, h) {
    const { r: sr, c: sc, dir: sdir } = portToStart(entryPort, w, h);

    // Pre-entry reflection check
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

    let r = sr;
    let c = sc;
    let dir = sdir;
    const stepLimit = 100;

    for (let steps = 0; steps < stepLimit; steps++) {
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

      // Check deflection
      const L2 = leftOf(dir);
      const R2 = rightOf(dir);
      const fl2r = r + dir.dr + L2.dr;
      const fl2c = c + dir.dc + L2.dc;
      const fr2r = r + dir.dr + R2.dr;
      const fr2c = c + dir.dc + R2.dc;
      const fl2 = inBounds(fl2r, fl2c, h, w) && ballsSet.has(keyRC(fl2r, fl2c));
      const fr2 = inBounds(fr2r, fr2c, h, w) && ballsSet.has(keyRC(fr2r, fr2c));

      if (fl2 && fr2) {
        // Both sides - 180 turn
        dir = DIRS[(DIRS.findIndex(d => d.name === dir.name) + 2) % 4];
        continue;
      }
      if (fl2) {
        dir = rightOf(dir);
        continue;
      }
      if (fr2) {
        dir = leftOf(dir);
        continue;
      }

      r = nr;
      c = nc;
    }

    return { kind: 'R', entry: entryPort, exit: entryPort };
  }

  it('should pass through empty grid', () => {
    const balls = new Set();
    const result = simulateShot('T:2', balls, 5, 5);

    expect(result.kind).toBe('X');
    expect(result.entry).toBe('T:2');
    expect(result.exit).toBe('B:2');
  });

  it('should detect direct hit', () => {
    const balls = new Set(['2,2']);
    const result = simulateShot('T:2', balls, 5, 5);

    expect(result.kind).toBe('H');
  });

  it('should detect pre-entry reflection', () => {
    const balls = new Set(['0,1']); // Ball at corner
    const result = simulateShot('T:0', balls, 5, 5);

    expect(result.kind).toBe('R');
    expect(result.exit).toBe('T:0');
  });

  it('should deflect around ball', () => {
    const balls = new Set(['2,3']); // Ball to the right of path
    const result = simulateShot('T:2', balls, 5, 5);

    // Laser should deflect left when passing
    expect(result.kind).toBe('X');
    expect(result.exit).not.toBe('B:2'); // Should exit somewhere else
  });
});

// ===========================================
// Blackbox - Scoring Tests
// ===========================================
describe('Blackbox - Scoring', () => {
  const SHOT_COST = 1;
  const WRONG_GUESS_PENALTY = 5;

  it('should calculate shot cost correctly', () => {
    const shotCount = 10;
    const score = shotCount * SHOT_COST;
    expect(score).toBe(10);
  });

  it('should calculate wrong guess penalty', () => {
    const wrongGuesses = 2;
    const missedBalls = 1;
    const penalty = (wrongGuesses + missedBalls) * WRONG_GUESS_PENALTY;
    expect(penalty).toBe(15);
  });

  it('should have zero penalty for correct solution', () => {
    const wrongGuesses = 0;
    const missedBalls = 0;
    const penalty = (wrongGuesses + missedBalls) * WRONG_GUESS_PENALTY;
    expect(penalty).toBe(0);
  });
});
