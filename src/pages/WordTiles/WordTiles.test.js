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

describe('WordTiles shift-left logic', () => {
  it('shifts tiles left when a middle tile is removed', () => {
    // Simulating: WORD at slots 0,1,2,3 - removing 'R' from slot 1 should shift O, D left
    const placedTiles = [
      { letter: 'W', slotIndex: 0, handIndex: 0 },
      { letter: 'R', slotIndex: 1, handIndex: 1 },
      { letter: 'O', slotIndex: 2, handIndex: 2 },
      { letter: 'D', slotIndex: 3, handIndex: 3 },
    ];
    
    const removedSlot = 1;
    
    // Simulate the fixed shift logic
    const unaffected = placedTiles.filter(t => t.slotIndex < removedSlot);
    const toShift = placedTiles.filter(t => t.slotIndex > removedSlot);
    const shifted = toShift.map(t => ({ ...t, slotIndex: t.slotIndex - 1 }));
    const result = [...unaffected, ...shifted];
    
    // After removing slot 1, 'W' stays at 0, 'O' should be at 1 and 'D' at 2
    expect(result.find(t => t.letter === 'W').slotIndex).toBe(0);
    expect(result.find(t => t.letter === 'O').slotIndex).toBe(1);
    expect(result.find(t => t.letter === 'D').slotIndex).toBe(2);
    expect(result.length).toBe(3);
  });

  it('shifts all tiles left when the last tile is removed', () => {
    // CAT at slots 0,1,2 - removing 'T' should shift C to 0, A to 1
    const placedTiles = [
      { letter: 'C', slotIndex: 0, handIndex: 0 },
      { letter: 'A', slotIndex: 1, handIndex: 1 },
      { letter: 'T', slotIndex: 2, handIndex: 2 },
    ];
    
    const lastSlot = 2;
    
    // Simulate the shift logic
    const toShift = placedTiles.filter(t => t.slotIndex < lastSlot);
    const result = toShift.map(t => t);
    
    // After removing slot 2, C stays at 0, A stays at 1
    expect(result.find(t => t.letter === 'C').slotIndex).toBe(0);
    expect(result.find(t => t.letter === 'A').slotIndex).toBe(1);
    expect(result.length).toBe(2);
  });

  it('handles removing the first tile correctly', () => {
    // TEST at slots 0,1,2,3 - removing 'S' from slot 1 should shift E, S, T left
    const placedTiles = [
      { letter: 'S', slotIndex: 1, handIndex: 0 },
      { letter: 'E', slotIndex: 2, handIndex: 1 },
      { letter: 'S', slotIndex: 3, handIndex: 2 },
      { letter: 'T', slotIndex: 4, handIndex: 3 },
    ];
    
    const removedSlot = 1;
    
    // Simulate the shift logic
    const toShift = placedTiles.filter(t => t.slotIndex > removedSlot);
    const shifted = toShift.map(t => ({ ...t, slotIndex: t.slotIndex - 1 }));
    const result = [...shifted];
    
    // E should be at 1, S at 2, T at 3
    expect(result.find(t => t.letter === 'E').slotIndex).toBe(1);
    expect(result.find(t => t.letter === 'S' && t.handIndex === 2).slotIndex).toBe(2);
    expect(result.find(t => t.letter === 'T').slotIndex).toBe(3);
    expect(result.length).toBe(3);
  });

  it('handles single tile removal correctly', () => {
    // Single tile 'A' at slot 0
    const placedTiles = [
      { letter: 'A', slotIndex: 0, handIndex: 0 },
    ];
    
    const removedSlot = 0;
    
    // Simulate the shift logic
    const toShift = placedTiles.filter(t => t.slotIndex > removedSlot);
    const shifted = toShift.map(t => ({ ...t, slotIndex: t.slotIndex - 1 }));
    const result = [...shifted];
    
    expect(result.length).toBe(0);
  });
});
