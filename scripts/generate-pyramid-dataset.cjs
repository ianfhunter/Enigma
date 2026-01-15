#!/usr/bin/env node
/**
 * Generate verified solvable puzzles for PyramidCards
 * Outputs a JSON dataset with full deck arrangements (not just seeds)
 *
 * Run with: node scripts/generate-pyramid-dataset.js
 *
 * Output: public/datasets/pyramidCardsPuzzles.json
 */

const fs = require('fs');
const path = require('path');

const CARD_VALUES = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['S', 'H', 'D', 'C']; // Spades, Hearts, Diamonds, Clubs
const SUIT_SYMBOLS = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };

function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seededShuffle(array, rng) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create deck with card codes (e.g., "AS" = Ace of Spades)
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        code: `${rank}${suit}`,
        rank,
        suit,
        value: CARD_VALUES[rank]
      });
    }
  }
  return deck;
}

// Generate puzzle from seed, return deck codes
function generatePuzzleDeck(seed) {
  const rng = createSeededRandom(seed);
  const deck = seededShuffle(createDeck(), rng);
  return deck.map(c => c.code);
}

// Build pyramid and draw pile from deck codes for solving
function buildFromDeck(deckCodes) {
  const deck = deckCodes.map((code, idx) => {
    const rank = code.slice(0, -1);
    const suit = code.slice(-1);
    return {
      code,
      rank,
      suit,
      value: CARD_VALUES[rank],
      removed: false,
      id: idx
    };
  });

  const pyramid = [];
  let cardIndex = 0;
  for (let row = 0; row < 7; row++) {
    pyramid[row] = [];
    for (let col = 0; col <= row; col++) {
      pyramid[row][col] = { ...deck[cardIndex++] };
    }
  }

  const drawPile = deck.slice(28).map(c => ({ ...c }));
  return { pyramid, drawPile };
}

// Check if card is exposed
function isExposed(pyramid, row, col) {
  if (row === 6) return true;
  const leftBelow = pyramid[row + 1]?.[col];
  const rightBelow = pyramid[row + 1]?.[col + 1];
  return (!leftBelow || leftBelow.removed) && (!rightBelow || rightBelow.removed);
}

// Get exposed cards
function getExposedCards(pyramid) {
  const exposed = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col <= row; col++) {
      const card = pyramid[row][col];
      if (!card.removed && isExposed(pyramid, row, col)) {
        exposed.push({ card, row, col });
      }
    }
  }
  return exposed;
}

// Pyramid to bits for memoization
function pyramidToBits(pyramid) {
  let bits = 0;
  let idx = 0;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col <= row; col++) {
      if (!pyramid[row][col].removed) {
        bits |= (1 << idx);
      }
      idx++;
    }
  }
  return bits;
}

function clonePyramid(pyramid) {
  return pyramid.map(row => row.map(card => ({ ...card })));
}

