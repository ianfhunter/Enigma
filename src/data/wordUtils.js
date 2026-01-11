// Load words from the word dictionary
import wordListRaw from './word_list.txt?raw';
import { getDeprioritizationScore } from './wordFeedback';

// Parse the dictionary file into a Set for O(1) lookup
const WORD_SET = new Set(
  wordListRaw
    .split('\n')
    .map(word => word.trim().toUpperCase())
    .filter(word => word.length >= 3)
);

// Cache of 9-letter words for puzzle generation
const NINE_LETTER_WORDS = Array.from(WORD_SET).filter(word => word.length === 9);

/**
 * Sort words by deprioritization score (unflagged first)
 * @param {string[]} words - Array of words to sort
 * @returns {string[]} - Sorted array with unflagged words first
 */
function sortByPriority(words) {
  return [...words].sort((a, b) => {
    const scoreA = getDeprioritizationScore(a);
    const scoreB = getDeprioritizationScore(b);
    return scoreA - scoreB;
  });
}

// ============================================
// SHARED UTILITIES (used across multiple games)
// ============================================

/**
 * Deep clone an object using JSON serialization
 * @param {any} obj - The object to clone
 * @returns {any} - A deep copy of the object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {any[]} array - The array to shuffle
 * @returns {any[]} - A new shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a seeded random number (for reproducible puzzles)
 * @param {number} seed - The seed value
 * @returns {function} - A function that returns the next random number
 */
export function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm with a seeded random
 * @param {any[]} array - The array to shuffle
 * @param {function} random - A function that returns a random number between 0 and 1
 * @returns {any[]} - A new shuffled array
 */
export function seededShuffleArray(array, random) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayDateString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Generate a numeric seed from a string (for daily puzzles)
 * @param {string} str - The string to hash (e.g., "2026-01-08-medium")
 * @returns {number}
 */
export function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Format seconds into MM:SS display
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time string
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random elements from an array
 * @param {Array} array - The source array
 * @param {number} count - Number of elements to pick
 * @returns {Array} - Array of randomly picked elements
 */
export function pickRandom(array, count) {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// Cache words by length for Word Ladder
const WORDS_BY_LENGTH = {};
for (const word of WORD_SET) {
  if (!WORDS_BY_LENGTH[word.length]) {
    WORDS_BY_LENGTH[word.length] = new Set();
  }
  WORDS_BY_LENGTH[word.length].add(word);
}

/**
 * Check if a word is valid (exists in our dictionary)
 * @param {string} word - The word to check (case-insensitive)
 * @returns {boolean} - True if the word is valid
 */
export function isValidWord(word) {
  return WORD_SET.has(word.toUpperCase());
}

/**
 * Get all words in the dictionary
 * @returns {string[]} - Array of all words (uppercase)
 */
export function getAllWords() {
  return Array.from(WORD_SET);
}

/**
 * Find all valid words that can be formed from the given letters
 * @param {string[]} letters - Array of available letters
 * @param {string} centerLetter - The center letter that must be in every word
 * @returns {string[]} - Array of valid words, sorted by length (longest first)
 */
export function findAllWords(letters, centerLetter) {
  const results = [];
  const upperLetters = letters.map(l => l.toUpperCase());
  const upperCenter = centerLetter.toUpperCase();

  for (const word of WORD_SET) {
    // Must be at least 4 letters
    if (word.length < 4) continue;

    // Must contain center letter
    if (!word.includes(upperCenter)) continue;

    // Must only use available letters (respecting count)
    const available = [...upperLetters];
    let valid = true;

    for (const char of word) {
      const idx = available.indexOf(char);
      if (idx === -1) {
        valid = false;
        break;
      }
      available.splice(idx, 1);
    }

    if (valid) {
      results.push(word);
    }
  }

  // Sort by length (longest first), then alphabetically
  return results.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.localeCompare(b);
  });
}

/**
 * Generate a valid puzzle with at least minWords possible words
 * Prioritizes unflagged words over flagged (archaic/obscure) words
 * @param {number} minWords - Minimum number of possible words required (default 10)
 * @param {number} maxAttempts - Maximum number of 9-letter words to try (default 100)
 * @returns {{ letters: string[], center: string, nineLetterWord: string } | null}
 */
