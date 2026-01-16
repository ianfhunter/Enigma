# 🔺 Pyramid Cards

Remove pairs of cards that sum to 13 to clear the pyramid. Kings can be removed alone!

## A.K.A.

Also known as: Pyramid Solitaire, Solitaire 13

## Category

Card Games

## How to Play

1. Cards are arranged in a 7-row pyramid (28 cards) with a draw pile (24 cards)
2. Only **exposed** cards can be selected (not covered by cards below)
3. Remove cards by:
   - Pairing two cards that sum to **13** (A=1, J=11, Q=12, K=13)
   - Removing **Kings (13)** alone
4. Click the draw pile to reveal cards for pairing
5. **Win** by clearing all 28 pyramid cards

### Valid Pairs (sum to 13)
- A + Q (1+12)
- 2 + J (2+11)
- 3 + 10
- 4 + 9
- 5 + 8
- 6 + 7
- K alone (13)

## Puzzle Source

**📊 Dataset**

All 500 puzzles are pre-verified solvable using a DFS solver with memoization.

**Generator:** `scripts/generate-pyramid-dataset.cjs`

## Tips & Strategy

- Always remove Kings when exposed - they free up the pyramid
- Look for chains: removing one pair may expose cards that form another pair
- Don't rush through the draw pile - exposed pyramid pairs are often better
- Plan ahead: sometimes it's better to wait for the right card from the draw pile

## Controls

- **Click** a card to select it
- **Click** another card to attempt a pair
- **Click** draw pile to reveal next card
- **Undo** to reverse your last move
- **Give Up** to see that the puzzle was solvable

## Issues & Bugs

🔍 [Search existing issues for "PyramidCards"](https://github.com/ianfhunter/Enigma/issues?q=is%3Aissue+PyramidCards)

📝 [Report a new bug](https://github.com/ianfhunter/Enigma/issues/new?labels=bug&title=%5BPyramidCards%5D+)

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
