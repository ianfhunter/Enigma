/**
 * Download Suguru puzzles from janko.at
 * These puzzles are for educational/personal use
 * Attribution: Otto Janko, janko.at
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.janko.at/Raetsel/Suguru';

// Puzzle IDs to fetch (001-100 range, with various sizes)
const PUZZLE_IDS = [];
for (let i = 1; i <= 50; i++) {
  PUZZLE_IDS.push(String(i).padStart(3, '0'));
}

async function fetchPuzzle(id) {
  const url = `${BASE_URL}/${id}.a.htm`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    return parsePuzzle(text, id);
  } catch (e) {
    console.error(`Failed to fetch puzzle ${id}:`, e.message);
    return null;
  }
}

function parsePuzzle(text, id) {
  try {
    // Extract size
    const sizeMatch = text.match(/size\s+(\d+)/);
    if (!sizeMatch) return null;
    const size = parseInt(sizeMatch[1]);

    // Extract problem (clues)
    const problemMatch = text.match(/\[problem\]\s*([\s\S]*?)\[areas\]/);
    if (!problemMatch) return null;

    const problemLines = problemMatch[1].trim().split('\n').filter(l => l.trim());
    const clues = problemLines.map(line =>
      line.trim().split(/\s+/).map(c => c === '-' ? null : parseInt(c))
    );

    // Extract areas (regions)
    const areasMatch = text.match(/\[areas\]\s*([\s\S]*?)\[solution\]/);
    if (!areasMatch) return null;

    const areasLines = areasMatch[1].trim().split('\n').filter(l => l.trim());
    const regions = areasLines.map(line =>
      line.trim().split(/\s+/).map(c => parseInt(c))
    );

    // Extract solution
    const solutionMatch = text.match(/\[solution\]\s*([\s\S]*?)(?:\[|\s*$)/);
    if (!solutionMatch) return null;

    const solutionLines = solutionMatch[1].trim().split('\n').filter(l => l.trim());
    const solution = solutionLines.map(line =>
      line.trim().split(/\s+/).map(c => parseInt(c))
    );

    // Validate dimensions
    if (clues.length !== size || regions.length !== size || solution.length !== size) {
      console.warn(`Size mismatch for puzzle ${id}`);
      return null;
    }

    // Build regionCells map
    const regionCells = {};
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const rid = regions[r][c];
        if (!regionCells[rid]) regionCells[rid] = [];
        regionCells[rid].push([r, c]);
      }
    }

    // Determine difficulty based on size and empty cells
    const emptyCells = clues.flat().filter(c => c === null).length;
    const emptyRatio = emptyCells / (size * size);
    let difficulty = 'easy';
    if (size >= 8 || emptyRatio > 0.7) difficulty = 'hard';
    else if (size >= 6 || emptyRatio > 0.5) difficulty = 'medium';

    return {
      id: `janko-${id}`,
      size,
      difficulty,
      clues,
      regions,
      regionCells,
      solution,
      source: 'janko.at',
      attribution: 'Otto Janko'
    };
  } catch (e) {
    console.error(`Parse error for puzzle ${id}:`, e.message);
    return null;
  }
}

async function main() {
  console.log('Downloading Suguru puzzles from janko.at...');

  const puzzles = [];

  for (const id of PUZZLE_IDS) {
    const puzzle = await fetchPuzzle(id);
    if (puzzle) {
      puzzles.push(puzzle);
      console.log(`✓ Puzzle ${id} (${puzzle.size}x${puzzle.size}, ${puzzle.difficulty})`);
    } else {
      console.log(`✗ Puzzle ${id} failed`);
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDownloaded ${puzzles.length} puzzles`);

  // Group by difficulty
  const byDifficulty = {
    easy: puzzles.filter(p => p.difficulty === 'easy'),
    medium: puzzles.filter(p => p.difficulty === 'medium'),
    hard: puzzles.filter(p => p.difficulty === 'hard')
  };

  console.log(`Easy: ${byDifficulty.easy.length}, Medium: ${byDifficulty.medium.length}, Hard: ${byDifficulty.hard.length}`);

  // Write to file
  const outPath = path.join(__dirname, '..', 'src', 'data', 'suguruPuzzles.json');
  await fs.writeFile(outPath, JSON.stringify(puzzles, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch(console.error);
