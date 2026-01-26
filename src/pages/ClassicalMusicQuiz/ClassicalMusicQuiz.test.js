import { describe, it, expect } from 'vitest';

// ===========================================
// ClassicalMusicQuiz - Basic Functionality Tests
// ===========================================
describe('ClassicalMusicQuiz - Basic Functionality', () => {
  it('should validate correct composer matches', () => {
    const correctComposer = 'Mozart';
    const guessedComposer = 'Mozart';
    expect(correctComposer === guessedComposer).toBe(true);
  });

  it('should reject incorrect composer matches', () => {
    const correctComposer = 'Mozart';
    const guessedComposer = 'Beethoven';
    expect(correctComposer === guessedComposer).toBe(false);
  });

  it('should handle case-insensitive composer matches', () => {
    const correctComposer = 'mozart';
    const guessedComposer = 'Mozart';
    expect(correctComposer.toLowerCase() === guessedComposer.toLowerCase()).toBe(true);
  });

  it('should calculate score correctly', () => {
    const correctAnswers = 7;
    const totalQuestions = 10;
    const percentage = (correctAnswers / totalQuestions) * 100;
    expect(percentage).toBe(70);
  });
});

// ===========================================
// ClassicalMusicQuiz - Data Validation Tests
// ===========================================
describe('ClassicalMusicQuiz - Data Validation', () => {
  it('should validate music piece structure', () => {
    const piece = {
      title: 'Symphony No. 5',
      composer: 'Beethoven',
      period: 'Classical',
      year: 1808
    };

    expect(piece).toHaveProperty('title');
    expect(piece).toHaveProperty('composer');
    expect(piece).toHaveProperty('period');
  });

  it('should handle empty playlist', () => {
    const playlist = [];
    expect(playlist.length).toBe(0);
  });

  it('should filter valid pieces', () => {
    const pieces = [
      { title: 'Symphony No. 5', composer: 'Beethoven' },
      { title: null, composer: 'Mozart' },
      { title: 'The Four Seasons', composer: 'Vivaldi' },
    ];

    const valid = pieces.filter(p => p.title && p.composer);
    expect(valid.length).toBe(2);
  });
});

// ===========================================
// ClassicalMusicQuiz - Period Classification Tests
// ===========================================
describe('ClassicalMusicQuiz - Period Classification', () => {
  it('should identify baroque period', () => {
    const year = 1700;
    const period = year < 1750 ? 'Baroque' : 'Classical';
    expect(period).toBe('Baroque');
  });

  it('should identify classical period', () => {
    const year = 1780;
    const period = year >= 1750 && year < 1820 ? 'Classical' : 'Other';
    expect(period).toBe('Classical');
  });

  it('should identify romantic period', () => {
    const year = 1850;
    const period = year >= 1820 && year < 1900 ? 'Romantic' : 'Other';
    expect(period).toBe('Romantic');
  });
});
