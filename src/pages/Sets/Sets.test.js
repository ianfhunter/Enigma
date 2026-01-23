import { describe, it, expect } from 'vitest';
import { isValidSet, findAllSets, generatePuzzle, COLORS, SHAPES, FILLS, COUNTS } from './Sets';

// ===========================================
// Sets - Card Attribute Tests
// ===========================================
describe('Sets - Card Attributes', () => {
  it('should have exactly 3 options for each attribute', () => {
    expect(COLORS).toHaveLength(3);
    expect(SHAPES).toHaveLength(3);
    expect(FILLS).toHaveLength(3);
    expect(COUNTS).toHaveLength(3);
  });

  it('should have unique attribute values', () => {
    expect(new Set(COLORS).size).toBe(3);
    expect(new Set(SHAPES).size).toBe(3);
    expect(new Set(FILLS).size).toBe(3);
    expect(new Set(COUNTS).size).toBe(3);
  });
});

// ===========================================
// Sets - Valid Set Detection Tests
// ===========================================
describe('Sets - Valid Set Detection', () => {
  it('should detect a valid set with all attributes same', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'red', shape: 'diamond', fill: 'solid', count: 2 };
    const card3 = { color: 'red', shape: 'diamond', fill: 'solid', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(true);
  });

  it('should detect a valid set with all attributes different', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'green', shape: 'oval', fill: 'striped', count: 2 };
    const card3 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(true);
  });

  it('should detect a valid set with mixed same/different attributes', () => {
    // All same color, all different shape, all same fill, all different count
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'red', shape: 'oval', fill: 'solid', count: 2 };
    const card3 = { color: 'red', shape: 'squiggle', fill: 'solid', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(true);
  });

  it('should reject an invalid set where one attribute has two same, one different', () => {
    // Color: two red, one green (invalid!)
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'red', shape: 'oval', fill: 'striped', count: 2 };
    const card3 = { color: 'green', shape: 'squiggle', fill: 'empty', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(false);
  });

  it('should reject when shape has two same, one different', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'green', shape: 'diamond', fill: 'striped', count: 2 };
    const card3 = { color: 'purple', shape: 'oval', fill: 'empty', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(false);
  });

  it('should reject when fill has two same, one different', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'green', shape: 'oval', fill: 'solid', count: 2 };
    const card3 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(false);
  });

  it('should reject when count has two same, one different', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'green', shape: 'oval', fill: 'striped', count: 1 };
    const card3 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 2 };

    expect(isValidSet(card1, card2, card3)).toBe(false);
  });
});

// ===========================================
// Sets - Find All Sets Tests
// ===========================================
describe('Sets - Find All Sets', () => {
  it('should find zero sets when no valid sets exist', () => {
    // These cards cannot form a valid set
    const cards = [
      { color: 'red', shape: 'diamond', fill: 'solid', count: 1 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 2 },
      { color: 'green', shape: 'diamond', fill: 'solid', count: 1 },
    ];

    const sets = findAllSets(cards);
    expect(sets.length).toBe(0);
  });

  it('should find exactly one set', () => {
    const cards = [
      { color: 'red', shape: 'diamond', fill: 'solid', count: 1 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 2 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 3 },
      { color: 'green', shape: 'oval', fill: 'empty', count: 1 }, // extra card
    ];

    const sets = findAllSets(cards);
    expect(sets.length).toBe(1);
    expect(sets[0]).toEqual([0, 1, 2]);
  });

  it('should find multiple sets', () => {
    const cards = [
      { color: 'red', shape: 'diamond', fill: 'solid', count: 1 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 2 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 3 },
      { color: 'green', shape: 'oval', fill: 'striped', count: 1 },
      { color: 'green', shape: 'oval', fill: 'striped', count: 2 },
      { color: 'green', shape: 'oval', fill: 'striped', count: 3 },
    ];

    const sets = findAllSets(cards);
    expect(sets.length).toBe(2);
  });

  it('should return indices, not cards', () => {
    const cards = [
      { color: 'red', shape: 'diamond', fill: 'solid', count: 1 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 2 },
      { color: 'red', shape: 'diamond', fill: 'solid', count: 3 },
    ];

    const sets = findAllSets(cards);
    expect(sets[0].every(i => typeof i === 'number')).toBe(true);
  });
});

