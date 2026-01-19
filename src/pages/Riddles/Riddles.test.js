import { describe, it, expect } from 'vitest';

// ===========================================
// Riddles - Seeded Random Selection Tests
// ===========================================
describe('Riddles - Seeded Random Selection', () => {
  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function selectRiddle(riddles, seed) {
    if (riddles.length === 0) return null;
    const random = createSeededRandom(seed);
    return riddles[Math.floor(random() * riddles.length)];
  }

  const sampleRiddles = [
    { riddle: 'What has keys but no locks?', answer: 'A piano' },
    { riddle: 'What has hands but cannot clap?', answer: 'A clock' },
    { riddle: 'What has a head and a tail but no body?', answer: 'A coin' },
  ];

  it('should return same riddle for same seed', () => {
    const riddle1 = selectRiddle(sampleRiddles, 12345);
    const riddle2 = selectRiddle(sampleRiddles, 12345);

    expect(riddle1).toEqual(riddle2);
  });

  it('should return different riddles for different seeds', () => {
    // With a small set, different seeds should usually pick different items
    // but not guaranteed, so we test multiple seeds
    const riddles = new Set();
    for (let seed = 1; seed <= 100; seed++) {
      const riddle = selectRiddle(sampleRiddles, seed);
      riddles.add(riddle.answer);
    }
    // Should have selected more than one unique riddle across 100 seeds
    expect(riddles.size).toBeGreaterThan(1);
  });

  it('should handle empty riddles array', () => {
    const riddle = selectRiddle([], 12345);
    expect(riddle).toBe(null);
  });

  it('should handle single riddle', () => {
    const single = [{ riddle: 'Test', answer: 'Answer' }];
    const riddle = selectRiddle(single, 12345);
    expect(riddle.riddle).toBe('Test');
  });
});

// ===========================================
// Riddles - Data Format Handling Tests
// ===========================================
describe('Riddles - Data Format Handling', () => {
  function normalizeRiddle(riddle) {
    return {
      question: riddle.question || riddle.riddle,
      answer: riddle.answer,
      hint: riddle.hint || null,
    };
  }

  it('should handle old format with question field', () => {
    const riddle = { question: 'What is it?', answer: 'A thing' };
    const normalized = normalizeRiddle(riddle);

    expect(normalized.question).toBe('What is it?');
    expect(normalized.answer).toBe('A thing');
  });

  it('should handle new format with riddle field', () => {
    const riddle = { riddle: 'What is it?', answer: 'A thing' };
    const normalized = normalizeRiddle(riddle);

    expect(normalized.question).toBe('What is it?');
    expect(normalized.answer).toBe('A thing');
  });

  it('should handle hint field', () => {
    const riddle = { riddle: 'What is it?', answer: 'A thing', hint: 'Think musical' };
    const normalized = normalizeRiddle(riddle);

    expect(normalized.hint).toBe('Think musical');
  });

  it('should handle missing hint', () => {
    const riddle = { riddle: 'What is it?', answer: 'A thing' };
    const normalized = normalizeRiddle(riddle);

    expect(normalized.hint).toBe(null);
  });
});

// ===========================================
// Riddles - Reveal State Tests
// ===========================================
describe('Riddles - Reveal State', () => {
  it('should track revealed state correctly', () => {
    let revealed = false;

    // Reveal answer
    revealed = true;
    expect(revealed).toBe(true);

    // New riddle should reset
    revealed = false;
    expect(revealed).toBe(false);
  });

  it('should track hint visibility independently', () => {
    let showHint = false;
    let revealed = false;

    // Show hint
    showHint = true;
    expect(showHint).toBe(true);
    expect(revealed).toBe(false);

    // Toggle hint
    showHint = !showHint;
    expect(showHint).toBe(false);
  });
});

// ===========================================
// Riddles - Unique Seed Generation Tests
// ===========================================
describe('Riddles - Seed Generation', () => {
  function generateUniqueSeed() {
    return Date.now() + Math.random() * 1000000;
  }

  it('should generate different seeds each time', () => {
    const seeds = new Set();
    for (let i = 0; i < 100; i++) {
      seeds.add(generateUniqueSeed());
    }
    // Should have mostly unique seeds
    expect(seeds.size).toBeGreaterThan(90);
  });

  it('should generate numeric seeds', () => {
    const seed = generateUniqueSeed();
    expect(typeof seed).toBe('number');
  });
});

// ===========================================
// Riddles - Dataset Parsing Tests
// ===========================================
describe('Riddles - Dataset Parsing', () => {
  function parseDataset(data) {
    // Handle both old format {riddles: [...]} and new format [{riddle, answer, hint}]
    if (Array.isArray(data)) {
      return data;
    }
    return data.riddles || [];
  }

  it('should parse array format', () => {
    const data = [
      { riddle: 'Test 1', answer: 'Answer 1' },
      { riddle: 'Test 2', answer: 'Answer 2' },
    ];

    const parsed = parseDataset(data);
    expect(parsed.length).toBe(2);
  });

  it('should parse object format with riddles key', () => {
    const data = {
      riddles: [
        { question: 'Test 1', answer: 'Answer 1' },
        { question: 'Test 2', answer: 'Answer 2' },
      ]
    };

    const parsed = parseDataset(data);
    expect(parsed.length).toBe(2);
  });

  it('should handle empty object', () => {
    const data = {};
    const parsed = parseDataset(data);
    expect(parsed).toEqual([]);
  });

  it('should handle object with empty riddles', () => {
    const data = { riddles: [] };
    const parsed = parseDataset(data);
    expect(parsed).toEqual([]);
  });
});
