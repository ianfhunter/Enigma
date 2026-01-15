import { describe, it, expect } from 'vitest';
import {
  createDeck,
  generatePyramid,
  buildFromDeck,
  parseCardCode,
  isExposed,
  getExposedCards,
  isPyramidCleared,
  solvePyramid,
  isSolvable,
  findSolvableSeed,
  CARD_VALUES,
} from './PyramidCards.jsx';

describe('PyramidCards - Deck Creation', () => {
  it('creates a standard 52-card deck', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
  });

  it('deck has correct suits and ranks', () => {
    const deck = createDeck();
    const suits = new Set(deck.map(c => c.suit));
    const ranks = new Set(deck.map(c => c.rank));

    expect(suits.size).toBe(4);
    expect(suits.has('♠')).toBe(true);
    expect(suits.has('♥')).toBe(true);
    expect(suits.has('♦')).toBe(true);
    expect(suits.has('♣')).toBe(true);

    expect(ranks.size).toBe(13);
    expect(ranks.has('A')).toBe(true);
    expect(ranks.has('K')).toBe(true);
  });

  it('card values are correct', () => {
    expect(CARD_VALUES['A']).toBe(1);
    expect(CARD_VALUES['K']).toBe(13);
    expect(CARD_VALUES['Q']).toBe(12);
    expect(CARD_VALUES['J']).toBe(11);
    expect(CARD_VALUES['10']).toBe(10);
  });
});

describe('PyramidCards - Pyramid Generation', () => {
  it('generates pyramid with correct structure', () => {
    const { pyramid, drawPile } = generatePyramid(12345);

    // Pyramid has 7 rows
    expect(pyramid.length).toBe(7);

    // Row i has i+1 cards
    for (let i = 0; i < 7; i++) {
      expect(pyramid[i].length).toBe(i + 1);
    }

    // Total pyramid cards: 1+2+3+4+5+6+7 = 28
    const pyramidCardCount = pyramid.reduce((sum, row) => sum + row.length, 0);
    expect(pyramidCardCount).toBe(28);

    // Draw pile has remaining 24 cards
    expect(drawPile.length).toBe(24);
  });

  it('same seed produces identical puzzles', () => {
    const result1 = generatePyramid(42);
    const result2 = generatePyramid(42);

    expect(result1.pyramid[0][0].rank).toBe(result2.pyramid[0][0].rank);
    expect(result1.pyramid[0][0].suit).toBe(result2.pyramid[0][0].suit);
    expect(result1.drawPile[0].rank).toBe(result2.drawPile[0].rank);
  });

  it('different seeds produce different puzzles', () => {
    const result1 = generatePyramid(1);
    const result2 = generatePyramid(999);

    // Very unlikely to be identical
    const same = result1.pyramid[6].every((card, i) =>
      card.rank === result2.pyramid[6][i].rank &&
      card.suit === result2.pyramid[6][i].suit
    );
    expect(same).toBe(false);
  });
});

describe('PyramidCards - Card Exposure', () => {
  it('bottom row cards are always exposed', () => {
    const { pyramid } = generatePyramid(12345);

    for (let col = 0; col < 7; col++) {
      expect(isExposed(pyramid, 6, col)).toBe(true);
    }
  });

  it('top card is not exposed initially (covered by row 1)', () => {
    const { pyramid } = generatePyramid(12345);
    // The top card (row 0) is covered by cards in row 1
    expect(isExposed(pyramid, 0, 0)).toBe(false);
  });

  it('card becomes exposed when covering cards are removed', () => {
    const { pyramid } = generatePyramid(12345);

    // Row 5, col 0 is covered by row 6, cols 0 and 1
    expect(isExposed(pyramid, 5, 0)).toBe(false);

    // Remove the covering cards
    pyramid[6][0].removed = true;
    pyramid[6][1].removed = true;

    // Now it should be exposed
    expect(isExposed(pyramid, 5, 0)).toBe(true);
  });

  it('getExposedCards returns only bottom row initially', () => {
    const { pyramid } = generatePyramid(12345);
    const exposed = getExposedCards(pyramid);

    // Initially only the 7 bottom row cards are exposed
    expect(exposed.length).toBe(7);
    expect(exposed.every(({ row }) => row === 6)).toBe(true);
  });
});

