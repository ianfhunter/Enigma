#!/usr/bin/env node
/**
 * Find current Wikipedia Commons URLs and download missing paintings
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PAINTINGS_DIR = path.join(__dirname, '../src/assets/paintings');

// Paintings to search for with their expected filenames
const MISSING_PAINTINGS = [
  { title: 'The Sleeping Gypsy', search: 'La Bohémienne endormie Rousseau', filename: 'the_sleeping_gypsy.jpg' },
  { title: 'The Hay Wain', search: 'John Constable Hay Wain', filename: 'the_hay_wain.jpg' },
  { title: 'Dance at Le Moulin', search: 'Renoir Dance Moulin Galette', filename: 'dance_at_le_moulin_de_la_galette.jpg' },
  { title: 'Le Déjeuner sur lherbe', search: 'Manet Déjeuner herbe', filename: 'le_dejeuner_sur_l_herbe.jpg' },
  { title: 'Composition VIII', search: 'Kandinsky Composition VIII 1923', filename: 'composition_viii.jpg' },
  { title: 'Dogs Playing Poker', search: 'Coolidge Friend Need poker', filename: 'dogs_playing_poker.jpg' },
  { title: 'The Thinker', search: 'Rodin Thinker sculpture', filename: 'the_thinker.jpg' },
  { title: 'David', search: 'Michelangelo David sculpture Florence', filename: 'david.jpg' },
  { title: 'Venus de Milo', search: 'Venus Milo Louvre', filename: 'venus_de_milo.jpg' },
  { title: 'Rain Steam Speed', search: 'Turner Rain Steam Speed', filename: 'rain_steam_and_speed.jpg' },
  { title: 'Water Lilies Japanese Bridge', search: 'Monet Water Lilies Japanese Bridge', filename: 'water_lilies_and_japanese_bridge.jpg' },
  { title: 'The Ballet Class', search: 'Degas Ballet Class', filename: 'the_ballet_class.jpg' },
  { title: 'Girl with Red Hat', search: 'Vermeer Girl Red Hat', filename: 'the_girl_with_the_red_hat.jpg' },
  { title: 'The Card Players', search: 'Cézanne Card Players', filename: 'the_card_players.jpg' },
  { title: 'Mont Sainte-Victoire', search: 'Cézanne Mont Sainte-Victoire', filename: 'mont_sainte_victoire.jpg' },
  { title: 'Where Do We Come From', search: 'Gauguin Where Come From', filename: 'where_do_we_come_from.jpg' },
  { title: 'Two Tahitian Women', search: 'Gauguin Deux Tahitiennes', filename: 'two_tahitian_women.jpg' },
  { title: 'At the Moulin Rouge', search: 'Toulouse-Lautrec Moulin Rouge', filename: 'at_the_moulin_rouge.jpg' },
  { title: 'The Dance Matisse', search: 'Matisse Dance 1910', filename: 'the_dance.jpg' },
  { title: 'The Red Studio', search: 'Matisse Red Studio', filename: 'the_red_studio.jpg' },
  { title: 'The Snail', search: 'Matisse Snail 1953', filename: 'the_snail.jpg' },
  { title: 'The Two Fridas', search: 'Kahlo Two Fridas', filename: 'the_two_fridas.jpg' },
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PaintingsDownloader/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function searchCommons(searchTerm) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=5&format=json`;
  const response = await httpsGet(url);
  return JSON.parse(response.data);
}

async function getImageUrl(pageTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json`;
  const response = await httpsGet(url);
  const data = JSON.parse(response.data);
  const pages = data.query?.pages;
  if (pages) {
    const page = Object.values(pages)[0];
    if (page.imageinfo && page.imageinfo[0]) {
      return page.imageinfo[0].thumburl || page.imageinfo[0].url;
    }
  }
  return null;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://commons.wikimedia.org/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Finding and downloading missing paintings from Wikimedia Commons\n');

  for (const painting of MISSING_PAINTINGS) {
    const destPath = path.join(PAINTINGS_DIR, painting.filename);

    // Skip if already exists
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`✓ Already exists: ${painting.title}`);
      continue;
    }

    process.stdout.write(`Searching: ${painting.title}... `);

    try {
      // Search for the image
      const searchResults = await searchCommons(painting.search);
      const results = searchResults.query?.search || [];

      if (results.length === 0) {
        console.log('not found');
        continue;
      }

      // Try to get URL from first few results
      let imageUrl = null;
      for (const result of results.slice(0, 3)) {
        const url = await getImageUrl(result.title);
        if (url) {
          imageUrl = url;
          break;
        }
        await sleep(500);
      }

      if (!imageUrl) {
        console.log('no URL found');
        continue;
      }

      process.stdout.write('downloading... ');
      await downloadFile(imageUrl, destPath);

      // Verify download
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
        console.log('✓');
      } else {
        console.log('✗ (too small)');
        fs.unlinkSync(destPath);
      }

    } catch (err) {
      console.log(`✗ (${err.message})`);
    }

    // Rate limit
    await sleep(2000);
  }

  console.log('\n=== Done ===');
  const files = fs.readdirSync(PAINTINGS_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Total images: ${files.length}`);
}

main().catch(console.error);
