/**
 * Fuzzy search utility for matching game titles and descriptions
 */

/**
 * Calculate fuzzy match score between query and text
 * Returns null if no match, or a score object with match details
 *
 * @param {string} query - The search query
 * @param {string} text - The text to search in
 * @returns {object|null} - Match result with score, or null if no match
 */
export function fuzzyMatch(query, text) {
  if (!query || !text) return null;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Quick check: if query is longer than text, no match
  if (queryLower.length > textLower.length) return null;

  // Exact substring match gets highest priority
  if (textLower.includes(queryLower)) {
    const startIndex = textLower.indexOf(queryLower);
    const atWordStart = startIndex === 0 || /\s/.test(text[startIndex - 1]);
    return {
      score: 1000 + (atWordStart ? 500 : 0) + (textLower.length - queryLower.length) * -1,
      matches: [[startIndex, startIndex + queryLower.length]]
    };
  }

  // Fuzzy matching - find characters in sequence
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;
  let lastMatchIndex = -1;
  const matchIndices = [];

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matchIndices.push(i);

      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) {
        consecutiveMatches++;
        score += 10 * consecutiveMatches;
      } else {
        consecutiveMatches = 0;
        score += 5;
      }

      // Bonus for matching at word boundaries
      if (i === 0 || /\s/.test(text[i - 1])) {
        score += 15;
      }

      // Bonus for matching after separator (camelCase, hyphen, underscore)
      if (i > 0 && (/[A-Z]/.test(text[i]) || /[-_]/.test(text[i - 1]))) {
        score += 10;
      }

      lastMatchIndex = i;
      queryIndex++;
    }
  }

  // If we didn't match all query characters, no match
  if (queryIndex !== queryLower.length) return null;

  // Penalty for gaps between matches
  const totalGaps = matchIndices.length > 1
    ? matchIndices[matchIndices.length - 1] - matchIndices[0] - matchIndices.length + 1
    : 0;
  score -= totalGaps * 2;

  // Penalty for matches spread too far apart
  if (matchIndices.length > 1) {
    const spread = matchIndices[matchIndices.length - 1] - matchIndices[0];
    if (spread > queryLower.length * 3) {
      score -= (spread - queryLower.length * 3);
    }
  }

  return {
    score,
    matches: matchIndices.map(i => [i, i + 1])
  };
}

/**
 * Search games with fuzzy matching, sorted by relevance
 *
 * @param {Array} games - Array of game objects with title, description, and optional aliases
 * @param {string} query - The search query
 * @returns {Array} - Sorted array of matching games with scores
 */
export function fuzzySearchGames(games, query) {
  if (!query || !query.trim()) return [];

  const trimmedQuery = query.trim();

  const results = games
    .map(game => {
      const titleMatch = fuzzyMatch(trimmedQuery, game.title);
      const descMatch = fuzzyMatch(trimmedQuery, game.description);

      // Check aliases - find the best matching alias
      let aliasMatch = null;
      let matchedAlias = null;
      if (game.aliases && Array.isArray(game.aliases)) {
        for (const alias of game.aliases) {
          const match = fuzzyMatch(trimmedQuery, alias);
          if (match && (!aliasMatch || match.score > aliasMatch.score)) {
            aliasMatch = match;
            matchedAlias = alias;
          }
        }
      }

      // Title matches are worth more than alias matches, which are worth more than description matches
      const titleScore = titleMatch ? titleMatch.score * 2 : 0;
      const aliasScore = aliasMatch ? aliasMatch.score * 1.5 : 0;
      const descScore = descMatch ? descMatch.score : 0;

      // Only include if at least one matches
      if (!titleMatch && !aliasMatch && !descMatch) return null;

      return {
        ...game,
        _searchScore: titleScore + aliasScore + descScore,
        _titleMatch: titleMatch,
        _aliasMatch: aliasMatch,
        _matchedAlias: matchedAlias,
        _descMatch: descMatch
      };
    })
    .filter(Boolean)
    .sort((a, b) => b._searchScore - a._searchScore);

  return results;
}
