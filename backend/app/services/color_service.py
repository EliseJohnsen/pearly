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

# Bidirectional lookup maps for O(1) code/hex conversions
CODE_TO_COLOR_MAP: Optional[Dict[str, Dict]] = None  # "01" -> {name, hex, code, rgb}
HEX_TO_COLOR_MAP: Optional[Dict[str, Dict]] = None   # "#FDFCF5" -> {name, hex, code, rgb}


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Converts a HEX color string to an RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        raise ValueError(f"Invalid HEX color string: {hex_color}")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def build_color_lookup_maps(colors: List[Dict]) -> Tuple[Dict[str, Dict], Dict[str, Dict]]:
    """
    Build bidirectional lookup maps from color list for O(1) conversions.

    Args:
        colors: List of color dictionaries with name, code, hex, rgb fields

    Returns:
        Tuple of (code_to_color_map, hex_to_color_map)
    """
    code_map = {}
    hex_map = {}

    for color in colors:
        code = color.get("code")
        hex_color = color.get("hex")

        if code:
            code_map[code] = color

        if hex_color:
            # Store both with and without # prefix for flexibility
            hex_normalized = hex_color.upper()
            hex_map[hex_normalized] = color
            if not hex_normalized.startswith("#"):
                hex_map[f"#{hex_normalized}"] = color
            else:
                hex_map[hex_normalized.lstrip("#")] = color

    return code_map, hex_map


def code_to_hex(code: str) -> Optional[str]:
    """
    Convert color code to hex (e.g., "01" -> "#FDFCF5").

    Args:
        code: Color code string (e.g., "01", "116")

    Returns:
        Hex color string or None if code not found
    """
    global CODE_TO_COLOR_MAP
    if CODE_TO_COLOR_MAP is None:
        get_perle_colors()  # Initialize maps

    color = CODE_TO_COLOR_MAP.get(code) if CODE_TO_COLOR_MAP else None
    return color.get("hex") if color else None


def hex_to_code(hex_color: str) -> Optional[str]:
    """
    Convert hex to color code (e.g., "#FDFCF5" -> "01").

    Args:
        hex_color: Hex color string (with or without # prefix)

    Returns:
        Color code string or None if hex not found
    """
    global HEX_TO_COLOR_MAP
    if HEX_TO_COLOR_MAP is None:
        get_perle_colors()  # Initialize maps

    # Normalize hex for lookup
    hex_normalized = hex_color.strip().upper()
    color = HEX_TO_COLOR_MAP.get(hex_normalized) if HEX_TO_COLOR_MAP else None
    return color.get("code") if color else None


def get_color_by_code(code: str) -> Optional[Dict]:
    """
    Get full color info by code.

    Args:
        code: Color code string (e.g., "01", "116")

    Returns:
        Color dictionary with name, hex, code, rgb or None if not found
    """
    global CODE_TO_COLOR_MAP
    if CODE_TO_COLOR_MAP is None:
        get_perle_colors()  # Initialize maps

    return CODE_TO_COLOR_MAP.get(code) if CODE_TO_COLOR_MAP else None


def clear_color_cache() -> None:
    """
    Clear the color cache to force reload from file.
    Useful when perle-colors.json has been updated.
    """
    global PERLE_COLORS_CACHE, CODE_TO_COLOR_MAP, HEX_TO_COLOR_MAP
    PERLE_COLORS_CACHE = None
    CODE_TO_COLOR_MAP = None
    HEX_TO_COLOR_MAP = None
    print("Color cache cleared - will reload from perle-colors.json on next request")


def get_perle_colors(force_reload: bool = False) -> List[Dict]:
    """
    Loads Perle colors from local JSON file (with caching) and adds RGB tuples.

    Args:
        force_reload: If True, bypass cache and reload from file
    """
    global PERLE_COLORS_CACHE, CODE_TO_COLOR_MAP, HEX_TO_COLOR_MAP
    if PERLE_COLORS_CACHE is not None and not force_reload:
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

        # Build bidirectional lookup maps
        CODE_TO_COLOR_MAP, HEX_TO_COLOR_MAP = build_color_lookup_maps(PERLE_COLORS_CACHE)
        print(f"Successfully loaded and processed {len(PERLE_COLORS_CACHE)} Perle colors with RGB values.")
        print(f"Built lookup maps: {len(CODE_TO_COLOR_MAP)} codes, {len(HEX_TO_COLOR_MAP)} hex values.")

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
