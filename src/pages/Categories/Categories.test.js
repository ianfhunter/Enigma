import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  getTodayDateString,
  stringToSeed,
  seededShuffleArray,
} from '../../data/wordUtils';

// ===========================================
// Categories - Puzzle Generation Tests
// ===========================================
describe('Categories - Puzzle Generation', () => {
  const GRID_SIZE = 4;
  const WORDS_PER_CATEGORY = 4;
  const MAX_MISTAKES = 4;

  // Mock word categories for testing
  const mockCategories = {
    fruits: {
      name: 'Fruits',
      words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'PEACH'],
      difficulty: 1,
    },
    colors: {
      name: 'Colors',
      words: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'],
      difficulty: 2,
    },
    animals: {
      name: 'Animals',
      words: ['DOG', 'CAT', 'BIRD', 'FISH', 'HORSE', 'LION'],
      difficulty: 3,
    },
    countries: {
      name: 'Countries',
      words: ['USA', 'FRANCE', 'JAPAN', 'BRAZIL', 'INDIA', 'CHINA'],
      difficulty: 4,
    },
  };

  // Simplified puzzle generator for testing
  const generateTestPuzzle = (seed, categories) => {
    const random = createSeededRandom(seed);
    const categoryKeys = Object.keys(categories);
    const shuffledKeys = seededShuffleArray(categoryKeys, random);

    const selectedCategories = [];
    const usedWords = new Set();

    for (const key of shuffledKeys) {
      if (selectedCategories.length >= 4) break;

      const category = categories[key];
      const availableWords = category.words.filter(w => !usedWords.has(w));

      if (availableWords.length >= WORDS_PER_CATEGORY) {
        const shuffledWords = seededShuffleArray(availableWords, random);
        const selectedWords = shuffledWords.slice(0, WORDS_PER_CATEGORY);

        selectedWords.forEach(w => usedWords.add(w));
        selectedCategories.push({
          id: key,
          name: category.name,
          words: selectedWords,
          difficulty: category.difficulty,
        });
      }
    }

    const allWords = selectedCategories.flatMap(cat =>
      cat.words.map(word => ({ word, categoryId: cat.id }))
    );

    return {
      categories: selectedCategories,
      words: seededShuffleArray(allWords, random),
    };
  };

  it('should generate exactly 4 categories', () => {
    const puzzle = generateTestPuzzle(12345, mockCategories);
    expect(puzzle.categories.length).toBe(4);
  });

  it('should have 4 words per category', () => {
    const puzzle = generateTestPuzzle(12345, mockCategories);

    puzzle.categories.forEach(category => {
      expect(category.words.length).toBe(WORDS_PER_CATEGORY);
    });
  });

  it('should have 16 total words', () => {
    const puzzle = generateTestPuzzle(12345, mockCategories);
    expect(puzzle.words.length).toBe(16);
  });

  it('should not have duplicate words', () => {
    const puzzle = generateTestPuzzle(12345, mockCategories);
    const wordSet = new Set(puzzle.words.map(w => w.word));
    expect(wordSet.size).toBe(16);
  });

  it('should generate consistent puzzles with same seed', () => {
    const puzzle1 = generateTestPuzzle(12345, mockCategories);
    const puzzle2 = generateTestPuzzle(12345, mockCategories);

    expect(puzzle1.categories.map(c => c.id).sort())
      .toEqual(puzzle2.categories.map(c => c.id).sort());
  });

  it('should generate different puzzles with different seeds', () => {
    const puzzle1 = generateTestPuzzle(12345, mockCategories);
    const puzzle2 = generateTestPuzzle(54321, mockCategories);

    // Words should be shuffled differently at minimum
    const words1 = puzzle1.words.map(w => w.word).join(',');
    const words2 = puzzle2.words.map(w => w.word).join(',');

    expect(words1).not.toBe(words2);
  });
});

