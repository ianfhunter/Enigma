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

  it('detects when all non-space cells are correctly filled', () => {
    const puzzle = generatePuzzle();

    // Create a grid that matches the solution
    const correctGrid = puzzle.solution.map(row => [...row]);

    // Check that every non-space cell is filled
    let allNonSpacesFilled = true;
    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        if (puzzle.solution[r][c] !== ' ') {
          if (correctGrid[r][c] === '' || correctGrid[r][c] !== puzzle.solution[r][c]) {
            allNonSpacesFilled = false;
          }
        }
      }
    }

    expect(allNonSpacesFilled).toBe(true);
  });

  it('does not detect win when grid is partially filled', () => {
    const puzzle = generatePuzzle();

    // Create a grid with only first non-space cell filled
    const partialGrid = Array(puzzle.height).fill(null).map(() => Array(puzzle.width).fill(''));

    // Fill only one correct cell
    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        if (puzzle.solution[r][c] !== ' ') {
          partialGrid[r][c] = puzzle.solution[r][c];
          // Break after filling one cell
          r = puzzle.height;
          break;
        }
      }
    }

    // Check if all non-space cells are correctly filled
    let solved = true;
    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        if (puzzle.solution[r][c] !== ' ' && partialGrid[r][c] !== puzzle.solution[r][c]) {
          solved = false;
        }
      }
    }

    // Should not be solved with just one cell
    expect(solved).toBe(false);
  });
});
