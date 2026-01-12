import { describe, it, expect } from 'vitest';

// ===========================================
// Tower of Hanoi - Initial State Tests
// ===========================================
describe('Tower of Hanoi - Initial State', () => {
  const createInitialState = (numDisks) => {
    return {
      pegs: [
        Array.from({ length: numDisks }, (_, i) => numDisks - i), // [n, n-1, ..., 2, 1]
        [],
        [],
      ],
      moves: 0,
      numDisks,
    };
  };

  it('should create 3 pegs', () => {
    const state = createInitialState(3);
    expect(state.pegs.length).toBe(3);
  });

  it('should stack all disks on first peg', () => {
    const state = createInitialState(3);
    expect(state.pegs[0]).toEqual([3, 2, 1]);
    expect(state.pegs[1]).toEqual([]);
    expect(state.pegs[2]).toEqual([]);
  });

  it('should order disks from largest (bottom) to smallest (top)', () => {
    const state = createInitialState(5);
    const firstPeg = state.pegs[0];

    for (let i = 1; i < firstPeg.length; i++) {
      expect(firstPeg[i]).toBeLessThan(firstPeg[i - 1]);
    }
  });

  it('should start with 0 moves', () => {
    const state = createInitialState(3);
    expect(state.moves).toBe(0);
  });
});

// ===========================================
// Tower of Hanoi - Move Validation Tests
// ===========================================
describe('Tower of Hanoi - Move Validation', () => {
  const isValidMove = (state, fromPeg, toPeg) => {
    // Can't move from same peg
    if (fromPeg === toPeg) return false;

    // Can't move from empty peg
    if (state.pegs[fromPeg].length === 0) return false;

    // Can't place larger disk on smaller
    const diskToMove = state.pegs[fromPeg][state.pegs[fromPeg].length - 1];
    const topOfTarget = state.pegs[toPeg][state.pegs[toPeg].length - 1];

    if (topOfTarget !== undefined && diskToMove > topOfTarget) {
      return false;
    }

    return true;
  };

  const state = {
    pegs: [[3], [2], [1]],
    moves: 2,
    numDisks: 3,
  };

  it('should allow moving to empty peg', () => {
    const testState = { pegs: [[3, 2, 1], [], []], moves: 0, numDisks: 3 };
    expect(isValidMove(testState, 0, 1)).toBe(true);
    expect(isValidMove(testState, 0, 2)).toBe(true);
  });

  it('should allow moving smaller disk onto larger', () => {
    expect(isValidMove(state, 2, 1)).toBe(true); // Move 1 onto 2
    expect(isValidMove(state, 2, 0)).toBe(true); // Move 1 onto 3
    expect(isValidMove(state, 1, 0)).toBe(true); // Move 2 onto 3
  });

  it('should reject moving larger disk onto smaller', () => {
    expect(isValidMove(state, 0, 1)).toBe(false); // Move 3 onto 2
    expect(isValidMove(state, 0, 2)).toBe(false); // Move 3 onto 1
    expect(isValidMove(state, 1, 2)).toBe(false); // Move 2 onto 1
  });

  it('should reject moving from empty peg', () => {
    const testState = { pegs: [[3, 2, 1], [], []], moves: 0, numDisks: 3 };
    expect(isValidMove(testState, 1, 0)).toBe(false);
    expect(isValidMove(testState, 2, 0)).toBe(false);
  });

  it('should reject moving to same peg', () => {
    expect(isValidMove(state, 0, 0)).toBe(false);
  });
});

// ===========================================
// Tower of Hanoi - Move Execution Tests
// ===========================================
describe('Tower of Hanoi - Move Execution', () => {
  const makeMove = (state, fromPeg, toPeg) => {
    const newPegs = state.pegs.map(peg => [...peg]);
    const disk = newPegs[fromPeg].pop();
    newPegs[toPeg].push(disk);

    return {
      ...state,
      pegs: newPegs,
      moves: state.moves + 1,
    };
  };

  it('should move disk from source to target', () => {
    const state = { pegs: [[3, 2, 1], [], []], moves: 0, numDisks: 3 };
    const newState = makeMove(state, 0, 1);

    expect(newState.pegs[0]).toEqual([3, 2]);
    expect(newState.pegs[1]).toEqual([1]);
    expect(newState.pegs[2]).toEqual([]);
  });

  it('should increment move counter', () => {
    const state = { pegs: [[3, 2, 1], [], []], moves: 0, numDisks: 3 };
    const newState = makeMove(state, 0, 1);

    expect(newState.moves).toBe(1);
  });

  it('should not modify original state', () => {
    const state = { pegs: [[3, 2, 1], [], []], moves: 0, numDisks: 3 };
    const originalPegs = JSON.stringify(state.pegs);

    makeMove(state, 0, 1);

    expect(JSON.stringify(state.pegs)).toBe(originalPegs);
  });
});

