import { describe, it, expect } from 'vitest';
import { wordCategories, categoryCount, totalWordCount } from './wordCategories';

const NEW_CATEGORY_IDS = [
  'musicalInstruments',
  'gemstones',
  'weather',
  'astronomy',
  'photography',
  'sewing',
  'bakingTerms',
  'martialArts',
  'currencies',
  'treeSpecies',
  'cloudTypes',
  'chessTerms',
  'circusActs',
  'poetryForms',
  'architectureStyles',
];

describe('wordCategories dataset additions', () => {
  it('includes newly added category ids', () => {
    NEW_CATEGORY_IDS.forEach((id) => {
      expect(wordCategories[id]).toBeDefined();
    });
  });

  it('new categories have valid structure and deterministic data quality', () => {
    NEW_CATEGORY_IDS.forEach((id) => {
      const category = wordCategories[id];

      expect(category.name).toBeTypeOf('string');
      expect([1, 2, 3, 4]).toContain(category.difficulty);
      expect(category.words.length).toBeGreaterThanOrEqual(16);

      const uniqueWords = new Set(category.words);
      expect(uniqueWords.size).toBe(category.words.length);

      category.words.forEach((word) => {
        expect(word).toMatch(/^[A-Z]+$/);
      });
    });
  });


  it('new categories minimize overlap with each other', () => {
    const seenWords = new Map();

    NEW_CATEGORY_IDS.forEach((id) => {
      wordCategories[id].words.forEach((word) => {
        const existing = seenWords.get(word);
        if (!existing) {
          seenWords.set(word, id);
        } else {
          throw new Error(`Word ${word} appears in both ${existing} and ${id}`);
        }
      });
    });
  });

  it('exports category and word totals that match the dataset', () => {
    expect(categoryCount).toBe(Object.keys(wordCategories).length);

    const calculatedWordCount = Object.values(wordCategories)
      .reduce((sum, category) => sum + category.words.length, 0);

    expect(totalWordCount).toBe(calculatedWordCount);
  });
});
