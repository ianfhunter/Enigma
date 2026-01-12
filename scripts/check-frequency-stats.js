// Quick script to check frequency stats
// Run with: npm test -- --run scripts/check-frequency-stats.test.js

import { describe, it } from 'vitest';
import { getCommonWordsByLength, getCommonFiveLetterWords, getFiveLetterWords } from '../src/data/wordUtils.js';
import { getFrequencyStats, getZipfScore } from '../src/data/wordFrequency.js';

describe('Frequency Statistics Report', () => {
  it('prints frequency stats', () => {
    const stats = getFrequencyStats();
    console.log('\n=== WORD FREQUENCY STATISTICS ===\n');
    console.log(`Total words in SUBTLEX corpus: ${stats.wordCount.toLocaleString()}`);
    console.log('\nCommon words by length:');

    for (let len = 3; len <= 12; len++) {
      const common = getCommonWordsByLength(len);
      const examples = common.slice(0, 5).join(', ');
      console.log(`  ${len} letters: ${common.length.toLocaleString()} common words`);
      if (common.length > 0) {
        console.log(`    Examples: ${examples}${common.length > 5 ? '...' : ''}`);
      }
    }

    const all5 = getFiveLetterWords();
    const common5 = getCommonFiveLetterWords();
    console.log(`\n5-letter word comparison:`);
    console.log(`  Total in dictionary: ${all5.length.toLocaleString()}`);
    console.log(`  Common (for targets): ${common5.length.toLocaleString()}`);
    console.log(`  Filter ratio: ${(common5.length / all5.length * 100).toFixed(1)}%`);

    // Show some examples of filtered vs unfiltered
    const uncommonExamples = all5
      .filter(w => !common5.includes(w))
      .slice(0, 10);
    console.log(`\n  Examples of filtered OUT (obscure) words:`);
    console.log(`    ${uncommonExamples.join(', ')}`);

    console.log('\n=================================\n');
  });
});
