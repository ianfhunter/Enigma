import { describe, it, expect } from 'vitest';
import { getWordStatsForFilter, getWordStats, setCommonOnlyFilter } from './japaneseWords';

describe('japaneseWords stats', () => {
  it('returns consistent totals for common and all word filters', () => {
    const allStats = getWordStatsForFilter(false);
    const commonStats = getWordStatsForFilter(true);

    expect(allStats.total).toBeGreaterThan(0);
    expect(commonStats.common).toBeGreaterThan(0);
    expect(commonStats.common).toBeLessThan(allStats.total);
    expect(allStats.current).toBe(allStats.total);
    expect(commonStats.current).toBe(commonStats.common);
  });

  it('updates current counts when toggling the common-only filter', () => {
    setCommonOnlyFilter(false);
    const allStats = getWordStats();

    setCommonOnlyFilter(true);
    const commonStats = getWordStats();

    expect(commonStats.current).toBeLessThan(allStats.current);
    expect(commonStats.current).toBe(commonStats.common);
  });
});
