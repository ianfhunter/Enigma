# 🧵 Crazy Quilt

A solitaire variant with a quilt tableau, stock/waste flow, and suit foundations.

## Layout
- **Quilt Tableau:** 5 rows × 8 columns, with alternating horizontal/vertical cards (checkerboard-style orientation).
- **Stock:** Draw pile used to feed the waste.
- **Waste:** Top waste card can be played to foundations.
- **Foundations:** Four suit foundations build from Ace up to King.

## Rules
1. Click **Stock** to draw one card to the waste.
2. Click a tableau card or the waste top card to try moving it to its matching foundation.
3. A foundation starts with an **Ace** and builds upward by suit (A → K).
4. If stock is empty, clicking stock recycles waste back into stock.
5. Win by moving all 52 cards to foundations.
6. **Give Up** reveals the solved foundations.

## Puzzle Properties
- Seeded and deterministic generation
- Reproducible by seed value
- Includes a Give Up option

