import { describe, it, expect } from 'vitest';
import {
  createSpiderDeck,
  dealTableau,
  generateSpiderGame,
  isDescendingSequence,
  canPlaceSequence,
  removeCompletedRuns,
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
});
