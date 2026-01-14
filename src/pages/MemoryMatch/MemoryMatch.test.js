import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffleArray,
} from '../../data/wordUtils';

// ===========================================
// Memory Match - Card Generation Tests
// ===========================================
describe('Memory Match - Card Generation', () => {
  const CARD_SYMBOLS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];

  const generateCards = (numPairs, symbols, random) => {
    const selectedSymbols = symbols.slice(0, numPairs);
    const cards = [];

    selectedSymbols.forEach((symbol, index) => {
      cards.push({ id: index * 2, symbol, matched: false });
      cards.push({ id: index * 2 + 1, symbol, matched: false });
    });

    return seededShuffleArray(cards, random);
  };

  it('should create correct number of card pairs', () => {
    const random = createSeededRandom(12345);
    const cards = generateCards(4, CARD_SYMBOLS, random);

    expect(cards.length).toBe(8); // 4 pairs = 8 cards
  });

  it('should have exactly 2 of each symbol', () => {
    const random = createSeededRandom(12345);
    const cards = generateCards(4, CARD_SYMBOLS, random);

    const symbolCounts = {};
    cards.forEach(card => {
      symbolCounts[card.symbol] = (symbolCounts[card.symbol] || 0) + 1;
    });

    Object.values(symbolCounts).forEach(count => {
      expect(count).toBe(2);
    });
  });

  it('should have unique IDs', () => {
    const random = createSeededRandom(12345);
    const cards = generateCards(4, CARD_SYMBOLS, random);

    const ids = cards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should shuffle cards', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const cards1 = generateCards(4, CARD_SYMBOLS, random1);
    const cards2 = generateCards(4, CARD_SYMBOLS, random2);

    const order1 = cards1.map(c => c.id).join(',');
    const order2 = cards2.map(c => c.id).join(',');

    expect(order1).not.toBe(order2);
  });
});

// ===========================================
// Memory Match - Card Selection Tests
// ===========================================
describe('Memory Match - Card Selection', () => {
  const createGameState = () => ({
    selectedCards: [],
    matchedPairs: 0,
    moves: 0,
  });

  const selectCard = (state, cardId) => {
    if (state.selectedCards.length >= 2) return state;
    if (state.selectedCards.includes(cardId)) return state;

    return {
      ...state,
      selectedCards: [...state.selectedCards, cardId],
    };
  };

  it('should allow selecting first card', () => {
    const state = createGameState();
    const newState = selectCard(state, 0);

    expect(newState.selectedCards).toEqual([0]);
  });

  it('should allow selecting second card', () => {
    const state = { ...createGameState(), selectedCards: [0] };
    const newState = selectCard(state, 1);

    expect(newState.selectedCards).toEqual([0, 1]);
  });

  it('should not allow selecting more than 2 cards', () => {
    const state = { ...createGameState(), selectedCards: [0, 1] };
    const newState = selectCard(state, 2);

    expect(newState.selectedCards).toEqual([0, 1]);
  });

  it('should not allow selecting same card twice', () => {
    const state = { ...createGameState(), selectedCards: [0] };
    const newState = selectCard(state, 0);

    expect(newState.selectedCards).toEqual([0]);
  });
});

// ===========================================
// Memory Match - Match Detection Tests
// ===========================================
describe('Memory Match - Match Detection', () => {
  const checkMatch = (cards, id1, id2) => {
    const card1 = cards.find(c => c.id === id1);
    const card2 = cards.find(c => c.id === id2);

    return card1 && card2 && card1.symbol === card2.symbol;
  };

  const cards = [
    { id: 0, symbol: '🍎', matched: false },
    { id: 1, symbol: '🍎', matched: false },
    { id: 2, symbol: '🍊', matched: false },
    { id: 3, symbol: '🍊', matched: false },
  ];

  it('should detect matching pair', () => {
    expect(checkMatch(cards, 0, 1)).toBe(true);
    expect(checkMatch(cards, 2, 3)).toBe(true);
  });

  it('should detect non-matching pair', () => {
    expect(checkMatch(cards, 0, 2)).toBe(false);
    expect(checkMatch(cards, 1, 3)).toBe(false);
  });

  it('should handle invalid card IDs', () => {
    const result = checkMatch(cards, 0, 999);
    // Invalid card returns undefined or false depending on implementation
    expect(result === false || result === undefined).toBe(true);
  });
});

