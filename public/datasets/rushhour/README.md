# Rush Hour Puzzle Dataset

## Source

This puzzle dataset is derived from [Michael Fogleman's Rush Hour project](https://github.com/fogleman/rush).

- **Author**: Michael Fogleman
- **Website**: https://www.michaelfogleman.com/rush/
- **License**: MIT License (see LICENSE.md)

## Format

Each puzzle is a 36-character string representing a 6x6 grid, read left-to-right, top-to-bottom.

### Character meanings:
- `o` - Empty cell
- `x` - Wall/obstacle (immovable)
- `A` - The red/target car (must escape through the right exit on row 3)
- `B-Z` - Other vehicles (cars are 2 cells, trucks are 3 cells)

### Example:
```
ooxCCC    →   . . x C C C
DDoIJo        D D . I J .
AAoIJo        A A . I J .   ← Exit is here (row 3, right side)
HEEEJo        H E E E J .
Hooooo        H . . . . .
xooGGo        x . . G G .
```

The goal is to slide vehicles horizontally (for horizontal vehicles) or vertically (for vertical vehicles) to create a path for car `AA` to exit through the right side of row 3.

## Stats

- **Total puzzles**: 33,583
- **Difficulty**: Sorted by minimum moves required to solve

