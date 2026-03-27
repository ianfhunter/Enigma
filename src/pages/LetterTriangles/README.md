# Letter Triangles

Arrange 9 triangular letter tiles into a large triangle.

Each tile has three letters. Place the tiles so that every line shown under the board spells the target word.

## Rules

- Place all tiles from the tray into the 9 board cells.
- A puzzle is solved when every tile is in the correct position.
- You can click a placed tile to pick it back up.
- Use **Give Up** to reveal the solution.

## Puzzle generation

- Uses a seeded generator for reproducibility.
- Chooses English words with lengths 1, 2, 4, 5, 7, and 8.
- Writes those words into overlapping line definitions.
- Builds tile letters from the solved layout and shuffles the tiles.
