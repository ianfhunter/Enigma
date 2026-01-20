import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffleArray,
} from '../../data/wordUtils';

// ===========================================
// National Anthem Quiz - Anthem Selection Tests
// ===========================================
describe('National Anthem Quiz - Anthem Selection', () => {
  const mockAnthems = [
    { isoCode: 'USA', countryName: 'United States', filename: 'usa.mp3' },
    { isoCode: 'FRA', countryName: 'France', filename: 'fra.mp3' },
    { isoCode: 'JPN', countryName: 'Japan', filename: 'jpn.mp3' },
    { isoCode: 'BRA', countryName: 'Brazil', filename: 'bra.mp3' },
    { isoCode: 'GBR', countryName: 'United Kingdom', filename: 'gbr.mp3' },
    { isoCode: 'DEU', countryName: 'Germany', filename: 'deu.mp3' },
    { isoCode: 'ITA', countryName: 'Italy', filename: 'ita.mp3' },
    { isoCode: 'CAN', countryName: 'Canada', filename: 'can.mp3' },
  ];

  const selectRandomAnthem = (anthems, random) => {
    const index = Math.floor(random() * anthems.length);
    return anthems[index];
  };

  it('should select an anthem from the list', () => {
    const random = createSeededRandom(12345);
    const anthem = selectRandomAnthem(mockAnthems, random);

    expect(mockAnthems).toContainEqual(anthem);
  });

  it('should select different anthems with different seeds', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const selections1 = Array(10).fill(null).map(() => selectRandomAnthem(mockAnthems, random1));
    const selections2 = Array(10).fill(null).map(() => selectRandomAnthem(mockAnthems, random2));

    // At least some should differ
    const same = selections1.filter((a, i) => a.isoCode === selections2[i].isoCode).length;
    expect(same).toBeLessThan(10);
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const anthem1 = selectRandomAnthem(mockAnthems, random1);
    const anthem2 = selectRandomAnthem(mockAnthems, random2);

    expect(anthem1).toEqual(anthem2);
  });
});

// ===========================================
// National Anthem Quiz - Answer Validation Tests
// ===========================================
describe('National Anthem Quiz - Answer Validation', () => {
  const checkAnswer = (guess, correctCountry) => {
    return guess === correctCountry;
  };

  it('should accept exact match', () => {
    expect(checkAnswer('France', 'France')).toBe(true);
  });

  it('should reject wrong answer', () => {
    expect(checkAnswer('Germany', 'France')).toBe(false);
  });

  it('should reject partial matches', () => {
    expect(checkAnswer('United', 'United States')).toBe(false);
  });
});

// ===========================================
// National Anthem Quiz - Region Hint Tests
// ===========================================
describe('National Anthem Quiz - Region Hints', () => {
  const getRegion = (isoCode) => {
    const regions = {
      USA: 'North America', CAN: 'North America', MEX: 'North America',
      FRA: 'Europe', DEU: 'Europe', GBR: 'Europe', ITA: 'Europe',
      JPN: 'Asia', CHN: 'Asia', IND: 'Asia',
      BRA: 'South America', ARG: 'South America',
      AUS: 'Oceania', NZL: 'Oceania',
      EGY: 'Africa', ZAF: 'Africa', NGA: 'Africa',
    };
    return regions[isoCode] || 'Unknown';
  };

  it('should return correct region for European countries', () => {
    expect(getRegion('FRA')).toBe('Europe');
    expect(getRegion('DEU')).toBe('Europe');
    expect(getRegion('GBR')).toBe('Europe');
  });

  it('should return correct region for Asian countries', () => {
    expect(getRegion('JPN')).toBe('Asia');
    expect(getRegion('CHN')).toBe('Asia');
  });

  it('should return correct region for American countries', () => {
    expect(getRegion('USA')).toBe('North America');
    expect(getRegion('BRA')).toBe('South America');
  });

  it('should return Unknown for unmapped countries', () => {
    expect(getRegion('XXX')).toBe('Unknown');
  });
});

