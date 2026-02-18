import { describe, expect, it } from 'vitest';
import {
  CARD_VALUES,
  SUIT_ORDER,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  createDeck,
  dealFreecell,
  getMaxMovableCards,
  getMovableSequence,
} from './Freecell.jsx';

describe('Freecell - deck creation', () => {
  it('creates a 52-card deck with four suits', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const suits = new Set(deck.map(card => card.suit));
    expect(suits.size).toBe(4);
    SUIT_ORDER.forEach(suit => expect(suits.has(suit)).toBe(true));
  });

  it('assigns values to ranks', () => {
    const deck = createDeck();
    const ace = deck.find(card => card.rank === 'A');
    const king = deck.find(card => card.rank === 'K');
    expect(ace.value).toBe(CARD_VALUES.A);
    expect(king.value).toBe(CARD_VALUES.K);
  });
});

describe('Freecell - deal', () => {
  it('deals 8 columns with standard counts', () => {
    const { tableau, freeCells, foundations } = dealFreecell(42);
    expect(tableau).toHaveLength(8);
    expect(tableau.slice(0, 4).every(column => column.length === 7)).toBe(true);
    expect(tableau.slice(4).every(column => column.length === 6)).toBe(true);
    expect(freeCells).toHaveLength(4);
    expect(freeCells.every(cell => cell === null)).toBe(true);
    const totalCards = tableau.reduce((sum, column) => sum + column.length, 0);
    expect(totalCards).toBe(52);
    SUIT_ORDER.forEach(suit => expect(foundations[suit]).toEqual([]));
  });

  it('produces deterministic deals for the same seed', () => {
    const first = dealFreecell(99);
    const second = dealFreecell(99);
    expect(first.tableau[0][0].rank).toBe(second.tableau[0][0].rank);
    expect(first.tableau[7][5].suit).toBe(second.tableau[7][5].suit);
  });
});

describe('Freecell - moves', () => {
  it('validates tableau placement rules', () => {
    const redNine = { suit: '♥', color: 'red', value: 9 };
    const blackEight = { suit: '♠', color: 'black', value: 8 };
    const blackNine = { suit: '♣', color: 'black', value: 9 };

    expect(canPlaceOnTableau(blackEight, redNine)).toBe(true);
    expect(canPlaceOnTableau(blackNine, redNine)).toBe(false);
    expect(canPlaceOnTableau(redNine, null)).toBe(true);
  });

  it('validates foundation placement rules', () => {
    const aceSpades = { suit: '♠', value: 1 };
    const twoSpades = { suit: '♠', value: 2 };
    const twoHearts = { suit: '♥', value: 2 };

    expect(canPlaceOnFoundation(aceSpades, [])).toBe(true);
    expect(canPlaceOnFoundation(twoSpades, [])).toBe(false);
    expect(canPlaceOnFoundation(twoSpades, [aceSpades])).toBe(true);
    expect(canPlaceOnFoundation(twoHearts, [aceSpades])).toBe(false);
  });

  it('builds valid movable sequences', () => {
    const column = [
      { suit: '♠', color: 'black', value: 6 },
      { suit: '♥', color: 'red', value: 5 },
      { suit: '♣', color: 'black', value: 4 },
    ];

    const sequence = getMovableSequence(column, 0);
    expect(sequence).toHaveLength(3);

    const invalidColumn = [
      { suit: '♠', color: 'black', value: 6 },
      { suit: '♣', color: 'black', value: 5 },
    ];
    expect(getMovableSequence(invalidColumn, 0)).toBeNull();
  });

  it('calculates maximum movable cards based on free cells and empty columns', () => {
    expect(getMaxMovableCards(0, 0)).toBe(1);
    expect(getMaxMovableCards(1, 0)).toBe(2);
    expect(getMaxMovableCards(0, 1)).toBe(2);
    expect(getMaxMovableCards(2, 1)).toBe(6);
  });
});
