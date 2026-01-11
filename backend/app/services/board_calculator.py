"""
Board dimension calculation service.

This module handles calculations for board sizes and dimensions
for bead patterns.
"""

from PIL import Image
from typing import Tuple, Dict


BOARD_SIZE = 29  # Standard pegboard size (29x29 beads)


def calculate_dimensions_maintaining_aspect_ratio(
    original_width: int,
    original_height: int,
    max_width: int,
    max_height: int
) -> Tuple[int, int]:
    """
    Calculate new dimensions that maintain aspect ratio.
    The longest side of the original image will be scaled to match its corresponding maximum.

    Args:
        original_width: Original image width
        original_height: Original image height
        max_width: Maximum allowed width
        max_height: Maximum allowed height

    Returns:
        Tuple of (new_width, new_height) maintaining aspect ratio
    """
    aspect_ratio = original_width / original_height

    if original_width >= original_height:
        new_width = max_width
        new_height = int(max_width / aspect_ratio)
    else:
        new_height = max_height
        new_width = int(max_height * aspect_ratio)

    return new_width, new_height


def suggest_board_dimensions(image: Image.Image) -> Dict:
    """
    Analyzes image and suggests three size options: small, medium, and large.
    Small: max 58x58 beads (2x2 boards)
    Medium: max 116x116 beads (4x4 boards)
    Large: max 174x174 beads (6x6 boards)
    Each size maintains the aspect ratio of the original image.
    """
    aspect_ratio = image.width / image.height

    sizes = {
        "small": {"max_boards": 2},
        "medium": {"max_boards": 4},
        "large": {"max_boards": 6}
    }

    size_options = {}
    for size_name, size_config in sizes.items():
        max_boards = size_config["max_boards"]

        if image.width >= image.height:
            boards_width = max_boards
            boards_height = max(1, round(max_boards / aspect_ratio))
        else:
            boards_height = max_boards
            boards_width = max(1, round(max_boards * aspect_ratio))

        actual_beads_width = boards_width * BOARD_SIZE
        actual_beads_height = boards_height * BOARD_SIZE

        size_options[size_name] = {
            "boards_width": boards_width,
            "boards_height": boards_height,
            "total_beads": actual_beads_width * actual_beads_height,
            "beads_width": actual_beads_width,
            "beads_height": actual_beads_height
        }

    total_pixels = image.width * image.height
    megapixels = total_pixels / 1_000_000

    if megapixels < 0.5:
        suggested_size = "small"
    elif megapixels < 2:
        suggested_size = "medium"
    else:
        suggested_size = "large"

    return {
        "sizes": size_options,
        "suggested_size": suggested_size,
        "aspect_ratio": aspect_ratio,
        "image_dimensions": {"width": image.width, "height": image.height}
    }


def suggest_board_dimensions_from_file(image_path: str) -> Dict:
    """
    Wrapper function that accepts a file path instead of an Image object.
    For compatibility with patterns.py API.
    """
    img = Image.open(image_path)
    return suggest_board_dimensions(img)
