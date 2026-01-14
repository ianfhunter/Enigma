import { describe, it, expect } from 'vitest';
import { REGION_OPTIONS, buildLookup, getRegionCode } from './ProvincialMapFill.jsx';

describe('ProvincialMapFill - helpers', () => {
  it('exposes region options', () => {
    expect(Array.isArray(REGION_OPTIONS)).toBe(true);
    expect(REGION_OPTIONS.length).toBeGreaterThan(0);
  });

  it('buildLookup maps names to codes', () => {
    const region = {
      regions: [
        { code: 'X1', name: 'Alpha' },
        { code: 'X2', name: 'Beta' },
      ],
      alternateNames: { 'alpha province': 'X1' },
    };
    const lookup = buildLookup(region);
    expect(lookup['alpha']).toBe('X1');
    expect(lookup['alpha province']).toBe('X1');
    expect(getRegionCode('Beta', lookup)).toBe('X2');
  });
});