describe('PyramidCards - Win Condition', () => {
  it('empty pyramid is cleared', () => {
    const { pyramid } = generatePyramid(12345);

    // Mark all cards as removed
    for (const row of pyramid) {
      for (const card of row) {
        card.removed = true;
      }
    }

    expect(isPyramidCleared(pyramid)).toBe(true);
  });

  it('pyramid with remaining cards is not cleared', () => {
    const { pyramid } = generatePyramid(12345);
    expect(isPyramidCleared(pyramid)).toBe(false);

    // Remove all but one
    for (const row of pyramid) {
      for (const card of row) {
        card.removed = true;
      }
    }
    pyramid[0][0].removed = false;

    expect(isPyramidCleared(pyramid)).toBe(false);
  });
});

describe('PyramidCards - Dataset Loading', () => {
  it('parseCardCode parses valid card codes', () => {
    const card = parseCardCode('AS');
    expect(card.rank).toBe('A');
    expect(card.suit).toBe('♠');
    expect(card.value).toBe(1);

    const king = parseCardCode('KH');
    expect(king.rank).toBe('K');
    expect(king.suit).toBe('♥');
    expect(king.value).toBe(13);

    const ten = parseCardCode('10D');
    expect(ten.rank).toBe('10');
    expect(ten.suit).toBe('♦');
    expect(ten.value).toBe(10);
  });

  it('buildFromDeck creates valid pyramid and draw pile', () => {
    // Create a simple ordered deck for testing
    const deckCodes = [
      'AS', 'AH', 'AD', 'AC', '2S', '2H', '2D', '2C',
      '3S', '3H', '3D', '3C', '4S', '4H', '4D', '4C',
      '5S', '5H', '5D', '5C', '6S', '6H', '6D', '6C',
      '7S', '7H', '7D', '7C', '8S', '8H', '8D', '8C',
      '9S', '9H', '9D', '9C', '10S', '10H', '10D', '10C',
      'JS', 'JH', 'JD', 'JC', 'QS', 'QH', 'QD', 'QC',
      'KS', 'KH', 'KD', 'KC'
    ];

    const { pyramid, drawPile } = buildFromDeck(deckCodes);

    expect(pyramid.length).toBe(7);
    expect(drawPile.length).toBe(24);

    // Check first card
    expect(pyramid[0][0].rank).toBe('A');
    expect(pyramid[0][0].suit).toBe('♠');

    // Total cards should be 52
    const pyramidCards = pyramid.reduce((sum, row) => sum + row.length, 0);
    expect(pyramidCards + drawPile.length).toBe(52);
  });
});

describe('PyramidCards - Solver', () => {
  it('solver handles cleared pyramid as solved', () => {
    const { pyramid, drawPile } = generatePyramid(12345);

    // Clear the pyramid
    for (const row of pyramid) {
      for (const card of row) {
        card.removed = true;
      }
    }

    expect(solvePyramid(pyramid, drawPile, 0, new Map())).toBe(true);
  });

  it('findSolvableSeed can find a solvable seed', () => {
    // Known solvable seed from our dataset generation
    const seed = findSolvableSeed(19, 5);
    expect(seed).toBe(19); // 19 is the first known solvable seed
  });

  it('isSolvable returns boolean', () => {
    // Test with a known solvable seed
    const result = isSolvable(19);
    expect(typeof result).toBe('boolean');
    expect(result).toBe(true);
  });

  it('verified seed 19 produces valid puzzle', () => {
    const seed = 19;
    const { pyramid, drawPile } = generatePyramid(seed);

    // Should have valid structure
    expect(pyramid.length).toBe(7);
    expect(drawPile.length).toBe(24);

    // Total cards should be 52
    const pyramidCards = pyramid.reduce((sum, row) => sum + row.length, 0);
    expect(pyramidCards + drawPile.length).toBe(52);
  });
});

describe('PyramidCards - Game Logic', () => {
  it('valid pairs sum to 13', () => {
    const validPairs = [
      ['A', 'Q'], // 1 + 12 = 13
      ['2', 'J'], // 2 + 11 = 13
      ['3', '10'], // 3 + 10 = 13
      ['4', '9'], // 4 + 9 = 13
      ['5', '8'], // 5 + 8 = 13
      ['6', '7'], // 6 + 7 = 13
    ];

    for (const [a, b] of validPairs) {
      expect(CARD_VALUES[a] + CARD_VALUES[b]).toBe(13);
    }
  });

  it('Kings have value 13 and can be removed alone', () => {
    expect(CARD_VALUES['K']).toBe(13);
  });
});
