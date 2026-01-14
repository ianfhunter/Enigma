/**
 * Einstein/Zebra Puzzle Generator
 * Generates puzzles with guaranteed unique solutions
 */

import { CLUE_TYPES, countSolutions } from './solver';

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a random valid solution
 */
export function generateSolution(numHouses, categories) {
  const solution = {};
  for (const cat of categories) {
    solution[cat.name] = shuffle(cat.items);
  }
  return solution;
}

/**
 * Extract all possible clues from a solution
 */
export function extractAllClues(solution, categories) {
  const clues = [];
  const numHouses = categories[0].items.length;

  // Helper to find house for an item
  const findHouse = (category, item) => {
    return solution[category].indexOf(item);
  };

  // Generate POSITION clues (item in house N)
  for (const cat of categories) {
    for (const item of cat.items) {
      const house = findHouse(cat.name, item);
      clues.push({
        type: CLUE_TYPES.POSITION,
        category: cat.name,
        item,
        house,
        text: `The ${item} is in house ${house + 1}.`,
      });
    }
  }

  // Generate SAME_HOUSE clues (two items share a house)
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];

      for (const item1 of cat1.items) {
        const h1 = findHouse(cat1.name, item1);
        const item2 = solution[cat2.name][h1];

        clues.push({
          type: CLUE_TYPES.SAME_HOUSE,
          category1: cat1.name,
          item1,
          category2: cat2.name,
          item2,
          text: `The ${item1} is with the ${item2}.`,
        });
      }
    }
  }

  // Generate NEXT_TO clues
  for (let i = 0; i < categories.length; i++) {
    for (let j = i; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];

      for (const item1 of cat1.items) {
        const h1 = findHouse(cat1.name, item1);

        for (const item2 of cat2.items) {
          if (cat1.name === cat2.name && item1 === item2) continue;

          const h2 = findHouse(cat2.name, item2);

          if (Math.abs(h1 - h2) === 1) {
            clues.push({
              type: CLUE_TYPES.NEXT_TO,
              category1: cat1.name,
              item1,
              category2: cat2.name,
              item2,
              text: `The ${item1} is next to the ${item2}.`,
            });
          }
        }
      }
    }
  }

  // Generate IMMEDIATE_LEFT clues
  for (let i = 0; i < categories.length; i++) {
    for (let j = 0; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];

      for (const item1 of cat1.items) {
        const h1 = findHouse(cat1.name, item1);
        if (h1 >= numHouses - 1) continue;

        for (const item2 of cat2.items) {
          if (cat1.name === cat2.name && item1 === item2) continue;

          const h2 = findHouse(cat2.name, item2);

          if (h1 + 1 === h2) {
            clues.push({
              type: CLUE_TYPES.IMMEDIATE_LEFT,
              category1: cat1.name,
              item1,
              category2: cat2.name,
              item2,
              text: `The ${item1} is immediately left of the ${item2}.`,
            });
          }
        }
      }
    }
  }

  // Generate LEFT_OF clues (non-adjacent)
  for (let i = 0; i < categories.length; i++) {
    for (let j = 0; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];

      for (const item1 of cat1.items) {
        const h1 = findHouse(cat1.name, item1);

        for (const item2 of cat2.items) {
          if (cat1.name === cat2.name && item1 === item2) continue;

          const h2 = findHouse(cat2.name, item2);

          // Only include if they're not adjacent (adjacent is covered by IMMEDIATE_LEFT)
          if (h1 < h2 && h2 - h1 > 1) {
            clues.push({
              type: CLUE_TYPES.LEFT_OF,
              category1: cat1.name,
              item1,
              category2: cat2.name,
              item2,
              text: `The ${item1} is somewhere left of the ${item2}.`,
            });
          }
        }
      }
    }
  }

  return clues;
}

/**
 * Score a clue based on how constraining it is
 * Higher score = more constraining = better for quick solving
 */
function scoreClue(clue, _numHouses) {
  switch (clue.type) {
    case CLUE_TYPES.POSITION:
      return 100; // Most constraining - fixes a value
    case CLUE_TYPES.SAME_HOUSE:
      return 50;  // Very useful
    case CLUE_TYPES.IMMEDIATE_LEFT:
      return 40;  // Specific relationship
    case CLUE_TYPES.NEXT_TO:
      return 30;  // Two possibilities
    case CLUE_TYPES.LEFT_OF:
      return 20;  // Weaker constraint
    default:
      return 10;
  }
}

