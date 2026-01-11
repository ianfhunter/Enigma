#!/usr/bin/env node
/**
 * Generate updated JSON with local paths for downloaded paintings
 */

const fs = require('fs');
const path = require('path');

const PAINTINGS_JSON = path.join(__dirname, '../src/data/trivia_datasets/famous_paintings.json');
const OUTPUT_JSON = path.join(__dirname, '../src/data/trivia_datasets/famous_paintings.json');
const PAINTINGS_DIR = path.join(__dirname, '../src/assets/paintings');

// Read the paintings data
const paintings = JSON.parse(fs.readFileSync(PAINTINGS_JSON, 'utf8'));

// Get list of downloaded files
const downloadedFiles = fs.readdirSync(PAINTINGS_DIR).filter(f =>
  f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
);

console.log(`Found ${downloadedFiles.length} downloaded images`);
console.log(`Processing ${paintings.length} paintings\n`);

// Normalize a string for comparison
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

// Find best matching file for a title
function findMatchingFile(title) {
  const normalizedTitle = normalize(title);

  // Exact match first
  for (const file of downloadedFiles) {
    const normalizedFile = normalize(file.replace(/\.(jpg|jpeg|png)$/i, ''));
    if (normalizedFile === normalizedTitle) {
      return file;
    }
  }

  // Partial match (title starts with file prefix)
  for (const file of downloadedFiles) {
    const normalizedFile = normalize(file.replace(/\.(jpg|jpeg|png)$/i, ''));
    if (normalizedFile.startsWith(normalizedTitle.substring(0, 15)) ||
        normalizedTitle.startsWith(normalizedFile.substring(0, 15))) {
      return file;
    }
  }

  // Contains key words
  const titleWords = normalizedTitle.split('_').filter(w => w.length > 3);
  for (const file of downloadedFiles) {
    const normalizedFile = normalize(file.replace(/\.(jpg|jpeg|png)$/i, ''));
    const matchCount = titleWords.filter(word => normalizedFile.includes(word)).length;
    if (matchCount >= 2 || (titleWords.length === 1 && matchCount === 1)) {
      return file;
    }
  }

  return null;
}

let localCount = 0;
let remoteCount = 0;

// Update paintings with local paths where available
const updatedPaintings = paintings.map(painting => {
  // First check if already has local_image
  if (painting.local_image && downloadedFiles.includes(painting.local_image)) {
    localCount++;
    return painting;
  }

  // Try to find matching file
  const matchingFile = findMatchingFile(painting.title);

  if (matchingFile) {
    localCount++;
    return {
      ...painting,
      local_image: matchingFile,
      original_url: painting.original_url || painting.image_url
    };
  } else {
    remoteCount++;
    // Remove local_image if file doesn't exist
    const { local_image, ...rest } = painting;
    return rest;
  }
});

console.log(`Local images found: ${localCount}`);
console.log(`Remote fallback: ${remoteCount}`);

// Write updated JSON
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(updatedPaintings, null, 2));
console.log(`\nUpdated ${OUTPUT_JSON}`);

// List paintings without local images
const missing = updatedPaintings.filter(p => !p.local_image);
if (missing.length > 0) {
  console.log('\nPaintings still using remote URLs:');
  missing.forEach(p => console.log(`  - ${p.title}`));
}
