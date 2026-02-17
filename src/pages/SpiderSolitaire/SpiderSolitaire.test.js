import { describe, it, expect } from 'vitest';
import {
  createSpiderDeck,
  dealTableau,
  generateSpiderGame,
  isDescendingSequence,
  canPlaceSequence,
  removeCompletedRuns,
  moveSequence,
  isSameSuitDescendingSequence,
  CARD_VALUES,
} from './SpiderSolitaire.jsx';

describe('SpiderSolitaire - Deck generation', () => {
  it('creates a 104-card deck with eight of each rank', () => {
    const deck = createSpiderDeck();
    expect(deck.length).toBe(104);

    const rankCounts = deck.reduce((acc, card) => {
      acc[card.rank] = (acc[card.rank] || 0) + 1;
      return acc;
    }, {});

    Object.keys(CARD_VALUES).forEach(rank => {
      expect(rankCounts[rank]).toBe(8);
    });
  });

  it('all cards are spades and initially face down', () => {
    const deck = createSpiderDeck();
    expect(deck.every(card => card.suit === '♠')).toBe(true);
    expect(deck.every(card => card.faceUp === false)).toBe(true);
  });

  it('supports 2-suit and 4-suit deck generation', () => {
    const twoSuitDeck = createSpiderDeck(2);
    const fourSuitDeck = createSpiderDeck(4);

    expect(twoSuitDeck.length).toBe(104);
    expect(fourSuitDeck.length).toBe(104);

    const twoSuitCounts = twoSuitDeck.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {});
    expect(twoSuitCounts).toEqual({ '♠': 52, '♥': 52 });

    const fourSuitCounts = fourSuitDeck.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {});
    expect(fourSuitCounts).toEqual({ '♠': 26, '♥': 26, '♦': 26, '♣': 26 });
  });
});

describe('SpiderSolitaire - Deal and shuffle', () => {
  it('deals correct column sizes and stock size', () => {
    const deck = createSpiderDeck();
    const { columns, stock } = dealTableau(deck);

    const columnSizes = columns.map(column => column.length);
    expect(columnSizes).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(stock.length).toBe(50);
  });

  it('top cards in each column are face up', () => {
    const deck = createSpiderDeck();
    const { columns } = dealTableau(deck);

    columns.forEach(column => {
      const topCard = column[column.length - 1];
      expect(topCard.faceUp).toBe(true);
    });
  });

  it('same seed generates same layout', () => {
    const gameA = generateSpiderGame(1234);
    const gameB = generateSpiderGame(1234);

    expect(gameA.columns[0][0].rank).toBe(gameB.columns[0][0].rank);
    expect(gameA.columns[9][0].rank).toBe(gameB.columns[9][0].rank);
  });

  it('same seed and suit level generate same layout', () => {
    const gameA = generateSpiderGame(4321, 4);
    const gameB = generateSpiderGame(4321, 4);

    expect(gameA.columns).toEqual(gameB.columns);
    expect(gameA.stock).toEqual(gameB.stock);
  });
});

describe('SpiderSolitaire - Move validation', () => {
  it('validates descending face-up sequences', () => {
    const column = [
      { rank: 'K', value: 13, faceUp: true },
      { rank: 'Q', value: 12, faceUp: true },
      { rank: 'J', value: 11, faceUp: true },
    ];
    expect(isDescendingSequence(column, 0)).toBe(true);
  });

  it('rejects sequences with face-down cards or gaps', () => {
    const column = [
      { rank: 'K', value: 13, faceUp: true },
      { rank: 'Q', value: 12, faceUp: false },
      { rank: '10', value: 10, faceUp: true },
    ];
    expect(isDescendingSequence(column, 0)).toBe(false);
  });

  it('requires same-suit descending sequences for moving stacks', () => {
    const sameSuit = [
      { rank: 'K', value: 13, suit: '♠', faceUp: true },
      { rank: 'Q', value: 12, suit: '♠', faceUp: true },
      { rank: 'J', value: 11, suit: '♠', faceUp: true },
    ];
    const mixedSuit = [
      { rank: 'K', value: 13, suit: '♠', faceUp: true },
      { rank: 'Q', value: 12, suit: '♥', faceUp: true },
      { rank: 'J', value: 11, suit: '♥', faceUp: true },
    ];

    expect(isSameSuitDescendingSequence(sameSuit, 0)).toBe(true);
    expect(isSameSuitDescendingSequence(mixedSuit, 0)).toBe(false);
  });

  it('allows placement on higher card or empty column', () => {
    const sequence = [{ rank: 'Q', value: 12, faceUp: true }];
    const destination = [{ rank: 'K', value: 13, faceUp: true }];
    expect(canPlaceSequence(sequence, destination)).toBe(true);
    expect(canPlaceSequence(sequence, [])).toBe(true);
  });

  it('rejects placement on non-adjacent card', () => {
    const sequence = [{ rank: 'Q', value: 12, faceUp: true }];
    const destination = [{ rank: '10', value: 10, faceUp: true }];
    expect(canPlaceSequence(sequence, destination)).toBe(false);
  });
});

