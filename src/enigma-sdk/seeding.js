/**
 * Seeding Utilities for Reproducible Puzzles
 *
 * These utilities ensure puzzles are reproducible given a seed number.
 * Use them to generate the same puzzle for the same seed, enabling:
 * - Daily challenges (same puzzle for everyone on a given day)
 * - Shareable puzzles (share seed to share exact puzzle)
 * - Replay/practice specific puzzles
 *
 * @example
 * // Daily puzzle
 * const seed = getTodaysSeed('my-game');
 * const rng = createSeededRNG(seed);
 * const shuffledItems = seededShuffle(items, rng);
 *
 * @example
 * // Custom seed from URL
 * const seed = parseSeedFromUrl() || generateRandomSeed();
 * const rng = createSeededRNG(seed);
 */

/**
 * Create a seeded pseudo-random number generator
 * Uses the Mulberry32 algorithm - fast, good distribution, 32-bit state
 *
 * @param {number} seed - Seed value (will be converted to positive 32-bit integer)
 * @returns {function} Function that returns random number in [0, 1)
 *
 * @example
 * const rng = createSeededRNG(12345);
 * console.log(rng()); // Always 0.37848472...
 * console.log(rng()); // Always 0.72939128...
 */
export function createSeededRNG(seed) {
  // Ensure positive 32-bit integer
  let state = Math.abs(seed) >>> 0;

  // Handle edge case of 0 seed
  if (state === 0) state = 1;

  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm with seeded RNG
 * Returns a new array, does not modify the original
 *
 * @param {Array} array - Array to shuffle
 * @param {number|function} seedOrRng - Seed number or existing RNG function
 * @returns {Array} New shuffled array
 *
 * @example
 * const shuffled = seededShuffle([1, 2, 3, 4, 5], 12345);
 * // shuffled is always [3, 1, 5, 2, 4] for seed 12345
 */
export function seededShuffle(array, seedOrRng) {
  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Pick a random element from an array using seeded RNG
 *
 * @param {Array} array - Array to pick from
 * @param {number|function} seedOrRng - Seed number or existing RNG function
 * @returns {*} Random element from the array
 *
 * @example
 * const item = seededChoice(['a', 'b', 'c', 'd'], 12345);
 * // item is always the same for seed 12345
 */
export function seededChoice(array, seedOrRng) {
  if (!array || array.length === 0) return undefined;
  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  return array[Math.floor(rng() * array.length)];
}

/**
 * Pick multiple unique random elements from an array
 *
 * @param {Array} array - Array to pick from
 * @param {number} count - Number of elements to pick
 * @param {number|function} seedOrRng - Seed number or existing RNG function
 * @returns {Array} Array of picked elements
 *
 * @example
 * const items = seededSample(['a', 'b', 'c', 'd', 'e'], 3, 12345);
 * // items is always the same 3 elements for seed 12345
 */
export function seededSample(array, count, seedOrRng) {
  if (!array || array.length === 0) return [];
  if (count >= array.length) return seededShuffle(array, seedOrRng);

  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  const result = [];
  const used = new Set();

  while (result.length < count) {
    const index = Math.floor(rng() * array.length);
    if (!used.has(index)) {
      used.add(index);
      result.push(array[index]);
    }
  }

  return result;
}

/**
 * Generate a random integer in range [min, max] (inclusive) using seeded RNG
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {number|function} seedOrRng - Seed number or existing RNG function
 * @returns {number} Random integer in range
 *
 * @example
 * const num = seededInt(1, 100, 12345);
 * // num is always the same for seed 12345
 */
export function seededInt(min, max, seedOrRng) {
  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Generate a random float in range [min, max) using seeded RNG
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @param {number|function} seedOrRng - Seed number or existing RNG function
 * @returns {number} Random float in range
 */
export function seededFloat(min, max, seedOrRng) {
  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  return rng() * (max - min) + min;
}

/**
 * Generate a random boolean with optional probability
 *
 * @param {number|function} seedOrRng - Seed number or existing RNG function
 * @param {number} [probability=0.5] - Probability of true (0 to 1)
 * @returns {boolean}
 */
export function seededBool(seedOrRng, probability = 0.5) {
  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  return rng() < probability;
}

/**
 * Get today's date-based seed for daily puzzles
 * Same seed for everyone on the same day
 *
 * @param {string} [gameId=''] - Optional game ID to make seed unique per game
 * @returns {number} Seed value for today
 *
 * @example
 * const seed = getTodaysSeed('wordle-clone');
 * // Everyone gets the same seed on the same day
 */
export function getTodaysSeed(gameId = '') {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return hashString(`${gameId}-${today}`);
}

/**
 * Get a seed for a specific date
 *
 * @param {Date|string} date - Date object or ISO string
 * @param {string} [gameId=''] - Optional game ID
 * @returns {number} Seed value for that date
 */
export function getSeedForDate(date, gameId = '') {
  const dateStr =
    typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  return hashString(`${gameId}-${dateStr}`);
}

/**
 * Parse seed from URL query parameter
 *
 * @param {string} [paramName='seed'] - Query parameter name
 * @returns {number|null} Seed value or null if not present/invalid
 *
 * @example
 * // URL: ?seed=12345
 * const seed = parseSeedFromUrl(); // 12345
 *
 * // URL: ?puzzle=67890
 * const seed = parseSeedFromUrl('puzzle'); // 67890
 */
export function parseSeedFromUrl(paramName = 'seed') {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const seedStr = params.get(paramName);

  if (seedStr) {
    // Try parsing as number
    const parsed = parseInt(seedStr, 10);
    if (!isNaN(parsed)) return Math.abs(parsed);

    // If not a number, hash the string
    return hashString(seedStr);
  }

  return null;
}

/**
 * Update URL with seed parameter (for sharing)
 *
 * @param {number} seed - Seed value
 * @param {string} [paramName='seed'] - Query parameter name
 */
export function setSeedInUrl(seed, paramName = 'seed') {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set(paramName, seed.toString());
  window.history.replaceState({}, '', url);
}

/**
 * Generate a hash from a string
 * Useful for converting text seeds to numbers
 *
 * @param {string} str - String to hash
 * @returns {number} Positive 32-bit integer hash
 *
 * @example
 * const seed = hashString('my-custom-seed');
 * const seed2 = hashString('2024-01-15'); // For date-based seeds
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a random seed (not seeded - truly random)
 * Use this when starting a new random puzzle
 *
 * @returns {number} Random seed value
 */
export function generateRandomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Create a 2D grid filled with a seeded random pattern
 *
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {Array} values - Possible cell values
 * @param {number|function} seedOrRng - Seed or RNG
 * @returns {Array<Array>} 2D array filled with random values
 */
export function seededGrid(width, height, values, seedOrRng) {
  const rng = typeof seedOrRng === 'function' ? seedOrRng : createSeededRNG(seedOrRng);
  const grid = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(values[Math.floor(rng() * values.length)]);
    }
    grid.push(row);
  }

  return grid;
}

export default {
  createSeededRNG,
  seededShuffle,
  seededChoice,
  seededSample,
  seededInt,
  seededFloat,
  seededBool,
  getTodaysSeed,
  getSeedForDate,
  parseSeedFromUrl,
  setSeedInUrl,
  hashString,
  generateRandomSeed,
  seededGrid,
};
