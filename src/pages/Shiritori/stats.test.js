import { describe, expect, it } from 'vitest';
import { loadStats, recordLongestChain } from './stats';

describe('Shiritori stats helpers - loadStats', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadStats(null)).toEqual({ longestChain: 0 });
  });

  it('keeps only the longestChain when legacy fields exist', () => {
    const legacy = JSON.stringify({ wins: 4, losses: 2, longestChain: 9 });
    expect(loadStats(legacy)).toEqual({ longestChain: 9 });
  });

  it('falls back to defaults on invalid data', () => {
    expect(loadStats('{not-json')).toEqual({ longestChain: 0 });
    expect(loadStats(JSON.stringify('not an object'))).toEqual({ longestChain: 0 });
  });
});

describe('Shiritori stats helpers - recordLongestChain', () => {
  it('updates when a longer chain is recorded', () => {
    expect(recordLongestChain({ longestChain: 3 }, 7)).toEqual({ longestChain: 7 });
  });

  it('ignores shorter chains', () => {
    expect(recordLongestChain({ longestChain: 10 }, 4)).toEqual({ longestChain: 10 });
  });

  it('handles missing or invalid stats safely', () => {
    expect(recordLongestChain(undefined, 5)).toEqual({ longestChain: 5 });
    expect(recordLongestChain({ longestChain: 'x' }, 2)).toEqual({ longestChain: 2 });
  });
});
