import { describe, it, expect } from 'vitest';
import { generatePuzzle, isSolved } from './generator';

describe('Japanese Sums Generator', () => {
  describe('generatePuzzle', () => {
    it('should generate a puzzle with correct structure', () => {
      const puzzle = generatePuzzle(7, 'medium', 12345);
      
      expect(puzzle).toBeDefined();
      expect(puzzle.size).toBe(7);
      expect(puzzle.difficulty).toBe('medium');
      expect(puzzle.seed).toBe(12345);
      expect(puzzle.puzzle).toHaveLength(7);
      expect(puzzle.solution).toHaveLength(7);
      expect(puzzle.pattern).toHaveLength(7);
      expect(puzzle.rowClues).toHaveLength(7);
      expect(puzzle.colClues).toHaveLength(7);
      
      puzzle.puzzle.forEach(row => {
        expect(row).toHaveLength(7);
      });
      
      puzzle.solution.forEach(row => {
        expect(row).toHaveLength(7);
        row.forEach(cell => {
          expect(cell).toBeGreaterThanOrEqual(1);
          expect(cell).toBeLessThanOrEqual(7);
        });
      });
      
      puzzle.pattern.forEach(row => {
        expect(row).toHaveLength(7);
        row.forEach(cell => {
          expect(typeof cell).toBe('boolean');
        });
      });
    });

    it('should generate different puzzles with different seeds', () => {
      const puzzle1 = generatePuzzle(6, 'medium', 11111);
      const puzzle2 = generatePuzzle(6, 'medium', 22222);
      
      // Puzzles should be different
      let different = false;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          if (JSON.stringify(puzzle1.puzzle[r][c]) !== JSON.stringify(puzzle2.puzzle[r][c])) {
            different = true;
            break;
          }
        }
        if (different) break;
      }
      expect(different).toBe(true);
    });

    it('should generate same puzzle with same seed', () => {
      const puzzle1 = generatePuzzle(5, 'easy', 99999);
      const puzzle2 = generatePuzzle(5, 'easy', 99999);
      
      expect(JSON.stringify(puzzle1.puzzle)).toBe(JSON.stringify(puzzle2.puzzle));
      expect(JSON.stringify(puzzle1.solution)).toBe(JSON.stringify(puzzle2.solution));
      expect(JSON.stringify(puzzle1.pattern)).toBe(JSON.stringify(puzzle2.pattern));
    });

    it('should respect difficulty levels', () => {
      const easy = generatePuzzle(7, 'easy', 1000);
      const medium = generatePuzzle(7, 'medium', 2000);
      const hard = generatePuzzle(7, 'hard', 3000);
      
      const countFilled = (puzzle) => {
        let count = 0;
        puzzle.pattern.forEach(row => {
          row.forEach(cell => {
            if (cell) count++;
          });
        });
        return count;
      };
      
      const easyCount = countFilled(easy);
      const mediumCount = countFilled(medium);
      const hardCount = countFilled(hard);
      
      // Easy should have more filled cells than medium, medium more than hard
      expect(easyCount).toBeGreaterThanOrEqual(mediumCount);
      expect(mediumCount).toBeGreaterThanOrEqual(hardCount);
    });

    it('should generate valid solution (each row has all numbers)', () => {
      const puzzle = generatePuzzle(6, 'medium', 5000);
      
      puzzle.solution.forEach(row => {
        const numbers = [...row].sort();
        const expected = [1, 2, 3, 4, 5, 6];
        expect(numbers).toEqual(expected);
      });
    });

    it('should generate valid solution (each column has all numbers)', () => {
      const puzzle = generatePuzzle(6, 'medium', 6000);
      
      for (let c = 0; c < 6; c++) {
        const numbers = puzzle.solution.map(row => row[c]).sort();
        const expected = [1, 2, 3, 4, 5, 6];
        expect(numbers).toEqual(expected);
      }
    });

    it('should have valid row clues', () => {
      const puzzle = generatePuzzle(7, 'medium', 7000);
      
      puzzle.rowClues.forEach((clues, r) => {
        // Clues should be arrays of numbers
        expect(Array.isArray(clues)).toBe(true);
        clues.forEach(sum => {
          expect(typeof sum).toBe('number');
          expect(sum).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid column clues', () => {
      const puzzle = generatePuzzle(7, 'medium', 8000);
      
      puzzle.colClues.forEach((clues, c) => {
        // Clues should be arrays of numbers
        expect(Array.isArray(clues)).toBe(true);
        clues.forEach(sum => {
          expect(typeof sum).toBe('number');
          expect(sum).toBeGreaterThan(0);
        });
      });
    });

    it('should match row clues with solution', () => {
      const puzzle = generatePuzzle(5, 'medium', 9000);
      
      puzzle.rowClues.forEach((clues, r) => {
        if (clues.length === 0) return; // Skip empty rows
        
        // Find runs of filled cells
        let runIndex = 0;
        let currentRun = [];
        
        for (let c = 0; c < puzzle.size; c++) {
          if (puzzle.pattern[r][c]) {
            currentRun.push(puzzle.solution[r][c]);
          } else {
            if (currentRun.length > 0) {
              const sum = currentRun.reduce((a, b) => a + b, 0);
              expect(sum).toBe(clues[runIndex]);
              runIndex++;
              currentRun = [];
            }
          }
        }
        
        // Check last run
        if (currentRun.length > 0) {
          const sum = currentRun.reduce((a, b) => a + b, 0);
          expect(sum).toBe(clues[runIndex]);
        }
      });
    });

    it('should work with different sizes', () => {
      for (const size of [5, 6, 7, 8, 9]) {
        const puzzle = generatePuzzle(size, 'medium', 10000 + size);
        expect(puzzle.size).toBe(size);
        expect(puzzle.puzzle.length).toBe(size);
        expect(puzzle.solution.length).toBe(size);
        expect(puzzle.pattern.length).toBe(size);
      }
    });
  });

  describe('isSolved', () => {
    it('should return true for correct solution', () => {
      const puzzle = generatePuzzle(6, 'easy', 20000);
      expect(isSolved(puzzle.solution, puzzle.solution, puzzle.pattern)).toBe(true);
    });

    it('should return false for incomplete solution', () => {
      const puzzle = generatePuzzle(6, 'easy', 21000);
      const incomplete = puzzle.puzzle.map(row => [...row]);
      // Set one filled cell to null
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          if (puzzle.pattern[r][c] && incomplete[r][c] === null) {
            // This is expected to be incomplete
            expect(isSolved(incomplete, puzzle.solution, puzzle.pattern)).toBe(false);
            return;
          }
        }
      }
    });

    it('should return false for incorrect solution', () => {
      const puzzle = generatePuzzle(6, 'easy', 22000);
      const incorrect = puzzle.solution.map(row => [...row]);
      // Change one filled cell
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          if (puzzle.pattern[r][c]) {
            incorrect[r][c] = incorrect[r][c] === 1 ? 2 : 1;
            expect(isSolved(incorrect, puzzle.solution, puzzle.pattern)).toBe(false);
            return;
          }
        }
      }
    });

    it('should return false if shaded cells are filled', () => {
      const puzzle = generatePuzzle(6, 'easy', 23000);
      const incorrect = puzzle.solution.map(row => [...row]);
      // Fill a shaded cell
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          if (!puzzle.pattern[r][c]) {
            incorrect[r][c] = 1;
            expect(isSolved(incorrect, puzzle.solution, puzzle.pattern)).toBe(false);
            return;
          }
        }
      }
    });
  });
});