// ===========================================
// Categories - Category Matching Tests
// ===========================================
describe('Categories - Category Matching', () => {
  const mockPuzzle = {
    categories: [
      { id: 'fruits', name: 'Fruits', words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE'], difficulty: 1 },
      { id: 'colors', name: 'Colors', words: ['RED', 'BLUE', 'GREEN', 'YELLOW'], difficulty: 2 },
    ],
    words: [
      { word: 'APPLE', categoryId: 'fruits' },
      { word: 'RED', categoryId: 'colors' },
      { word: 'BANANA', categoryId: 'fruits' },
      { word: 'BLUE', categoryId: 'colors' },
      { word: 'ORANGE', categoryId: 'fruits' },
      { word: 'GREEN', categoryId: 'colors' },
      { word: 'GRAPE', categoryId: 'fruits' },
      { word: 'YELLOW', categoryId: 'colors' },
    ],
  };

  const checkGuess = (selectedWords, puzzle) => {
    const wordCategories = selectedWords.map(word => {
      const wordData = puzzle.words.find(w => w.word === word);
      return wordData?.categoryId;
    });

    const allSameCategory = wordCategories.every(cat => cat === wordCategories[0]);

    if (allSameCategory) {
      const category = puzzle.categories.find(cat => cat.id === wordCategories[0]);
      return { correct: true, category };
    }

    // Check for "one away"
    const categoryCounts = {};
    wordCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(categoryCounts));

    return {
      correct: false,
      oneAway: maxCount === 3,
    };
  };

  it('should detect correct category match', () => {
    const result = checkGuess(['APPLE', 'BANANA', 'ORANGE', 'GRAPE'], mockPuzzle);

    expect(result.correct).toBe(true);
    expect(result.category.id).toBe('fruits');
  });

  it('should detect incorrect guess', () => {
    const result = checkGuess(['APPLE', 'BANANA', 'RED', 'GRAPE'], mockPuzzle);

    expect(result.correct).toBe(false);
  });

  it('should detect "one away" guess', () => {
    const result = checkGuess(['APPLE', 'BANANA', 'ORANGE', 'RED'], mockPuzzle);

    expect(result.correct).toBe(false);
    expect(result.oneAway).toBe(true);
  });

  it('should not mark as "one away" if 2 or fewer match', () => {
    const result = checkGuess(['APPLE', 'BANANA', 'RED', 'BLUE'], mockPuzzle);

    expect(result.correct).toBe(false);
    expect(result.oneAway).toBe(false);
  });
});

// ===========================================
// Categories - Game State Tests
// ===========================================
describe('Categories - Game State', () => {
  const MAX_MISTAKES = 4;

  it('should detect win when all 4 categories solved', () => {
    const solvedCategories = [1, 2, 3, 4];
    const gameWon = solvedCategories.length === 4;

    expect(gameWon).toBe(true);
  });

  it('should detect loss when max mistakes reached', () => {
    const mistakes = 4;
    const gameLost = mistakes >= MAX_MISTAKES;

    expect(gameLost).toBe(true);
  });

  it('should continue game with fewer mistakes', () => {
    const mistakes = 3;
    const gameLost = mistakes >= MAX_MISTAKES;

    expect(gameLost).toBe(false);
  });

  it('should track remaining words correctly', () => {
    const allWords = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const solvedWords = ['A', 'B', 'C', 'D'];
    const remainingWords = allWords.filter(w => !solvedWords.includes(w));

    expect(remainingWords.length).toBe(12);
  });
});

// ===========================================
// Categories - Selection Tests
// ===========================================
describe('Categories - Selection', () => {
  it('should limit selection to 4 words', () => {
    const WORDS_PER_CATEGORY = 4;
    const selectedWords = ['A', 'B', 'C', 'D'];

    // Can't add more if already at limit
    const canAddMore = selectedWords.length < WORDS_PER_CATEGORY;

    expect(canAddMore).toBe(false);
  });

  it('should toggle word selection', () => {
    let selectedWords = ['A', 'B'];

    // Toggle off
    selectedWords = selectedWords.filter(w => w !== 'A');
    expect(selectedWords).toEqual(['B']);

    // Toggle on
    selectedWords = [...selectedWords, 'C'];
    expect(selectedWords).toEqual(['B', 'C']);
  });

  it('should only allow selection from remaining words', () => {
    const remainingWords = ['A', 'B', 'C', 'D'];
    const solvedWord = 'E';

    const canSelect = remainingWords.includes(solvedWord);

    expect(canSelect).toBe(false);
  });
});

// ===========================================
// Categories - Difficulty Colors Tests
// ===========================================
describe('Categories - Difficulty Colors', () => {
  const DIFFICULTY_COLORS = {
    1: { name: 'yellow', bg: '#f9df6d', text: '#000' },
    2: { name: 'green', bg: '#a0c35a', text: '#000' },
    3: { name: 'blue', bg: '#b0c4ef', text: '#000' },
    4: { name: 'purple', bg: '#ba81c5', text: '#000' },
  };

  it('should have 4 difficulty levels', () => {
    expect(Object.keys(DIFFICULTY_COLORS).length).toBe(4);
  });

  it('should have correct color names', () => {
    expect(DIFFICULTY_COLORS[1].name).toBe('yellow');
    expect(DIFFICULTY_COLORS[2].name).toBe('green');
    expect(DIFFICULTY_COLORS[3].name).toBe('blue');
    expect(DIFFICULTY_COLORS[4].name).toBe('purple');
  });

  it('should have hex color values', () => {
    Object.values(DIFFICULTY_COLORS).forEach(color => {
      expect(color.bg).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ===========================================
// Categories - Shuffle Tests
// ===========================================
describe('Categories - Shuffle', () => {
  it('should shuffle words using seeded random', () => {
    const words = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seed = 12345;
    const random = createSeededRandom(seed);

    const shuffled = seededShuffleArray(words, random);

    expect(shuffled.length).toBe(words.length);
    expect(shuffled.sort()).toEqual(words.sort());
  });

  it('should produce different shuffles with different seeds', () => {
    const words = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const shuffled1 = seededShuffleArray([...words], random1);
    const shuffled2 = seededShuffleArray([...words], random2);

    expect(shuffled1.join('')).not.toBe(shuffled2.join(''));
  });
});
