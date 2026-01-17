# 🌡️ Thermo Sudoku

Sudoku with thermometer constraints. Digits along thermometers must strictly increase from bulb to tip.

## Category

Sudoku Family

## How to Play

1. Standard Sudoku rules apply
2. Digits along a thermometer (from bulb to tip) must strictly increase
3. The bulb is the starting cell (smallest digit), the tip is the ending cell (largest digit)
4. Each digit must be greater than the previous digit in the thermometer chain

## Puzzle Source

**📊 Sudoku-Bench Dataset**

Puzzles are sourced from the Sudoku-Bench dataset:

- **Source**: [SakanaAI/Sudoku-Bench](https://huggingface.co/datasets/SakanaAI/Sudoku-Bench) on Hugging Face
- **License**: MIT
- **Subsets**: Includes Thermo Sudoku variants from `challenge_100` and `ctc` subsets

**Note**: Currently uses algorithmic generation. Dataset integration coming soon.

## Tips & Strategy

- Start with standard Sudoku elimination
- Thermometer bulbs often contain lower digits (1-3)
- Thermometer tips often contain higher digits (7-9)
- Use thermometer constraints to narrow down possibilities
- Longer thermometers provide more constraints

## Issues & Bugs

🔍 [Search existing issues for "ThermoSudoku"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+ThermoSudoku)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BThermoSudoku%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
