import { describe, it, expect } from 'vitest';
import {
  buildPuzzleIndex,
  pickDailyPuzzleId,
  pickPracticePuzzleId,
} from './KnightsAndKnaves.jsx';

describe('KnightsAndKnaves - helpers', () => {
  const puzzles = [
    { id: 'p1', peopleCount: 3 },
    { id: 'p2', peopleCount: 3 },
    { id: 'p3', peopleCount: 4 },
  ];

  it('buildPuzzleIndex maps ids to puzzles', () => {
    const idx = buildPuzzleIndex(puzzles);
    expect(idx.get('p1')).toEqual(puzzles[0]);
    expect(idx.get('p3')).toEqual(puzzles[2]);
    expect(idx.size).toBe(puzzles.length);
  });

  it('pickDailyPuzzleId is deterministic for a given date', () => {
    const date = '2025-01-01';
    const id1 = pickDailyPuzzleId(date, puzzles);
    const id2 = pickDailyPuzzleId(date, puzzles);
    expect(id1).toBe(id2);
    expect(puzzles.map(p => p.id)).toContain(id1);
  });

  it('pickPracticePuzzleId filters by peopleCount and picks existing', () => {
    const id = pickPracticePuzzleId(puzzles, 3);
    expect(['p1', 'p2']).toContain(id);

    const none = pickPracticePuzzleId(puzzles, 10);
    expect(none).toBeNull();
  });
});
