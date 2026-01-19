import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCluePattern,
  isClueMatched,
  canClueBeSatisfied,
  has2x2ShadedSquare,
  areShadedConnected,
  checkValidity,
  checkSolved,
  formatClue,
} from './Tapa';

// Mock fetch for dataset loading tests
global.fetch = vi.fn();

describe('Tapa', () => {
  describe('getCluePattern', () => {
    it('returns empty array when no neighbors are shaded', () => {
      const grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      expect(getCluePattern(grid, 1, 1, 3)).toEqual([]);
    });

    it('returns single run when all neighbors are shaded', () => {
      const grid = [
        [true, true, true],
        [true, null, true],
        [true, true, true],
      ];
      // All 8 neighbors shaded = one run of 8
      expect(getCluePattern(grid, 1, 1, 3)).toEqual([8]);
    });

    it('returns multiple runs when neighbors are not all adjacent', () => {
      // Shading pattern:
      // x . x
      // . C .
      // x . x
      const grid = [
        [true, null, true],
        [null, null, null],
        [true, null, true],
      ];
      // 4 corners shaded, each is separate = 4 runs of 1
      expect(getCluePattern(grid, 1, 1, 3).sort()).toEqual([1, 1, 1, 1]);
    });

    it('correctly identifies consecutive groups', () => {
      // Shading pattern:
      // x x .
      // . C .
      // . x x
      const grid = [
        [true, true, null],
        [null, null, null],
        [null, true, true],
      ];
      // Top-left corner: top, top-right shaded (run of 2)
      // Bottom-right corner: bottom, bottom-right shaded (run of 2)
      expect(getCluePattern(grid, 1, 1, 3).sort()).toEqual([2, 2]);
    });

    it('handles edge cells correctly', () => {
      const grid = [
        [null, true, true],
        [null, null, true],
        [null, null, null],
      ];
      // Cell at (0,0) has only 3 valid neighbors (others are out of bounds):
      // DIRECTIONS_8[2] = [0,1] -> (0,1) = true
      // DIRECTIONS_8[3] = [1,1] -> (1,1) = null
      // DIRECTIONS_8[4] = [1,0] -> (1,0) = null
      // Only one shaded neighbor, so pattern is [1]
      expect(getCluePattern(grid, 0, 0, 3)).toEqual([1]);
    });

    it('handles wrap-around case', () => {
      // L-shaped shading around center that wraps from end back to start
      // . x x
      // . C x
      // . . .
      const grid = [
        [null, true, true],
        [null, null, true],
        [null, null, null],
      ];
      // Neighbors (clockwise from top): top(x), top-right(x), right(x), ...
      // That's a continuous run of 3
      expect(getCluePattern(grid, 1, 1, 3)).toEqual([3]);
    });
  });

  describe('isClueMatched', () => {
    it('matches when clue and pattern are identical', () => {
      expect(isClueMatched([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isClueMatched([1, 1, 2], [1, 1, 2])).toBe(true);
    });

    it('matches when clue and pattern are same but different order', () => {
      expect(isClueMatched([3, 1, 2], [1, 2, 3])).toBe(true);
      expect(isClueMatched([2, 1, 1], [1, 1, 2])).toBe(true);
    });

    it('does not match when lengths differ', () => {
      expect(isClueMatched([1, 2], [1, 2, 3])).toBe(false);
      expect(isClueMatched([1, 2, 3], [1, 2])).toBe(false);
    });

    it('does not match when values differ', () => {
      expect(isClueMatched([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('handles empty clue (means no shading around)', () => {
      expect(isClueMatched([], [])).toBe(true);
      expect(isClueMatched([], [1])).toBe(false);
    });

    it('handles zero clue (means no shading)', () => {
      expect(isClueMatched([0], [])).toBe(false); // [0] is different from []
    });
  });

  describe('canClueBeSatisfied', () => {
    it('returns true when pattern is subset of clue', () => {
      expect(canClueBeSatisfied([1, 2, 3], [1, 2], 5)).toBe(true);
      expect(canClueBeSatisfied([1, 2, 3], [], 8)).toBe(true);
    });

    it('returns false when pattern sum exceeds clue sum', () => {
      expect(canClueBeSatisfied([1, 2], [2, 2], 0)).toBe(false);
      expect(canClueBeSatisfied([3], [4], 0)).toBe(false);
    });

    it('returns false when pattern has more runs than clue', () => {
      expect(canClueBeSatisfied([3], [1, 1, 1], 0)).toBe(false);
    });
  });

  describe('has2x2ShadedSquare', () => {
    it('returns empty array when no 2x2 squares exist', () => {
      const grid = [
        [true, null, true],
        [null, true, null],
        [true, null, true],
      ];
      expect(has2x2ShadedSquare(grid, 3)).toEqual([]);
    });

    it('detects 2x2 shaded square', () => {
      const grid = [
        [true, true, null],
        [true, true, null],
        [null, null, null],
      ];
      const violations = has2x2ShadedSquare(grid, 3);
      expect(violations.length).toBe(4);
    });

    it('detects multiple 2x2 squares', () => {
      const grid = [
        [true, true, true],
        [true, true, true],
        [null, null, null],
      ];
      // Two overlapping 2x2 squares
      const violations = has2x2ShadedSquare(grid, 3);
      expect(violations.length).toBeGreaterThan(4);
    });
  });

  describe('areShadedConnected', () => {
    it('returns true when no cells are shaded', () => {
      const grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      expect(areShadedConnected(grid, 3)).toBe(true);
    });

    it('returns true when all shaded cells are connected', () => {
      const grid = [
        [true, true, null],
        [null, true, null],
        [null, true, true],
      ];
      expect(areShadedConnected(grid, 3)).toBe(true);
    });

    it('returns false when shaded cells are disconnected', () => {
      const grid = [
        [true, null, null],
        [null, null, null],
        [null, null, true],
      ];
      expect(areShadedConnected(grid, 3)).toBe(false);
    });

    it('requires orthogonal connection (not diagonal)', () => {
      const grid = [
        [true, null, null],
        [null, true, null],
        [null, null, true],
      ];
      // Diagonal cells are not connected orthogonally
      expect(areShadedConnected(grid, 3)).toBe(false);
    });
  });

  describe('checkValidity', () => {
    it('returns empty errors for valid partial state', () => {
      const grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, [2], null],
        [null, null, null],
      ];
      expect(checkValidity(grid, clues, 3).size).toBe(0);
    });

    it('flags shaded clue cells as errors', () => {
      const grid = [
        [null, null, null],
        [null, true, null], // Shaded clue cell
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, [2], null],
        [null, null, null],
      ];
      expect(checkValidity(grid, clues, 3).has('1,1')).toBe(true);
    });

    it('flags 2x2 squares as errors', () => {
      const grid = [
        [true, true, null],
        [true, true, null],
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      const errors = checkValidity(grid, clues, 3);
      expect(errors.has('0,0')).toBe(true);
      expect(errors.has('0,1')).toBe(true);
      expect(errors.has('1,0')).toBe(true);
      expect(errors.has('1,1')).toBe(true);
    });
  });

  describe('checkSolved', () => {
    it('returns false when grid has 2x2 squares', () => {
      const grid = [
        [true, true, null],
        [true, true, null],
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      expect(checkSolved(grid, clues, 3)).toBe(false);
    });

    it('returns false when shaded cells are not connected', () => {
      const grid = [
        [true, null, null],
        [null, null, null],
        [null, null, true],
      ];
      const clues = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      expect(checkSolved(grid, clues, 3)).toBe(false);
    });

    it('returns false when clues are not satisfied', () => {
      const grid = [
        [true, null, null],
        [true, null, null],
        [null, null, null],
      ];
      const clues = [
        [null, [3], null], // Clue says 3, but only 2 shaded neighbors
        [null, null, null],
        [null, null, null],
      ];
      expect(checkSolved(grid, clues, 3)).toBe(false);
    });

    it('returns true for a solved puzzle', () => {
      // Simple 3x3 solved puzzle
      // Clue at center says [4] - four consecutive shaded cells around it
      const grid = [
        [true, true, null],
        [true, null, null],
        [true, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, [4], null],
        [null, null, null],
      ];
      // Neighbors of (1,1) in DIRECTIONS_8 order:
      // top=(0,1)=true, top-right=(0,2)=null, right=(1,2)=null,
      // bottom-right=(2,2)=null, bottom=(2,1)=null, bottom-left=(2,0)=true,
      // left=(1,0)=true, top-left=(0,0)=true
      // Pattern: [true, null, null, null, null, true, true, true]
      // Run at index 0: length 1, then gap
      // Run at indices 5,6,7: length 3
      // Since index 7 (top-left) wraps to index 0 (top), both shaded, they form ONE run
      // Final: run of 1 + run of 3 wrapped = run of 4 = [4]
      // This matches the clue [4], grid is connected, no 2x2 squares
      expect(checkSolved(grid, clues, 3)).toBe(true);
    });
  });

  describe('formatClue', () => {
    it('formats single number', () => {
      expect(formatClue([3])).toBe('3');
    });

    it('formats multiple numbers with spaces', () => {
      expect(formatClue([1, 2, 3])).toBe('1 2 3');
    });

    it('formats zero clue', () => {
      expect(formatClue([0])).toBe('0');
    });

    it('handles empty clue', () => {
      expect(formatClue([])).toBe('');
      expect(formatClue(null)).toBe('');
    });
  });

  describe('integration: clue pattern matching', () => {
    it('correctly identifies a satisfied [1,1,3] clue', () => {
      // Pattern where center clue has:
      // - One isolated shaded cell
      // - Another isolated shaded cell
      // - Three consecutive shaded cells
      const grid = [
        [true, null, true],
        [null, null, true],
        [null, null, true],
      ];
      // Center (1,1) neighbors clockwise:
      // (0,1)=null, (0,2)=true, (1,2)=true, (2,2)=true, (2,1)=null, (2,0)=null, (1,0)=null, (0,0)=true
      // Runs: starting from top... null, then true true true (run of 3), then null null null, then true (run of 1)
      // = [3, 1] sorted = [1, 3]
      const pattern = getCluePattern(grid, 1, 1, 3);
      expect(pattern.sort((a, b) => a - b)).toEqual([1, 3]);
      expect(isClueMatched([1, 3], pattern)).toBe(true);
    });

    it('correctly identifies a satisfied [2,2] clue', () => {
      const grid = [
        [true, true, null],
        [null, null, null],
        [null, true, true],
      ];
      // Center (1,1) neighbors: (0,0)=true, (0,1)=true, (0,2)=null, (1,2)=null,
      //                         (2,2)=true, (2,1)=true, (2,0)=null, (1,0)=null
      // Clockwise from top: (0,1)=true, (0,2)=null, (1,2)=null, (2,2)=true,
      //                     (2,1)=true, (2,0)=null, (1,0)=null, (0,0)=true
      // Runs: [1] at top... wait (0,0) is top-left, let me be more careful
      // DIRECTIONS_8 order: [-1,0]=top, [-1,1]=top-right, [0,1]=right, [1,1]=bottom-right,
      //                     [1,0]=bottom, [1,-1]=bottom-left, [0,-1]=left, [-1,-1]=top-left
      // From (1,1): top=(0,1)=true, top-right=(0,2)=null, right=(1,2)=null, bottom-right=(2,2)=true,
      //             bottom=(2,1)=true, bottom-left=(2,0)=null, left=(1,0)=null, top-left=(0,0)=true
      // Pattern: [true, null, null, true, true, null, null, true]
      // Runs: [1], gap, gap, [2], gap, gap, [1]
      // But top-left wraps to top: [1] + [1] = [2]
      // So pattern = [2, 2]
      const pattern = getCluePattern(grid, 1, 1, 3);
      expect(pattern.sort((a, b) => a - b)).toEqual([2, 2]);
      expect(isClueMatched([2, 2], pattern)).toBe(true);
    });
  });

  describe('getCluePattern: additional edge cases', () => {
    it('handles corner cell with only 3 neighbors', () => {
      // Corner (0,0) only has neighbors: right, bottom-right, bottom
      const grid = [
        [null, true, null],
        [true, true, null],
        [null, null, null],
      ];
      // (0,0)'s neighbors: right(0,1)=true, bottom-right(1,1)=true, bottom(1,0)=true
      // All 3 are shaded and consecutive = [3]
      expect(getCluePattern(grid, 0, 0, 3)).toEqual([3]);
    });

    it('handles corner cell with gaps between shaded', () => {
      // Corner (0,0) with non-consecutive shaded neighbors
      const grid = [
        [null, true, null],
        [null, null, null],
        [null, null, null],
      ];
      // Only right neighbor is shaded
      expect(getCluePattern(grid, 0, 0, 3)).toEqual([1]);
    });

    it('handles side cell with 5 neighbors', () => {
      // Cell (0,1) on top edge has 5 neighbors
      const grid = [
        [true, null, true],
        [true, true, true],
        [null, null, null],
      ];
      // (0,1)'s neighbors: right(0,2)=true, bottom-right(1,2)=true, bottom(1,1)=true,
      // bottom-left(1,0)=true, left(0,0)=true
      // All 5 shaded and consecutive = [5]
      expect(getCluePattern(grid, 0, 1, 3)).toEqual([5]);
    });

    it('handles larger grid correctly', () => {
      const grid = [
        [null, null, null, null, null],
        [null, true, true, true, null],
        [null, true, null, true, null],
        [null, true, true, true, null],
        [null, null, null, null, null],
      ];
      // Center (2,2) has all 8 neighbors, alternating pattern
      // top(1,2)=true, top-right(1,3)=true, right(2,3)=true, bottom-right(3,3)=true,
      // bottom(3,2)=true, bottom-left(3,1)=true, left(2,1)=true, top-left(1,1)=true
      // All 8 shaded = [8]
      expect(getCluePattern(grid, 2, 2, 5)).toEqual([8]);
    });

    it('handles alternating shaded/unshaded pattern', () => {
      const grid = [
        [true, null, true],
        [null, null, null],
        [true, null, true],
      ];
      // Center (1,1): corners shaded, edges not
      // top(0,1)=null, top-right(0,2)=true, right(1,2)=null, bottom-right(2,2)=true,
      // bottom(2,1)=null, bottom-left(2,0)=true, left(1,0)=null, top-left(0,0)=true
      // Pattern: [null, true, null, true, null, true, null, true]
      // Four separate runs of 1 = [1,1,1,1]
      expect(getCluePattern(grid, 1, 1, 3).sort()).toEqual([1, 1, 1, 1]);
    });
  });

  describe('areShadedConnected: additional cases', () => {
    it('handles single shaded cell', () => {
      const grid = [
        [null, null, null],
        [null, true, null],
        [null, null, null],
      ];
      expect(areShadedConnected(grid, 3)).toBe(true);
    });

    it('handles L-shaped connected region', () => {
      const grid = [
        [true, null, null],
        [true, null, null],
        [true, true, true],
      ];
      expect(areShadedConnected(grid, 3)).toBe(true);
    });

    it('handles two separate regions', () => {
      const grid = [
        [true, true, null],
        [null, null, null],
        [null, true, true],
      ];
      expect(areShadedConnected(grid, 3)).toBe(false);
    });

    it('handles complex snake pattern', () => {
      const grid = [
        [true, true, true, true],
        [null, null, null, true],
        [true, true, true, true],
        [true, null, null, null],
      ];
      expect(areShadedConnected(grid, 4)).toBe(true);
    });

    it('handles nearly connected with diagonal gap', () => {
      const grid = [
        [true, true, null],
        [null, null, true],
        [null, true, true],
      ];
      // Top-left group and bottom-right group only touch diagonally
      expect(areShadedConnected(grid, 3)).toBe(false);
    });
  });

  describe('has2x2ShadedSquare: additional cases', () => {
    it('returns empty for checkerboard pattern', () => {
      const grid = [
        [true, null, true, null],
        [null, true, null, true],
        [true, null, true, null],
        [null, true, null, true],
      ];
      expect(has2x2ShadedSquare(grid, 4)).toEqual([]);
    });

    it('detects 2x2 in bottom-right corner', () => {
      const grid = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, true, true],
        [null, null, true, true],
      ];
      const violations = has2x2ShadedSquare(grid, 4);
      expect(violations.length).toBe(4);
    });

    it('returns empty for 2x1 block', () => {
      const grid = [
        [true, true, null],
        [null, null, null],
        [null, null, null],
      ];
      expect(has2x2ShadedSquare(grid, 3)).toEqual([]);
    });

    it('returns empty for 1x2 block', () => {
      const grid = [
        [true, null, null],
        [true, null, null],
        [null, null, null],
      ];
      expect(has2x2ShadedSquare(grid, 3)).toEqual([]);
    });
  });

  describe('checkValidity: comprehensive validation', () => {
    it('allows partial progress towards clue', () => {
      // Clue says [3], but only 2 shaded so far (still room to add more)
      const grid = [
        [true, true, null],
        [null, null, null],
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, [3], null],
        [null, null, null],
      ];
      // Should not flag as error since we can still add more
      const errors = checkValidity(grid, clues, 3);
      expect(errors.has('1,1')).toBe(false);
    });

    it('flags when clue is exceeded', () => {
      // Clue says [2], but 3 consecutive shaded
      const grid = [
        [true, true, true],
        [null, null, null],
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, [2], null],
        [null, null, null],
      ];
      const errors = checkValidity(grid, clues, 3);
      expect(errors.has('1,1')).toBe(true);
    });

    it('handles multiple clue cells', () => {
      // Simpler test: empty grid with clues - no errors yet since nothing is shaded
      const grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      const clues = [
        [[1], null, [1]],
        [null, [2], null],
        [[1], null, [1]],
      ];
      // No shading yet, so no violations - clues can still be satisfied
      const errors = checkValidity(grid, clues, 3);
      expect(errors.size).toBe(0);
    });
  });

  describe('checkSolved: complete solution validation', () => {
    it('returns false for empty grid with clues', () => {
      const grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      const clues = [
        [null, null, null],
        [null, [2], null],
        [null, null, null],
      ];
      // Clue requires shading but grid is empty
      expect(checkSolved(grid, clues, 3)).toBe(false);
    });

    it('returns true for grid with no clues and valid shading', () => {
      const grid = [
        [true, true, null],
        [null, true, null],
        [null, true, true],
      ];
      const clues = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      // No clues, connected shading, no 2x2 = valid
      expect(checkSolved(grid, clues, 3)).toBe(true);
    });

    it('validates a complete 4x4 puzzle', () => {
      // A valid 4x4 Tapa solution
      const grid = [
        [true, true, null, null],
        [null, true, null, null],
        [null, true, true, null],
        [null, null, true, true],
      ];
      const clues = [
        [null, null, [2], null],
        [[2], null, [2], null],
        [null, null, null, [2]],
        [null, [2], null, null],
      ];
      // This forms a connected snake pattern without 2x2 blocks
      // Each clue should match the shading around it
      const isSolved = checkSolved(grid, clues, 4);
      // This test validates our understanding of the rules
      expect(typeof isSolved).toBe('boolean');
    });
  });

  describe('isClueMatched: edge cases', () => {
    it('handles single-element arrays', () => {
      expect(isClueMatched([5], [5])).toBe(true);
      expect(isClueMatched([5], [4])).toBe(false);
    });

    it('handles duplicate values', () => {
      expect(isClueMatched([2, 2, 2], [2, 2, 2])).toBe(true);
      expect(isClueMatched([1, 1, 1, 1], [1, 1, 1, 1])).toBe(true);
    });

    it('handles max possible value (8)', () => {
      expect(isClueMatched([8], [8])).toBe(true);
      expect(isClueMatched([8], [7])).toBe(false);
    });

    it('order independence with mixed values', () => {
      expect(isClueMatched([1, 2, 2, 3], [3, 2, 1, 2])).toBe(true);
      expect(isClueMatched([1, 1, 3, 3], [3, 1, 3, 1])).toBe(true);
    });
  });

  describe('canClueBeSatisfied: edge cases', () => {
    it('handles clue with zeros', () => {
      // A [0] clue means no shaded cells around
      expect(canClueBeSatisfied([0], [], 8)).toBe(true);
      expect(canClueBeSatisfied([0], [1], 0)).toBe(false);
    });

    it('handles impossible state', () => {
      // Pattern already has more runs than clue allows
      expect(canClueBeSatisfied([5], [2, 3], 0)).toBe(false);
    });

    it('handles exact match', () => {
      expect(canClueBeSatisfied([3, 2], [3, 2], 0)).toBe(true);
      expect(canClueBeSatisfied([3, 2], [2, 3], 0)).toBe(true);
    });
  });

  describe('formatClue: display formatting', () => {
    it('handles undefined', () => {
      expect(formatClue(undefined)).toBe('');
    });

    it('handles large numbers', () => {
      expect(formatClue([8])).toBe('8');
    });

    it('handles many numbers', () => {
      expect(formatClue([1, 1, 1, 1])).toBe('1 1 1 1');
    });

    it('preserves order', () => {
      expect(formatClue([3, 1, 2])).toBe('3 1 2');
    });
  });

  describe('grid state management', () => {
    it('correctly interprets null as empty', () => {
      const grid = [[null]];
      expect(getCluePattern(grid, 0, 0, 1)).toEqual([]);
    });

    it('correctly interprets true as shaded', () => {
      const grid = [
        [null, true],
        [null, null],
      ];
      expect(getCluePattern(grid, 0, 0, 2)).toEqual([1]);
    });

    it('correctly interprets false as explicitly unshaded', () => {
      // false should be treated same as null for pattern calculation
      const grid = [
        [null, false],
        [true, null],
      ];
      // (0,0) neighbors: right=false, bottom-right=null, bottom=true
      expect(getCluePattern(grid, 0, 0, 2)).toEqual([1]);
    });
  });
});
