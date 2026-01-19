# 🔵 Suko

Fill a 3×3 grid with numbers 1-9 to satisfy sum and color constraints.

## A.K.A.

Also known as: Suko Puzzle, Sum Puzzle

## Category

Number Puzzles

## How to Play

1. Place numbers 1-9 in the 3×3 grid (each number used exactly once)
2. Circle clues at intersections show the sum of their 4 surrounding cells
3. Cells are colored green, orange, or yellow
4. Each color group must sum to its target value
5. All constraints must be satisfied simultaneously

## Clue Types

- **Circle Clues (4)**: Show the sum of the four cells touching that intersection
- **Color Sums (3)**: Show the target sum for all cells of that color

## Controls

- Click a cell to select it
- Use number buttons or keyboard (1-9) to enter numbers
- Backspace/Delete clears the selected cell
- Arrow keys navigate between cells

## Puzzle Source

**📦 Dataset**

Puzzles are loaded from a pre-computed dataset of unique solutions.

**Source:** Generated dataset
**License:** Internal

## Tips & Strategy

- Start by analyzing which numbers must go where based on color sums
- Small color groups are more constraining
- The center cell appears in all four circle sums - identify it early
- Use the "show errors" toggle to catch mistakes
- Process of elimination: if 8 numbers are placed, the 9th is determined

## Mathematical Note

With 9 cells and 4 overlapping sum constraints plus 3 color constraints, Suko puzzles require careful logical deduction. The total of all cells is always 45 (1+2+...+9).

## Issues & Bugs

🔍 [Search existing issues for "Suko"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+Suko)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BSuko%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
