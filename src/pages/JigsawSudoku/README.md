# 🧩 Jigsaw Sudoku

Sudoku variant with irregular 9-cell regions instead of 3×3 boxes.

## Pack

Sudoku Family

## Rules

1. Fill each row with digits 1-9 with no repeats.
2. Fill each column with digits 1-9 with no repeats.
3. Fill each irregular region with digits 1-9 with no repeats.

## Generation

- Regions are generated first as connected irregular 9-cell groups.
- A complete solved grid is built with MRV-guided recursive backtracking.
- Clues are removed while repeatedly checking uniqueness with a solver.
- Difficulty clue counts:
  - Easy: 40-45
  - Medium: 32-39
  - Hard: 28-31
