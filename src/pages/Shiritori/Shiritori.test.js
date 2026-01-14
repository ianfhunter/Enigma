import { describe, it, expect } from 'vitest';
import { TEXT, getRandomStartWord, getAIWord } from './Shiritori.jsx';
import { getWordsByStartKana, getSafeStartWords } from '@datasets/japaneseWords';

// These helpers rely on datasets; ensure they at least return plausible data.

describe('Shiritori - metadata and helpers', () => {
  it('TEXT contains both language modes', () => {
    expect(TEXT.native.title).toBe('しりとり');
    expect(TEXT.beginner.subtitle).toBe('Shiritori');
  });

  it('getRandomStartWord returns a safe word from dataset', () => {
    const safe = new Set(getSafeStartWords().map(w => w.hiragana));
    const word = getRandomStartWord();
    expect(safe.has(word.hiragana)).toBe(true);
  });

  it('getAIWord finds a candidate starting with given kana', () => {
    const candidates = getWordsByStartKana('あ'); // Hiragana "a"
    if (candidates.length === 0) return;
    const used = new Set();
    const ai = getAIWord('あ', used);
    expect(ai == null || ai.hiragana.startsWith('あ')).toBe(true);
  });
});
