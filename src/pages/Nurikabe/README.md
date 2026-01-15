# 🌊 Nurikabe

Shade cells to form one connected sea around numbered islands.

## Category

Grid Shading

## How to Play

1. Numbered cells are islands; shade other cells to create the sea
2. Each number shows how many cells are in its island (including itself)
3. Islands cannot touch each other (not even diagonally)
4. The sea must be one connected region
5. No 2×2 area can be entirely sea (shaded)

## Puzzle Source

**🌐 Backend API**

Puzzles are fetched from the backend puzzle API.

**Source:** Puzzle API - pre-generated island puzzles

## Tips & Strategy

- Cells between two islands must be sea
- Expand islands to their required size
- Watch for 2×2 sea violations - they're easy to miss

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
