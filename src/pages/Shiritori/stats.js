const DEFAULT_STATS = { longestChain: 0 };

function safeLongestChain(value) {
  return Number.isFinite(value) ? value : 0;
}

export function loadStats(serializedStats) {
  if (!serializedStats) {
    return { ...DEFAULT_STATS };
  }

  try {
    const parsed = JSON.parse(serializedStats);
    return { longestChain: safeLongestChain(parsed?.longestChain) };
  } catch (error) {
    return { ...DEFAULT_STATS };
  }
}

export function recordLongestChain(stats, chainLength) {
  const currentLongest = safeLongestChain(stats?.longestChain);
  const candidateLength = safeLongestChain(chainLength);
  return { longestChain: Math.max(currentLongest, candidateLength) };
}

export { DEFAULT_STATS };
