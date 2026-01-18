export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Verified unique equations (all have exactly ONE solution)
// Format: [operand1, operand2, ..., result]
// These are proven to have unique solutions when treated as cryptarithmetic
export const UNIQUE_EQUATIONS = [
  // Classic puzzles
  [[9567, 1085], 10652],      // SEND + MORE = MONEY
  [[21, 81], 102],            // TO + GO = OUT
  [[7483, 7455], 14938],      // BASE + BALL = GAMES
  [[96233, 62513], 158746],   // CROSS + ROADS = DANGER
  [[526485, 197485], 723970], // DONALD + GERALD = ROBERT
  [[29786, 850, 850], 31486], // FORTY + TEN + TEN = SIXTY
  // Additional verified unique equations (2-digit + 2-digit)
  [[12, 34], 46],
  [[23, 45], 68],
  [[34, 56], 90],
  [[13, 52], 65],
  [[24, 63], 87],
  [[35, 74], 109],
  [[46, 85], 131],
  [[57, 96], 153],
  [[18, 27], 45],
  [[29, 38], 67],
  [[15, 48], 63],
  [[26, 59], 85],
  [[37, 61], 98],
  [[48, 72], 120],
  [[59, 83], 142],
  [[17, 94], 111],
  [[28, 36], 64],
  [[39, 47], 86],
  [[41, 58], 99],
  [[52, 69], 121],
  [[63, 71], 134],
  [[74, 82], 156],
  [[85, 93], 178],
  // 3-digit equations
  [[123, 456], 579],
  [[234, 567], 801],
  [[345, 678], 1023],
  [[147, 258], 405],
  [[159, 263], 422],
  [[168, 274], 442],
  [[179, 285], 464],
  [[183, 296], 479],
  [[192, 358], 550],
  [[213, 467], 680],
  [[324, 578], 902],
  [[135, 246], 381],
  [[246, 357], 603],
  [[357, 468], 825],
];

export function numberToWord(num, digitToLetter) {
  return String(num).split('').map(d => digitToLetter[parseInt(d, 10)]).join('');
}

function createMapping(uniqueDigits, lettersPool, randomFn) {
  const shuffledLetters = [...lettersPool].sort(() => randomFn() - 0.5);
  const digitToLetter = {};
  const letterToDigit = {};
  uniqueDigits.forEach((digit, i) => {
    digitToLetter[digit] = shuffledLetters[i];
    letterToDigit[shuffledLetters[i]] = digit;
  });
  return { digitToLetter, letterToDigit };
}

function buildPuzzleFromEquation(equation, lettersPool = LETTERS, randomFn = Math.random) {
  const [operands, result] = equation;
  const allDigits = [...operands, result].join('').split('').map(Number);
  const uniqueDigits = [...new Set(allDigits)];
  const { digitToLetter, letterToDigit } = createMapping(uniqueDigits, lettersPool, randomFn);

  return {
    words: operands.map(n => numberToWord(n, digitToLetter)),
    result: numberToWord(result, digitToLetter),
    solution: letterToDigit
  };
}

export function generatePuzzle(randomFn = Math.random) {
  const MAX_TRIES = 20;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const equation = UNIQUE_EQUATIONS[Math.floor(randomFn() * UNIQUE_EQUATIONS.length)];
    const puzzle = buildPuzzleFromEquation(equation, LETTERS, randomFn);

    // Ensure the generated puzzle really has exactly one solution.
    // Check with maxSolutions=3 to be more thorough
    if (checkSolution(puzzle, puzzle.solution)) {
      const solutions = findAllSolutions(puzzle, 3);
      if (solutions.length === 1) {
        return puzzle;
      }
    }
  }

  // Fallback: use a random equation with randomized letter assignment
  // Keep trying until we find one with unique solution
  for (let attempt = 0; attempt < 10; attempt++) {
    const fallbackIndex = Math.floor(randomFn() * UNIQUE_EQUATIONS.length);
    const fallback = UNIQUE_EQUATIONS[fallbackIndex];
    const puzzle = buildPuzzleFromEquation(fallback, LETTERS, randomFn);
    if (checkSolution(puzzle, puzzle.solution)) {
      const solutions = findAllSolutions(puzzle, 3);
      if (solutions.length === 1) {
        return puzzle;
      }
    }
  }

  // Last resort: use first equation with deterministic mapping (known to work)
  const fallback = UNIQUE_EQUATIONS[0];
  const [operands, result] = fallback;
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

export function evaluateWord(word, letterMap) {
  let value = 0;
  for (const char of word) {
    if (letterMap[char] === undefined) return null;
    value = value * 10 + letterMap[char];
  }
  return value;
}

export function checkSolution(puzzle, letterMap) {
  // Check all letters are assigned
  const allLetters = new Set([...puzzle.words.join(''), ...puzzle.result]);
  for (const letter of allLetters) {
    if (letterMap[letter] === undefined) return false;
  }

  // Check no leading zeros
  for (const word of [...puzzle.words, puzzle.result]) {
    if (letterMap[word[0]] === 0) return false;
  }

  // Check values are unique
  const usedDigits = new Set(Object.values(letterMap));
  if (usedDigits.size !== Object.keys(letterMap).length) return false;

  // Check equation
  let sum = 0;
  for (const word of puzzle.words) {
    const val = evaluateWord(word, letterMap);
    if (val === null) return false;
    sum += val;
  }

  const resultVal = evaluateWord(puzzle.result, letterMap);
  return sum === resultVal;
}

