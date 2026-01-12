import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffleArray,
  stringToSeed,
} from '../../data/wordUtils';

// ===========================================
// Flag Guesser - Country Selection Tests
// ===========================================
describe('Flag Guesser - Country Selection', () => {
  const mockCountries = [
    { code: 'US', name: 'United States' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'CA', name: 'Canada' },
  ];

  const selectRandomCountry = (countries, random) => {
    const index = Math.floor(random() * countries.length);
    return countries[index];
  };

  it('should select a country from the list', () => {
    const random = createSeededRandom(12345);
    const country = selectRandomCountry(mockCountries, random);

    expect(mockCountries).toContainEqual(country);
  });

  it('should select different countries with different seeds', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const selections1 = Array(10).fill(null).map(() => selectRandomCountry(mockCountries, random1));
    const selections2 = Array(10).fill(null).map(() => selectRandomCountry(mockCountries, random2));

    // At least some should differ
    const same = selections1.filter((c, i) => c.code === selections2[i].code).length;
    expect(same).toBeLessThan(10);
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const country1 = selectRandomCountry(mockCountries, random1);
    const country2 = selectRandomCountry(mockCountries, random2);

    expect(country1).toEqual(country2);
  });
});

// ===========================================
// Flag Guesser - Answer Validation Tests
// ===========================================
describe('Flag Guesser - Answer Validation', () => {
  const normalizeAnswer = (answer) => {
    return answer.toLowerCase().trim().replace(/[^a-z\s]/g, '');
  };

  const checkAnswer = (guess, correctCountry, acceptedNames) => {
    const normalizedGuess = normalizeAnswer(guess);
    const normalizedCorrect = normalizeAnswer(correctCountry);

    if (normalizedGuess === normalizedCorrect) return true;

    // Check accepted aliases
    if (acceptedNames) {
      return acceptedNames.some(name => normalizeAnswer(name) === normalizedGuess);
    }

    return false;
  };

  it('should accept exact match', () => {
    expect(checkAnswer('France', 'France')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(checkAnswer('FRANCE', 'France')).toBe(true);
    expect(checkAnswer('france', 'France')).toBe(true);
    expect(checkAnswer('FrAnCe', 'France')).toBe(true);
  });

  it('should ignore leading/trailing whitespace', () => {
    expect(checkAnswer('  France  ', 'France')).toBe(true);
  });

  it('should accept common aliases', () => {
    const aliases = ['USA', 'US', 'America'];
    expect(checkAnswer('USA', 'United States', aliases)).toBe(true);
    expect(checkAnswer('America', 'United States', aliases)).toBe(true);
  });

  it('should reject wrong answer', () => {
    expect(checkAnswer('Germany', 'France')).toBe(false);
  });
});

// ===========================================
// Flag Guesser - Scoring Tests
// ===========================================
describe('Flag Guesser - Scoring', () => {
  const calculateScore = (correct, total, streak) => {
    const baseScore = correct * 10;
    const streakBonus = streak >= 5 ? streak * 2 : 0;
    const percentageBonus = total > 0 && correct === total ? 50 : 0;

    return baseScore + streakBonus + percentageBonus;
  };

  it('should give 10 points per correct answer', () => {
    expect(calculateScore(1, 1, 0)).toBe(60); // 10 + 50 (perfect)
    expect(calculateScore(5, 10, 0)).toBe(50);
  });

  it('should give streak bonus for 5+ streak', () => {
    expect(calculateScore(5, 5, 5)).toBe(110); // 50 + 10 + 50 (perfect)
    expect(calculateScore(5, 10, 5)).toBe(60); // 50 + 10
  });

  it('should give perfect score bonus', () => {
    expect(calculateScore(10, 10, 0)).toBe(150); // 100 + 50
  });

  it('should not give streak bonus for streak < 5', () => {
    expect(calculateScore(3, 3, 4)).toBe(80); // 30 + 0 + 50
  });
});

// ===========================================
// Flag Guesser - Streak Tests
// ===========================================
describe('Flag Guesser - Streak', () => {
  const updateStreak = (currentStreak, isCorrect) => {
    return isCorrect ? currentStreak + 1 : 0;
  };

  const getMaxStreak = (answers) => {
    let max = 0;
    let current = 0;

    for (const isCorrect of answers) {
      current = isCorrect ? current + 1 : 0;
      max = Math.max(max, current);
    }

    return max;
  };

  it('should increment streak on correct answer', () => {
    expect(updateStreak(0, true)).toBe(1);
    expect(updateStreak(5, true)).toBe(6);
  });

  it('should reset streak on wrong answer', () => {
    expect(updateStreak(5, false)).toBe(0);
    expect(updateStreak(0, false)).toBe(0);
  });

  it('should track maximum streak', () => {
    const answers = [true, true, true, false, true, true, true, true, true];
    expect(getMaxStreak(answers)).toBe(5);
  });
});

// ===========================================
// Flag Guesser - Difficulty Tests
// ===========================================
describe('Flag Guesser - Difficulty', () => {
  const DIFFICULTY_SETTINGS = {
    easy: { choices: 4, timeLimit: 30, countries: 'major' },
    medium: { choices: 6, timeLimit: 20, countries: 'common' },
    hard: { choices: 8, timeLimit: 15, countries: 'all' },
  };

  it('should have more choices for harder difficulty', () => {
    expect(DIFFICULTY_SETTINGS.easy.choices).toBeLessThan(DIFFICULTY_SETTINGS.medium.choices);
    expect(DIFFICULTY_SETTINGS.medium.choices).toBeLessThan(DIFFICULTY_SETTINGS.hard.choices);
  });

  it('should have less time for harder difficulty', () => {
    expect(DIFFICULTY_SETTINGS.easy.timeLimit).toBeGreaterThan(DIFFICULTY_SETTINGS.medium.timeLimit);
    expect(DIFFICULTY_SETTINGS.medium.timeLimit).toBeGreaterThan(DIFFICULTY_SETTINGS.hard.timeLimit);
  });
});

// ===========================================
// Flag Guesser - Multiple Choice Tests
// ===========================================
describe('Flag Guesser - Multiple Choice', () => {
  const generateChoices = (correctCountry, allCountries, numChoices, random) => {
    const choices = [correctCountry];
    const available = allCountries.filter(c => c.code !== correctCountry.code);
    const shuffled = seededShuffleArray(available, random);

    for (let i = 0; i < numChoices - 1 && i < shuffled.length; i++) {
      choices.push(shuffled[i]);
    }

    return seededShuffleArray(choices, random);
  };

  const mockCountries = [
    { code: 'US', name: 'United States' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'DE', name: 'Germany' },
  ];

  it('should include correct answer in choices', () => {
    const random = createSeededRandom(12345);
    const correct = mockCountries[0];
    const choices = generateChoices(correct, mockCountries, 4, random);

    expect(choices.some(c => c.code === correct.code)).toBe(true);
  });

  it('should generate correct number of choices', () => {
    const random = createSeededRandom(12345);
    const correct = mockCountries[0];
    const choices = generateChoices(correct, mockCountries, 4, random);

    expect(choices.length).toBe(4);
  });

  it('should not have duplicate choices', () => {
    const random = createSeededRandom(12345);
    const correct = mockCountries[0];
    const choices = generateChoices(correct, mockCountries, 4, random);

    const codes = choices.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
