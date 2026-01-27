import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import { getWordPool, generateSnakePath, generatePuzzle } from './WordSnake.jsx';

describe('WordSnake - helpers', () => {
  it('returns word pool', () => {
    expect(getWordPool().length).toBeGreaterThan(0);
  });

  it('generateSnakePath builds path covering word', () => {
    const random = createSeededRandom(12345);
    const res = generateSnakePath('SNAKE', 5, random);
    expect(res.path.length).toBe(5);
    expect(res.grid.length).toBe(5);
  });

  it('generatePuzzle returns grid/path/word', () => {
    const seed = 12345;
    const puz = generatePuzzle(seed);
    expect(puz.word.length).toBeGreaterThan(0);
    expect(puz.grid.length).toBeGreaterThan(0);
  });
});
