import { createSeededRandom } from '../../utils/generatorUtils';

export const BIN_CAPACITY = 4;

export const DIFFICULTY_CONFIG = {
  easy: { minFullBins: 5, maxFullBins: 7, emptyBins: 2 },
  medium: { minFullBins: 9, maxFullBins: 12, emptyBins: 2 },
  hard: { minFullBins: 13, maxFullBins: 17, emptyBins: 2 },
};

export function getTopRunLength(bin) {
  if (bin.length === 0) return 0;
  const top = bin[bin.length - 1];
  let count = 1;
  for (let i = bin.length - 2; i >= 0; i--) {
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

  const movingColor = from[from.length - 1];
  const toSpace = BIN_CAPACITY - to.length;

  if (to.length === 0) return toSpace > 0;

  const targetTopColor = to[to.length - 1];
  if (targetTopColor !== movingColor) return false;

  return toSpace > 0;
}

export function moveBalls(state, fromIndex, toIndex) {
  if (!canMove(state, fromIndex, toIndex)) return state;

  const next = state.map((bin) => [...bin]);
  const from = next[fromIndex];
  const to = next[toIndex];
  const movingColor = from[from.length - 1];
  const movableCount = Math.min(getTopRunLength(from), BIN_CAPACITY - to.length);

  for (let i = 0; i < movableCount; i++) {
    from.pop();
    to.push(movingColor);
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

function pickDifferentIndex(random, length, excluded) {
  const candidates = [];
  for (let i = 0; i < length; i++) {
    if (i !== excluded) candidates.push(i);
  }
  return candidates[Math.floor(random() * candidates.length)];
}

function serializeState(state) {
  return state.map((bin) => bin.join(',')).join('|');
}

function applyRandomReverseMove(state, random) {
  const sourceIndices = state
    .map((bin, index) => ({ bin, index }))
    .filter(({ bin }) => bin.length > 0 && bin.length < BIN_CAPACITY)
    .map(({ index }) => index);

  if (sourceIndices.length === 0) return false;

  const sourceIndex = sourceIndices[Math.floor(random() * sourceIndices.length)];
  const sourceColor = state[sourceIndex][state[sourceIndex].length - 1];

  const donorCandidates = state
    .map((bin, index) => ({ bin, index }))
    .filter(({ index, bin }) => index !== sourceIndex && bin.length > 0)
    .filter(({ bin }) => {
      const top = bin[bin.length - 1];
      return top === sourceColor || bin.length < BIN_CAPACITY;
    })
    .map(({ index }) => index);

  if (donorCandidates.length === 0) return false;

  const donorIndex = donorCandidates[Math.floor(random() * donorCandidates.length)];
  const donorTopColor = state[donorIndex][state[donorIndex].length - 1];

  const maxMovable = donorTopColor === sourceColor
    ? Math.min(getTopRunLength(state[donorIndex]), BIN_CAPACITY - state[sourceIndex].length)
    : Math.min(1, BIN_CAPACITY - state[sourceIndex].length);

  if (maxMovable <= 0) return false;

  const moveCount = randomIntInclusive(random, 1, maxMovable);

  for (let i = 0; i < moveCount; i++) {
    state[sourceIndex].push(state[donorIndex].pop());
  }

  return true;
}

export function generateBallSortPuzzle(seed, difficulty = 'medium') {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const random = createSeededRandom(seed);

  const fullBins = randomIntInclusive(random, config.minFullBins, config.maxFullBins);
  const totalBins = fullBins + config.emptyBins;

  const solvedState = Array.from({ length: totalBins }, (_, index) => {
    if (index >= fullBins) return [];
    return Array(BIN_CAPACITY).fill(index);
  });

  const puzzleState = solvedState.map((bin) => [...bin]);
  const history = new Set([serializeState(puzzleState)]);
  const scrambleMoves = Math.max(80, fullBins * 20);

  let performed = 0;
  let attempts = 0;
  while (performed < scrambleMoves && attempts < scrambleMoves * 8) {
    const snapshot = puzzleState.map((bin) => [...bin]);
    const changed = applyRandomReverseMove(puzzleState, random);

    if (!changed) {
      attempts++;
      continue;
    }

    const key = serializeState(puzzleState);
    if (history.has(key)) {
      for (let i = 0; i < puzzleState.length; i++) puzzleState[i] = snapshot[i];
      attempts++;
      continue;
    }

    history.add(key);
    performed++;
  }

  if (isSolved(puzzleState)) {
    const donors = puzzleState
      .map((bin, index) => ({ bin, index }))
      .filter(({ bin }) => bin.length > 0)
      .map(({ index }) => index);

    const empties = puzzleState
      .map((bin, index) => ({ bin, index }))
      .filter(({ bin }) => bin.length === 0)
      .map(({ index }) => index);

    const donorIndex = donors[Math.floor(random() * donors.length)];
    const receiverIndex = empties.length > 0
      ? empties[Math.floor(random() * empties.length)]
      : pickDifferentIndex(random, totalBins, donorIndex);

    if (donorIndex !== undefined && receiverIndex !== undefined && puzzleState[receiverIndex].length < BIN_CAPACITY) {
      puzzleState[receiverIndex].push(puzzleState[donorIndex].pop());
    }
  }

  return {
    seed,
    difficulty,
    capacity: BIN_CAPACITY,
    fullBins,
    emptyBins: config.emptyBins,
    bins: puzzleState,
    solution: solvedState,
  };
}
