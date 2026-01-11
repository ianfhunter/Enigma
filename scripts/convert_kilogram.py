#!/usr/bin/env python3
"""
Convert KiloGram tangram dataset to our game format.
Extracts SVG silhouettes and puzzle names from the dataset.
Uses fixed scale factor to match our canonical tangram piece sizes.
"""

import json
import os
import re
from pathlib import Path
from collections import Counter
import math

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
KILOGRAM_DIR = PROJECT_ROOT / "kilogram_dataset" / "dataset"
SVG_DIR = KILOGRAM_DIR / "tangrams-svg"
OUTPUT_FILE = PROJECT_ROOT / "src" / "data" / "kilogramPuzzles.js"

# KiloGram uses 144x144 coordinate system for standard square
# Our tangram square has side = sqrt(20000) ≈ 141.42
# Fixed scale factor to convert KiloGram coords to our coords
KILOGRAM_SIZE = 144.0
OUR_SIZE = 141.42  # sqrt(20000)
FIXED_SCALE = OUR_SIZE / KILOGRAM_SIZE  # ≈ 0.982

# Position offset to match classic puzzle positioning
OFFSET_X = 50
OFFSET_Y = 10


def parse_polygon_points(points_str):
    """Parse polygon points string into list of (x, y) tuples."""
    points = []
    for pair in points_str.strip().split():
        if ',' in pair:
            x, y = pair.split(',')
            points.append((float(x), float(y)))
    return points


def extract_and_scale_silhouette(svg_path):
    """
    Extract silhouette from SVG, apply fixed scale to match our piece sizes.
    """
    with open(svg_path, 'r') as f:
        content = f.read()

    # Extract all polygon points
    polygon_pattern = r'points="([^"]+)"'
    polygon_matches = re.findall(polygon_pattern, content)

    if not polygon_matches:
        return None

    # Parse all polygons
    polygons = []
    for points_str in polygon_matches:
        points = parse_polygon_points(points_str)
        if len(points) >= 3:
            polygons.append(points)

    if not polygons:
        return None

    # Build path with fixed scale and offset
    paths = []
    for points in polygons:
        # Transform points: apply fixed scale, then add offset
        transformed = []
        for x, y in points:
            new_x = x * FIXED_SCALE + OFFSET_X
            new_y = y * FIXED_SCALE + OFFSET_Y
            transformed.append((round(new_x, 1), round(new_y, 1)))

        # Convert to SVG path
        path = f"M {transformed[0][0]} {transformed[0][1]}"
        for x, y in transformed[1:]:
            path += f" L {x} {y}"
        path += " Z"
        paths.append(path)

    return " ".join(paths)


def get_puzzle_name(annotations):
    """
    Get the most common name for a puzzle from its annotations.
    """
    names = []
    for ann in annotations:
        if 'whole' in ann and 'wholeAnnotation' in ann['whole']:
            name = ann['whole']['wholeAnnotation'].strip()
            if name and name.upper() != 'UNKNOWN':
                names.append(name.lower())

    if not names:
        return None

    # Get most common name
    counter = Counter(names)
    most_common = counter.most_common(1)[0][0]

    # Title case and clean up
    name = most_common.title()
    # Remove leading articles for cleaner display
    for prefix in ['A ', 'An ', 'The ']:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break

    return name


def estimate_difficulty(svg_path):
    """
    Estimate puzzle difficulty based on the shape complexity.
    More unique point positions = harder.
    """
    with open(svg_path, 'r') as f:
        content = f.read()

    # Count unique point positions
    polygon_pattern = r'points="([^"]+)"'
    polygons = re.findall(polygon_pattern, content)

    all_points = set()
    for points_str in polygons:
        for pair in points_str.strip().split():
            if ',' in pair:
                # Round to avoid floating point variations
                x, y = pair.split(',')
                all_points.add((round(float(x), 1), round(float(y), 1)))

    # Simple heuristic: more unique points = more complex shape
    num_points = len(all_points)
    if num_points <= 12:
        return "Easy"
    elif num_points <= 18:
        return "Medium"
    else:
        return "Hard"


def main():
    print("Converting KiloGram dataset...")
    print(f"Scale factor: {FIXED_SCALE:.4f} (KiloGram {KILOGRAM_SIZE} -> Our {OUR_SIZE})")

    # Load annotations
    with open(KILOGRAM_DIR / "full.json", 'r') as f:
        annotations_data = json.load(f)

    puzzles = []
    skipped = 0

    # Process each SVG file
    svg_files = sorted(SVG_DIR.glob("*.svg"))
    print(f"Found {len(svg_files)} SVG files")

    for svg_path in svg_files:
        svg_name = svg_path.stem  # e.g., "page1-0"

        # Get annotations for this tangram
        tangram_data = annotations_data.get(svg_name, {})

        # Extract and scale silhouette
        silhouette = extract_and_scale_silhouette(svg_path)
        if not silhouette:
            skipped += 1
            continue

        # Get name from annotations
        name = None
        if 'annotations' in tangram_data:
            name = get_puzzle_name(tangram_data['annotations'])

        if not name:
            # Use a generic name based on file
            name = f"Shape {svg_name.replace('page', '').replace('-', '.')}"

        # Estimate difficulty
        difficulty = estimate_difficulty(svg_path)

        puzzles.append({
            'id': f'kg-{svg_name}',
            'name': name,
            'difficulty': difficulty,
            'silhouette': silhouette,
            'source': 'KiloGram',
        })

    print(f"Converted {len(puzzles)} puzzles (skipped {skipped})")

    # Sample a diverse set by difficulty
    easy = [p for p in puzzles if p['difficulty'] == 'Easy']
    medium = [p for p in puzzles if p['difficulty'] == 'Medium']
    hard = [p for p in puzzles if p['difficulty'] == 'Hard']

    print(f"  Easy: {len(easy)}, Medium: {len(medium)}, Hard: {len(hard)}")

    # Take up to 40 from each category
    selected = easy[:40] + medium[:40] + hard[:40]
    print(f"Selected {len(selected)} puzzles for export")

    # Generate JavaScript output
    js_content = '''// Auto-generated from KiloGram dataset
// https://github.com/lil-lab/kilogram
// Licensed for educational and research use
// Scale: KiloGram 144 units = Our 141.42 units (sqrt(20000))

export const KILOGRAM_PUZZLES = [
'''

    for puzzle in selected:
        # Escape the silhouette string
        silhouette_escaped = puzzle['silhouette'].replace('\\', '\\\\').replace("'", "\\'")
        js_content += f'''  {{
    id: '{puzzle['id']}',
    name: '{puzzle['name'].replace("'", "\\'")}',
    difficulty: '{puzzle['difficulty']}',
    silhouette: '{silhouette_escaped}',
    source: 'KiloGram',
  }},
'''

    js_content += '];\n'

    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        f.write(js_content)

    print(f"Written to {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
