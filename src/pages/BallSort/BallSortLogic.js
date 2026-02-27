import { createSeededRandom, seededShuffleArray } from '../../utils/generatorUtils';

export const BIN_CAPACITY = 4;

export const DIFFICULTY_CONFIG = {
  easy: { minFullBins: 5, maxFullBins: 7, emptyBins: 2 },
  medium: { minFullBins: 9, maxFullBins: 12, emptyBins: 2 },
  hard: { minFullBins: 13, maxFullBins: 17, emptyBins: 2 },
};

export function getTopRunLength(bin) {
  if (bin.length === 0) return 0;
  const top = bin[0];
  let count = 1;
  for (let i = 1; i < bin.length; i++) {
    if (bin[i] !== top) break;
    count++;
  }
  return count;
}

export function canMove(state, fromIndex, toIndex) {
  if (fromIndex === toIndex) return false;
  const from = state[fromIndex];
  const to = state[toIndex];
  if (!from || !to || from.length === 0 || to.length >= BIN_CAPACITY) return false;

  const movingColor = from[0];
  const toSpace = BIN_CAPACITY - to.length;

  if (to.length === 0) return toSpace > 0;
  if (to[0] !== movingColor) return false;
  return toSpace > 0;
}

export function moveBalls(state, fromIndex, toIndex) {
  if (!canMove(state, fromIndex, toIndex)) return state;

  const next = state.map((bin) => [...bin]);
  const from = next[fromIndex];
  const to = next[toIndex];
  const movingColor = from[0];
  const movableCount = Math.min(1, BIN_CAPACITY - to.length);

  for (let i = 0; i < movableCount; i++) {
    from.shift();
    to.unshift(movingColor);
  }

  return next;
}

export function isSolved(state) {
  return state.every((bin) => {
    if (bin.length === 0) return true;
    if (bin.length !== BIN_CAPACITY) return false;
    return bin.every((color) => color === bin[0]);
  });
}

function randomIntInclusive(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function buildRandomizedFullBins(random, fullBins) {
  const pool = [];
  for (let color = 0; color < fullBins; color++) {
    for (let i = 0; i < BIN_CAPACITY; i++) {
      pool.push(color);
    }
  }

  const shuffled = seededShuffleArray(pool, random);
  const bins = [];
  for (let i = 0; i < fullBins; i++) {
    bins.push(shuffled.slice(i * BIN_CAPACITY, (i + 1) * BIN_CAPACITY));
  }

  return bins;
}

function hasAtLeastOneMixedBin(bins) {
  return bins.some((bin) => bin.some((color) => color !== bin[0]));
}

export function generateBallSortPuzzle(seed, difficulty = 'medium') {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const random = createSeededRandom(seed);

  const fullBins = randomIntInclusive(random, config.minFullBins, config.maxFullBins);
  const totalBins = fullBins + config.emptyBins;

  const solution = Array.from({ length: totalBins }, (_, index) => {
    if (index >= fullBins) return [];
    return Array(BIN_CAPACITY).fill(index);
  });

  let fullBinState = buildRandomizedFullBins(random, fullBins);
  let attempts = 0;
  while (!hasAtLeastOneMixedBin(fullBinState) && attempts < 5) {
    fullBinState = buildRandomizedFullBins(random, fullBins);
    attempts++;
  }

  const bins = [
    ...fullBinState,
    ...Array.from({ length: config.emptyBins }, () => []),
  ];

  return {
    seed,
    difficulty,
    capacity: BIN_CAPACITY,
    fullBins,
    emptyBins: config.emptyBins,
    bins,
    solution,
  };
}
