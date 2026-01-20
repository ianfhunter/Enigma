# 📦 Mochikoro

Divide the grid into white rectangular regions, each containing exactly one number showing its area.

## A.K.A.

Also known as: Rectangle Division

## Category

Grid Shading

## How to Play

1. Click cells to shade them black (borders between rectangles)
2. White cells must form rectangular regions
3. Each rectangle must contain exactly one number
4. The number shows the area (cell count) of that rectangle
5. No 2×2 area can be entirely black

## Example

A cell with `6` means it belongs to a 6-cell rectangle (e.g., 2×3 or 1×6).
A cell with `1` means it's a single-cell rectangle completely surrounded by black.

## Puzzle Source

**📁 Dataset**

Puzzles are loaded from a pre-generated dataset with verified unique solutions.

**Source:** `public/datasets/mochikoroPuzzles.json` - 6000 puzzles (1000 per difficulty × 2 sizes: 5×5 and 7×7)

## Tips & Strategy

- Start by identifying small rectangles (1s and 2s have limited options)
- Large numbers near edges often span the full edge
- Two clues can never be in the same rectangle
- Work outward from confirmed rectangles
- Watch for 2×2 black violations at corners

## Issues & Bugs

🔍 [Search existing issues for "Mochikoro"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+Mochikoro)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BMochikoro%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
