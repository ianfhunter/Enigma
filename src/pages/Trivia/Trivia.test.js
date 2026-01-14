import { describe, it, expect } from 'vitest';
import { parseTrivia, CATEGORIES, getAllTrivia, shuffle, TOTAL_ROUNDS } from './Trivia.jsx';

describe('Trivia - helpers', () => {
  it('parses trivia text', () => {
    const sample = `
#Q What is 2+2?
A 1
B 2
C 3
D 4
^ 4
`;
    const parsed = parseTrivia(sample, 'general');
    expect(parsed[0].question).toContain('2+2');
    expect(parsed[0].answer).toBe('4');
    expect(parsed[0].options.length).toBeGreaterThanOrEqual(2);
  });

  it('exposes categories and rounds', () => {
    expect(CATEGORIES.find(c => c.id === 'all')).toBeDefined();
    expect(TOTAL_ROUNDS).toBe(15);
  });

  it('getAllTrivia returns questions', () => {
    const all = getAllTrivia();
    expect(all.length).toBeGreaterThan(0);
  });

  it('shuffle preserves items', () => {
    const arr = [1, 2, 3];
    expect(shuffle(arr).sort()).toEqual(arr.sort());
  });
});
