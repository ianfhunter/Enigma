import { describe, it, expect } from 'vitest';
import { evaluateDomains, filterGodsByMythology } from './GodsQuiz.jsx';

describe('GodsQuiz - domain evaluation', () => {
  const domains = ['sky', 'thunder', 'justice'];

  it('accepts exact matching sets regardless of order', () => {
    const guess = new Set(['justice', 'sky', 'thunder']);
    expect(evaluateDomains(domains, guess)).toBe(true);
  });

  it('rejects missing or extra domains', () => {
    expect(evaluateDomains(domains, new Set(['sky', 'thunder']))).toBe(false);
    expect(evaluateDomains(domains, new Set(['sky', 'thunder', 'justice', 'war']))).toBe(false);
  });

  it('rejects non-matching domains', () => {
    expect(evaluateDomains(domains, new Set(['sea', 'sky', 'thunder']))).toBe(false);
  });
});

describe('GodsQuiz - mythology filtering', () => {
  const sample = [
    { name: 'Zeus', mythology: 'Greek' },
    { name: 'Odin', mythology: 'Norse' },
    { name: 'Ra', mythology: 'Egyptian' },
  ];

  it('returns all gods when mythology is all', () => {
    const res = filterGodsByMythology(sample, 'all');
    expect(res.length).toBe(3);
  });

  it('filters by specific mythology', () => {
    const res = filterGodsByMythology(sample, 'Greek');
    expect(res).toEqual([{ name: 'Zeus', mythology: 'Greek' }]);
  });

  it('handles empty or missing data gracefully', () => {
    expect(filterGodsByMythology(undefined, 'Greek')).toEqual([]);
    expect(filterGodsByMythology([], 'Greek')).toEqual([]);
  });
});