/**
 * Generate a minimal set of clues that uniquely determines the solution
 */
export function selectClues(solution, categories, allClues, difficulty = 'medium') {
  const numHouses = categories[0].items.length;
  const selectedClues = [];

  // Shuffle clues for variety
  const shuffledClues = shuffle(allClues);

  // Sort by constraining power (we want to add constraining clues first for efficiency)
  shuffledClues.sort((a, b) => scoreClue(b, numHouses) - scoreClue(a, numHouses));

  // Difficulty settings: how many POSITION clues to allow
  const positionClueLimit = {
    easy: 3,
    medium: 2,
    hard: 1,
    expert: 0,
  }[difficulty] || 2;

  let positionClueCount = 0;

  // Greedily select clues until puzzle has unique solution
  for (const clue of shuffledClues) {
    // Limit position clues for difficulty
    if (clue.type === CLUE_TYPES.POSITION) {
      if (positionClueCount >= positionClueLimit) continue;
      positionClueCount++;
    }

    selectedClues.push(clue);

    const solutionCount = countSolutions(numHouses, categories, selectedClues, 2);

    if (solutionCount === 1) {
      // We have enough clues!
      break;
    }
  }

  // Verify we got a unique solution
  if (countSolutions(numHouses, categories, selectedClues, 2) !== 1) {
    // Fallback: add more position clues if needed
    for (const clue of shuffledClues) {
      if (clue.type === CLUE_TYPES.POSITION && !selectedClues.includes(clue)) {
        selectedClues.push(clue);
        if (countSolutions(numHouses, categories, selectedClues, 2) === 1) {
          break;
        }
      }
    }
  }

  return selectedClues;
}

/**
 * Try to minimize the clue set by removing redundant clues
 */
export function minimizeClues(solution, categories, clues) {
  const numHouses = categories[0].items.length;
  const minimal = [...clues];

  // Shuffle to randomize which clues get removed
  const indices = shuffle([...Array(minimal.length).keys()]);

  for (const i of indices) {
    if (minimal.length <= 1) break;

    // Try removing this clue
    const test = [...minimal.slice(0, i), ...minimal.slice(i + 1)];

    if (test.length > 0 && countSolutions(numHouses, categories, test, 2) === 1) {
      // Can remove this clue
      minimal.splice(minimal.indexOf(clues[i]), 1);
    }
  }

  return minimal;
}

/**
 * Main puzzle generation function
 */
export function generatePuzzle(numHouses, categories, difficulty = 'medium') {
  // Generate random solution
  const solution = generateSolution(numHouses, categories);

  // Extract all possible clues
  const allClues = extractAllClues(solution, categories);

  // Select minimal clue set
  let clues = selectClues(solution, categories, allClues, difficulty);

  // Try to minimize further
  clues = minimizeClues(solution, categories, clues);

  // Shuffle clue order for presentation
  clues = shuffle(clues);

  // Verify
  const solutionCount = countSolutions(numHouses, categories, clues, 2);
  if (solutionCount !== 1) {
    console.warn('Generated puzzle may have multiple solutions:', solutionCount);
  }

  return { solution, clues };
}

/**
 * Format a clue for display
 */
export function formatClue(clue, categories) {
  // Find category display info
  const getCatIcon = (catName) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.icon || '';
  };

  switch (clue.type) {
    case CLUE_TYPES.POSITION:
      return {
        icon: getCatIcon(clue.category),
        text: `The ${clue.item} is in house ${clue.house + 1}.`,
      };

    case CLUE_TYPES.SAME_HOUSE:
      return {
        icon: getCatIcon(clue.category1),
        text: `The ${clue.item1} is in the same house as the ${clue.item2}.`,
      };

    case CLUE_TYPES.NEXT_TO:
      return {
        icon: '↔️',
        text: `The ${clue.item1} is next to the ${clue.item2}.`,
      };

    case CLUE_TYPES.IMMEDIATE_LEFT:
      return {
        icon: '⬅️',
        text: `The ${clue.item1} is immediately to the left of the ${clue.item2}.`,
      };

    case CLUE_TYPES.LEFT_OF:
      return {
        icon: '←',
        text: `The ${clue.item1} is somewhere to the left of the ${clue.item2}.`,
      };

    default:
      return { icon: '❓', text: clue.text || 'Unknown clue' };
  }
}

