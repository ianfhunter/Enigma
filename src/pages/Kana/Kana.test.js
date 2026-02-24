import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import { generateKanaPuzzle, KANA_SYMBOLS, checkKanaConstraints } from './kanaLogic';

describe('Kana puzzle generation', () => {
  it('creates deterministic puzzles by seed and size', () => {
    const p1 = generateKanaPuzzle(8, createSeededRandom(1234));
    const p2 = generateKanaPuzzle(8, createSeededRandom(1234));
    expect(p1.solutionPath).toEqual(p2.solutionPath);
    expect([...p1.solutionEdges]).toEqual([...p2.solutionEdges]);
    expect(p1.clues).toEqual(p2.clues);
  });

  it('generates a simple loop path without revisiting cells', () => {
    const puzzle = generateKanaPuzzle(10, createSeededRandom(2024));
    const keys = puzzle.solutionPath.map(([r, c]) => `${r},${c}`);
    expect(new Set(keys).size).toBe(keys.length);

    for (let i = 0; i < puzzle.solutionPath.length; i++) {
      const [r1, c1] = puzzle.solutionPath[i];
      const [r2, c2] = puzzle.solutionPath[(i + 1) % puzzle.solutionPath.length];
      expect(Math.abs(r1 - r2) + Math.abs(c1 - c2)).toBe(1);
    }
  });

  it('always places all five kana symbols with distinct rules', () => {
    const puzzle = generateKanaPuzzle(10, createSeededRandom(77));
    const present = new Set(puzzle.clues.map((c) => c.symbol));
    expect([...present].sort()).toEqual([...KANA_SYMBOLS].sort());
    expect(new Set(Object.values(puzzle.symbolRules)).size).toBe(KANA_SYMBOLS.length);
  });

  it('accepts generated loop and rejects a broken loop', () => {
    const puzzle = generateKanaPuzzle(6, createSeededRandom(55));
    expect(checkKanaConstraints(puzzle, puzzle.solutionEdges)).toBe(true);

    const broken = new Set(puzzle.solutionEdges);
    broken.delete([...broken][0]);
    expect(checkKanaConstraints(puzzle, broken)).toBe(false);
  });
});
