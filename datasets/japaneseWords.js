// Japanese words for Shiritori
// Loaded from JMdict dictionary with ~160,000 nouns
// Supports filtering to common words only (~15,000 words)

import wordsData from './shiritori_words.json';

// Current filter state - can be changed at runtime
let commonOnlyFilter = false;

// Cache for filtered word lists
let cachedWords = null;
let cachedWordsByStartKana = null;
let cachedWordsByRomaji = null;
let cachedWordsByHiragana = null;

// Rebuild caches when filter changes
function rebuildCaches() {
  const sourceWords = commonOnlyFilter
    ? wordsData.filter(w => w.common)
    : wordsData;

  cachedWords = sourceWords;

  // Build index by starting hiragana for fast lookup
  cachedWordsByStartKana = {};
  cachedWordsByRomaji = {};
  cachedWordsByHiragana = {};

  sourceWords.forEach(word => {
    const startKana = word.hiragana[0];
    if (!cachedWordsByStartKana[startKana]) {
      cachedWordsByStartKana[startKana] = [];
    }
    cachedWordsByStartKana[startKana].push(word);

    // Index by romaji and hiragana for fast lookups
    cachedWordsByRomaji[word.romaji] = word;
    cachedWordsByHiragana[word.hiragana] = word;
  });
}

// Initialize caches
rebuildCaches();

// Set whether to use only common words
export function setCommonOnlyFilter(enabled) {
  if (commonOnlyFilter !== enabled) {
    commonOnlyFilter = enabled;
    rebuildCaches();
  }
}

// Get current filter state
export function getCommonOnlyFilter() {
  return commonOnlyFilter;
}

// Get word count stats
export function getWordStats() {
  return {
    total: wordsData.length,
    common: wordsData.filter(w => w.common).length,
    current: cachedWords.length,
    commonOnly: commonOnlyFilter,
  };
}

// Get the last kana of a word (handles small kana)
export function getLastKana(hiragana) {
  // Small kana (ゃゅょっぁぃぅぇぉ) combine with previous kana
  const smallKana = 'ゃゅょっぁぃぅぇぉ';
  const lastChar = hiragana[hiragana.length - 1];

  if (smallKana.includes(lastChar) && hiragana.length > 1) {
    // Return the combo (e.g., 'きょ' from 'とうきょ')
    return hiragana.slice(-2);
  }

  // Handle long vowel mark ー
  if (lastChar === 'ー' && hiragana.length > 1) {
    return hiragana[hiragana.length - 2];
  }

  return lastChar;
}

// Check if word ends in ん (which means you lose!)
export function endsInN(hiragana) {
  return hiragana[hiragana.length - 1] === 'ん';
}

// Check if word starts with the required kana
export function startsWithKana(word, requiredKana) {
  // Handle small kana combos
  if (requiredKana.length === 2) {
    return word.hiragana.startsWith(requiredKana);
  }
  return word.hiragana[0] === requiredKana;
}

// Find words starting with a specific kana
export function getWordsByStartKana(kana) {
  // For combo kana (きょ, etc.), we need to check properly
  if (kana.length === 2) {
    return cachedWords.filter(w => w.hiragana.startsWith(kana));
  }
  return cachedWordsByStartKana[kana] || [];
}

// Convert romaji to hiragana (exported for potential future use)
export const romajiMap = {
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を', 'n': 'ん',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  '-': 'ー', 'aa': 'ああ', 'ii': 'いい', 'uu': 'うう', 'ee': 'ええ', 'oo': 'おお',
  'ou': 'おう',
  'si': 'し', 'ti': 'ち', 'tu': 'つ', 'hu': 'ふ',
};

// Look up word by romaji
export function findWordByRomaji(romaji) {
  const lower = romaji.toLowerCase();
  return cachedWordsByRomaji[lower] || null;
}

// Look up word by hiragana
export function findWordByHiragana(hiragana) {
  return cachedWordsByHiragana[hiragana] || null;
}

// Check if input matches a valid word (by romaji or hiragana)
export function isValidJapaneseWord(input) {
  const lower = input.toLowerCase();
  return cachedWordsByRomaji[lower] !== undefined || cachedWordsByHiragana[lower] !== undefined;
}

// Get word data by input (romaji or hiragana)
export function getWordData(input) {
  const lower = input.toLowerCase();
  return cachedWordsByRomaji[lower] || cachedWordsByHiragana[lower] || null;
}

// Get all words
export function getAllWords() {
  return cachedWords;
}

// Get safe starting words (don't end in ん)
export function getSafeStartWords() {
  return cachedWords.filter(w => !endsInN(w.hiragana));
}

// Export all words (raw data) for reference
export const japaneseWords = wordsData;

export default wordsData;
