import { describe, it, expect, vi } from 'vitest';
import {
  shuffle,
  getRandomOptions,
  getRandomPainting,
  QUESTION_TYPES,
} from './FamousPaintings.jsx';

const sampleData = [
  { title: 'Mona Lisa', artist: 'Da Vinci', year: '1503', style: 'Renaissance', location: 'Louvre' },
  { title: 'Starry Night', artist: 'Van Gogh', year: '1889', style: 'Post-Impressionism', location: 'MoMA' },
  { title: 'The Scream', artist: 'Munch', year: '1893', style: 'Expressionism', location: 'National Gallery' },
  { title: 'Guernica', artist: 'Picasso', year: '1937', style: 'Cubism', location: 'Reina Sofia' },
];

describe('FamousPaintings - helpers', () => {
  it('shuffle returns same items in a permutation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const arr = [1, 2, 3, 4];
    const out = shuffle(arr);
    expect(out.sort()).toEqual(arr.sort());
    Math.random.mockRestore();
  });

  it('getRandomOptions includes the correct answer and size 4', () => {
    const opts = getRandomOptions(sampleData, 'Da Vinci', 'artist');
    expect(opts).toContain('Da Vinci');
    expect(opts.length).toBe(4);
    expect(new Set(opts).size).toBe(4);
  });

  it('getRandomPainting respects exclusion list', () => {
    const picked = getRandomPainting(sampleData, ['Mona Lisa', 'Starry Night', 'The Scream']);
    expect(picked).not.toBeNull();
    expect(picked.title).toBe('Guernica');
  });
});

describe('FamousPaintings - question types', () => {
  const painting = sampleData[0];

  it('artist question returns correct answer and options', () => {
    const qt = QUESTION_TYPES.find(q => q.id === 'artist');
    const answer = qt.answer(painting);
    const opts = qt.options(sampleData, painting);
    expect(answer).toBe('Da Vinci');
    expect(opts).toContain('Da Vinci');
    expect(opts.length).toBe(4);
  });

  it('title question returns correct answer and options', () => {
    const qt = QUESTION_TYPES.find(q => q.id === 'title');
    const answer = qt.answer(painting);
    const opts = qt.options(sampleData, painting);
    expect(answer).toBe('Mona Lisa');
    expect(opts).toContain('Mona Lisa');
  });

  it('year question mixes options and includes the correct year', () => {
    const qt = QUESTION_TYPES.find(q => q.id === 'year');
    const opts = qt.options(sampleData, painting);
    expect(opts).toContain('1503');
    expect(opts.length).toBe(4);
  });
});
