import { describe, it, expect } from 'vitest';
import {
  generatePuzzle,
  findAllSolutions,
  checkSolution,
  evaluateWord,
  getErrors,
  numberToWord,
  UNIQUE_EQUATIONS,
  LETTERS
} from './logic';

function buildPuzzleFromEquation(equation) {
  const [operands, result] = equation;
  const allDigits = [...operands, result].join('').split('').map(Number);
  const uniqueDigits = [...new Set(allDigits)];
  const digitToLetter = {};
  const letterToDigit = {};
  uniqueDigits.forEach((digit, i) => {
    digitToLetter[digit] = LETTERS[i];
    letterToDigit[LETTERS[i]] = digit;
  });

  return {
    words: operands.map(n => numberToWord(n, digitToLetter)),
    result: numberToWord(result, digitToLetter),
    solution: letterToDigit
  };
}

// Fallback puzzles for testing
const FALLBACK_PUZZLES = [
  { words: ['SEND', 'MORE'], result: 'MONEY', solution: { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 } },
  { words: ['TO', 'GO'], result: 'OUT', solution: { T: 2, O: 1, G: 8, U: 0 } },
  { words: ['BASE', 'BALL'], result: 'GAMES', solution: { B: 7, A: 4, S: 8, E: 3, L: 5, G: 1, M: 9 } },
];

