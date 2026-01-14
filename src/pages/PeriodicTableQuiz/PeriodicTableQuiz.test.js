import { describe, it, expect } from 'vitest';
import { MODES, normalizeInput, isAnswerCorrect } from './PeriodicTableQuiz.jsx';

describe('PeriodicTableQuiz - helpers', () => {
  it('normalizes input to lowercase trimmed', () => {
    expect(normalizeInput('  He ')).toBe('he');
  });

  it('isAnswerCorrect compares based on mode', () => {
    const current = { symbol: 'Fe', name: 'Iron' };
    expect(isAnswerCorrect(current, MODES[0], 'iron')).toBe(true);
    expect(isAnswerCorrect(current, MODES[1], 'fe')).toBe(true);
    expect(isAnswerCorrect(current, MODES[1], 'fe ')).toBe(true);
    expect(isAnswerCorrect(current, MODES[1], 'ni')).toBe(false);
  });
});
