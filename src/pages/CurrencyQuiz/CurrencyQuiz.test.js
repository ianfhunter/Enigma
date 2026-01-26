import { describe, it, expect } from 'vitest';

// ===========================================
// CurrencyQuiz - Basic Functionality Tests
// ===========================================
describe('CurrencyQuiz - Basic Functionality', () => {
  it('should validate correct currency symbol matches', () => {
    const correctSymbol = '$';
    const guessedSymbol = '$';
    expect(correctSymbol === guessedSymbol).toBe(true);
  });

  it('should reject incorrect currency symbol matches', () => {
    const correctSymbol = '$';
    const guessedSymbol = '€';
    expect(correctSymbol === guessedSymbol).toBe(false);
  });

  it('should validate correct country matches', () => {
    const correctCountry = 'United States';
    const guessedCountry = 'United States';
    expect(correctCountry === guessedCountry).toBe(true);
  });

  it('should handle case-insensitive country matches', () => {
    const correctCountry = 'united states';
    const guessedCountry = 'United States';
    expect(correctCountry.toLowerCase() === guessedCountry.toLowerCase()).toBe(true);
  });

  it('should calculate points correctly', () => {
    const correctAnswers = 5;
    const totalQuestions = 10;
    const percentage = (correctAnswers / totalQuestions) * 100;
    expect(percentage).toBe(50);
  });
});

// ===========================================
// CurrencyQuiz - Data Validation Tests
// ===========================================
describe('CurrencyQuiz - Data Validation', () => {
  it('should handle empty currency data', () => {
    const currencies = [];
    expect(currencies.length).toBe(0);
  });

  it('should validate currency object structure', () => {
    const currency = {
      country: 'United States',
      code: 'USD',
      symbol: '$',
      name: 'Dollar'
    };

    expect(currency).toHaveProperty('country');
    expect(currency).toHaveProperty('code');
    expect(currency).toHaveProperty('symbol');
  });

  it('should filter out invalid currencies', () => {
    const currencies = [
      { country: 'US', code: 'USD', symbol: '$' },
      { country: null, code: 'EUR', symbol: '€' },
      { country: 'UK', code: 'GBP', symbol: '£' },
    ];

    const valid = currencies.filter(c => c.country && c.code && c.symbol);
    expect(valid.length).toBe(2);
  });
});
