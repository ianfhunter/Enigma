import { describe, it, expect, vi } from 'vitest';
import { QUESTION_TYPES, getConstellationOptions, shuffle } from './Constellations.jsx';

describe('Constellations - option generation', () => {
  const sampleData = [
    { id: 1, names: [{ english: 'Orion' }], IAU: 'Ori' },
    { id: 2, names: [{ english: 'Lyra' }], IAU: 'Lyr' },
    { id: 3, names: [{ english: 'Draco' }], IAU: 'Dra' },
    { id: 4, names: [{ english: 'Cygnus' }], IAU: 'Cyg' },
  ];

  it('includes the correct answer and provides 4 unique options', () => {
    const options = getConstellationOptions(sampleData, 'Orion', 3);
    expect(options).toContain('Orion');
    expect(options.length).toBe(4);
    expect(new Set(options).size).toBe(4);
  });

  it('shuffle returns a permutation with same items', () => {
    const arr = [1, 2, 3, 4];
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const out = shuffle(arr);
    expect(out.sort()).toEqual(arr.sort());
    Math.random.mockRestore();
  });
});

describe('Constellations - question types', () => {
  const sampleConstellation = {
    id: 'ori',
    names: [{ english: 'Orion' }],
    IAU: 'Ori',
    semantics: ['hunter'],
  };
  const data = [sampleConstellation, { id: 'lyr', names: [{ english: 'Lyra' }], IAU: 'Lyr', semantics: ['lyre'] }];

  it('identify question returns correct answer and 4 options', () => {
    const identify = QUESTION_TYPES.find(q => q.id === 'identify');
    const answer = identify.getAnswer(sampleConstellation);
    expect(answer).toBe('Orion');
    const opts = identify.getOptions(data, sampleConstellation);
    expect(opts).toContain(answer);
    expect(opts.length).toBe(4);
  });

  it('abbreviation question uses IAU code and options contain it', () => {
    const abbr = QUESTION_TYPES.find(q => q.id === 'abbreviation');
    const answer = abbr.getAnswer(sampleConstellation);
    expect(answer).toBe('Ori');
    const opts = abbr.getOptions(data, sampleConstellation);
    expect(opts).toContain('Ori');
    expect(opts.length).toBe(4);
  });

  it('abbreviation question pads to 4 options even with minimal data', () => {
    const abbr = QUESTION_TYPES.find(q => q.id === 'abbreviation');
    const opts = abbr.getOptions([sampleConstellation], sampleConstellation);
    expect(opts).toContain('Ori');
    expect(opts.length).toBe(4);
    expect(new Set(opts).size).toBe(4);
  });

  it('semantic question is only valid when semantics exist and includes the semantic', () => {
    const semantic = QUESTION_TYPES.find(q => q.id === 'semantic');
    expect(semantic.valid(sampleConstellation)).toBe(true);
    const answer = semantic.getAnswer(sampleConstellation);
    const opts = semantic.getOptions(data, sampleConstellation);
    expect(opts).toContain(answer);
    expect(opts.length).toBe(4);

    // Should be invalid if no semantics
    expect(semantic.valid({ ...sampleConstellation, semantics: [] })).toBe(false);
  });

  it('semantic question pads options using fallback semantics when pool is small', () => {
    const semantic = QUESTION_TYPES.find(q => q.id === 'semantic');
    const opts = semantic.getOptions([sampleConstellation], sampleConstellation);
    expect(opts).toContain('hunter');
    expect(opts.length).toBe(4);
    expect(new Set(opts).size).toBe(4);
  });
});
