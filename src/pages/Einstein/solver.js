/**
 * Einstein/Zebra Puzzle Solver
 * Uses constraint propagation with backtracking for guaranteed solutions
 */

export const CLUE_TYPES = {
  POSITION: 'position',       // "X is in house N"
  SAME_HOUSE: 'same',         // "X and Y are in the same house"
  NEXT_TO: 'nextTo',          // "X is next to Y (either side)"
  IMMEDIATE_LEFT: 'immLeft',  // "X is immediately to the left of Y"
  LEFT_OF: 'leftOf',          // "X is somewhere to the left of Y"
};

/**
 * Initialize possibilities grid
 * For each house and category, all items are initially possible
 */
export function initializePossibilities(numHouses, categories) {
  const state = [];
  for (let h = 0; h < numHouses; h++) {
    state[h] = {};
    for (const cat of categories) {
      state[h][cat.name] = new Set(cat.items);
    }
  }
  return state;
}

/**
 * Deep clone the state
 */
export function cloneState(state) {
  return state.map(house => {
    const newHouse = {};
    for (const cat of Object.keys(house)) {
      newHouse[cat] = new Set(house[cat]);
    }
    return newHouse;
  });
}

/**
 * Check if a value is fixed (only one possibility) in a house/category
 */
function _isFixed(state, house, category) {
  return state[house][category].size === 1;
}

/**
 * Get the fixed value if there's only one possibility
 */
function _getFixed(state, house, category) {
  if (state[house][category].size === 1) {
    return [...state[house][category]][0];
  }
  return null;
}

/**
 * Remove a possibility from a house/category
 * Returns true if state changed
 */
function eliminate(state, house, category, value) {
  if (state[house][category].has(value)) {
    state[house][category].delete(value);
    return true;
  }
  return false;
}

/**
 * Fix a value in a house/category (remove all other possibilities)
 * Also removes this value from all other houses in the same category
 */
