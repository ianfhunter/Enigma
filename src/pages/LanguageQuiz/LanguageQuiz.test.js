import { describe, it, expect, vi } from 'vitest';
import { pickRandomCountry, evaluateGuess } from './LanguageQuiz.jsx';

describe('LanguageQuiz - pickRandomCountry', () => {
  const countries = [
    { name: 'A', languages: ['a'] },
    { name: 'B', languages: ['b'] },
  ];

  it('returns null when empty', () => {
    expect(pickRandomCountry([], () => 0.5)).toBeNull();
  });

  it('is deterministic with provided random function', () => {
    const rand = vi.fn().mockReturnValue(0.75); // picks index 1
    const picked = pickRandomCountry(countries, rand);
    expect(picked.name).toBe('B');
    expect(rand).toHaveBeenCalled();
  });
});

describe('LanguageQuiz - evaluateGuess', () => {
  const current = { name: 'Testland', languages: ['A', 'B'] };

  it('marks fully correct guesses', () => {
    const res = evaluateGuess(current, new Set(['A', 'B']));
    expect(res.correct).toBe(true);
    expect(res.partial).toBe(false);
    expect(res.wrongCount).toBe(0);
    expect(res.correctCount).toBe(2);
    expect(res.totalCorrect).toBe(2);
  });

  it('marks partial guesses when some correct but not complete', () => {
    const res = evaluateGuess(current, new Set(['A']));
    expect(res.correct).toBe(false);
    expect(res.partial).toBe(true);
    expect(res.correctCount).toBe(1);
    expect(res.wrongCount).toBe(0);
  });

  it('counts wrong selections', () => {
    const res = evaluateGuess(current, new Set(['A', 'C']));
    expect(res.correct).toBe(false);
    expect(res.partial).toBe(true);
    expect(res.wrongCount).toBe(1);
  });
});
