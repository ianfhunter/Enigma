# Ripple Effect

A logic puzzle where you fill numbered rooms while respecting the ripple constraint.

## Rules

1. **Room Constraint**: Each room (region) must contain all consecutive integers from 1 to N, where N is the number of cells in that room.

2. **Ripple Constraint**: If the same number N appears twice in the same row or column, there must be at least N cells between them.

## Example

In a row: `2 _ _ 2` is valid (2 cells between the 2s)
In a row: `2 _ 2` is invalid (only 1 cell between the 2s)

## How to Play

- Click on an empty cell to select it
- Use the number pad or keyboard (1-9) to enter a number
- Press Backspace/Delete or click ✕ to clear a cell
- Use arrow keys to navigate between cells
- Toggle "Show errors" to see constraint violations

## Dataset

Puzzles are pre-generated offline using a solver that verifies unique solvability.

- 6×6 grids: Easy, Medium, Hard
- 8×8 grids (standard): Easy, Medium, Hard
- 10×10 grids: Easy, Medium, Hard

## Implementation Notes

- Puzzle generation uses backtracking with constraint propagation
- Room layouts are randomly generated polyominoes
- Each puzzle is verified to have exactly one solution
- Seeds are deterministic for reproducibility
