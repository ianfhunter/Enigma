#!/usr/bin/env node
/**
 * Classical Music Downloader
 *
 * Downloads public domain classical music recordings from Internet Archive
 * for the Classical Music Quiz.
 *
 * IMPORTANT: Only downloads recordings with verified acceptable licenses:
 * - Public Domain
 * - CC0 (Creative Commons Zero)
 * - CC-BY (Creative Commons Attribution)
 * - CC-BY-SA (Creative Commons Attribution ShareAlike)
 *
 * Usage:
 *   node scripts/download-classical-music.mjs [options]
 *
 * Options:
 *   --dry-run    Check licenses without downloading (recommended first!)
 *   --piece N    Only process piece number N
 *   --help       Show this help
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/audio/classical-new');

// Internet Archive API base
const IA_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const IA_METADATA_URL = 'https://archive.org/metadata';
const IA_DOWNLOAD_URL = 'https://archive.org/download';

// Known Internet Archive identifiers for classical pieces
// These are curated public domain recordings
const archiveIdentifiers = {
  // Beethoven
  'Symphony No. 5 in C minor, Op. 67 - 1st Movement': {
    searchTerms: ['beethoven symphony 5', 'beethoven fifth symphony'],
    archiveId: 'lp_beethoven-symphony-no-5-in-c-minor-op-67_the-london-philharmonic-orchestra-eduard',
    fallbackSearch: 'beethoven symphony 5 allegro con brio'
  },
  'Für Elise': {
    searchTerms: ['fur elise beethoven piano', 'bagatelle a minor beethoven'],
    archiveId: 'fur-elise-beethoven',
    fallbackSearch: 'fur elise piano beethoven'
  },
  'Piano Sonata No. 14 \'Moonlight\' - 1st Movement': {
    searchTerms: ['moonlight sonata', 'beethoven moonlight'],
    archiveId: 'moonlight-sonata-adagio-sostenuto',
    fallbackSearch: 'moonlight sonata adagio'
  },
  'Symphony No. 9 \'Ode to Joy\' - 4th Movement (excerpt)': {
    searchTerms: ['ode to joy', 'beethoven ninth'],
    archiveId: 'beethoven-symphony-9-ode-to-joy',
    fallbackSearch: 'ode to joy beethoven'
  },

  // Mozart
  'Eine kleine Nachtmusik - 1st Movement': {
    searchTerms: ['eine kleine nachtmusik', 'little night music mozart'],
    archiveId: 'eine-kleine-nachtmusik-serenade-g-dur',
    fallbackSearch: 'eine kleine nachtmusik allegro'
  },
  'Symphony No. 40 in G minor - 1st Movement': {
    searchTerms: ['mozart symphony 40', 'mozart g minor'],
    archiveId: 'mozart-symphony-40-g-minor',
    fallbackSearch: 'mozart symphony 40 allegro'
  },

  // Vivaldi
  'The Four Seasons: Spring - 1st Movement': {
    searchTerms: ['vivaldi spring', 'four seasons spring'],
    archiveId: 'vivaldi-four-seasons-spring',
    fallbackSearch: 'vivaldi spring allegro'
  },
  'The Four Seasons: Winter - 1st Movement': {
    searchTerms: ['vivaldi winter', 'four seasons winter'],
    archiveId: 'vivaldi-four-seasons-winter',
    fallbackSearch: 'vivaldi winter allegro'
  },

  // Bach
  'Toccata and Fugue in D minor, BWV 565': {
    searchTerms: ['toccata fugue d minor', 'bach toccata'],
    archiveId: 'ToccataAndFugueInDMinor',
    fallbackSearch: 'toccata fugue d minor organ'
  },
  'Cello Suite No. 1 in G major - Prelude': {
    searchTerms: ['bach cello suite 1', 'cello suite prelude'],
    archiveId: 'bach-cello-suite-1-prelude',
    fallbackSearch: 'bach cello suite prelude'
  },
  'Air on the G String': {
    searchTerms: ['air g string', 'bach air'],
    archiveId: 'air-on-the-g-string',
    fallbackSearch: 'bach air g string'
  },
  'Brandenburg Concerto No. 3 - 1st Movement': {
    searchTerms: ['brandenburg concerto 3', 'bach brandenburg'],
    archiveId: 'brandenburg-concerto-3',
    fallbackSearch: 'bach brandenburg 3 allegro'
  },

  // Pachelbel
  'Canon in D': {
    searchTerms: ['pachelbel canon', 'canon in d'],
    archiveId: 'pachelbel-canon-d-major',
    fallbackSearch: 'pachelbel canon'
  },

  // Wagner
  'Ride of the Valkyries': {
    searchTerms: ['ride valkyries', 'wagner valkyrie'],
    archiveId: 'ride-of-the-valkyries',
    fallbackSearch: 'ride of the valkyries wagner'
  },
  'Siegfried\'s Death and Funeral March (Götterdämmerung)': {
    searchTerms: ['siegfried funeral march', 'gotterdammerung'],
    archiveId: 'wagner-siegfried-funeral-march',
    fallbackSearch: 'siegfried funeral march'
  },

  // Strauss II
  'The Blue Danube Waltz': {
    searchTerms: ['blue danube', 'an der schonen blauen donau'],
    archiveId: 'the-blue-danube-waltz',
    fallbackSearch: 'blue danube waltz strauss'
  },

  // Liszt
  'Hungarian Rhapsody No. 2': {
    searchTerms: ['hungarian rhapsody 2', 'liszt rhapsody'],
    archiveId: 'hungarian-rhapsody-no-2',
    fallbackSearch: 'liszt hungarian rhapsody 2'
  },

  // Grieg
  'In the Hall of the Mountain King': {
    searchTerms: ['hall mountain king', 'peer gynt mountain'],
    archiveId: 'in-the-hall-of-the-mountain-king',
    fallbackSearch: 'hall of the mountain king grieg'
  },
  'Morning Mood (Peer Gynt)': {
    searchTerms: ['morning mood', 'peer gynt morning'],
    archiveId: 'morning-mood-peer-gynt',
    fallbackSearch: 'morning mood grieg'
  },

  // Tchaikovsky
  'Swan Lake - Scene': {
    searchTerms: ['swan lake scene', 'tchaikovsky swan'],
    archiveId: 'swan-lake-scene',
    fallbackSearch: 'swan lake tchaikovsky'
  },
  'The Nutcracker - Dance of the Sugar Plum Fairy': {
    searchTerms: ['sugar plum fairy', 'nutcracker celesta'],
    archiveId: 'dance-of-the-sugar-plum-fairy',
    fallbackSearch: 'sugar plum fairy nutcracker'
  },
  '1812 Overture (finale)': {
    searchTerms: ['1812 overture', 'tchaikovsky 1812'],
    archiveId: '1812-overture',
    fallbackSearch: '1812 overture finale'
  },
  'Piano Concerto No. 1 - Opening': {
    searchTerms: ['tchaikovsky piano concerto', 'tchaikovsky concerto 1'],
    archiveId: 'tchaikovsky-piano-concerto-1',
    fallbackSearch: 'tchaikovsky piano concerto 1'
  },

  // Chopin
  'Nocturne in E-flat major, Op. 9 No. 2': {
    searchTerms: ['chopin nocturne op 9', 'nocturne e flat'],
    archiveId: 'chopin-nocturne-op-9-no-2',
    fallbackSearch: 'chopin nocturne e flat'
  },
  'Minute Waltz (Waltz in D-flat major, Op. 64 No. 1)': {
    searchTerms: ['minute waltz', 'chopin waltz op 64'],
    archiveId: 'minute-waltz-chopin',
    fallbackSearch: 'chopin minute waltz'
  },

  // Debussy
  'Clair de Lune': {
    searchTerms: ['clair de lune', 'debussy moonlight'],
    archiveId: 'clair-de-lune',
    fallbackSearch: 'clair de lune debussy'
  },
  'Prélude à l\'après-midi d\'un faune': {
    searchTerms: ['afternoon faun', 'prelude apres midi'],
    archiveId: 'prelude-afternoon-faun',
    fallbackSearch: 'afternoon of a faun debussy'
  },

  // Ravel
  'Boléro': {
    searchTerms: ['ravel bolero'],
    archiveId: 'bolero-ravel',
    fallbackSearch: 'bolero ravel'
  },

  // Rossini
  'William Tell Overture (Finale)': {
    searchTerms: ['william tell overture', 'guillaume tell'],
    archiveId: 'william-tell-overture',
    fallbackSearch: 'william tell overture finale'
  },
  'The Barber of Seville Overture': {
    searchTerms: ['barber seville overture', 'barbiere siviglia'],
    archiveId: 'barber-of-seville-overture',
    fallbackSearch: 'barber of seville overture'
  },

  // Bizet
  'Habanera (Carmen)': {
    searchTerms: ['habanera carmen', 'carmen habanera'],
    archiveId: 'habanera-carmen',
    fallbackSearch: 'habanera carmen bizet'
  },

  // Richard Strauss
  'Also sprach Zarathustra (Opening)': {
    searchTerms: ['zarathustra sunrise', 'also sprach zarathustra'],
    archiveId: 'also-sprach-zarathustra',
    fallbackSearch: 'zarathustra sunrise strauss'
  },

  // Schubert
  'Ave Maria': {
    searchTerms: ['schubert ave maria', 'ellens dritter gesang'],
    archiveId: 'ave-maria-schubert',
    fallbackSearch: 'ave maria schubert'
  },
  'Symphony No. 8 \'Unfinished\' - 1st Movement': {
    searchTerms: ['unfinished symphony', 'schubert symphony 8'],
    archiveId: 'schubert-unfinished-symphony',
    fallbackSearch: 'schubert unfinished symphony'
  },

  // Rachmaninoff
  'Piano Concerto No. 2 - 1st Movement': {
    searchTerms: ['rachmaninoff concerto 2', 'rachmaninov piano'],
    archiveId: 'rachmaninoff-piano-concerto-2',
    fallbackSearch: 'rachmaninoff piano concerto 2'
  },

  // Mahler
  'Symphony No. 5 - 2nd Movement (Adagio)': {
    searchTerms: ['mahler adagietto', 'mahler 5 adagio'],
    archiveId: 'mahler-symphony-5-adagietto',
    fallbackSearch: 'mahler adagietto'
  },

  // Holst
  'The Planets: Mars, the Bringer of War': {
    searchTerms: ['holst mars', 'planets mars'],
    archiveId: 'the-planets-mars',
    fallbackSearch: 'holst mars bringer of war'
  },
  'The Planets: Jupiter, the Bringer of Jollity': {
    searchTerms: ['holst jupiter', 'planets jupiter'],
    archiveId: 'the-planets-jupiter',
    fallbackSearch: 'holst jupiter bringer of jollity'
  },

  // Verdi
  'Requiem: Dies Irae': {
    searchTerms: ['verdi dies irae', 'verdi requiem'],
    archiveId: 'verdi-requiem-dies-irae',
    fallbackSearch: 'verdi dies irae'
  },
  'La donna è mobile (Rigoletto)': {
    searchTerms: ['la donna mobile', 'rigoletto donna'],
    archiveId: 'la-donna-e-mobile',
    fallbackSearch: 'la donna e mobile verdi'
  },

  // Puccini
  'Nessun dorma (Turandot)': {
    searchTerms: ['nessun dorma', 'turandot nessun'],
    archiveId: 'nessun-dorma',
    fallbackSearch: 'nessun dorma puccini'
  },

  // Handel
  'Hallelujah Chorus (Messiah)': {
    searchTerms: ['hallelujah chorus', 'messiah hallelujah'],
    archiveId: 'hallelujah-chorus',
    fallbackSearch: 'handel hallelujah'
  },
  'Water Music Suite - Hornpipe': {
    searchTerms: ['water music hornpipe', 'handel water'],
    archiveId: 'water-music-hornpipe',
    fallbackSearch: 'handel water music hornpipe'
  },

  // Brahms
  'Hungarian Dance No. 5': {
    searchTerms: ['brahms hungarian dance 5', 'hungarian dance'],
    archiveId: 'hungarian-dance-no-5',
    fallbackSearch: 'brahms hungarian dance 5'
  },

  // Dvořák
  'Symphony No. 9 \'From the New World\' - 2nd Movement (Largo)': {
    searchTerms: ['new world symphony largo', 'dvorak largo'],
    archiveId: 'dvorak-new-world-largo',
    fallbackSearch: 'dvorak new world largo'
  },

  // Dukas
  'The Sorcerer\'s Apprentice': {
    searchTerms: ['sorcerer apprentice', 'apprenti sorcier'],
    archiveId: 'sorcerers-apprentice',
    fallbackSearch: 'sorcerer apprentice dukas'
  },

  // Smetana
  'The Moldau (Vltava)': {
    searchTerms: ['moldau vltava', 'smetana moldau'],
    archiveId: 'the-moldau',
    fallbackSearch: 'moldau smetana'
  },
  'The Bartered Bride - Overture': {
    searchTerms: ['bartered bride overture', 'prodana nevesta'],
    archiveId: 'bartered-bride-overture',
    fallbackSearch: 'bartered bride overture'
  },

  // Prokofiev
  'Peter and the Wolf - Opening': {
    searchTerms: ['peter wolf', 'prokofiev peter'],
    archiveId: 'peter-and-the-wolf',
    fallbackSearch: 'peter and the wolf prokofiev'
  },
  'Romeo and Juliet - Dance of the Knights': {
    searchTerms: ['dance knights', 'montagues capulets'],
    archiveId: 'dance-of-the-knights',
    fallbackSearch: 'dance of the knights prokofiev'
  }
};

// Musopen direct download URLs (CC-licensed)
const musopenRecordings = {
  'Für Elise': 'https://musopen.org/music/download/2547/',
  'Canon in D': 'https://musopen.org/music/download/1601/',
  'Clair de Lune': 'https://musopen.org/music/download/1616/',
  'Nocturne in E-flat major, Op. 9 No. 2': 'https://musopen.org/music/download/2548/'
};

async function searchInternetArchive(query) {
  const params = new URLSearchParams({
    q: `${query} AND mediatype:audio AND licenseurl:*publicdomain*`,
    fl: ['identifier', 'title', 'creator'].join(','),
    rows: '5',
    output: 'json'
  });

  const url = `${IA_SEARCH_URL}?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.response?.docs || [];
  } catch (error) {
    console.error(`Search error for "${query}":`, error.message);
    return [];
  }
}

async function getArchiveMetadata(identifier) {
  const url = `${IA_METADATA_URL}/${identifier}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Metadata error for "${identifier}":`, error.message);
    return null;
  }
}

// Acceptable licenses for our use
const ACCEPTABLE_LICENSES = [
  'publicdomain',
  'public domain',
  'pd',
  'cc0',
  'cc-zero',
  'creativecommons.org/publicdomain',
  'creativecommons.org/licenses/by/',
  'creativecommons.org/licenses/by-sa/',
  'creativecommons.org/licenses/by/4.0',
  'creativecommons.org/licenses/by/3.0',
  'creativecommons.org/licenses/by-sa/4.0',
  'creativecommons.org/licenses/by-sa/3.0',
  'no known copyright',
  'united states public domain'
];

function checkLicense(metadata) {
  if (!metadata?.metadata) return { acceptable: false, license: 'Unknown', reason: 'No metadata' };

  const meta = metadata.metadata;

  // Check various license fields
  const licenseFields = [
    meta.licenseurl,
    meta.license,
    meta.rights,
    meta.possible_copyright_status,
    meta.copyright_status
  ].filter(Boolean);

  const licenseStr = licenseFields.join(' ').toLowerCase();

  // Check if it's an acceptable license
  for (const acceptable of ACCEPTABLE_LICENSES) {
    if (licenseStr.includes(acceptable.toLowerCase())) {
      return {
        acceptable: true,
        license: meta.licenseurl || meta.license || meta.rights || 'Public Domain',
        licenseType: acceptable.includes('by-sa') ? 'CC-BY-SA' :
                     acceptable.includes('by') ? 'CC-BY' :
                     'Public Domain',
        source: meta.licenseurl || 'metadata',
        creator: meta.creator || meta.artist || meta.contributor || 'Unknown',
        title: meta.title || 'Unknown',
        year: meta.year || meta.date || 'Unknown'
      };
    }
  }

  // Check for explicit public domain markers
  if (meta.possible_copyright_status === 'NOT_IN_COPYRIGHT' ||
      meta.copyright_status === 'public_domain') {
    return {
      acceptable: true,
      license: 'Public Domain (Copyright Expired)',
      licenseType: 'Public Domain',
      source: 'copyright_status',
      creator: meta.creator || meta.artist || 'Unknown',
      title: meta.title || 'Unknown',
      year: meta.year || meta.date || 'Unknown'
    };
  }

  return {
    acceptable: false,
    license: licenseStr || 'Unknown',
    reason: 'License not in acceptable list'
  };
}

function findAudioFile(metadata) {
  if (!metadata?.files) return null;

  // Prefer MP3, then OGG, then other audio
  const audioFiles = metadata.files.filter(f =>
    f.format?.toLowerCase().includes('mp3') ||
    f.format?.toLowerCase().includes('ogg') ||
    f.format?.toLowerCase().includes('flac') ||
    f.name?.endsWith('.mp3') ||
    f.name?.endsWith('.ogg')
  );

  // Sort by preference
  audioFiles.sort((a, b) => {
    const aScore = a.name?.endsWith('.mp3') ? 2 : (a.name?.endsWith('.ogg') ? 1 : 0);
    const bScore = b.name?.endsWith('.mp3') ? 2 : (b.name?.endsWith('.ogg') ? 1 : 0);
    return bScore - aScore;
  });

  return audioFiles[0] || null;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(destPath);

    protocol.get(url, {
      headers: { 'User-Agent': 'ClassicalMusicQuiz/1.0' }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadPiece(piece, index, dryRun = false) {
  const config = archiveIdentifiers[piece.title];
  if (!config) {
    console.log(`  ⚠️  No download config for: ${piece.title}`);
    return { status: 'no_config', piece: piece.title };
  }

  const filename = `${String(index).padStart(2, '0')}.mp3`;
  const destPath = path.join(OUTPUT_DIR, filename);

  // Try direct Archive.org identifier first
  if (config.archiveId) {
    console.log(`  Trying Archive.org: ${config.archiveId}`);
    const metadata = await getArchiveMetadata(config.archiveId);

    if (metadata) {
      // CHECK LICENSE FIRST
      const licenseInfo = checkLicense(metadata);
      console.log(`  License: ${licenseInfo.license}`);

      if (!licenseInfo.acceptable) {
        console.log(`  ⚠️  License not acceptable: ${licenseInfo.reason || licenseInfo.license}`);
      } else {
        console.log(`  ✓ License OK: ${licenseInfo.licenseType}`);

        const audioFile = findAudioFile(metadata);
        if (audioFile) {
          const downloadUrl = `${IA_DOWNLOAD_URL}/${config.archiveId}/${audioFile.name}`;

          const result = {
            status: 'success',
            piece: piece.title,
            composer: piece.composer,
            file: filename,
            source: 'archive.org',
            archiveId: config.archiveId,
            sourceUrl: `https://archive.org/details/${config.archiveId}`,
            license: licenseInfo.license,
            licenseType: licenseInfo.licenseType,
            performer: licenseInfo.creator,
            recordingTitle: licenseInfo.title,
            recordingYear: licenseInfo.year,
            audioFile: audioFile.name,
            downloadUrl
          };

          if (dryRun) {
            console.log(`  📋 DRY RUN - Would download: ${audioFile.name}`);
            console.log(`     From: ${downloadUrl}`);
            return result;
          }

          console.log(`  Downloading: ${audioFile.name}`);
          try {
            await downloadFile(downloadUrl, destPath);
            console.log(`  ✅ Downloaded: ${filename}`);
            return result;
          } catch (error) {
            console.log(`  ❌ Download failed: ${error.message}`);
          }
        }
      }
    }
  }

  // Try search
  for (const searchTerm of config.searchTerms) {
    console.log(`  Searching: "${searchTerm}"`);
    const results = await searchInternetArchive(searchTerm);

    for (const result of results) {
      console.log(`    Found: ${result.identifier} - ${result.title}`);
      const metadata = await getArchiveMetadata(result.identifier);

      if (metadata) {
        // CHECK LICENSE FIRST
        const licenseInfo = checkLicense(metadata);
        console.log(`    License: ${licenseInfo.license}`);

        if (!licenseInfo.acceptable) {
          console.log(`    ⚠️  Skipping - license not acceptable`);
          continue;
        }

        console.log(`    ✓ License OK: ${licenseInfo.licenseType}`);

        const audioFile = findAudioFile(metadata);
        if (audioFile) {
          const downloadUrl = `${IA_DOWNLOAD_URL}/${result.identifier}/${audioFile.name}`;

          const downloadResult = {
            status: 'success',
            piece: piece.title,
            composer: piece.composer,
            file: filename,
            source: 'archive.org',
            archiveId: result.identifier,
            sourceUrl: `https://archive.org/details/${result.identifier}`,
            license: licenseInfo.license,
            licenseType: licenseInfo.licenseType,
            performer: licenseInfo.creator,
            recordingTitle: licenseInfo.title,
            recordingYear: licenseInfo.year,
            audioFile: audioFile.name,
            downloadUrl
          };

          if (dryRun) {
            console.log(`    📋 DRY RUN - Would download: ${audioFile.name}`);
            console.log(`       From: ${downloadUrl}`);
            return downloadResult;
          }

          console.log(`    Downloading: ${audioFile.name}`);
          try {
            await downloadFile(downloadUrl, destPath);
            console.log(`  ✅ Downloaded: ${filename}`);
            return downloadResult;
          } catch (error) {
            console.log(`    Download failed: ${error.message}`);
          }
        }
      }
    }
  }

  console.log(`  ❌ Could not find properly licensed recording for: ${piece.title}`);
  return { status: 'not_found', piece: piece.title };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const pieceArg = args.indexOf('--piece');
  const singlePiece = pieceArg !== -1 ? parseInt(args[pieceArg + 1]) : null;

  if (args.includes('--help')) {
    console.log(`
Classical Music Downloader - Downloads public domain recordings

Usage:
  node scripts/download-classical-music.mjs [options]

Options:
  --dry-run    Check licenses and show what would be downloaded (NO actual downloads)
  --piece N    Only process piece number N (1-50)
  --help       Show this help

Examples:
  node scripts/download-classical-music.mjs --dry-run          # Check all licenses
  node scripts/download-classical-music.mjs --dry-run --piece 1  # Check piece #1 only
  node scripts/download-classical-music.mjs                    # Download all
`);
    return;
  }

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         CLASSICAL MUSIC DOWNLOADER - PUBLIC DOMAIN AUDIO         ║');
  if (dryRun) {
    console.log('║                        🔍 DRY RUN MODE                            ║');
  }
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  if (dryRun) {
    console.log('⚠️  DRY RUN: No files will be downloaded. Checking licenses only.');
    console.log('');
  }

  // Create output directory (even for dry run, to validate path)
  if (!dryRun && !existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  // Load pieces
  const datasetPath = path.join(__dirname, '../public/datasets/classicalComposers.json');
  let pieces = JSON.parse(readFileSync(datasetPath, 'utf8'));

  if (singlePiece !== null) {
    pieces = pieces.filter(p => p.id === singlePiece);
    if (pieces.length === 0) {
      console.log(`Error: Piece #${singlePiece} not found`);
      return;
    }
    console.log(`Processing single piece: #${singlePiece}`);
  }

  console.log(`${dryRun ? 'Checking' : 'Downloading'} ${pieces.length} pieces...`);
  console.log('');

  const successful = [];
  const failed = [];

  for (const piece of pieces) {
    console.log(`[${piece.id}/${50}] ${piece.title}`);
    console.log(`    Composer: ${piece.composer}`);

    const result = await downloadPiece(piece, piece.id, dryRun);

    if (result.status === 'success') {
      successful.push(result);
    } else {
      failed.push(result);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                              SUMMARY                               ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`✅ Successfully downloaded: ${successful.length}/${pieces.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('Failed pieces:');
    failed.forEach(f => console.log(`  - ${f.piece} (${f.status})`));
  }

  // Save detailed results with licensing
  const resultsPath = path.join(__dirname, '../datasets/classical-music-licenses.json');
  writeFileSync(resultsPath, JSON.stringify({
    downloaded: successful,
    failed,
    timestamp: new Date().toISOString(),
    summary: {
      total: pieces.length,
      successful: successful.length,
      failed: failed.length,
      licenseBreakdown: successful.reduce((acc, r) => {
        acc[r.licenseType] = (acc[r.licenseType] || 0) + 1;
        return acc;
      }, {})
    }
  }, null, 2), 'utf8');
  console.log('');
  console.log(`License details saved to: ${resultsPath}`);

  // Generate attribution markdown (in datasets folder during dry-run, in audio folder when downloading)
  const attributionDir = dryRun ? path.join(__dirname, '../datasets') : OUTPUT_DIR;
  if (!existsSync(attributionDir)) {
    mkdirSync(attributionDir, { recursive: true });
  }
  const attributionPath = path.join(attributionDir, dryRun ? 'classical-music-attributions-preview.md' : 'ATTRIBUTIONS.md');
  let attributionMd = `# Classical Music Quiz - Audio Attributions

Generated: ${new Date().toISOString()}

## License Summary

| License Type | Count |
|--------------|-------|
`;

  const licenseBreakdown = successful.reduce((acc, r) => {
    acc[r.licenseType] = (acc[r.licenseType] || 0) + 1;
    return acc;
  }, {});

  for (const [license, count] of Object.entries(licenseBreakdown)) {
    attributionMd += `| ${license} | ${count} |\n`;
  }

  attributionMd += `\n## Individual Attributions\n\n`;

  for (const recording of successful) {
    attributionMd += `### ${recording.file} - ${recording.piece}
- **Composer**: ${recording.composer}
- **Recording**: ${recording.recordingTitle}
- **Performer**: ${recording.performer}
- **Year**: ${recording.recordingYear}
- **License**: ${recording.licenseType} (${recording.license})
- **Source**: [Internet Archive](${recording.sourceUrl})

`;
  }

  if (failed.length > 0) {
    attributionMd += `## Missing Recordings

The following pieces could not be found with acceptable licenses:

`;
    for (const f of failed) {
      attributionMd += `- ${f.piece} (${f.status})\n`;
    }
  }

  writeFileSync(attributionPath, attributionMd, 'utf8');
  console.log(`Attribution file saved to: ${attributionPath}`);

  console.log('');
  console.log('LICENSE BREAKDOWN:');
  for (const [license, count] of Object.entries(licenseBreakdown)) {
    console.log(`  ${license}: ${count} recordings`);
  }

  console.log('');
  console.log('NOTE: After downloading, you may need to:');
  console.log('1. Convert files to OGG format: ffmpeg -i input.mp3 -c:a libvorbis -q:a 5 output.ogg');
  console.log('2. Trim files to appropriate length (30-60 seconds)');
  console.log('3. Verify audio quality and correct piece identification');
}

main().catch(console.error);