describe('SpiderSolitaire - Completed runs', () => {
  it('removes completed King-to-Ace run', () => {
    const column = [
      { rank: 'K', value: 13, faceUp: true },
      { rank: 'Q', value: 12, faceUp: true },
      { rank: 'J', value: 11, faceUp: true },
      { rank: '10', value: 10, faceUp: true },
      { rank: '9', value: 9, faceUp: true },
      { rank: '8', value: 8, faceUp: true },
      { rank: '7', value: 7, faceUp: true },
      { rank: '6', value: 6, faceUp: true },
      { rank: '5', value: 5, faceUp: true },
      { rank: '4', value: 4, faceUp: true },
      { rank: '3', value: 3, faceUp: true },
      { rank: '2', value: 2, faceUp: true },
      { rank: 'A', value: 1, faceUp: true },
    ];

    const { columns, completedRuns } = removeCompletedRuns([column]);
    expect(completedRuns).toBe(1);
    expect(columns[0].length).toBe(0);
  });

  it('keeps incomplete runs', () => {
    const column = [
      { rank: 'K', value: 13, faceUp: true },
      { rank: 'Q', value: 12, faceUp: true },
      { rank: 'J', value: 11, faceUp: true },
    ];

    const { columns, completedRuns } = removeCompletedRuns([column]);
    expect(completedRuns).toBe(0);
    expect(columns[0].length).toBe(3);
  });

  it('does not remove mixed-suit king-to-ace run', () => {
    const column = [
      { rank: 'K', value: 13, suit: '♠', faceUp: true },
      { rank: 'Q', value: 12, suit: '♥', faceUp: true },
      { rank: 'J', value: 11, suit: '♥', faceUp: true },
      { rank: '10', value: 10, suit: '♥', faceUp: true },
      { rank: '9', value: 9, suit: '♥', faceUp: true },
      { rank: '8', value: 8, suit: '♥', faceUp: true },
      { rank: '7', value: 7, suit: '♥', faceUp: true },
      { rank: '6', value: 6, suit: '♥', faceUp: true },
      { rank: '5', value: 5, suit: '♥', faceUp: true },
      { rank: '4', value: 4, suit: '♥', faceUp: true },
      { rank: '3', value: 3, suit: '♥', faceUp: true },
      { rank: '2', value: 2, suit: '♥', faceUp: true },
      { rank: 'A', value: 1, suit: '♥', faceUp: true },
    ];

    const { columns, completedRuns } = removeCompletedRuns([column]);
    expect(completedRuns).toBe(0);
    expect(columns[0]).toHaveLength(13);
  });
});

describe('SpiderSolitaire - Sequence move execution', () => {
  it('moves a valid sequence and flips source top card face up', () => {
    const columns = [
      [
        { rank: 'K', value: 13, faceUp: false },
        { rank: 'Q', value: 12, faceUp: true },
      ],
      [
        { rank: 'K', value: 13, faceUp: true },
      ],
    ];

    const result = moveSequence(columns, 0, 1, 1);
    expect(result.ok).toBe(true);
    expect(result.columns[0].length).toBe(1);
    expect(result.columns[0][0].faceUp).toBe(true);
    expect(result.columns[1].map(c => c.rank)).toEqual(['K', 'Q']);
  });

  it('rejects invalid destination moves', () => {
    const columns = [
      [{ rank: 'Q', value: 12, faceUp: true }],
      [{ rank: '10', value: 10, faceUp: true }],
    ];

    const result = moveSequence(columns, 0, 0, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid-destination');
  });
});
