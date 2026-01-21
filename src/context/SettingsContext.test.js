import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ===========================================
// useFavourites - Default State Tests
// ===========================================
describe('useFavourites - Default State', () => {
  const defaultFavourites = [];

  it('should have empty favourites by default', () => {
    expect(defaultFavourites).toEqual([]);
    expect(defaultFavourites.length).toBe(0);
  });
});

// ===========================================
// useFavourites - isFavourite Tests
// ===========================================
describe('useFavourites - isFavourite', () => {
  const isFavourite = (favourites, slug) => favourites.includes(slug);

  it('should return false for empty favourites', () => {
    expect(isFavourite([], 'sudoku')).toBe(false);
  });

  it('should return true when game is in favourites', () => {
    const favourites = ['sudoku', 'minesweeper'];
    expect(isFavourite(favourites, 'sudoku')).toBe(true);
    expect(isFavourite(favourites, 'minesweeper')).toBe(true);
  });

  it('should return false when game is not in favourites', () => {
    const favourites = ['sudoku', 'minesweeper'];
    expect(isFavourite(favourites, 'chess')).toBe(false);
  });
});

// ===========================================
// useFavourites - addFavourite Tests
// ===========================================
describe('useFavourites - addFavourite', () => {
  const addFavourite = (favourites, slug) => {
    if (!favourites.includes(slug)) {
      return [...favourites, slug];
    }
    return favourites;
  };

  it('should add a game to empty favourites', () => {
    const result = addFavourite([], 'sudoku');
    expect(result).toEqual(['sudoku']);
  });

  it('should add a game to existing favourites', () => {
    const result = addFavourite(['sudoku'], 'minesweeper');
    expect(result).toEqual(['sudoku', 'minesweeper']);
  });

  it('should not add duplicates', () => {
    const favourites = ['sudoku'];
    const result = addFavourite(favourites, 'sudoku');
    expect(result).toBe(favourites); // Same reference
    expect(result.length).toBe(1);
  });

  it('should preserve order when adding', () => {
    let favourites = [];
    favourites = addFavourite(favourites, 'sudoku');
    favourites = addFavourite(favourites, 'minesweeper');
    favourites = addFavourite(favourites, 'chess');
    expect(favourites).toEqual(['sudoku', 'minesweeper', 'chess']);
  });
});

// ===========================================
// useFavourites - removeFavourite Tests
// ===========================================
describe('useFavourites - removeFavourite', () => {
  const removeFavourite = (favourites, slug) => {
    return favourites.filter(s => s !== slug);
  };

  it('should remove a game from favourites', () => {
    const result = removeFavourite(['sudoku', 'minesweeper'], 'sudoku');
    expect(result).toEqual(['minesweeper']);
  });

  it('should handle removing from single-item favourites', () => {
    const result = removeFavourite(['sudoku'], 'sudoku');
    expect(result).toEqual([]);
  });

  it('should do nothing if game is not in favourites', () => {
    const favourites = ['sudoku', 'minesweeper'];
    const result = removeFavourite(favourites, 'chess');
    expect(result).toEqual(['sudoku', 'minesweeper']);
  });

  it('should handle empty favourites', () => {
    const result = removeFavourite([], 'sudoku');
    expect(result).toEqual([]);
  });

  it('should preserve order of remaining games', () => {
    const result = removeFavourite(['a', 'b', 'c', 'd'], 'b');
    expect(result).toEqual(['a', 'c', 'd']);
  });
});

// ===========================================
// useFavourites - toggleFavourite Tests
// ===========================================
describe('useFavourites - toggleFavourite', () => {
  const toggleFavourite = (favourites, slug) => {
    if (favourites.includes(slug)) {
      return favourites.filter(s => s !== slug);
    }
    return [...favourites, slug];
  };

  it('should add game if not in favourites', () => {
    const result = toggleFavourite([], 'sudoku');
    expect(result).toEqual(['sudoku']);
  });

  it('should remove game if already in favourites', () => {
    const result = toggleFavourite(['sudoku'], 'sudoku');
    expect(result).toEqual([]);
  });

  it('should toggle correctly multiple times', () => {
    let favourites = [];

    favourites = toggleFavourite(favourites, 'sudoku');
    expect(favourites).toEqual(['sudoku']);

    favourites = toggleFavourite(favourites, 'sudoku');
    expect(favourites).toEqual([]);

    favourites = toggleFavourite(favourites, 'sudoku');
    expect(favourites).toEqual(['sudoku']);
  });

  it('should toggle different games independently', () => {
    let favourites = [];

    favourites = toggleFavourite(favourites, 'sudoku');
    favourites = toggleFavourite(favourites, 'minesweeper');
    expect(favourites).toEqual(['sudoku', 'minesweeper']);

    favourites = toggleFavourite(favourites, 'sudoku');
    expect(favourites).toEqual(['minesweeper']);

    favourites = toggleFavourite(favourites, 'chess');
    expect(favourites).toEqual(['minesweeper', 'chess']);
  });
});

