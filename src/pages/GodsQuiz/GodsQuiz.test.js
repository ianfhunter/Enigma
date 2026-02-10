import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import {
  buildDomainOptions,
  evaluateDomains,
  filterGodsByMythology,
  getRoundInitSignature,
  shouldDisableClearSelection,
} from './GodsQuiz.jsx';

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

describe('GodsQuiz - domain option builder', () => {
  it('includes all correct domains and fills to the requested size', () => {
    const allDomains = ['sky', 'thunder', 'justice', 'war', 'sea', 'love', 'hunt'];
    const correct = ['sky', 'thunder'];
    const random = createSeededRandom(123);
    const options = buildDomainOptions(allDomains, correct, 5, random);
    expect(options.length).toBe(5);
    expect(options).toEqual(expect.arrayContaining(correct));
    expect(new Set(options).size).toBe(options.length);
  });

  it('returns all correct domains if they exceed the target count', () => {
    const allDomains = ['sky', 'thunder', 'justice', 'war', 'sea'];
    const correct = ['sky', 'thunder', 'justice', 'war', 'sea', 'underworld'];
    const random = createSeededRandom(42);
    const options = buildDomainOptions(allDomains, correct, 4, random);
    expect(options.length).toBe(correct.length);
    expect(options).toEqual(expect.arrayContaining(correct));
  });

  it('handles missing domain pools gracefully', () => {
    const correct = ['sky', 'thunder'];
    const random = createSeededRandom(7);
    const options = buildDomainOptions(undefined, correct, 5, random);
    expect(options).toEqual(expect.arrayContaining(correct));
    expect(new Set(options).size).toBe(options.length);
  });
});

describe('GodsQuiz - round init signature', () => {
  it('changes when seed changes', () => {
    expect(getRoundInitSignature(1, 'all', 10)).not.toBe(getRoundInitSignature(2, 'all', 10));
  });

  it('changes when mythology changes', () => {
    expect(getRoundInitSignature(1, 'Greek', 10)).not.toBe(getRoundInitSignature(1, 'Norse', 10));
  });

  it('changes when available gods length changes', () => {
    expect(getRoundInitSignature(1, 'all', 10)).not.toBe(getRoundInitSignature(1, 'all', 11));
  });
});

describe('GodsQuiz - clear selection disable state', () => {
  it('disables clear when nothing is selected', () => {
    expect(shouldDisableClearSelection(0, null)).toBe(true);
  });

  it('disables clear after answer is submitted', () => {
    expect(shouldDisableClearSelection(2, { correct: true })).toBe(true);
  });

  it('enables clear when there are selections and no result yet', () => {
    expect(shouldDisableClearSelection(3, null)).toBe(false);
  });
});
