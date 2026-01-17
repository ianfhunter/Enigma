#!/usr/bin/env node

/**
 * Download and process Sudoku-Bench dataset for Arrow, Jigsaw, and Thermo Sudoku
 * 
 * Converts Sudoku-Bench format to our internal game format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../public/datasets');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Parse initial_board string (81 chars for 9x9) into 2D array
function parseBoard(boardStr, size = 9) {
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const char = boardStr[idx] || '.';
      row.push(char === '.' ? 0 : parseInt(char, 10) || 0);
    }
    grid.push(row);
  }
  return grid;
}

// Parse solution string into 2D array
function parseSolution(solutionStr, size = 9) {
  return parseBoard(solutionStr, size);
}

// Convert Sudoku-Bench puzzle to our internal format for Arrow Sudoku
function convertArrowPuzzle(rawPuzzle) {
  const size = Math.sqrt(rawPuzzle.initial_board.length);
  const puzzle = parseBoard(rawPuzzle.initial_board, size);
  const solution = rawPuzzle.solution ? parseSolution(rawPuzzle.solution, size) : null;

  const arrows = [];
  // Extract arrow constraints from visual_elements
  if (rawPuzzle.visual_elements && Array.isArray(rawPuzzle.visual_elements)) {
    for (const el of rawPuzzle.visual_elements) {
      if ((el.type === 'arrow' || el.type === 'circle') && el.cells && el.cells.length >= 2) {
        arrows.push({
          circle: el.cells[0] || el.center || [0, 0],
          path: el.cells.slice(1) || [],
        });
      }
    }
  }

  return {
    id: rawPuzzle.puzzle_id || rawPuzzle.id || `arrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    puzzle,
    solution: solution || puzzle,
    arrows,
  };
}

// Convert Sudoku-Bench puzzle to our internal format for Thermo Sudoku
function convertThermoPuzzle(rawPuzzle) {
  const size = Math.sqrt(rawPuzzle.initial_board.length);
  const puzzle = parseBoard(rawPuzzle.initial_board, size);
  const solution = rawPuzzle.solution ? parseSolution(rawPuzzle.solution, size) : null;

  const thermos = [];
  // Extract thermometer constraints from visual_elements
  if (rawPuzzle.visual_elements && Array.isArray(rawPuzzle.visual_elements)) {
    for (const el of rawPuzzle.visual_elements) {
      if ((el.type === 'thermometer' || el.type === 'thermo') && el.cells && el.cells.length >= 2) {
        thermos.push({
          cells: el.cells,
        });
      }
    }
  }

  return {
    id: rawPuzzle.puzzle_id || rawPuzzle.id || `thermo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    puzzle,
    solution: solution || puzzle,
    thermos,
  };
}

// Convert Sudoku-Bench puzzle to our internal format for Jigsaw Sudoku
function convertJigsawPuzzle(rawPuzzle) {
  const size = Math.sqrt(rawPuzzle.initial_board.length);
  const puzzle = parseBoard(rawPuzzle.initial_board, size);
  const solution = rawPuzzle.solution ? parseSolution(rawPuzzle.solution, size) : null;

  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regionCells = {};
  
  // Extract irregular regions from visual_elements
  if (rawPuzzle.visual_elements && Array.isArray(rawPuzzle.visual_elements)) {
    for (const el of rawPuzzle.visual_elements) {
      if ((el.type === 'region' || el.type === 'jigsaw' || el.type === 'irregular') && el.cells) {
        const regionId = el.region_id || el.id || 0;
        if (el.cells && Array.isArray(el.cells)) {
          el.cells.forEach(([r, c]) => {
            if (r >= 0 && r < size && c >= 0 && c < size) {
              regions[r][c] = regionId;
              if (!regionCells[regionId]) regionCells[regionId] = [];
              regionCells[regionId].push([r, c]);
            }
          });
        }
      }
    }
  }

  return {
    id: rawPuzzle.puzzle_id || rawPuzzle.id || `jigsaw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    puzzle,
    solution: solution || puzzle,
    regions,
    regionCells,
  };
}

// Download dataset from URL
async function fetchDataset(url) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Processing Sudoku-Bench dataset...\n');

  const datasets = {
    arrow: [],
    thermo: [],
    jigsaw: [],
  };

  // Try to fetch from Hugging Face or GitHub
  // Note: The actual dataset might be in different formats
  // For now, we'll create a note about how to populate it
  
  console.log('Attempting to fetch Sudoku-Bench dataset...');
  
  // Try multiple possible URLs
  const possibleUrls = [
    'https://huggingface.co/datasets/SakanaAI/Sudoku-Bench/resolve/main/challenge_100.json',
    'https://raw.githubusercontent.com/SakanaAI/Sudoku-Bench/main/data/challenge_100.json',
    'https://raw.githubusercontent.com/SakanaAI/Sudoku-Bench/main/challenge_100.json',
  ];

  let rawData = null;
  for (const url of possibleUrls) {
    rawData = await fetchDataset(url);
    if (rawData) {
      console.log(`✓ Successfully fetched from ${url}`);
      break;
    }
  }

  if (!rawData) {
    console.log('\n⚠ Could not fetch dataset from online sources.');
    console.log('To populate the dataset files:');
    console.log('1. Download Sudoku-Bench from: https://github.com/SakanaAI/Sudoku-Bench');
    console.log('2. Extract puzzles by variant type (arrow, thermo, jigsaw)');
    console.log('3. Save them in the appropriate format to the JSON files\n');
    
    // Save empty datasets
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'arrowSudokuPuzzles.json'),
      JSON.stringify({ puzzles: datasets.arrow }, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'jigsawSudokuPuzzles.json'),
      JSON.stringify({ puzzles: datasets.jigsaw }, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'thermoSudokuPuzzles.json'),
      JSON.stringify({ puzzles: datasets.thermo }, null, 2)
    );
    
    console.log('Created empty dataset files. They will fall back to algorithmic generation.');
    return;
  }

  // Process the raw data
  console.log('\nProcessing puzzles...');
  
  const puzzles = Array.isArray(rawData) ? rawData : (rawData.puzzles || rawData.data || []);
  
  if (!Array.isArray(puzzles)) {
    console.error('Dataset format not recognized. Expected an array of puzzles.');
    return;
  }

  console.log(`Found ${puzzles.length} puzzles in dataset\n`);

  // Categorize puzzles
  for (const puzzle of puzzles) {
    if (!puzzle.initial_board || puzzle.initial_board.length !== 81) continue; // Only 9x9 for now
    
    const rules = puzzle.rules || [];
    const hasVisualElements = puzzle.visual_elements && Array.isArray(puzzle.visual_elements);
    
    // Check if it's an Arrow Sudoku
    const hasArrows = hasVisualElements && puzzle.visual_elements.some(el => 
      (el.type === 'arrow' || el.type === 'circle') && el.cells
    );
    if (hasArrows || rules.some(r => r.toLowerCase().includes('arrow'))) {
      const converted = convertArrowPuzzle(puzzle);
      datasets.arrow.push(converted);
    }
    
    // Check if it's a Thermo Sudoku
    const hasThermos = hasVisualElements && puzzle.visual_elements.some(el => 
      (el.type === 'thermometer' || el.type === 'thermo') && el.cells
    );
    if (hasThermos || rules.some(r => r.toLowerCase().includes('thermo'))) {
      const converted = convertThermoPuzzle(puzzle);
      datasets.thermo.push(converted);
    }
    
    // Check if it's a Jigsaw Sudoku
    const hasRegions = hasVisualElements && puzzle.visual_elements.some(el => 
      (el.type === 'region' || el.type === 'jigsaw' || el.type === 'irregular') && el.cells
    );
    if (hasRegions || rules.some(r => r.toLowerCase().includes('irregular') || r.toLowerCase().includes('jigsaw'))) {
      const converted = convertJigsawPuzzle(puzzle);
      datasets.jigsaw.push(converted);
    }
  }

  console.log(`Processed:`);
  console.log(`  Arrow Sudoku: ${datasets.arrow.length} puzzles`);
  console.log(`  Thermo Sudoku: ${datasets.thermo.length} puzzles`);
  console.log(`  Jigsaw Sudoku: ${datasets.jigsaw.length} puzzles\n`);

  // Save datasets
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'arrowSudokuPuzzles.json'),
    JSON.stringify({ puzzles: datasets.arrow }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'jigsawSudokuPuzzles.json'),
    JSON.stringify({ puzzles: datasets.jigsaw }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'thermoSudokuPuzzles.json'),
    JSON.stringify({ puzzles: datasets.thermo }, null, 2)
  );

  console.log('✓ Dataset files created successfully!');
}

main().catch(console.error);
