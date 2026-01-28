import { describe, it, expect, vi } from 'vitest';
import {
  NUM_TILES,
  WORD_SLOTS,
  createTileBag,
  drawTiles,
  calculateWordScore,
  shuffleArray,
  mergeHandTiles,
  computeSwapResult,
  getNextAutoSlot,
} from './WordTiles.jsx';

describe('WordTiles - helpers', () => {
  it('creates tile bag of expected size', () => {
    const bag = createTileBag();
    expect(bag.length).toBeGreaterThan(NUM_TILES);
  });

  it('drawTiles pulls from bag', () => {
    const bag = ['A', 'B', 'C'];
    const drawn = drawTiles(bag, 2);
    expect(drawn.length).toBe(2);
  });

  it('calculateWordScore sums letters and double', () => {
    expect(calculateWordScore('CAT', null)).toBeGreaterThan(0);
    expect(calculateWordScore('CAT', 1)).toBeGreaterThan(calculateWordScore('CAT', null));
  });

  it('shuffleArray keeps items', () => {
    const arr = [1, 2, 3];
    shuffleArray(arr, () => 0.5);
    expect(arr.sort()).toEqual([1, 2, 3]);
  });

  it('mergeHandTiles keeps placed letters', () => {
    const merged = mergeHandTiles([null, 'B'], [{ handIndex: 0, letter: 'A', slotIndex: 0 }]);
    expect(merged[0]).toBe('A');
  });

  it('computeSwapResult swaps when possible', () => {
    const res = computeSwapResult({ tiles: ['A', 'B'], placedTiles: [], bag: ['C', 'D'], randomFn: () => 0 });
    expect(res.canSwap).toBe(true);
  });

  it('getNextAutoSlot finds first free slot', () => {
    expect(getNextAutoSlot([{ slotIndex: 0 }])).toBe(1);
    expect(getNextAutoSlot(Array.from({ length: WORD_SLOTS }, (_, i) => ({ slotIndex: i })))).toBe(null);
  });
});

describe('WordTiles swap logic', () => {
  it('blocks swaps when the bag is empty', () => {
    const result = computeSwapResult({
      tiles: ['A', 'B', 'C'],
      placedTiles: [],
      bag: []
    });

    expect(result.canSwap).toBe(false);
    expect(result.reason).toBe('empty-bag');
  });

  it('performs a partial swap when not enough tiles remain', () => {
    const result = computeSwapResult({
      tiles: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      placedTiles: [],
      bag: ['X', 'Y'],
      randomFn: alwaysZero
    });

    expect(result.canSwap).toBe(true);
    expect(result.partial).toBe(true);
    expect(result.swapCount).toBe(2);
    expect(result.nextTiles).toEqual(['A', 'Y', 'X', 'D', 'E', 'F', 'G']);
    expect(result.nextBag.sort()).toEqual(['B', 'C'].sort());
  });

  it('includes placed tiles in swap calculations', () => {
    const result = computeSwapResult({
      tiles: ['A', null, 'C', null],
      placedTiles: [
        { letter: 'B', slotIndex: 0, handIndex: 1 },
        { letter: 'D', slotIndex: 1, handIndex: 3 }
      ],
      bag: ['X', 'Y', 'Z'],
      randomFn: alwaysZero
    });

    expect(result.canSwap).toBe(true);
    expect(result.partial).toBe(true);
    expect(result.swapCount).toBe(3);
    expect(result.nextTiles).toEqual(['A', 'Z', 'Y', 'X']);
    expect(result.nextBag.sort()).toEqual(['B', 'C', 'D'].sort());
  });
});

const alwaysZero = () => 0;

describe('WordTiles auto slot selection', () => {
  it('returns the first open slot when empty', () => {
    expect(getNextAutoSlot([])).toBe(0);
  });

  it('returns the lowest available slot with gaps present', () => {
    const placed = [
      { slotIndex: 2 },
      { slotIndex: 4 },
    ];
    expect(getNextAutoSlot(placed)).toBe(0);
  });

  it('returns null when all slots are filled', () => {
    const placed = Array.from({ length: 7 }, (_, i) => ({ slotIndex: i }));
    expect(getNextAutoSlot(placed)).toBe(null);
  });
});