// ===========================================
// National Anthem Quiz - Multiple Choice Tests
// ===========================================
describe('National Anthem Quiz - Multiple Choice', () => {
  const generateChoices = (correctAnthem, allAnthems, numChoices, random) => {
    const choices = [correctAnthem.countryName];
    const available = allAnthems.filter(a => a.isoCode !== correctAnthem.isoCode);
    const shuffled = seededShuffleArray(available, random);

    for (let i = 0; i < numChoices - 1 && i < shuffled.length; i++) {
      choices.push(shuffled[i].countryName);
    }

    return seededShuffleArray(choices, random);
  };

  const mockAnthems = [
    { isoCode: 'USA', countryName: 'United States' },
    { isoCode: 'FRA', countryName: 'France' },
    { isoCode: 'JPN', countryName: 'Japan' },
    { isoCode: 'BRA', countryName: 'Brazil' },
    { isoCode: 'DEU', countryName: 'Germany' },
  ];

  it('should include correct answer in choices', () => {
    const random = createSeededRandom(12345);
    const correct = mockAnthems[0];
    const choices = generateChoices(correct, mockAnthems, 4, random);

    expect(choices).toContain(correct.countryName);
  });

  it('should generate correct number of choices', () => {
    const random = createSeededRandom(12345);
    const correct = mockAnthems[0];
    const choices = generateChoices(correct, mockAnthems, 4, random);

    expect(choices.length).toBe(4);
  });

  it('should not have duplicate choices', () => {
    const random = createSeededRandom(12345);
    const correct = mockAnthems[0];
    const choices = generateChoices(correct, mockAnthems, 4, random);

    expect(new Set(choices).size).toBe(choices.length);
  });
});

// ===========================================
// National Anthem Quiz - Streak Tests
// ===========================================
describe('National Anthem Quiz - Streak', () => {
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
// National Anthem Quiz - Game Over Tests
// ===========================================
describe('National Anthem Quiz - Game Over', () => {
  const TOTAL_ROUNDS = 10;

  const getResultMessage = (score) => {
    const percentage = Math.round((score / TOTAL_ROUNDS) * 100);
    if (score === TOTAL_ROUNDS) return 'World Champion';
    if (percentage >= 80) return 'Diplomatic Expert';
    if (percentage >= 60) return 'Globe Trotter';
    if (percentage >= 40) return 'Keep exploring';
    return 'Time for a world tour';
  };

  const isWin = (score) => score >= Math.floor(TOTAL_ROUNDS / 2);

  it('should give best result for perfect score', () => {
    expect(getResultMessage(10)).toBe('World Champion');
  });

  it('should scale results with score percentage', () => {
    expect(getResultMessage(8)).toBe('Diplomatic Expert');
    expect(getResultMessage(6)).toBe('Globe Trotter');
    expect(getResultMessage(4)).toBe('Keep exploring');
    expect(getResultMessage(3)).toBe('Time for a world tour');
  });

  it('should count as win with 5+ correct', () => {
    expect(isWin(5)).toBe(true);
    expect(isWin(10)).toBe(true);
  });

  it('should count as loss with fewer than 5 correct', () => {
    expect(isWin(4)).toBe(false);
    expect(isWin(0)).toBe(false);
  });
});

// ===========================================
// National Anthem Quiz - Exclusion Tests
// ===========================================
describe('National Anthem Quiz - Used Anthem Exclusion', () => {
  const mockAnthems = [
    { isoCode: 'USA', countryName: 'United States' },
    { isoCode: 'FRA', countryName: 'France' },
    { isoCode: 'JPN', countryName: 'Japan' },
    { isoCode: 'BRA', countryName: 'Brazil' },
  ];

  const getAvailableAnthems = (allAnthems, usedIsoCodes) => {
    return allAnthems.filter(a => !usedIsoCodes.includes(a.isoCode));
  };

  it('should exclude already used anthems', () => {
    const used = ['USA', 'FRA'];
    const available = getAvailableAnthems(mockAnthems, used);

    expect(available.length).toBe(2);
    expect(available.some(a => a.isoCode === 'USA')).toBe(false);
    expect(available.some(a => a.isoCode === 'FRA')).toBe(false);
    expect(available.some(a => a.isoCode === 'JPN')).toBe(true);
    expect(available.some(a => a.isoCode === 'BRA')).toBe(true);
  });

  it('should return empty when all anthems used', () => {
    const used = ['USA', 'FRA', 'JPN', 'BRA'];
    const available = getAvailableAnthems(mockAnthems, used);

    expect(available.length).toBe(0);
  });

  it('should return all when none used', () => {
    const available = getAvailableAnthems(mockAnthems, []);

    expect(available.length).toBe(4);
  });
});
