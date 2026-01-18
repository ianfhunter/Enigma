import { describe, it, expect } from 'vitest';
import { generatePuzzle, isSolved } from './generator';

describe('Eulero Generator', () => {
  describe('generatePuzzle', () => {
    it('should generate a puzzle with correct structure', () => {
      const puzzle = generatePuzzle(5, 'medium', 12345);
      
      expect(puzzle).toBeDefined();
      expect(puzzle.size).toBe(5);
      expect(puzzle.difficulty).toBe('medium');
      expect(puzzle.seed).toBe(12345);
      expect(puzzle.puzzle).toHaveLength(5);
      expect(puzzle.solution).toHaveLength(5);
      
      puzzle.puzzle.forEach(row => {
        expect(row).toHaveLength(5);
      });
      
      puzzle.solution.forEach(row => {
        expect(row).toHaveLength(5);
        row.forEach(cell => {
          expect(cell).toHaveProperty('number');
          expect(cell).toHaveProperty('letter');
          expect(cell.number).toBeGreaterThanOrEqual(1);
          expect(cell.number).toBeLessThanOrEqual(5);
          expect(typeof cell.letter).toBe('string');
          expect(cell.letter.length).toBe(1);
        });
      });
    });

    it('should generate different puzzles with different seeds', () => {
      const puzzle1 = generatePuzzle(5, 'medium', 11111);
      const puzzle2 = generatePuzzle(5, 'medium', 22222);
      
      // Puzzles should be different
      let different = false;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
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
      const puzzle1 = generatePuzzle(4, 'easy', 99999);
      const puzzle2 = generatePuzzle(4, 'easy', 99999);
      
      expect(JSON.stringify(puzzle1.puzzle)).toBe(JSON.stringify(puzzle2.puzzle));
      expect(JSON.stringify(puzzle1.solution)).toBe(JSON.stringify(puzzle2.solution));
    });

    it('should respect difficulty levels', () => {
      const easy = generatePuzzle(5, 'easy', 1000);
      const medium = generatePuzzle(5, 'medium', 2000);
      const hard = generatePuzzle(5, 'hard', 3000);
      
      const countFilled = (puzzle) => {
        let count = 0;
        puzzle.puzzle.forEach(row => {
          row.forEach(cell => {
            if (cell !== null) count++;
          });
        });
        return count;
      };
      
      const easyCount = countFilled(easy);
      const mediumCount = countFilled(medium);
      const hardCount = countFilled(hard);
      
      // Easy should have more clues than medium, medium more than hard
      expect(easyCount).toBeGreaterThanOrEqual(mediumCount);
      expect(mediumCount).toBeGreaterThanOrEqual(hardCount);
    });

    it('should generate valid solution (each row has all numbers)', () => {
      const puzzle = generatePuzzle(5, 'medium', 5000);
      
      puzzle.solution.forEach(row => {
        const numbers = row.map(cell => cell.number).sort();
        expect(numbers).toEqual([1, 2, 3, 4, 5]);
      });
    });

    it('should generate valid solution (each column has all numbers)', () => {
      const puzzle = generatePuzzle(5, 'medium', 6000);
      
      for (let c = 0; c < 5; c++) {
        const numbers = puzzle.solution.map(row => row[c].number).sort();
        expect(numbers).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it('should generate valid solution (each row has all letters)', () => {
      const puzzle = generatePuzzle(5, 'medium', 7000);
      const expectedLetters = ['A', 'B', 'C', 'D', 'E'].sort();
      
      puzzle.solution.forEach(row => {
        const letters = row.map(cell => cell.letter).sort();
        expect(letters).toEqual(expectedLetters);
      });
    });

    it('should generate valid solution (each column has all letters)', () => {
      const puzzle = generatePuzzle(5, 'medium', 8000);
      const expectedLetters = ['A', 'B', 'C', 'D', 'E'].sort();
      
      for (let c = 0; c < 5; c++) {
        const letters = puzzle.solution.map(row => row[c].letter).sort();
        expect(letters).toEqual(expectedLetters);
      }
    });

    it('should generate valid solution (no duplicate pairs)', () => {
      const puzzle = generatePuzzle(5, 'medium', 9000);
      const pairs = new Set();
      
      puzzle.solution.forEach(row => {
        row.forEach(cell => {
          const pairKey = `${cell.number}-${cell.letter}`;
          expect(pairs.has(pairKey)).toBe(false);
          pairs.add(pairKey);
        });
      });
      
      expect(pairs.size).toBe(25); // 5x5 = 25 unique pairs
    });

    it('should work with different sizes', () => {
      for (const size of [4, 5, 6, 7]) {
        const puzzle = generatePuzzle(size, 'medium', 10000 + size);
        expect(puzzle.size).toBe(size);
        expect(puzzle.puzzle.length).toBe(size);
        expect(puzzle.solution.length).toBe(size);
      }
    });
  });

  describe('isSolved', () => {
    it('should return true for correct solution', () => {
      const puzzle = generatePuzzle(4, 'easy', 20000);
      expect(isSolved(puzzle.solution, puzzle.solution)).toBe(true);
    });

    it('should return false for incomplete solution', () => {
      const puzzle = generatePuzzle(4, 'easy', 21000);
      const incomplete = puzzle.puzzle.map(row => row.map(cell => cell ? { ...cell } : null));
      expect(isSolved(incomplete, puzzle.solution)).toBe(false);
    });

    it('should return false for incorrect solution', () => {
      const puzzle = generatePuzzle(4, 'easy', 22000);
      const incorrect = puzzle.solution.map(row => row.map(cell => ({ ...cell })));
      // Change one cell
      incorrect[0][0].number = incorrect[0][0].number === 1 ? 2 : 1;
      expect(isSolved(incorrect, puzzle.solution)).toBe(false);
    });
  });
});