import { describe, it, expect, vi } from 'vitest';
import { buildRound } from './CapitalGuesser.jsx';

describe('CapitalGuesser - buildRound', () => {
  const countryDaily = { code: 'AAA', name: 'Aland' };
  const countryRandom = { code: 'BBB', name: 'Bermuda' };

  const deps = {
    getDailyCountry: vi.fn().mockReturnValue(countryDaily),
    getRandomCountry: vi.fn().mockReturnValue(countryRandom),
    getCapital: vi.fn(code => (code === 'AAA' ? 'Alpha City' : 'Beta Town')),
    getRandomCapitalOptions: vi.fn((correct, n) => {
      // Ensure the correct answer is present and length is n+1 (correct + decoys)
      const decoys = Array.from({ length: n }, (_, i) => `${correct}-ALT-${i}`);
      return [correct, ...decoys];
    }),
  };

  it('uses daily country with seeded key when mode is daily', () => {
    const round = buildRound('daily', '2025-01-01', deps);

    expect(deps.getDailyCountry).toHaveBeenCalledWith('2025-01-01-capital');
    expect(round.country.code).toBe('AAA');
    expect(round.country.capital).toBe('Alpha City');
    expect(round.options).toContain('Alpha City');
  });

  it('uses random country when mode is not daily', () => {
    const round = buildRound('endless', '2025-01-02', deps);

    expect(deps.getRandomCountry).toHaveBeenCalled();
    expect(round.country.code).toBe('BBB');
    expect(round.country.capital).toBe('Beta Town');
  });

  it('returns exactly 4 options with the correct capital included', () => {
    const round = buildRound('daily', '2025-01-03', deps);

    expect(round.options.length).toBe(4);
    expect(new Set(round.options).size).toBe(4);
    expect(round.options).toContain(round.country.capital);
  });
});
