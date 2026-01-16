/**
 * Enigma SDK
 *
 * Shared components, hooks, and utilities for community packs.
 *
 * Usage in community packs:
 *   import { Timer, useGameStats, createSeededRNG } from '@enigma';
 *
 * Available exports:
 * - Components: GameHeader, Timer, GiveUpButton, StatsPanel, GameResult,
 *               DifficultySelector, SizeSelector, ModeSelector
 * - Hooks: useTimer, useGameStats, usePersistedState, useKeyboardInput
 * - Utilities: renderIcon, fuzzySearch
 * - Seeding: createSeededRNG, seededShuffle, seededChoice, getTodaysSeed, etc.
 */

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * GameHeader - Standard header for game pages with back button and title
 * @see src/components/GameHeader/GameHeader.jsx
 */
export { default as GameHeader } from '../components/GameHeader';

/**
 * Timer - Time display component with formatting
 * @see src/components/Timer/Timer.jsx
 */
export { default as Timer } from '../components/Timer';
export { formatTime } from '../components/Timer/Timer';

/**
 * GiveUpButton - Standardized give up button with optional confirmation
 * @see src/components/GiveUpButton/GiveUpButton.jsx
 */
export { default as GiveUpButton } from '../components/GiveUpButton';

/**
 * StatsPanel - Flexible stats display panel
 * @see src/components/StatsPanel/StatsPanel.jsx
 */
export { default as StatsPanel } from '../components/StatsPanel';

/**
 * GameResult - Win/lose/gave-up result display
 * @see src/components/GameResult/GameResult.jsx
 */
export { default as GameResult } from '../components/GameResult';

/**
 * DifficultySelector - Difficulty level picker
 * @see src/components/DifficultySelector/DifficultySelector.jsx
 */
export { default as DifficultySelector } from '../components/DifficultySelector';

/**
 * SizeSelector - Grid/puzzle size picker
 * @see src/components/SizeSelector/SizeSelector.jsx
 */
export { default as SizeSelector } from '../components/SizeSelector';

/**
 * ModeSelector - Game mode picker
 * @see src/components/ModeSelector/ModeSelector.jsx
 */
export { default as ModeSelector } from '../components/ModeSelector';

/**
 * SeedDisplay - Shows current puzzle seed with copy/share functionality
 * @see src/components/SeedDisplay/SeedDisplay.jsx
 *
 * @example
 * <SeedDisplay
 *   seed={12345}
 *   label="Puzzle #"
 *   showNewButton
 *   onNewSeed={() => generateNewPuzzle()}
 * />
 *
 * // Compact variant for tight spaces
 * <SeedDisplay seed={seed} variant="compact" />
 *
 * // Inline variant for text flow
 * <SeedDisplay seed={seed} variant="inline" showShare={false} />
 */
export { default as SeedDisplay, useSeed } from '../components/SeedDisplay';

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useTimer - Timer logic with start/stop/reset
 * @see src/hooks/useTimer.js
 *
 * @example
 * const { time, formatted, isRunning, start, stop, reset } = useTimer({
 *   autoStart: true,
 *   direction: 'up',
 * });
 */
export { useTimer, formatTime as formatTimerTime } from '../hooks/useTimer';

/**
 * useGameStats - Game statistics with localStorage persistence
 * @see src/hooks/useGameStats.js
 *
 * @example
 * const { stats, recordWin, recordLoss, recordGiveUp, winRate } = useGameStats('my-game');
 */
export { useGameStats } from '../hooks/useGameStats';

/**
 * usePersistedState - useState with localStorage persistence
 * @see src/hooks/usePersistedState.js
 *
 * @example
 * const [settings, setSettings] = usePersistedState('my-game-settings', { sound: true });
 */
export { usePersistedState } from '../hooks/usePersistedState';

/**
 * useKeyboardInput - Keyboard event handling for games
 * @see src/hooks/useKeyboardInput.js
 *
 * @example
 * useKeyboardInput({
 *   onLetter: (letter) => handleLetter(letter),
 *   onEnter: () => submitGuess(),
 *   onBackspace: () => deleteLetter(),
 *   onArrow: (dir) => moveCursor(dir),
 * });
 */
export { useKeyboardInput } from '../hooks/useKeyboardInput';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * renderIcon - Render emoji or SVG icon consistently
 * @see src/utils/renderIcon.jsx
 */
export { renderIcon } from '../utils/renderIcon';

/**
 * fuzzySearch - Fuzzy string matching for search
 * @see src/utils/fuzzySearch.js
 */
export { fuzzySearch } from '../utils/fuzzySearch';

// ============================================================================
// SEEDING UTILITIES
// ============================================================================

/**
 * Seeding utilities for reproducible puzzle generation
 * @see src/enigma-sdk/seeding.js
 */
export {
  createSeededRNG,
  seededShuffle,
  seededChoice,
  seededSample,
  seededInt,
  seededFloat,
  seededBool,
  seededGrid,
  getTodaysSeed,
  getSeedForDate,
  parseSeedFromUrl,
  setSeedInUrl,
  hashString,
  generateRandomSeed,
} from './seeding';

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Create an API client for your pack's backend
 *
 * @param {string} packId - Your pack's ID (must match manifest.id)
 * @returns {Object} API client with get, post methods
 *
 * @example
 * const api = createPackApi('my-pack');
 * const data = await api.get('/leaderboard');
 * await api.post('/submit-score', { score: 100 });
 */
export function createPackApi(packId) {
  const baseUrl = `${import.meta.env.VITE_API_URL || ''}/api/packs/${packId}`;

  async function fetchWithCsrf(path, options = {}) {
    // For POST/PUT/DELETE, get CSRF token first
    if (options.method && options.method !== 'GET') {
      try {
        const csrfRes = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/csrf-token`,
          { credentials: 'include' }
        );
        if (csrfRes.ok) {
          const { csrfToken } = await csrfRes.json();
          options.headers = {
            ...options.headers,
            'X-CSRF-Token': csrfToken,
          };
        }
      } catch (e) {
        // CSRF token fetch failed, continue anyway (might work without it)
      }
    }

    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = new Error(`API error: ${response.status}`);
      error.status = response.status;
      try {
        error.data = await response.json();
      } catch {
        error.data = null;
      }
      throw error;
    }

    return response.json();
  }

  return {
    /**
     * GET request to pack API
     * @param {string} path - API path (e.g., '/leaderboard')
     */
    get: (path) => fetchWithCsrf(path, { method: 'GET' }),

    /**
     * POST request to pack API
     * @param {string} path - API path
     * @param {Object} data - Request body
     */
    post: (path, data) =>
      fetchWithCsrf(path, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * PUT request to pack API
     * @param {string} path - API path
     * @param {Object} data - Request body
     */
    put: (path, data) =>
      fetchWithCsrf(path, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    /**
     * DELETE request to pack API
     * @param {string} path - API path
     */
    delete: (path) => fetchWithCsrf(path, { method: 'DELETE' }),

    /** Base URL for the pack API */
    baseUrl,
  };
}
