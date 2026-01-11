"""
Image processing service - Backwards compatibility layer.

This module re-exports functions from the refactored services for backwards compatibility.
The original 693-line monolithic file has been split into focused modules:

- color_service.py: Color palette management
- image_preprocessor.py: Image enhancement and filtering
- pattern_generator.py: Core pattern conversion logic
- board_calculator.py: Board dimension calculations

For new code, prefer importing directly from the specific service modules.
This file maintains compatibility with existing code that imports from image_processing.
"""

from fastapi import APIRouter

# Re-export from color_service
from .color_service import (
    hex_to_rgb,
    get_perle_colors,
    calculate_color_difference,
    find_closest_color,
)

# Re-export from image_preprocessor
from .image_preprocessor import (
    remove_background,
    apply_bilateral_filter,
    apply_mean_shift_filter,
    enhanced_preprocess_image,
    basic_preprocess_image as preprocess_image,
)

# Re-export from board_calculator
from .board_calculator import (
    BOARD_SIZE,
    calculate_dimensions_maintaining_aspect_ratio,
    suggest_board_dimensions,
    suggest_board_dimensions_from_file,
)

# Re-export from pattern_generator
from .pattern_generator import (
    create_perle_palette_image,
    quantize_to_perle_colors,
    filter_rare_colors,
    create_pattern_image,
    convert_image_to_pattern,
    convert_image_to_pattern_from_file,
)

# Backwards compatibility alias
find_closest_hama_color = find_closest_color

# API Router (kept for backwards compatibility, but should be moved to api/patterns.py)
router = APIRouter(prefix="/api/v1/image-processing", tags=["Image Processing"])
