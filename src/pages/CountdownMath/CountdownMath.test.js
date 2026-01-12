import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffleArray,
} from '../../data/wordUtils';

// ===========================================
// Countdown Math - Number Generation Tests
// ===========================================
describe('Countdown Math - Number Generation', () => {
  const LARGE_NUMBERS = [25, 50, 75, 100];
  const SMALL_NUMBERS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

  const generateNumbers = (numLarge, random) => {
    const large = seededShuffleArray([...LARGE_NUMBERS], random).slice(0, numLarge);
    const small = seededShuffleArray([...SMALL_NUMBERS], random).slice(0, 6 - numLarge);

    return [...large, ...small];
  };

  it('should generate exactly 6 numbers', () => {
    const random = createSeededRandom(12345);
    const numbers = generateNumbers(2, random);

    expect(numbers.length).toBe(6);
  });

  it('should generate correct number of large numbers', () => {
    const random = createSeededRandom(12345);
    const numbers = generateNumbers(2, random);

    const largeCount = numbers.filter(n => LARGE_NUMBERS.includes(n)).length;
    expect(largeCount).toBeLessThanOrEqual(2);
  });

  it('should generate valid large numbers', () => {
    const random = createSeededRandom(12345);
    const numbers = generateNumbers(4, random);

    const largeInResult = numbers.filter(n => LARGE_NUMBERS.includes(n));
    largeInResult.forEach(n => {
      expect(LARGE_NUMBERS).toContain(n);
    });
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const numbers1 = generateNumbers(2, random1);
    const numbers2 = generateNumbers(2, random2);

    expect(numbers1).toEqual(numbers2);
  });
});

// ===========================================
// Countdown Math - Target Generation Tests
// ===========================================
describe('Countdown Math - Target Generation', () => {
  const generateTarget = (min, max, random) => {
    return Math.floor(random() * (max - min + 1)) + min;
  };

  it('should generate target within range', () => {
    const random = createSeededRandom(12345);
    const target = generateTarget(100, 999, random);

    expect(target).toBeGreaterThanOrEqual(100);
    expect(target).toBeLessThanOrEqual(999);
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const target1 = generateTarget(100, 999, random1);
    const target2 = generateTarget(100, 999, random2);

    expect(target1).toBe(target2);
  });

  it('should generate different targets with different seeds', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const target1 = generateTarget(100, 999, random1);
    const target2 = generateTarget(100, 999, random2);

    expect(target1).not.toBe(target2);
  });
});

// ===========================================
// Countdown Math - Operation Validation Tests
// ===========================================
describe('Countdown Math - Operation Validation', () => {
  const isValidOperation = (a, b, op) => {
    if (a <= 0 || b <= 0) return false;

    switch (op) {
      case '+':
        return true;
      case '-':
        return a > b; // Result must be positive
      case '*':
        return true;
      case '/':
        return b !== 0 && a % b === 0; // Must divide evenly
      default:
        return false;
    }
  };

  const performOperation = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return null;
    }
  };

  it('should allow addition', () => {
    expect(isValidOperation(5, 3, '+')).toBe(true);
    expect(performOperation(5, 3, '+')).toBe(8);
  });

  it('should only allow subtraction with positive result', () => {
    expect(isValidOperation(5, 3, '-')).toBe(true);
    expect(isValidOperation(3, 5, '-')).toBe(false);
    expect(performOperation(5, 3, '-')).toBe(2);
  });

  it('should allow multiplication', () => {
    expect(isValidOperation(5, 3, '*')).toBe(true);
    expect(performOperation(5, 3, '*')).toBe(15);
  });

  it('should only allow division with even result', () => {
    expect(isValidOperation(6, 3, '/')).toBe(true);
    expect(isValidOperation(7, 3, '/')).toBe(false);
    expect(performOperation(6, 3, '/')).toBe(2);
  });

  it('should reject division by zero', () => {
    expect(isValidOperation(6, 0, '/')).toBe(false);
  });

  it('should reject operations on non-positive numbers', () => {
    expect(isValidOperation(0, 3, '+')).toBe(false);
    expect(isValidOperation(-1, 3, '+')).toBe(false);
  });
});

