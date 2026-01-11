#!/usr/bin/env python3
"""
Extract individual sprites from a spritesheet.

Usage:
    python extract_from_spritesheet.py --spritesheet input.png --output_folder ./sprites --spriteX 16 --spriteY 16

Options:
    --spritesheet   Path to the spritesheet image
    --output_folder Folder to save extracted sprites
    --spriteX       Width of each sprite in pixels (default: 16)
    --spriteY       Height of each sprite in pixels (default: 16)
    --padding       Padding between sprites in pixels (default: 0)
    --margin        Margin around the spritesheet edges (default: 0)
    --skip_empty    Skip sprites that are completely transparent/empty (default: True)
    --prefix        Prefix for output filenames (default: "sprite")
    --format        Output format: png, gif, bmp (default: png)
"""

import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


def is_empty_sprite(img, tolerance=5, min_unique_colors=2, min_non_bg_pixels=0.01):
    """
    Check if sprite is empty/background.

    Detects:
    - Completely transparent sprites
    - Single solid color sprites
    - Sprites with only background color (corners used to detect background)
    - Sprites with too few non-background pixels

    Args:
        img: PIL Image
        tolerance: Color difference tolerance for background detection
        min_unique_colors: Minimum unique colors needed to be "not empty"
        min_non_bg_pixels: Minimum fraction of pixels that must differ from background
    """
    # Convert to RGBA for consistent handling
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    pixels = list(img.getdata())
    width, height = img.size
    total_pixels = width * height

    # Check if completely transparent
    alpha_values = [p[3] for p in pixels]
    if max(alpha_values) == 0:
        return True

    # Get unique colors (ignoring fully transparent pixels)
    visible_pixels = [p[:3] for p in pixels if p[3] > 0]
    if not visible_pixels:
        return True

    unique_colors = set(visible_pixels)

    # Single color = empty
    if len(unique_colors) < min_unique_colors:
        return True

    # Detect background color from corners (most spritesheets have BG in corners)
    corners = [
        pixels[0],                          # top-left
        pixels[width - 1],                  # top-right
        pixels[(height - 1) * width],       # bottom-left
        pixels[height * width - 1],         # bottom-right
    ]

    # Find most common corner color as likely background
    corner_colors = {}
    for c in corners:
        # Ignore transparent corners
        if c[3] < 128:
            continue
        key = c[:3]
        corner_colors[key] = corner_colors.get(key, 0) + 1

    if corner_colors:
        bg_color = max(corner_colors, key=corner_colors.get)

        # Count pixels that are NOT the background color (within tolerance)
        non_bg_count = 0
        for p in pixels:
            if p[3] < 128:  # Skip transparent
                continue
            # Check if color differs from background
            diff = sum(abs(p[i] - bg_color[i]) for i in range(3))
            if diff > tolerance * 3:
                non_bg_count += 1

        # If too few non-background pixels, consider empty
        if non_bg_count / total_pixels < min_non_bg_pixels:
            return True

    return False


def extract_sprites(spritesheet_path, output_folder, sprite_width, sprite_height,
                   padding=0, margin=0, skip_empty=True, prefix="sprite", fmt="png",
                   bg_tolerance=5, min_content_percent=1.0):
    """Extract individual sprites from a spritesheet."""

    # Load the spritesheet
    try:
        sheet = Image.open(spritesheet_path)
    except Exception as e:
        print(f"Error loading spritesheet: {e}")
        sys.exit(1)

    print(f"Loaded spritesheet: {spritesheet_path}")
    print(f"  Size: {sheet.width}x{sheet.height}")
    print(f"  Mode: {sheet.mode}")
    print(f"  Sprite size: {sprite_width}x{sprite_height}")

    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    # Calculate number of sprites in each dimension
    usable_width = sheet.width - (2 * margin)
    usable_height = sheet.height - (2 * margin)

    cols = (usable_width + padding) // (sprite_width + padding)
    rows = (usable_height + padding) // (sprite_height + padding)

    print(f"  Grid: {cols} columns x {rows} rows = {cols * rows} potential sprites")

    extracted = 0
    skipped = 0

    for row in range(rows):
        for col in range(cols):
            # Calculate position of this sprite
            x = margin + col * (sprite_width + padding)
            y = margin + row * (sprite_height + padding)

            # Extract the sprite
            box = (x, y, x + sprite_width, y + sprite_height)
            sprite = sheet.crop(box)

            # Skip empty sprites if requested
            if skip_empty and is_empty_sprite(sprite, tolerance=bg_tolerance,
                                               min_non_bg_pixels=min_content_percent/100.0):
                skipped += 1
                continue

            # Generate output filename
            sprite_num = row * cols + col
            filename = f"{prefix}_{sprite_num:04d}.{fmt}"
            output_path = os.path.join(output_folder, filename)

            # Save the sprite
            sprite.save(output_path)
            extracted += 1

    print(f"\nExtracted {extracted} sprites to {output_folder}")
    if skipped > 0:
        print(f"Skipped {skipped} empty sprites")

    return extracted


def main():
    parser = argparse.ArgumentParser(
        description="Extract individual sprites from a spritesheet",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic extraction of 16x16 sprites
    python extract_from_spritesheet.py --spritesheet tileset.png --output_folder ./tiles --spriteX 16 --spriteY 16

    # Extract 32x32 sprites with 1px padding between them
    python extract_from_spritesheet.py --spritesheet chars.png --output_folder ./chars --spriteX 32 --spriteY 32 --padding 1

    # Keep all sprites including empty ones
    python extract_from_spritesheet.py --spritesheet sheet.png --output_folder ./out --spriteX 16 --spriteY 16 --no-skip-empty
        """
    )

    parser.add_argument("--spritesheet", "-s", required=True,
                        help="Path to the spritesheet image")
    parser.add_argument("--output_folder", "-o", required=True,
                        help="Folder to save extracted sprites")
    parser.add_argument("--spriteX", "-x", type=int, default=16,
                        help="Width of each sprite in pixels (default: 16)")
    parser.add_argument("--spriteY", "-y", type=int, default=16,
                        help="Height of each sprite in pixels (default: 16)")
    parser.add_argument("--padding", "-p", type=int, default=0,
                        help="Padding between sprites in pixels (default: 0)")
    parser.add_argument("--margin", "-m", type=int, default=0,
                        help="Margin around spritesheet edges (default: 0)")
    parser.add_argument("--skip-empty", dest="skip_empty", action="store_true", default=True,
                        help="Skip empty/transparent sprites (default)")
    parser.add_argument("--no-skip-empty", dest="skip_empty", action="store_false",
                        help="Keep all sprites including empty ones")
    parser.add_argument("--prefix", default="sprite",
                        help="Prefix for output filenames (default: sprite)")
    parser.add_argument("--format", "-f", choices=["png", "gif", "bmp"], default="png",
                        help="Output image format (default: png)")
    parser.add_argument("--bg-tolerance", type=int, default=5,
                        help="Color tolerance for background detection (default: 5)")
    parser.add_argument("--min-content", type=float, default=1.0,
                        help="Minimum %% of non-background pixels to keep sprite (default: 1.0)")

    args = parser.parse_args()

    extract_sprites(
        spritesheet_path=args.spritesheet,
        output_folder=args.output_folder,
        sprite_width=args.spriteX,
        sprite_height=args.spriteY,
        padding=args.padding,
        margin=args.margin,
        skip_empty=args.skip_empty,
        prefix=args.prefix,
        fmt=args.format,
        bg_tolerance=args.bg_tolerance,
        min_content_percent=args.min_content
    )


if __name__ == "__main__":
    main()
