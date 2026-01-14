export const DIFFICULTIES = {
  beginner: { min: 0, max: 1000 },
  easy: { min: 1000, max: 1400 },
  intermediate: { min: 1400, max: 1800 },
  hard: { min: 1800, max: 2200 },
  master: { min: 2200, max: 3000 },
};

let cachedPuzzles = null;
let loadingPromise = null;

async function fetchDataset() {
  const resp = await fetch('/datasets/chessPuzzles.json');
  if (!resp.ok) throw new Error(`Failed to load chess puzzles: ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data?.puzzles) ? data.puzzles : [];
}

export async function loadChessPuzzles() {
  if (cachedPuzzles) return cachedPuzzles;
  if (loadingPromise) return loadingPromise;
  loadingPromise = fetchDataset()
    .then((list) => {
      cachedPuzzles = list;
      return cachedPuzzles;
    })
    .catch((err) => {
      console.error(err);
      cachedPuzzles = [];
      return cachedPuzzles;
    })
    .finally(() => {
      loadingPromise = null;
    });
  return loadingPromise;
}

export function getRandomPuzzleByRating(puzzleList, min, max) {
  if (!Array.isArray(puzzleList) || puzzleList.length === 0) return null;
  const filtered = puzzleList.filter((p) => p.rating >= min && p.rating <= max);
  if (filtered.length === 0) return puzzleList[Math.floor(Math.random() * puzzleList.length)];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getPuzzleById(puzzleList, id) {
  if (!Array.isArray(puzzleList)) return null;
  return puzzleList.find((p) => p.id === id);
}
