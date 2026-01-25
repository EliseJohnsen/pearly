"""
Color palette management service.

This module handles loading, caching, and color matching operations
for Perle bead colors.
"""

from fastapi import HTTPException
from typing import List, Dict, Tuple, Optional
from pathlib import Path
import json
import math

_CURRENT_DIR = Path(__file__).parent.parent
PERLE_COLORS_FILEPATH = _CURRENT_DIR / "data" / "perle-colors.json"
PERLE_COLORS_CACHE: Optional[List[Dict]] = None


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Converts a HEX color string to an RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        raise ValueError(f"Invalid HEX color string: {hex_color}")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_perle_colors() -> List[Dict]:
    """Loads Perle colors from local JSON file (with caching) and adds RGB tuples."""
    global PERLE_COLORS_CACHE
    if PERLE_COLORS_CACHE is not None:
        return PERLE_COLORS_CACHE

    try:
        if not PERLE_COLORS_FILEPATH.exists():
            raise FileNotFoundError(f"Perle colors file not found at {PERLE_COLORS_FILEPATH}")

        with open(PERLE_COLORS_FILEPATH, 'r', encoding='utf-8') as f:
            raw_colors = json.load(f)

        processed_colors = []
        for color in raw_colors:
            if color.get("hex"):
                try:
                    color["rgb"] = hex_to_rgb(color["hex"])
                    processed_colors.append(color)
                except ValueError as e:
                    print(f"Warning: Could not convert hex {color.get('hex')} for color {color.get('name')} to RGB: {e}")
            else:
                print(f"Warning: Color {color.get('name')} is missing a HEX value and will be skipped.")

        PERLE_COLORS_CACHE = processed_colors
        if not PERLE_COLORS_CACHE:
            print(f"Error: Perle colors cache is empty after processing {PERLE_COLORS_FILEPATH}.")
            raise HTTPException(status_code=500, detail="Perle color data is unavailable or empty after processing.")
        print(f"Successfully loaded and processed {len(PERLE_COLORS_CACHE)} Perle colors with RGB values.")
        return PERLE_COLORS_CACHE
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"ERROR: Could not load or process Perle colors: {e}")
        raise HTTPException(status_code=500, detail=f"Could not load or process Perle colors: {e}")


def calculate_color_difference(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    """Calculates the Euclidean distance between two RGB colors."""
    return math.sqrt(sum([(c1 - c2) ** 2 for c1, c2 in zip(rgb1, rgb2)]))


def find_closest_color(pixel_rgb: Tuple[int, int, int], bead_colors: List[Dict]) -> Dict:
    """Finds the closest bead color to a given pixel's RGB value."""
    if not bead_colors:
        raise ValueError("Bead color list is empty, cannot find closest color.")

    min_difference = float('inf')
    closest_color_info = bead_colors[0]

    for bead_color in bead_colors:
        bead_rgb = bead_color.get("rgb")
        if not bead_rgb:
            continue
        difference = calculate_color_difference(pixel_rgb, bead_rgb)
        if difference < min_difference:
            min_difference = difference
            closest_color_info = bead_color
    return closest_color_info
