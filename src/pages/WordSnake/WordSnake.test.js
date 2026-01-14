import { describe, it, expect, vi } from 'vitest';
import { getWordPool, generateSnakePath, generatePuzzle } from './WordSnake.jsx';

describe('WordSnake - helpers', () => {
  it('returns word pool', () => {
    expect(getWordPool().length).toBeGreaterThan(0);
  });

  it('generateSnakePath builds path covering word', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const res = generateSnakePath('SNAKE', 5);
    rand.mockRestore();
    expect(res.path.length).toBe(5);
    expect(res.grid.length).toBe(5);
  });

  it('generatePuzzle returns grid/path/word', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generatePuzzle();
    rand.mockRestore();
    expect(puz.word.length).toBeGreaterThan(0);
    expect(puz.grid.length).toBeGreaterThan(0);
  });
});
