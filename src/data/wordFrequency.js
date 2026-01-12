// Word Frequency Module
// Uses SUBTLEX corpus data to identify common vs obscure words
// SUBTLEX is based on movie/TV subtitles - reflects words people actually understand
// Supports both US and UK English variants

import subtlexData from 'subtlex-word-frequencies';

// Import US to UK spelling mappings
import americanSpellings from 'american-british-english-translator/data/american_spellings.json';

// Build frequency lookup map (word -> frequency count)
// The npm package provides {word, count} sorted by frequency
const FREQUENCY_MAP = new Map();

for (const entry of subtlexData) {
  // Normalize to uppercase (the package has mixed case like "Where")
  FREQUENCY_MAP.set(entry.word.toUpperCase(), entry.count);
}

// Build US -> UK spelling map (uppercase)
const US_TO_UK_MAP = new Map();
const UK_TO_US_MAP = new Map();

for (const [us, uk] of Object.entries(americanSpellings)) {
  const usUpper = us.toUpperCase();
  const ukUpper = uk.toUpperCase();
  US_TO_UK_MAP.set(usUpper, ukUpper);
  UK_TO_US_MAP.set(ukUpper, usUpper);
}

// Total corpus size for calculating frequency per million
// SUBTLEX-US is based on ~51 million words
const CORPUS_SIZE = 51_000_000;

// Current English variant setting (defaults to 'us')
// This can be updated at runtime by the settings system
let currentVariant = 'us';

/**
 * Set the current English variant
 * @param {'us' | 'uk'} variant
 */
export function setEnglishVariant(variant) {
  currentVariant = variant;
}

/**
 * Get the current English variant
 * @returns {'us' | 'uk'}
 */
export function getEnglishVariant() {
  return currentVariant;
}

/**
 * Convert a word to the current English variant spelling
 * @param {string} word
 * @returns {string}
 */
export function toCurrentVariant(word) {
  const upper = word.toUpperCase();
  if (currentVariant === 'uk') {
    return US_TO_UK_MAP.get(upper) || upper;
  }
  return UK_TO_US_MAP.get(upper) || upper;
}

/**
 * Convert a word from UK to US spelling (for frequency lookup)
 * @param {string} word
 * @returns {string}
 */
export function toUSSpelling(word) {
  const upper = word.toUpperCase();
  return UK_TO_US_MAP.get(upper) || upper;
}

/**
 * Convert a word from US to UK spelling
 * @param {string} word
 * @returns {string}
 */
export function toUKSpelling(word) {
  const upper = word.toUpperCase();
  return US_TO_UK_MAP.get(upper) || upper;
}

/**
 * Get raw frequency count for a word
 * Handles both US and UK spellings by looking up the US variant
 * @param {string} word
 * @returns {number} - Raw count from corpus, or 0 if not found
 */
export function getWordFrequencyCount(word) {
  const upper = word.toUpperCase();
  // Try direct lookup first
  let count = FREQUENCY_MAP.get(upper);
  if (count !== undefined) return count;

  // If UK spelling, try US variant
  const usSpelling = UK_TO_US_MAP.get(upper);
  if (usSpelling) {
    count = FREQUENCY_MAP.get(usSpelling);
    if (count !== undefined) return count;
  }

  return 0;
}

/**
 * Get frequency per million for a word
 * @param {string} word
 * @returns {number} - Frequency per million words
 */
export function getWordFrequency(word) {
  const count = getWordFrequencyCount(word);
  return (count / CORPUS_SIZE) * 1_000_000;
}

/**
 * Get Zipf score (log scale 1-7, where 7 is most common)
 * More intuitive than raw frequency - each point is 10x difference
 * @param {string} word
 * @returns {number} - Zipf score (0 if not in corpus)
 */
export function getZipfScore(word) {
  const freqPerMillion = getWordFrequency(word);
  if (freqPerMillion === 0) return 0;
  // Zipf = log10(frequency per billion) + 3
  // Simplified: log10(freqPerMillion) + 3
  return Math.log10(freqPerMillion * 1000) + 3;
}

/**
 * Dynamic threshold based on word length
 * Longer words are naturally rarer, so we adjust expectations
 * Returns minimum Zipf score for a word to be considered "common"
 * @param {number} length - Word length
 * @returns {number} - Minimum Zipf score threshold
 */
function getThresholdForLength(length) {
  // Zipf scale: 1-2 = very rare, 3-4 = uncommon, 4-5 = common, 6-7 = very common
  if (length <= 3) return 3.5;  // Short words should be quite common
  if (length <= 4) return 3.2;
  if (length <= 5) return 3.0;
  if (length <= 6) return 2.8;
  if (length <= 7) return 2.5;
  if (length <= 8) return 2.2;
  return 2.0;  // 9+ letter words can be rarer
}

/**
 * Check if a word is common enough for target/puzzle selection
 * @param {string} word
 * @returns {boolean}
 */
export function isCommonWord(word) {
  const zipf = getZipfScore(word);
  const threshold = getThresholdForLength(word.length);
  return zipf >= threshold;
}

/**
 * Filter an array of words to only common ones
 * @param {string[]} words
 * @returns {string[]}
 */
export function filterToCommonWords(words) {
  return words.filter(isCommonWord);
}

/**
 * Sort words by frequency (most common first)
 * @param {string[]} words
 * @returns {string[]}
 */
export function sortByFrequency(words) {
  return [...words].sort((a, b) => {
    return getWordFrequencyCount(b) - getWordFrequencyCount(a);
  });
}

/**
 * Get frequency tier for display purposes
 * @param {string} word
 * @returns {'very_common' | 'common' | 'uncommon' | 'rare' | 'very_rare'}
 */
export function getFrequencyTier(word) {
  const zipf = getZipfScore(word);
  if (zipf >= 5.5) return 'very_common';
  if (zipf >= 4.0) return 'common';
  if (zipf >= 3.0) return 'uncommon';
  if (zipf >= 2.0) return 'rare';
  return 'very_rare';
}

/**
 * Check if frequency data is loaded (for debugging)
 * @returns {{ loaded: boolean, wordCount: number, ukMappings: number }}
 */
export function getFrequencyStats() {
  return {
    loaded: FREQUENCY_MAP.size > 0,
    wordCount: FREQUENCY_MAP.size,
    ukMappings: US_TO_UK_MAP.size,
  };
}

/**
 * Get all US/UK spelling pairs
 * @returns {Map<string, string>} US to UK map
 */
export function getSpellingVariants() {
  return new Map(US_TO_UK_MAP);
}