// ===========================================
// Tower of Hanoi - Win Detection Tests
// ===========================================
describe('Tower of Hanoi - Win Detection', () => {
  const isWin = (state) => {
    // Win if all disks are on peg 2 (third peg)
    return state.pegs[2].length === state.numDisks;
  };

  it('should detect win when all disks on last peg', () => {
    const winState = { pegs: [[], [], [3, 2, 1]], moves: 7, numDisks: 3 };
    expect(isWin(winState)).toBe(true);
  });

  it('should not detect win when disks spread', () => {
    const state = { pegs: [[3], [2], [1]], moves: 2, numDisks: 3 };
    expect(isWin(state)).toBe(false);
  });

  it('should not detect win with disks on middle peg', () => {
    const state = { pegs: [[], [3, 2, 1], []], moves: 5, numDisks: 3 };
    expect(isWin(state)).toBe(false);
  });
});

// ===========================================
// Tower of Hanoi - Optimal Moves Tests
// ===========================================
describe('Tower of Hanoi - Optimal Moves', () => {
  const calculateOptimalMoves = (numDisks) => {
    // Optimal solution requires 2^n - 1 moves
    return Math.pow(2, numDisks) - 1;
  };

  it('should calculate optimal moves for 3 disks', () => {
    expect(calculateOptimalMoves(3)).toBe(7);
  });

  it('should calculate optimal moves for 4 disks', () => {
    expect(calculateOptimalMoves(4)).toBe(15);
  });

  it('should calculate optimal moves for 5 disks', () => {
    expect(calculateOptimalMoves(5)).toBe(31);
  });

  it('should follow 2^n - 1 formula', () => {
    for (let n = 1; n <= 7; n++) {
      expect(calculateOptimalMoves(n)).toBe(Math.pow(2, n) - 1);
    }
  });
});

// ===========================================
// Tower of Hanoi - Undo Tests
// ===========================================
describe('Tower of Hanoi - Undo', () => {
  const undoMove = (state, history) => {
    if (history.length === 0) return { state, history };

    const lastMove = history[history.length - 1];
    const newPegs = state.pegs.map(peg => [...peg]);
    const disk = newPegs[lastMove.toPeg].pop();
    newPegs[lastMove.fromPeg].push(disk);

    return {
      state: {
        ...state,
        pegs: newPegs,
        moves: state.moves - 1,
      },
      history: history.slice(0, -1),
    };
  };

  it('should reverse last move', () => {
    const state = { pegs: [[3, 2], [1], []], moves: 1, numDisks: 3 };
    const history = [{ fromPeg: 0, toPeg: 1 }];

    const result = undoMove(state, history);

    expect(result.state.pegs[0]).toEqual([3, 2, 1]);
    expect(result.state.pegs[1]).toEqual([]);
  });

  it('should decrement move counter', () => {
    const state = { pegs: [[3, 2], [1], []], moves: 1, numDisks: 3 };
    const history = [{ fromPeg: 0, toPeg: 1 }];

    const result = undoMove(state, history);

    expect(result.state.moves).toBe(0);
  });

  it('should do nothing with empty history', () => {
    const state = { pegs: [[3, 2, 1], [], []], moves: 0, numDisks: 3 };
    const result = undoMove(state, []);

    expect(result.state.pegs).toEqual(state.pegs);
    expect(result.history).toEqual([]);
  });
});

// ===========================================
// Tower of Hanoi - Difficulty Tests
// ===========================================
describe('Tower of Hanoi - Difficulty', () => {
  const DIFFICULTY_SETTINGS = {
    easy: { disks: 3, optimalMoves: 7 },
    medium: { disks: 4, optimalMoves: 15 },
    hard: { disks: 5, optimalMoves: 31 },
    expert: { disks: 6, optimalMoves: 63 },
  };

  it('should have more disks for harder difficulties', () => {
    expect(DIFFICULTY_SETTINGS.easy.disks).toBeLessThan(DIFFICULTY_SETTINGS.medium.disks);
    expect(DIFFICULTY_SETTINGS.medium.disks).toBeLessThan(DIFFICULTY_SETTINGS.hard.disks);
    expect(DIFFICULTY_SETTINGS.hard.disks).toBeLessThan(DIFFICULTY_SETTINGS.expert.disks);
  });

  it('should have correct optimal moves', () => {
    Object.values(DIFFICULTY_SETTINGS).forEach(setting => {
      const expected = Math.pow(2, setting.disks) - 1;
      expect(setting.optimalMoves).toBe(expected);
    });
  });
});
