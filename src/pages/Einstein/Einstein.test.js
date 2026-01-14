import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffleArray,
} from '../../data/wordUtils';

// ===========================================
// Einstein Puzzle - Grid Setup Tests
// ===========================================
describe('Einstein Puzzle - Grid Setup', () => {
  const CATEGORIES = ['house', 'nationality', 'color', 'drink', 'pet'];
  const ITEMS_PER_CATEGORY = 5;

  const createEmptyGrid = (numHouses, categories) => {
    const grid = {};
    for (let i = 0; i < numHouses; i++) {
      grid[i] = {};
      categories.forEach(cat => {
        grid[i][cat] = null;
      });
    }
    return grid;
  };

  it('should create grid with correct structure', () => {
    const grid = createEmptyGrid(5, CATEGORIES);

    expect(Object.keys(grid).length).toBe(5);

    for (let i = 0; i < 5; i++) {
      expect(grid[i]).toBeDefined();
      CATEGORIES.forEach(cat => {
        expect(grid[i][cat]).toBeNull();
      });
    }
  });

  it('should have all categories in each house', () => {
    const grid = createEmptyGrid(5, CATEGORIES);

    for (let i = 0; i < 5; i++) {
      expect(Object.keys(grid[i]).length).toBe(CATEGORIES.length);
    }
  });
});

// ===========================================
// Einstein Puzzle - Clue Types Tests
// ===========================================
describe('Einstein Puzzle - Clue Types', () => {
  // Clue types: position, same_house, next_to, left_of, right_of

  const checkPositionClue = (grid, house, category, value) => {
    return grid[house][category] === value;
  };

  const checkSameHouseClue = (grid, cat1, val1, cat2, val2) => {
    for (let house = 0; house < Object.keys(grid).length; house++) {
      if (grid[house][cat1] === val1) {
        return grid[house][cat2] === val2;
      }
    }
    return false;
  };

  const checkNextToClue = (grid, cat1, val1, cat2, val2) => {
    const numHouses = Object.keys(grid).length;

    for (let house = 0; house < numHouses; house++) {
      if (grid[house][cat1] === val1) {
        // Check left neighbor
        if (house > 0 && grid[house - 1][cat2] === val2) return true;
        // Check right neighbor
        if (house < numHouses - 1 && grid[house + 1][cat2] === val2) return true;
      }
    }
    return false;
  };

  const mockGrid = {
    0: { color: 'red', nationality: 'brit' },
    1: { color: 'green', nationality: 'swede' },
    2: { color: 'blue', nationality: 'dane' },
  };

  it('should check position clue correctly', () => {
    expect(checkPositionClue(mockGrid, 0, 'color', 'red')).toBe(true);
    expect(checkPositionClue(mockGrid, 0, 'color', 'blue')).toBe(false);
  });

  it('should check same house clue correctly', () => {
    expect(checkSameHouseClue(mockGrid, 'color', 'red', 'nationality', 'brit')).toBe(true);
    expect(checkSameHouseClue(mockGrid, 'color', 'red', 'nationality', 'swede')).toBe(false);
  });

  it('should check next to clue correctly', () => {
    expect(checkNextToClue(mockGrid, 'color', 'red', 'color', 'green')).toBe(true);
    expect(checkNextToClue(mockGrid, 'color', 'red', 'color', 'blue')).toBe(false);
    expect(checkNextToClue(mockGrid, 'color', 'green', 'color', 'blue')).toBe(true);
  });
});

// ===========================================
// Einstein Puzzle - Elimination Tests
// ===========================================
describe('Einstein Puzzle - Elimination', () => {
  const createPossibilities = (numHouses, values) => {
    const poss = {};
    for (let i = 0; i < numHouses; i++) {
      poss[i] = new Set(values);
    }
    return poss;
  };

  const eliminateFromHouse = (possibilities, house, value) => {
    const newPoss = { ...possibilities };
    newPoss[house] = new Set([...possibilities[house]].filter(v => v !== value));
    return newPoss;
  };

  const eliminateFromOthers = (possibilities, house, value) => {
    const newPoss = {};
    for (const h of Object.keys(possibilities)) {
      if (parseInt(h) === house) {
        newPoss[h] = possibilities[h];
      } else {
        newPoss[h] = new Set([...possibilities[h]].filter(v => v !== value));
      }
    }
    return newPoss;
  };

  it('should eliminate value from specific house', () => {
    let poss = createPossibilities(3, ['A', 'B', 'C']);
    poss = eliminateFromHouse(poss, 0, 'A');

    expect(poss[0].has('A')).toBe(false);
    expect(poss[0].has('B')).toBe(true);
    expect(poss[1].has('A')).toBe(true);
  });

  it('should eliminate value from other houses', () => {
    let poss = createPossibilities(3, ['A', 'B', 'C']);
    poss = eliminateFromOthers(poss, 0, 'A');

    expect(poss[0].has('A')).toBe(true);
    expect(poss[1].has('A')).toBe(false);
    expect(poss[2].has('A')).toBe(false);
  });

  it('should detect single possibility', () => {
    let poss = createPossibilities(3, ['A', 'B', 'C']);
    poss = eliminateFromHouse(poss, 0, 'B');
    poss = eliminateFromHouse(poss, 0, 'C');

    expect(poss[0].size).toBe(1);
    expect([...poss[0]][0]).toBe('A');
  });
});

