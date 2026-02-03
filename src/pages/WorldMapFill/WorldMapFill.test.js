import { describe, it, expect } from 'vitest';
import { MICRONATIONS, REGIONS } from './WorldMapFill.jsx';
import { countries } from '@datasets/countries';

describe('WorldMapFill - helpers', () => {
  it('exposes micronations and regions', () => {
    expect(MICRONATIONS.length).toBeGreaterThan(0);
    expect(REGIONS.world.viewBox).toBeDefined();
  });

  it('region filters countries correctly', () => {
    const europeCodes = new Set(REGIONS.europe.countries);
    const filtered = countries.filter(c => europeCodes.has(c.code));
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('includes Greenland in the country list', () => {
    const greenland = countries.find(c => c.code === 'GL');
    expect(greenland).toEqual({
      code: 'GL',
      name: 'Greenland',
      flag: '🇬🇱',
    });
  });

  it('covers all region codes in the country list', () => {
    const countryCodes = new Set(countries.map(country => country.code));
    const missing = Object.values(REGIONS)
      .flatMap(region => region.countries ?? [])
      .filter(code => !countryCodes.has(code));
    expect(missing).toEqual([]);
  });
});
