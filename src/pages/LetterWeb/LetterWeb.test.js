import { describe, it, expect } from 'vitest';
import {
  generateLetterConfiguration,
  getLetterSide,
  isValidLetterBoxedWord,
  findSolution,
  hasSolution,
  getWordDisplayText,
} from './LetterWeb.jsx';

describe('LetterWeb - getWordDisplayText', () => {
  it('returns the current word while typing', () => {
    expect(getWordDisplayText('HEL', 'L', 'playing')).toBe('HEL');
  });

  it('prompts for the chain letter during play', () => {
    expect(getWordDisplayText('', 'Q', 'playing')).toBe('Start with Q...');
  });

  it('shows the idle prompt when no chain is available', () => {
    expect(getWordDisplayText('', null, 'playing')).toBe('Click letters...');
  });

  it('stops prompting once the puzzle is solved', () => {
    expect(getWordDisplayText('', 'Z', 'won')).toBe('Puzzle solved!');
  });

  it('stops prompting after the solution is revealed', () => {
    expect(getWordDisplayText('', 'A', 'revealed')).toBe('Solution revealed');
  });
});

describe('LetterWeb - helpers', () => {
  const makeRandom = (values) => {
    let i = 0;
    return () => {
      const v = values[i % values.length];
      i += 1;
      return v;
    };
  };

  it('generateLetterConfiguration produces 4 sides of 3 unique letters', () => {
    const rand = makeRandom([0.1, 0.2, 0.3, 0.4, 0.5]);
    const sides = generateLetterConfiguration(rand);
    expect(sides).toHaveLength(4);
    sides.forEach(side => expect(side).toHaveLength(3));
    const flat = sides.flat();
    expect(new Set(flat).size).toBe(12);
  });

  it('getLetterSide finds correct side index or -1', () => {
    const sides = [['A'], ['B'], ['C'], ['D']];
    expect(getLetterSide('A', sides)).toBe(0);
    expect(getLetterSide('D', sides)).toBe(3);
    expect(getLetterSide('Z', sides)).toBe(-1);
  });

  it('isValidLetterBoxedWord enforces side alternation and length', () => {
    const sides = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H']];
    expect(isValidLetterBoxedWord('AB', sides).valid).toBe(false); // too short
    expect(isValidLetterBoxedWord('AAC', sides).valid).toBe(false); // same side repeat
    expect(isValidLetterBoxedWord('ACG', sides, null, { skipDictionaryCheck: true }).valid).toBe(true);
  });

  it('isValidLetterBoxedWord respects custom validators when provided', () => {
    const sides = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H']];
    const result = isValidLetterBoxedWord('ACG', sides, null, { validateWord: () => false });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Not a valid word');
  });

  it('findSolution and hasSolution detect a valid chain', () => {
    const sides = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
      ['J', 'K', 'L'],
    ];
    const validWords = ['ADGJ', 'JBEK', 'KCFI', 'ILH'];
    const chain = findSolution(sides, validWords, 5);
    expect(chain).not.toBeNull();
    expect(chain).toHaveLength(4);
    expect(hasSolution(sides, validWords, 5)).toBe(true);
  });
});