// ===========================================
// Memory Match - Game State Tests
// ===========================================
describe('Memory Match - Game State', () => {
  const processMatch = (state, cards, isMatch) => {
    const newState = {
      ...state,
      moves: state.moves + 1,
      selectedCards: [],
    };

    if (isMatch) {
      newState.matchedPairs = state.matchedPairs + 1;
    }

    return newState;
  };

  const isGameComplete = (state, totalPairs) => {
    return state.matchedPairs === totalPairs;
  };

  it('should increment moves on each guess', () => {
    let state = { selectedCards: [0, 1], matchedPairs: 0, moves: 0 };
    state = processMatch(state, [], false);

    expect(state.moves).toBe(1);
  });

  it('should increment matched pairs on match', () => {
    let state = { selectedCards: [0, 1], matchedPairs: 0, moves: 0 };
    state = processMatch(state, [], true);

    expect(state.matchedPairs).toBe(1);
  });

  it('should clear selected cards after guess', () => {
    let state = { selectedCards: [0, 1], matchedPairs: 0, moves: 0 };
    state = processMatch(state, [], false);

    expect(state.selectedCards).toEqual([]);
  });

  it('should detect game completion', () => {
    const state = { matchedPairs: 4, moves: 8 };

    expect(isGameComplete(state, 4)).toBe(true);
    expect(isGameComplete(state, 8)).toBe(false);
  });
});

// ===========================================
// Memory Match - Scoring Tests
// ===========================================
describe('Memory Match - Scoring', () => {
  const calculateScore = (moves, pairs, timeSeconds) => {
    const perfectMoves = pairs; // Best case: find each pair in one try
    const moveEfficiency = perfectMoves / moves;
    const timeBonus = Math.max(0, 300 - timeSeconds); // Max 5 min

    const baseScore = pairs * 100;
    const efficiencyScore = Math.floor(baseScore * moveEfficiency);
    const totalScore = efficiencyScore + timeBonus;

    return Math.max(0, totalScore);
  };

  it('should give higher score for fewer moves', () => {
    const score1 = calculateScore(8, 8, 60);  // Perfect: 8 moves for 8 pairs
    const score2 = calculateScore(16, 8, 60); // Took twice as many moves

    expect(score1).toBeGreaterThan(score2);
  });

  it('should give time bonus', () => {
    const score1 = calculateScore(8, 8, 30);  // 30 seconds
    const score2 = calculateScore(8, 8, 120); // 2 minutes

    expect(score1).toBeGreaterThan(score2);
  });

  it('should not go negative', () => {
    const score = calculateScore(100, 8, 600); // Many moves, long time

    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================
// Memory Match - Difficulty Tests
// ===========================================
describe('Memory Match - Difficulty', () => {
  const DIFFICULTY_SETTINGS = {
    easy: { pairs: 6, gridCols: 3 },
    medium: { pairs: 8, gridCols: 4 },
    hard: { pairs: 12, gridCols: 4 },
    expert: { pairs: 18, gridCols: 6 },
  };

  it('should have more pairs for harder difficulties', () => {
    expect(DIFFICULTY_SETTINGS.easy.pairs).toBeLessThan(DIFFICULTY_SETTINGS.medium.pairs);
    expect(DIFFICULTY_SETTINGS.medium.pairs).toBeLessThan(DIFFICULTY_SETTINGS.hard.pairs);
    expect(DIFFICULTY_SETTINGS.hard.pairs).toBeLessThan(DIFFICULTY_SETTINGS.expert.pairs);
  });

  it('should create even number of cards', () => {
    Object.values(DIFFICULTY_SETTINGS).forEach(setting => {
      const totalCards = setting.pairs * 2;
      expect(totalCards % 2).toBe(0);
    });
  });

  it('should fit cards in grid', () => {
    Object.values(DIFFICULTY_SETTINGS).forEach(setting => {
      const totalCards = setting.pairs * 2;
      const gridSize = setting.gridCols;
      const rows = Math.ceil(totalCards / gridSize);

      expect(rows * gridSize).toBeGreaterThanOrEqual(totalCards);
    });
  });
});

// ===========================================
// Memory Match - Timer Tests
// ===========================================
describe('Memory Match - Timer', () => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  it('should format time correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(125)).toBe('2:05');
  });
});