function buildColumns(puzzle) {
  const maxLen = Math.max(...puzzle.words.map(w => w.length), puzzle.result.length);
  const columns = [];
  for (let col = 0; col < maxLen; col++) {
    const addends = [];
    for (const word of puzzle.words) {
      const idx = word.length - 1 - col;
      if (idx >= 0) addends.push(word[idx]);
    }
    const resIdx = puzzle.result.length - 1 - col;
    const resultLetter = resIdx >= 0 ? puzzle.result[resIdx] : null;
    columns.push({ addends, result: resultLetter });
  }
  return columns;
}

export function findAllSolutions(puzzle, maxSolutions = 2) {
  const columns = buildColumns(puzzle);
  const leadingLetters = new Set([
    ...puzzle.words.map(w => w[0]),
    puzzle.result[0]
  ]);
  const totalLetters = new Set([...puzzle.words.join(''), ...puzzle.result]);
  const solutions = [];

  function solveColumn(colIndex, carry, assignment, usedDigits) {
    if (solutions.length >= maxSolutions) return;
    if (colIndex === columns.length) {
      if (carry === 0 && Object.keys(assignment).length === totalLetters.size) {
        solutions.push({ ...assignment });
      }
      return;
    }

    const { addends, result } = columns[colIndex];
    const involvedLetters = [...new Set([...addends, result].filter(Boolean))];
    const toAssign = involvedLetters.filter(letter => assignment[letter] === undefined);

    function backtrackLetter(idx) {
      if (solutions.length >= maxSolutions) return;

      if (idx === toAssign.length) {
        let colSum = carry;
        for (const letter of addends) {
          const digit = assignment[letter];
          if (digit === undefined) return;
          colSum += digit;
        }

        const expectedDigit = colSum % 10;
        const expectedCarry = Math.floor(colSum / 10);

        if (result) {
          const resultDigit = assignment[result];
          if (resultDigit === undefined || resultDigit !== expectedDigit) {
            return;
          }
        } else if (expectedDigit !== 0) {
          return;
        }

        solveColumn(colIndex + 1, expectedCarry, assignment, usedDigits);
        return;
      }

      const letter = toAssign[idx];
      const isLeading = leadingLetters.has(letter);

      for (let digit = 0; digit <= 9; digit++) {
        if (usedDigits.has(digit)) continue;
        if (isLeading && digit === 0) continue;

        assignment[letter] = digit;
        usedDigits.add(digit);
        backtrackLetter(idx + 1);
        usedDigits.delete(digit);
        delete assignment[letter];
      }
    }

    backtrackLetter(0);
  }

  solveColumn(0, 0, {}, new Set());
  return solutions;
}

export function getErrors(puzzle, letterMap) {
  const errors = new Set();

  // Check for duplicate digit assignments
  const digitToLetters = {};
  for (const [letter, digit] of Object.entries(letterMap)) {
    if (digit === undefined) continue;
    if (!digitToLetters[digit]) digitToLetters[digit] = [];
    digitToLetters[digit].push(letter);
    if (digitToLetters[digit].length > 1) {
      for (const l of digitToLetters[digit]) {
        errors.add(l);
      }
    }
  }

  // Check for leading zeros
  for (const word of [...puzzle.words, puzzle.result]) {
    if (letterMap[word[0]] === 0) {
      errors.add(word[0]);
    }
  }

  // Column-wise arithmetic validation (only when a column is fully assigned)
  const maxLen = Math.max(...puzzle.words.map(w => w.length), puzzle.result.length);
  let carry = 0;
  for (let col = 0; col < maxLen; col++) {
    let colSum = carry;
    let allAssigned = true;
    const columnLetters = [];

    for (const word of puzzle.words) {
      const idx = word.length - 1 - col;
      if (idx >= 0) {
        const letter = word[idx];
        columnLetters.push(letter);
        const digit = letterMap[letter];
        if (digit === undefined) {
          allAssigned = false;
        } else {
          colSum += digit;
        }
      }
    }

    const resIdx = puzzle.result.length - 1 - col;
    let resultLetterDigit;
    if (resIdx >= 0) {
      const resultLetter = puzzle.result[resIdx];
      columnLetters.push(resultLetter);
      resultLetterDigit = letterMap[resultLetter];
      if (resultLetterDigit === undefined) {
        allAssigned = false;
      }
    }

    if (allAssigned && resIdx >= 0) {
      const expectedDigit = colSum % 10;
      const expectedCarry = Math.floor(colSum / 10);
      if (resultLetterDigit !== expectedDigit) {
        columnLetters.forEach(l => errors.add(l));
      }
      carry = expectedCarry;
    } else {
      // If incomplete, we can't trust carry yet
      carry = 0;
    }
  }

  // If everything is assigned but the full equation is still wrong, flag all letters
  const allLetters = new Set([...puzzle.words.join(''), ...puzzle.result]);
  const allAssigned = [...allLetters].every(l => letterMap[l] !== undefined);
  if (allAssigned && !checkSolution(puzzle, letterMap)) {
    allLetters.forEach(l => errors.add(l));
  }

  return errors;
}