// ===========================================
// Sets - Puzzle Generation Tests
// ===========================================
describe('Sets - Puzzle Generation', () => {
  it('should generate a puzzle with the specified number of cards', () => {
    const puzzle = generatePuzzle(12345, 12);
    expect(puzzle.cards).toHaveLength(12);
  });

  it('should generate unique cards', () => {
    const puzzle = generatePuzzle(12345, 15);
    const cardStrings = puzzle.cards.map(c =>
      `${c.color}-${c.shape}-${c.fill}-${c.count}`
    );
    const uniqueCards = new Set(cardStrings);
    expect(uniqueCards.size).toBe(puzzle.cards.length);
  });

  it('should generate puzzles with at least some valid sets', () => {
    // Run multiple times to ensure sets are typically found
    let totalSets = 0;
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle(i * 1000, 12);
      totalSets += puzzle.totalSets;
    }
    // On average, 12 cards should have several sets
    expect(totalSets).toBeGreaterThan(0);
  });

  it('should be deterministic with the same seed', () => {
    const puzzle1 = generatePuzzle(42, 12);
    const puzzle2 = generatePuzzle(42, 12);

    expect(puzzle1.cards).toEqual(puzzle2.cards);
    expect(puzzle1.totalSets).toBe(puzzle2.totalSets);
  });

  it('should generate different puzzles with different seeds', () => {
    const puzzle1 = generatePuzzle(1, 12);
    const puzzle2 = generatePuzzle(2, 12);

    // Very unlikely to be exactly the same
    const same = puzzle1.cards.every((card, i) =>
      card.color === puzzle2.cards[i].color &&
      card.shape === puzzle2.cards[i].shape &&
      card.fill === puzzle2.cards[i].fill &&
      card.count === puzzle2.cards[i].count
    );
    expect(same).toBe(false);
  });

  it('should generate valid cards with correct attribute values', () => {
    const puzzle = generatePuzzle(99999, 18);

    for (const card of puzzle.cards) {
      expect(COLORS).toContain(card.color);
      expect(SHAPES).toContain(card.shape);
      expect(FILLS).toContain(card.fill);
      expect(COUNTS).toContain(card.count);
    }
  });

  it('should track allSets matching totalSets count', () => {
    const puzzle = generatePuzzle(12345, 12);
    expect(puzzle.allSets.length).toBe(puzzle.totalSets);
  });
});

// ===========================================
// Sets - Edge Cases
// ===========================================
describe('Sets - Edge Cases', () => {
  it('should handle minimum board size', () => {
    const puzzle = generatePuzzle(100, 3);
    expect(puzzle.cards).toHaveLength(3);
  });

  it('should handle maximum feasible board size', () => {
    const puzzle = generatePuzzle(100, 21);
    expect(puzzle.cards).toHaveLength(21);
  });

  it('should handle cards with identical attributes except count', () => {
    // This is always a valid set
    const card1 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 1 };
    const card2 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 2 };
    const card3 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(true);
  });

  it('should correctly identify all-different as valid', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'green', shape: 'oval', fill: 'striped', count: 2 };
    const card3 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 3 };

    expect(isValidSet(card1, card2, card3)).toBe(true);
  });
});

// ===========================================
// Sets - Combinatorial Properties
// ===========================================
describe('Sets - Combinatorial Properties', () => {
  it('should have 81 possible unique cards in a full deck', () => {
    // 3 colors × 3 shapes × 3 fills × 3 counts = 81
    const totalPossible = COLORS.length * SHAPES.length * FILLS.length * COUNTS.length;
    expect(totalPossible).toBe(81);
  });

  it('should validate that order of cards does not matter', () => {
    const card1 = { color: 'red', shape: 'diamond', fill: 'solid', count: 1 };
    const card2 = { color: 'green', shape: 'oval', fill: 'striped', count: 2 };
    const card3 = { color: 'purple', shape: 'squiggle', fill: 'empty', count: 3 };

    // All permutations should give same result
    expect(isValidSet(card1, card2, card3)).toBe(true);
    expect(isValidSet(card1, card3, card2)).toBe(true);
    expect(isValidSet(card2, card1, card3)).toBe(true);
    expect(isValidSet(card2, card3, card1)).toBe(true);
    expect(isValidSet(card3, card1, card2)).toBe(true);
    expect(isValidSet(card3, card2, card1)).toBe(true);
  });
});
