# Suguru Puzzle Dataset Attribution

## Source

The curated Suguru puzzles in `suguruPuzzles.json` are sourced from:

- **Website**: [janko.at](https://www.janko.at/Raetsel/Suguru/)
- **Author**: Otto Janko
- **Downloaded**: January 2026

## Usage

These puzzles are used for educational and personal use within this puzzle game application.

## Dataset Stats

- **Total puzzles**: 50
- **Sizes**: 6×6, 7×7, 8×8, 9×9, 10×10
- **Format**: JSON with regions, clues, and solutions

## Format

Each puzzle contains:
- `id`: Unique identifier
- `size`: Grid dimension (e.g., 6 for 6×6)
- `difficulty`: easy/medium/hard
- `clues`: 2D array with given numbers (null for empty)
- `regions`: 2D array mapping cells to region IDs
- `regionCells`: Object mapping region ID to list of [row, col] coordinates
- `solution`: 2D array with complete solution
- `source`: Attribution source
- `attribution`: Puzzle author
