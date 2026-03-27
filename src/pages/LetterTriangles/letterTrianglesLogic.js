import { createSeededRandom, seededShuffleArray, getWordsByLength, isCommonWord } from '../../data/wordUtils';

export const CELL_COUNT = 9;
export const CORNERS = ['A', 'B', 'C'];

export const LINE_DEFINITIONS = [
  [{ cell: 0, corner: 'A' }],
  [{ cell: 0, corner: 'B' }, { cell: 0, corner: 'C' }],
  [{ cell: 1, corner: 'A' }, { cell: 2, corner: 'B' }, { cell: 2, corner: 'C' }, { cell: 3, corner: 'A' }],
  [{ cell: 1, corner: 'B' }, { cell: 1, corner: 'C' }, { cell: 2, corner: 'A' }, { cell: 3, corner: 'B' }, { cell: 3, corner: 'C' }],
  [{ cell: 4, corner: 'A' }, { cell: 5, corner: 'B' }, { cell: 5, corner: 'C' }, { cell: 6, corner: 'A' }, { cell: 7, corner: 'B' }, { cell: 7, corner: 'C' }, { cell: 8, corner: 'A' }],
  [{ cell: 4, corner: 'B' }, { cell: 4, corner: 'C' }, { cell: 5, corner: 'A' }, { cell: 6, corner: 'B' }, { cell: 6, corner: 'C' }, { cell: 7, corner: 'A' }, { cell: 8, corner: 'B' }, { cell: 8, corner: 'C' }],
];

const ONE_LETTER_WORDS = ['A', 'I'];
const COMMON_TWO_LETTER_WORDS = [
  'AM', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IN', 'IS', 'IT', 'ME', 'MY',
  'NO', 'OF', 'ON', 'OR', 'OX', 'SO', 'TO', 'UP', 'US', 'WE'
];

const WORD_POOL_CACHE = new Map();
const DOWN_CELLS = new Set([2, 5, 7]);

function slotKey(cell, corner) {
  return `${cell}:${corner}`;
}

function getWordPool(length) {
  if (WORD_POOL_CACHE.has(length)) return WORD_POOL_CACHE.get(length);

  let words;
  if (length === 1) words = ONE_LETTER_WORDS;
  else if (length === 2) words = COMMON_TWO_LETTER_WORDS;
  else {
    words = getWordsByLength(length)
      .map((word) => word.toUpperCase())
      .filter((word) => /^[A-Z]+$/.test(word));
  }

  WORD_POOL_CACHE.set(length, words);
  return words;
}

function compatibleWithPattern(word, pattern) {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] && pattern[i] !== word[i]) return false;
  }
  return true;
}

export function isDownCell(cell) {
  return DOWN_CELLS.has(cell);
}

export function getPhysicalCorner(cell, displayCorner) {
  if (!isDownCell(cell)) return displayCorner;
  if (displayCorner === 'B') return 'C';
  if (displayCorner === 'C') return 'B';
  return displayCorner;
}

export function getRotatedCornerIndex(displayCorner, rotation = 0) {
  const displayIndex = CORNERS.indexOf(displayCorner);
  const normalized = ((rotation % 3) + 3) % 3;
  return (displayIndex - normalized + 3) % 3;
}

export function getTileLetterForLine(tile, displayCorner, rotation = 0, cellIndex = null) {
  const effectiveCorner = cellIndex === null ? displayCorner : getPhysicalCorner(cellIndex, displayCorner);
  const cornerIndex = getRotatedCornerIndex(effectiveCorner, rotation);
  return tile?.letters[cornerIndex] ?? '_';
}

function generateAttempt(seed, preferCommon) {
  const random = createSeededRandom(seed);
  const pools = LINE_DEFINITIONS.map((line) => seededShuffleArray([...getWordPool(line.length)], random));

  const assignedSlots = new Map();
  const usedWords = new Set();
  const chosenWords = [];

  for (let lineIndex = 0; lineIndex < LINE_DEFINITIONS.length; lineIndex++) {
    const line = LINE_DEFINITIONS[lineIndex];
    const pattern = line.map(({ cell, corner }) => assignedSlots.get(slotKey(cell, getPhysicalCorner(cell, corner))) || null);

    const matching = [];
    const matchingCommon = [];

    for (const word of pools[lineIndex]) {
      if (usedWords.has(word) || !compatibleWithPattern(word, pattern)) continue;
      matching.push(word);
      if (word.length <= 2 || isCommonWord(word)) matchingCommon.push(word);
      if (matching.length >= 1200) break;
    }

    const candidatePool = preferCommon && matchingCommon.length > 0 ? matchingCommon : matching;
    if (candidatePool.length === 0) return null;

    const chosen = candidatePool[Math.floor(random() * candidatePool.length)];
    chosenWords.push(chosen);
    usedWords.add(chosen);

    for (let i = 0; i < line.length; i++) {
      const key = slotKey(line[i].cell, getPhysicalCorner(line[i].cell, line[i].corner));
      if (!assignedSlots.has(key)) assignedSlots.set(key, chosen[i]);
    }
  }

  const solvedTiles = Array.from({ length: CELL_COUNT }, (_, cell) => ({
    id: cell,
    letters: CORNERS.map((corner) => assignedSlots.get(slotKey(cell, corner))),
  }));

  const initialRotations = {};
  for (const tile of solvedTiles) {
    initialRotations[tile.id] = Math.floor(random() * 3);
  }

  return {
    targetWords: chosenWords,
    solvedTiles,
    shuffledTiles: seededShuffleArray([...solvedTiles], random),
    initialRotations,
  };
}

export function generateLetterTrianglesPuzzle(seed) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const generated = generateAttempt(seed + attempt * 7919, true);
    if (generated) return { seed, ...generated };
  }

  for (let attempt = 0; attempt < 120; attempt++) {
    const generated = generateAttempt(seed + 500000 + attempt * 1543, false);
    if (generated) return { seed, ...generated };
  }

  throw new Error('Failed to generate Letter Triangles puzzle using valid words');
}

export function buildLineWordsFromPlacement(placement, tileById, rotations = {}) {
  return LINE_DEFINITIONS.map((line) => line.map(({ cell, corner }) => {
    const tileId = placement[cell];
    if (tileId === null || tileId === undefined) return '_';
    const tile = tileById.get(tileId);
    const rotation = rotations[tileId] ?? 0;
    return getTileLetterForLine(tile, corner, rotation, cell);
  }).join(''));
}

export function isSolvedPlacement(placement, rotations = {}) {
  return placement.every((tileId, cellIndex) => tileId === cellIndex && ((rotations[tileId] ?? 0) % 3) === 0);
}