export function generatePuzzle(minWords = 10, maxAttempts = 100) {
  // Sort by priority (unflagged first), then shuffle within priority groups
  const prioritized = sortByPriority(NINE_LETTER_WORDS);
  // Add randomness while maintaining priority order
  const shuffled = prioritized.sort((a, b) => {
    const scoreA = getDeprioritizationScore(a);
    const scoreB = getDeprioritizationScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return Math.random() - 0.5;
  });

  for (let i = 0; i < Math.min(maxAttempts, shuffled.length); i++) {
    const word = shuffled[i];
    const letters = word.split('');

    // Get unique letters to try as center
    const uniqueLetters = [...new Set(letters)];

    // Shuffle the unique letters to randomize center selection
    const shuffledUnique = uniqueLetters.sort(() => Math.random() - 0.5);

    for (const centerLetter of shuffledUnique) {
      const possibleWords = findAllWords(letters, centerLetter);

      if (possibleWords.length >= minWords) {
        return {
          letters,
          center: centerLetter,
          nineLetterWord: word
        };
      }
    }
  }

  // Fallback: return null if no valid puzzle found (very unlikely)
  return null;
}

// ===========================================
// Word Ladder Utilities
// ===========================================

/**
 * Get all words of a specific length
 * @param {number} length - The word length
 * @returns {string[]} - Array of words
 */
export function getWordsByLength(length) {
  return Array.from(WORDS_BY_LENGTH[length] || []);
}

/**
 * Check if two words differ by exactly one letter
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @returns {boolean}
 */
export function differsByOneLetter(word1, word2) {
  if (word1.length !== word2.length) return false;

  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
      if (differences > 1) return false;
    }
  }
  return differences === 1;
}

/**
 * Get all valid words that differ by exactly one letter from the given word
 * @param {string} word - The source word
 * @returns {string[]} - Array of neighboring words
 */
export function getWordNeighbors(word) {
  const upperWord = word.toUpperCase();
  const wordSet = WORDS_BY_LENGTH[upperWord.length];
  if (!wordSet) return [];

  const neighbors = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // For each position, try each letter
  for (let i = 0; i < upperWord.length; i++) {
    for (const letter of alphabet) {
      if (letter === upperWord[i]) continue;

      const newWord = upperWord.slice(0, i) + letter + upperWord.slice(i + 1);
      if (wordSet.has(newWord)) {
        neighbors.push(newWord);
      }
    }
  }

  return neighbors;
}

/**
 * Find the shortest word ladder between two words using BFS
 * @param {string} startWord - Starting word
 * @param {string} endWord - Target word
 * @returns {string[] | null} - Array of words forming the ladder, or null if no path exists
 */