// Solver
function solvePyramid(pyramid, drawPile, wasteIndex = 0, memo = new Map(), depth = 0) {
  if (depth > 100) return false;

  const pyramidBits = pyramidToBits(pyramid);
  const stateKey = `${pyramidBits}:${wasteIndex}`;

  if (memo.has(stateKey)) return memo.get(stateKey);

  // Win condition
  if (pyramidBits === 0) {
    memo.set(stateKey, true);
    return true;
  }

  const exposed = getExposedCards(pyramid);
  if (exposed.length === 0) {
    memo.set(stateKey, false);
    return false;
  }

  // Try removing Kings
  for (const { card, row, col } of exposed) {
    if (card.value === 13) {
      const newPyramid = clonePyramid(pyramid);
      newPyramid[row][col].removed = true;
      if (solvePyramid(newPyramid, drawPile, wasteIndex, memo, depth + 1)) {
        memo.set(stateKey, true);
        return true;
      }
    }
  }

  // Try pairing pyramid cards
  for (let i = 0; i < exposed.length; i++) {
    for (let j = i + 1; j < exposed.length; j++) {
      if (exposed[i].card.value + exposed[j].card.value === 13) {
        const newPyramid = clonePyramid(pyramid);
        newPyramid[exposed[i].row][exposed[i].col].removed = true;
        newPyramid[exposed[j].row][exposed[j].col].removed = true;
        if (solvePyramid(newPyramid, drawPile, wasteIndex, memo, depth + 1)) {
          memo.set(stateKey, true);
          return true;
        }
      }
    }
  }

  // Try pairing with waste card
  if (wasteIndex > 0 && wasteIndex <= drawPile.length) {
    const wasteCard = drawPile[wasteIndex - 1];
    if (!wasteCard.removed) {
      if (wasteCard.value === 13) {
        const newDrawPile = drawPile.map(c => ({ ...c }));
        newDrawPile[wasteIndex - 1].removed = true;
        if (solvePyramid(pyramid, newDrawPile, wasteIndex, memo, depth + 1)) {
          memo.set(stateKey, true);
          return true;
        }
      }

      for (const { card, row, col } of exposed) {
        if (card.value + wasteCard.value === 13) {
          const newPyramid = clonePyramid(pyramid);
          const newDrawPile = drawPile.map(c => ({ ...c }));
          newPyramid[row][col].removed = true;
          newDrawPile[wasteIndex - 1].removed = true;
          if (solvePyramid(newPyramid, newDrawPile, wasteIndex, memo, depth + 1)) {
            memo.set(stateKey, true);
            return true;
          }
        }
      }
    }
  }

  // Try drawing next card
  if (wasteIndex < drawPile.length) {
    if (solvePyramid(pyramid, drawPile, wasteIndex + 1, memo, depth + 1)) {
      memo.set(stateKey, true);
      return true;
    }
  }

  memo.set(stateKey, false);
  return false;
}

// Check if a deck arrangement is solvable
function isSolvable(deckCodes) {
  const { pyramid, drawPile } = buildFromDeck(deckCodes);
  return solvePyramid(pyramid, drawPile, 0, new Map(), 0);
}

// Main generator
async function main() {
  const TARGET_NEW = parseInt(process.argv[2]) || 50;
  const START_SEED = parseInt(process.argv[3]) || 1;
  const MAX_SEED = parseInt(process.argv[4]) || 100000;

  // Output path
  const outputPath = path.join(__dirname, '..', 'public', 'datasets', 'pyramidCardsPuzzles.json');

  // Load existing puzzles to merge
  let existingPuzzles = [];
  let nextId = 1;

  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      existingPuzzles = existing.puzzles || [];
      nextId = existingPuzzles.length + 1;
      console.log(`Loaded ${existingPuzzles.length} existing puzzles`);
    } catch (e) {
      console.log('Could not load existing puzzles, starting fresh');
    }
  }

  console.log(`Finding ${TARGET_NEW} NEW solvable Pyramid puzzles...`);
  console.log(`Starting from seed ${START_SEED}, max ${MAX_SEED}`);
  console.log('');

  const newPuzzles = [];
  let seed = START_SEED;
  let tested = 0;

  while (newPuzzles.length < TARGET_NEW && seed < MAX_SEED) {
    const deckCodes = generatePuzzleDeck(seed);

    if (isSolvable(deckCodes)) {
      newPuzzles.push({
        id: nextId + newPuzzles.length,
        deck: deckCodes
      });
      process.stdout.write(`\rFound ${newPuzzles.length}/${TARGET_NEW} new (tested ${tested}, seed ${seed})`);
    }

    seed++;
    tested++;

    // Yield to event loop occasionally
    if (tested % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  console.log('\n');

  // Merge puzzles
  const allPuzzles = [...existingPuzzles, ...newPuzzles];

  // Write JSON
  const output = {
    name: 'Pyramid Cards Puzzles',
    description: 'Verified solvable Pyramid Solitaire puzzles',
    generated: new Date().toISOString(),
    count: allPuzzles.length,
    puzzles: allPuzzles
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`Added ${newPuzzles.length} new puzzles (total: ${allPuzzles.length})`);
  console.log(`Tested ${tested} seeds (${START_SEED} to ${seed - 1})`);
  console.log(`Success rate: ${((newPuzzles.length / tested) * 100).toFixed(2)}%`);
}

main().catch(console.error);
