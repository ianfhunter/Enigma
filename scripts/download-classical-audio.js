#!/usr/bin/env node
/**
 * Downloads public domain classical music recordings from Wikimedia Commons
 * for the Classical Music Quiz game.
 *
 * Usage: node scripts/download-classical-audio.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/audio/classical');

// Wikimedia Commons URLs for public domain classical recordings
// These are excerpts/clips suitable for the quiz (typically 30-60 seconds)
const AUDIO_SOURCES = [
  // 01 - Beethoven Symphony No. 5
  { file: '01.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven_Symphony_5_mov_1.ogg', convert: true },
  // 02 - Für Elise
  { file: '02.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Fur_Elise.ogg' },
  // 03 - Eine kleine Nachtmusik
  { file: '03.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg' },
  // 04 - Mozart Symphony No. 40
  { file: '04.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Mozart_Symphony_40_g_moll.ogg' },
  // 05 - Vivaldi Four Seasons Spring
  { file: '05.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/JOHN_MICHEL_CELLO-Four_Seasons_Spring.ogg' },
  // 06 - Vivaldi Four Seasons Winter
  { file: '06.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Vivaldi_-_Four_Seasons_4_Winter_mvt_1_Allegro_non_molto_-_John_Harrison_violin.ogg' },
  // 07 - Bach Toccata and Fugue
  { file: '07.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Toccata_and_Fugue_in_D_minor%2C_BWV_565_-_2._Fugue.ogg', convert: true },
  // 08 - Bach Cello Suite No. 1
  { file: '08.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Johann_Sebastian_Bach_-_Cello_Suite_No._1_in_G_major%2C_BWV_1007_-_I._Prelude.ogg' },
  // 09 - Pachelbel Canon in D
  { file: '09.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Pachelbel%27s_Canon.ogg' },
  // 10 - Wagner Ride of the Valkyries
  { file: '10.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Richard_Wagner_-_Erta_Atto_III_cavalcata_delle_valchirie.ogg' },
  // 11 - Strauss Blue Danube
  { file: '11.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Johann_Strauss_II_-_The_Blue_Danube_Waltz.ogg' },
  // 12 - Liszt Hungarian Rhapsody No. 2
  { file: '12.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Liszt_-_Hungarian_Rhapsody_No._2.ogg', convert: true },
  // 13 - Beethoven Moonlight Sonata
  { file: '13.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_%27moonlight%27%2C_op._27_no._2_-_i._adagio_sostenuto.ogg', convert: true },
  // 14 - Beethoven Symphony No. 9 Ode to Joy
  { file: '14.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Beethoven_9_Finale_-_Ode_an_die_Freude.ogg' },
  // 15 - Grieg In the Hall of the Mountain King
  { file: '15.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Grieg_-_In_the_Hall_of_the_Mountain_King.ogg' },
  // 16 - Grieg Morning Mood
  { file: '16.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Grieg_-_Morning_Mood.ogg', convert: true },
  // 17 - Tchaikovsky Swan Lake
  { file: '17.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Pyotr_Ilyich_Tchaikovsky_-_Swan_Lake.ogg', convert: true },
  // 18 - Tchaikovsky Dance of the Sugar Plum Fairy
  { file: '18.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Dance_of_the_Sugar_Plum_Fairy.ogg' },
  // 19 - Tchaikovsky 1812 Overture
  { file: '19.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Tchaikovsky-1812-overture-finale.ogg', convert: true },
  // 20 - Tchaikovsky Piano Concerto No. 1
  { file: '20.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Tchaikovsky_-_Piano_Concerto_No_1_in_Bb_minor%2C_Op_23_-_I_-_Allegro_non_troppo_e_molto_maestoso.ogg', convert: true },
  // 21 - Chopin Nocturne Op. 9 No. 2
  { file: '21.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Frederic_Chopin_-_Nocturne_in_E-flat_major%2C_Op._9%2C_No._2.ogg', convert: true },
  // 22 - Chopin Minute Waltz
  { file: '22.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Chopin_-_Minute_Waltz.ogg', convert: true },
  // 23 - Debussy Clair de Lune
  { file: '23.ogg', url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Debussy_-_Clair_de_Lune.ogg' },
  // 24 - Debussy Prelude to the Afternoon of a Faun
  { file: '24.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Debussy_-_Prelude_to_the_Afternoon_of_a_Faun.ogg', convert: true },
  // 25 - Ravel Bolero
  { file: '25.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Bolero_Ravel.ogg', convert: true },
  // 26 - Rossini William Tell Overture
  { file: '26.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Rossini_William_Tell_Overture_finale.ogg', convert: true },
  // 27 - Rossini Barber of Seville Overture
  { file: '27.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Overture_to_The_Barber_of_Seville.ogg', convert: true },
  // 28 - Bizet Habanera (Carmen)
  { file: '28.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Bizet_-_Habanera_%28Carmen%29.ogg', convert: true },
  // 29 - R. Strauss Also sprach Zarathustra
  { file: '29.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Richard_Strauss_-_Also_sprach_Zarathustra.ogg', convert: true },
  // 30 - Schubert Ave Maria
  { file: '30.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Schubert_-_Ave_Maria.ogg', convert: true },
  // 31 - Schubert Symphony No. 8 Unfinished
  { file: '31.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Schubert_-_Symphony_No._8_%28Unfinished%29_-_I._Allegro_moderato.ogg', convert: true },
  // 32 - Rachmaninoff Piano Concerto No. 2
  { file: '32.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Rachmaninoff_-_Piano_Concerto_No_2_Op_18_-_I._Moderato.ogg', convert: true },
  // 33 - Mahler Symphony No. 5 Adagietto
  { file: '33.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Mahler_5th_symphony_Adagietto.ogg', convert: true },
  // 34 - Holst The Planets: Mars
  { file: '34.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Holst-_The_Planets-_Mars%2C_the_Bringer_of_War.ogg', convert: true },
  // 35 - Holst The Planets: Jupiter
  { file: '35.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Holst-_The_Planets-_Jupiter%2C_The_Bringer_Of_Jollity.ogg', convert: true },
  // 36 - Orff Carmina Burana: O Fortuna
  { file: '36.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Carl_Orff_-_Carmina_Burana_-_O_Fortuna.ogg', convert: true },
  // 37 - Verdi Requiem: Dies Irae
  { file: '37.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Verdi_-_Requiem_-_Dies_Irae.ogg', convert: true },
  // 38 - Verdi La donna è mobile
  { file: '38.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/La_donna_%C3%A8_mobile.ogg', convert: true },
  // 39 - Puccini Nessun dorma
  { file: '39.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Turandot_-_Nessun_dorma.ogg', convert: true },
  // 40 - Bach Air on the G String
  { file: '40.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Johann_Sebastian_Bach_-_Air.ogg', convert: true },
  // 41 - Bach Brandenburg Concerto No. 3
  { file: '41.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Bach_Brandenburg_Concerto_3_1_Allegro.ogg', convert: true },
  // 42 - Handel Hallelujah Chorus
  { file: '42.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Handel_-_messiah_-_44_hallelujah.ogg', convert: true },
  // 43 - Handel Water Music Hornpipe
  { file: '43.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Handel_-_water_music_-_hornpipe.ogg', convert: true },
  // 44 - Brahms Hungarian Dance No. 5
  { file: '44.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Brahms_-_Hungarian_Dance_No._5.ogg', convert: true },
  // 45 - Dvorak Symphony No. 9 Largo
  { file: '45.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Dvorak_-_New_World_Symphony_-_2._Largo.ogg', convert: true },
  // 46 - Dukas The Sorcerer's Apprentice
  { file: '46.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Dukas_-_The_Sorcerer%27s_Apprentice.ogg', convert: true },
  // 47 - Stravinsky The Rite of Spring
  { file: '47.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Stravinsky_Rite_of_Spring_Introduction.ogg', convert: true },
  // 48 - Stravinsky Firebird Finale
  { file: '48.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Stravinsky_-_Firebird_Suite_-_Finale.ogg', convert: true },
  // 49 - Prokofiev Peter and the Wolf
  { file: '49.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Prokofiev_-_Peter_and_the_Wolf.ogg', convert: true },
  // 50 - Prokofiev Romeo and Juliet: Dance of the Knights
  { file: '50.mp3', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Prokofiev_-_Dance_of_the_Knights.ogg', convert: true },
];

// Helper to download a file
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = (currentUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      protocol.get(currentUrl, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location, redirectCount + 1);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      }).on('error', reject);
    };

    request(url);
  });
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎵 Downloading classical music audio files...\n');

  let downloaded = 0;
  let failed = 0;
  const failures = [];

  for (const source of AUDIO_SOURCES) {
    const outputPath = path.join(OUTPUT_DIR, source.file);
    const tempPath = outputPath.replace(/\.(mp3|ogg)$/, '.ogg'); // Most Wikimedia files are OGG

    process.stdout.write(`  Downloading ${source.file}... `);

    try {
      // Download to temp path if converting, otherwise direct
      const downloadPath = source.convert ? tempPath : outputPath;

      // If we need .mp3 but source is .ogg, just save as .ogg for now
      // (browsers can play OGG, and we can convert later if needed)
      // For simplicity, save all as the target extension
      await downloadFile(source.url, outputPath.replace(/\.mp3$/, '.ogg'));

      downloaded++;
      console.log('✓');
    } catch (err) {
      failed++;
      failures.push({ file: source.file, error: err.message });
      console.log(`✗ (${err.message})`);
    }
  }

  console.log(`\n📊 Results: ${downloaded} downloaded, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\n❌ Failed downloads:');
    failures.forEach(f => console.log(`   ${f.file}: ${f.error}`));
  }

  console.log('\n✅ Done! Audio files saved to public/audio/classical/');
  console.log('Note: Some .mp3 files are saved as .ogg - update the dataset if needed.');
}

main().catch(console.error);
