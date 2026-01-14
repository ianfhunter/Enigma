import { describe, it, expect } from 'vitest';
import { selectPuzzle, notesToJSON, notesFromJSON } from './Kakuro.jsx';

describe('Kakuro - puzzle selection', () => {
  const puzzles = [
    { id: 1, difficulty: 'easy' },
    { id: 2, difficulty: 'easy' },
    { id: 3, difficulty: 'medium' },
    { id: 4, difficulty: 'hard' },
  ];

  it('returns a puzzle matching the requested difficulty when available', () => {
    const chosen = selectPuzzle(puzzles, 'medium', 1234);
    expect(chosen.difficulty).toBe('medium');
  });

  it('falls back to any puzzle if difficulty not found', () => {
    const chosen = selectPuzzle(puzzles, 'expert', 42);
    expect(chosen).toBeDefined();
    expect(puzzles.map(p => p.id)).toContain(chosen.id);
  });

  it('is deterministic for the same seed and difficulty', () => {
    const first = selectPuzzle(puzzles, 'easy', 999);
    const second = selectPuzzle(puzzles, 'easy', 999);
    expect(first.id).toBe(second.id);
  });
});

describe('Kakuro - notes serialization', () => {
  it('converts notes sets to JSON-friendly arrays and back', () => {
    const notes = {
      '0,0': new Set([1, 2, 3]),
      '1,2': new Set([4]),
    };

    const json = notesToJSON(notes);
    expect(json['0,0']).toEqual([1, 2, 3]);

    const restored = notesFromJSON(json);
    expect(restored['0,0'] instanceof Set).toBe(true);
    expect(Array.from(restored['0,0'])).toEqual([1, 2, 3]);
    expect(Array.from(restored['1,2'])).toEqual([4]);
  });

  it('handles empty or missing notes safely', () => {
    expect(notesFromJSON(undefined)).toEqual({});
    expect(notesFromJSON({})).toEqual({});
  });
});
