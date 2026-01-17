import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSeededRNG,
  seededShuffle,
  seededChoice,
  seededSample,
  seededInt,
  seededFloat,
  seededBool,
  getTodaysSeed,
  getSeedForDate,
  hashString,
  generateRandomSeed,
  seededGrid,
} from './seeding';

describe('seeding utilities', () => {
  describe('createSeededRNG', () => {
    it('produces deterministic sequence for same seed', () => {
      const rng1 = createSeededRNG(12345);
      const rng2 = createSeededRNG(12345);

      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = createSeededRNG(12345);
      const rng2 = createSeededRNG(54321);

      const val1 = rng1();
      const val2 = rng2();

      expect(val1).not.toBe(val2);
    });

    it('produces values between 0 and 1', () => {
      const rng = createSeededRNG(42);

      for (let i = 0; i < 1000; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('handles seed of 0', () => {
      const rng = createSeededRNG(0);
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });

    it('handles negative seeds', () => {
      const rng1 = createSeededRNG(-12345);
      const rng2 = createSeededRNG(12345);

      // Should produce same results for absolute value
      expect(rng1()).toBe(rng2());
    });
  });

  describe('seededShuffle', () => {
    it('produces same shuffle for same seed', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const shuffled1 = seededShuffle(array, 12345);
      const shuffled2 = seededShuffle(array, 12345);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('produces different shuffles for different seeds', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const shuffled1 = seededShuffle(array, 12345);
      const shuffled2 = seededShuffle(array, 54321);

      expect(shuffled1).not.toEqual(shuffled2);
    });

    it('does not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];

      seededShuffle(original, 12345);

      expect(original).toEqual(copy);
    });

    it('preserves all elements', () => {
      const array = [1, 2, 3, 4, 5];
      const shuffled = seededShuffle(array, 12345);

      expect(shuffled.sort()).toEqual(array.sort());
    });

    it('works with RNG function', () => {
      const rng = createSeededRNG(12345);
      const array = [1, 2, 3, 4, 5];

      const shuffled1 = seededShuffle(array, rng);

      // Create new RNG with same seed
      const rng2 = createSeededRNG(12345);
      const shuffled2 = seededShuffle(array, rng2);

      expect(shuffled1).toEqual(shuffled2);
    });
  });

  describe('seededChoice', () => {
    it('picks same element for same seed', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];

      const choice1 = seededChoice(array, 12345);
      const choice2 = seededChoice(array, 12345);

      expect(choice1).toBe(choice2);
    });

    it('picks different elements for different seeds', () => {
      const array = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

      // With enough different seeds, we should get different choices
      const choices = new Set();
      for (let seed = 0; seed < 100; seed++) {
        choices.add(seededChoice(array, seed));
      }

      expect(choices.size).toBeGreaterThan(1);
    });

    it('returns undefined for empty array', () => {
      expect(seededChoice([], 12345)).toBeUndefined();
    });

    it('returns the only element for single-element array', () => {
      expect(seededChoice(['only'], 12345)).toBe('only');
    });
  });

  describe('seededSample', () => {
    it('returns correct number of elements', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sample = seededSample(array, 3, 12345);

      expect(sample).toHaveLength(3);
    });

    it('returns unique elements', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sample = seededSample(array, 5, 12345);

      const unique = new Set(sample);
      expect(unique.size).toBe(5);
    });

    it('returns same sample for same seed', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const sample1 = seededSample(array, 4, 12345);
      const sample2 = seededSample(array, 4, 12345);

      expect(sample1).toEqual(sample2);
    });

    it('returns all elements when count >= length', () => {
      const array = [1, 2, 3];
      const sample = seededSample(array, 5, 12345);

      expect(sample.sort()).toEqual([1, 2, 3]);
    });
  });

  describe('seededInt', () => {
    it('produces same value for same seed', () => {
      const val1 = seededInt(1, 100, 12345);
      const val2 = seededInt(1, 100, 12345);

      expect(val1).toBe(val2);
    });

    it('produces values within range', () => {
      const rng = createSeededRNG(42);

      for (let i = 0; i < 1000; i++) {
        const val = seededInt(10, 20, rng);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(20);
      }
    });

    it('can produce min and max values', () => {
      const values = new Set();
      for (let seed = 0; seed < 1000; seed++) {
        values.add(seededInt(1, 3, seed));
      }

      expect(values.has(1)).toBe(true);
      expect(values.has(2)).toBe(true);
      expect(values.has(3)).toBe(true);
    });
  });

  describe('seededFloat', () => {
    it('produces same value for same seed', () => {
      const val1 = seededFloat(0, 10, 12345);
      const val2 = seededFloat(0, 10, 12345);

      expect(val1).toBe(val2);
    });

    it('produces values within range', () => {
      const rng = createSeededRNG(42);

      for (let i = 0; i < 100; i++) {
        const val = seededFloat(5.5, 10.5, rng);
        expect(val).toBeGreaterThanOrEqual(5.5);
        expect(val).toBeLessThan(10.5);
      }
    });
  });

  describe('seededBool', () => {
    it('produces same value for same seed', () => {
      const val1 = seededBool(12345);
      const val2 = seededBool(12345);

      expect(val1).toBe(val2);
    });

    it('produces both true and false across seeds', () => {
      const values = new Set();
      for (let seed = 0; seed < 100; seed++) {
        values.add(seededBool(seed));
      }

      expect(values.has(true)).toBe(true);
      expect(values.has(false)).toBe(true);
    });

    it('respects probability parameter', () => {
      const rng = createSeededRNG(42);
      let trueCount = 0;

      for (let i = 0; i < 1000; i++) {
        if (seededBool(rng, 0.8)) trueCount++;
      }

      // With 80% probability, expect roughly 800 trues (allow some variance)
      expect(trueCount).toBeGreaterThan(700);
      expect(trueCount).toBeLessThan(900);
    });
  });

  describe('getTodaysSeed and getSeedForDate', () => {
    it('getTodaysSeed returns same value for same game ID', () => {
      const seed1 = getTodaysSeed('test-game');
      const seed2 = getTodaysSeed('test-game');

      expect(seed1).toBe(seed2);
    });

    it('getTodaysSeed returns different values for different game IDs', () => {
      const seed1 = getTodaysSeed('game-a');
      const seed2 = getTodaysSeed('game-b');

      expect(seed1).not.toBe(seed2);
    });

    it('getSeedForDate returns same value for same date and game', () => {
      const seed1 = getSeedForDate('2024-01-15', 'test-game');
      const seed2 = getSeedForDate('2024-01-15', 'test-game');

      expect(seed1).toBe(seed2);
    });

    it('getSeedForDate returns different values for different dates', () => {
      const seed1 = getSeedForDate('2024-01-15', 'test-game');
      const seed2 = getSeedForDate('2024-01-16', 'test-game');

      expect(seed1).not.toBe(seed2);
    });

    it('getSeedForDate accepts Date objects', () => {
      const date = new Date('2024-06-15');
      const seed1 = getSeedForDate(date, 'test-game');
      const seed2 = getSeedForDate('2024-06-15', 'test-game');

      expect(seed1).toBe(seed2);
    });
  });

  describe('hashString', () => {
    it('produces same hash for same string', () => {
      const hash1 = hashString('hello world');
      const hash2 = hashString('hello world');

      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different strings', () => {
      const hash1 = hashString('hello');
      const hash2 = hashString('world');

      expect(hash1).not.toBe(hash2);
    });

    it('produces positive integers', () => {
      const strings = ['test', '', 'a', 'longer string with spaces', '12345'];

      for (const str of strings) {
        const hash = hashString(str);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(hash)).toBe(true);
      }
    });
  });

  describe('generateRandomSeed', () => {
    it('produces positive integers', () => {
      for (let i = 0; i < 100; i++) {
        const seed = generateRandomSeed();
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(2147483647);
        expect(Number.isInteger(seed)).toBe(true);
      }
    });

    it('produces varied values', () => {
      const seeds = new Set();
      for (let i = 0; i < 100; i++) {
        seeds.add(generateRandomSeed());
      }

      // Should have mostly unique values
      expect(seeds.size).toBeGreaterThan(90);
    });
  });

  describe('seededGrid', () => {
    it('produces same grid for same seed', () => {
      const values = ['a', 'b', 'c'];
      const grid1 = seededGrid(3, 3, values, 12345);
      const grid2 = seededGrid(3, 3, values, 12345);

      expect(grid1).toEqual(grid2);
    });

    it('produces grid of correct dimensions', () => {
      const grid = seededGrid(5, 3, [0, 1], 12345);

      expect(grid).toHaveLength(3);
      expect(grid[0]).toHaveLength(5);
      expect(grid[1]).toHaveLength(5);
      expect(grid[2]).toHaveLength(5);
    });

    it('only uses provided values', () => {
      const values = ['x', 'y'];
      const grid = seededGrid(10, 10, values, 12345);

      for (const row of grid) {
        for (const cell of row) {
          expect(values).toContain(cell);
        }
      }
    });
  });
});
