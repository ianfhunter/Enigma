#!/usr/bin/env python3
"""
Download and process Sudoku-Bench dataset from Hugging Face
"""

import json
import sys
import re
from pathlib import Path

try:
    from datasets import load_dataset
except ImportError:
    print("Installing datasets library...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "datasets"])
    from datasets import load_dataset

def parse_board(board_str, size=9):
    """Parse initial_board string (81 chars for 9x9) into 2D array"""
    grid = []
    for r in range(size):
        row = []
        for c in range(size):
            idx = r * size + c
            char = board_str[idx] if idx < len(board_str) else '.'
            row.append(0 if char == '.' else int(char))
        grid.append(row)
    return grid

def parse_solution(solution_str, size=9):
    """Parse solution string into 2D array"""
    return parse_board(solution_str, size)

def parse_coord(coord_str):
    """Parse 'r1c5' format to [row, col] (0-indexed)"""
    match = re.match(r'r(\d+)c(\d+)', coord_str.lower())
    if match:
        return [int(match.group(1)) - 1, int(match.group(2)) - 1]
    return None

def parse_visual_elements(ve_str):
    """Parse visual_elements string (JSON) to list of objects"""
    if not ve_str:
        return []
    if isinstance(ve_str, list):
        return ve_str
    if isinstance(ve_str, str):
        try:
            return json.loads(ve_str)
        except:
            return []
    return []

def create_puzzle_from_solution(solution_grid, fill_ratio=0.4, seed=None):
    """Create a puzzle by removing cells from solution (if initial_board is empty)"""
    import random
    if seed is not None:
        random.seed(seed)
    size = len(solution_grid)
    puzzle = [row[:] for row in solution_grid]  # Copy solution
    
    # Count how many cells to keep (fill_ratio of cells should be filled)
    total_cells = size * size
    cells_to_keep = int(total_cells * fill_ratio)
    cells_to_remove = total_cells - cells_to_keep
    
    # Get all positions
    positions = [(r, c) for r in range(size) for c in range(size)]
    random.shuffle(positions)
    
    # Remove cells
    for i in range(min(cells_to_remove, len(positions))):
        r, c = positions[i]
        puzzle[r][c] = 0
    
    return puzzle

def convert_arrow_puzzle(puzzle):
    """Convert Sudoku-Bench puzzle to Arrow Sudoku format"""
    size = int(len(puzzle['initial_board']) ** 0.5)
    initial_board = puzzle['initial_board']
    solution_grid = parse_solution(puzzle['solution'], size) if puzzle.get('solution') else None
    
    # Parse initial board - ALWAYS use initial_board values when present
    puzzle_grid = parse_board(initial_board, size)
    
    # Only if initial board is completely empty (all dots), create puzzle from solution
    filled_cells = sum(1 for row in puzzle_grid for cell in row if cell != 0)
    if filled_cells == 0 and solution_grid:
        # Create puzzle with ~40% of cells filled
        # Use puzzle ID as seed for reproducibility
        puzzle_id = puzzle.get('puzzle_id') or puzzle.get('id', '')
        seed = hash(puzzle_id) % (2**31) if puzzle_id else None
        puzzle_grid = create_puzzle_from_solution(solution_grid, fill_ratio=0.4, seed=seed)
    # Otherwise, use initial_board as-is (it already has the starting numbers)
    
    arrows = []
    visual_elements = parse_visual_elements(puzzle.get('visual_elements'))
    if visual_elements:
        for el in visual_elements:
            if el and isinstance(el, dict):
                el_type = el.get('type', '').lower()
                if 'arrow' in el_type or 'circle' in el_type:
                    # Try 'cells' or 'coords' field
                    cells_raw = el.get('cells') or el.get('coords') or []
                    # Convert string coords to [r, c]
                    cells = []
                    for cell in cells_raw:
                        if isinstance(cell, str):
                            parsed = parse_coord(cell)
                            if parsed:
                                cells.append(parsed)
                        elif isinstance(cell, list) and len(cell) == 2:
                            cells.append(cell)
                    if len(cells) >= 2:
                        arrows.append({
                            'circle': cells[0],
                            'path': cells[1:]
                        })
    
    # Don't use fallback - only return if we have a real solution
    if not solution_grid:
        return None
    
    return {
        'id': puzzle.get('puzzle_id') or puzzle.get('id') or f'arrow-{len(arrows)}',
        'puzzle': puzzle_grid,
        'solution': solution_grid,
        'arrows': arrows
    }

def convert_thermo_puzzle(puzzle):
    """Convert Sudoku-Bench puzzle to Thermo Sudoku format"""
    size = int(len(puzzle['initial_board']) ** 0.5)
    initial_board = puzzle['initial_board']
    solution_grid = parse_solution(puzzle['solution'], size) if puzzle.get('solution') else None
    
    # Parse initial board - ALWAYS use initial_board values when present
    puzzle_grid = parse_board(initial_board, size)
    
    # Only if initial board is completely empty (all dots), create puzzle from solution
    filled_cells = sum(1 for row in puzzle_grid for cell in row if cell != 0)
    if filled_cells == 0 and solution_grid:
        # Create puzzle with ~40% of cells filled
        # Use puzzle ID as seed for reproducibility
        puzzle_id = puzzle.get('puzzle_id') or puzzle.get('id', '')
        seed = hash(puzzle_id) % (2**31) if puzzle_id else None
        puzzle_grid = create_puzzle_from_solution(solution_grid, fill_ratio=0.4, seed=seed)
    # Otherwise, use initial_board as-is (it already has the starting numbers)
    
    thermos = []
    visual_elements = parse_visual_elements(puzzle.get('visual_elements'))
    # Thermos are represented as "lines" type in the dataset
    if visual_elements:
        for el in visual_elements:
            if el and isinstance(el, dict):
                el_type = el.get('type', '').lower()
                # Check for thermo type or lines type (when puzzle mentions thermometer)
                if 'thermo' in el_type or el_type == 'lines':
                    # Try 'cells' or 'coords' field
                    cells_raw = el.get('cells') or el.get('coords') or []
                    # Convert string coords to [r, c]
                    cells = []
                    for cell in cells_raw:
                        if isinstance(cell, str):
                            parsed = parse_coord(cell)
                            if parsed:
                                cells.append(parsed)
                        elif isinstance(cell, list) and len(cell) == 2:
                            cells.append(cell)
                    if len(cells) >= 2:
                        thermos.append({'cells': cells})
    
    # Don't use fallback - only return if we have a real solution
    if not solution_grid:
        return None
    
    return {
        'id': puzzle.get('puzzle_id') or puzzle.get('id') or f'thermo-{len(thermos)}',
        'puzzle': puzzle_grid,
        'solution': solution_grid,
        'thermos': thermos
    }

def convert_jigsaw_puzzle(puzzle):
    """Convert Sudoku-Bench puzzle to Jigsaw Sudoku format"""
    size = int(len(puzzle['initial_board']) ** 0.5)
    puzzle_grid = parse_board(puzzle['initial_board'], size)
    solution_grid = parse_solution(puzzle['solution'], size) if puzzle.get('solution') else None
    
    regions = [[-1 for _ in range(size)] for _ in range(size)]
    region_cells = {}
    
    visual_elements = parse_visual_elements(puzzle.get('visual_elements'))
    if visual_elements:
        region_id_counter = 0
        for el in visual_elements:
            if el and isinstance(el, dict):
                el_type = el.get('type', '').lower()
                if 'region' in el_type or 'jigsaw' in el_type or 'irregular' in el_type:
                    region_id = el.get('region_id') or el.get('id') or region_id_counter
                    # Try 'cells' or 'coords' field
                    cells_raw = el.get('cells') or el.get('coords') or []
                    # Convert string coords to [r, c]
                    for cell in cells_raw:
                        if isinstance(cell, str):
                            parsed = parse_coord(cell)
                            if parsed:
                                r, c = parsed
                                if 0 <= r < size and 0 <= c < size:
                                    regions[r][c] = region_id
                                    if region_id not in region_cells:
                                        region_cells[region_id] = []
                                    region_cells[region_id].append([r, c])
                        elif isinstance(cell, list) and len(cell) >= 2:
                            r, c = cell[0], cell[1]
                            if 0 <= r < size and 0 <= c < size:
                                regions[r][c] = region_id
                                if region_id not in region_cells:
                                    region_cells[region_id] = []
                                region_cells[region_id].append([r, c])
                    region_id_counter += 1
    
    return {
        'id': puzzle.get('puzzle_id') or puzzle.get('id') or f'jigsaw-{len(region_cells)}',
        'puzzle': puzzle_grid,
        'solution': solution_grid or puzzle_grid,
        'regions': regions,
        'regionCells': region_cells
    }

def main():
    print("Downloading Sudoku-Bench dataset from Hugging Face...")
    
    try:
        # Load all subsets (they use 'test' split, not 'train')
        print("Loading challenge_100...")
        challenge_ds = load_dataset('SakanaAI/Sudoku-Bench', 'challenge_100', split='test')
        print(f"  Found {len(challenge_ds)} puzzles")
        
        print("Loading ctc...")
        try:
            ctc_ds = load_dataset('SakanaAI/Sudoku-Bench', 'ctc', split='test')
            print(f"  Found {len(ctc_ds)} puzzles")
        except Exception as e:
            print(f"  ctc subset not available: {e}")
            ctc_ds = []
        
        all_puzzles = list(challenge_ds)
        if ctc_ds:
            all_puzzles.extend(list(ctc_ds))
        
        print(f"\nProcessing {len(all_puzzles)} puzzles...")
        
        arrow_puzzles = []
        thermo_puzzles = []
        jigsaw_puzzles = []
        
        for puzzle in all_puzzles:
            if not puzzle.get('initial_board'):
                continue
            
            board_len = len(puzzle['initial_board'])
            if board_len != 81:  # Only 9x9 for now
                continue
            
            # Filter out puzzles with too few starting numbers (need at least 5 for reasonable playability)
            initial_board = puzzle['initial_board']
            filled_cells = len([c for c in initial_board if c != '.'])
            if filled_cells == 0:
                continue  # Skip puzzles without starting numbers
            if filled_cells < 5:
                continue  # Skip puzzles with too few starting numbers (need at least 5)
            
            rules = puzzle.get('rules', '')
            rules_lower = rules.lower() if rules else ''
            visual_elements = parse_visual_elements(puzzle.get('visual_elements'))
            
            # Check for arrow puzzles
            has_arrows = False
            if visual_elements:
                for el in visual_elements:
                    if el and isinstance(el, dict):
                        el_type = str(el.get('type', '')).lower()
                        if 'arrow' in el_type or 'circle' in el_type:
                            # Check if it has actual coordinates
                            cells = el.get('cells') or el.get('coords') or []
                            if cells and len(cells) >= 2:
                                has_arrows = True
                                break
            
            if has_arrows or 'arrow' in rules_lower:
                try:
                    # Only convert if puzzle has a solution
                    if not puzzle.get('solution') or len(puzzle.get('solution', '')) == 0:
                        continue
                    converted = convert_arrow_puzzle(puzzle)
                    # Only add if has actual arrows and a valid solution (not fallback)
                    if converted['arrows'] and converted.get('solution') and converted['solution'] != converted['puzzle']:
                        arrow_puzzles.append(converted)
                except Exception as e:
                    print(f"  Error converting arrow puzzle: {e}")
            
            # Check for thermo puzzles
            # Thermos are represented as "lines" type in visual_elements when rules mention thermometer
            has_thermos = False
            if 'thermo' in rules_lower:
                # If rules mention thermometer, look for line elements
                if visual_elements:
                    for el in visual_elements:
                        if el and isinstance(el, dict):
                            el_type = str(el.get('type', '')).lower()
                            if el_type == 'lines':  # Thermos use "lines" type
                                # Check if it has actual coordinates
                                cells = el.get('cells') or el.get('coords') or []
                                if cells and len(cells) >= 2:
                                    has_thermos = True
                                    break
            
            if has_thermos or ('thermo' in rules_lower and visual_elements):
                try:
                    # Only convert if puzzle has a solution
                    if not puzzle.get('solution') or len(puzzle.get('solution', '')) == 0:
                        continue
                    converted = convert_thermo_puzzle(puzzle)
                    # Only add if has actual thermos and a valid solution (not fallback)
                    # But note: when rules mention thermo, lines are treated as thermos
                    if (converted['thermos'] or ('thermo' in rules_lower and visual_elements)) and converted.get('solution') and converted['solution'] != converted['puzzle']:
                        thermo_puzzles.append(converted)
                except Exception as e:
                    print(f"  Error converting thermo puzzle: {e}")
            
            # Check for jigsaw puzzles
            has_regions = False
            if visual_elements:
                for el in visual_elements:
                    if el and isinstance(el, dict):
                        el_type = str(el.get('type', '')).lower()
                        if 'region' in el_type or 'jigsaw' in el_type or 'irregular' in el_type:
                            has_regions = True
                            break
            
            if has_regions or 'irregular' in rules_lower or 'jigsaw' in rules_lower:
                try:
                    converted = convert_jigsaw_puzzle(puzzle)
                    if converted['regionCells']:  # Only add if has regions
                        jigsaw_puzzles.append(converted)
                except Exception as e:
                    print(f"  Error converting jigsaw puzzle: {e}")
        
        print(f"\nConverted:")
        print(f"  Arrow Sudoku: {len(arrow_puzzles)} puzzles")
        print(f"  Thermo Sudoku: {len(thermo_puzzles)} puzzles")
        print(f"  Jigsaw Sudoku: {len(jigsaw_puzzles)} puzzles")
        
        # Save datasets
        output_dir = Path(__file__).parent.parent / 'public' / 'datasets'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        with open(output_dir / 'arrowSudokuPuzzles.json', 'w') as f:
            json.dump({'puzzles': arrow_puzzles}, f, indent=2)
        
        with open(output_dir / 'jigsawSudokuPuzzles.json', 'w') as f:
            json.dump({'puzzles': jigsaw_puzzles}, f, indent=2)
        
        with open(output_dir / 'thermoSudokuPuzzles.json', 'w') as f:
            json.dump({'puzzles': thermo_puzzles}, f, indent=2)
        
        print(f"\n✓ Datasets saved to {output_dir}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
