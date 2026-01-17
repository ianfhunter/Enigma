import { describe, it, expect, vi } from 'vitest';
import { buildRound } from './CapitalGuesser.jsx';

describe('CapitalGuesser - buildRound', () => {
  const countryRandom = { code: 'BBB', name: 'Bermuda' };

  const deps = {
    getRandomCountry: vi.fn().mockReturnValue(countryRandom),
    getCapital: vi.fn(code => (code === 'BBB' ? 'Beta Town' : 'Unknown')),
    getRandomCapitalOptions: vi.fn((correct, n) => {
      // Ensure the correct answer is present and length is n+1 (correct + decoys)
      const decoys = Array.from({ length: n }, (_, i) => `${correct}-ALT-${i}`);
      return [correct, ...decoys];
    }),
  };

  it('uses random country to build a round', () => {
    const round = buildRound(deps);

    expect(deps.getRandomCountry).toHaveBeenCalled();
    expect(round.country.code).toBe('BBB');
    expect(round.country.capital).toBe('Beta Town');
    expect(round.options).toContain('Beta Town');
  });

  it('returns exactly 4 options with the correct capital included', () => {
    const round = buildRound(deps);

    expect(round.options.length).toBe(4);
    expect(new Set(round.options).size).toBe(4);
    expect(round.options).toContain(round.country.capital);
  });

  it('uses default dependencies when none provided', () => {
    const round = buildRound();

    expect(round.country).toBeDefined();
    expect(round.country.code).toBeDefined();
    expect(round.country.capital).toBeDefined();
    expect(round.options).toBeDefined();
    expect(round.options.length).toBe(4);
  });
});
