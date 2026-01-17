# 🧩 Jigsaw Sudoku

Sudoku with irregular regions instead of standard 3×3 boxes. Each colored region must contain digits 1-9.

## Category

Sudoku Family

## How to Play

1. Standard Sudoku rules apply (each row and column must contain 1-9)
2. Each irregular region (shown in colored cells) must contain digits 1-9
3. Regions replace the standard 3×3 boxes of regular Sudoku
4. Use region constraints along with row/column constraints to solve

## Puzzle Source

**📊 Sudoku-Bench Dataset**

Puzzles are sourced from the Sudoku-Bench dataset:

- **Source**: [SakanaAI/Sudoku-Bench](https://huggingface.co/datasets/SakanaAI/Sudoku-Bench) on Hugging Face
- **License**: MIT
- **Subsets**: Includes irregular region Sudoku variants from `challenge_100` and `ctc` subsets

**Note**: Currently uses algorithmic generation with predefined region patterns. Dataset integration coming soon.

## Tips & Strategy

- Use standard Sudoku techniques first
- Pay attention to region shapes - they can span multiple rows/columns
- Regions often have unique shapes that create interesting constraints
- When digits are placed, check both row/column AND region constraints

## Issues & Bugs

🔍 [Search existing issues for "JigsawSudoku"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+JigsawSudoku)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BJigsawSudoku%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