export function findWordLadder(startWord, endWord) {
  const start = startWord.toUpperCase();
  const end = endWord.toUpperCase();

  if (start.length !== end.length) return null;
  if (!isValidWord(start) || !isValidWord(end)) return null;
  if (start === end) return [start];

  const visited = new Set([start]);
  const queue = [[start]];

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    for (const neighbor of getWordNeighbors(current)) {
      if (neighbor === end) {
        return [...path, neighbor];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Generate a Word Ladder puzzle
 * @param {number} wordLength - Length of words (default 4)
 * @param {number} minSteps - Minimum number of steps (default 3)
 * @param {number} maxSteps - Maximum number of steps (default 6)
 * @returns {{ startWord: string, endWord: string, solution: string[] } | null}
 */
export function generateWordLadderPuzzle(wordLength = 4, minSteps = 3, maxSteps = 6) {
  const words = getWordsByLength(wordLength);
  if (words.length < 100) return null;

  // Common words that make better puzzles (filter to common-ish words)
  const commonWords = words.filter(w => {
    // Prefer words without double letters and common patterns
    const uniqueLetters = new Set(w.split(''));
    return uniqueLetters.size >= wordLength - 1;
  });

  // Shuffle and try pairs
  const shuffled = [...commonWords].sort(() => Math.random() - 0.5);
  const maxAttempts = 200;

  for (let i = 0; i < Math.min(maxAttempts, shuffled.length); i++) {
    const startWord = shuffled[i];

    // Find a random end word that has a valid path
    for (let j = 0; j < 50; j++) {
      const endWord = shuffled[Math.floor(Math.random() * shuffled.length)];
      if (startWord === endWord) continue;

      const solution = findWordLadder(startWord, endWord);
      if (solution && solution.length >= minSteps + 1 && solution.length <= maxSteps + 1) {
        return {
          startWord,
          endWord,
          solution,
        };
      }
    }
  }

  return null;
}

/**
 * Generate a conundrum puzzle (scrambled 9-letter word)
 * Prioritizes unflagged words over flagged (archaic/obscure) words
 * @returns {{ word: string, scrambled: string }} - The answer and scrambled letters
 */
export function generateConundrum() {
  // Sort by priority (unflagged first) and pick from the front with some randomness
  const prioritized = sortByPriority(NINE_LETTER_WORDS);

  // Find a word with minimal flagging
  // Pick randomly from unflagged words, or fall back to least-flagged
  const unflaggedWords = prioritized.filter(w => getDeprioritizationScore(w) === 0);
  const pool = unflaggedWords.length > 0 ? unflaggedWords : prioritized.slice(0, 1000);

  const randomIndex = Math.floor(Math.random() * pool.length);
  const word = pool[randomIndex];

  // Scramble the letters, ensuring it's different from the original
  let scrambled;
  do {
    scrambled = shuffleArray(word.split('')).join('');
  } while (scrambled === word);

  return { word, scrambled };
}

// ===========================================
// WordGuess Utilities
// ===========================================

// Cache of 5-letter words for WordGuess
const FIVE_LETTER_WORDS = Array.from(WORD_SET).filter(word => word.length === 5);

/**
 * Get all 5-letter words
 * @returns {string[]}
 */
export function getFiveLetterWords() {
  return FIVE_LETTER_WORDS;
}

/**
 * Get a random 5-letter word for WordGuess
 * @returns {string}
 */
export function getRandomWordGuessWord() {
  return FIVE_LETTER_WORDS[Math.floor(Math.random() * FIVE_LETTER_WORDS.length)];
}

/**
 * Get the daily WordGuess word (seeded by date)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string}
 */
export function getDailyWordGuessWord(dateStr) {
  const seed = stringToSeed(`wordguess-${dateStr}`);
  const random = createSeededRandom(seed);
  const index = Math.floor(random() * FIVE_LETTER_WORDS.length);
  return FIVE_LETTER_WORDS[index];
}

/**
 * Check WordGuess guess and return feedback
 * @param {string} guess - The guessed word
 * @param {string} target - The target word
 * @returns {Array<'correct'|'present'|'absent'>} - Feedback for each letter
 */
export function checkWordGuessGuess(guess, target) {
  const result = Array(5).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.toUpperCase().split('');

  // First pass: mark correct letters
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = null; // Mark as used
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;

    const idx = targetLetters.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = 'present';
      targetLetters[idx] = null; // Mark as used
    }
  }

  return result;
}

// ===========================================
// Hangman Utilities
// ===========================================

/**
 * Get words within a length range
 * @param {number} minLength - Minimum word length
 * @param {number} maxLength - Maximum word length
 * @returns {string[]}
 */
export function getWordsInRange(minLength, maxLength) {
  const words = [];
  for (let len = minLength; len <= maxLength; len++) {
    if (WORDS_BY_LENGTH[len]) {
      words.push(...Array.from(WORDS_BY_LENGTH[len]));
    }
  }
  return words;
}

/**
 * Get a random word for Hangman
 * @param {number} minLength - Minimum word length (default 5)
 * @param {number} maxLength - Maximum word length (default 8)
 * @returns {string}
 */
export function getRandomHangmanWord(minLength = 5, maxLength = 8) {
  const words = getWordsInRange(minLength, maxLength);
  return words[Math.floor(Math.random() * words.length)];
}

// ===========================================
// Anagrams Utilities
// ===========================================

/**
 * Get the sorted letter signature of a word (for anagram matching)
 * @param {string} word - The word to get signature for
 * @returns {string} - Sorted letters as a string
 */
function getAnagramSignature(word) {
  return word.toUpperCase().split('').sort().join('');
}

// Build anagram groups on initialization
// Maps signature -> array of words with that signature
const ANAGRAM_GROUPS = new Map();
for (const word of WORD_SET) {
  const sig = getAnagramSignature(word);
  if (!ANAGRAM_GROUPS.has(sig)) {
    ANAGRAM_GROUPS.set(sig, []);
  }
  ANAGRAM_GROUPS.get(sig).push(word);
}

// Find all anagram groups with at least N words (good for puzzles)
const MIN_ANAGRAMS_FOR_PUZZLE = 4;
const GOOD_ANAGRAM_GROUPS = Array.from(ANAGRAM_GROUPS.entries())
  .filter(([_sig, words]) => words.length >= MIN_ANAGRAMS_FOR_PUZZLE)
  .map(([sig, words]) => ({ signature: sig, words: words.sort() }));

/**
 * Find all true anagrams of a word (words using exactly the same letters)
 * @param {string} word - The word to find anagrams for
 * @returns {string[]} - Array of anagram words (including the original)
 */
export function findTrueAnagrams(word) {
  const sig = getAnagramSignature(word);
  return ANAGRAM_GROUPS.get(sig) || [word.toUpperCase()];
}

/**
 * Generate a true anagrams puzzle
 * Returns scrambled letters and all valid anagrams (minimum 4 answers)
 * @param {number} minAnagrams - Minimum number of anagram solutions (default 4)
 * @returns {{ letters: string[], anagrams: string[], wordLength: number }}
 */
export function generateAnagramsPuzzle(minAnagrams = 4) {
  // Filter to groups that meet minimum and shuffle
  const validGroups = GOOD_ANAGRAM_GROUPS.filter(g => g.words.length >= minAnagrams);

  if (validGroups.length === 0) {
    // Fallback: use any group with 2+ anagrams
    const fallbackGroups = Array.from(ANAGRAM_GROUPS.entries())
      .filter(([_sig, words]) => words.length >= 2)
      .map(([sig, words]) => ({ signature: sig, words: words.sort() }));
    const group = fallbackGroups[Math.floor(Math.random() * fallbackGroups.length)];
    return {
      letters: shuffleArray(group.words[0].split('')),
      anagrams: group.words,
      wordLength: group.words[0].length,
    };
  }

  // Pick a random valid group
  const group = validGroups[Math.floor(Math.random() * validGroups.length)];

  return {
    letters: shuffleArray(group.words[0].split('')),
    anagrams: group.words,
    wordLength: group.words[0].length,
  };
}

/**
 * Check if a word is a valid anagram solution for the given letters
 * @param {string} guess - The guessed word
 * @param {string[]} letters - The available letters
 * @returns {boolean} - True if the guess uses exactly all the letters
 */
export function isValidAnagramGuess(guess, letters) {
  const guessUpper = guess.toUpperCase();

  // Must be same length (use ALL letters)
  if (guessUpper.length !== letters.length) return false;

  // Must be a valid word
  if (!WORD_SET.has(guessUpper)) return false;

  // Must use exactly the same letters
  const guessSignature = getAnagramSignature(guessUpper);
  const lettersSignature = letters.map(l => l.toUpperCase()).sort().join('');

  return guessSignature === lettersSignature;
}

/**
 * Get statistics about available anagram puzzles
 * @returns {{ totalGroups: number, bySize: Object }}
 */
export function getAnagramStats() {
  const bySize = {};
  for (const group of GOOD_ANAGRAM_GROUPS) {
    const size = group.words.length;
    bySize[size] = (bySize[size] || 0) + 1;
  }
  return {
    totalGroups: GOOD_ANAGRAM_GROUPS.length,
    bySize,
  };
}

// ===========================================
// Wordiply Utilities
// ===========================================

/**
 * Find the longest word in the dictionary that contains the given seed
 * @param {string} seed - The letter sequence to find in words
 * @returns {{ word: string, length: number } | null} - The longest word and its length
 */
export function findLongestWordWithSeed(seed) {
  const upperSeed = seed.toUpperCase();
  let longest = null;
  let maxLength = 0;

  for (const word of WORD_SET) {
    if (word.length >= 4 && word.includes(upperSeed) && word.length > maxLength) {
      longest = word;
      maxLength = word.length;
    }
  }

  return longest ? { word: longest, length: maxLength } : null;
}