// ===========================================
// Einstein Puzzle - Solution Validation Tests
// ===========================================
describe('Einstein Puzzle - Solution Validation', () => {
  const validateSolution = (grid, clues) => {
    return clues.every(clue => {
      switch (clue.type) {
        case 'position':
          return grid[clue.house][clue.category] === clue.value;
        case 'same_house':
          for (let h = 0; h < Object.keys(grid).length; h++) {
            if (grid[h][clue.cat1] === clue.val1) {
              return grid[h][clue.cat2] === clue.val2;
            }
          }
          return false;
        default:
          return true;
      }
    });
  };

  const mockSolution = {
    0: { color: 'red', pet: 'dog' },
    1: { color: 'green', pet: 'cat' },
    2: { color: 'blue', pet: 'bird' },
  };

  it('should validate correct solution', () => {
    const clues = [
      { type: 'position', house: 0, category: 'color', value: 'red' },
      { type: 'same_house', cat1: 'color', val1: 'green', cat2: 'pet', val2: 'cat' },
    ];

    expect(validateSolution(mockSolution, clues)).toBe(true);
  });

  it('should reject incorrect solution', () => {
    const clues = [
      { type: 'position', house: 0, category: 'color', value: 'blue' },
    ];

    expect(validateSolution(mockSolution, clues)).toBe(false);
  });
});

// ===========================================
// Einstein Puzzle - Puzzle Generation Tests
// ===========================================
describe('Einstein Puzzle - Puzzle Generation', () => {
  const generateSolution = (numHouses, categories, random) => {
    const solution = {};

    for (let i = 0; i < numHouses; i++) {
      solution[i] = {};
    }

    categories.forEach(cat => {
      const values = cat.values.slice(0, numHouses);
      const shuffled = seededShuffleArray(values, random);

      for (let i = 0; i < numHouses; i++) {
        solution[i][cat.name] = shuffled[i];
      }
    });

    return solution;
  };

  const mockCategories = [
    { name: 'color', values: ['red', 'green', 'blue', 'yellow', 'white'] },
    { name: 'pet', values: ['dog', 'cat', 'bird', 'fish', 'horse'] },
  ];

  it('should assign one value per house per category', () => {
    const random = createSeededRandom(12345);
    const solution = generateSolution(3, mockCategories, random);

    for (let i = 0; i < 3; i++) {
      expect(solution[i].color).toBeDefined();
      expect(solution[i].pet).toBeDefined();
    }
  });

  it('should not duplicate values within category', () => {
    const random = createSeededRandom(12345);
    const solution = generateSolution(3, mockCategories, random);

    const colors = [solution[0].color, solution[1].color, solution[2].color];
    expect(new Set(colors).size).toBe(3);

    const pets = [solution[0].pet, solution[1].pet, solution[2].pet];
    expect(new Set(pets).size).toBe(3);
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const solution1 = generateSolution(3, mockCategories, random1);
    const solution2 = generateSolution(3, mockCategories, random2);

    expect(solution1).toEqual(solution2);
  });
});

// ===========================================
// Einstein Puzzle - UI State Tests
// ===========================================
describe('Einstein Puzzle - UI State', () => {
  const setCellValue = (grid, house, category, value) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    newGrid[house][category] = value;
    return newGrid;
  };

  const clearCellValue = (grid, house, category) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    newGrid[house][category] = null;
    return newGrid;
  };

  const isComplete = (grid, categories) => {
    for (const house of Object.keys(grid)) {
      for (const cat of categories) {
        if (grid[house][cat] === null) return false;
      }
    }
    return true;
  };

  const mockGrid = {
    0: { color: null, pet: null },
    1: { color: null, pet: null },
  };

  it('should set cell value', () => {
    const newGrid = setCellValue(mockGrid, 0, 'color', 'red');

    expect(newGrid[0].color).toBe('red');
    expect(mockGrid[0].color).toBeNull(); // Original unchanged
  });

  it('should clear cell value', () => {
    const grid = setCellValue(mockGrid, 0, 'color', 'red');
    const clearedGrid = clearCellValue(grid, 0, 'color');

    expect(clearedGrid[0].color).toBeNull();
  });

  it('should detect incomplete grid', () => {
    expect(isComplete(mockGrid, ['color', 'pet'])).toBe(false);
  });

  it('should detect complete grid', () => {
    let grid = setCellValue(mockGrid, 0, 'color', 'red');
    grid = setCellValue(grid, 0, 'pet', 'dog');
    grid = setCellValue(grid, 1, 'color', 'blue');
    grid = setCellValue(grid, 1, 'pet', 'cat');

    expect(isComplete(grid, ['color', 'pet'])).toBe(true);
  });
});
