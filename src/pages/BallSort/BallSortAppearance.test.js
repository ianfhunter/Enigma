import { describe, it, expect } from 'vitest';
import { getBallAppearance } from './BallSortAppearance';

describe('BallSortAppearance', () => {
  it('returns deterministic color/pattern per id', () => {
    expect(getBallAppearance(0)).toEqual({ color: '#ef4444', pattern: 'solid' });
    expect(getBallAppearance(1)).toEqual({ color: '#f97316', pattern: 'stripe' });
    expect(getBallAppearance(2)).toEqual({ color: '#eab308', pattern: 'dot' });
  });

  it('cycles patterns to increase distinguishability', () => {
    const appearances = Array.from({ length: 10 }, (_, i) => getBallAppearance(i));
    const uniquePatterns = new Set(appearances.map((a) => a.pattern));
    expect(uniquePatterns.size).toBeGreaterThan(3);
  });

  it('wraps color palette deterministically', () => {
    const a = getBallAppearance(0);
    const b = getBallAppearance(17);
    const c = getBallAppearance(34);
    expect(a.color).toBe(b.color);
    expect(a.color).toBe(c.color);
  });
});
