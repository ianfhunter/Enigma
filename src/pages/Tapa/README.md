# ⬛ Tapa

Shade cells based on numbered clues showing lengths of consecutive shaded groups.

## A.K.A.

Also known as: Tapa Puzzle

## Category

Grid Shading

## How to Play

1. Cells with numbers are clues and cannot be shaded
2. Each clue number shows the length of a consecutive shaded group in the 8 surrounding cells
3. Multiple numbers in a clue cell mean multiple separate groups (with gaps between them)
4. All shaded cells must form one orthogonally connected region
5. No 2×2 area can be entirely shaded

## Example

A clue of `3` means there's exactly one group of 3 consecutive shaded cells around it.
A clue of `1 1` means there are two separate groups of 1 shaded cell each, with at least one unshaded cell between them.
A clue of `8` means all 8 surrounding cells are shaded.

## Puzzle Source

**📁 Dataset**

Puzzles are loaded from a pre-generated dataset with unique solutions.

**Source:** `public/datasets/tapaPuzzles.json` - 180 puzzles across easy, medium, and hard difficulties

## Tips & Strategy

- Start with high clues (7, 8) - they leave few options
- A clue of `0` (no numbers) means no surrounding cells are shaded
- Use right-click or Ctrl+click to mark cells as definitely not shaded
- Watch for 2×2 violations - they're easy to create accidentally
- Remember: shaded groups in a clue must have gaps between them

## Issues & Bugs

🔍 [Search existing issues for "Tapa"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+Tapa)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BTapa%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
