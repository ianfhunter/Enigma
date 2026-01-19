import { describe, it, expect } from 'vitest';

// ===========================================
// MemorizeItems - Item Shuffling Tests
// ===========================================
describe('MemorizeItems - Item Shuffling', () => {
  function shuffleArray(array, random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  it('should preserve all items', () => {
    const items = [1, 2, 3, 4, 5];
    const random = createSeededRandom(12345);
    const shuffled = shuffleArray(items, random);

    expect(shuffled.length).toBe(items.length);
    for (const item of items) {
      expect(shuffled).toContain(item);
    }
  });

  it('should be deterministic with same seed', () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled1 = shuffleArray(items, createSeededRandom(12345));
    const shuffled2 = shuffleArray(items, createSeededRandom(12345));

    expect(shuffled1).toEqual(shuffled2);
  });

  it('should not modify original array', () => {
    const items = [1, 2, 3, 4, 5];
    const original = [...items];
    const random = createSeededRandom(12345);
    shuffleArray(items, random);

    expect(items).toEqual(original);
  });
});

// ===========================================
// MemorizeItems - Answer Checking Tests
// ===========================================
describe('MemorizeItems - Answer Checking', () => {
  function checkAnswer(userOrder, correctOrder) {
    if (userOrder.length !== correctOrder.length) return false;
    return userOrder.every((item, idx) => item === correctOrder[idx]);
  }

  it('should accept correct order', () => {
    const correct = ['apple', 'banana', 'cherry'];
    const user = ['apple', 'banana', 'cherry'];
    expect(checkAnswer(user, correct)).toBe(true);
  });

  it('should reject wrong order', () => {
    const correct = ['apple', 'banana', 'cherry'];
    const user = ['banana', 'apple', 'cherry'];
    expect(checkAnswer(user, correct)).toBe(false);
  });

  it('should reject incomplete answer', () => {
    const correct = ['apple', 'banana', 'cherry'];
    const user = ['apple', 'banana'];
    expect(checkAnswer(user, correct)).toBe(false);
  });
});

// ===========================================
// MemorizeItems - Score Calculation Tests
// ===========================================
describe('MemorizeItems - Score Calculation', () => {
  function calculateScore(correctCount, itemCount, timeBonus = 0) {
    return correctCount * 10 + timeBonus;
  }

  it('should calculate base score', () => {
    expect(calculateScore(5, 5)).toBe(50);
    expect(calculateScore(3, 5)).toBe(30);
  });

  it('should add time bonus', () => {
    expect(calculateScore(5, 5, 20)).toBe(70);
  });
});

// ===========================================
// MemorizeItems - Difficulty Scaling Tests
// ===========================================
describe('MemorizeItems - Difficulty Scaling', () => {
  const DIFFICULTIES = {
    easy: { itemCount: 5, showTime: 5000 },
    medium: { itemCount: 8, showTime: 8000 },
    hard: { itemCount: 12, showTime: 10000 },
  };

  it('should have increasing item counts', () => {
    expect(DIFFICULTIES.easy.itemCount).toBeLessThan(DIFFICULTIES.medium.itemCount);
    expect(DIFFICULTIES.medium.itemCount).toBeLessThan(DIFFICULTIES.hard.itemCount);
  });

  it('should have appropriate show times', () => {
    // Show time should scale with item count
    const easyRatio = DIFFICULTIES.easy.showTime / DIFFICULTIES.easy.itemCount;
    const mediumRatio = DIFFICULTIES.medium.showTime / DIFFICULTIES.medium.itemCount;
    const hardRatio = DIFFICULTIES.hard.showTime / DIFFICULTIES.hard.itemCount;

    // All should have at least 800ms per item
    expect(easyRatio).toBeGreaterThanOrEqual(800);
    expect(mediumRatio).toBeGreaterThanOrEqual(800);
    expect(hardRatio).toBeGreaterThanOrEqual(800);
  });
});

// ===========================================
// MemorizeItems - Progress Tracking Tests
// ===========================================
describe('MemorizeItems - Progress Tracking', () => {
  function calculateProgress(currentIndex, totalItems) {
    return Math.round((currentIndex / totalItems) * 100);
  }

  it('should calculate progress percentage', () => {
    expect(calculateProgress(0, 10)).toBe(0);
    expect(calculateProgress(5, 10)).toBe(50);
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it('should round progress values', () => {
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(2, 3)).toBe(67);
  });
});

// ===========================================
// MemorizeItems - Item Selection Tests
// ===========================================
describe('MemorizeItems - Item Selection', () => {
  function selectItems(allItems, count, random) {
    const shuffled = [...allItems].sort(() => random() - 0.5);
    return shuffled.slice(0, count);
  }

  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  it('should select correct number of items', () => {
    const allItems = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const random = createSeededRandom(12345);
    const selected = selectItems(allItems, 5, random);

    expect(selected.length).toBe(5);
  });

  it('should not select duplicates', () => {
    const allItems = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const random = createSeededRandom(12345);
    const selected = selectItems(allItems, 5, random);

    const unique = new Set(selected);
    expect(unique.size).toBe(5);
  });
});