describe('WordArithmetic', () => {
  describe('Fallback Puzzle Solutions', () => {
    FALLBACK_PUZZLES.forEach((puzzle) => {
      const puzzleName = `${puzzle.words.join(' + ')} = ${puzzle.result}`;

      it(`should have valid solution for ${puzzleName}`, () => {
        let sum = 0;
        for (const word of puzzle.words) {
          const val = evaluateWord(word, puzzle.solution);
          expect(val).not.toBeNull();
          sum += val;
        }
        const resultVal = evaluateWord(puzzle.result, puzzle.solution);
        expect(resultVal).not.toBeNull();
        expect(sum).toBe(resultVal);
      });

      it(`should have unique digits for ${puzzleName}`, () => {
        const digits = Object.values(puzzle.solution);
        const uniqueDigits = new Set(digits);
        expect(uniqueDigits.size).toBe(digits.length);
      });

      it(`should have no leading zeros for ${puzzleName}`, () => {
        for (const word of [...puzzle.words, puzzle.result]) {
          expect(puzzle.solution[word[0]]).not.toBe(0);
        }
      });

      it(`checkSolution returns true for ${puzzleName}`, () => {
        expect(checkSolution(puzzle, puzzle.solution)).toBe(true);
      });

      it(`should have exactly one solution for ${puzzleName}`, () => {
        const solutions = findAllSolutions(puzzle, 10);
        expect(solutions.length).toBe(1);
      });
    });
  });

  describe('Puzzle Generator', () => {
    it('should always generate valid puzzles', () => {
      // Generate several puzzles and verify they are all valid
      for (let i = 0; i < 10; i++) {
        const puzzle = generatePuzzle();

        // Should always generate a puzzle
        expect(puzzle).not.toBeNull();
        expect(puzzle.words).toBeDefined();
        expect(puzzle.result).toBeDefined();
        expect(puzzle.solution).toBeDefined();

        // Verify the solution is correct
        expect(checkSolution(puzzle, puzzle.solution)).toBe(true);
      }
    });

    it('should use random letters each time', () => {
      const puzzles = [];
      for (let i = 0; i < 5; i++) {
        puzzles.push(generatePuzzle());
      }

      // Check that we get variety in letter usage
      const allLetterSets = puzzles.map(p =>
        [...new Set([...p.words.join(''), ...p.result])].sort().join('')
      );
      const uniqueLetterSets = new Set(allLetterSets);

      // With random letter assignment, we should usually get different letter sets
      expect(uniqueLetterSets.size).toBeGreaterThan(1);
    });

    it('should not have leading zeros in generated puzzles', () => {
      for (let i = 0; i < 10; i++) {
        const puzzle = generatePuzzle();

        for (const word of [...puzzle.words, puzzle.result]) {
          expect(puzzle.solution[word[0]]).not.toBe(0);
        }
      }
    });

    it('should generate puzzles with unique digit assignments', () => {
      for (let i = 0; i < 10; i++) {
        const puzzle = generatePuzzle();

        const digits = Object.values(puzzle.solution);
        const uniqueDigits = new Set(digits);
        expect(uniqueDigits.size).toBe(digits.length);
      }
    });

    it('should generate puzzles with exactly one solution', () => {
      for (let i = 0; i < 5; i++) {
        const puzzle = generatePuzzle();
        const solutions = findAllSolutions(puzzle, 3);
        expect(solutions.length).toBe(1);
        expect(checkSolution(puzzle, solutions[0])).toBe(true);
      }
    });
  });

  describe('findAllSolutions', () => {
    it('should solve larger verified equations quickly', () => {
      const equation = UNIQUE_EQUATIONS.find(eq => eq[1] === 723970);
      expect(equation).toBeDefined();
      const puzzle = buildPuzzleFromEquation(equation);
      const solutions = findAllSolutions(puzzle, 2);
      expect(solutions.length).toBe(1);
      expect(checkSolution(puzzle, solutions[0])).toBe(true);
    });

    it('should respect the maxSolutions cap for early exit', () => {
      const puzzle = buildPuzzleFromEquation(UNIQUE_EQUATIONS[0]);
      const solutions = findAllSolutions(puzzle, 1);
      expect(solutions.length).toBe(1);
    });
  });

  describe('evaluateWord', () => {
    it('should correctly evaluate a word with given letter map', () => {
      const letterMap = { S: 9, E: 5, N: 6, D: 7 };
      expect(evaluateWord('SEND', letterMap)).toBe(9567);
    });

    it('should return null if a letter is not in the map', () => {
      const letterMap = { S: 9, E: 5 };
      expect(evaluateWord('SEND', letterMap)).toBeNull();
    });
  });

  describe('getErrors', () => {
    it('should detect duplicate digit assignments', () => {
      const puzzle = { words: ['AB'], result: 'CD', solution: {} };
      const letterMap = { A: 5, B: 5 }; // Both have 5
      const errors = getErrors(puzzle, letterMap);
      expect(errors.has('A')).toBe(true);
      expect(errors.has('B')).toBe(true);
    });

    it('should detect leading zeros', () => {
      const puzzle = { words: ['SEND', 'MORE'], result: 'MONEY', solution: {} };
      const letterMap = { S: 0 }; // S is leading letter and is 0
      const errors = getErrors(puzzle, letterMap);
      expect(errors.has('S')).toBe(true);
    });

    it('should not flag non-leading zeros', () => {
      const puzzle = { words: ['SEND'], result: 'TEST', solution: {} };
      const letterMap = { S: 1, E: 0 }; // E is 0 but not leading
      const errors = getErrors(puzzle, letterMap);
      expect(errors.has('E')).toBe(false);
    });

    it('should flag a fully assigned but incorrect column', () => {
      const puzzle = { words: ['AB'], result: 'AC', solution: {} };
      const letterMap = { A: 1, B: 2, C: 4 }; // 12 vs 14, mismatch at ones place
      const errors = getErrors(puzzle, letterMap);
      expect(errors.has('B')).toBe(true);
      expect(errors.has('C')).toBe(true);
    });

    it('should flag all letters when fully assigned but equation is wrong', () => {
      const puzzle = { words: ['AB', 'C'], result: 'AD', solution: {} };
      const letterMap = { A: 1, B: 2, C: 3, D: 4 }; // 12 + 3 = 15, result is 14 -> wrong
      const errors = getErrors(puzzle, letterMap);
      expect(errors.has('A')).toBe(true);
      expect(errors.has('B')).toBe(true);
      expect(errors.has('C')).toBe(true);
      expect(errors.has('D')).toBe(true);
    });
  });

});
