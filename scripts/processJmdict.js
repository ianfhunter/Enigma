#!/usr/bin/env node
/**
 * Process JMdict-simplified JSON into Shiritori word dataset
 *
 * This script:
 * 1. Reads jmdict-eng JSON file
 * 2. Filters to nouns suitable for Shiritori
 * 3. Converts hiragana to romaji
 * 4. Flags common words
 * 5. Outputs a JSON file for the game
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hiragana to romaji conversion map (reverse of what's in japaneseWords.js)
const hiraganaToRomaji = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  // Small kana
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': '',
  // Long vowel mark
  'ー': '-',
};

// Combination patterns for small kana
const combinations = {
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  // Additional combinations
  'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
  'てぃ': 'ti', 'でぃ': 'di',
  'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo',
  'ゔぁ': 'va', 'ゔぃ': 'vi', 'ゔ': 'vu', 'ゔぇ': 've', 'ゔぉ': 'vo',
};

// Katakana to hiragana conversion
const katakanaToHiragana = {};
for (let i = 0; i < 96; i++) {
  const katakana = String.fromCharCode(0x30A0 + i);
  const hiragana = String.fromCharCode(0x3040 + i);
  katakanaToHiragana[katakana] = hiragana;
}
// Special cases
katakanaToHiragana['ー'] = 'ー';

function toHiragana(text) {
  return text.split('').map(char => katakanaToHiragana[char] || char).join('');
}

function hiraganaToRomajiStr(hiragana) {
  let result = '';
  let i = 0;

  while (i < hiragana.length) {
    // Check for two-character combinations first
    if (i < hiragana.length - 1) {
      const twoChar = hiragana.substring(i, i + 2);
      if (combinations[twoChar]) {
        result += combinations[twoChar];
        i += 2;
        continue;
      }
    }

    // Handle small tsu (っ) - doubles the next consonant
    if (hiragana[i] === 'っ') {
      if (i < hiragana.length - 1) {
        const nextChar = hiragana[i + 1];
        const nextRomaji = hiraganaToRomaji[nextChar];
        if (nextRomaji && nextRomaji.length > 0) {
          result += nextRomaji[0]; // Double the consonant
        }
      }
      i++;
      continue;
    }

    // Handle long vowel mark
    if (hiragana[i] === 'ー') {
      // Extend the previous vowel
      if (result.length > 0) {
        const lastChar = result[result.length - 1];
        if ('aeiou'.includes(lastChar)) {
          result += lastChar;
        }
      }
      i++;
      continue;
    }

    // Standard single character conversion
    const romaji = hiraganaToRomaji[hiragana[i]];
    if (romaji !== undefined) {
      result += romaji;
    } else {
      // Unknown character - skip or keep as is
      console.warn(`Unknown hiragana character: ${hiragana[i]} in ${hiragana}`);
      result += hiragana[i];
    }
    i++;
  }

  return result;
}

function isValidHiragana(text) {
  // Check if text contains only hiragana (after conversion from katakana)
  const hiragana = toHiragana(text);
  for (const char of hiragana) {
    if (char !== 'ー' && (char < '\u3040' || char > '\u309F')) {
      return false;
    }
  }
  return true;
}

// Noun-related part of speech tags
const nounTags = new Set([
  'n',        // noun (common)
  'n-adv',    // adverbial noun
  'n-t',      // temporal noun
  'n-suf',    // noun suffix (some work as standalone)
  'n-pref',   // noun prefix
]);

// Tags to exclude (too specialized or not suitable for Shiritori)
const excludeTags = new Set([
  'n-pr',     // proper nouns (names, places) - too obscure
  'X',        // X-rated
  'arch',     // archaic
  'obs',      // obsolete
]);

function processJmdict(inputPath, outputPath) {
  console.log('Reading JMdict file...');
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const jmdict = JSON.parse(rawData);

  console.log(`Loaded ${jmdict.words.length} total entries`);

  const words = [];
  const seenHiragana = new Set();
  const seenRomaji = new Set();

  for (const entry of jmdict.words) {
    // Get the first kana reading
    if (!entry.kana || entry.kana.length === 0) continue;

    const kanaEntry = entry.kana[0];
    const kanaText = kanaEntry.text;

    // Skip if not valid hiragana/katakana
    if (!isValidHiragana(kanaText)) continue;

    // Convert to hiragana
    const hiragana = toHiragana(kanaText);

    // Skip single character words (too easy)
    if (hiragana.length < 2) continue;

    // Skip if we already have this word
    if (seenHiragana.has(hiragana)) continue;

    // Check if it's a noun
    let isNoun = false;
    let hasExcludedTag = false;
    let meaning = null;

    for (const sense of entry.sense) {
      // Check part of speech
      for (const pos of sense.partOfSpeech) {
        if (nounTags.has(pos)) {
          isNoun = true;
        }
        if (excludeTags.has(pos)) {
          hasExcludedTag = true;
        }
      }

      // Check misc tags for exclusions
      for (const misc of sense.misc || []) {
        if (excludeTags.has(misc)) {
          hasExcludedTag = true;
        }
      }

      // Get the first English meaning
      if (!meaning && sense.gloss && sense.gloss.length > 0) {
        const glosses = sense.gloss
          .filter(g => g.lang === 'eng')
          .map(g => g.text)
          .slice(0, 2); // Take first 2 meanings
        if (glosses.length > 0) {
          meaning = glosses.join('; ');
        }
      }
    }

    if (!isNoun || hasExcludedTag || !meaning) continue;

    // Convert to romaji
    const romaji = hiraganaToRomajiStr(hiragana);

    // Skip if romaji conversion failed or is duplicate
    if (!romaji || romaji.includes('undefined') || seenRomaji.has(romaji)) continue;

    // Determine if it's a common word
    const isCommon = kanaEntry.common === true;

    seenHiragana.add(hiragana);
    seenRomaji.add(romaji);

    words.push({
      hiragana,
      romaji,
      meaning,
      common: isCommon,
    });
  }

  // Sort alphabetically by hiragana
  words.sort((a, b) => a.hiragana.localeCompare(b.hiragana, 'ja'));

  console.log(`\nExtracted ${words.length} nouns suitable for Shiritori`);

  // Analyze distribution
  const startKanaCount = {};
  const endKanaCount = {};
  let commonCount = 0;
  let endsInNCount = 0;

  for (const word of words) {
    const startKana = word.hiragana[0];
    const endKana = word.hiragana[word.hiragana.length - 1];

    startKanaCount[startKana] = (startKanaCount[startKana] || 0) + 1;
    endKanaCount[endKana] = (endKanaCount[endKana] || 0) + 1;

    if (word.common) commonCount++;
    if (endKana === 'ん') endsInNCount++;
  }

  console.log(`\nCommon words: ${commonCount}`);
  console.log(`Words ending in ん: ${endsInNCount}`);

  // Show problematic kana
  console.log('\n=== Starting Kana Distribution ===');
  const sortedStart = Object.entries(startKanaCount).sort((a, b) => a[1] - b[1]);
  console.log('Lowest 10:');
  for (const [kana, count] of sortedStart.slice(0, 10)) {
    console.log(`  ${kana}: ${count}`);
  }

  console.log('\n=== Ending Kana Distribution (for chaining) ===');
  const sortedEnd = Object.entries(endKanaCount).sort((a, b) => b[1] - a[1]);
  console.log('Top 10 endings:');
  for (const [kana, count] of sortedEnd.slice(0, 10)) {
    console.log(`  ${kana}: ${count}`);
  }

  // Critical check: words starting with る
  const ruWords = words.filter(w => w.hiragana.startsWith('る'));
  console.log(`\nWords starting with る: ${ruWords.length}`);
  if (ruWords.length < 20) {
    console.log('Sample る words:', ruWords.slice(0, 10).map(w => `${w.hiragana}(${w.romaji})`).join(', '));
  }

  // Write output
  console.log(`\nWriting output to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));

  console.log('Done!');

  return words;
}

// Main execution
const inputFile = process.argv[2] || '/tmp/jmdict-eng-3.6.2.json';
const outputFile = process.argv[3] || path.join(__dirname, '..', 'datasets', 'shiritori_words.json');

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  console.error('Usage: node processJmdict.js [input.json] [output.json]');
  process.exit(1);
}

processJmdict(inputFile, outputFile);
