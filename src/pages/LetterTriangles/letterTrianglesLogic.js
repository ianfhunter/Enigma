import { createSeededRandom, seededShuffleArray, getWordsByLength } from '../../data/wordUtils';

export const CELL_COUNT = 9;
export const CORNERS = ['A', 'B', 'C'];

export const LINE_DEFINITIONS = [
  [{ cell: 0, corner: 'A' }],
  [{ cell: 0, corner: 'A' }, { cell: 0, corner: 'B' }],
  [{ cell: 0, corner: 'B' }, { cell: 0, corner: 'C' }, { cell: 1, corner: 'A' }],
  [{ cell: 1, corner: 'A' }, { cell: 1, corner: 'B' }, { cell: 1, corner: 'C' }, { cell: 2, corner: 'A' }],
  [{ cell: 2, corner: 'A' }, { cell: 2, corner: 'B' }, { cell: 2, corner: 'C' }, { cell: 3, corner: 'A' }, { cell: 3, corner: 'B' }],
  [{ cell: 3, corner: 'B' }, { cell: 3, corner: 'C' }, { cell: 4, corner: 'A' }, { cell: 4, corner: 'B' }, { cell: 4, corner: 'C' }, { cell: 5, corner: 'A' }],
  [{ cell: 5, corner: 'A' }, { cell: 5, corner: 'B' }, { cell: 5, corner: 'C' }, { cell: 6, corner: 'A' }, { cell: 6, corner: 'B' }, { cell: 6, corner: 'C' }, { cell: 7, corner: 'A' }],
  [{ cell: 7, corner: 'A' }, { cell: 7, corner: 'B' }, { cell: 7, corner: 'C' }, { cell: 8, corner: 'A' }, { cell: 8, corner: 'B' }, { cell: 8, corner: 'C' }, { cell: 0, corner: 'C' }, { cell: 1, corner: 'B' }],
];

const ONE_LETTER_WORDS = ['A', 'I'];
const LETTERS = 'ETAOINSHRDLUCMWFGYPBVKJXQZ';

function slotKey(cell, corner) {
  return `${cell}:${corner}`;
}

function getWordPool(length) {
  if (length === 1) return ONE_LETTER_WORDS;
  return getWordsByLength(length)
    .map((word) => word.toUpperCase())
    .filter((word) => /^[A-Z]+$/.test(word));
}

function compatibleWithPattern(word, pattern) {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] && pattern[i] !== word[i]) return false;
  }
  return true;
}

export function generateLetterTrianglesPuzzle(seed) {
  const baseRandom = createSeededRandom(seed);

  for (let attempt = 0; attempt < 8; attempt++) {
    const attemptSeed = seed + attempt * 104729;
    const random = createSeededRandom(attemptSeed);

    const pools = LINE_DEFINITIONS.map((_, idx) => seededShuffleArray([...getWordPool(idx + 1)], random));

    const assignedSlots = new Map();
    const usedWords = new Set();
    const chosenWords = [];

    function search(lineIndex) {
      if (lineIndex === LINE_DEFINITIONS.length) return true;

      const line = LINE_DEFINITIONS[lineIndex];
      const pattern = line.map(({ cell, corner }) => assignedSlots.get(slotKey(cell, corner)) || null);

      const candidates = pools[lineIndex]
        .filter((word) => !usedWords.has(word) && compatibleWithPattern(word, pattern))
        .slice(0, 900);

      for (const word of candidates) {
        const changed = [];

        for (let i = 0; i < line.length; i++) {
          const key = slotKey(line[i].cell, line[i].corner);
          const existing = assignedSlots.get(key);
          if (!existing) {
            assignedSlots.set(key, word[i]);
            changed.push(key);
          }
        }

        usedWords.add(word);
        chosenWords.push(word);

        if (search(lineIndex + 1)) return true;

        chosenWords.pop();
        usedWords.delete(word);
        changed.forEach((key) => assignedSlots.delete(key));
      }

      return false;
    }

    if (!search(0)) continue;

    for (let cell = 0; cell < CELL_COUNT; cell++) {
      for (const corner of CORNERS) {
        const key = slotKey(cell, corner);
        if (!assignedSlots.has(key)) {
          assignedSlots.set(key, LETTERS[Math.floor(random() * LETTERS.length)]);
        }
      }
    }

    const solvedTiles = Array.from({ length: CELL_COUNT }, (_, cell) => ({
      id: cell,
      letters: CORNERS.map((corner) => assignedSlots.get(slotKey(cell, corner))),
    }));

    return {
      seed,
      targetWords: chosenWords,
      solvedTiles,
      shuffledTiles: seededShuffleArray([...solvedTiles], baseRandom),
    };
  }

  // Fallback: generate a guaranteed solvable letter layout even if dictionary matching fails
  const fallbackSlots = new Map();
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    for (const corner of CORNERS) {
      fallbackSlots.set(slotKey(cell, corner), LETTERS[Math.floor(baseRandom() * LETTERS.length)]);
    }
  }

  const solvedTiles = Array.from({ length: CELL_COUNT }, (_, cell) => ({
    id: cell,
    letters: CORNERS.map((corner) => fallbackSlots.get(slotKey(cell, corner))),
  }));

  const targetWords = LINE_DEFINITIONS.map((line) =>
    line.map(({ cell, corner }) => fallbackSlots.get(slotKey(cell, corner))).join('')
  );

  return {
    seed,
    targetWords,
    solvedTiles,
    shuffledTiles: seededShuffleArray([...solvedTiles], baseRandom),
  };
}

export function buildLineWordsFromPlacement(placement, tileById) {
  return LINE_DEFINITIONS.map((line) => line.map(({ cell, corner }) => {
    const tileId = placement[cell];
    if (tileId === null || tileId === undefined) return '_';
    const tile = tileById.get(tileId);
    const cornerIndex = CORNERS.indexOf(corner);
    return tile?.letters[cornerIndex] ?? '_';
  }).join(''));
}

export function isSolvedPlacement(placement) {
  return placement.every((tileId, cellIndex) => tileId === cellIndex);
}
