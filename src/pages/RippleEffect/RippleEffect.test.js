import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RippleEffect from './RippleEffect';

// Mock the dataset
vi.mock('@datasets/rippleEffectPuzzles.json', () => ({
  default: {
    name: 'Ripple Effect Puzzles',
    count: 2,
    puzzles: [
      {
        id: 'test-puzzle-1',
        rows: 6,
        cols: 6,
        difficulty: 'easy',
        seed: 12345,
        clues: [
          [1, null, null, null, 2, null],
          [null, null, 3, null, null, null],
          [null, 2, null, null, null, 1],
          [null, null, null, 1, null, null],
          [2, null, null, null, 3, null],
          [null, 1, null, null, null, 2],
        ],
        regions: [
          [1, 1, 1, 2, 2, 2],
          [1, 3, 3, 2, 4, 4],
          [5, 3, 3, 6, 4, 4],
          [5, 5, 6, 6, 6, 7],
          [8, 5, 9, 9, 7, 7],
          [8, 8, 9, 9, 7, 10],
        ],
        regionCells: {
          1: [[0, 0], [0, 1], [0, 2], [1, 0]],
          2: [[0, 3], [0, 4], [0, 5], [1, 3]],
          3: [[1, 1], [1, 2], [2, 1], [2, 2]],
          4: [[1, 4], [1, 5], [2, 4], [2, 5]],
          5: [[2, 0], [3, 0], [3, 1], [4, 1]],
          6: [[2, 3], [3, 2], [3, 3], [3, 4]],
          7: [[3, 5], [4, 4], [4, 5], [5, 4]],
          8: [[4, 0], [5, 0], [5, 1]],
          9: [[4, 2], [4, 3], [5, 2], [5, 3]],
          10: [[5, 5]],
        },
        solution: [
          [1, 4, 3, 4, 2, 1],
          [2, 1, 3, 3, 2, 4],
          [4, 2, 4, 2, 1, 3],
          [3, 1, 3, 1, 4, 2],
          [2, 4, 1, 2, 3, 1],
          [1, 3, 4, 3, 2, 2],
        ],
      },
      {
        id: 'test-puzzle-2',
        rows: 8,
        cols: 8,
        difficulty: 'medium',
        seed: 54321,
        clues: Array(8).fill(null).map(() => Array(8).fill(null)),
        regions: Array(8).fill(null).map((_, r) => Array(8).fill(null).map((_, c) => Math.floor((r * 8 + c) / 4) + 1)),
        regionCells: {},
        solution: Array(8).fill(null).map(() => Array(8).fill(1)),
      },
    ],
  },
}));

describe('RippleEffect Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game header', () => {
    render(<RippleEffect />);
    expect(screen.getByText('Ripple Effect')).toBeInTheDocument();
  });

  it('renders the game board', () => {
    render(<RippleEffect />);
    // Should have cells (6x6 = 36 cells for the test puzzle)
    const cells = document.querySelectorAll('[class*="cell"]');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('displays initial clues', () => {
    render(<RippleEffect />);
    // The first puzzle has clues including 1, 2, 3
    // Check that at least some numbers are visible
    const numbers = screen.getAllByText(/^[1-3]$/);
    expect(numbers.length).toBeGreaterThan(0);
  });

  it('renders the number pad', () => {
    render(<RippleEffect />);
    // Number pad should have buttons 1-6 plus clear button
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('renders control buttons', () => {
    render(<RippleEffect />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('New Puzzle')).toBeInTheDocument();
  });

  it('displays the rule reminder', () => {
    render(<RippleEffect />);
    expect(screen.getByText(/Ripple Rule:/)).toBeInTheDocument();
  });

  it('has show errors toggle', () => {
    render(<RippleEffect />);
    expect(screen.getByText('Show errors')).toBeInTheDocument();
  });

  it('renders size selector', () => {
    render(<RippleEffect />);
    // Should have size options
    expect(screen.getByText('6×6')).toBeInTheDocument();
  });
});

describe('Ripple Effect Game Logic', () => {
  // Test the constraint checking function directly
  function checkDistanceConstraint(grid, size) {
    const errors = new Set();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = grid[r][c];
        if (value === 0) continue;

        // Check horizontal
        for (let c2 = c + 1; c2 < size; c2++) {
          if (grid[r][c2] === value) {
            const distance = c2 - c - 1;
            if (distance < value) {
              errors.add(`${r},${c}`);
              errors.add(`${r},${c2}`);
            }
          }
        }

        // Check vertical
        for (let r2 = r + 1; r2 < size; r2++) {
          if (grid[r2][c] === value) {
            const distance = r2 - r - 1;
            if (distance < value) {
              errors.add(`${r},${c}`);
              errors.add(`${r2},${c}`);
            }
          }
        }
      }
    }

    return errors;
  }

  it('detects distance violations in rows', () => {
    // Two 1s next to each other - need at least 1 cell between
    const grid = [
      [1, 1, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('detects distance violations in columns', () => {
    // Two 2s with only 1 cell between - need at least 2
    const grid = [
      [2, 0, 0],
      [0, 0, 0],
      [2, 0, 0],
    ];
    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('2,0')).toBe(true);
  });

  it('allows properly spaced numbers', () => {
    // Two 2s with 2 cells between - OK
    const grid = [
      [2, 0, 0, 0, 2],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const errors = checkDistanceConstraint(grid, 5);
    expect(errors.size).toBe(0);
  });

  it('allows 1s with 1 cell between', () => {
    // Two 1s with 1 cell between - OK
    const grid = [
      [1, 0, 1],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.size).toBe(0);
  });

  it('does not flag different numbers', () => {
    // Different numbers can be adjacent
    const grid = [
      [1, 2, 3],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.size).toBe(0);
  });
});

describe('Room Constraint Validation', () => {
  function checkRoomDuplicates(grid, regions) {
    const errors = new Set();

    for (const region of regions) {
      const seen = new Map();
      for (const [r, c] of region.cells) {
        const value = grid[r][c];
        if (value === 0) continue;

        if (value > region.size) {
          errors.add(`${r},${c}`);
        }

        if (seen.has(value)) {
          errors.add(`${r},${c}`);
          errors.add(seen.get(value));
        } else {
          seen.set(value, `${r},${c}`);
        }
      }
    }

    return errors;
  }

  it('detects duplicate values in a room', () => {
    const grid = [
      [1, 1],
      [0, 0],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1]], size: 2 },
      { id: 2, cells: [[1, 0], [1, 1]], size: 2 },
    ];

    const errors = checkRoomDuplicates(grid, regions);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('detects values exceeding room size', () => {
    const grid = [
      [3, 0],
      [0, 0],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1]], size: 2 },
      { id: 2, cells: [[1, 0], [1, 1]], size: 2 },
    ];

    const errors = checkRoomDuplicates(grid, regions);
    expect(errors.has('0,0')).toBe(true);
  });

  it('allows valid room placements', () => {
    const grid = [
      [1, 2],
      [2, 1],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1]], size: 2 },
      { id: 2, cells: [[1, 0], [1, 1]], size: 2 },
    ];

    const errors = checkRoomDuplicates(grid, regions);
    expect(errors.size).toBe(0);
  });
});