function fix(state, house, category, value) {
  let changed = false;

  // Set this house to only have this value
  if (state[house][category].size > 1) {
    state[house][category] = new Set([value]);
    changed = true;
  }

  // Remove from all other houses
  for (let h = 0; h < state.length; h++) {
    if (h !== house) {
      if (eliminate(state, h, category, value)) {
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Find which houses could contain a specific item
 */
function findPossibleHouses(state, category, item) {
  const houses = [];
  for (let h = 0; h < state.length; h++) {
    if (state[h][category].has(item)) {
      houses.push(h);
    }
  }
  return houses;
}

/**
 * Apply a single clue to constrain possibilities
 */
function applyClue(state, clue, _categories) {
  let changed = false;
  const numHouses = state.length;

  switch (clue.type) {
    case CLUE_TYPES.POSITION: {
      // Item is in specific house
      const house = clue.house;
      if (fix(state, house, clue.category, clue.item)) {
        changed = true;
      }
      break;
    }

    case CLUE_TYPES.SAME_HOUSE: {
      // Two items are in the same house
      const houses1 = findPossibleHouses(state, clue.category1, clue.item1);
      const houses2 = findPossibleHouses(state, clue.category2, clue.item2);

      // Find intersection
      const validHouses = houses1.filter(h => houses2.includes(h));

      // Eliminate houses not in intersection
      for (let h = 0; h < numHouses; h++) {
        if (!validHouses.includes(h)) {
          if (eliminate(state, h, clue.category1, clue.item1)) changed = true;
          if (eliminate(state, h, clue.category2, clue.item2)) changed = true;
        }
      }

      // If one is fixed, constrain the other
      if (validHouses.length === 1) {
        if (fix(state, validHouses[0], clue.category1, clue.item1)) changed = true;
        if (fix(state, validHouses[0], clue.category2, clue.item2)) changed = true;
      }
      break;
    }

    case CLUE_TYPES.NEXT_TO: {
      // Two items are in adjacent houses
      const houses1 = findPossibleHouses(state, clue.category1, clue.item1);
      const houses2 = findPossibleHouses(state, clue.category2, clue.item2);

      // Item1 must be adjacent to some possible position of item2
      const validForItem1 = houses1.filter(h1 =>
        houses2.some(h2 => Math.abs(h1 - h2) === 1)
      );

      // Item2 must be adjacent to some possible position of item1
      const validForItem2 = houses2.filter(h2 =>
        houses1.some(h1 => Math.abs(h1 - h2) === 1)
      );

      for (let h = 0; h < numHouses; h++) {
        if (!validForItem1.includes(h)) {
          if (eliminate(state, h, clue.category1, clue.item1)) changed = true;
        }
        if (!validForItem2.includes(h)) {
          if (eliminate(state, h, clue.category2, clue.item2)) changed = true;
        }
      }
      break;
    }

    case CLUE_TYPES.IMMEDIATE_LEFT: {
      // Item1 is immediately to the left of item2
      const houses1 = findPossibleHouses(state, clue.category1, clue.item1);
      const houses2 = findPossibleHouses(state, clue.category2, clue.item2);

      // Item1 can't be in last house, item2 can't be in first house
      if (eliminate(state, numHouses - 1, clue.category1, clue.item1)) changed = true;
      if (eliminate(state, 0, clue.category2, clue.item2)) changed = true;

      // Item1 at h means item2 at h+1
      const validForItem1 = houses1.filter(h => houses2.includes(h + 1));
      const validForItem2 = houses2.filter(h => houses1.includes(h - 1));

      for (let h = 0; h < numHouses; h++) {
        if (!validForItem1.includes(h)) {
          if (eliminate(state, h, clue.category1, clue.item1)) changed = true;
        }
        if (!validForItem2.includes(h)) {
          if (eliminate(state, h, clue.category2, clue.item2)) changed = true;
        }
      }
      break;
    }

    case CLUE_TYPES.LEFT_OF: {
      // Item1 is somewhere to the left of item2
      const houses1 = findPossibleHouses(state, clue.category1, clue.item1);
      const houses2 = findPossibleHouses(state, clue.category2, clue.item2);

      // Item1 can't be in last house, item2 can't be in first
      if (eliminate(state, numHouses - 1, clue.category1, clue.item1)) changed = true;
      if (eliminate(state, 0, clue.category2, clue.item2)) changed = true;

      // Item1 must have at least one item2 position to its right
      const maxItem2 = Math.max(...houses2);
      const minItem1 = Math.min(...houses1);

      for (let h = 0; h < numHouses; h++) {
        // Item1 must be < some position of item2
        if (h >= maxItem2) {
          if (eliminate(state, h, clue.category1, clue.item1)) changed = true;
        }
        // Item2 must be > some position of item1
        if (h <= minItem1) {
          if (eliminate(state, h, clue.category2, clue.item2)) changed = true;
        }
      }
      break;
    }
  }

  return changed;
}

/**
 * Apply singleton propagation:
 * If only one house can contain an item, fix it there
 */
function applySingletonPropagation(state, categories) {
  let changed = false;

  for (const cat of categories) {
    for (const item of cat.items) {
      const possibleHouses = findPossibleHouses(state, cat.name, item);

      if (possibleHouses.length === 1) {
        if (fix(state, possibleHouses[0], cat.name, item)) {
          changed = true;
        }
      } else if (possibleHouses.length === 0) {
        // Contradiction - no valid placement
        return { changed: false, valid: false };
      }
    }
  }

  return { changed, valid: true };
}

/**
 * Check if state is valid (no empty possibility sets)
 */
function isValid(state, categories) {
  for (let h = 0; h < state.length; h++) {
    for (const cat of categories) {
      if (state[h][cat.name].size === 0) {
        return false;
      }
    }
  }

  // Also check each item has at least one possible house
  for (const cat of categories) {
    for (const item of cat.items) {
      if (findPossibleHouses(state, cat.name, item).length === 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if puzzle is fully solved
 */
function isSolved(state, categories) {
  for (let h = 0; h < state.length; h++) {
    for (const cat of categories) {
      if (state[h][cat.name].size !== 1) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Extract solution from solved state
 */
function extractSolution(state, categories) {
  const solution = {};
  for (const cat of categories) {
    solution[cat.name] = [];
    for (let h = 0; h < state.length; h++) {
      solution[cat.name][h] = [...state[h][cat.name]][0];
    }
  }
  return solution;
}

/**
 * Main constraint propagation loop
 */
function propagate(state, clues, categories) {
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Apply all clues
    for (const clue of clues) {
      if (applyClue(state, clue, categories)) {
        changed = true;
      }
    }

    // Apply singleton propagation
    const result = applySingletonPropagation(state, categories);
    if (!result.valid) {
      return false; // Contradiction found
    }
    if (result.changed) {
      changed = true;
    }
  }

  return isValid(state, categories);
}

/**
 * Find the best cell to branch on (minimum remaining values heuristic)
 */
function findBranchCell(state, categories) {
  let bestHouse = -1;
  let bestCat = null;
  let bestSize = Infinity;

  for (let h = 0; h < state.length; h++) {
    for (const cat of categories) {
      const size = state[h][cat.name].size;
      if (size > 1 && size < bestSize) {
        bestSize = size;
        bestHouse = h;
        bestCat = cat.name;
      }
    }
  }

  return { house: bestHouse, category: bestCat };
}

/**
 * Solve with backtracking
 * Returns array of solutions (up to limit)
 */
export function solve(numHouses, categories, clues, limit = 1) {
  const state = initializePossibilities(numHouses, categories);

  // Initial propagation
  if (!propagate(state, clues, categories)) {
    return []; // No solution
  }

  if (isSolved(state, categories)) {
    return [extractSolution(state, categories)];
  }

  // Backtracking search
  const solutions = [];

  function search(currentState) {
    if (solutions.length >= limit) return;

    const { house, category } = findBranchCell(currentState, categories);
    if (house === -1) {
      // No branching needed - check if solved
      if (isSolved(currentState, categories)) {
        solutions.push(extractSolution(currentState, categories));
      }
      return;
    }

    // Try each possibility
    const possibilities = [...currentState[house][category]];
    for (const value of possibilities) {
      if (solutions.length >= limit) return;

      const newState = cloneState(currentState);
      fix(newState, house, category, value);

      if (propagate(newState, clues, categories)) {
        if (isSolved(newState, categories)) {
          solutions.push(extractSolution(newState, categories));
        } else {
          search(newState);
        }
      }
    }
  }

  search(state);
  return solutions;
}

/**
 * Count solutions (useful for checking uniqueness)
 */
export function countSolutions(numHouses, categories, clues, limit = 2) {
  return solve(numHouses, categories, clues, limit).length;
}

/**
 * Check if a partial solution is consistent with clues
 */
export function checkClueConsistency(solution, clue) {
  const _numHouses = Object.values(solution)[0].length;

  // Helper to find house for an item
  const findHouse = (category, item) => {
    const arr = solution[category];
    for (let h = 0; h < arr.length; h++) {
      if (arr[h] === item) return h;
    }
    return -1;
  };

  switch (clue.type) {
    case CLUE_TYPES.POSITION:
      return findHouse(clue.category, clue.item) === clue.house;

    case CLUE_TYPES.SAME_HOUSE: {
      const h1 = findHouse(clue.category1, clue.item1);
      const h2 = findHouse(clue.category2, clue.item2);
      return h1 === h2;
    }

    case CLUE_TYPES.NEXT_TO: {
      const h1 = findHouse(clue.category1, clue.item1);
      const h2 = findHouse(clue.category2, clue.item2);
      return Math.abs(h1 - h2) === 1;
    }

    case CLUE_TYPES.IMMEDIATE_LEFT: {
      const h1 = findHouse(clue.category1, clue.item1);
      const h2 = findHouse(clue.category2, clue.item2);
      return h1 + 1 === h2;
    }

    case CLUE_TYPES.LEFT_OF: {
      const h1 = findHouse(clue.category1, clue.item1);
      const h2 = findHouse(clue.category2, clue.item2);
      return h1 < h2;
    }

    default:
      return true;
  }
}

/**
 * Validate user's current solution against clues
 */
export function validateSolution(userSolution, clues, categories) {
  // Check all houses have unique values per category
  for (const cat of categories) {
    const values = userSolution[cat.name].filter(v => v !== null);
    if (new Set(values).size !== values.length) {
      return { valid: false, reason: 'Duplicate values in ' + cat.name };
    }
  }

  // Check all clues
  for (const clue of clues) {
    if (!checkClueConsistency(userSolution, clue)) {
      return { valid: false, reason: 'Clue violated', clue };
    }
  }

  return { valid: true };
}

