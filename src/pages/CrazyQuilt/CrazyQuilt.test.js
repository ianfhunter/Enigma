import { describe, expect, it } from 'vitest';
import {
  applyFoundationMove,
  canMoveToFoundation,
  generateCrazyQuilt,
  getOrientation,
  isCardExposed,
  isSolved,
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
  it('is deterministic and contains every card exactly once', () => {
    const a = generateCrazyQuilt(1234);
    const b = generateCrazyQuilt(1234);

    expect(a.quilt.flat().map((c) => c.id)).toEqual(b.quilt.flat().map((c) => c.id));
    expect(a.stock.map((c) => c.id)).toEqual(b.stock.map((c) => c.id));

    const all = [
      ...a.quilt.flat(),
      ...a.stock,
      ...Object.values(a.foundations).flatMap((suit) => [...suit.up, ...suit.down]),
    ].map((card) => card.id);

    expect(all).toHaveLength(52);
    expect(new Set(all).size).toBe(52);
  });

  it('deals 40 cards to quilt, 4 to stock, and seeds ace/king foundations', () => {
    const state = generateCrazyQuilt(9);
    expect(state.quilt).toHaveLength(5);
    state.quilt.forEach((row) => expect(row).toHaveLength(8));
    expect(state.stock).toHaveLength(4);

    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs']) {
      expect(state.foundations[suit].up).toHaveLength(1);
      expect(state.foundations[suit].down).toHaveLength(1);
      expect(state.foundations[suit].up[0].rank).toBe('A');
      expect(state.foundations[suit].down[0].rank).toBe('K');
    }
  });
});

describe('CrazyQuilt exposed-card logic', () => {
  it('uses checkerboard orientation', () => {
    expect(getOrientation(0, 0)).toBe('horizontal');
    expect(getOrientation(0, 1)).toBe('vertical');
    expect(getOrientation(1, 0)).toBe('vertical');
    expect(getOrientation(1, 1)).toBe('horizontal');
  });

  it('marks horizontal cards exposed when left or right short side is free', () => {
    const card = makeCard('spades', '2', 1);
    const quilt = [[card, makeCard('spades', '3', 2), null]];

    expect(isCardExposed(quilt, 0, 0)).toBe(true); // left edge open
    expect(isCardExposed(quilt, 0, 1)).toBe(true); // right side open due to null
  });

  it('marks vertical cards exposed when top or bottom short side is free', () => {
    const quilt = [
      [makeCard('spades', '2', 1), null],
      [makeCard('spades', '3', 2), makeCard('spades', '4', 3)],
      [makeCard('spades', '5', 4), makeCard('spades', '6', 5)],
    ];
    // (1,1) is vertical; top is null -> exposed
    expect(isCardExposed(quilt, 1, 1)).toBe(true);
  });
});

describe('CrazyQuilt foundation rules', () => {
  it('builds up/down by suit and rejects illegal moves', () => {
    const foundations = {
      hearts: { up: [makeCard('hearts', 'A', 0)], down: [makeCard('hearts', 'K', 12)] },
    };

    expect(canMoveToFoundation(makeCard('hearts', '2', 1), foundations.hearts.up, 'up')).toBe(true);
    expect(canMoveToFoundation(makeCard('clubs', '2', 1), foundations.hearts.up, 'up')).toBe(false);
    expect(canMoveToFoundation(makeCard('hearts', 'Q', 11), foundations.hearts.down, 'down')).toBe(true);
    expect(canMoveToFoundation(makeCard('hearts', 'J', 10), foundations.hearts.down, 'down')).toBe(false);
  });

  it('applies legal foundation moves immutably and solved needs no cards outside foundations', () => {
    const foundations = {
      spades: { up: [makeCard('spades', 'A', 0)], down: [makeCard('spades', 'K', 12)] },
    };

    const next = applyFoundationMove(foundations, makeCard('spades', '2', 1), 'spades', 'up');
    expect(next).not.toBe(foundations);
    expect(next.spades.up).toHaveLength(2);

    expect(isSolved([[makeCard('spades', '3', 2)]], [], [])).toBe(false);
    expect(isSolved([[null]], [], [])).toBe(true);
  });
});