// ===========================================
// Countdown Math - Expression Evaluation Tests
// ===========================================
describe('Countdown Math - Expression Evaluation', () => {
  const evaluateExpression = (expression) => {
    try {
      // Parse and evaluate simple expressions
      // This is simplified - real implementation would use proper parsing
      const result = Function(`"use strict"; return (${expression})`)();

      if (!Number.isInteger(result) || result <= 0) return null;
      return result;
    } catch {
      return null;
    }
  };

  it('should evaluate simple addition', () => {
    expect(evaluateExpression('5 + 3')).toBe(8);
  });

  it('should evaluate with parentheses', () => {
    expect(evaluateExpression('(5 + 3) * 2')).toBe(16);
  });

  it('should return null for non-integer result', () => {
    expect(evaluateExpression('7 / 3')).toBeNull();
  });

  it('should return null for negative result', () => {
    expect(evaluateExpression('3 - 5')).toBeNull();
  });
});

// ===========================================
// Countdown Math - Solution Validation Tests
// ===========================================
describe('Countdown Math - Solution Validation', () => {
  const validateSolution = (numbers, usedNumbers, target, result) => {
    // Check all used numbers are from the available set
    const availableCounts = {};
    numbers.forEach(n => {
      availableCounts[n] = (availableCounts[n] || 0) + 1;
    });

    const usedCounts = {};
    usedNumbers.forEach(n => {
      usedCounts[n] = (usedCounts[n] || 0) + 1;
    });

    for (const [num, count] of Object.entries(usedCounts)) {
      if ((availableCounts[num] || 0) < count) {
        return { valid: false, error: 'Used number not available' };
      }
    }

    // Check result matches target
    if (result !== target) {
      return { valid: false, difference: Math.abs(result - target) };
    }

    return { valid: true };
  };

  it('should validate correct solution', () => {
    const numbers = [25, 50, 75, 100, 3, 6];
    const usedNumbers = [100, 3];
    const target = 303;
    const result = 303; // 100 * 3 + 3 = 303

    const validation = validateSolution(numbers, usedNumbers, target, result);
    expect(validation.valid).toBe(true);
  });

  it('should reject using unavailable numbers', () => {
    const numbers = [25, 50, 75, 100, 3, 6];
    const usedNumbers = [100, 7]; // 7 not available
    const target = 700;
    const result = 700;

    const validation = validateSolution(numbers, usedNumbers, target, result);
    expect(validation.valid).toBe(false);
  });

  it('should reject using number more times than available', () => {
    const numbers = [25, 50, 75, 100, 3, 6];
    const usedNumbers = [3, 3, 3]; // Only have two 3s
    const target = 9;
    const result = 9;

    const validation = validateSolution(numbers, usedNumbers, target, result);
    expect(validation.valid).toBe(false);
  });

  it('should calculate difference for near solutions', () => {
    const numbers = [25, 50, 75, 100, 3, 6];
    const usedNumbers = [100, 3];
    const target = 305;
    const result = 303;

    const validation = validateSolution(numbers, usedNumbers, target, result);
    expect(validation.valid).toBe(false);
    expect(validation.difference).toBe(2);
  });
});

// ===========================================
// Countdown Math - Scoring Tests
// ===========================================
describe('Countdown Math - Scoring', () => {
  const calculateScore = (difference) => {
    if (difference === 0) return 10; // Exact
    if (difference <= 5) return 7;
    if (difference <= 10) return 5;
    return 0;
  };

  it('should give 10 points for exact match', () => {
    expect(calculateScore(0)).toBe(10);
  });

  it('should give 7 points for within 5', () => {
    expect(calculateScore(1)).toBe(7);
    expect(calculateScore(5)).toBe(7);
  });

  it('should give 5 points for within 10', () => {
    expect(calculateScore(6)).toBe(5);
    expect(calculateScore(10)).toBe(5);
  });

  it('should give 0 points for more than 10 away', () => {
    expect(calculateScore(11)).toBe(0);
    expect(calculateScore(100)).toBe(0);
  });
});

// ===========================================
// Countdown Math - Timer Tests
// ===========================================
describe('Countdown Math - Timer', () => {
  const COUNTDOWN_TIME = 30; // seconds

  const formatCountdown = (seconds) => {
    return `0:${String(seconds).padStart(2, '0')}`;
  };

  it('should format countdown correctly', () => {
    expect(formatCountdown(30)).toBe('0:30');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('should have standard countdown time', () => {
    expect(COUNTDOWN_TIME).toBe(30);
  });
});
