import { createSeededRNG } from '../../enigma-sdk/seeding';

const OPERATIONS = ['+', '-', '*', '/'];
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function evaluateExpressionLeftToRight(values, operations) {
  let result = values[0];
  for (let i = 0; i < operations.length; i++) {
    const next = values[i + 1];
    const operation = operations[i];

    if (operation === '+') result += next;
    else if (operation === '-') result -= next;
    else if (operation === '*') result *= next;
    else if (operation === '/') {
      if (next === 0 || result % next !== 0) return null;
      result /= next;
    }
  }

  return result;
}

function shuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickGivenIndices(difficulty, rng) {
  const givensByDifficulty = { easy: 3, medium: 2, hard: 1 };
  const givens = givensByDifficulty[difficulty] ?? 2;
  return shuffle([...Array(9).keys()], rng).slice(0, givens);
}

function buildEquationsFromSolution(solutionGrid, rng) {
  const rowEquations = [];
  const colEquations = [];

  for (let row = 0; row < 3; row++) {
    const values = solutionGrid[row];
    let target = null;
    let selectedOps = null;

    for (let tries = 0; tries < 40 && target === null; tries++) {
      const operations = [
        OPERATIONS[Math.floor(rng() * OPERATIONS.length)],
        OPERATIONS[Math.floor(rng() * OPERATIONS.length)],
      ];
      const evaluated = evaluateExpressionLeftToRight(values, operations);
      if (evaluated !== null) {
        selectedOps = operations;
        target = evaluated;
      }
    }

    if (target === null) return null;
    rowEquations.push({ operations: selectedOps, target });
  }

  for (let col = 0; col < 3; col++) {
    const values = [solutionGrid[0][col], solutionGrid[1][col], solutionGrid[2][col]];
    let target = null;
    let selectedOps = null;

    for (let tries = 0; tries < 40 && target === null; tries++) {
      const operations = [
        OPERATIONS[Math.floor(rng() * OPERATIONS.length)],
        OPERATIONS[Math.floor(rng() * OPERATIONS.length)],
      ];
      const evaluated = evaluateExpressionLeftToRight(values, operations);
      if (evaluated !== null) {
        selectedOps = operations;
        target = evaluated;
      }
    }

    if (target === null) return null;
    colEquations.push({ operations: selectedOps, target });
  }

  return { rowEquations, colEquations };
}

function isPlacementLocallyValid(grid, rowEquations, colEquations, row, col) {
  const rowValues = grid[row];
  if (rowValues.every(v => v !== 0)) {
    const rowResult = evaluateExpressionLeftToRight(rowValues, rowEquations[row].operations);
    if (rowResult !== rowEquations[row].target) return false;
  }

  const colValues = [grid[0][col], grid[1][col], grid[2][col]];
  if (colValues.every(v => v !== 0)) {
    const colResult = evaluateExpressionLeftToRight(colValues, colEquations[col].operations);
    if (colResult !== colEquations[col].target) return false;
  }

  return true;
}

function areAllEquationsSatisfied(grid, rowEquations, colEquations) {
  for (let row = 0; row < 3; row++) {
    const rowResult = evaluateExpressionLeftToRight(grid[row], rowEquations[row].operations);
    if (rowResult !== rowEquations[row].target) return false;
  }

  for (let col = 0; col < 3; col++) {
    const colValues = [grid[0][col], grid[1][col], grid[2][col]];
    const colResult = evaluateExpressionLeftToRight(colValues, colEquations[col].operations);
    if (colResult !== colEquations[col].target) return false;
  }

  return true;
}

function countSolutions({ puzzleGrid, rowEquations, colEquations, maxSolutions = 2 }) {
  const grid = puzzleGrid.map(row => [...row]);
  const used = new Set(grid.flat().filter(v => v !== 0));
  let solutions = 0;

  function backtrack(index = 0) {
    if (solutions >= maxSolutions) return;

    if (index === 9) {
      if (areAllEquationsSatisfied(grid, rowEquations, colEquations)) solutions++;
      return;
    }

    const row = Math.floor(index / 3);
    const col = index % 3;

    if (grid[row][col] !== 0) {
      backtrack(index + 1);
      return;
    }

    for (const digit of DIGITS) {
      if (used.has(digit)) continue;
      grid[row][col] = digit;
      used.add(digit);

      if (isPlacementLocallyValid(grid, rowEquations, colEquations, row, col)) backtrack(index + 1);

      used.delete(digit);
      grid[row][col] = 0;
    }
  }

  if (grid.flat().every(value => value !== 0) && !areAllEquationsSatisfied(grid, rowEquations, colEquations)) return 0;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (grid[row][col] !== 0 && !isPlacementLocallyValid(grid, rowEquations, colEquations, row, col)) return 0;
    }
  }

  backtrack();
  return solutions;
}

function generateSetSquarePuzzle(seed, difficulty = 'medium') {
  const rng = createSeededRNG(seed);

  for (let attempt = 0; attempt < 80; attempt++) {
    const solutionFlat = shuffle(DIGITS, rng);
    const solutionGrid = [solutionFlat.slice(0, 3), solutionFlat.slice(3, 6), solutionFlat.slice(6, 9)];

    const equations = buildEquationsFromSolution(solutionGrid, rng);
    if (!equations) continue;

    const givenIndices = pickGivenIndices(difficulty, rng);
    const puzzleGrid = Array.from({ length: 3 }, () => [0, 0, 0]);
    for (const index of givenIndices) {
      const row = Math.floor(index / 3);
      const col = index % 3;
      puzzleGrid[row][col] = solutionGrid[row][col];
    }

    const solutionCount = countSolutions({
      puzzleGrid,
      rowEquations: equations.rowEquations,
      colEquations: equations.colEquations,
      maxSolutions: 2,
    });

    if (solutionCount === 1) {
      return {
        puzzleGrid,
        solutionGrid,
        rowEquations: equations.rowEquations,
        colEquations: equations.colEquations,
      };
    }
  }

  return null;
}

function buildDilatedRows(grid, rowEquations) {
  return grid.map((row, rowIndex) => ({
    target: rowEquations[rowIndex].target,
    cells: [
      { kind: 'number', row: rowIndex, col: 0, value: row[0] },
      { kind: 'op', value: rowEquations[rowIndex].operations[0] },
      { kind: 'number', row: rowIndex, col: 1, value: row[1] },
      { kind: 'op', value: rowEquations[rowIndex].operations[1] },
      { kind: 'number', row: rowIndex, col: 2, value: row[2] },
    ],
  }));
}


function buildColumnOperatorRows(colEquations) {
  return [0, 1].map((operatorIndex) => ([
    { kind: 'colOp', col: 0, value: colEquations[0].operations[operatorIndex] },
    { kind: 'spacer', value: '' },
    { kind: 'colOp', col: 1, value: colEquations[1].operations[operatorIndex] },
    { kind: 'spacer', value: '' },
    { kind: 'colOp', col: 2, value: colEquations[2].operations[operatorIndex] },
  ]));
}

function buildColumnFooter(colEquations) {
  return [
    { kind: 'target', value: colEquations[0].target },
    { kind: 'target', value: colEquations[1].target },
    { kind: 'target', value: colEquations[2].target },
  ];
}

function isSolved(grid, solutionGrid) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] !== solutionGrid[r][c]) return false;
    }
  }
  return true;
}

export {
  evaluateExpressionLeftToRight,
  buildEquationsFromSolution,
  isPlacementLocallyValid,
  countSolutions,
  generateSetSquarePuzzle,
  buildDilatedRows,
  buildColumnOperatorRows,
  buildColumnFooter,
  isSolved,
};
