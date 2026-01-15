# ⬛ Hitori

Shade cells to eliminate duplicates while keeping unshaded cells connected.

## Category

Grid Shading

## How to Play

1. Shade cells so no number repeats in any row or column
2. Shaded cells cannot be adjacent horizontally or vertically
3. All unshaded cells must form one connected group
4. The shaded cells eliminate the duplicates
5. Some cells may not need shading if no conflict exists

## Puzzle Source

**🌐 Backend API**

Puzzles are fetched from the backend puzzle API.

**Source:** Puzzle API - pre-generated duplicate elimination puzzles

## Tips & Strategy

- If two identical numbers are adjacent, exactly one must be shaded
- Shading a cell means its neighbors must stay unshaded
- Check connectivity as you shade - don't isolate white regions

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
