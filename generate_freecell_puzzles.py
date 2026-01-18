#!/usr/bin/env python3
"""
Generate 10,000 FreeCell puzzles (Python-only implementation).
FreeCell deals: ~99.999% are solvable, so we generate valid deals.
"""

import json
import random
import sys

TARGET_COUNT = 10000
OUTPUT_FILE = "freecell_puzzles.json"

# Standard 52-card deck
SUITS = ['H', 'D', 'C', 'S']  # Hearts, Diamonds, Clubs, Spades
RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']

def create_deck():
    """Create a standard 52-card deck"""
    deck = []
    for suit in SUITS:
        for rank in RANKS:
            deck.append(f"{rank}{suit}")
    return deck

def shuffle_deck(seed):
    """Shuffle deck deterministically using seed"""
    deck = create_deck()
    rng = random.Random(seed)
    rng.shuffle(deck)
    return deck

def deal_freecell(seed):
    """Deal cards into FreeCell layout: 8 columns, dealt row by row"""
    deck = shuffle_deck(seed)
    
    # FreeCell: deal 7 cards to each of first 4 columns, 6 cards to each of last 4
    # Actually standard: 7 cards each to first 4 columns, 6 cards each to last 4 columns
    columns = [[] for _ in range(8)]
    
    # Deal 7 cards to first 4 columns, 6 to last 4 columns
    # Standard FreeCell: alternating columns get 7 or 6 cards
    card_idx = 0
    for row in range(7):  # 7 rows max
        for col in range(8):
            if card_idx < len(deck):
                columns[col].append(deck[card_idx])
                card_idx += 1
    
    return columns

def parse_columns_to_deal(columns):
    """Convert columns to deal format"""
    # Find max length to pad columns
    max_len = max(len(col) for col in columns) if columns else 0
    
    deal_lines = []
    for row in range(max_len):
        line = []
        for col in range(8):
            if row < len(columns[col]):
                line.append(columns[col][row])
            else:
                line.append("")
        # Remove trailing empty spaces but keep structure
        deal_lines.append(" ".join(line))
    
    return "\n".join(deal_lines)

def columns_to_json(columns, seed):
    """Convert columns to JSON puzzle format"""
    # Ensure 8 columns
    while len(columns) < 8:
        columns.append([])
    
    # Trim to 8 columns
    columns = columns[:8]
    
    return {
        "columns": columns,
        "freecells": [],
        "foundations": {
            "hearts": [],
            "diamonds": [],
            "clubs": [],
            "spades": []
        }
    }

def main():
    print(f"Generating {TARGET_COUNT} FreeCell puzzles...")
    print("Using Python-only implementation (no external dependencies)")
    print("Note: ~99.999% of FreeCell deals are solvable, so generated deals are valid")
    print()
    
    puzzles = []
    seed_base = 1000000
    
    # Use a wide seed range to avoid any patterns
    seeds_used = set()
    
    for i in range(TARGET_COUNT):
        # Generate unique seed
        while True:
            seed = random.randint(seed_base, seed_base + 100000000)
            if seed not in seeds_used:
                seeds_used.add(seed)
                break
        
        # Deal cards
        columns = deal_freecell(seed)
        
        # Convert to puzzle format
        puzzle_data = columns_to_json(columns, seed)
        puzzle_data["id"] = i + 1
        puzzle_data["seed"] = seed
        
        puzzles.append(puzzle_data)
        
        if (i + 1) % 100 == 0:
            progress = (i + 1) / TARGET_COUNT * 100
            print(f"Progress: {i + 1}/{TARGET_COUNT} ({progress:.1f}%)", end='\r')
            sys.stdout.flush()
    
    print()  # New line after progress
    
    # Save to JSON
    output = {
        "puzzles": puzzles,
        "count": len(puzzles),
        "source": "Python generator (non-Microsoft, standard shuffle)",
        "format": "FreeCell standard (4 freecells, 8 columns)",
        "note": "~99.999% of FreeCell deals are solvable - generated deals use standard rules"
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✓ Generated {len(puzzles)} FreeCell puzzles")
    print(f"✓ Saved to {OUTPUT_FILE}")
    print(f"✓ File size: {os.path.getsize(OUTPUT_FILE) / (1024*1024):.2f} MB" if os.path.exists(OUTPUT_FILE) else "")
    
    return len(puzzles)

if __name__ == "__main__":
    import os
    main()
