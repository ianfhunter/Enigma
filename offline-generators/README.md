# Offline Puzzle Generators

This folder contains standalone Node.js scripts for generating puzzle datasets offline.

These generators produce JSON datasets that get saved to `public/datasets/` for use by the frontend puzzles.

## Why Offline?

Some puzzles require computationally expensive generation or uniqueness verification. Running these offline means:
- No impact on runtime performance
- Can verify unique solvability
- Can filter for puzzle quality
- Generate once, use forever

## Usage

```bash
# Generate Tapa puzzles
node offline-generators/generate-tapa.js [count] [startSeed]

# Example: Generate 100 puzzles starting from seed 1
node offline-generators/generate-tapa.js 100 1
```

## Available Generators

| Generator | Output | Estimated Rate |
|-----------|--------|----------------|
| `generate-tapa.js` | `tapaPuzzles.json` | ~200-500/hour (10×10) |

## Adding New Generators

1. Create `generate-{puzzle}.js` in this folder
2. Include a solver to verify unique solvability
3. Output to `public/datasets/{puzzle}Puzzles.json`
4. Follow the JSON schema pattern from existing datasets
