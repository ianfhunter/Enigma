#!/usr/bin/env python3
"""
Test script to generate Suko puzzles and verify they are uniquely solvable.
"""

import random
import itertools
from typing import List, Tuple, Optional

def generate_random_pattern() -> List[int]:
    """Generate a random 3x3 pattern with numbers 1-9."""
    pattern = list(range(1, 10))
    random.shuffle(pattern)
    return pattern

def calculate_sums(pattern: List[int]) -> List[int]:
    """Calculate sums for the four corner regions."""
    sums = []
    # Sums for four corners: top-left, top-right, bottom-left, bottom-right
    for indices in [(0, 1, 3, 4), (1, 2, 4, 5), (3, 4, 6, 7), (4, 5, 7, 8)]:
        sums.append(sum(pattern[i] for i in indices))
    return sums

def generate_colors() -> Tuple[int, int, int]:
    """Generate three color counts that sum to 9, each between 2 and 5."""
    color1 = random.randint(2, 5)
    color2 = random.randint(2, 5)
    color3 = 9 - color1 - color2
    if 2 <= color3 <= 5:
        return color1, color2, color3
    else:
        return generate_colors()

def calculate_color_sums(pattern: List[int], color_pattern: List[int], colors: Tuple[int, int, int]) -> Tuple[int, int, int]:
    """Calculate the sums for green, orange, and yellow zones."""
    sorting_number = ''.join(map(str, color_pattern))
    
    green_sum = sum(pattern[int(digit)-1] for digit in sorting_number[:colors[0]])
    orange_sum = sum(pattern[int(digit)-1] for digit in sorting_number[colors[0]:colors[0]+colors[1]])
    yellow_sum = sum(pattern[int(digit)-1] for digit in sorting_number[colors[0]+colors[1]:9])
    
    return green_sum, orange_sum, yellow_sum

def check_constraints(solution: List[int], sums: List[int], color_pattern: List[int], 
                     colors: Tuple[int, int, int], color_sums: Tuple[int, int, int]) -> bool:
    """Check if a solution satisfies all constraints."""
    # Check corner sums
    corner_indices = [(0, 1, 3, 4), (1, 2, 4, 5), (3, 4, 6, 7), (4, 5, 7, 8)]
    for i, indices in enumerate(corner_indices):
        if sum(solution[j] for j in indices) != sums[i]:
            return False
    
    # Check color sums
    sorting_number = ''.join(map(str, color_pattern))
    green_sum = sum(solution[int(digit)-1] for digit in sorting_number[:colors[0]])
    orange_sum = sum(solution[int(digit)-1] for digit in sorting_number[colors[0]:colors[0]+colors[1]])
    yellow_sum = sum(solution[int(digit)-1] for digit in sorting_number[colors[0]+colors[1]:9])
    
    if green_sum != color_sums[0] or orange_sum != color_sums[1] or yellow_sum != color_sums[2]:
        return False
    
    return True

def solve_puzzle(sums: List[int], color_pattern: List[int], colors: Tuple[int, int, int], 
                color_sums: Tuple[int, int, int]) -> List[List[int]]:
    """Find all solutions to a Suko puzzle."""
    solutions = []
    
    # Try all permutations of 1-9
    for perm in itertools.permutations(range(1, 10)):
        solution = list(perm)
        if check_constraints(solution, sums, color_pattern, colors, color_sums):
            solutions.append(solution)
    
    return solutions

def generate_puzzle() -> dict:
    """Generate a complete Suko puzzle."""
    pattern1 = generate_random_pattern()
    sums = calculate_sums(pattern1)
    colors = generate_colors()
    pattern2 = generate_random_pattern()
    color_sums = calculate_color_sums(pattern1, pattern2, colors)
    
    return {
        'solution': pattern1,
        'sums': sums,
        'color_pattern': pattern2,
        'colors': colors,
        'color_sums': color_sums
    }

def test_uniqueness(num_puzzles: int = 10):
    """Test if generated puzzles are uniquely solvable."""
    unique_count = 0
    non_unique_count = 0
    unsolvable_count = 0
    
    print(f"Testing {num_puzzles} randomly generated Suko puzzles...")
    print("=" * 60)
    
    for i in range(num_puzzles):
        puzzle = generate_puzzle()
        
        solutions = solve_puzzle(
            puzzle['sums'],
            puzzle['color_pattern'],
            puzzle['colors'],
            puzzle['color_sums']
        )
        
        num_solutions = len(solutions)
        
        if num_solutions == 0:
            print(f"Puzzle {i+1}: UNSOLVABLE")
            unsolvable_count += 1
        elif num_solutions == 1:
            # Check if the solution matches the generated one
            if solutions[0] == puzzle['solution']:
                print(f"Puzzle {i+1}: UNIQUE ✓ (matches generated solution)")
            else:
                print(f"Puzzle {i+1}: UNIQUE (different solution: {solutions[0]})")
                print(f"  Generated: {puzzle['solution']}")
            unique_count += 1
        else:
            print(f"Puzzle {i+1}: NON-UNIQUE ({num_solutions} solutions found)")
            print(f"  Generated solution: {puzzle['solution']}")
            print(f"  First solution: {solutions[0]}")
            non_unique_count += 1
        
        # Print puzzle details for debugging
        print(f"  Sums: {puzzle['sums']}")
        print(f"  Colors (G/O/Y): {puzzle['colors']}")
        print(f"  Color sums (G/O/Y): {puzzle['color_sums']}")
        print()
    
    print("=" * 60)
    print(f"Summary:")
    print(f"  Unique: {unique_count}/{num_puzzles} ({100*unique_count/num_puzzles:.1f}%)")
    print(f"  Non-unique: {non_unique_count}/{num_puzzles} ({100*non_unique_count/num_puzzles:.1f}%)")
    print(f"  Unsolvable: {unsolvable_count}/{num_puzzles} ({100*unsolvable_count/num_puzzles:.1f}%)")
    
    return unique_count, non_unique_count, unsolvable_count

if __name__ == '__main__':
    # Test with a handful of puzzles first
    random.seed(42)  # For reproducibility during testing
    unique, non_unique, unsolvable = test_uniqueness(10)
