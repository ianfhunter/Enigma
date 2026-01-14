#!/usr/bin/env node
/**
 * Copyright (C) 2024 Ian Hunter
 * 
 * This file is part of Enigma and is licensed under GPL-3.0.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 * This script uses data from:
 * - MsFit wordlist (GPL-3.0) from https://github.com/nzfeng/crossword-dataset
 *   Copyright (c) Nicole Feng
 * 
 * Generate crossword clues from MsFit wordlist using WordNet definitions
 * Run: node scripts/generate-crossword-definitions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import wordnet from 'wordnet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Initializing WordNet...');
  await wordnet.init();

  // Read MsFit wordlist
  const wordlistPath = path.join(__dirname, '../datasets/msfit_wordlist.txt');
  const rawWordlist = fs.readFileSync(wordlistPath, 'utf-8');

  const words = rawWordlist
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => ({
      original: line,
      normalized: line.replace(/_/g, '').toUpperCase().replace(/[^A-Z]/g, '')
    }))
    .filter(w => w.normalized.length >= 3 && w.normalized.length <= 12);

  console.log(`Processing ${words.length} words...`);

  const clues = [];
  let foundCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < words.length; i++) {
    const { original, normalized } = words[i];

    if (i % 1000 === 0) {
      console.log(`Progress: ${i}/${words.length} (${foundCount} definitions found)`);
    }

    try {
      // Try looking up the original word (with underscores replaced by spaces for multi-word)
      const lookupWord = original.replace(/_/g, ' ').toLowerCase();
      const results = await wordnet.lookup(lookupWord);

      if (results && results.length > 0) {
        // Get the first (most common) definition
        let definition = results[0].glossary;

        // Clean up the definition
        // Remove example sentences in quotes
        definition = definition.split(';')[0].trim();
        // Remove the answer word if it appears in the definition
        const wordRegex = new RegExp(`\\b${normalized}\\b`, 'gi');
        definition = definition.replace(wordRegex, '___');

        // Capitalize first letter
        definition = definition.charAt(0).toUpperCase() + definition.slice(1);

        clues.push({
          answer: normalized,
          clue: definition,
        });
        foundCount++;
      } else {
        // No definition found - use a fallback
        notFoundCount++;
      }
    } catch (err) {
      notFoundCount++;
    }
  }

  console.log(`\nComplete!`);
  console.log(`Definitions found: ${foundCount}`);
  console.log(`Not found: ${notFoundCount}`);

  // Sort by answer for consistent output
  clues.sort((a, b) => a.answer.localeCompare(b.answer));

  // Remove duplicates (same answer)
  const uniqueClues = [];
  const seenAnswers = new Set();
  for (const clue of clues) {
    if (!seenAnswers.has(clue.answer)) {
      seenAnswers.add(clue.answer);
      uniqueClues.push(clue);
    }
  }

  console.log(`Unique entries: ${uniqueClues.length}`);

  // Write to JSON file
  const outputPath = path.join(__dirname, '../datasets/crossword_clues.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueClues, null, 2));
  console.log(`Written to: ${outputPath}`);
}

main().catch(console.error);
