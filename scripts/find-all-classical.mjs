#!/usr/bin/env node
/**
 * Find all 50 classical music pieces on Internet Archive
 * with verified public domain licenses
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load our target pieces
const datasetPath = path.join(__dirname, '../public/datasets/classicalComposers.json');
const pieces = JSON.parse(readFileSync(datasetPath, 'utf8'));

// Search terms for each piece
const searchTerms = {
  1: ["beethoven symphony 5 allegro"],
  2: ["fur elise beethoven piano"],
  3: ["eine kleine nachtmusik mozart allegro"],
  4: ["mozart symphony 40 g minor"],
  5: ["vivaldi spring four seasons"],
  6: ["vivaldi winter four seasons"],
  7: ["toccata fugue d minor bach"],
  8: ["bach cello suite prelude"],
  9: ["pachelbel canon d major"],
  10: ["ride valkyries wagner"],
  11: ["blue danube waltz strauss"],
  12: ["hungarian rhapsody liszt 2"],
  13: ["moonlight sonata beethoven adagio"],
  14: ["ode joy beethoven symphony 9"],
  15: ["hall mountain king grieg"],
  16: ["morning mood grieg peer gynt"],
  17: ["swan lake tchaikovsky scene"],
  18: ["nutcracker sugar plum fairy"],
  19: ["1812 overture tchaikovsky"],
  20: ["tchaikovsky piano concerto 1"],
  21: ["chopin nocturne e flat op 9"],
  22: ["minute waltz chopin"],
  23: ["clair de lune debussy"],
  24: ["afternoon faun debussy prelude"],
  25: ["bolero ravel"],
  26: ["william tell overture rossini"],
  27: ["barber seville overture rossini"],
  28: ["habanera carmen bizet"],
  29: ["zarathustra strauss sunrise"],
  30: ["ave maria schubert"],
  31: ["unfinished symphony schubert"],
  32: ["rachmaninoff piano concerto 2"],
  33: ["mahler symphony 5 adagietto"],
  34: ["planets mars holst"],
  35: ["planets jupiter holst"],
  36: ["siegfried funeral march wagner"],
  37: ["verdi requiem dies irae"],
  38: ["la donna mobile rigoletto"],
  39: ["nessun dorma turandot"],
  40: ["air g string bach"],
  41: ["brandenburg concerto 3 bach"],
  42: ["hallelujah chorus handel messiah"],
  43: ["water music hornpipe handel"],
  44: ["hungarian dance brahms 5"],
  45: ["new world symphony dvorak largo"],
  46: ["sorcerer apprentice dukas"],
  47: ["moldau vltava smetana"],
  48: ["bartered bride overture smetana"],
  49: ["peter wolf prokofiev"],
  50: ["romeo juliet dance knights prokofiev"]
};

async function searchArchive(query) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:audio+AND+(licenseurl:*publicdomain*+OR+licenseurl:*zero*+OR+licenseurl:*mark*)&fl=identifier,title,licenseurl,creator&rows=5&output=json`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    return data.response?.docs || [];
  } catch (e) {
    return [];
  }
}

async function getMetadata(identifier) {
  try {
    const resp = await fetch(`https://archive.org/metadata/${identifier}`);
    return await resp.json();
  } catch (e) {
    return null;
  }
}

function findBestAudioFile(metadata, keywords) {
  if (!metadata?.files) return null;

  const audioFiles = metadata.files.filter(f =>
    f.name?.endsWith('.mp3') || f.name?.endsWith('.ogg')
  );

  // Try to find a file matching keywords
  for (const kw of keywords) {
    const match = audioFiles.find(f =>
      f.name.toLowerCase().includes(kw.toLowerCase())
    );
    if (match) return match;
  }

  // If single audio file, use it
  if (audioFiles.length === 1) return audioFiles[0];

  // Return first mp3
  return audioFiles.find(f => f.name?.endsWith('.mp3')) || audioFiles[0];
}

async function main() {
  console.log('Searching for all 50 classical pieces on Internet Archive...\n');

  const found = [];
  const notFound = [];

  for (const piece of pieces) {
    const terms = searchTerms[piece.id] || [piece.title.toLowerCase()];
    console.log(`[${piece.id}/50] ${piece.title}`);

    let bestResult = null;

    for (const term of terms) {
      const results = await searchArchive(term);

      for (const result of results) {
        const metadata = await getMetadata(result.identifier);
        if (!metadata) continue;

        // Keywords to look for in filenames
        const keywords = piece.title.toLowerCase().split(' ').filter(w => w.length > 3);
        const audioFile = findBestAudioFile(metadata, keywords);

        if (audioFile) {
          bestResult = {
            id: piece.id,
            piece: piece.title,
            composer: piece.composer,
            archiveId: result.identifier,
            audioFile: audioFile.name,
            license: result.licenseurl || 'Public Domain',
            performer: result.creator || metadata.metadata?.creator || 'Unknown',
            year: metadata.metadata?.year || metadata.metadata?.date || 'Unknown'
          };
          break;
        }
      }

      if (bestResult) break;
      await new Promise(r => setTimeout(r, 200));
    }

    if (bestResult) {
      console.log(`  ✓ Found: ${bestResult.archiveId}`);
      console.log(`    File: ${bestResult.audioFile}`);
      console.log(`    License: ${bestResult.license}`);
      found.push(bestResult);
    } else {
      console.log(`  ✗ Not found with public domain license`);
      notFound.push({ id: piece.id, title: piece.title, composer: piece.composer });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // Save results
  const outputPath = path.join(__dirname, '../datasets/classical-search-results.json');
  writeFileSync(outputPath, JSON.stringify({
    found,
    notFound,
    timestamp: new Date().toISOString(),
    summary: {
      total: 50,
      found: found.length,
      notFound: notFound.length
    }
  }, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: Found ${found.length}/50 pieces with verified licenses`);
  console.log(`Results saved to: ${outputPath}`);

  if (notFound.length > 0) {
    console.log('\nMissing pieces:');
    for (const p of notFound) {
      console.log(`  [${p.id}] ${p.title} - ${p.composer}`);
    }
  }
}

main().catch(console.error);
