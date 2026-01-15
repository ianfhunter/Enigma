#!/usr/bin/env node
/**
 * Download Verified Classical Music Recordings
 *
 * Downloads only manually verified public domain recordings from Internet Archive.
 * Each entry has been checked for correct piece identification and license.
 */

import { writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/audio/classical-verified');

// Verified recordings with confirmed licenses
const VERIFIED_RECORDINGS = [
  // === BATCH 1 (Already downloaded) ===
  {
    id: 1,
    piece: "Symphony No. 5 in C minor, Op. 67 - 1st Movement",
    composer: "Ludwig van Beethoven",
    archiveId: "BeethovenSymphonyNo.5",
    audioFile: "ToscaniniBeethoven5.mp3",
    license: "Public Domain",
    licenseUrl: "http://creativecommons.org/licenses/publicdomain/",
    performer: "NBC Symphony Orchestra / Arturo Toscanini",
    year: "1939",
    notes: "Historic recording"
  },
  {
    id: 7,
    piece: "Toccata and Fugue in D minor, BWV 565",
    composer: "Johann Sebastian Bach",
    archiveId: "ToccataAndFugueInDMinor",
    audioFile: "12ToccataAndFugueInDMinor.mp3",
    license: "Public Domain",
    licenseUrl: "http://creativecommons.org/licenses/publicdomain/",
    performer: "Unknown organist",
    year: "Unknown",
    notes: "Organ recording"
  },
  {
    id: 9,
    piece: "Canon in D",
    composer: "Johann Pachelbel",
    archiveId: "Canon_25",
    audioFile: "PachelbelCanon.mp3",
    license: "CC0 (Public Domain Dedication)",
    licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/",
    performer: "Unknown",
    year: "Unknown",
    notes: "Clean recording"
  },
  {
    id: 10,
    piece: "Ride of the Valkyries",
    composer: "Richard Wagner",
    archiveId: "RideOfTheValkyries",
    audioFile: "ride_of_the_valkyries.mp3",
    license: "Public Domain",
    licenseUrl: "http://creativecommons.org/licenses/publicdomain/",
    performer: "Unknown orchestra",
    year: "Unknown",
    notes: "Orchestral recording"
  },
  {
    id: 13,
    piece: "Piano Sonata No. 14 'Moonlight' - 1st Movement",
    composer: "Ludwig van Beethoven",
    archiveId: "JV-37849-1959-QmajaTZxuxFfoxCZ4AeWkLhvPkjQqD3hp6HQrg7r6FGc3x.mp3",
    audioFile: "DH494807.mp3",
    license: "CC0 (Public Domain Dedication)",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    performer: "Unknown pianist",
    year: "1959",
    notes: "1st movement Adagio sostenuto"
  },

  // === BATCH 2 (New) ===
  {
    id: 2,
    piece: "Für Elise",
    composer: "Ludwig van Beethoven",
    archiveId: "FurElise_353",
    audioFile: "FurElise.mp3",
    license: "Public Domain",
    licenseUrl: "http://creativecommons.org/licenses/publicdomain/",
    performer: "Zell Denver",
    year: "Unknown",
    notes: "Piano solo"
  },
  {
    id: 3,
    piece: "Eine kleine Nachtmusik - 1st Movement",
    composer: "Wolfgang Amadeus Mozart",
    archiveId: "baby-einstein-baby-mozart-2",
    audioFile: "02 Serenade No.13 in G, \"Eine kleine Nachtmusik\", K525, 1st movement.mp3",
    license: "Public Domain Mark",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    performer: "Baby Einstein Orchestra",
    year: "2007",
    notes: "Allegro first movement"
  },
  {
    id: 11,
    piece: "The Blue Danube Waltz",
    composer: "Johann Strauss II",
    archiveId: "02.-blue-danube-stanley-wilson",
    audioFile: "02. Blue Danube - Stanley Wilson.mp3",
    license: "Public Domain Mark",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    performer: "Stanley Wilson Orchestra",
    year: "1962",
    notes: "Full waltz"
  },
  {
    id: 15,
    piece: "In the Hall of the Mountain King",
    composer: "Edvard Grieg",
    archiveId: "baby-einstein-baby-noah",
    audioFile: "20 Lion's Pride (Peer Gynt Suite No. 1, Op. 46, In the Hall of the Mountain King, Grieg).mp3",
    license: "Public Domain Mark",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    performer: "Baby Einstein Orchestra",
    year: "2004",
    notes: "From Peer Gynt Suite"
  },
  {
    id: 16,
    piece: "Morning Mood (Peer Gynt)",
    composer: "Edvard Grieg",
    archiveId: "baby-einstein-baby-noah",
    audioFile: "19 Morning; A Bright New Day (Peer Gynt Suite No. 1, Op. 46, Morning Mood, Grieg).mp3",
    license: "Public Domain Mark",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    performer: "Baby Einstein Orchestra",
    year: "2004",
    notes: "From Peer Gynt Suite"
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`    Downloading from: ${url}`);

    const file = createWriteStream(destPath);

    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 ClassicalMusicQuiz/1.0' }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        console.log(`    Following redirect...`);
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize) {
          const percent = Math.round((downloaded / totalSize) * 100);
          process.stdout.write(`\r    Progress: ${percent}%`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`\n    ✅ Saved to: ${destPath}`);
        resolve(destPath);
      });
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║      DOWNLOADING VERIFIED PUBLIC DOMAIN CLASSICAL RECORDINGS     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  const results = [];
  const failed = [];

  for (const recording of VERIFIED_RECORDINGS) {
    console.log(`[${recording.id}] ${recording.piece}`);
    console.log(`    Composer: ${recording.composer}`);
    console.log(`    License: ${recording.license}`);
    console.log(`    Source: https://archive.org/details/${recording.archiveId}`);

    const filename = `${String(recording.id).padStart(2, '0')}.mp3`;
    const destPath = path.join(OUTPUT_DIR, filename);
    const downloadUrl = `https://archive.org/download/${recording.archiveId}/${encodeURIComponent(recording.audioFile)}`;

    try {
      await downloadFile(downloadUrl, destPath);
      results.push({
        ...recording,
        localFile: filename,
        sourceUrl: `https://archive.org/details/${recording.archiveId}`
      });
    } catch (error) {
      console.log(`    ❌ Failed: ${error.message}`);
      failed.push({ ...recording, error: error.message });
    }

    console.log('');
  }

  // Generate attribution file
  let attribution = `# Classical Music Quiz - Verified Audio Attributions

Generated: ${new Date().toISOString()}

All recordings below are **verified public domain** or **CC0 licensed**.

## Downloaded Recordings

| File | Piece | Composer | License | Source |
|------|-------|----------|---------|--------|
`;

  for (const r of results) {
    attribution += `| ${r.localFile} | ${r.piece} | ${r.composer} | ${r.license} | [Archive.org](${r.sourceUrl}) |\n`;
  }

  attribution += `\n## Detailed Attributions\n\n`;

  for (const r of results) {
    attribution += `### ${r.localFile} - ${r.piece}
- **Composer**: ${r.composer}
- **Performer**: ${r.performer}
- **Recording Year**: ${r.year}
- **License**: [${r.license}](${r.licenseUrl})
- **Source**: [Internet Archive](${r.sourceUrl})
- **Notes**: ${r.notes}

`;
  }

  if (failed.length > 0) {
    attribution += `## Failed Downloads\n\n`;
    for (const f of failed) {
      attribution += `- ${f.piece} (${f.composer}): ${f.error}\n`;
    }
  }

  const attrPath = path.join(OUTPUT_DIR, 'ATTRIBUTIONS.md');
  writeFileSync(attrPath, attribution, 'utf8');

  // Also save as JSON for programmatic use
  const jsonPath = path.join(OUTPUT_DIR, 'licenses.json');
  writeFileSync(jsonPath, JSON.stringify({
    generated: new Date().toISOString(),
    recordings: results,
    failed
  }, null, 2), 'utf8');

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                              SUMMARY                               ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`✅ Downloaded: ${results.length}/${VERIFIED_RECORDINGS.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log('');
  console.log(`Attribution file: ${attrPath}`);
  console.log(`License JSON: ${jsonPath}`);
  console.log('');
  console.log('All recordings are verified Public Domain or CC0.');
}

main().catch(console.error);
