import { describe, it, expect } from 'vitest';
import {
  buildSolvedFoundations,
  canMoveToFoundation,
  canMoveToTableau,
  createDeck,
  dealKlondike,
  revealTopCard,
  shuffleDeck,
} from './Klondike';

const getCard = (rank, suit) => ({
  id: `${rank}${suit}`,
  rank,
  suit,
  value: rank === 'A' ? 1 : rank === 'K' ? 13 : parseInt(rank, 10),
  color: suit === '♥' || suit === '♦' ? 'red' : 'black',
  faceUp: true,
});

describe('Klondike helpers', () => {
  it('deals a standard Klondike layout from a deck', () => {
    const deck = createDeck();
    const { tableau, stock } = dealKlondike(deck);

    expect(tableau).toHaveLength(7);
    tableau.forEach((column, index) => {
      expect(column).toHaveLength(index + 1);
      column.forEach((card, cardIndex) => {
        const shouldBeFaceUp = cardIndex === column.length - 1;
        expect(card.faceUp).toBe(shouldBeFaceUp);
      });
    });

    const totalTableau = tableau.reduce((sum, col) => sum + col.length, 0);
    expect(totalTableau).toBe(28);
    expect(stock).toHaveLength(24);
    expect(totalTableau + stock.length).toBe(52);
  });

  it('shuffles deterministically with a seed', () => {
    const deck = createDeck();
    const shuffled1 = shuffleDeck(deck, 12345).map(card => card.id);
    const shuffled2 = shuffleDeck(deck, 12345).map(card => card.id);
    expect(shuffled1.slice(0, 10)).toEqual(shuffled2.slice(0, 10));
  });

  it('validates tableau moves by alternating colors and descending ranks', () => {
    const targetColumn = [getCard('8', '♠')];
    const validCard = getCard('7', '♥');
    const invalidCardSameColor = getCard('7', '♣');
    const invalidCardRank = getCard('6', '♥');

    expect(canMoveToTableau(validCard, targetColumn)).toBe(true);
    expect(canMoveToTableau(invalidCardSameColor, targetColumn)).toBe(false);
    expect(canMoveToTableau(invalidCardRank, targetColumn)).toBe(false);
    expect(canMoveToTableau(getCard('K', '♦'), [])).toBe(true);
  });

  it('validates foundation moves in ascending suit order', () => {
    const foundation = [getCard('A', '♣')];
    expect(canMoveToFoundation(getCard('2', '♣'), foundation)).toBe(true);
    expect(canMoveToFoundation(getCard('2', '♠'), foundation)).toBe(false);
    expect(canMoveToFoundation(getCard('A', '♥'), [])).toBe(true);
    expect(canMoveToFoundation(getCard('2', '♥'), [])).toBe(false);
  });

  it('reveals the top card when a face-down card is exposed', () => {
    const column = [
      { ...getCard('5', '♠'), faceUp: true },
      { ...getCard('4', '♥'), faceUp: false },
    ];
    const revealed = revealTopCard(column);
    expect(revealed[revealed.length - 1].faceUp).toBe(true);
  });

  it('builds solved foundations with 13 cards each', () => {
    const foundations = buildSolvedFoundations();
    Object.values(foundations).forEach(pile => {
      expect(pile).toHaveLength(13);
      expect(pile[0].rank).toBe('A');
      expect(pile[pile.length - 1].rank).toBe('K');
    });
  });
});