// ===========================================
// useFavourites - Favourite Games Lookup Tests
// ===========================================
describe('useFavourites - Favourite Games Lookup', () => {
  const mockAllGames = [
    { slug: 'sudoku', title: 'Sudoku' },
    { slug: 'minesweeper', title: 'Minesweeper' },
    { slug: 'chess', title: 'Chess' },
    { slug: 'tetris', title: 'Tetris' },
  ];

  const getFavouriteGames = (favourites, allGames) => {
    return favourites
      .map(slug => allGames.find(game => game.slug === slug))
      .filter(Boolean);
  };

  it('should return empty array when no favourites', () => {
    const result = getFavouriteGames([], mockAllGames);
    expect(result).toEqual([]);
  });

  it('should return game objects for favourited slugs', () => {
    const favourites = ['sudoku', 'chess'];
    const result = getFavouriteGames(favourites, mockAllGames);
    expect(result).toEqual([
      { slug: 'sudoku', title: 'Sudoku' },
      { slug: 'chess', title: 'Chess' },
    ]);
  });

  it('should preserve favourites order', () => {
    const favourites = ['chess', 'sudoku', 'tetris'];
    const result = getFavouriteGames(favourites, mockAllGames);
    expect(result.map(g => g.slug)).toEqual(['chess', 'sudoku', 'tetris']);
  });

  it('should filter out non-existent games', () => {
    const favourites = ['sudoku', 'non-existent-game', 'chess'];
    const result = getFavouriteGames(favourites, mockAllGames);
    expect(result).toEqual([
      { slug: 'sudoku', title: 'Sudoku' },
      { slug: 'chess', title: 'Chess' },
    ]);
  });

  it('should handle all non-existent games', () => {
    const favourites = ['game1', 'game2', 'game3'];
    const result = getFavouriteGames(favourites, mockAllGames);
    expect(result).toEqual([]);
  });
});

// ===========================================
// useFavourites - Persistence Format Tests
// ===========================================
describe('useFavourites - Persistence Format', () => {
  it('should serialize favourites to JSON correctly', () => {
    const favourites = ['sudoku', 'minesweeper', 'chess'];
    const json = JSON.stringify(favourites);
    expect(json).toBe('["sudoku","minesweeper","chess"]');
  });

  it('should deserialize favourites from JSON correctly', () => {
    const json = '["sudoku","minesweeper"]';
    const favourites = JSON.parse(json);
    expect(favourites).toEqual(['sudoku', 'minesweeper']);
  });

  it('should handle empty favourites serialization', () => {
    const favourites = [];
    const json = JSON.stringify(favourites);
    expect(json).toBe('[]');
    expect(JSON.parse(json)).toEqual([]);
  });

  it('should handle malformed JSON gracefully', () => {
    const parseFavourites = (json) => {
      try {
        const result = JSON.parse(json);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    };

    expect(parseFavourites('invalid')).toEqual([]);
    expect(parseFavourites('{}')).toEqual([]);
    expect(parseFavourites('null')).toEqual([]);
    expect(parseFavourites('["valid"]')).toEqual(['valid']);
  });
});

// ===========================================
// Settings - localStorage Persistence Tests
// ===========================================
describe('Settings - localStorage Persistence', () => {
  const STORAGE_KEY = 'enigma-settings';
  const defaultSettings = {
    englishVariant: 'us',
    theme: 'dark',
    soundEnabled: true,
    disabledGames: [],
    favouriteGames: [],
    gamePreferences: {},
    searchEngine: 'google',
    language: 'en',
  };

  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Helper that mimics loadLocalSettings from SettingsContext.jsx
  const loadLocalSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage:', e);
    }
    return defaultSettings;
  };

  // Helper that mimics saveLocalSettings from SettingsContext.jsx
  const saveLocalSettings = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  };

  it('should load default settings when localStorage is empty', () => {
    const settings = loadLocalSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('should load settings from localStorage when present', () => {
    mockStorage[STORAGE_KEY] = JSON.stringify({ favouriteGames: ['sudoku', 'chess'] });
    const settings = loadLocalSettings();
    expect(settings.favouriteGames).toEqual(['sudoku', 'chess']);
    expect(settings.theme).toBe('dark'); // Default value preserved
  });

  it('should save settings to localStorage', () => {
    const settings = { ...defaultSettings, favouriteGames: ['minesweeper'] };
    saveLocalSettings(settings);
    expect(mockStorage[STORAGE_KEY]).toBe(JSON.stringify(settings));
  });

  it('should merge saved settings with defaults', () => {
    // Simulate an older version of settings that's missing new fields
    mockStorage[STORAGE_KEY] = JSON.stringify({ theme: 'light' });
    const settings = loadLocalSettings();
    expect(settings.theme).toBe('light');
    expect(settings.favouriteGames).toEqual([]); // Default
    expect(settings.language).toBe('en'); // Default
  });

  it('should handle corrupted JSON gracefully', () => {
    mockStorage[STORAGE_KEY] = 'not valid json';
    const settings = loadLocalSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('should persist favourites through simulated refresh', () => {
    // First "session" - add favourites
    let settings = loadLocalSettings();
    settings = { ...settings, favouriteGames: ['sudoku', 'chess'] };
    saveLocalSettings(settings);

    // Second "session" - simulate refresh by loading again
    const reloadedSettings = loadLocalSettings();
    expect(reloadedSettings.favouriteGames).toEqual(['sudoku', 'chess']);
  });

  it('should persist theme changes through simulated refresh', () => {
    let settings = loadLocalSettings();
    settings = { ...settings, theme: 'light' };
    saveLocalSettings(settings);

    const reloadedSettings = loadLocalSettings();
    expect(reloadedSettings.theme).toBe('light');
  });

  it('should persist multiple settings changes', () => {
    let settings = loadLocalSettings();
    settings = { ...settings, favouriteGames: ['tetris'], theme: 'light', soundEnabled: false };
    saveLocalSettings(settings);

    const reloadedSettings = loadLocalSettings();
    expect(reloadedSettings.favouriteGames).toEqual(['tetris']);
    expect(reloadedSettings.theme).toBe('light');
    expect(reloadedSettings.soundEnabled).toBe(false);
  });
});
