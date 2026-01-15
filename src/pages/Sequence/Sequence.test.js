import { describe, it, expect } from 'vitest';
import { COLORS, FREQUENCIES, SPEEDS } from './Sequence.constants';

describe('Sequence - metadata', () => {
  it('exposes colors and frequencies', () => {
    expect(COLORS).toEqual(['green', 'red', 'yellow', 'blue']);
    expect(FREQUENCIES.green).toBeCloseTo(329.63);
  });

  it('defines speed presets', () => {
    expect(Object.keys(SPEEDS)).toEqual(['slow', 'normal', 'fast']);
    expect(SPEEDS.normal.show).toBeGreaterThan(0);
    expect(SPEEDS.fast.gap).toBeLessThan(SPEEDS.slow.gap);
  });
});
