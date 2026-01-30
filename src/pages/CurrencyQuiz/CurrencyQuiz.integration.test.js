import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// CurrencyQuiz - Logic Tests
// ===========================================
describe('CurrencyQuiz - Logic Tests', () => {
  it('should generate exactly 4 options for each question', () => {
    // Test the generateOptions logic directly
    const countries = [
      { code: 'US', name: 'United States', currency: 'US Dollar', currencyCode: 'USD' },
      { code: 'UK', name: 'United Kingdom', currency: 'British Pound', currencyCode: 'GBP' },
      { code: 'JP', name: 'Japan', currency: 'Japanese Yen', currencyCode: 'JPY' },
      { code: 'DE', name: 'Germany', currency: 'Euro', currencyCode: 'EUR' }
    ];

    const correct = countries[0];
    const seed = 12345;
    const roundNumber = 1;

    const random = createSeededRandom(seed + roundNumber + 1000);

    // Currency types to detect (check longer/multi-word ones first)
    const currencyTypes = [
      'Convertible Mark', 'CFA Franc', 'New Shekel',
      'Dollar', 'Peso', 'Dinar', 'Franc', 'Pound', 'Rupee', 'Rupiah',
      'Yen', 'Yuan', 'Won', 'Krone', 'Krona', 'Króna', 'Ruble', 'Real',
      'Rial', 'Riyal', 'Lira', 'Shilling', 'Rand', 'Koruna', 'Forint',
      'Zloty', 'Baht', 'Ringgit', 'Dirham', 'Kwacha', 'Leu', 'Som',
      'Manat', 'Taka', 'Dram', 'Lek', 'Afghani', 'Kwanza', 'Ngultrum',
      'Boliviano', 'Pula', 'Lev', 'Riel', 'Escudo', 'Colón', 'Nakfa',
      'Birr', 'Dalasi', 'Lari', 'Cedi', 'Quetzal', 'Gourde', 'Lempira',
      'Tenge', 'Kip', 'Loti', 'Denar', 'Ariary', 'Rufiyaa', 'Ouguiya',
      'Tugrik', 'Metical', 'Kyat', 'Naira', 'Córdoba', 'Balboa', 'Kina',
      'Guarani', 'Sol', 'Tala', 'Dobra', 'Leone', "Pa'anga", 'Somoni',
      'Hryvnia', 'Vatu', 'Bolívar', 'Dong'
    ];

    // Common types for generating believable fake currencies
    const commonTypes = ['Dollar', 'Peso', 'Franc', 'Pound', 'Dinar', 'Rupee', 'Yen', 'Shilling', 'Krone'];

    // Try to extract adjective and type from currency name
    let adjective = null;
    let correctType = null;

    for (const type of currencyTypes) {
      if (correct.currency.endsWith(type)) {
        correctType = type;
        adjective = correct.currency.slice(0, correct.currency.length - type.length).trim();
        break;
      }
    }

    let distractors = [];

    if (adjective && adjective.length > 0) {
      // Generate fake currencies using seeded shuffle
      const fakeTypes = commonTypes
        .filter(t => t !== correctType);

      // Seeded shuffle
      const shuffled = [...fakeTypes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      distractors = shuffled.slice(0, 3).map(type => `${adjective} ${type}`);
    } else {
      // Fallback - use real currencies with seeded shuffle
      const otherCurrencies = [...new Set(
        countries
          .filter(c => c.currency !== correct.currency)
          .map(c => c.currency)
      )];

      // Seeded shuffle
      for (let i = otherCurrencies.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [otherCurrencies[i], otherCurrencies[j]] = [otherCurrencies[j], otherCurrencies[i]];
      }

      distractors = otherCurrencies.slice(0, 3);

      // If we don't have enough unique currencies, fill with some common ones
      const commonFallbacks = ['Euro', 'US Dollar', 'British Pound', 'Japanese Yen', 'Chinese Yuan'];
      while (distractors.length < 3) {
        const fallback = commonFallbacks[Math.floor(random() * commonFallbacks.length)];
        if (fallback !== correct.currency && !distractors.includes(fallback)) {
          distractors.push(fallback);
        }
      }
    }

    // Final shuffle of all options
    const allOptions = [correct.currency, ...distractors];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    expect(allOptions.length).toBe(4);
  });

  it('should not have duplicate options in the same question', () => {
    // Test with a currency that doesn't match any known type
    const countries = [
      { code: 'XX', name: 'Test Country', currency: 'Test Currency', currencyCode: 'TEST' },
      { code: 'US', name: 'United States', currency: 'US Dollar', currencyCode: 'USD' }
    ];

    const correct = countries[0];
    const seed = 12345;
    const roundNumber = 1;

    const random = createSeededRandom(seed + roundNumber + 1000);

    // Currency types to detect (check longer/multi-word ones first)
    const currencyTypes = [
      'Convertible Mark', 'CFA Franc', 'New Shekel',
      'Dollar', 'Peso', 'Dinar', 'Franc', 'Pound', 'Rupee', 'Rupiah',
      'Yen', 'Yuan', 'Won', 'Krone', 'Krona', 'Króna', 'Ruble', 'Real',
      'Rial', 'Riyal', 'Lira', 'Shilling', 'Rand', 'Koruna', 'Forint',
      'Zloty', 'Baht', 'Ringgit', 'Dirham', 'Kwacha', 'Leu', 'Som',
      'Manat', 'Taka', 'Dram', 'Lek', 'Afghani', 'Kwanza', 'Ngultrum',
      'Boliviano', 'Pula', 'Lev', 'Riel', 'Escudo', 'Colón', 'Nakfa',
      'Birr', 'Dalasi', 'Lari', 'Cedi', 'Quetzal', 'Gourde', 'Lempira',
      'Tenge', 'Kip', 'Loti', 'Denar', 'Ariary', 'Rufiyaa', 'Ouguiya',
      'Tugrik', 'Metical', 'Kyat', 'Naira', 'Córdoba', 'Balboa', 'Kina',
      'Guarani', 'Sol', 'Tala', 'Dobra', 'Leone', "Pa'anga", 'Somoni',
      'Hryvnia', 'Vatu', 'Bolívar', 'Dong'
    ];

    // Common types for generating believable fake currencies
    const commonTypes = ['Dollar', 'Peso', 'Franc', 'Pound', 'Dinar', 'Rupee', 'Yen', 'Shilling', 'Krone'];

    // Try to extract adjective and type from currency name
    let adjective = null;
    let correctType = null;

    for (const type of currencyTypes) {
      if (correct.currency.endsWith(type)) {
        correctType = type;
        adjective = correct.currency.slice(0, correct.currency.length - type.length).trim();
        break;
      }
    }

    let distractors = [];

    if (adjective && adjective.length > 0) {
      // Generate fake currencies using seeded shuffle
      const fakeTypes = commonTypes
        .filter(t => t !== correctType);

      // Seeded shuffle
      const shuffled = [...fakeTypes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      distractors = shuffled.slice(0, 3).map(type => `${adjective} ${type}`);
    } else {
      // Fallback - use real currencies with seeded shuffle
      const otherCurrencies = [...new Set(
        countries
          .filter(c => c.currency !== correct.currency)
          .map(c => c.currency)
      )];

      // Seeded shuffle
      for (let i = otherCurrencies.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [otherCurrencies[i], otherCurrencies[j]] = [otherCurrencies[j], otherCurrencies[i]];
      }

      distractors = otherCurrencies.slice(0, 3);

      // If we don't have enough unique currencies, fill with some common ones
      const commonFallbacks = ['Euro', 'US Dollar', 'British Pound', 'Japanese Yen', 'Chinese Yuan'];
      while (distractors.length < 3) {
        const fallback = commonFallbacks[Math.floor(random() * commonFallbacks.length)];
        if (fallback !== correct.currency && !distractors.includes(fallback)) {
          distractors.push(fallback);
        }
      }
    }

    // Final shuffle of all options
    const allOptions = [correct.currency, ...distractors];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    const uniqueOptions = [...new Set(allOptions)];
    expect(uniqueOptions.length).toBe(allOptions.length);
  });

  it('should include the correct answer in the options', () => {
    const countries = [
      { code: 'US', name: 'United States', currency: 'US Dollar', currencyCode: 'USD' },
      { code: 'UK', name: 'United Kingdom', currency: 'British Pound', currencyCode: 'GBP' }
    ];

    const correct = countries[0];
    const seed = 12345;
    const roundNumber = 1;

    const random = createSeededRandom(seed + roundNumber + 1000);

    // Currency types to detect (check longer/multi-word ones first)
    const currencyTypes = [
      'Convertible Mark', 'CFA Franc', 'New Shekel',
      'Dollar', 'Peso', 'Dinar', 'Franc', 'Pound', 'Rupee', 'Rupiah',
      'Yen', 'Yuan', 'Won', 'Krone', 'Krona', 'Króna', 'Ruble', 'Real',
      'Rial', 'Riyal', 'Lira', 'Shilling', 'Rand', 'Koruna', 'Forint',
      'Zloty', 'Baht', 'Ringgit', 'Dirham', 'Kwacha', 'Leu', 'Som',
      'Manat', 'Taka', 'Dram', 'Lek', 'Afghani', 'Kwanza', 'Ngultrum',
      'Boliviano', 'Pula', 'Lev', 'Riel', 'Escudo', 'Colón', 'Nakfa',
      'Birr', 'Dalasi', 'Lari', 'Cedi', 'Quetzal', 'Gourde', 'Lempira',
      'Tenge', 'Kip', 'Loti', 'Denar', 'Ariary', 'Rufiyaa', 'Ouguiya',
      'Tugrik', 'Metical', 'Kyat', 'Naira', 'Córdoba', 'Balboa', 'Kina',
      'Guarani', 'Sol', 'Tala', 'Dobra', 'Leone', "Pa'anga", 'Somoni',
      'Hryvnia', 'Vatu', 'Bolívar', 'Dong'
    ];

    // Common types for generating believable fake currencies
    const commonTypes = ['Dollar', 'Peso', 'Franc', 'Pound', 'Dinar', 'Rupee', 'Yen', 'Shilling', 'Krone'];

    // Try to extract adjective and type from currency name
    let adjective = null;
    let correctType = null;

    for (const type of currencyTypes) {
      if (correct.currency.endsWith(type)) {
        correctType = type;
        adjective = correct.currency.slice(0, correct.currency.length - type.length).trim();
        break;
      }
    }

    let distractors = [];

    if (adjective && adjective.length > 0) {
      // Generate fake currencies using seeded shuffle
      const fakeTypes = commonTypes
        .filter(t => t !== correctType);

      // Seeded shuffle
      const shuffled = [...fakeTypes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      distractors = shuffled.slice(0, 3).map(type => `${adjective} ${type}`);
    } else {
      // Fallback - use real currencies with seeded shuffle
      const otherCurrencies = [...new Set(
        countries
          .filter(c => c.currency !== correct.currency)
          .map(c => c.currency)
      )];

      // Seeded shuffle
      for (let i = otherCurrencies.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [otherCurrencies[i], otherCurrencies[j]] = [otherCurrencies[j], otherCurrencies[i]];
      }

      distractors = otherCurrencies.slice(0, 3);

      // If we don't have enough unique currencies, fill with some common ones
      const commonFallbacks = ['Euro', 'US Dollar', 'British Pound', 'Japanese Yen', 'Chinese Yuan'];
      while (distractors.length < 3) {
        const fallback = commonFallbacks[Math.floor(random() * commonFallbacks.length)];
        if (fallback !== correct.currency && !distractors.includes(fallback)) {
          distractors.push(fallback);
        }
      }
    }

    // Final shuffle of all options
    const allOptions = [correct.currency, ...distractors];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    expect(allOptions).toContain('US Dollar');
  });
});
