// Word Feedback System
// Stores user feedback on words (archaic/obscure) to deprioritize them in puzzle generation

const STORAGE_KEY = 'word_feedback';

/**
 * Feedback types for words
 */
export const FeedbackType = {
  ARCHAIC: 'archaic',
  OBSCURE: 'obscure',
};

/**
 * Load all word feedback from localStorage
 * @returns {Object} - Map of word -> { type, count, lastFlagged }
 */
export function loadWordFeedback() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load word feedback:', e);
    return {};
  }
}

/**
 * Save word feedback to localStorage
 * @param {Object} feedback - The feedback data to save
 */
function saveWordFeedback(feedback) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedback));
  } catch (e) {
    console.error('Failed to save word feedback:', e);
  }
}

/**
 * Flag a word as archaic or obscure
 * @param {string} word - The word to flag
 * @param {string} type - FeedbackType.ARCHAIC or FeedbackType.OBSCURE
 */
export function flagWord(word, type) {
  const upperWord = word.toUpperCase();
  const feedback = loadWordFeedback();

  const existing = feedback[upperWord];
  feedback[upperWord] = {
    type,
    count: (existing?.count || 0) + 1,
    lastFlagged: Date.now(),
  };

  saveWordFeedback(feedback);
}

/**
 * Remove feedback for a word (unflag it)
 * @param {string} word - The word to unflag
 */
export function unflagWord(word) {
  const upperWord = word.toUpperCase();
  const feedback = loadWordFeedback();

  delete feedback[upperWord];
  saveWordFeedback(feedback);
}

/**
 * Check if a word has been flagged
 * @param {string} word - The word to check
 * @returns {Object|null} - Feedback data or null if not flagged
 */
export function getWordFeedback(word) {
  const upperWord = word.toUpperCase();
  const feedback = loadWordFeedback();
  return feedback[upperWord] || null;
}

/**
 * Get all flagged words
 * @returns {Set<string>} - Set of flagged words (uppercase)
 */
export function getFlaggedWords() {
  const feedback = loadWordFeedback();
  return new Set(Object.keys(feedback));
}

/**
 * Get a deprioritization score for a word (higher = more deprioritized)
 * @param {string} word - The word to check
 * @returns {number} - Score from 0 (not flagged) to higher values based on flags
 */
export function getDeprioritizationScore(word) {
  const upperWord = word.toUpperCase();
  const feedback = loadWordFeedback();
  const wordFeedback = feedback[upperWord];

  if (!wordFeedback) return 0;

  // More flags = higher deprioritization
  return wordFeedback.count;
}

/**
 * Clear all word feedback
 */
export function clearAllFeedback() {
  localStorage.removeItem(STORAGE_KEY);
}
