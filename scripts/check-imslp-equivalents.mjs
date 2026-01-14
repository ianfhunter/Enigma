#!/usr/bin/env node
/**
 * IMSLP Equivalent Checker for Classical Music Quiz
 *
 * This script checks IMSLP (International Music Score Library Project) for
 * equivalent recordings of our current classical music pieces.
 *
 * IMSLP recordings of works by composers who died before 1954 (in most countries)
 * are in the public domain.
 *
 * Usage:
 *   node scripts/check-imslp-equivalents.mjs [--check] [--output <file>]
 *
 * Options:
 *   --check    Actually fetch IMSLP pages to verify availability (slower)
 *   --output   Output results to a JSON file
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load our current dataset
const datasetPath = path.join(__dirname, '../public/datasets/classicalComposers.json');
const pieces = JSON.parse(readFileSync(datasetPath, 'utf8'));

// IMSLP base URLs
const IMSLP_SEARCH_URL = 'https://imslp.org/wiki/Special:Search?search=';
const IMSLP_WIKI_URL = 'https://imslp.org/wiki/';

// Composer death years - works are public domain 70 years after death in most jurisdictions
const composerDeathYears = {
  'Ludwig van Beethoven': 1827,
  'Wolfgang Amadeus Mozart': 1791,
  'Antonio Vivaldi': 1741,
  'Johann Sebastian Bach': 1750,
  'Johann Pachelbel': 1706,
  'Richard Wagner': 1883,
  'Johann Strauss II': 1899,
  'Franz Liszt': 1886,
  'Edvard Grieg': 1907,
  'Pyotr Ilyich Tchaikovsky': 1893,
  'Frédéric Chopin': 1849,
  'Claude Debussy': 1918,
  'Maurice Ravel': 1937,
  'Gioachino Rossini': 1868,
  'Georges Bizet': 1875,
  'Richard Strauss': 1949,
  'Franz Schubert': 1828,
  'Sergei Rachmaninoff': 1943,
  'Gustav Mahler': 1911,
  'Gustav Holst': 1934,
  'Giuseppe Verdi': 1901,
  'Giacomo Puccini': 1924,
  'George Frideric Handel': 1759,
  'Johannes Brahms': 1897,
  'Antonín Dvořák': 1904,
  'Paul Dukas': 1935,
  'Bedřich Smetana': 1884,
  'Sergei Prokofiev': 1953
};

// Known IMSLP page names for common works (to construct direct links)
const imslpPageNames = {
  'Symphony No. 5 in C minor, Op. 67 - 1st Movement': 'Symphony_No.5,_Op.67_(Beethoven,_Ludwig_van)',
  'Für Elise': 'Für_Elise,_WoO_59_(Beethoven,_Ludwig_van)',
  'Eine kleine Nachtmusik - 1st Movement': 'Serenade_No.13_in_G_major,_K.525_(Mozart,_Wolfgang_Amadeus)',
  'Symphony No. 40 in G minor - 1st Movement': 'Symphony_No.40_in_G_minor,_K.550_(Mozart,_Wolfgang_Amadeus)',
  'The Four Seasons: Spring - 1st Movement': 'The_Four_Seasons_(Vivaldi,_Antonio)',
  'The Four Seasons: Winter - 1st Movement': 'The_Four_Seasons_(Vivaldi,_Antonio)',
  'Toccata and Fugue in D minor, BWV 565': 'Toccata_and_Fugue_in_D_minor,_BWV_565_(Bach,_Johann_Sebastian)',
  'Cello Suite No. 1 in G major - Prelude': 'Cello_Suite_No.1_in_G_major,_BWV_1007_(Bach,_Johann_Sebastian)',
  'Canon in D': 'Canon_and_Gigue_in_D_major,_P.37_(Pachelbel,_Johann)',
  'Ride of the Valkyries': 'Die_Walküre,_WWV_86B_(Wagner,_Richard)',
  'The Blue Danube Waltz': 'An_der_schönen_blauen_Donau,_Op.314_(Strauss_Jr.,_Johann)',
  'Hungarian Rhapsody No. 2': 'Hungarian_Rhapsody_No.2,_S.244/2_(Liszt,_Franz)',
  'Piano Sonata No. 14 \'Moonlight\' - 1st Movement': 'Piano_Sonata_No.14,_Op.27_No.2_(Beethoven,_Ludwig_van)',
  'Symphony No. 9 \'Ode to Joy\' - 4th Movement (excerpt)': 'Symphony_No.9,_Op.125_(Beethoven,_Ludwig_van)',
  'In the Hall of the Mountain King': 'Peer_Gynt,_Op.23_(Grieg,_Edvard)',
  'Morning Mood (Peer Gynt)': 'Peer_Gynt,_Op.23_(Grieg,_Edvard)',
  'Swan Lake - Scene': 'Swan_Lake,_Op.20_(Tchaikovsky,_Pyotr)',
  'The Nutcracker - Dance of the Sugar Plum Fairy': 'The_Nutcracker,_Op.71_(Tchaikovsky,_Pyotr)',
  '1812 Overture (finale)': '1812_Overture,_Op.49_(Tchaikovsky,_Pyotr)',
  'Piano Concerto No. 1 - Opening': 'Piano_Concerto_No.1,_Op.23_(Tchaikovsky,_Pyotr)',
  'Nocturne in E-flat major, Op. 9 No. 2': 'Nocturnes,_Op.9_(Chopin,_Frédéric)',
  'Minute Waltz (Waltz in D-flat major, Op. 64 No. 1)': 'Waltzes,_Op.64_(Chopin,_Frédéric)',
  'Clair de Lune': 'Suite_bergamasque,_L.75_(Debussy,_Claude)',
  'Prélude à l\'après-midi d\'un faune': 'Prélude_à_l\'après-midi_d\'un_faune,_L.86_(Debussy,_Claude)',
  'Boléro': 'Boléro_(Ravel,_Maurice)',
  'William Tell Overture (Finale)': 'Guillaume_Tell_(Rossini,_Gioachino)',
  'The Barber of Seville Overture': 'Il_barbiere_di_Siviglia_(Rossini,_Gioachino)',
  'Habanera (Carmen)': 'Carmen_(Bizet,_Georges)',
  'Also sprach Zarathustra (Opening)': 'Also_sprach_Zarathustra,_Op.30_(Strauss,_Richard)',
  'Ave Maria': 'Ellens_dritter_Gesang,_D.839_(Schubert,_Franz)',
  'Symphony No. 8 \'Unfinished\' - 1st Movement': 'Symphony_No.8,_D.759_(Schubert,_Franz)',
  'Piano Concerto No. 2 - 1st Movement': 'Piano_Concerto_No.2,_Op.18_(Rachmaninoff,_Sergei)',
  'Symphony No. 5 - 2nd Movement (Adagio)': 'Symphony_No.5_(Mahler,_Gustav)',
  'The Planets: Mars, the Bringer of War': 'The_Planets,_Op.32_(Holst,_Gustav)',
  'The Planets: Jupiter, the Bringer of Jollity': 'The_Planets,_Op.32_(Holst,_Gustav)',
  'Siegfried\'s Death and Funeral March (Götterdämmerung)': 'Götterdämmerung,_WWV_86D_(Wagner,_Richard)',
  'Requiem: Dies Irae': 'Messa_da_Requiem_(Verdi,_Giuseppe)',
  'La donna è mobile (Rigoletto)': 'Rigoletto_(Verdi,_Giuseppe)',
  'Nessun dorma (Turandot)': 'Turandot_(Puccini,_Giacomo)',
  'Air on the G String': 'Orchestral_Suite_No.3_in_D_major,_BWV_1068_(Bach,_Johann_Sebastian)',
  'Brandenburg Concerto No. 3 - 1st Movement': 'Brandenburg_Concerto_No.3_in_G_major,_BWV_1048_(Bach,_Johann_Sebastian)',
  'Hallelujah Chorus (Messiah)': 'Messiah,_HWV_56_(Handel,_George_Frideric)',
  'Water Music Suite - Hornpipe': 'Water_Music,_HWV_348-350_(Handel,_George_Frideric)',
  'Hungarian Dance No. 5': 'Hungarian_Dances_(Brahms,_Johannes)',
  'Symphony No. 9 \'From the New World\' - 2nd Movement (Largo)': 'Symphony_No.9,_Op.95_(Dvořák,_Antonín)',
  'The Sorcerer\'s Apprentice': 'L\'Apprenti_sorcier_(Dukas,_Paul)',
  'The Moldau (Vltava)': 'Vltava,_JB_1:112/2_(Smetana,_Bedřich)',
  'The Bartered Bride - Overture': 'Prodaná_nevěsta_(Smetana,_Bedřich)',
  'Peter and the Wolf - Opening': 'Peter_and_the_Wolf,_Op.67_(Prokofiev,_Sergei)',
  'Romeo and Juliet - Dance of the Knights': 'Romeo_and_Juliet,_Op.64_(Prokofiev,_Sergei)'
};

// Current year for copyright calculation
const CURRENT_YEAR = 2026;
const PUBLIC_DOMAIN_THRESHOLD = 70; // Years after death

function isComposerPublicDomain(composer) {
  const deathYear = composerDeathYears[composer];
  if (!deathYear) return null; // Unknown
  return (CURRENT_YEAR - deathYear) >= PUBLIC_DOMAIN_THRESHOLD;
}

function generateSearchQuery(piece) {
  // Create a search-friendly query
  const title = piece.title
    .replace(/['']/g, "'")
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const composer = piece.composer.split(' ').pop(); // Use last name
  return `${title} ${composer}`;
}

function getDirectImslpUrl(piece) {
  const pageName = imslpPageNames[piece.title];
  if (pageName) {
    return `${IMSLP_WIKI_URL}${pageName}`;
  }
  return null;
}

function getSearchUrl(piece) {
  const query = encodeURIComponent(generateSearchQuery(piece));
  return `${IMSLP_SEARCH_URL}${query}`;
}

async function checkImslpAvailability(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ClassicalMusicQuizChecker/1.0)'
      }
    });

    if (!response.ok) return { available: false, status: response.status };

    const html = await response.text();

    // Check if page exists and has recordings
    const hasRecordings = html.includes('Recordings') ||
                          html.includes('Audio files') ||
                          html.includes('.mp3') ||
                          html.includes('.ogg') ||
                          html.includes('.flac');

    const isSearchResults = html.includes('Search results');
    const hasResults = !html.includes('There were no results');

    return {
      available: hasRecordings || (isSearchResults && hasResults),
      hasRecordings,
      isSearchPage: isSearchResults,
      hasResults
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldCheck = args.includes('--check');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           IMSLP EQUIVALENT CHECKER FOR CLASSICAL MUSIC           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Checking ${pieces.length} pieces...`);
  console.log('');

  const results = [];
  let publicDomainCount = 0;
  let uncertainCount = 0;
  let notPublicDomainCount = 0;

  for (const piece of pieces) {
    const pdStatus = isComposerPublicDomain(piece.composer);
    const directUrl = getDirectImslpUrl(piece);
    const searchUrl = getSearchUrl(piece);
    const deathYear = composerDeathYears[piece.composer] || 'Unknown';

    let status = '';
    let statusEmoji = '';

    if (pdStatus === true) {
      status = 'PUBLIC DOMAIN';
      statusEmoji = '✅';
      publicDomainCount++;
    } else if (pdStatus === false) {
      status = 'NOT PUBLIC DOMAIN (copyright)';
      statusEmoji = '⚠️';
      notPublicDomainCount++;
    } else {
      status = 'UNKNOWN';
      statusEmoji = '❓';
      uncertainCount++;
    }

    const result = {
      id: piece.id,
      title: piece.title,
      composer: piece.composer,
      composerDeathYear: deathYear,
      publicDomainStatus: status,
      imslpDirectUrl: directUrl,
      imslpSearchUrl: searchUrl,
      currentAudioUrl: piece.audio_url
    };

    console.log(`${statusEmoji} [${piece.id.toString().padStart(2, '0')}] ${piece.title}`);
    console.log(`      Composer: ${piece.composer} (d. ${deathYear})`);
    console.log(`      Status: ${status}`);
    if (directUrl) {
      console.log(`      Direct IMSLP: ${directUrl}`);
    }
    console.log(`      Search IMSLP: ${searchUrl}`);

    if (shouldCheck) {
      console.log('      Checking IMSLP...');
      const checkUrl = directUrl || searchUrl;
      const availability = await checkImslpAvailability(checkUrl);
      result.imslpCheck = availability;

      if (availability.available) {
        console.log(`      ✓ Found on IMSLP (${availability.hasRecordings ? 'has recordings' : 'search results found'})`);
      } else {
        console.log(`      ✗ Not found or no recordings (${availability.error || 'no matches'})`);
      }

      // Be nice to IMSLP servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('');
    results.push(result);
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                              SUMMARY                               ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Total pieces: ${pieces.length}`);
  console.log(`✅ Public domain composers (died 70+ years ago): ${publicDomainCount}`);
  console.log(`⚠️  Still under copyright (need to verify recordings): ${notPublicDomainCount}`);
  console.log(`❓ Unknown death year: ${uncertainCount}`);
  console.log('');

  // List composers that may have copyright issues
  const copyrightConcerns = pieces
    .filter(p => isComposerPublicDomain(p.composer) === false)
    .reduce((acc, p) => {
      if (!acc[p.composer]) acc[p.composer] = [];
      acc[p.composer].push(p.title);
      return acc;
    }, {});

  if (Object.keys(copyrightConcerns).length > 0) {
    console.log('⚠️  COMPOSERS WITH POTENTIAL COPYRIGHT CONCERNS:');
    console.log('   (Works are public domain but RECORDINGS may still be copyrighted)');
    console.log('');
    for (const [composer, titles] of Object.entries(copyrightConcerns)) {
      const deathYear = composerDeathYears[composer];
      console.log(`   ${composer} (d. ${deathYear})`);
      for (const title of titles) {
        console.log(`      • ${title}`);
      }
    }
    console.log('');
  }

  console.log('NOTE: Even for public domain compositions, recordings themselves');
  console.log('may be copyrighted. IMSLP hosts recordings that are either:');
  console.log('  1. Public domain (old recordings)');
  console.log('  2. Creative Commons licensed');
  console.log('  3. Contributed under specific licenses');
  console.log('');
  console.log('Always check the specific recording\'s license on IMSLP before using.');

  if (outputFile) {
    const outputPath = path.resolve(outputFile);
    writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log('');
    console.log(`Results saved to: ${outputPath}`);
  }

  return results;
}

main().catch(console.error);
