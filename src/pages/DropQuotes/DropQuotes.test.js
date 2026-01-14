import { describe, it, expect } from 'vitest';
import { QUOTES, generatePuzzle } from './DropQuotes.jsx';

describe('DropQuotes - generatePuzzle', () => {
  it('returns grid dimensions and columns matching each other', () => {
    const puzzle = generatePuzzle();
    expect(puzzle.width).toBeGreaterThan(0);
    expect(puzzle.height).toBeGreaterThan(0);
    expect(puzzle.solution.length).toBe(puzzle.height);
    puzzle.solution.forEach(row => expect(row.length).toBe(puzzle.width));
    expect(puzzle.columns.length).toBe(puzzle.width);
  });

  it('columns contain only non-space characters from the solution', () => {
    const puzzle = generatePuzzle();
    const solutionCharsByCol = puzzle.columns.map(() => []);

    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        const ch = puzzle.solution[r][c];
        if (ch !== ' ') solutionCharsByCol[c].push(ch);
      }
    }

    puzzle.columns.forEach((col, idx) => {
      const expected = solutionCharsByCol[idx].sort().join('');
      const got = col.slice().sort().join('');
      expect(got).toBe(expected);
    });
  });

  it('author and quote come from the QUOTES list', () => {
    const puzzle = generatePuzzle();
    const match = QUOTES.find(q => q.quote === puzzle.quote && q.author === puzzle.author);
    expect(match).toBeDefined();
  });
});
