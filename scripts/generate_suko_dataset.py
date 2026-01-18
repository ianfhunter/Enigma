#!/usr/bin/env python3
"""
Generate a large dataset of uniquely solvable Suko puzzles.
"""

import json
import random
import itertools
from typing import List, Tuple, Dict
import sys
import os

# Import functions from test script (both in scripts/ directory)
sys.path.insert(0, os.path.dirname(__file__))
from test_suko_uniqueness import (
    generate_random_pattern,
    calculate_sums,
    generate_colors,
    calculate_color_sums,
    check_constraints,
    solve_puzzle,
    generate_puzzle
)

def generate_unique_puzzle(max_attempts: int = 100) -> Tuple[Dict, bool]:
    """
    Generate a puzzle that is uniquely solvable.
    Returns (puzzle_dict, success)
    """
    for _ in range(max_attempts):
        puzzle = generate_puzzle()
        
        solutions = solve_puzzle(
            puzzle['sums'],
            puzzle['color_pattern'],
            puzzle['colors'],
            puzzle['color_sums']
        )
        
        if len(solutions) == 1:
            return puzzle, True
    
    return None, False

def puzzle_to_dict(puzzle: Dict, puzzle_id: int, seed: int = None) -> Dict:
    """Convert puzzle data to a structured dictionary."""
    return {
        'id': puzzle_id,
        'seed': seed,
        'solution': puzzle['solution'],
        'grid': puzzle['solution'],  # 3x3 grid as flat list (row by row)
        'sums': puzzle['sums'],  # [top-left, top-right, bottom-left, bottom-right]
        'color_pattern': puzzle['color_pattern'],  # Position-to-color mapping
        'colors': {
            'green': puzzle['colors'][0],
            'orange': puzzle['colors'][1],
            'yellow': puzzle['colors'][2]
        },
        'color_sums': {
            'green': puzzle['color_sums'][0],
            'orange': puzzle['color_sums'][1],
            'yellow': puzzle['color_sums'][2]
        }
    }

def generate_dataset(num_puzzles: int, output_file: str, seed: int = None):
    """
    Generate a dataset of uniquely solvable Suko puzzles.
    
    Args:
        num_puzzles: Number of unique puzzles to generate
        output_file: Path to output JSON file
        seed: Random seed for reproducibility (optional)
    """
    if seed is not None:
        random.seed(seed)
    
    puzzles = []
    attempts = 0
    max_total_attempts = num_puzzles * 200  # Give up after many attempts
    
    print(f"Generating {num_puzzles} uniquely solvable Suko puzzles...")
    print("This may take a while as we filter for unique solutions...")
    
    puzzle_id = 1
    while len(puzzles) < num_puzzles and attempts < max_total_attempts:
        attempts += 1
        
        puzzle, success = generate_unique_puzzle(max_attempts=50)
        
        if success:
            puzzle_dict = puzzle_to_dict(puzzle, puzzle_id, seed)
            puzzles.append(puzzle_dict)
            puzzle_id += 1
            
            if len(puzzles) % 100 == 0:
                print(f"Generated {len(puzzles)}/{num_puzzles} puzzles...")
    
    if len(puzzles) < num_puzzles:
        print(f"Warning: Only generated {len(puzzles)}/{num_puzzles} unique puzzles after {attempts} attempts")
    
    # Create dataset structure
    dataset = {
        'name': 'Suko',
        'version': '1.0',
        'total': len(puzzles),
        'description': 'Suko puzzle dataset - uniquely solvable puzzles',
        'format': {
            'grid': '3x3 grid as flat list (row by row, 0-indexed)',
            'sums': '[top-left, top-right, bottom-left, bottom-right] corner sums',
            'color_pattern': 'Position-to-color mapping (indices 0-8)',
            'colors': 'Count of positions in each color (green, orange, yellow)',
            'color_sums': 'Sum of values in each color group'
        },
        'puzzles': puzzles
    }
    
    # Save to file
    with open(output_file, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"\nDataset saved to {output_file}")
    print(f"Total puzzles: {len(puzzles)}")
    print(f"Total attempts: {attempts}")
    print(f"Success rate: {len(puzzles)/attempts*100:.2f}%")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate Suko puzzle dataset')
    parser.add_argument('-n', '--num', type=int, default=1000, 
                       help='Number of puzzles to generate (default: 1000)')
    parser.add_argument('-o', '--output', type=str, default='suko_dataset.json',
                       help='Output file path (default: suko_dataset.json)')
    parser.add_argument('-s', '--seed', type=int, default=None,
                       help='Random seed for reproducibility')
    
    args = parser.parse_args()
    
    generate_dataset(args.num, args.output, args.seed)
