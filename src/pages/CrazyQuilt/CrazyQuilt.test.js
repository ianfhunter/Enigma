import { describe, expect, it } from 'vitest';
import {
  canMoveToFoundation,
  generateCrazyQuilt,
  isSolved,
  placeOnFoundation,
} from './CrazyQuilt.jsx';

function makeCard(suit, rank, rankIndex) {
  return {
    id: `${suit}-${rank}`,
    suit,
    suitSymbol: '♠',
    suitColor: 'black',
    rank,
    rankIndex,
  };
}

describe('CrazyQuilt generation', () => {
  it('creates deterministic quilt, stock, and empty waste/foundations', () => {
    const a = generateCrazyQuilt(1234);
    const b = generateCrazyQuilt(1234);

    expect(a.quilt).toHaveLength(5);
    a.quilt.forEach((row) => expect(row).toHaveLength(8));
    expect(a.stock).toHaveLength(8);
    expect(a.waste).toEqual([]);
    expect(Object.keys(a.foundations)).toEqual(['spades', 'hearts', 'diamonds', 'clubs']);
    expect(a.foundations.spades).toHaveLength(1);
    expect(a.foundations.hearts).toHaveLength(1);
    expect(a.foundations.diamonds).toHaveLength(1);
    expect(a.foundations.clubs).toHaveLength(1);

    expect(a.quilt.flat().map((c) => c.id)).toEqual(b.quilt.flat().map((c) => c.id));
    expect(a.stock.map((c) => c.id)).toEqual(b.stock.map((c) => c.id));
  });

  it('contains all 52 cards exactly once across quilt and stock', () => {
    const state = generateCrazyQuilt(7890);
    const all = [...state.quilt.flat(), ...state.stock, ...Object.values(state.foundations).flat()].map((c) => c.id);
    expect(all).toHaveLength(52);
    expect(new Set(all).size).toBe(52);
  });
});

describe('CrazyQuilt foundation rules', () => {
  it('only allows aces on empty foundations', () => {
    const ace = makeCard('spades', 'A', 0);
    const two = makeCard('spades', '2', 1);

    expect(canMoveToFoundation(ace, [])).toBe(true);
    expect(canMoveToFoundation(two, [])).toBe(false);
  });

  it('requires same suit and ascending rank progression', () => {
    const foundation = [makeCard('hearts', 'A', 0), makeCard('hearts', '2', 1)];
    const next = makeCard('hearts', '3', 2);
    const wrongSuit = makeCard('clubs', '3', 2);
    const skipped = makeCard('hearts', '4', 3);

    expect(canMoveToFoundation(next, foundation)).toBe(true);
    expect(canMoveToFoundation(wrongSuit, foundation)).toBe(false);
    expect(canMoveToFoundation(skipped, foundation)).toBe(false);
  });

  it('places legal cards and reports solved state at 13 cards per suit', () => {
    const foundations = {
      spades: [makeCard('spades', 'A', 0)],
      hearts: Array.from({ length: 13 }, (_, i) => makeCard('hearts', String(i), i)),
      diamonds: Array.from({ length: 13 }, (_, i) => makeCard('diamonds', String(i), i)),
      clubs: Array.from({ length: 13 }, (_, i) => makeCard('clubs', String(i), i)),
    };

    const updated = placeOnFoundation(foundations, makeCard('spades', '2', 1));
    expect(updated.spades).toHaveLength(2);
    expect(isSolved(updated)).toBe(false);

    const solved = {
      ...updated,
      spades: Array.from({ length: 13 }, (_, i) => makeCard('spades', String(i), i)),
    };
    expect(isSolved(solved)).toBe(true);
  });
});
