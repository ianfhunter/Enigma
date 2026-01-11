#!/usr/bin/env node
/**
 * Script to download famous paintings from Wikipedia Commons
 * and update the JSON to use local paths
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PAINTINGS_JSON = path.join(__dirname, '../src/data/trivia_datasets/famous_paintings.json');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/paintings');

// Read the paintings data
const paintings = JSON.parse(fs.readFileSync(PAINTINGS_JSON, 'utf8'));

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sanitize filename
function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

// Download a file with redirect handling
function downloadFile(url, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://commons.wikimedia.org/',
        'Origin': 'https://commons.wikimedia.org'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        downloadFile(redirectUrl, destPath, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Delete partial file
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Get file extension from URL
function getExtension(url) {
  const match = url.match(/\.(jpe?g|png|gif|webp)/i);
  return match ? match[0].toLowerCase() : '.jpg';
}

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Download with retries
async function downloadWithRetry(url, destPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await downloadFile(url, destPath);
      return true;
    } catch (err) {
      if (err.message.includes('429') && attempt < maxRetries) {
        // Rate limited - wait longer
        const waitTime = attempt * 5000;
        process.stdout.write(`(rate limited, waiting ${waitTime/1000}s)... `);
        await sleep(waitTime);
      } else if (attempt < maxRetries) {
        await sleep(1000);
      } else {
        throw err;
      }
    }
  }
}

async function downloadAllPaintings() {
  console.log(`Found ${paintings.length} paintings to download`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const results = [];
  const errors = [];

  for (let i = 0; i < paintings.length; i++) {
    const painting = paintings[i];
    const filename = sanitizeFilename(painting.title) + getExtension(painting.image_url);
    const destPath = path.join(OUTPUT_DIR, filename);

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath);
      if (stats.size > 1000) { // File seems valid (> 1KB)
        console.log(`[${i + 1}/${paintings.length}] ✓ Already exists: ${painting.title}`);
        results.push({ painting, filename, success: true });
        continue;
      }
    }

    process.stdout.write(`[${i + 1}/${paintings.length}] Downloading: ${painting.title}... `);

    try {
      await downloadWithRetry(painting.image_url, destPath);

      // Verify file was downloaded properly
      const stats = fs.statSync(destPath);
      if (stats.size < 1000) {
        throw new Error('File too small, likely an error page');
      }

      console.log('✓');
      results.push({ painting, filename, success: true });
    } catch (err) {
      console.log(`✗ (${err.message})`);
      errors.push({ painting, error: err.message });
      results.push({ painting, filename, success: false });
    }

    // Longer delay between requests to avoid rate limiting
    await sleep(1500);
  }

  // Generate updated JSON with local paths
  const updatedPaintings = paintings.map((painting, i) => {
    const result = results[i];
    if (result && result.success) {
      return {
        ...painting,
        image_url: `/src/assets/paintings/${result.filename}`,
        original_url: painting.image_url
      };
    }
    return painting;
  });

  // Write updated JSON
  const outputJsonPath = path.join(__dirname, '../src/data/trivia_datasets/famous_paintings_local.json');
  fs.writeFileSync(outputJsonPath, JSON.stringify(updatedPaintings, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Successfully downloaded: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nFailed downloads:');
    errors.forEach(e => {
      console.log(`  - ${e.painting.title}: ${e.error}`);
    });
  }

  console.log(`\nUpdated JSON written to: ${outputJsonPath}`);
}

downloadAllPaintings().catch(console.error);
