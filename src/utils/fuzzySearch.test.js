import { describe, it, expect } from 'vitest';
import { fuzzyMatch, fuzzySearchGames } from './fuzzySearch';

// ===========================================
// fuzzyMatch Tests
// ===========================================
describe('fuzzyMatch', () => {
  it('should return null for empty inputs', () => {
    expect(fuzzyMatch('', 'test')).toBeNull();
    expect(fuzzyMatch('test', '')).toBeNull();
    expect(fuzzyMatch('', '')).toBeNull();
    expect(fuzzyMatch(null, 'test')).toBeNull();
    expect(fuzzyMatch('test', null)).toBeNull();
  });

  it('should match exact substrings with high score', () => {
    const result = fuzzyMatch('sudo', 'Sudoku');
    expect(result).not.toBeNull();
    expect(result.score).toBeGreaterThan(500); // High score for exact match at start
  });

  it('should match case-insensitively', () => {
    const result1 = fuzzyMatch('SUDOKU', 'sudoku');
    const result2 = fuzzyMatch('sudoku', 'SUDOKU');
    const result3 = fuzzyMatch('SuDoKu', 'sUdOkU');

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result3).not.toBeNull();
  });

  it('should match fuzzy patterns (non-consecutive characters)', () => {
    const result = fuzzyMatch('sdk', 'Sudoku');
    expect(result).not.toBeNull();
    expect(result.score).toBeGreaterThan(0);
  });

  it('should return null when query is longer than text', () => {
    expect(fuzzyMatch('longerquery', 'short')).toBeNull();
  });

  it('should return null when characters are not found in sequence', () => {
    expect(fuzzyMatch('xyz', 'Sudoku')).toBeNull();
    expect(fuzzyMatch('kus', 'Sudoku')).toBeNull(); // Out of order
  });

  it('should give higher scores to matches at word boundaries', () => {
    const wordBoundary = fuzzyMatch('mem', 'Memory Match');
    const midWord = fuzzyMatch('mor', 'Memory Match');

    expect(wordBoundary).not.toBeNull();
    expect(midWord).not.toBeNull();
    expect(wordBoundary.score).toBeGreaterThan(midWord.score);
  });

  it('should give higher scores to consecutive matches', () => {
    const consecutive = fuzzyMatch('mem', 'Memory');
    const spread = fuzzyMatch('moy', 'Memory');

    expect(consecutive).not.toBeNull();
    expect(spread).not.toBeNull();
    expect(consecutive.score).toBeGreaterThan(spread.score);
  });

  it('should match word prefixes well', () => {
    const result = fuzzyMatch('word', 'Word Search');
    expect(result).not.toBeNull();
    expect(result.score).toBeGreaterThan(1000); // Exact substring at start
  });
});

// ===========================================
// fuzzySearchGames Tests
// ===========================================
describe('fuzzySearchGames', () => {
  const testGames = [
    { slug: 'sudoku', title: 'Sudoku', description: 'Classic number puzzle' },
    { slug: 'wordle', title: 'Word Guess', description: 'Guess the word' },
    { slug: 'memory', title: 'Memory Match', description: 'Match pairs of cards' },
    { slug: 'maze', title: 'Maze', description: 'Navigate the labyrinth' },
    { slug: 'minesweeper', title: 'Minesweeper', description: 'Avoid the mines' },
  ];

  it('should return empty array for empty query', () => {
    expect(fuzzySearchGames(testGames, '')).toEqual([]);
    expect(fuzzySearchGames(testGames, '   ')).toEqual([]);
  });

  it('should find exact title matches', () => {
    const results = fuzzySearchGames(testGames, 'Sudoku');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('sudoku');
  });

  it('should find partial matches', () => {
    const results = fuzzySearchGames(testGames, 'sud');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('sudoku');
  });

  it('should find matches in description', () => {
    const results = fuzzySearchGames(testGames, 'labyrinth');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('maze');
  });

  it('should rank title matches higher than description matches', () => {
    const results = fuzzySearchGames(testGames, 'maze');
    expect(results[0].slug).toBe('maze');
  });

  it('should find fuzzy matches', () => {
    const results = fuzzySearchGames(testGames, 'sdk');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('sudoku');
  });

  it('should sort results by relevance', () => {
    const results = fuzzySearchGames(testGames, 'ma');
    // Both Maze and Memory Match match - results should be sorted by score
    expect(results.length).toBeGreaterThanOrEqual(2);
    // Memory Match ranks higher because it matches in both title AND description
    expect(results.some(r => r.slug === 'maze')).toBe(true);
    expect(results.some(r => r.slug === 'memory')).toBe(true);
    // Verify they are sorted by score (descending)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i]._searchScore).toBeGreaterThanOrEqual(results[i + 1]._searchScore);
    }
  });

  it('should return results with search score attached', () => {
    const results = fuzzySearchGames(testGames, 'sudoku');
    expect(results[0]._searchScore).toBeDefined();
    expect(results[0]._searchScore).toBeGreaterThan(0);
  });

  it('should handle queries with no matches', () => {
    const results = fuzzySearchGames(testGames, 'xyz123');
    expect(results).toEqual([]);
  });

  it('should preserve original game data', () => {
    const results = fuzzySearchGames(testGames, 'sudoku');
    expect(results[0].slug).toBe('sudoku');
    expect(results[0].title).toBe('Sudoku');
    expect(results[0].description).toBe('Classic number puzzle');
  });
});
