import { describe, it, expect } from 'vitest';
import {
  createDeck,
  generateTriPeaks,
  parseCardCode,
  isExposed,
  getExposedCards,
  isAdjacent,
  areAllPeaksCleared,
  CARD_VALUES,
} from './TriPeaks.jsx';

describe('TriPeaks - Deck Creation', () => {
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

describe('TriPeaks - Peak Generation', () => {
  it('generates three peaks with correct structure', () => {
    const { peaks, drawPile } = generateTriPeaks(12345);

    // Should have 3 peaks
    expect(peaks.length).toBe(3);

    // Each peak has 4 rows
    for (const peak of peaks) {
      expect(peak.length).toBe(4);

      // Row i has i+1 cards
      for (let i = 0; i < 4; i++) {
        expect(peak[i].length).toBe(i + 1);
      }
    }

    // Total peak cards: 3 peaks × (1+2+3+4) = 30
    const peakCardCount = peaks.reduce((sum, peak) =>
      sum + peak.reduce((rowSum, row) => rowSum + row.length, 0), 0
    );
    expect(peakCardCount).toBe(30);

    // Draw pile has remaining 22 cards
    expect(drawPile.length).toBe(22);

    // Total should be 52
    expect(peakCardCount + drawPile.length).toBe(52);
  });

  it('same seed produces identical puzzles', () => {
    const result1 = generateTriPeaks(42);
    const result2 = generateTriPeaks(42);

    expect(result1.peaks[0][3][0].rank).toBe(result2.peaks[0][3][0].rank);
    expect(result1.peaks[0][3][0].suit).toBe(result2.peaks[0][3][0].suit);
    expect(result1.drawPile[0].rank).toBe(result2.drawPile[0].rank);
  });

  it('different seeds produce different puzzles', () => {
    const result1 = generateTriPeaks(1);
    const result2 = generateTriPeaks(999);

    // Very unlikely to be identical
    const same = result1.peaks[0][3].every((card, i) =>
      card.rank === result2.peaks[0][3][i].rank &&
      card.suit === result2.peaks[0][3][i].suit
    );
    expect(same).toBe(false);
  });

  it('bottom row cards are initially face-up', () => {
    const { peaks } = generateTriPeaks(12345);

    for (const peak of peaks) {
      // Bottom row is row 3 (0-indexed)
      for (const card of peak[3]) {
        expect(card.faceUp).toBe(true);
      }

      // Other rows are face-down initially
      for (let row = 0; row < 3; row++) {
        for (const card of peak[row]) {
          expect(card.faceUp).toBe(false);
        }
      }
    }
  });
});

describe('TriPeaks - Card Exposure', () => {
  it('bottom row cards are always exposed', () => {
    const { peaks } = generateTriPeaks(12345);

    for (let peak = 0; peak < 3; peak++) {
      for (let col = 0; col < 4; col++) {
        expect(isExposed(peaks, peak, 3, col)).toBe(true);
      }
    }
  });

  it('top cards are not exposed initially (covered by rows below)', () => {
    const { peaks } = generateTriPeaks(12345);

    // Top cards (row 0) are covered by row 1 cards
    for (let peak = 0; peak < 3; peak++) {
      expect(isExposed(peaks, peak, 0, 0)).toBe(false);
    }
  });

  it('card becomes exposed when covering cards are removed', () => {
    const { peaks } = generateTriPeaks(12345);

    // Row 2, col 0 is covered by row 3, cols 0 and 1
    expect(isExposed(peaks, 0, 2, 0)).toBe(false);

    // Remove the covering cards
    peaks[0][3][0].removed = true;
    peaks[0][3][1].removed = true;

    // But card is still not face-up initially
    expect(isExposed(peaks, 0, 2, 0)).toBe(false);

    // Make card face-up
    peaks[0][2][0].faceUp = true;

    // Now it should be exposed
    expect(isExposed(peaks, 0, 2, 0)).toBe(true);
  });

  it('getExposedCards returns only bottom row initially', () => {
    const { peaks } = generateTriPeaks(12345);
    const exposed = getExposedCards(peaks);

    // Initially only the 12 bottom row cards (3 peaks × 4 cards) are exposed
    expect(exposed.length).toBe(12);
    expect(exposed.every(({ row }) => row === 3)).toBe(true);
  });
});

describe('TriPeaks - Adjacent Cards', () => {
  it('isAdjacent correctly identifies adjacent values', () => {
    // Sequential pairs
    expect(isAdjacent(1, 2)).toBe(true); // A-2
    expect(isAdjacent(2, 3)).toBe(true); // 2-3
    expect(isAdjacent(12, 13)).toBe(true); // Q-K
    expect(isAdjacent(13, 1)).toBe(true); // K-A (wrapping)
    expect(isAdjacent(1, 13)).toBe(true); // A-K (wrapping)

    // Non-adjacent
    expect(isAdjacent(1, 3)).toBe(false); // A-3
    expect(isAdjacent(5, 8)).toBe(false); // 5-8
    expect(isAdjacent(1, 7)).toBe(false); // A-7
  });

  it('adjacent pairs include all wrapping cases', () => {
    // Test all adjacent pairs including wraps
    const pairs = [
      [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 1]
    ];

    for (const [a, b] of pairs) {
      expect(isAdjacent(a, b)).toBe(true);
      expect(isAdjacent(b, a)).toBe(true); // Should be symmetric
    }
  });
});

describe('TriPeaks - Win Condition', () => {
  it('empty peaks are cleared', () => {
    const { peaks } = generateTriPeaks(12345);

    // Mark all cards as removed
    for (const peak of peaks) {
      for (const row of peak) {
        for (const card of row) {
          card.removed = true;
        }
      }
    }

    expect(areAllPeaksCleared(peaks)).toBe(true);
  });

  it('peaks with remaining cards are not cleared', () => {
    const { peaks } = generateTriPeaks(12345);
    expect(areAllPeaksCleared(peaks)).toBe(false);

    // Remove all but one
    for (const peak of peaks) {
      for (const row of peak) {
        for (const card of row) {
          card.removed = true;
        }
      }
    }
    peaks[0][0][0].removed = false;

    expect(areAllPeaksCleared(peaks)).toBe(false);
  });
});

describe('TriPeaks - Card Parsing', () => {
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
});