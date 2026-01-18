import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOLUTIONS_URL = 'https://raw.githubusercontent.com/mlepage/pentomino-solver/master/solutions.txt';
const OUTPUT_FILE = path.join(__dirname, '../public/datasets/pentominoPuzzles.json');

async function downloadSolutions() {
  console.log('Downloading pentomino solutions...');
  const response = await fetch(SOLUTIONS_URL);
  if (!response.ok) {
    throw new Error(`Failed to download solutions: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return text;
}

function parseSolutions(text) {
  const lines = text.split('\n');
  const puzzles = [];
  let i = 0;
  let puzzleId = 0;

  while (i < lines.length) {
    // Skip empty lines
    if (!lines[i].trim()) {
      i++;
      continue;
    }

    // Skip header "Pentomino solver" line
    if (lines[i].trim() === 'Pentomino solver') {
      i++;
      continue;
    }

    // Parse header line: "011-022-013-035-262-242-361-276-756-355-617-024-431 1"
    const headerMatch = lines[i].match(/^([\d-]+)\s+(\d+)$/);
    if (!headerMatch) {
      i++;
      continue;
    }

    const pieceOrdering = headerMatch[1];
    const solutionNumber = parseInt(headerMatch[2], 10);
    i++;

    // Parse 8x8 grid (8 lines of 8 numbers each)
    const grid = [];
    for (let row = 0; row < 8; row++) {
      if (i >= lines.length) break;
      const rowLine = lines[i].trim();
      const rowNumbers = rowLine.split(/\s+/).map(num => parseInt(num, 10));
      if (rowNumbers.length === 8) {
        grid.push(rowNumbers);
      }
      i++;
    }

    if (grid.length === 8) {
      puzzleId++;
      
      // Find the hole (cells with value 0)
      const hole = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (grid[r][c] === 0) {
            hole.push([r, c]);
          }
        }
      }

      puzzles.push({
        id: puzzleId,
        seed: puzzleId - 1, // Use 0-indexed seed for reproducibility
        pieceOrdering: pieceOrdering,
        solutionNumber: solutionNumber,
        grid: grid, // 8x8 grid
        hole: hole.length === 4 ? hole : null, // Should be exactly 4 cells for 2x2 hole
        width: 8,
        height: 8
      });
    }
  }

  return puzzles;
}

async function main() {
  try {
    console.log('Fetching pentomino solutions from MIT-licensed repository...');
    const text = await downloadSolutions();
    console.log(`Downloaded ${text.length} characters`);

    console.log('Parsing solutions...');
    const puzzles = parseSolutions(text);
    console.log(`Parsed ${puzzles.length} puzzles`);

    // Create dataset object
    const dataset = {
      name: 'Pentomino',
      version: '1.0',
      total: puzzles.length,
      description: 'Pentomino puzzle solutions - 8x8 board with 2x2 hole in center',
      source: {
        repository: 'https://github.com/mlepage/pentomino-solver',
        license: 'MIT',
        attribution: 'mlepage/pentomino-solver'
      },
      format: {
        grid: '8x8 grid as 2D array (rows x cols)',
        hole: 'Coordinates of the 2x2 hole cells [[r1, c1], [r2, c2], [r3, c3], [r4, c4]]',
        pieceOrdering: 'String representing the ordering of pieces',
        solutionNumber: 'Original solution number from dataset',
        values: '0 = hole, 1-12 = pentomino piece IDs'
      },
      puzzles: puzzles
    };

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    console.log(`Writing to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
    console.log(`✓ Successfully created dataset with ${puzzles.length} puzzles`);

    // Print sample
    if (puzzles.length > 0) {
      console.log('\nSample puzzle:');
      console.log(JSON.stringify(puzzles[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();