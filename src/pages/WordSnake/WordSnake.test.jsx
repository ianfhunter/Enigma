import { describe, it, expect } from 'vitest';
import { getCommonWordsByLength } from '../../data/wordUtils';

describe('WordSnake word selection', () => {
  it('uses common words from dictionary (6-10 letters)', () => {
    // Verify that the word pool comes from dictionary
    const words6 = getCommonWordsByLength(6);
    const words7 = getCommonWordsByLength(7);
    const words8 = getCommonWordsByLength(8);
    const words9 = getCommonWordsByLength(9);
    const words10 = getCommonWordsByLength(10);

    // Should have words available
    const totalWords = words6.length + words7.length + words8.length + words9.length + words10.length;
    expect(totalWords).toBeGreaterThan(100); // Should have plenty of common words
  });

  it('only uses words between 6-10 letters', () => {
    // Verify word lengths
    for (let len = 6; len <= 10; len++) {
      const words = getCommonWordsByLength(len);
      expect(words.every(word => word.length === len)).toBe(true);
    }
  });

  it('all words in the pool are valid common words', () => {
    const allPoolWords = [];
    for (let len = 6; len <= 10; len++) {
      allPoolWords.push(...getCommonWordsByLength(len));
    }

    // All words should be uppercase
    expect(allPoolWords.every(word => /^[A-Z]+$/.test(word))).toBe(true);

    // Words should be distinct
    const uniqueWords = new Set(allPoolWords);
    expect(uniqueWords.size).toBe(allPoolWords.length);
  });
});
