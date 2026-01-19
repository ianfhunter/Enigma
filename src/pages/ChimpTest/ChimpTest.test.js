import { describe, it, expect } from 'vitest';

// ===========================================
// ChimpTest - Sequence Generation Tests
// ===========================================
describe('ChimpTest - Sequence Generation', () => {
  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function generateSequence(length, seed) {
    const random = createSeededRandom(seed);
    const positions = Array.from({ length }, (_, i) => i);
    const shuffled = [...positions].sort(() => random() - 0.5);

    return shuffled.map((pos, idx) => ({
      number: idx + 1,
      index: pos,
    }));
  }

  it('should generate sequence of correct length', () => {
    const seq = generateSequence(5, 12345);
    expect(seq.length).toBe(5);
  });

  it('should number boxes 1 to N', () => {
    const seq = generateSequence(7, 12345);
    const numbers = seq.map(s => s.number).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should use all positions', () => {
    const seq = generateSequence(5, 12345);
    const indices = seq.map(s => s.index).sort((a, b) => a - b);
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });

  it('should be deterministic with same seed', () => {
    const seq1 = generateSequence(5, 12345);
    const seq2 = generateSequence(5, 12345);

    for (let i = 0; i < 5; i++) {
      expect(seq1[i].number).toBe(seq2[i].number);
      expect(seq1[i].index).toBe(seq2[i].index);
    }
  });

  it('should differ with different seeds', () => {
    const seq1 = generateSequence(5, 12345);
    const seq2 = generateSequence(5, 67890);

    // At least one should differ
    let anyDifferent = false;
    for (let i = 0; i < 5; i++) {
      if (seq1[i].index !== seq2[i].index) {
        anyDifferent = true;
        break;
      }
    }
    expect(anyDifferent).toBe(true);
  });
});

// ===========================================
// ChimpTest - Difficulty Settings Tests
// ===========================================
describe('ChimpTest - Difficulty Settings', () => {
  const DIFFICULTIES = {
    easy: { startLength: 3, increment: 1, label: 'Easy' },
    medium: { startLength: 4, increment: 1, label: 'Medium' },
    hard: { startLength: 5, increment: 1, label: 'Hard' },
  };

  it('should have increasing start lengths by difficulty', () => {
    expect(DIFFICULTIES.easy.startLength).toBeLessThan(DIFFICULTIES.medium.startLength);
    expect(DIFFICULTIES.medium.startLength).toBeLessThan(DIFFICULTIES.hard.startLength);
  });

  it('should calculate round length correctly', () => {
    const { startLength, increment } = DIFFICULTIES.medium;
    const round = 5;
    const roundLength = startLength + (round * increment);
    expect(roundLength).toBe(9); // 4 + 5 = 9
  });
});

// ===========================================
// ChimpTest - Click Validation Tests
// ===========================================
describe('ChimpTest - Click Validation', () => {
  function validateClick(clickedNumbers, clickedNumber) {
    const expectedNumber = clickedNumbers.length + 1;
    return clickedNumber === expectedNumber;
  }

  it('should accept correct first click', () => {
    const clicked = [];
    expect(validateClick(clicked, 1)).toBe(true);
  });

  it('should accept correct sequence', () => {
    let clicked = [];
    for (let i = 1; i <= 5; i++) {
      expect(validateClick(clicked, i)).toBe(true);
      clicked = [...clicked, i];
    }
  });

  it('should reject wrong click', () => {
    const clicked = [1, 2];
    expect(validateClick(clicked, 5)).toBe(false); // Expected 3
  });

  it('should reject out of order click', () => {
    const clicked = [];
    expect(validateClick(clicked, 3)).toBe(false); // Expected 1
  });
});

// ===========================================
// ChimpTest - Round Completion Tests
// ===========================================
describe('ChimpTest - Round Completion', () => {
  function isRoundComplete(clickedNumbers, sequenceLength) {
    return clickedNumbers.length === sequenceLength;
  }

  it('should detect incomplete round', () => {
    expect(isRoundComplete([1, 2, 3], 5)).toBe(false);
  });

  it('should detect complete round', () => {
    expect(isRoundComplete([1, 2, 3, 4, 5], 5)).toBe(true);
  });

  it('should handle empty clicks', () => {
    expect(isRoundComplete([], 5)).toBe(false);
  });
});

// ===========================================
// ChimpTest - Score Tracking Tests
// ===========================================
describe('ChimpTest - Score Tracking', () => {
  function updateBestScore(currentBest, newScore) {
    return Math.max(currentBest, newScore);
  }

  it('should update best score when new score is higher', () => {
    const best = updateBestScore(5, 7);
    expect(best).toBe(7);
  });

  it('should keep best score when new score is lower', () => {
    const best = updateBestScore(5, 3);
    expect(best).toBe(5);
  });

  it('should keep best score when equal', () => {
    const best = updateBestScore(5, 5);
    expect(best).toBe(5);
  });
});

// ===========================================
// ChimpTest - Game State Tests
// ===========================================
describe('ChimpTest - Game State', () => {
  function determineNextState(currentState, wasCorrectClick, isRoundComplete) {
    if (currentState === 'playing') {
      if (!wasCorrectClick) {
        return 'lost';
      }
      if (isRoundComplete) {
        return 'waiting'; // Next round
      }
      return 'playing';
    }
    return currentState;
  }

  it('should transition to lost on wrong click', () => {
    expect(determineNextState('playing', false, false)).toBe('lost');
  });

  it('should transition to waiting when round complete', () => {
    expect(determineNextState('playing', true, true)).toBe('waiting');
  });

  it('should stay playing on correct partial click', () => {
    expect(determineNextState('playing', true, false)).toBe('playing');
  });
});
