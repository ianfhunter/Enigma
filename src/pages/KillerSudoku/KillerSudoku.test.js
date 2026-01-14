import { describe, it, expect } from 'vitest';
import {
  checkValidity,
  checkSolved,
  getCageBorders,
  convertGeneratorData,
  stringToGrid,
} from './KillerSudoku.jsx';

describe('KillerSudoku - string conversion', () => {
  it('converts string puzzle to 2D grid', () => {
    const str = '123456789'.repeat(9).substring(0, 81);
    const grid = stringToGrid(str, 9);
    expect(grid).toHaveLength(9);
    expect(grid[0]).toHaveLength(9);
    expect(grid[0][0]).toBe(1);
    expect(grid[0][8]).toBe(9);
  });

  it('converts dashes to zeros', () => {
    const str = '-'.repeat(81);
    const grid = stringToGrid(str, 9);
    expect(grid[0][0]).toBe(0);
  });
});

describe('KillerSudoku - generator conversion', () => {
  it('converts generator data to component format', () => {
    const generatorData = {
      puzzle: '-'.repeat(81),
      solution: '1'.repeat(81),
      areas: [
        {
          cells: [[0, 0], [0, 1], [1, 0]],
          sum: 15
        },
        {
          cells: [[1, 1], [2, 2]],
          sum: 10
        }
      ]
    };
    const { cages, processedCageGrid } = convertGeneratorData(generatorData, 9);
    
    expect(cages).toHaveLength(2);
    expect(cages[0].sum).toBe(15);
    expect(cages[1].sum).toBe(10);
    expect(processedCageGrid[0][0]).toBe(0);
    expect(processedCageGrid[1][1]).toBe(1);
  });
});

describe('KillerSudoku - validity and solved checks', () => {
  it('flags row/col/box duplicates and cage sum overages', () => {
    const grid = [
      [1, 1],
      [0, 0],
    ];
    const cages = [
      { id: 0, cells: [[0, 0], [0, 1]], sum: 3 },
      { id: 1, cells: [[1, 0], [1, 1]], sum: 2 },
    ];
    const errors = checkValidity(grid, cages, 2);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('requires exact solution match for checkSolved', () => {
    const solution = [
      [1, 2],
      [3, 4],
    ];
    expect(checkSolved(solution, solution)).toBe(true);
    const wrong = [
      [1, 2],
      [4, 3],
    ];
    expect(checkSolved(wrong, solution)).toBe(false);
  });
});

describe('KillerSudoku - cage borders', () => {
  it('marks edges where cage ids differ', () => {
    const cageGrid = [
      [0, 0],
      [1, 1],
    ];
    const borders = getCageBorders(0, 1, cageGrid);
    expect(borders).toContain('right'); // edge
    expect(borders).toContain('top');   // edge
    expect(borders).not.toContain('left'); // same cage to the left
  });
});
