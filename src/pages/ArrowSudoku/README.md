# 🎯 Arrow Sudoku

Sudoku with arrow constraints. Digits along arrows must sum to the digit in the circle.

## Category

Sudoku Family

## How to Play

1. Standard Sudoku rules apply
2. Digits along an arrow (from bulb to tip) must sum to the digit in the circle
3. The circle cell is part of both the arrow path and the Sudoku grid
4. Work backwards from arrow sums to place digits

## Puzzle Source

**📊 Sudoku-Bench Dataset**

Puzzles are sourced from the Sudoku-Bench dataset:

- **Source**: [SakanaAI/Sudoku-Bench](https://huggingface.co/datasets/SakanaAI/Sudoku-Bench) on Hugging Face
- **License**: MIT
- **Subsets**: Includes Arrow Sudoku variants from `challenge_100` and `ctc` subsets

**Note**: Currently uses algorithmic generation. Dataset integration coming soon.

## Tips & Strategy

- Start with standard Sudoku elimination
- Identify arrows with small sums (often start with 1s)
- The circle digit is constrained by both row/column/box rules and arrow sum
- Longer arrows provide more constraints

## Issues & Bugs

🔍 [Search existing issues for "ArrowSudoku"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+ArrowSudoku)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BArrowSudoku%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
